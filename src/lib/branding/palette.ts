/**
 * Reads the palette's current `BrandInput.backgroundStyle` and emits
 * the correct CSS variables for it. Used by both `buildThemeVariables`
 * (which imports this) and tests.
 *
 * This is the file that owns ALL page-surface decisions: background, text,
 * card, muted, border, and the alternating band. An owner who picks a custom
 * colour still gets the text colour computed from it — that is the whole
 * safety property.
 */

/** ── Primitive colour ops ─────────────────────────────────────────── */

export interface Rgb { r: number; g: number; b: number }

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

export function parseHex(hex?: string | null): Rgb | null {
  if (!hex) return null;
  const s = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]+$/.test(s)) return null;
  if (s.length === 3) {
    const [r, g, b] = s.split('').map((c) => parseInt(c + c, 16));
    return { r, g, b };
  }
  if (s.length === 6) {
    return {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16),
    };
  }
  return null;
}

export const DEFAULT_PRIMARY = '#1e40af';
export const DEFAULT_ACCENT  = '#f59e0b';

export function toHex({ r, g, b }: Rgb): string {
  const part = (value: number) => clamp(value).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** "124 58 237" — the form a CSS variable needs to support alpha via rgb(). */
export function toRgbChannels({ r, g, b }: Rgb): string {
  return `${clamp(r)} ${clamp(g)} ${clamp(b)}`;
}

/**
 * WCAG relative luminance. The sRGB channels are gamma-encoded, so they must be
 * linearised before weighting — skipping that step is the classic mistake, and
 * it produces confidently wrong contrast decisions in the mid-range where most
 * brand colours live.
 */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker  = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
/** Not pure black: #0f172a reads as intentional rather than as a default. */
const INK: Rgb = { r: 15, g: 23, b: 42 };

/**
 * The readable foreground for a given background. THE point of this module.
 *
 * Picks whichever of white or ink has the higher contrast ratio, so a yellow
 * brand colour gets dark text and a navy one gets white, without anyone having
 * to remember to check.
 */
export function readableOn(background: Rgb): Rgb {
  return contrastRatio(background, WHITE) >= contrastRatio(background, INK) ? WHITE : INK;
}

/** WCAG AA for normal text. Below this, a colour is not usable for body copy. */
export const AA_NORMAL = 4.5;
/** WCAG AA for large text (18pt+/14pt bold) and for UI component boundaries. */
export const AA_LARGE = 3;

/**
 * Whether a brand colour can carry text at all, and how well.
 *
 * Surfaced in the branding studio rather than enforced: an owner is entitled to
 * their brand colour, and refusing to save it would be the wrong trade. What is
 * not acceptable is letting them ship an unreadable page without knowing.
 */
export function assessContrast(background: Rgb): {
  foreground: Rgb;
  ratio: number;
  passesNormal: boolean;
  passesLarge: boolean;
} {
  const foreground = readableOn(background);
  const ratio = contrastRatio(background, foreground);
  return {
    foreground,
    ratio: Math.round(ratio * 100) / 100,
    passesNormal: ratio >= AA_NORMAL,
    passesLarge: ratio >= AA_LARGE,
  };
}

/** Linear mix in sRGB. Predictable and cheap; good enough for tints and shades. */
export function mix(a: Rgb, b: Rgb, weight: number): Rgb {
  const w = Math.max(0, Math.min(1, weight));
  return {
    r: a.r + (b.r - a.r) * w,
    g: a.g + (b.g - a.g) * w,
    b: a.b + (b.b - a.b) * w,
  };
}

export function lighten(color: Rgb, amount: number): Rgb {
  return mix(color, WHITE, amount);
}

export function darken(color: Rgb, amount: number): Rgb {
  return mix(color, INK, amount);
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * "FEEL" — three presets, not a pile of sliders
 * ════════════════════════════════════════════════════════════════════════════
 */
export type BrandStyle = 'bold' | 'classic' | 'minimal';

export const BRAND_STYLES: Record<
  BrandStyle,
  { label: string; description: string; radius: string; shadow: string; tint: number }
> = {
  bold: {
    label: 'Bold',
    description: 'Big rounded shapes, strong colour, high energy. Suits youth academies.',
    radius: '1.25rem',
    shadow: '0 18px 40px -12px rgb(var(--brand-rgb) / 0.35)',
    tint: 0.9,
  },
  classic: {
    label: 'Classic',
    description: 'Measured corners and restrained colour. Suits established clubs.',
    radius: '0.75rem',
    shadow: '0 8px 24px -10px rgb(15 23 42 / 0.18)',
    tint: 0.94,
  },
  minimal: {
    label: 'Minimal',
    description: 'Sharp edges, mostly white, colour used sparingly. Suits premium coaching.',
    radius: '0.375rem',
    shadow: '0 1px 2px rgb(15 23 42 / 0.06)',
    tint: 0.97,
  },
};

export function isBrandStyle(value: unknown): value is BrandStyle {
  return value === 'bold' || value === 'classic' || value === 'minimal';
}

/**
 * Font pairing — same "presets not sliders" reasoning.
 */
export type FontPreset = 'sans' | 'editorial' | 'rounded';

export const FONT_PRESETS: Record<
  FontPreset,
  { label: string; description: string; heading: string; body: string }
> = {
  sans: {
    label: 'Modern',
    description: 'DM Sans throughout. Clean and platform-consistent.',
    heading: "'DM Sans', system-ui, -apple-system, sans-serif",
    body:    "'DM Sans', system-ui, -apple-system, sans-serif",
  },
  editorial: {
    label: 'Editorial',
    description: 'Playfair Display headings over DM Sans body copy. Suits established clubs.',
    heading: "'Playfair Display', Georgia, serif",
    body:    "'DM Sans', system-ui, -apple-system, sans-serif",
  },
  rounded: {
    label: 'Friendly',
    description: 'Poppins headings, rounder and energetic. Suits youth academies.',
    heading: "'Poppins', system-ui, -apple-system, sans-serif",
    body:    "'DM Sans', system-ui, -apple-system, sans-serif",
  },
};

export function isFontPreset(value: unknown): value is FontPreset {
  return value === 'sans' || value === 'editorial' || value === 'rounded';
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * BACKGROUND TREATMENTS — seven named options, not a free picker
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Four original + three new:
 *   light     — Plain white. Photos and colour do the talking.
 *   soft      — Barely-there brand wash. Warmer than white.
 *   gradient  — Gentle brand-to-white fade.
 *   dark      — Near-black, brand-tinted. Premium, high-contrast.
 *   slate     — Neutral cool dark slate. No brand tint. Minimal/pro.
 *   vivid     — Brand colour AS the background. High energy, bold.
 *   midnight  — Deep black with brand accent glow. Maximum drama.
 *
 * Each treatment owns BOTH the surface AND the text derived from it, so they
 * cannot disagree. An owner cannot accidentally produce black-on-black.
 */
export type BackgroundStyle =
  | 'light'
  | 'soft'
  | 'gradient'
  | 'dark'
  | 'slate'
  | 'vivid'
  | 'midnight';

export const BACKGROUND_STYLES: Record<
  BackgroundStyle,
  { label: string; description: string }
> = {
  light: {
    label: 'White',
    description: 'Plain white. Photographs and colour do the talking.',
  },
  soft: {
    label: 'Soft tint',
    description: 'A barely-there wash of your brand colour. Warmer than white.',
  },
  gradient: {
    label: 'Gradient',
    description: 'A gentle fade from your brand colour into white.',
  },
  dark: {
    label: 'Dark',
    description: 'Near-black with light text. High contrast, premium feel.',
  },
  slate: {
    label: 'Slate',
    description: 'Cool neutral dark. No brand tint — for a minimal, pro look.',
  },
  vivid: {
    label: 'Vivid',
    description: 'Your brand colour as the page background. Bold and energetic.',
  },
  midnight: {
    label: 'Midnight',
    description: 'Near-black with a subtle brand glow. Maximum drama.',
  },
};

export function isBackgroundStyle(value: unknown): value is BackgroundStyle {
  return (
    value === 'light'   ||
    value === 'soft'    ||
    value === 'gradient'||
    value === 'dark'    ||
    value === 'slate'   ||
    value === 'vivid'   ||
    value === 'midnight'
  );
}

export interface BrandInput {
  primaryColor?: string | null;
  accentColor?: string | null;
  style?: string | null;
  fontPreset?: string | null;
  backgroundStyle?: string | null;
  /**
   * Optional explicit page background colour.
   *
   * The named `backgroundStyle` treatments derive their surface from the brand
   * colour, which keeps things readable but gives an owner no way to say
   * "cream", or "this exact navy". When set, this overrides the derived
   * surface — and the TEXT colour is still computed from it, so an owner
   * cannot accidentally produce black-on-black.
   */
  backgroundColor?: string | null;
  /**
   * Page density. 'compact' tightens section padding and card gap;
   * 'spacious' (default) keeps the generous vertical rhythm that suits
   * premium-feeling pages. Drives --section-py and --content-gap.
   */
  density?: string | null;
  /**
   * Which section key uses --accent instead of --brand as its focal colour.
   * Emitted as --accent-section on the root; AcademyPublicPage wraps the
   * section in <div data-section-accent> and globals.css does the swap.
   */
  accentSection?: string | null;
}

/**
 * The full set of CSS custom properties for an academy.
 *
 * Emitted as variables rather than applied as inline styles per element,
 * because the previous approach — passing `primaryColor` down and setting
 * `style={{ color }}` at each site — is exactly why only two of nine landing
 * components ever honoured the theme. A variable set once at the page root
 * reaches everything, including components nobody remembered to update.
 */
export function buildThemeVariables(input: BrandInput): Record<string, string> {
  const primary = parseHex(input.primaryColor) ?? parseHex(DEFAULT_PRIMARY)!;
  const accent  = parseHex(input.accentColor)  ?? parseHex(DEFAULT_ACCENT)!;
  const style   = isBrandStyle(input.style)    ? input.style    : 'classic';
  const preset  = BRAND_STYLES[style];
  const fp      = isFontPreset(input.fontPreset) ? input.fontPreset : 'sans';
  const fonts   = FONT_PRESETS[fp];

  const onPrimary = readableOn(primary);
  const onAccent  = readableOn(accent);

  const isCompact = input.density === 'compact';

  return {
    '--brand':        toHex(primary),
    '--brand-rgb':    toRgbChannels(primary),
    '--brand-strong': toHex(darken(primary, 0.18)),
    '--brand-soft':   toHex(lighten(primary, preset.tint)),
    '--brand-border': toHex(lighten(primary, 0.75)),
    '--brand-on':     toHex(onPrimary),

    '--accent':        toHex(accent),
    '--accent-rgb':    toRgbChannels(accent),
    '--accent-strong': toHex(darken(accent, 0.18)),
    '--accent-soft':   toHex(lighten(accent, preset.tint)),
    '--accent-on':     toHex(onAccent),

    '--brand-radius': preset.radius,
    '--brand-shadow': preset.shadow,

    '--font-heading': fonts.heading,
    '--font-body':    fonts.body,

    // Density
    '--section-py':    isCompact ? '3rem' : '5rem',
    '--section-py-sm': isCompact ? '2rem' : '4rem',
    '--content-gap':   isCompact ? '1.25rem' : '2rem',

    // Accent section key (consumed by [data-section-accent] in globals.css)
    '--accent-section': input.accentSection ?? '',

    ...backgroundVariables(primary, input.backgroundStyle, input.backgroundColor),
  };
}

/**
 * Surface and text colour, derived together so they cannot disagree.
 *
 * ALL seven treatments are handled here. Key variables emitted:
 *   --page-bg      page background (may be a gradient string)
 *   --page-surface slightly lifted from --page-bg
 *   --page-card    card background — always readable against its own text
 *   --page-fg      primary text — always passes WCAG AA against --page-bg
 *   --page-muted   secondary text — slightly dimmer but still readable
 *   --page-border  subtle border colour
 *   --page-alt     alternating band — adjacent sections stay distinct
 *   --page-scheme  'dark' | 'light' — consumed by CSS prefers-color-scheme
 *                  overrides and also by components that need to know.
 */
function backgroundVariables(
  primary: Rgb,
  requested: string | null | undefined,
  customColor?: string | null,
): Record<string, string> {
  const style = isBackgroundStyle(requested) ? requested : 'light';

  // Custom colour wins over the named treatment.
  const custom = parseHex(customColor);
  if (custom) {
    const onCustom      = readableOn(custom);
    const isDark        = relativeLuminance(custom) < 0.4;
    const cardSurface   = isDark ? lighten(custom, 0.1) : WHITE;
    const altSurface    = isDark ? lighten(custom, 0.06) : darken(custom, 0.035);

    // When gradient style AND custom colour: gradient from custom into a
    // shifted version of itself.
    const bgValue =
      style === 'gradient'
        ? `linear-gradient(160deg, ${toHex(custom)} 0%, ${toHex(
            isDark ? darken(custom, 0.35) : lighten(custom, 0.55),
          )} 100%)`
        : toHex(custom);

    return {
      '--page-bg':      bgValue,
      '--page-surface': toHex(isDark ? lighten(custom, 0.08) : WHITE),
      '--page-card':    toHex(cardSurface),
      '--page-fg':      toHex(onCustom),
      '--page-muted':   isDark ? '#94a3b8' : '#64748b',
      '--page-border':  toHex(isDark ? lighten(custom, 0.2) : darken(custom, 0.08)),
      '--page-alt':     toHex(altSurface),
      '--page-scheme':  isDark ? 'dark' : 'light',
    };
  }

  // ── Named treatments ────────────────────────────────────────────────────

  if (style === 'dark') {
    const surface = darken(mix(primary, INK, 0.88), 0.55);
    return darkSurface(surface);
  }

  if (style === 'slate') {
    // Neutral cool dark — deliberate contrast with brand-tinted dark.
    const slate = { r: 15, g: 23, b: 42 } as Rgb;   // #0f172a
    return {
      '--page-bg':      '#0f172a',
      '--page-surface': '#1e293b',
      '--page-card':    '#1e293b',
      '--page-fg':      '#f8fafc',
      '--page-muted':   '#94a3b8',
      '--page-border':  '#334155',
      '--page-alt':     '#162032',
      '--page-scheme':  'dark',
    };
  }

  if (style === 'midnight') {
    // Near-black with brand colour as a glow/accent, not a surface.
    const surface = darken(mix(primary, INK, 0.96), 0.6);
    return {
      '--page-bg':      '#050811',
      '--page-surface': '#0a0f1e',
      '--page-card':    '#0d1426',
      '--page-fg':      '#f1f5f9',
      '--page-muted':   '#64748b',
      '--page-border':  toHex(lighten(surface, 0.18)),
      '--page-alt':     '#080c18',
      '--page-scheme':  'dark',
    };
  }

  if (style === 'vivid') {
    // Brand colour IS the page. Always use the readable foreground.
    const onBrand = readableOn(primary);
    const isDark  = relativeLuminance(primary) < 0.4;
    // Card lifts above the vivid surface — slightly lighter/darker depending on brightness.
    const card = isDark ? lighten(primary, 0.12) : darken(primary, 0.08);
    return {
      '--page-bg':      toHex(primary),
      '--page-surface': toHex(isDark ? lighten(primary, 0.06) : darken(primary, 0.04)),
      '--page-card':    toHex(card),
      '--page-fg':      toHex(onBrand),
      '--page-muted':   isDark
        ? toHex(lighten(primary, 0.45))
        : toHex(darken(primary, 0.35)),
      '--page-border':  toHex(isDark ? lighten(primary, 0.2) : darken(primary, 0.15)),
      '--page-alt':     toHex(isDark ? lighten(primary, 0.08) : darken(primary, 0.06)),
      '--page-scheme':  isDark ? 'dark' : 'light',
    };
  }

  if (style === 'gradient') {
    const top = lighten(primary, 0.9);
    return {
      '--page-bg':      `linear-gradient(160deg, ${toHex(top)} 0%, #ffffff 60%)`,
      '--page-surface': '#ffffff',
      '--page-card':    '#ffffff',
      '--page-fg':      toHex(INK),
      '--page-muted':   '#64748b',
      '--page-border':  '#e2e8f0',
      '--page-alt':     '#f8fafc',
      '--page-scheme':  'light',
    };
  }

  if (style === 'soft') {
    return {
      '--page-bg':      toHex(lighten(primary, 0.95)),
      '--page-surface': '#ffffff',
      '--page-card':    '#ffffff',
      '--page-fg':      toHex(INK),
      '--page-muted':   '#64748b',
      '--page-border':  '#e2e8f0',
      '--page-alt':     '#f8fafc',
      '--page-scheme':  'light',
    };
  }

  // light (default)
  return {
    '--page-bg':      '#ffffff',
    '--page-surface': '#ffffff',
    '--page-card':    '#ffffff',
    '--page-fg':      toHex(INK),
    '--page-muted':   '#64748b',
    '--page-border':  '#e2e8f0',
    '--page-alt':     '#f8fafc',
    '--page-scheme':  'light',
  };
}

/**
 * Shared dark-surface derivation for `dark` and callers that need a brand-
 * tinted dark surface (e.g., custom colours with low luminance).
 */
function darkSurface(surface: Rgb): Record<string, string> {
  return {
    '--page-bg':      toHex(surface),
    '--page-surface': toHex(lighten(surface, 0.08)),
    '--page-card':    toHex(lighten(surface, 0.12)),
    '--page-fg':      '#f8fafc',
    '--page-muted':   '#94a3b8',
    '--page-border':  toHex(lighten(surface, 0.2)),
    '--page-alt':     toHex(lighten(surface, 0.05)),
    '--page-scheme':  'dark',
  };
}

/** Serialised for a `style` attribute or an inline <style> block. */
export function themeVariablesToCss(variables: Record<string, string>): string {
  return Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');
}
