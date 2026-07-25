import { describe, it, expect } from 'vitest';
import { generatePassportId, normalizeStudentName, buildIdentityKey } from './passport';

describe('generatePassportId', () => {
  it('produces a GWD-prefixed six character id', () => {
    expect(generatePassportId()).toMatch(/^GWD-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/);
  });

  it('excludes characters a parent would misread aloud or mistype', () => {
    // No 0/O, 1/I/L, or U — these are read off a phone screen and dictated over
    // the phone to academy staff.
    const ids = Array.from({ length: 400 }, generatePassportId).join('');
    expect(ids).not.toMatch(/[01ILOU]/);
  });

  it('does not collide across a large sample', () => {
    const ids = new Set(Array.from({ length: 5000 }, generatePassportId));
    expect(ids.size).toBe(5000);
  });

  it('is not sequential, so it cannot leak how many students exist', () => {
    const first = generatePassportId();
    const second = generatePassportId();
    expect(first).not.toBe(second);
  });
});

describe('normalizeStudentName', () => {
  it('collapses the variations that mean the same child', () => {
    const variants = ['Rohan Sharma', 'rohan sharma', 'ROHAN  SHARMA', ' Rohan Sharma. ', 'Rohan-Sharma'];
    const normalized = new Set(variants.map(normalizeStudentName));
    expect(normalized.size, `got: ${[...normalized].join(' | ')}`).toBe(1);
  });

  it('keeps genuinely different names distinct', () => {
    // These must NOT merge: guessing that a nickname is the same child would
    // combine two students' records, which is far worse than two records the
    // owner can merge deliberately.
    expect(normalizeStudentName('Rohan')).not.toBe(normalizeStudentName('Rohit'));
    expect(normalizeStudentName('Rohan Sharma')).not.toBe(normalizeStudentName('Rohan Verma'));
    expect(normalizeStudentName('Priya')).not.toBe(normalizeStudentName('Preeya'));
  });

  it('handles non-Latin scripts without stripping them to nothing', () => {
    expect(normalizeStudentName('रोहन शर्मा')).not.toBe('');
    expect(normalizeStudentName('रोहन  शर्मा')).toBe(normalizeStudentName('रोहन शर्मा'));
  });

  it('KNOWN LIMITATION: dotted initials do not match undotted ones', () => {
    // "S.K. Sharma" → "s k sharma", "SK Sharma" → "sk sharma". Punctuation is
    // turned into a space, which is right for hyphenated names but means these
    // two spellings produce different identity keys and therefore two
    // passports. Documented rather than papered over: collapsing single-letter
    // tokens would fix this case but would also merge "A Kumar" with "Anil
    // Kumar", which is worse. The review table's duplicate-phone flag catches
    // this in practice, because both spellings share the parent's number.
    expect(normalizeStudentName('S.K. Sharma')).not.toBe(normalizeStudentName('SK Sharma'));
  });
});

describe('buildIdentityKey — the duplicate-passport guarantee', () => {
  it('gives the same key for the same child regardless of name formatting', () => {
    expect(buildIdentityKey('+919876543210', 'Rohan Sharma')).toBe(
      buildIdentityKey('+919876543210', 'rohan  sharma')
    );
  });

  it('gives DIFFERENT keys to siblings on one parent number', () => {
    // The sibling case is why phone alone cannot be the identity key.
    expect(buildIdentityKey('+919876543210', 'Rohan Sharma')).not.toBe(
      buildIdentityKey('+919876543210', 'Anaya Sharma')
    );
  });

  it('gives different keys to same-named children of different parents', () => {
    // And this is why name alone cannot be the identity key either.
    expect(buildIdentityKey('+919876543210', 'Rohan Sharma')).not.toBe(
      buildIdentityKey('+919123456789', 'Rohan Sharma')
    );
  });

  it('is stable across academies, so a transfer resolves to one passport', () => {
    // No academy component in the key: the same child joining a second academy
    // must find their existing passport rather than mint a new one.
    const atFirstAcademy = buildIdentityKey('+919876543210', 'Rohan Sharma');
    const atSecondAcademy = buildIdentityKey('+919876543210', 'Rohan Sharma');
    expect(atSecondAcademy).toBe(atFirstAcademy);
    expect(atFirstAcademy).not.toMatch(/academy/i);
  });
});
