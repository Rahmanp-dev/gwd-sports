import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import { FeePayment } from '@/lib/models/FeePayment';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { settlePayment, markPaymentFailed } from '@/lib/payments/settle';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * Client-side payment confirmation, called by the browser after the Razorpay
 * checkout modal succeeds.
 *
 * IMPORTANT: this is now a CONVENIENCE path, not the source of truth. The
 * authoritative settlement is the payment.captured webhook
 * (/api/payments/webhook). This endpoint exists only so the parent sees "paid"
 * immediately instead of waiting on webhook delivery. If it is never called —
 * the parent closes the tab, loses signal, the request fails — the webhook still
 * settles the payment. Previously this was the ONLY settlement path, so a closed
 * tab meant money taken and the student left marked as a defaulter forever.
 *
 * Both paths funnel through settlePayment(), which is idempotent, so whichever
 * arrives second is a no-op.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing order id, payment id or signature' },
        { status: 400 }
      );
    }

    const payment = await FeePayment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Signature check first — before any state change.
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const provided = Buffer.from(String(razorpay_signature), 'utf8');
    const expected = Buffer.from(expectedSign, 'utf8');
    const signatureValid =
      provided.length === expected.length && crypto.timingSafeEqual(provided, expected);

    if (!signatureValid) {
      await markPaymentFailed(
        { orderId: razorpay_order_id },
        'client signature verification failed'
      );
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
    }

    /**
     * Authorisation check. A valid order/payment/signature triple is visible to
     * whoever completed the checkout, so a valid signature proves the payment
     * happened — it does NOT prove the caller is entitled to this record. Without
     * this check any authenticated user could post someone else's triple.
     *
     * Note this only gates the API response. It cannot misdirect the credit,
     * because settlePayment() always credits payment.studentId regardless of who
     * called. The previous implementation credited the CALLER's profile, so a
     * payment could land on the wrong student's ledger entirely.
     */
    const isAdmin = ['admin', 'gwd_super_admin'].includes(auth.user.role);
    const isOwnPayment = String(payment.studentId) === String(auth.user._id);
    const sameAcademy =
      auth.academyId && payment.academyId
        ? String(payment.academyId) === String(auth.academyId)
        : false;

    if (!isOwnPayment && !(isAdmin && (sameAcademy || auth.user.role === 'gwd_super_admin'))) {
      return NextResponse.json(
        { success: false, message: 'This payment does not belong to you' },
        { status: 403 }
      );
    }

    // Best-effort: pull Razorpay's actual fee so reconciliation has the real
    // number rather than our order-time estimate.
    let paymentEntity: any;
    try {
      paymentEntity = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (err) {
      console.warn('[verify-payment] could not fetch payment entity:', err);
    }

    // Route transfer id, when Route is in play. Absent is normal and expected
    // while Route activation is still pending.
    try {
      const transfers = await (razorpay.payments as any).fetchTransfer(razorpay_payment_id);
      if (transfers?.items?.length) {
        await FeePayment.updateOne(
          { _id: payment._id },
          { $set: { transferId: transfers.items[0].id, transferStatus: 'processed' } }
        );
      }
    } catch {
      // No transfers configured for this payment — expected when Route is off.
    }

    const result = await settlePayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      paymentEntity,
      source: 'client_verify',
    });

    return NextResponse.json({
      success: true,
      message:
        result.outcome === 'already_settled'
          ? 'Payment already recorded'
          : 'Payment verified successfully',
      data: { outcome: result.outcome },
    });
  } catch (error: any) {
    console.error('[verify-payment]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
