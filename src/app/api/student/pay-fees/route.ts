import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import { recordOfflinePayment, OfflinePaymentError } from '@/lib/payments/offline';
import { MoneyError } from '@/lib/payments/money';

/**
 * DEPRECATED — use POST /api/payments/pay.
 *
 * Kept because existing admin UI calls this path. It now delegates to the same
 * shared implementation, which means it also gained the two things it was
 * missing: a tenant-boundary check (an academy admin could previously record a
 * payment against a student at any other academy) and a FeePayment record (it
 * only mutated the embedded array, so these payments were invisible to every
 * financial report and to reconciliation).
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
      message: 'Fee payment recorded successfully',
      data: result,
    });
  } catch (error: any) {
    if (error instanceof OfflinePaymentError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    if (error instanceof MoneyError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error('[student/pay-fees]', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
