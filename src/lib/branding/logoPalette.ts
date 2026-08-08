import {
  toHex,
  parseHex,
  contrastRatio,
  readableOn,
  relativeLuminance,
  darken,
  lighten,
  AA_NORMAL,
  type Rgb,
} from './palette';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * BRAND COLOURS, READ OFF THE ACADEMY'S OWN LOGO
 * ════════════════════════════════════════════════════════════════════════════
 *
 * An academy already has an identity. It is on their crest, their jerseys and
 * the banner outside the ground — and asking them to translate it into two hex
 * codes is asking the wrong question of the wrong person. Most will shrug and
 * keep the default, and their site will look like everybody else's.
 *
 * They have already uploaded the logo. The colours are right there.
 *
 * This module is the pure half: given the pixels, decide which colours are the
 * brand. The reading of pixels happens in the component, because a canvas needs
 * a browser — but every judgement about what counts as a brand colour lives
 * here, where it can be tested.
 *
 * WHAT MAKES THIS HARD, and what the algorithm actually has to survive:
 *
 *   · **Transparent padding.** Most logos are a PNG with more empty space than
 *     ink. Naive averaging returns grey every time.
 *   · **The crest is mostly white and black.** A gold-on-white crest averages
 *     to beige. Near-white and near-black are structure, not identity, so they
 *     are excluded from candidacy — but only from candidacy.
 *   · **Anti-aliasing invents colours.** Every edge pixel is a blend that
 *     exists nowhere in the design. Quantising into coarse buckets collapses
 *     those blends back onto the real colour.
 *   · **The most common colour is not the most important one.** A thin gold
 *     rule on a huge navy field is the accent, and it must not be discarded for
 *     being rare — so the accent is chosen for DISTANCE from the primary, not
 *     for frequency.
 *   · **A suggestion that fails contrast is worse than none**, because the
 *     owner will accept it without checking. Anything unreadable is darkened
 *     until it passes, and if it cannot, it is not offered.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** Ignore pixels more transparent than this — padding, not design. */
const MIN_ALPHA = 200;

/** Bucket width per channel. 32 collapses anti-aliasing without merging hues. */
const QUANTISE = 32;

/** Below this saturation a colour is structure (white/grey/black), not brand. */
const MIN_SATURATION = 0.18;

/**
 * Near-white carries no hue worth using. The dark floor is deliberately almost
 * at zero: a first version set it to 0.04 and silently excluded `#0F172A` —
 * club navy, one of the commonest crest colours in sport — leaving a navy-and-
 * gold crest suggesting gold as its PRIMARY. Blackness is already handled by
 * the saturation filter below (pure black and every grey have zero saturation),
 * so this only needs to catch true black.
 */
const MIN_LUMA = 0.004;
const MAX_LUMA = 0.92;

export interface PaletteSuggestion {
  primary: string;
  accent: string;
  /** Every brand-ish colour found, most frequent first. For a "more" picker. */
  candidates: string[];
  /** True when nothing usable was found and the caller should not offer this. */
  empty: boolean;
}

function saturation({ r, g, b }: Rgb): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

/** Perceptual-ish distance. Weighted because the eye is least sensitive to blue. */
export function colourDistance(a: Rgb, b: Rgb): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
}

function bucketKey({ r, g, b }: Rgb): string {
  const q = (v: number) => Math.min(255, Math.round(v / QUANTISE) * QUANTISE);
  return `${q(r)},${q(g)},${q(b)}`;
}

/**
 * Darkens a colour until text can sit on it, or gives up.
 *
 * Returns null rather than an unreadable colour: a suggestion the owner accepts
 * without checking must never be the thing that makes their site illegible.
 */
export function ensureReadable(colour: Rgb, maxSteps = 12): Rgb | null {
  let c = colour;
  for (let i = 0; i <= maxSteps; i++) {
    if (contrastRatio(c, readableOn(c)) >= AA_NORMAL) return c;
    c = darken(c, 0.08);
  }
  return null;
}

export interface SampledPixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Turns sampled pixels into a brand palette.
 *
 * Pure and synchronous — hand it an array of RGBA values (from a canvas, a
 * test, or anywhere) and it decides. It never throws; a logo it cannot read
 * returns `empty: true` and the caller simply does not offer the feature.
 */
export function suggestPaletteFromPixels(
  pixels: SampledPixel[],
  fallback: { primary: string; accent: string },
): PaletteSuggestion {
  const buckets = new Map<string, { colour: Rgb; count: number }>();

  for (const p of pixels) {
    if (p.a < MIN_ALPHA) continue;

    const rgb: Rgb = { r: p.r, g: p.g, b: p.b };
    const luma = relativeLuminance(rgb);
    if (luma < MIN_LUMA || luma > MAX_LUMA) continue;
    if (saturation(rgb) < MIN_SATURATION) continue;

    const key = bucketKey(rgb);
    const existing = buckets.get(key);
    if (existing) {
      existing.count++;
    } else {
      buckets.set(key, { colour: rgb, count: 1 });
    }
  }

  const ranked = [...buckets.values()].sort((a, b) => b.count - a.count);

  if (ranked.length === 0) {
    // A monochrome crest, or a logo that is all padding. Perfectly normal —
    // say nothing rather than inventing an identity for them.
    return { ...fallback, candidates: [], empty: true };
  }

  const primaryRaw = ranked[0].colour;
  const primary = ensureReadable(primaryRaw);
  if (!primary) {
    return { ...fallback, candidates: [], empty: true };
  }

  /**
   * The accent is the most DISTANT usable colour, not the second most common.
   * A thin gold rule on a navy field is rare and is exactly the accent; picking
   * by frequency would return another shade of navy and the site would look
   * monochrome.
   */
  let accent: Rgb | null = null;
  let best = -1;
  for (const { colour } of ranked.slice(1)) {
    const d = colourDistance(primary, colour);
    if (d > best) {
      best = d;
      accent = colour;
    }
  }

  // A single-colour logo is common and fine. Derive an accent from the primary
  // rather than leaving it unset or reaching for an unrelated default.
  const MIN_USEFUL_DISTANCE = 120;
  if (!accent || best < MIN_USEFUL_DISTANCE) {
    accent = lighten(primary, 0.35);
  }

  return {
    primary: toHex(primary),
    accent: toHex(accent),
    candidates: ranked.slice(0, 6).map((r) => toHex(r.colour)),
    empty: false,
  };
}

/**
 * How different a suggestion is from what the academy already has.
 *
 * The editor uses this to stay quiet: re-suggesting colours somebody has
 * already applied is noise, and an owner who has deliberately chosen their
 * palette should not be nagged to change it every time they open the page.
 */
export function suggestionIsMeaningful(
  suggestion: PaletteSuggestion,
  current: { primary?: string | null; accent?: string | null },
): boolean {
  if (suggestion.empty) return false;
  const a = parseHex(suggestion.primary);
  const b = parseHex(current.primary ?? null);
  if (!a) return false;
  if (!b) return true;
  return colourDistance(a, b) > 60;
}
