import { FeePayment } from '@/lib/models/FeePayment';
import { Academy } from '@/lib/models/Academy';
import { nextInSequence } from '@/lib/models/Counter';
import {
  financialYearOf,
  issuerCode,
  formatReceiptNumber,
  receiptSeriesKey,
} from './receiptNumber';

/**
 * Allocates a receipt number to a settled payment.
 *
 * TIMING IS THE WHOLE DESIGN. Called after the ledger credit succeeds, never
 * before — the settlement path releases its claim and retries if crediting
 * fails, and a number allocated on the failed attempt would be burned, leaving
 * a gap in a series that has to be gapless.
 *
 * IDEMPOTENT. Returns the existing number if one is already assigned, so a
 * retry, a webhook replay, or a lazy allocation from the receipt page cannot
 * consume a second number for the same payment.
 *
 * LAZY ALLOCATION IS SUPPORTED ON PURPOSE. If this fails after settlement — a
 * transient database problem — the payment is still credited and the parent is
 * still paid up; they simply have no number yet. The receipt route calls this
 * again on first view and the gap closes itself. The alternative, failing the
 * settlement, would mean taking money and marking the student a defaulter over
 * a document-numbering error.
 */
export async function issueReceiptNumber(feePaymentId: string): Promise<string | null> {
  const payment = await FeePayment.findById(feePaymentId).select(
    'receiptNumber academyId settledAt status'
  );
  if (!payment) return null;
  if (payment.receiptNumber) return payment.receiptNumber;

  // Only settled payments get a number. A pending or failed order is not a
  // receipt, and numbering one would leave a hole when it never completes.
  if (!payment.settledAt || payment.status !== 'success') return null;

  const academy = payment.academyId
    ? await Academy.findById(payment.academyId).select('slug').lean()
    : null;

  const issuedAt = payment.settledAt ?? new Date();
  const financialYear = financialYearOf(issuedAt);
  const issuer = issuerCode((academy as any)?.slug);

  const sequence = await nextInSequence(receiptSeriesKey(issuer, financialYear));
  const receiptNumber = formatReceiptNumber({ issuerCode: issuer, financialYear, sequence });

  // Conditional write: if another caller allocated in the meantime, this is a
  // no-op and we return theirs rather than overwriting. The allocated sequence
  // is then unused — the one case where a gap is acceptable, because the
  // alternative is two payments claiming the same number.
  const updated = await FeePayment.findOneAndUpdate(
    { _id: payment._id, receiptNumber: { $in: [null, undefined] } },
    { $set: { receiptNumber, receiptIssuedAt: issuedAt } },
    { new: true }
  );

  if (updated?.receiptNumber) return updated.receiptNumber;

  const current = await FeePayment.findById(payment._id).select('receiptNumber');
  return current?.receiptNumber ?? null;
}
