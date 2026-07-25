import { describe, it, expect } from 'vitest';
import {
  parseHex,
  toHex,
  toRgbChannels,
  relativeLuminance,
  contrastRatio,
  readableOn,
  assessContrast,
  buildThemeVariables,
  themeVariablesToCss,
  isBrandStyle,
  BRAND_STYLES,
  lighten,
  darken,
  AA_NORMAL,
  DEFAULT_PRIMARY,
} from './palette';

describe('parseHex', () => {
  it('accepts the shapes a colour input actually produces', () => {
    expect(parseHex('#7c3aed')).toEqual({ r: 124, g: 58, b: 237 });
    expect(parseHex('7c3aed')).toEqual({ r: 124, g: 58, b: 237 });
    expect(parseHex('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex('  #7C3AED  ')).toEqual({ r: 124, g: 58, b: 237 });
  });

  /**
   * Returns null rather than throwing: this runs on live input from a colour
   * field, and a half-typed hex must render the previous colour rather than
   * crash a public page.
   */
  it('returns null for anything malformed', () => {
    expect(parseHex('#7c3ae')).toBeNull();
    expect(parseHex('rebeccapurple')).toBeNull();
    expect(parseHex('#gggggg')).toBeNull();
    expect(parseHex('')).toBeNull();
    expect(parseHex(null)).toBeNull();
    expect(parseHex(undefined)).toBeNull();
  });

  it('round-trips through toHex', () => {
    expect(toHex(parseHex('#7c3aed')!)).toBe('#7c3aed');
    expect(toHex(parseHex('#fff')!)).toBe('#ffffff');
  });

  it('emits rgb channels for alpha-capable variables', () => {
    expect(toRgbChannels({ r: 124, g: 58, b: 237 })).toBe('124 58 237');
  });
});

describe('relative luminance', () => {
  it('matches the WCAG reference values at the extremes', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });

  /**
   * The sRGB channels are gamma-encoded and must be linearised before
   * weighting. Skipping that is the classic mistake and produces confidently
   * wrong contrast decisions right in the mid-range where brand colours live.
   */
  it('linearises rather than using the raw channel value', () => {
    // Mid-grey #808080 has a raw channel of 0.502 but a luminance near 0.216.
    const midGrey = relativeLuminance({ r: 128, g: 128, b: 128 });
    expect(midGrey).toBeGreaterThan(0.2);
    expect(midGrey).toBeLessThan(0.23);
    expect(midGrey).not.toBeCloseTo(0.502, 2);
  });

  it('weights green far above blue', () => {
    const green = relativeLuminance({ r: 0, g: 255, b: 0 });
    const blue = relativeLuminance({ r: 0, g: 0, b: 255 });
    expect(green).toBeGreaterThan(blue * 8);
  });
});

describe('contrastRatio', () => {
  it('produces the reference values', () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 1);
    expect(contrastRatio({ r: 255, g: 255, b: 255 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    const a = { r: 124, g: 58, b: 237 };
    const b = { r: 255, g: 255, b: 255 };
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 6);
  });
});

describe('readableOn — the failure this module exists to prevent', () => {
  /**
   * The old code hardcoded white text on the academy's primary colour. An
   * academy whose brand is yellow got white-on-yellow, which is somewhere
   * between hard to read and invisible — and nobody notices in review, because
   * the reviewer's academy is blue.
   */
  it('gives dark text on a light brand colour', () => {
    expect(toHex(readableOn(parseHex('#ffe600')!))).toBe('#0f172a'); // yellow
    expect(toHex(readableOn(parseHex('#a3e635')!))).toBe('#0f172a'); // lime
    expect(toHex(readableOn(parseHex('#67e8f9')!))).toBe('#0f172a'); // pale cyan
  });

  it('gives white text on a dark brand colour', () => {
    expect(toHex(readableOn(parseHex('#7c3aed')!))).toBe('#ffffff'); // violet
    expect(toHex(readableOn(parseHex('#0f172a')!))).toBe('#ffffff'); // navy
    expect(toHex(readableOn(parseHex('#7f1d1d')!))).toBe('#ffffff'); // maroon
  });

  it('always chooses the higher-contrast option', () => {
    const samples = ['#ffe600', '#7c3aed', '#808080', '#00ff00', '#111111', '#f8fafc'];
    for (const hex of samples) {
      const background = parseHex(hex)!;
      const chosen = readableOn(background);
      const other = toHex(chosen) === '#ffffff' ? { r: 15, g: 23, b: 42 } : { r: 255, g: 255, b: 255 };
      expect(contrastRatio(background, chosen)).toBeGreaterThanOrEqual(
        contrastRatio(background, other)
      );
    }
  });
});

describe('assessContrast', () => {
  it('passes a strong brand colour', () => {
    const result = assessContrast(parseHex('#7c3aed')!);
    expect(result.passesNormal).toBe(true);
    expect(result.ratio).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  /**
   * Surfaced, not enforced. An owner is entitled to their brand colour, and
   * refusing to save it would be the wrong trade — but shipping an unreadable
   * page without knowing is not acceptable either.
   */
  it('reports a mid-tone that cannot carry body text against EITHER foreground', () => {
    /**
     * #7d7d7d reaches only 4.12:1 on white and 4.34:1 on ink — the better of
     * the two is still under AA. The band where this happens is narrow (roughly
     * luminance 0.18–0.21), which is precisely why it survives review: almost
     * every colour anyone tries does pass, so nobody discovers the check is
     * missing until an academy picks a mid grey.
     */
    const result = assessContrast(parseHex('#7d7d7d')!);
    expect(result.passesNormal).toBe(false);
    expect(result.ratio).toBeLessThan(AA_NORMAL);
    // Still fine for large display text, which is the honest thing to tell an
    // owner rather than a flat "your colour is bad".
    expect(result.passesLarge).toBe(true);
  });

  it('passes the colours an academy is actually likely to pick', () => {
    // The warning has to be rare enough to mean something when it appears.
    for (const hex of ['#7c3aed', '#dc2626', '#0f766e', '#1d4ed8', '#ffe600', '#0f172a']) {
      expect(assessContrast(parseHex(hex)!).passesNormal).toBe(true);
    }
  });

  it('rounds the ratio to something displayable', () => {
    const result = assessContrast(parseHex('#7c3aed')!);
    expect(String(result.ratio).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});

describe('lighten and darken', () => {
  it('move towards white and ink', () => {
    const base = parseHex('#7c3aed')!;
    expect(relativeLuminance(lighten(base, 0.5))).toBeGreaterThan(relativeLuminance(base));
    expect(relativeLuminance(darken(base, 0.5))).toBeLessThan(relativeLuminance(base));
  });

  it('clamp at the extremes rather than overshooting', () => {
    const base = parseHex('#7c3aed')!;
    expect(toHex(lighten(base, 1))).toBe('#ffffff');
    expect(toHex(lighten(base, 5))).toBe('#ffffff');
    expect(toHex(darken(base, -5))).toBe('#7c3aed');
  });
});

describe('buildThemeVariables', () => {
  it('emits every variable the components rely on', () => {
    const variables = buildThemeVariables({ primaryColor: '#7c3aed' });
    for (const key of [
      '--brand',
      '--brand-rgb',
      '--brand-strong',
      '--brand-soft',
      '--brand-border',
      '--brand-on',
      '--accent',
      '--accent-on',
      '--brand-radius',
      '--brand-shadow',
    ]) {
      expect(variables[key]).toBeTruthy();
    }
  });

  it('falls back to the platform default for a missing or broken colour', () => {
    expect(buildThemeVariables({})['--brand']).toBe(DEFAULT_PRIMARY);
    expect(buildThemeVariables({ primaryColor: 'not a colour' })['--brand']).toBe(DEFAULT_PRIMARY);
    expect(buildThemeVariables({ primaryColor: '' })['--brand']).toBe(DEFAULT_PRIMARY);
  });

  it('computes the foreground rather than assuming white', () => {
    expect(buildThemeVariables({ primaryColor: '#ffe600' })['--brand-on']).toBe('#0f172a');
    expect(buildThemeVariables({ primaryColor: '#7c3aed' })['--brand-on']).toBe('#ffffff');
  });

  it('derives a hover shade that stays opaque', () => {
    // Darkened rather than opacity-shifted, because the hero section is full of
    // photographs and a translucent hover would show them through the button.
    const variables = buildThemeVariables({ primaryColor: '#7c3aed' });
    expect(variables['--brand-strong']).not.toBe(variables['--brand']);
    expect(variables['--brand-strong']).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('applies the chosen style preset', () => {
    expect(buildThemeVariables({ style: 'bold' })['--brand-radius']).toBe(
      BRAND_STYLES.bold.radius
    );
    expect(buildThemeVariables({ style: 'minimal' })['--brand-radius']).toBe(
      BRAND_STYLES.minimal.radius
    );
  });

  it('defaults to classic for an unknown style', () => {
    expect(buildThemeVariables({ style: 'neon' })['--brand-radius']).toBe(
      BRAND_STYLES.classic.radius
    );
    expect(buildThemeVariables({})['--brand-radius']).toBe(BRAND_STYLES.classic.radius);
  });

  it('keeps accent independent of primary', () => {
    const variables = buildThemeVariables({ primaryColor: '#7c3aed', accentColor: '#ffe600' });
    expect(variables['--brand']).toBe('#7c3aed');
    expect(variables['--accent']).toBe('#ffe600');
    expect(variables['--brand-on']).toBe('#ffffff');
    expect(variables['--accent-on']).toBe('#0f172a');
  });

  /**
   * Server and browser must produce identical output — the studio's live
   * preview is only honest if it runs the same function as the real page.
   */
  it('is deterministic', () => {
    const input = { primaryColor: '#7c3aed', accentColor: '#c8971a', style: 'bold' };
    expect(buildThemeVariables(input)).toEqual(buildThemeVariables(input));
  });
});

describe('themeVariablesToCss', () => {
  it('serialises into something a style attribute accepts', () => {
    const css = themeVariablesToCss({ '--brand': '#7c3aed', '--brand-on': '#ffffff' });
    expect(css).toBe('--brand: #7c3aed; --brand-on: #ffffff;');
  });
});

describe('isBrandStyle', () => {
  it('recognises the three presets and nothing else', () => {
    expect(isBrandStyle('bold')).toBe(true);
    expect(isBrandStyle('classic')).toBe(true);
    expect(isBrandStyle('minimal')).toBe(true);
    expect(isBrandStyle('BOLD')).toBe(false);
    expect(isBrandStyle(null)).toBe(false);
  });

  it('every preset is complete', () => {
    for (const preset of Object.values(BRAND_STYLES)) {
      expect(preset.label.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
      expect(preset.radius).toMatch(/rem$/);
      expect(preset.shadow.length).toBeGreaterThan(0);
    }
  });
});
