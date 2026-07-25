import { describe, it, expect } from 'vitest';
import {
  financialYearOf,
  issuerCode,
  formatReceiptNumber,
  parseReceiptNumber,
  receiptSeriesKey,
} from './receiptNumber';

/** A Date from an IST wall-clock time. */
function ist(year: number, month: number, day: number, hour = 12): Date {
  return new Date(Date.UTC(year, month, day, hour) - 330 * 60_000);
}

describe('the Indian financial year runs April to March', () => {
  it('places April in the year that starts then', () => {
    expect(financialYearOf(ist(2026, 3, 1)).label).toBe('2026-27');
  });

  it('places March in the year that started the previous April', () => {
    expect(financialYearOf(ist(2027, 2, 31)).label).toBe('2026-27');
  });

  it('rolls over on 1 April, not 1 January', () => {
    expect(financialYearOf(ist(2027, 0, 15)).label).toBe('2026-27');
    expect(financialYearOf(ist(2027, 3, 1)).label).toBe('2027-28');
  });

  /**
   * The boundary is a LOCAL midnight event. A server thinking in UTC would put
   * a 1 April 04:00 IST payment — 22:30 UTC on 31 March — into the wrong
   * financial year.
   */
  it('evaluates the boundary in IST, not UTC', () => {
    // 31 Mar 2027, 23:30 IST = 18:00 UTC same day. Still FY 2026-27.
    expect(financialYearOf(ist(2027, 2, 31, 23)).label).toBe('2026-27');
    // 1 Apr 2027, 04:00 IST = 22:30 UTC on 31 Mar. Already FY 2027-28.
    expect(financialYearOf(ist(2027, 3, 1, 4)).label).toBe('2027-28');
  });

  it('produces a compact four-digit code', () => {
    expect(financialYearOf(ist(2026, 3, 1)).code).toBe('2627');
    expect(financialYearOf(ist(2029, 3, 1)).code).toBe('2930');
  });

  it('handles a century boundary without collapsing', () => {
    expect(financialYearOf(ist(2099, 3, 1)).code).toBe('9900');
    expect(financialYearOf(ist(2100, 3, 1)).code).toBe('0001');
  });
});

describe('issuerCode', () => {
  /**
   * Derived from the slug, not the display name: a name can be edited, and a
   * receipt series must not change identity halfway through a year.
   */
  it('uppercases and strips punctuation', () => {
    expect(issuerCode('mastergrade-fc')).toBe('MASTER');
    expect(issuerCode('mg_fc.2')).toBe('MGFC2');
  });

  it('caps the length, because the number gets read aloud', () => {
    expect(issuerCode('averyveryverylongacademyslug')).toHaveLength(6);
  });

  it('falls back rather than producing an empty series', () => {
    expect(issuerCode('')).toBe('GWD');
    expect(issuerCode(null)).toBe('GWD');
    expect(issuerCode('---')).toBe('GWD');
  });
});

describe('formatReceiptNumber', () => {
  const fy = financialYearOf(ist(2026, 6, 20));

  it('produces a quotable number', () => {
    expect(formatReceiptNumber({ issuerCode: 'MGFC', financialYear: fy, sequence: 42 })).toBe(
      'MGFC/2627/00042'
    );
  });

  it('zero-pads so the series sorts lexicographically too', () => {
    const first = formatReceiptNumber({ issuerCode: 'MGFC', financialYear: fy, sequence: 9 });
    const second = formatReceiptNumber({ issuerCode: 'MGFC', financialYear: fy, sequence: 10 });
    expect(first < second).toBe(true);
  });

  it('does not truncate past the padding width', () => {
    expect(
      formatReceiptNumber({ issuerCode: 'MGFC', financialYear: fy, sequence: 123456 })
    ).toBe('MGFC/2627/123456');
  });
});

describe('receiptSeriesKey', () => {
  it('is one series per issuer per financial year', () => {
    const fy2627 = financialYearOf(ist(2026, 6, 20));
    const fy2728 = financialYearOf(ist(2027, 6, 20));

    expect(receiptSeriesKey('MGFC', fy2627)).not.toBe(receiptSeriesKey('MGFC', fy2728));
    expect(receiptSeriesKey('MGFC', fy2627)).not.toBe(receiptSeriesKey('OTHER', fy2627));
    // Same issuer, same year, two calls — the same counter.
    expect(receiptSeriesKey('MGFC', fy2627)).toBe(receiptSeriesKey('MGFC', fy2627));
  });
});

describe('parseReceiptNumber', () => {
  /**
   * Support's most common question is "which academy and which year is this?",
   * and it should be answerable without a database lookup.
   */
  it('round-trips a formatted number', () => {
    const fy = financialYearOf(ist(2026, 6, 20));
    const formatted = formatReceiptNumber({
      issuerCode: 'MGFC',
      financialYear: fy,
      sequence: 42,
    });
    expect(parseReceiptNumber(formatted)).toEqual({
      issuerCode: 'MGFC',
      financialYearCode: '2627',
      sequence: 42,
    });
  });

  it('rejects anything that is not a receipt number', () => {
    expect(parseReceiptNumber('rcpt_1234567890_abcde')).toBeNull();
    expect(parseReceiptNumber('MGFC/26/00042')).toBeNull();
    expect(parseReceiptNumber('')).toBeNull();
    expect(parseReceiptNumber('MGFC/2627/')).toBeNull();
  });

  it('tolerates surrounding whitespace, since these get copy-pasted', () => {
    expect(parseReceiptNumber('  MGFC/2627/00042 ')?.sequence).toBe(42);
  });
});
