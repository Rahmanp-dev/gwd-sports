import {
  parseHex,
  contrastRatio,
  readableOn,
  AA_NORMAL,
  type BrandStyle,
  type FontPreset,
  type BackgroundStyle,
} from './palette';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * LOOKS — one decision instead of five
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The theme engine already exposes primary colour, accent colour, font preset,
 * brand "feel" and background style. Every one of those is a real control and
 * none of them should go away — but presenting five independent pickers to a
 * cricket coach is asking them to be an art director. The predictable result is
 * the default palette on nine academies out of ten, and on the tenth, a
 * combination nobody would have chosen deliberately.
 *
 * A Look is a complete, coherent identity applied in one click: colours that
 * belong together, a typeface that suits them, a background that carries them,
 * and a feel that matches. The owner picks the one that looks like their club
 * and is finished. Every underlying control stays available afterwards for
 * anyone who wants to keep going.
 *
 * WHY THESE PARTICULAR ONES. Each is built around a real archetype of Indian
 * grassroots sport rather than a colour theory exercise:
 *
 *   · the established cricket club with a crest and a hundred years of nothing
 *     changing
 *   · the new football academy that wants to look like a European side
 *   · the neighbourhood academy on a school ground, warm and unpretentious
 *   · the elite/pro setup selling seriousness
 *   · the youth-first place full of eight-year-olds
 *
 * EVERY LOOK IS CONTRAST-CHECKED AT MODULE LOAD by its own test. A Look that
 * ships a primary its own text cannot sit on is worse than no Look at all,
 * because the owner will trust it and never check.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface Look {
  id: string;
  /** What an owner would call it, not what a designer would. */
  label: string;
  /** One line, describing the ACADEMY it suits — not the colours. */
  suits: string;
  primary: string;
  accent: string;
  fontPreset: FontPreset;
  style: BrandStyle;
  background: BackgroundStyle;
}

export const LOOKS: Look[] = [
  {
    id: 'heritage',
    label: 'Heritage',
    suits: 'Established clubs with a crest and a long memory.',
    primary: '#14532D',   // deep club green
    accent: '#C8971A',    // old gold
    fontPreset: 'editorial',
    style: 'classic',
    background: 'soft',
  },
  {
    id: 'matchday',
    label: 'Matchday',
    suits: 'Football academies that want to look like a European side.',
    primary: '#1D4ED8',
    accent: '#F59E0B',
    fontPreset: 'sans',
    style: 'bold',
    background: 'light',
  },
  {
    id: 'clubhouse',
    label: 'Clubhouse',
    suits: 'Neighbourhood academies on a school ground. Warm, unpretentious.',
    primary: '#B45309',
    accent: '#0F766E',
    fontPreset: 'rounded',
    style: 'classic',
    background: 'soft',
  },
  {
    id: 'floodlight',
    label: 'Floodlight',
    suits: 'Evening training, night matches, a serious competitive setup.',
    primary: '#DC2626',
    accent: '#38BDF8',
    fontPreset: 'sans',
    style: 'bold',
    background: 'dark',
  },
  {
    id: 'academy-pro',
    label: 'Academy Pro',
    suits: 'Elite programmes selling precision and seriousness.',
    primary: '#0F172A',
    accent: '#DC2626',
    fontPreset: 'sans',
    style: 'minimal',
    background: 'light',
  },
  {
    id: 'sunrise',
    label: 'Sunrise',
    suits: 'Youth-first academies. Six-year-olds, parents on the boundary.',
    primary: '#EA580C',
    accent: '#0284C7',
    fontPreset: 'rounded',
    style: 'bold',
    background: 'soft',
  },
  {
    id: 'turf',
    label: 'Turf',
    suits: 'Multi-sport centres and turf owners running several disciplines.',
    primary: '#15803D',
    accent: '#84CC16',
    fontPreset: 'sans',
    style: 'classic',
    background: 'light',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    suits: 'Academies whose photography is the point. Everything else recedes.',
    primary: '#4F46E5',
    accent: '#22D3EE',
    fontPreset: 'sans',
    style: 'minimal',
    background: 'dark',
  },
];

export function getLook(id: string): Look | undefined {
  return LOOKS.find((l) => l.id === id);
}

/**
 * Which Look, if any, the current settings correspond to.
 *
 * Used to highlight the active card. Returns null the moment an owner changes
 * anything by hand — deliberately, because showing a Look as "selected" when
 * its colours have since been edited is a small lie that makes the whole panel
 * untrustworthy.
 */
export function matchLook(current: {
  primary?: string | null;
  accent?: string | null;
  fontPreset?: string | null;
  style?: string | null;
  background?: string | null;
}): Look | null {
  const eq = (a?: string | null, b?: string | null) =>
    String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

  return (
    LOOKS.find(
      (l) =>
        eq(l.primary, current.primary) &&
        eq(l.accent, current.accent) &&
        eq(l.fontPreset, current.fontPreset) &&
        eq(l.style, current.style) &&
        eq(l.background, current.background),
    ) ?? null
  );
}

/**
 * The contrast a Look's primary achieves against the text that will sit on it.
 *
 * Exposed rather than kept private so the editor can show it, and so the test
 * suite can assert every shipped Look clears AA. `readableOn` picks black or
 * white the same way the live theme does, so this is the real number a visitor
 * experiences, not an approximation.
 */
export function lookContrast(look: Look): number {
  const primary = parseHex(look.primary);
  if (!primary) return 0;
  return contrastRatio(primary, readableOn(primary));
}

/** True when a Look's primary is safe for normal-size text. */
export function lookPassesAA(look: Look): boolean {
  return lookContrast(look) >= AA_NORMAL;
}
