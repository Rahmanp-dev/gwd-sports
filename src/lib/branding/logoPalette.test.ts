import { describe, it, expect } from 'vitest';
import {
  suggestPaletteFromPixels,
  suggestionIsMeaningful,
  ensureReadable,
  colourDistance,
  type SampledPixel,
} from './logoPalette';
import { parseHex, contrastRatio, readableOn, AA_NORMAL } from './palette';

const FALLBACK = { primary: '#1e40af', accent: '#f59e0b' };

/** n opaque pixels of one colour. */
function px(hex: string, n: number): SampledPixel[] {
  const c = parseHex(hex)!;
  return Array.from({ length: n }, () => ({ r: c.r, g: c.g, b: c.b, a: 255 }));
}

/** n fully transparent pixels — the padding around most logos. */
function transparent(n: number): SampledPixel[] {
  return Array.from({ length: n }, () => ({ r: 0, g: 0, b: 0, a: 0 }));
}

describe('suggestPaletteFromPixels — the cases a real crest presents', () => {
  it('ignores transparent padding rather than averaging to grey', () => {
    // The commonest logo shape: a small mark in a large empty canvas.
    const s = suggestPaletteFromPixels(
      [...transparent(5000), ...px('#14532D', 200)],
      FALLBACK,
    );
    expect(s.empty).toBe(false);
    const p = parseHex(s.primary)!;
    expect(colourDistance(p, parseHex('#14532D')!)).toBeLessThan(60);
  });

  it('ignores white and black structure, keeping the actual brand colour', () => {
    // A gold-on-white crest with black linework. Naive averaging returns beige.
    const s = suggestPaletteFromPixels(
      [...px('#FFFFFF', 4000), ...px('#000000', 800), ...px('#C8971A', 300)],
      FALLBACK,
    );
    expect(s.empty).toBe(false);
    expect(colourDistance(parseHex(s.primary)!, parseHex('#C8971A')!)).toBeLessThan(80);
  });

  it('collapses anti-aliased edge blends onto the real colour', () => {
    // Every edge pixel is a blend that exists nowhere in the design.
    const blends = ['#1D4ED8', '#1E4FD6', '#1C4CD9', '#1F50D4', '#1B4BDA']
      .flatMap((h) => px(h, 40));
    const s = suggestPaletteFromPixels(blends, FALLBACK);
    expect(s.empty).toBe(false);
    // Should resolve to one colour, not five near-identical candidates.
    expect(s.candidates.length).toBeLessThanOrEqual(2);
  });

  it('picks the accent by distance, not by frequency', () => {
    // A thin gold rule on a huge navy field. Gold is rare and IS the accent;
    // frequency ranking would return another navy and look monochrome.
    const s = suggestPaletteFromPixels(
      [...px('#0F172A', 3000), ...px('#16223B', 900), ...px('#C8971A', 60)],
      FALLBACK,
    );
    expect(s.empty).toBe(false);
    expect(colourDistance(parseHex(s.accent)!, parseHex('#C8971A')!)).toBeLessThan(90);
  });

  it('derives an accent for a single-colour logo instead of leaving it unset', () => {
    const s = suggestPaletteFromPixels(px('#B45309', 500), FALLBACK);
    expect(s.empty).toBe(false);
    expect(s.accent).toMatch(/^#[0-9a-f]{6}$/i);
    expect(s.accent.toLowerCase()).not.toBe(s.primary.toLowerCase());
  });
});

describe('it refuses rather than guessing', () => {
  it('reports empty for a pure black-and-white crest', () => {
    const s = suggestPaletteFromPixels(
      [...px('#FFFFFF', 2000), ...px('#000000', 500)],
      FALLBACK,
    );
    expect(s.empty).toBe(true);
    // Falls back to what they already had — never invents an identity.
    expect(s.primary).toBe(FALLBACK.primary);
  });

  it('reports empty for an entirely transparent image', () => {
    expect(suggestPaletteFromPixels(transparent(3000), FALLBACK).empty).toBe(true);
  });

  it('reports empty for no pixels at all', () => {
    expect(suggestPaletteFromPixels([], FALLBACK).empty).toBe(true);
  });

  it('never throws on nonsense channel values', () => {
    const junk: SampledPixel[] = [
      { r: NaN, g: 0, b: 0, a: 255 },
      { r: 999, g: -5, b: 0, a: 255 },
    ];
    expect(() => suggestPaletteFromPixels(junk, FALLBACK)).not.toThrow();
  });
});

/**
 * The load-bearing guarantee. An owner will press "use my logo's colours" and
 * never check the result, so an unreadable suggestion is worse than none.
 */
describe('every suggestion is readable', () => {
  it('returns a primary that clears AA', () => {
    const bright = ['#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FFD700'];
    for (const hex of bright) {
      const s = suggestPaletteFromPixels(px(hex, 400), FALLBACK);
      if (s.empty) continue;
      const p = parseHex(s.primary)!;
      expect(
        contrastRatio(p, readableOn(p)),
        `${hex} -> ${s.primary}`,
      ).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it('never returns a colour that fails, whatever it is given', () => {
    // The invariant that matters. An earlier version of this test assumed
    // bright yellow needed darkening — it does not: `readableOn` puts BLACK on
    // it and the contrast is ~19:1. What must hold is not "it darkens" but
    // "it never hands back something unreadable".
    const samples = [
      '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF',
      '#808080', '#767676', '#0F172A', '#FFFFFF', '#000000',
    ];
    for (const hex of samples) {
      const out = ensureReadable(parseHex(hex)!);
      if (out === null) continue; // gave up honestly — allowed
      expect(
        contrastRatio(out, readableOn(out)),
        `${hex} -> returned an unreadable colour`,
      ).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });
});

describe('suggestionIsMeaningful — knowing when to stay quiet', () => {
  const s = { primary: '#14532D', accent: '#C8971A', candidates: [], empty: false };

  it('is false when the academy already has these colours', () => {
    expect(suggestionIsMeaningful(s, { primary: '#14532D' })).toBe(false);
  });

  it('is false for an empty suggestion', () => {
    expect(
      suggestionIsMeaningful({ ...s, empty: true }, { primary: '#000000' }),
    ).toBe(false);
  });

  it('is true when the academy has nothing set yet', () => {
    expect(suggestionIsMeaningful(s, {})).toBe(true);
    expect(suggestionIsMeaningful(s, { primary: null })).toBe(true);
  });

  it('is true when it differs enough to be worth offering', () => {
    expect(suggestionIsMeaningful(s, { primary: '#DC2626' })).toBe(true);
  });
});
