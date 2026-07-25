/**
 * ════════════════════════════════════════════════════════════════════════════
 * RECEIPT NUMBERING — GAPLESS, PER ISSUER, PER FINANCIAL YEAR
 * ════════════════════════════════════════════════════════════════════════════
 *
 * A document a parent can show their employer or attach to a reimbursement
 * claim cannot be numbered with a timestamp or a random string. Indian practice
 * — and GST rules where they apply — expects a series that is:
 *
 *   • unique,
 *   • sequential with no gaps,
 *   • restarted each financial year,
 *   • scoped to the issuer.
 *
 * "No gaps" is the constraint that shapes the implementation. A number must be
 * allocated only when a receipt actually exists, never speculatively — so
 * numbering happens at settlement, not at order creation. Most orders are never
 * paid; numbering them would leave permanent holes in the series.
 *
 * THE FINANCIAL YEAR IS APRIL–MARCH, not January–December. A payment on 31
 * March 2027 belongs to FY 2026-27; one on 1 April 2027 starts FY 2027-28. This
 * catches people out every year.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** India is a fixed +05:30, and the FY boundary is a local-midnight event. */
const IST_OFFSET_MINUTES = 330;

export interface FinancialYear {
  /** Calendar year the FY starts in. 2026 means FY 2026-27. */
  startYear: number;
  /** "2026-27", as printed on the document. */
  label: string;
  /** "2627", the compact form used inside the number. */
  code: string;
}

/**
 * The Indian financial year containing an instant, evaluated in IST.
 *
 * Deliberately not derived from the server's local time: a Vercel function in
 * UTC would place a 31 March 23:30 IST payment (18:00 UTC, same day) correctly,
 * but a 1 April 04:00 IST payment (22:30 UTC on 31 March) into the wrong year.
 */
export function financialYearOf(at: Date): FinancialYear {
  const shifted = new Date(at.getTime() + IST_OFFSET_MINUTES * 60_000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth(); // 0-indexed; March is 2, April is 3.

  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;

  return {
    startYear,
    label: `${startYear}-${String(endYear).slice(-2)}`,
    code: `${String(startYear).slice(-2)}${String(endYear).slice(-2)}`,
  };
}

/**
 * A short, stable, human-quotable code for an academy.
 *
 * Derived from the slug rather than the display name, because a name can be
 * edited and a receipt series must not change identity halfway through a year.
 * Uppercase alphanumerics only — a receipt number gets read aloud over the
 * phone and typed into a spreadsheet.
 */
export function issuerCode(slug: string | null | undefined, fallback = 'GWD'): string {
  const cleaned = String(slug ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  if (!cleaned) return fallback;
  return cleaned.slice(0, 6);
}

/** Zero-padded so the series sorts lexicographically as well as numerically. */
const SEQUENCE_WIDTH = 5;

export function formatReceiptNumber(input: {
  issuerCode: string;
  financialYear: FinancialYear;
  sequence: number;
}): string {
  const sequence = String(input.sequence).padStart(SEQUENCE_WIDTH, '0');
  return `${input.issuerCode}/${input.financialYear.code}/${sequence}`;
}

/** The scope key a counter is kept against. One series per issuer per FY. */
export function receiptSeriesKey(issuer: string, financialYear: FinancialYear): string {
  return `receipt:${issuer}:${financialYear.code}`;
}

export interface ParsedReceiptNumber {
  issuerCode: string;
  financialYearCode: string;
  sequence: number;
}

/**
 * Parses a receipt number back into its parts.
 *
 * Exists so support can answer "which academy and which year is
 * MGFC/2627/00042?" without a database lookup — which is most of what a
 * parent's query actually needs.
 */
export function parseReceiptNumber(value: string): ParsedReceiptNumber | null {
  const match = /^([A-Z0-9]{1,6})\/(\d{4})\/(\d+)$/.exec(String(value ?? '').trim());
  if (!match) return null;
  return {
    issuerCode: match[1],
    financialYearCode: match[2],
    sequence: Number(match[3]),
  };
}
