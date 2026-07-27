import type { IFeePayment } from '@/lib/models/FeePayment';
import StudentProfile from '@/lib/models/Student';
import User from '@/lib/models/User';
import { Academy } from '@/lib/models/Academy';
import { formatInr } from './money';

/**
 * Everything the parent-facing payment confirmation AND the academy owner's
 * payment alert need, gathered in one place so every `payment.settled` emit
 * site (client-verify settlement, the Razorpay subscription webhook, and
 * offline/cash entry) produces the same shape instead of three drifting
 * copies. The subscription webhook and offline-entry paths originally emitted
 * a bare payload with no `passportId`/`parentPhone`/`receiptUrl` at all —
 * `handlePaymentSettled` in the messaging consumer requires `passportId` to
 * do anything, so those two payment methods silently never sent a receipt or
 * cancelled a fee reminder. This is the fix, shared.
 *
 * Entirely best-effort. A settled payment is correct whether or not we can
 * look up a phone number, so every failure path returns partial data and
 * lets the consumer skip rather than throwing and rolling back money that
 * has already moved.
 */
export async function loadReceiptContext(payment: IFeePayment): Promise<Record<string, unknown>> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwd.in';

    const [profile, student, academy] = await Promise.all([
      payment.studentId
        ? StudentProfile.findOne({ userId: payment.studentId })
            .select('passportId parentName parentPhone')
            .lean()
        : null,
      payment.studentId ? User.findById(payment.studentId).select('name phone').lean() : null,
      payment.academyId ? Academy.findById(payment.academyId).select('name contactInfo').lean() : null,
    ]);

    const totalPaise =
      payment.parentTotalPaise ?? Math.round((payment.amount ?? 0) * 100);

    return {
      passportId: (profile as any)?.passportId ?? null,
      // Parent's number first; the student's own is the fallback, because for
      // older players the account phone IS the contact number.
      parentPhone: (profile as any)?.parentPhone ?? (student as any)?.phone ?? null,
      parentName: (profile as any)?.parentName ?? null,
      studentName: (student as any)?.name ?? null,
      academyName: (academy as any)?.name ?? null,
      // The owner's own WhatsApp number, so the payment-received alert can be
      // sent without a second database round trip.
      academyOwnerPhone: (academy as any)?.contactInfo?.phone ?? null,
      amountFormatted: formatInr(totalPaise),
      receiptUrl: `${appUrl}/receipt/${String(payment._id)}`,
    };
  } catch (err: any) {
    console.error('[receiptContext] lookup failed:', err?.message || err);
    return {};
  }
}
