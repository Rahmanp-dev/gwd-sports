import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import { resolveAmountDue, NoFeeConfiguredError } from '@/lib/payments/dues';
import {
  computeFeeSplit,
  configuredSplitConfig,
  percentToBps,
  paiseToRupees,
  formatInr,
} from '@/lib/payments/money';
import { Academy } from '@/lib/models/Academy';

/**
 * Reports what a student currently owes. READ ONLY.
 *
 * BUG THIS FIXES: the previous implementation wrote to the database on a GET —
 * it set `outstandingFees = 500` from a hardcoded constant whenever it decided a
 * fee was due, inventing a debt that bore no relation to the academy's actual
 * fees. Two consequences: every student with no configured fee acquired a
 * fictitious ₹500 balance, and merely viewing a page mutated financial state.
 *
 * The amount now comes from resolveAmountDue(), which reads real configuration
 * and raises a clear error when no fee has been set rather than guessing.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const profile = await StudentProfile.findOne({ userId: auth.user._id });
    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Student profile not found' },
        { status: 404 }
      );
    }

    const lastPayment =
      profile.feePayments.length > 0
        ? [...profile.feePayments].sort(
            (a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
          )[0]
        : null;

    const nextDueDate = computeNextDueDate(profile.feeDueDayOfMonth ?? 5, lastPayment?.paymentDate);
    const isDue = nextDueDate.getTime() <= Date.now() || (profile.outstandingFees || 0) > 0;

    // What it would cost to pay right now, including the disclosed convenience
    // fee — so the payment page never has to guess or recompute it client-side.
    let quote: {
      academyFee: number;
      convenienceFee: number;
      total: number;
      totalFormatted: string;
    } | null = null;
    let feeConfigured = true;
    let feeConfigMessage: string | null = null;

    try {
      const due = await resolveAmountDue({
        studentUserId: auth.user._id,
        academyId: profile.academyId,
        period: profile.feePeriod ?? 'monthly',
      });
      const academy = profile.academyId
        ? await Academy.findById(profile.academyId).select('platformFeePercent')
        : null;
      const split = computeFeeSplit(
        due.baseAmountPaise,
        configuredSplitConfig(
          typeof academy?.platformFeePercent === 'number'
            ? percentToBps(academy.platformFeePercent)
            : undefined
        )
      );
      quote = {
        academyFee: paiseToRupees(split.academyAmountPaise),
        convenienceFee: paiseToRupees(split.convenienceFeePaise),
        total: paiseToRupees(split.parentTotalPaise),
        totalFormatted: formatInr(split.parentTotalPaise),
      };
    } catch (err) {
      if (err instanceof NoFeeConfiguredError) {
        feeConfigured = false;
        feeConfigMessage = err.message;
      } else {
        throw err;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        outstandingFees: profile.outstandingFees || 0,
        totalFeesPaid: profile.totalFeesPaid || 0,
        isDue,
        nextDueDate,
        lastPayment,
        quote,
        feeConfigured,
        feeConfigMessage,
      },
    });
  } catch (error: any) {
    console.error('[payments/outstanding]', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

/**
 * The next due date is the configured day-of-month, in the month following the
 * last payment (or this month if nothing has been paid yet). Day-of-month is
 * capped at 28 in the schema so this never lands on a date that doesn't exist.
 */
function computeNextDueDate(dueDay: number, lastPaymentDate?: Date | string): Date {
  const now = new Date();
  if (!lastPaymentDate) {
    return new Date(now.getFullYear(), now.getMonth(), dueDay);
  }
  const last = new Date(lastPaymentDate);
  return new Date(last.getFullYear(), last.getMonth() + 1, dueDay);
}
