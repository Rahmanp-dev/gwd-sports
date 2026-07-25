/**
 * Indian mobile number normalisation.
 *
 * WHY THIS MATTERS MORE THAN IT LOOKS: the phone number is the identity key for
 * three separate things — duplicate detection during bulk import, the parent's
 * Passport lookup, and Phase 3's QR check-in ("show me my children in this
 * batch"). Owners type the same number six different ways in a paper register:
 * "9876543210", "+91 98765 43210", "091-9876543210", "0 9876543210". If those
 * do not collapse to one canonical string, a parent scans the QR at the academy
 * gate and is told their child does not exist.
 *
 * Canonical form is E.164: +919876543210.
 */

export interface NormalizedPhone {
  /** E.164, e.g. "+919876543210". Use this as the storage/lookup key. */
  e164: string;
  /** The bare 10-digit subscriber number, e.g. "9876543210". For display. */
  national: string;
  /** Pretty form for UI, e.g. "98765 43210". */
  display: string;
}

export class PhoneError extends Error {}

/** Indian mobile numbers are 10 digits and start with 6, 7, 8 or 9. */
const INDIAN_MOBILE = /^[6-9]\d{9}$/;

/**
 * Normalises a phone number to E.164, or returns null if it cannot be
 * confidently interpreted as an Indian mobile number.
 *
 * Returns null rather than throwing, and rather than guessing: during OCR import
 * a half-legible number must be flagged for the owner to fix, never silently
 * "corrected" into someone else's number.
 */
export function normalizePhone(input: unknown): NormalizedPhone | null {
  if (typeof input !== 'string' && typeof input !== 'number') return null;

  // Strip everything that isn't a digit or a leading plus.
  const raw = String(input).trim();
  if (!raw) return null;

  let digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;

  // Peel off country and trunk prefixes, most specific first.
  //   +919876543210 / 919876543210  → 9876543210
  //   09876543210                   → 9876543210
  //   00919876543210                → 9876543210
  if (digits.length === 14 && digits.startsWith('0091')) digits = digits.slice(4);
  if (digits.length === 13 && digits.startsWith('091')) digits = digits.slice(3);
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);

  if (!INDIAN_MOBILE.test(digits)) return null;

  return {
    e164: `+91${digits}`,
    national: digits,
    display: `${digits.slice(0, 5)} ${digits.slice(5)}`,
  };
}

/** Throwing variant, for paths where an invalid number is a programming error. */
export function requirePhone(input: unknown): NormalizedPhone {
  const normalized = normalizePhone(input);
  if (!normalized) {
    throw new PhoneError(`Not a valid Indian mobile number: ${String(input)}`);
  }
  return normalized;
}

/** Convenience for lookups where only the key is needed. */
export function phoneKey(input: unknown): string | null {
  return normalizePhone(input)?.e164 ?? null;
}

/**
 * Extracts every distinct phone number from a block of free text.
 * Used by the WhatsApp-forwarded-list import pathway.
 *
 * The hard part is that space and dash are BOTH valid inside a phone number
 * ("98765 43210", "98765-43210") and the usual field separators in a forwarded
 * roster ("Rohan - 9876543210 - 2500"). A single greedy pattern therefore
 * swallows the fee into the number and the whole line yields nothing. So each
 * candidate run is interpreted as a whole first, and only if that fails is it
 * scanned for an embedded 10-digit mobile.
 *
 * Biased toward over-extraction on purpose: the owner reviews and edits every
 * row before anything is saved, so a spurious number they delete costs one tap,
 * whereas a real number silently dropped means a parent never gets contacted.
 */
export function extractPhones(text: string): NormalizedPhone[] {
  const runs = text.match(/\+?\d[\d\s().-]{6,24}\d/g) ?? [];
  const seen = new Set<string>();
  const out: NormalizedPhone[] = [];

  for (const run of runs) {
    for (const found of phonesInRun(run)) {
      if (!seen.has(found.e164)) {
        seen.add(found.e164);
        out.push(found);
      }
    }
  }
  return out;
}

/** Longest-run limit, beyond which a digit blob is not a phone list. */
const MAX_RUN_DIGITS = 24;

function phonesInRun(run: string): NormalizedPhone[] {
  const digits = run.replace(/\D/g, '');

  // Whole-run reading first. Handles clean numbers and every country/trunk
  // prefix form, and avoids mis-slicing a valid +91 number.
  const whole = normalizePhone(digits);
  if (whole) return [whole];

  if (digits.length < 10 || digits.length > MAX_RUN_DIGITS) return [];

  const found: NormalizedPhone[] = [];
  let i = 0;

  while (i <= digits.length - 10) {
    let matched: NormalizedPhone | null = null;
    let consumed = 0;

    /**
     * Try the LONGEST valid reading at this position before the shortest.
     *
     * This ordering matters. "+91 98765 43210 2500" compresses to
     * "9198765432102500", and a naive 10-digit window starting at index 0 yields
     * "9198765432" — which passes the Indian-mobile test and is a completely
     * different, wrong number. Preferring the 12-digit "919876543210" reading
     * consumes the country code properly and recovers +919876543210.
     *
     * Readings longer than 10 digits are only considered when they actually
     * begin with a recognised country or trunk prefix, so this cannot invent
     * long numbers out of concatenated digits.
     */
    for (const length of [14, 13, 12, 11, 10]) {
      if (i + length > digits.length) continue;
      const candidate = digits.slice(i, i + length);
      if (length > 10 && !/^(?:0091|091|91|0)/.test(candidate)) continue;

      const normalized = normalizePhone(candidate);
      if (normalized) {
        matched = normalized;
        consumed = length;
        break;
      }
    }

    if (matched) {
      found.push(matched);
      i += consumed;
    } else {
      i += 1;
    }
  }

  return found;
}
