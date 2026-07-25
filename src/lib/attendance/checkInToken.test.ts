import { describe, it, expect } from 'vitest';
import { extractToken } from './checkInToken';

/**
 * The token arrives by three routes and all three must work: scanned from a QR
 * (which encodes a full URL), pasted out of a WhatsApp message (a URL, often
 * with tracking parameters appended), or typed off the printed poster by
 * someone who copied only the code.
 */
describe('extractToken', () => {
  const token = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

  it('accepts a bare token', () => {
    expect(extractToken(token)).toBe(token);
  });

  it('pulls the token out of the URL the QR actually encodes', () => {
    expect(extractToken(`https://gwd.in/check-in/${token}`)).toBe(token);
    expect(extractToken(`http://localhost:3000/check-in/${token}`)).toBe(token);
  });

  it('survives the query string a messaging app appends', () => {
    expect(extractToken(`https://gwd.in/check-in/${token}?utm_source=whatsapp`)).toBe(token);
  });

  it('normalises case, because people retype these', () => {
    expect(extractToken(token.toUpperCase())).toBe(token);
  });

  it('tolerates surrounding whitespace from a paste', () => {
    expect(extractToken(`  ${token}  `)).toBe(token);
  });

  it('rejects anything that is not a token', () => {
    expect(extractToken('')).toBeNull();
    expect(extractToken('hello')).toBeNull();
    // Right shape, wrong length — a truncated paste must not half-work.
    expect(extractToken('a1b2c3')).toBeNull();
    // Hex-looking but containing a non-hex character.
    expect(extractToken('g1b2c3d4e5f60718293a4b5c6d7e8f90')).toBeNull();
  });

  it('ignores an unrelated URL that happens to be pasted', () => {
    expect(extractToken('https://gwd.in/passport/GWD-7K2M9X')).toBeNull();
  });
});
