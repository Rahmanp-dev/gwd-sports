import mongoose from 'mongoose';
import StudentProfile from '@/lib/models/Student';
import { Academy } from '@/lib/models/Academy';
import { rupeesToPaise, MoneyError } from './money';

export type FeePeriod = 'monthly' | 'quarterly' | 'halfYearly' | 'yearly';

export interface AmountDue {
  baseAmountPaise: number;
  period: FeePeriod;
  /** Where the figure came from — surfaced on the payment page and in support. */
  source: 'outstanding_balance' | 'student_fee' | 'academy_fee_schedule';
}

export class NoFeeConfiguredError extends Error {}

/**
 * Determines what a student actually owes, on the server, from stored data.
 *
 * WHY THIS EXISTS: /api/payments/create-order previously took `baseAmount`
 * straight from the request body. Anyone could open devtools and pay ₹1 for a
 * ₹3,000 month, and the academy would be shown as paid. The amount charged must
 * never be an input.
 *
 * Resolution order, most specific first:
 *   1. An actual outstanding balance on the student's ledger.
 *   2. The fee recorded for that individual student (set at import or by the
 *      owner) — academies routinely charge different students differently.
 *   3. The academy's published fee schedule for the period.
 *
 * If none of these yield a number, this throws. It does NOT invent one. The
 * previous /payments/outstanding route defaulted to a hardcoded ₹500 and wrote
 * it to the database on a GET request, fabricating debts that nobody owed.
 */
export async function resolveAmountDue(params: {
  studentUserId: mongoose.Types.ObjectId | string;
  academyId?: mongoose.Types.ObjectId | string | null;
  period?: FeePeriod;
}): Promise<AmountDue> {
  const period = params.period ?? 'monthly';

  const profile = await StudentProfile.findOne({ userId: params.studentUserId });
  if (!profile) {
    throw new NoFeeConfiguredError('Student profile not found');
  }

  // 1. A real accrued balance wins — it may span several unpaid cycles.
  if (typeof profile.outstandingFees === 'number' && profile.outstandingFees > 0) {
    return {
      baseAmountPaise: rupeesToPaise(profile.outstandingFees),
      period,
      source: 'outstanding_balance',
    };
  }

  // 2. Per-student fee, if the owner set one.
  const studentFee = profile.feeAmount;
  if (typeof studentFee === 'number' && studentFee > 0) {
    return {
      baseAmountPaise: rupeesToPaise(studentFee),
      period: profile.feePeriod ?? period,
      source: 'student_fee',
    };
  }

  // 3. The academy's published schedule.
  const academyId = params.academyId ?? profile.academyId;
  if (academyId) {
    const academy = await Academy.findById(academyId).select('fees');
    const scheduled = academy?.fees?.[period];
    if (typeof scheduled === 'number' && scheduled > 0) {
      return {
        baseAmountPaise: rupeesToPaise(scheduled),
        period,
        source: 'academy_fee_schedule',
      };
    }
  }

  throw new NoFeeConfiguredError(
    `No fee is configured for this student (period: ${period}). Set a fee on the ` +
      `student record or in the academy's fee schedule before collecting payment.`
  );
}

/**
 * Validates an amount an admin explicitly typed in (ad-hoc charges, kit fees,
 * partial settlements). Still server-validated for sanity — an admin typo of
 * ₹300000 instead of ₹3000 should not silently become a charge.
 */
export function validateAdminSuppliedAmount(rupees: unknown): number {
  const value = Number(rupees);
  if (!Number.isFinite(value) || value <= 0) {
    throw new MoneyError('Amount must be a positive number');
  }
  if (value > 500_000) {
    throw new MoneyError(
      `Amount ₹${value} exceeds the ₹5,00,000 single-transaction ceiling. ` +
        `If this is intentional, it needs to be raised deliberately in dues.ts.`
    );
  }
  return rupeesToPaise(value);
}
