import { describe, it, expect } from 'vitest';
import {
  LOOKS,
  getLook,
  matchLook,
  lookContrast,
  lookPassesAA,
} from './looks';
import {
  isBrandStyle,
  isFontPreset,
  isBackgroundStyle,
  parseHex,
  AA_NORMAL,
} from './palette';

describe('every shipped Look is structurally valid', () => {
  it('has unique ids', () => {
    const ids = LOOKS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses only real presets the theme engine understands', () => {
    // A Look that ships an unknown font or style would silently fall back to a
    // default, so the owner picks "Heritage" and gets something else.
    for (const look of LOOKS) {
      expect(isFontPreset(look.fontPreset), `${look.id} fontPreset`).toBe(true);
      expect(isBrandStyle(look.style), `${look.id} style`).toBe(true);
      expect(isBackgroundStyle(look.background), `${look.id} background`).toBe(true);
    }
  });

  it('ships parseable hex colours', () => {
    for (const look of LOOKS) {
      expect(parseHex(look.primary), `${look.id} primary`).not.toBeNull();
      expect(parseHex(look.accent), `${look.id} accent`).not.toBeNull();
    }
  });

  it('never repeats the primary as the accent', () => {
    for (const look of LOOKS) {
      expect(look.primary.toLowerCase(), look.id).not.toBe(look.accent.toLowerCase());
    }
  });

  it('describes the academy it suits, not the colours', () => {
    // The copy rule for this panel: an owner picks by recognising their club,
    // not by liking a swatch.
    for (const look of LOOKS) {
      expect(look.suits.length, look.id).toBeGreaterThan(20);
      expect(look.label.length, look.id).toBeGreaterThan(2);
    }
  });
});

/**
 * The load-bearing test. A Look is applied in one click by someone who will
 * never check it — so if a shipped primary cannot carry readable text, we have
 * handed an academy an unreadable website and their trust in the picker.
 */
describe('every shipped Look is readable', () => {
  it('clears AA for normal text on its primary', () => {
    const failures = LOOKS.filter((l) => !lookPassesAA(l)).map(
      (l) => `${l.id} (${l.primary}) = ${lookContrast(l).toFixed(2)}:1`,
    );
    expect(failures, `must all be >= ${AA_NORMAL}:1`).toEqual([]);
  });

  it('reports a real ratio, not a placeholder', () => {
    for (const look of LOOKS) {
      const c = lookContrast(look);
      expect(c, look.id).toBeGreaterThan(1);
      expect(Number.isFinite(c), look.id).toBe(true);
    }
  });
});

describe('getLook', () => {
  it('finds a known look and returns undefined otherwise', () => {
    expect(getLook('heritage')?.label).toBe('Heritage');
    expect(getLook('does-not-exist')).toBeUndefined();
  });
});

describe('matchLook', () => {
  it('recognises settings that exactly match a Look', () => {
    const heritage = getLook('heritage')!;
    expect(
      matchLook({
        primary: heritage.primary,
        accent: heritage.accent,
        fontPreset: heritage.fontPreset,
        style: heritage.style,
        background: heritage.background,
      })?.id,
    ).toBe('heritage');
  });

  it('is case and whitespace insensitive on colours', () => {
    const l = getLook('matchday')!;
    expect(
      matchLook({
        primary: `  ${l.primary.toUpperCase()} `,
        accent: l.accent.toLowerCase(),
        fontPreset: l.fontPreset,
        style: l.style,
        background: l.background,
      })?.id,
    ).toBe('matchday');
  });

  it('returns null once ANY field has been hand-edited', () => {
    // Showing a Look as selected after its colours were changed is a small lie
    // that makes the whole panel untrustworthy.
    const l = getLook('matchday')!;
    expect(
      matchLook({
        primary: '#123456',
        accent: l.accent,
        fontPreset: l.fontPreset,
        style: l.style,
        background: l.background,
      }),
    ).toBeNull();

    expect(
      matchLook({
        primary: l.primary,
        accent: l.accent,
        fontPreset: 'editorial',
        style: l.style,
        background: l.background,
      }),
    ).toBeNull();
  });

  it('returns null for empty or partial settings rather than guessing', () => {
    expect(matchLook({})).toBeNull();
    expect(matchLook({ primary: '#1D4ED8' })).toBeNull();
    expect(matchLook({ primary: null, accent: undefined })).toBeNull();
  });
});
