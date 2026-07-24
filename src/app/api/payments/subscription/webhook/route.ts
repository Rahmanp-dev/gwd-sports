import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Subscription } from '@/lib/models/Subscription';
import { FeePayment } from '@/lib/models/FeePayment';
import User from '@/lib/models/User';
import crypto from 'crypto';

/**
 * Razorpay Subscription Webhook Handler
 *
 * Supported events:
 *  - subscription.charged     → create FeePayment record and send receipt email
 *  - subscription.activated   → update status to 'active'
 *  - subscription.halted      → update status to 'halted'
 *  - subscription.cancelled   → update status to 'cancelled'
 *
 * Always returns HTTP 200 to acknowledge receipt to Razorpay.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

  // Read raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.warn('Razorpay webhook: invalid signature');
    // Still return 200 to prevent Razorpay retry storms; log internally
    return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 200 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON payload' }, { status: 200 });
  }

  const event: string = payload?.event || '';
  const subscriptionEntity = payload?.payload?.subscription?.entity;
  const paymentEntity = payload?.payload?.payment?.entity;

  try {
    await connectToDatabase();

    switch (event) {
      case 'subscription.charged': {
        if (!subscriptionEntity || !paymentEntity) break;

        const rzpSubId: string = subscriptionEntity.id;
        const sub = await Subscription.findOne({ razorpaySubscriptionId: rzpSubId });
        if (!sub) {
          console.warn(`Webhook: subscription not found for ${rzpSubId}`);
          break;
        }

        // Update subscription billing window
        sub.status = 'active';
        if (subscriptionEntity.current_start) {
          sub.currentStart = new Date(subscriptionEntity.current_start * 1000);
        }
        if (subscriptionEntity.current_end) {
          sub.currentEnd = new Date(subscriptionEntity.current_end * 1000);
        }
        if (subscriptionEntity.charge_at) {
          sub.nextBillingAt = new Date(subscriptionEntity.charge_at * 1000);
        }
        await sub.save();

        // Record fee payment — use rzp payment id as orderId for idempotency
        const paymentId: string = paymentEntity.id;
        const amountPaid: number = paymentEntity.amount / 100; // paise → INR

        const existingPayment = await FeePayment.findOne({ orderId: paymentId });
        if (!existingPayment) {
          const period = `${sub.currentStart?.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} – ${sub.currentEnd?.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;

          await FeePayment.create({
            orderId: paymentId,
            paymentId,
            amount: amountPaid,
            baseAmount: amountPaid,
            platformFee: 0,
            gatewayFee: 0,
            currency: paymentEntity.currency || 'INR',
            status: 'success',
            studentId: sub.studentId,
            academyId: sub.academyId,
            description: `Subscription charge – ${sub.planType}`,
            period,
          });
        }

        // Send receipt email (best-effort)
        try {
          const student = await User.findById(sub.studentId).select('email name');
          if (student?.email) {
            const { sendPaymentReceiptEmail } = await import('@/lib/email');
            await sendPaymentReceiptEmail({
              to: student.email,
              name: student.name || 'Student',
              academyName: 'GWD Sports',
              amount: amountPaid,
              period: `${sub.planType} (${sub.currentStart?.toLocaleDateString()} - ${sub.currentEnd?.toLocaleDateString()})`,
              orderId: paymentId,
              date: new Date().toLocaleDateString('en-IN'),
            });
          }
        } catch (emailErr) {
          console.warn('Receipt email failed (non-fatal):', emailErr);
        }

        break;
      }

      case 'subscription.activated': {
        if (!subscriptionEntity) break;
        await Subscription.findOneAndUpdate(
          { razorpaySubscriptionId: subscriptionEntity.id },
          { status: 'active' }
        );
        break;
      }

      case 'subscription.halted': {
        if (!subscriptionEntity) break;
        await Subscription.findOneAndUpdate(
          { razorpaySubscriptionId: subscriptionEntity.id },
          { status: 'halted' }
        );
        break;
      }

      case 'subscription.cancelled': {
        if (!subscriptionEntity) break;
        await Subscription.findOneAndUpdate(
          { razorpaySubscriptionId: subscriptionEntity.id },
          { status: 'cancelled' }
        );
        break;
      }

      default:
        // Unhandled event — acknowledge silently
        break;
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    // Return 200 regardless to prevent Razorpay from retrying
  }

  return NextResponse.json({ success: true });
}
