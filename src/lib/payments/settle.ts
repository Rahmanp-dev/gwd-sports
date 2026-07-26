import mongoose from 'mongoose';
import { FeePayment, type IFeePayment } from '@/lib/models/FeePayment';
import StudentProfile from '@/lib/models/Student';
import User from '@/lib/models/User';
import { Academy } from '@/lib/models/Academy';
import { paiseToRupees, formatInr } from './money';
import { emitEvent } from '@/lib/events/emit';
import { issueReceiptNumber } from './issueReceipt';

/**
 * Everything the parent-facing payment confirmation needs, gathered here so the
 * messaging consumer stays decoupled from the payments module.
 *
 * Entirely best-effort. A settled payment is correct whether or not we can look
 * up a phone number, so every failure path returns partial data and lets the
 * consumer skip rather than throwing and rolling back money that has moved.
 */
async function loadReceiptContext(payment: IFeePayment): Promise<Record<string, unknown>> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwd.in';

    const [profile, student, academy] = await Promise.all([
      payment.studentId
        ? StudentProfile.findOne({ userId: payment.studentId })
            .select('passportId parentName parentPhone')
            .lean()
        : null,
      payment.studentId ? User.findById(payment.studentId).select('name phone').lean() : null,
      payment.academyId ? Academy.findById(payment.academyId).select('name').lean() : null,
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
      amountFormatted: formatInr(totalPaise),
      receiptUrl: `${appUrl}/receipt/${String(payment._id)}`,
    };
  } catch (err: any) {
    console.error('[settle] receipt context lookup failed:', err?.message || err);
    return {};
  }
}

export type SettlementSource = 'client_verify' | 'webhook' | 'manual_admin';

export interface SettleResult {
  outcome: 'settled' | 'already_settled' | 'not_found';
  feePayment?: IFeePayment;
}

/**
 * Credits a successful payment to the student's ledger, exactly once.
 *
 * WHY THIS EXISTS: settlement is attempted from two independent directions —
 * the browser calling /verify-payment after checkout, and Razorpay's
 * payment.captured webhook. Either can arrive first, both can arrive, and the
 * browser one can never arrive at all (the parent closes the tab). Before this,
 * only the browser path existed, so a closed tab meant the money was taken and
 * the student stayed marked as a defaulter forever.
 *
 * The idempotency guard is an atomic compare-and-set on `settledAt`. Whichever
 * caller wins the claim does the crediting; the loser returns
 * 'already_settled' and mutates nothing. Replays are therefore free.
 *
 * The student credited is ALWAYS `feePayment.studentId` — the student the order
 * was created for. It is never derived from the authenticated caller, because
 * the caller of /verify-payment is not necessarily the student being paid for
 * (a parent pays for two children from one login) and, worse, an order/payment/
 * signature triple is visible to the payer, so trusting the caller's identity
 * let credit be redirected onto the wrong profile.
 */
export async function settlePayment(params: {
  orderId?: string;
  paymentId: string;
  /** Razorpay's payment entity, when we have it (webhook, or an explicit fetch). */
  paymentEntity?: {
    fee?: number;
    tax?: number;
    amount?: number;
    method?: string;
  };
  source: SettlementSource;
}): Promise<SettleResult> {
  const { orderId, paymentId, paymentEntity, source } = params;

  const lookup = orderId ? { orderId } : { paymentId };
  const existing = await FeePayment.findOne(lookup);
  if (!existing) {
    return { outcome: 'not_found' };
  }

  // Razorpay reports its actual fee in paise on the payment entity. `fee`
  // already includes `tax`, so do not add them together.
  const gatewayFeeActualPaise =
    typeof paymentEntity?.fee === 'number' ? paymentEntity.fee : undefined;

  // Atomic claim. The `settledAt: null` filter is the lock — only one caller
  // can transition the document out of the unsettled state.
  const claimed = await FeePayment.findOneAndUpdate(
    { _id: existing._id, $or: [{ settledAt: null }, { settledAt: { $exists: false } }] },
    {
      $set: {
        status: 'success',
        paymentId,
        settledAt: new Date(),
        ...(gatewayFeeActualPaise !== undefined ? { gatewayFeeActualPaise } : {}),
      },
    },
    { new: true }
  );

  if (!claimed) {
    // Someone else already settled this. Still worth recording the actual fee
    // if this caller is the one who happens to have it.
    if (gatewayFeeActualPaise !== undefined) {
      await FeePayment.updateOne(
        { _id: existing._id, gatewayFeeActualPaise: { $exists: false } },
        { $set: { gatewayFeeActualPaise } }
      );
    }
    return { outcome: 'already_settled', feePayment: existing };
  }

  try {
    await creditStudentLedger(claimed);
  } catch (err) {
    // Release the claim so a webhook retry or the reconciliation sweep can
    // pick it up again. Without this, a transient failure here would leave the
    // payment permanently marked settled but never credited.
    // A query for `settledAt: null` matches both null and missing, so setting
    // null is enough to make the document claimable again.
    await FeePayment.updateOne(
      { _id: claimed._id },
      { $set: { settledAt: null, status: 'pending' } }
    ).catch(() => undefined);
    throw err;
  }

  /**
   * Allocate the parent-facing receipt number, now that the money is credited
   * and this attempt cannot be retried. Failure here must not fail the
   * settlement: the parent has paid and their ledger is correct, and the
   * receipt route allocates lazily on first view if this did not land.
   */
  let receiptNumber: string | null = null;
  try {
    receiptNumber = await issueReceiptNumber(String(claimed._id));
  } catch (err: any) {
    console.error('[settle] receipt numbering failed:', err?.message || err);
  }

  /**
   * Enrich the event with what the parent-facing confirmation needs.
   *
   * The messaging consumer cannot look any of this up itself — it is
   * deliberately decoupled from the payments module — so the event has to carry
   * it. Without `parentPhone`, `passportId` and `receiptUrl` the WhatsApp
   * receipt silently records as `skipped`, which looks identical to "messaging
   * is off" and is very hard to notice.
   *
   * Best-effort: a failed lookup must never roll back a settled payment. The
   * consumer skips cleanly on missing fields.
   */
  const context = await loadReceiptContext(claimed);

  await emitEvent({
    name: 'payment.settled',
    academyId: claimed.academyId ?? null,
    payload: {
      feePaymentId: String(claimed._id),
      studentUserId: claimed.studentId ? String(claimed.studentId) : null,
      orderId: claimed.orderId,
      paymentId,
      parentTotalPaise: claimed.parentTotalPaise ?? null,
      academyAmountPaise: claimed.academyAmountPaise ?? null,
      gwdNetPaise: claimed.gwdNetPaise ?? null,
      period: claimed.period ?? null,
      source,
      receiptNumber: receiptNumber ?? claimed.receiptNumber ?? null,
      ...context,
    },
  });

  return { outcome: 'settled', feePayment: claimed };
}

/**
 * Applies the payment to the student's running balance.
 *
 * Only the base (academy) portion touches the student's fee ledger — the
 * convenience fee is not academy revenue and must not count toward
 * totalFeesPaid or reduce the outstanding balance by more than the fee owed.
 */
async function creditStudentLedger(payment: IFeePayment): Promise<void> {
  if (!payment.studentId) return;

  const academyPortionRupees =
    payment.academyAmountPaise !== undefined
      ? paiseToRupees(payment.academyAmountPaise)
      : payment.baseAmount;

  const profile = await StudentProfile.findOne({ userId: payment.studentId });
  if (!profile) return;

  profile.totalFeesPaid = (profile.totalFeesPaid || 0) + academyPortionRupees;

  // Clamp at zero. The previous implementation used a raw $inc with a negative
  // value, which drove balances negative — and a negative balance silently
  // dropped the student out of the `outstandingFees > 0` defaulters report.
  profile.outstandingFees = Math.max(0, (profile.outstandingFees || 0) - academyPortionRupees);

  profile.feePayments.push({
    amount: academyPortionRupees,
    paymentDate: new Date(),
    // Fall back to monthly only when the order genuinely carried no period.
    period: normalizePeriod(payment.period),
    status: 'paid',
    transactionId: payment.paymentId,
  } as any);

  await profile.save();
}

function normalizePeriod(period?: string): 'monthly' | 'quarterly' | 'yearly' {
  if (period === 'quarterly' || period === 'yearly') return period;
  return 'monthly';
}

/**
 * Marks a payment failed, without touching the student's ledger.
 * Safe to call repeatedly; will never downgrade an already-settled payment.
 */
export async function markPaymentFailed(
  lookup: { orderId?: string; paymentId?: string },
  reason?: string
): Promise<void> {
  const filter = lookup.orderId ? { orderId: lookup.orderId } : { paymentId: lookup.paymentId };
  if (!filter.orderId && !filter.paymentId) return;

  await FeePayment.updateOne(
    { ...filter, settledAt: null },
    {
      $set: {
        status: 'failed',
        ...(reason ? { description: reason } : {}),
      },
    }
  );
}

export function isValidObjectId(id: unknown): boolean {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}
