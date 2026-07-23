import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import { FeePayment } from '@/lib/models/FeePayment';
import { StudentProfile } from '@/lib/models/Student';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, message: 'Missing required signatures' }, { status: 400 });
    }

    const payment = await FeePayment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      payment.status = 'success';
      payment.paymentId = razorpay_payment_id;
      payment.signature = razorpay_signature;
      await payment.save();

      // Update Student Profile

      await StudentProfile.findOneAndUpdate(
        { userId: auth.user._id },
        {
          $inc: { totalFeesPaid: payment.amount, outstandingFees: -payment.amount },
          $push: {
            feePayments: {
              amount: payment.amount,
              paymentDate: new Date(),
              period: "monthly",
              status: "paid",
              transactionId: razorpay_payment_id
            }
          }
        }
      );

      return NextResponse.json({ success: true, message: 'Payment verified successfully' });
    } else {
      payment.status = 'failed';
      await payment.save();
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to verify payment' }, { status: 500 });
  }
}
