import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import { recordOfflinePayment, OfflinePaymentError } from '@/lib/payments/offline';
import { MoneyError } from '@/lib/payments/money';

/**
 * Records an OFF-PLATFORM payment (cash, direct bank transfer, UPI paid straight
 * to the academy) against a student's ledger. No money moves through Razorpay —
 * this is bookkeeping for money the academy already has.
 *
 * BUG THIS FIXES: the previous implementation ran adminMiddleware and then
 * resolved the student as `auth.user._id`. An owner recording a cash payment for
 * a student therefore credited their OWN profile — the student stayed marked
 * unpaid, and the owner's record was quietly corrupted.
 *
 * Body: { studentUserId, amount, period?, transactionId?, note? }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const { studentUserId, amount, period, transactionId, note } = await req.json();

    const result = await recordOfflinePayment({
      studentUserId,
      amount,
      period,
      transactionId,
      note,
      actor: { _id: auth.user._id, role: auth.user.role, academyId: auth.academyId },
    });

    return NextResponse.json({
      success: true,
      message: 'Offline payment recorded',
      data: result,
    });
  } catch (error: any) {
    if (error instanceof OfflinePaymentError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    if (error instanceof MoneyError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error('[payments/pay]', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to record payment' },
      { status: 500 }
    );
  }
}
