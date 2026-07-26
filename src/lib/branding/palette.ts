/**
 * ════════════════════════════════════════════════════════════════════════════
 * DERIVING A USABLE PALETTE FROM ONE COLOUR AN OWNER PICKED
 * ════════════════════════════════════════════════════════════════════════════
 *
 * An academy owner picks a brand colour from a colour picker. They do not pick
 * a hover state, a tint for section backgrounds, a border shade, or — the one
 * that actually breaks — a text colour that stays readable on top of it.
 *
 * THE FAILURE THIS PREVENTS: the previous implementation put white text on
 * `primaryColor` and hardcoded it. An academy whose brand is yellow, lime or
 * pale cyan got white-on-yellow, which is somewhere between hard to read and
 * invisible. Nobody notices in code review because the reviewer's academy is
 * blue. So the foreground is COMPUTED from WCAG relative luminance, not chosen.
 *
 * Everything here is pure and synchronous. It runs on the server to inline
 * theme variables into the page, and in the browser for the live preview in the
 * branding studio — the two must produce identical output or the preview lies.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** The platform default, used whenever an academy has not chosen one. */
export const DEFAULT_PRIMARY = '#7c3aed';
export const DEFAULT_ACCENT = '#c8971a';

/**
 * Parses #rgb, #rrggbb, with or without the hash. Returns null rather than
 * throwing: this runs on user input from a colour field, and a half-typed hex
 * should render the previous colour, not crash a public page.
 */
export function parseHex(input: string | null | undefined): Rgb | null {
  if (!input) return null;
  const hex = String(input).trim().replace(/^#/, '');

  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return null;
}

const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

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
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
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
 *
 * An owner asked for control over how the page feels. Exposing every knob
 * (radius, shadow, spacing, saturation) guarantees pages that look broken;
 * exposing nothing was the status quo. Three coherent presets is the useful
 * middle — each is a set of choices that work together, chosen by someone who
 * has seen a page built from them.
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
 * Font pairing, same "presets not sliders" reasoning as BRAND_STYLES above:
 * an owner picking a heading font and a body font independently is how you
 * get a page that looks like a ransom note. Three pairings that are already
 * known to work together.
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
    body: "'DM Sans', system-ui, -apple-system, sans-serif",
  },
  editorial: {
    label: 'Editorial',
    description: 'Playfair Display headings over DM Sans body copy. Suits established clubs.',
    heading: "'Playfair Display', Georgia, serif",
    body: "'DM Sans', system-ui, -apple-system, sans-serif",
  },
  rounded: {
    label: 'Friendly',
    description: 'Poppins headings, rounder and energetic. Suits youth academies.',
    heading: "'Poppins', system-ui, -apple-system, sans-serif",
    body: "'DM Sans', system-ui, -apple-system, sans-serif",
  },
};

export function isFontPreset(value: unknown): value is FontPreset {
  return value === 'sans' || value === 'editorial' || value === 'rounded';
}

/**
 * Page background treatment.
 *
 * Kept as named treatments rather than a free background colour picker for the
 * same reason as the foreground: an owner who picks a background independently
 * of their text colour produces an unreadable page. Each of these derives its
 * surface AND its text colour together, so the pairing is always legible.
 */
export type BackgroundStyle = 'light' | 'soft' | 'gradient' | 'dark';

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
};

export function isBackgroundStyle(value: unknown): value is BackgroundStyle {
  return (
    value === 'light' || value === 'soft' || value === 'gradient' || value === 'dark'
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
   * The four `backgroundStyle` treatments derive their surface from the brand
   * colour, which keeps things readable but gives an owner no way to say
   * "cream", or "this exact navy". When set, this overrides the derived
   * surface — and the TEXT colour is still computed from it, so an owner
   * cannot accidentally produce black-on-black.
   */
  backgroundColor?: string | null;
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
  const accent = parseHex(input.accentColor) ?? parseHex(DEFAULT_ACCENT)!;
  const style = isBrandStyle(input.style) ? input.style : 'classic';
  const preset = BRAND_STYLES[style];
  const fontPreset = isFontPreset(input.fontPreset) ? input.fontPreset : 'sans';
  const fonts = FONT_PRESETS[fontPreset];

  const onPrimary = readableOn(primary);
  const onAccent = readableOn(accent);

  return {
    '--brand': toHex(primary),
    '--brand-rgb': toRgbChannels(primary),
    // Hover/pressed. Darkened rather than opacity-shifted so it stays opaque
    // over photographs, which the hero section is full of.
    '--brand-strong': toHex(darken(primary, 0.18)),
    '--brand-soft': toHex(lighten(primary, preset.tint)),
    '--brand-border': toHex(lighten(primary, 0.75)),
    '--brand-on': toHex(onPrimary),

    '--accent': toHex(accent),
    '--accent-rgb': toRgbChannels(accent),
    '--accent-strong': toHex(darken(accent, 0.18)),
    '--accent-soft': toHex(lighten(accent, preset.tint)),
    '--accent-on': toHex(onAccent),

    '--brand-radius': preset.radius,
    '--brand-shadow': preset.shadow,

    '--font-heading': fonts.heading,
    '--font-body': fonts.body,

    ...backgroundVariables(primary, input.backgroundStyle, input.backgroundColor),
  };
}

/**
 * Surface and text colour, derived together so they cannot disagree.
 *
 * `--page-bg` may be a gradient, so it is applied via `background`, never
 * `background-color`. `--page-fg`, `--page-muted` and `--page-card` follow from
 * whichever surface was chosen — that is the whole point of pairing them here
 * rather than letting an owner pick a background and hope.
 */
function backgroundVariables(
  primary: Rgb,
  requested: string | null | undefined,
  customColor?: string | null,
): Record<string, string> {
  const style = isBackgroundStyle(requested) ? requested : 'light';

  /**
   * An explicit colour wins over the derived treatment — but the text colour
   * is still COMPUTED from it via readableOn(), never chosen by the owner.
   * That is the whole safety property: any background they pick stays legible,
   * including a gradient built from it.
   */
  const custom = parseHex(customColor);
  if (custom) {
    const onCustom = readableOn(custom);
    const isDarkSurface = relativeLuminance(custom) < 0.4;
    return {
      '--page-bg':
        style === 'gradient'
          ? `linear-gradient(180deg, ${toHex(custom)} 0%, ${toHex(
              isDarkSurface ? darken(custom, 0.35) : lighten(custom, 0.55),
            )} 100%)`
          : toHex(custom),
      // Cards lift off a dark surface and stay white on a light one, so text
      // inside a card is always readable regardless of the chosen colour.
      '--page-surface': isDarkSurface ? toHex(lighten(custom, 0.1)) : '#ffffff',
      '--page-card': isDarkSurface ? toHex(lighten(custom, 0.14)) : '#ffffff',
      '--page-fg': toHex(onCustom),
      '--page-muted': isDarkSurface ? '#a1a1aa' : '#64748b',
      '--page-border': toHex(
        isDarkSurface ? lighten(custom, 0.2) : darken(custom, 0.08),
      ),
    };
  }

  if (style === 'dark') {
    // Not pure black: a near-black tinted toward the brand reads as designed.
    const surface = darken(mix(primary, INK, 0.88), 0.55);
    return {
      '--page-bg': toHex(surface),
      '--page-surface': toHex(lighten(surface, 0.08)),
      '--page-card': toHex(lighten(surface, 0.12)),
      '--page-fg': '#f8fafc',
      '--page-muted': '#94a3b8',
      '--page-border': toHex(lighten(surface, 0.2)),
    };
  }

  if (style === 'gradient') {
    const top = lighten(primary, 0.9);
    return {
      '--page-bg': `linear-gradient(180deg, ${toHex(top)} 0%, #ffffff 60%)`,
      '--page-surface': '#ffffff',
      '--page-card': '#ffffff',
      '--page-fg': toHex(INK),
      '--page-muted': '#64748b',
      '--page-border': '#e2e8f0',
    };
  }

  if (style === 'soft') {
    return {
      '--page-bg': toHex(lighten(primary, 0.95)),
      '--page-surface': '#ffffff',
      '--page-card': '#ffffff',
      '--page-fg': toHex(INK),
      '--page-muted': '#64748b',
      '--page-border': '#e2e8f0',
    };
  }

  return {
    '--page-bg': '#ffffff',
    '--page-surface': '#ffffff',
    '--page-card': '#ffffff',
    '--page-fg': toHex(INK),
    '--page-muted': '#64748b',
    '--page-border': '#e2e8f0',
  };
}

/** Serialised for a `style` attribute or an inline <style> block. */
export function themeVariablesToCss(variables: Record<string, string>): string {
  return Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');
}
