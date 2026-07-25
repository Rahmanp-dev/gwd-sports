import { describe, it, expect } from 'vitest';
import { normalizePhone, phoneKey, extractPhones, requirePhone, PhoneError } from './phone';

describe('normalizePhone — every way an owner writes the same number', () => {
  /**
   * These are all the same parent. If any one of them fails to collapse to the
   * same key, that parent's QR check-in breaks at the academy gate.
   */
  const sameNumber = [
    '9876543210',
    '+919876543210',
    '919876543210',
    '09876543210',
    '0919876543210',
    '00919876543210',
    '+91 9876543210',
    '+91 98765 43210',
    '98765-43210',
    '(+91) 98765 43210',
    ' 9876543210 ',
    '+91-98765-43210',
    '91 98765 43210',
  ];

  it('collapses every written form to one canonical key', () => {
    const keys = new Set(sameNumber.map((n) => phoneKey(n)));
    expect(keys.size, `got distinct keys: ${[...keys].join(', ')}`).toBe(1);
    expect([...keys][0]).toBe('+919876543210');
  });

  it('returns all three representations', () => {
    const result = normalizePhone('+91 98765 43210')!;
    expect(result.e164).toBe('+919876543210');
    expect(result.national).toBe('9876543210');
    expect(result.display).toBe('98765 43210');
  });

  it('accepts numbers starting 6, 7, 8 and 9', () => {
    for (const prefix of ['6', '7', '8', '9']) {
      expect(phoneKey(`${prefix}123456789`)).toBe(`+91${prefix}123456789`);
    }
  });

  it('accepts a numeric input, not only a string', () => {
    expect(phoneKey(9876543210)).toBe('+919876543210');
  });
});

describe('normalizePhone — rejects rather than guesses', () => {
  const invalid: Array<[string, unknown]> = [
    ['too short', '98765432'],
    ['too long', '98765432109876'],
    ['landline-style leading 1', '1234567890'],
    ['leading 5 is not a mobile prefix', '5876543210'],
    ['leading 0 only, too short', '0987654'],
    ['empty', ''],
    ['whitespace only', '   '],
    ['no digits at all', 'not a number'],
    ['null', null],
    ['undefined', undefined],
    ['object', {}],
    ['wrong country code', '+449876543210'],
  ];

  it.each(invalid)('returns null for %s', (_label, input) => {
    expect(normalizePhone(input)).toBeNull();
  });

  it('never silently repairs a partially legible number', () => {
    // An OCR read that dropped a digit must be flagged, not padded into a real
    // number that belongs to someone else.
    expect(normalizePhone('987654321')).toBeNull();
  });

  it('requirePhone throws where normalizePhone returns null', () => {
    expect(() => requirePhone('98765')).toThrow(PhoneError);
    expect(requirePhone('9876543210').e164).toBe('+919876543210');
  });
});

describe('extractPhones — the WhatsApp forwarded list case', () => {
  it('pulls numbers out of a realistic forwarded roster', () => {
    const message = `
      Cricket Evening Batch - fees pending
      1. Rohan Sharma - 9876543210 - 2500
      2. Aditya Verma +91 91234 56789 Rs 2500
      3. Priya Nair, 8765432109, paid
      4. Karan (father: 07654321098)
    `;
    const found = extractPhones(message).map((p) => p.e164);
    expect(found).toEqual([
      '+919876543210',
      '+919123456789',
      '+918765432109',
      '+917654321098',
    ]);
  });

  it('deduplicates a number that appears twice in different formats', () => {
    const found = extractPhones('Rohan 9876543210 and again +91-98765-43210');
    expect(found).toHaveLength(1);
    expect(found[0].e164).toBe('+919876543210');
  });

  it('ignores amounts, dates and jersey numbers', () => {
    const found = extractPhones('Fee 2500 due on 05/08/2026, jersey 07, age 12');
    expect(found).toHaveLength(0);
  });

  it('returns an empty array for text with no numbers', () => {
    expect(extractPhones('no numbers here at all')).toEqual([]);
  });
});
