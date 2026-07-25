/**
 * The single shape every import pathway produces.
 *
 * All three pathways — register-photo OCR, forwarded WhatsApp text, CSV upload —
 * converge on this before anything is staged for review. The review UI, the
 * duplicate detection and the commit step therefore have exactly one input
 * format to handle, and adding a fourth pathway later means writing one parser,
 * not touching the pipeline.
 *
 * EVERY FIELD IS NULLABLE, INCLUDING NAME AND PHONE. Extraction reports what it
 * actually found; it does not guess and it does not refuse to return a row just
 * because a field is missing. Deciding whether an incomplete row is usable is
 * the owner's call at review time, and a row with a name but an illegible phone
 * number is still valuable — the owner can read the register and fill it in.
 */
export interface ExtractedRow {
  name: string | null;
  mobileNumber: string | null;
  parentName: string | null;
  sportOrBatch: string | null;
  feeAmount: number | null;
}

export function emptyRow(): ExtractedRow {
  return {
    name: null,
    mobileNumber: null,
    parentName: null,
    sportOrBatch: null,
    feeAmount: null,
  };
}

/** Trims and collapses whitespace, returning null for anything empty. */
export function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') {
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return null;
  }
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Parses a fee amount from text like "2500", "₹2,500", "Rs. 2500/-".
 * Returns null rather than 0 for anything unparseable — 0 is a real fee value
 * (a scholarship student) and must not be confused with "not found".
 */
export function cleanFeeAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  if (typeof value !== 'string') return null;

  const stripped = value.replace(/[₹,\s]/g, '').replace(/(?:rs\.?|inr)/gi, '').replace(/\/-$/, '');
  if (!stripped) return null;

  const parsed = Number(stripped);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
