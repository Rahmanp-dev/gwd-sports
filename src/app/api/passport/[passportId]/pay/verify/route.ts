import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { FeePayment } from '@/lib/models/FeePayment';
import { settlePayment, markPaymentFailed } from '@/lib/payments/settle';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * CONFIRMING A PAYMENT MADE FROM THE PUBLIC PASSPORT LINK
 * ════════════════════════════════════════════════════════════════════════════
 *
 * THE BUG THIS FIXES. `/pay/<passportId>` deliberately made no confirmation
 * call, on the reasoning that the `payment.captured` webhook is authoritative
 * and a parent who loses signal mid-checkout should still be recorded as paid.
 * That reasoning is right and the webhook remains the source of truth — but it
 * left the page with NO settlement path whenever the webhook cannot arrive:
 * local development, any environment where the webhook is not configured, and
 * the window before Razorpay delivers it.
 *
 * The observed result was a completed payment that stayed `pending` forever: no
 * receipt number, no invoice, and an admin dashboard showing the parent as
 * unpaid after they had paid.
 *
 * WHY THIS NEEDS NO LOGIN. The Razorpay signature IS the authentication. It is
 * an HMAC over `order_id|payment_id` keyed with a secret only Razorpay and this
 * server hold, so a valid triple cannot be forged by the caller. That is a
 * stronger proof than a session cookie, which only says who is asking.
 *
 * WHY IT CANNOT MISDIRECT MONEY. `settlePayment()` credits
 * `payment.studentId` — read from the order that was created server-side — and
 * never anything supplied by the caller. The passport in the URL is checked
 * against that order purely so a mismatched link reports honestly.
 *
 * Both this and the webhook funnel through the same idempotent
 * `settlePayment()`, so whichever arrives second is a no-op.
 * ════════════════════════════════════════════════════════════════════════════
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    await connectToDatabase();
    const { passportId: raw } = await params;
    const passportId = String(raw ?? '').toUpperCase().trim();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req
      .json()
      .catch(() => ({}));

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

    // Signature check FIRST, before any state change.
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
        'passport-link signature verification failed'
      );
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
    }

    /**
     * No passport-vs-order cross-check here, deliberately. The order carries no
     * passport id (its `receipt` is a timestamp and a user-id fragment), so any
     * comparison would be guesswork — and it would protect nothing, because
     * settlePayment credits `payment.studentId` from the server-created order
     * and ignores everything the caller says. The signature above is the
     * security boundary; the passport in the URL is routing.
     */
    const result = await settlePayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      source: 'client_verify',
    });

    if (result.outcome === 'not_found') {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const settled = result.feePayment ?? (await FeePayment.findOne({ orderId: razorpay_order_id }));

    return NextResponse.json({
      success: true,
      data: {
        // True for both 'settled' and 'already_settled' — from the parent's
        // point of view a webhook having got there first is still success.
        paid: true,
        feePaymentId: settled ? String((settled as any)._id) : null,
        receiptNumber: (settled as any)?.receiptNumber ?? null,
      },
    });
  } catch (error: any) {
    console.error('[passport/pay/verify]', {
      name: error?.name,
      message: error?.message,
    });
    return NextResponse.json(
      {
        success: false,
        message:
          'Your payment went through, but we could not confirm it here. It will be reconciled ' +
          'automatically — please do not pay again.',
      },
      { status: 500 }
    );
  }
}
