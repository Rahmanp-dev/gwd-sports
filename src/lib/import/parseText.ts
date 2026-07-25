import { normalizePhone, extractPhones } from '@/lib/phone';
import { type ExtractedRow, cleanString, cleanFeeAmount } from './types';

/**
 * Parses a student list forwarded as plain text — typically pasted out of an
 * existing WhatsApp group.
 *
 * Real forwarded lists look like these, often in one message:
 *
 *   1. Rohan Sharma - 9876543210 - 2500
 *   2) Aditya Verma, 9123456789, Cricket, Rs 2500
 *   Priya Nair 8765432109 (mother: Latha) swimming
 *   *Karan Mehta* — 7654321098 — ₹3,000/-
 *
 * DESIGN RULE: extract what is unambiguous, return null for the rest. A wrong
 * guess about which token is the child's name and which is the parent's produces
 * a WhatsApp message addressed to the wrong person, which is worse than an empty
 * field the owner fills in during review.
 */

/** Lines that are never a student row, regardless of what else they contain. */
const NOISE_PATTERNS: RegExp[] = [
  // Separator rules: "-----", "=====".
  /^\s*[-–=*_]{3,}\s*$/,
  // Totals and counts: "Total: 42 students", "Sum 105000".
  /^\s*(?:total|subtotal|sum|count|grand\s*total)\b/i,
  // Column-header rows: "Name - Phone", "Sr No | Name | Fee".
  /^\s*(?:sr\.?\s*no|s\.?\s*no|#)\b/i,
  /^\s*name\s*[-–|,]\s*(?:phone|mobile|contact|number|fee)/i,
  // Conversational chatter that gets forwarded along with the list.
  /\b(?:good morning|good afternoon|good evening|thanks|thank you|please note|reminder|kindly)\b/i,
];

/**
 * Words that identify a line as a group/batch heading rather than a person.
 *
 * Only applied to lines with NO phone number. A line reading "Cricket Evening
 * Batch" is a heading; "Rohan Sharma 9876543210 cricket evening batch" is a
 * student. The presence of a phone number is the discriminator, because a
 * heading never carries one.
 */
const HEADING_WORDS = /\b(?:batch|group|list|roster|session|team|category|under[\s-]?\d+|u\d{2})\b/i;

/** Labels that explicitly identify a guardian rather than the student. */
const PARENT_LABEL =
  /\b(?:father|mother|parent|guardian|papa|mummy|mom|dad|f\/o|m\/o|s\/o|d\/o)\b\s*[:\-–]?\s*/i;

export function parseWhatsAppText(text: string): ExtractedRow[] {
  if (!text || !text.trim()) return [];

  const rows: ExtractedRow[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const row = parseLine(rawLine);
    if (row) rows.push(row);
  }

  return rows;
}

function parseLine(rawLine: string): ExtractedRow | null {
  let line = rawLine.trim();
  if (!line) return null;
  if (NOISE_PATTERNS.some((pattern) => pattern.test(line))) return null;

  // Strip WhatsApp emphasis markers and list numbering: "1.", "2)", "-", "*".
  line = line.replace(/[*_~]/g, ' ');
  line = line.replace(/^\s*(?:\d{1,3}\s*[.)\]:-]|[-–•●○*])\s*/, '');
  line = line.replace(/\s+/g, ' ').trim();
  if (!line) return null;

  // ---- Phone --------------------------------------------------------------
  const phones = extractPhones(line);
  const phone = phones[0] ?? null;

  // A heading-shaped line with no phone number is a section header, not a
  // student. Checked here rather than up front because it depends on the phone.
  if (!phone && HEADING_WORDS.test(line)) return null;

  // Remove the matched phone text so it cannot be mistaken for a name or fee.
  let remainder = line;
  if (phone) {
    remainder = removePhoneText(remainder, phone.national);
  }

  // ---- Parent name (only when explicitly labelled) -----------------------
  let parentName: string | null = null;
  const parentMatch = remainder.match(
    new RegExp(`\\(?\\s*${PARENT_LABEL.source}([\\p{L}\\s.]{2,40})\\)?`, 'iu')
  );
  if (parentMatch) {
    parentName = cleanString(parentMatch[1]);
    remainder = remainder.replace(parentMatch[0], ' ');
  }

  // ---- Fee ----------------------------------------------------------------
  let feeAmount: number | null = null;
  // Currency-marked amounts are unambiguous, so look for those first.
  const markedFee = remainder.match(/(?:₹|rs\.?|inr)\s*([\d,]+)(?:\/-)?/i);
  if (markedFee) {
    feeAmount = cleanFeeAmount(markedFee[1]);
    remainder = remainder.replace(markedFee[0], ' ');
  } else {
    // A bare number is only treated as a fee at >= 100. Below that it is far
    // more likely an age, a jersey number or a batch number.
    const bareFee = remainder.match(/(?:^|\s)(\d{3,6})(?:\/-)?(?=\s|$)/);
    if (bareFee) {
      const candidate = cleanFeeAmount(bareFee[1]);
      if (candidate !== null && candidate >= 100) {
        feeAmount = candidate;
        remainder = remainder.replace(bareFee[0], ' ');
      }
    }
  }

  // ---- Name and sport/batch ----------------------------------------------
  // What remains is separated by commas, dashes or pipes. The first non-empty
  // segment containing letters is the student's name; a following segment, if
  // any, is taken as the sport or batch.
  const segments = remainder
    .split(/[,|;–—]|\s-\s|\s{2,}/)
    .map((segment) => cleanString(segment))
    .filter((segment): segment is string => Boolean(segment && /\p{L}/u.test(segment)));

  const name = segments[0] ? tidyName(segments[0]) : null;
  const sportOrBatch = segments[1] ? cleanString(segments[1]) : null;

  // A line with neither a name nor a phone carries nothing worth reviewing.
  if (!name && !phone) return null;

  return {
    name,
    mobileNumber: phone ? phone.national : null,
    parentName,
    sportOrBatch,
    feeAmount,
  };
}

/**
 * Removes the phone number from a line regardless of how it was formatted,
 * by matching its digits with arbitrary separators between them.
 */
function removePhoneText(line: string, nationalDigits: string): string {
  const flexible = nationalDigits.split('').join('[\\s().-]*');
  const pattern = new RegExp(`(?:\\+?\\s*91[\\s().-]*)?${flexible}`, 'g');
  return line.replace(pattern, ' ').replace(/\s+/g, ' ').trim();
}

/** Drops trailing punctuation and stray separators left by field splitting. */
function tidyName(value: string): string | null {
  return cleanString(value.replace(/^[^\p{L}]+/u, '').replace(/[^\p{L}.\s]+$/u, ''));
}
