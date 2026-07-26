import type React from 'react';

/**
 * Hero presentation, derived once and used by both the live preview and the
 * real page.
 *
 * WHY THIS IS SHARED. The hero blur was previously written inline as
 * `backdrop-blur-[2px] sm:backdrop-blur-[3px]` — a different value on phones
 * than on desktop, decided in CSS rather than by the owner. So an owner who
 * approved the desktop look shipped something they had never seen to the
 * majority of their visitors, and the branding preview could not have shown it
 * either. One number, one place, both viewports.
 */

export interface HeroStyleInput {
  heroBlur?: number | null;
  heroOverlay?: number | null;
  logoScale?: number | null;
  logoShape?: string | null;
  logoAlign?: string | null;
  logoFit?: string | null;
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** The scrim that sits between the media and the text. */
export function heroScrimStyle(input: HeroStyleInput): React.CSSProperties {
  const blur = clamp(input.heroBlur, 0, 20, 3);
  const overlay = clamp(input.heroOverlay, 0, 100, 55) / 100;

  return {
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    /**
     * Graded rather than flat: heavier at the top and bottom where the
     * headline and the call to action sit, lighter through the middle so the
     * photograph is still visible rather than merely tinted.
     */
    background: `linear-gradient(180deg,
      rgba(2,6,23,${(overlay * 1.0).toFixed(3)}) 0%,
      rgba(2,6,23,${(overlay * 0.62).toFixed(3)}) 45%,
      rgba(2,6,23,${Math.min(overlay * 1.3, 0.92).toFixed(3)}) 100%)`,
  };
}

const RADIUS: Record<string, string> = {
  square: '4px',
  rounded: '16px',
  circle: '9999px',
};

/** The logo box in the hero. */
export function heroLogoStyle(input: HeroStyleInput): React.CSSProperties {
  const scale = clamp(input.logoScale, 40, 220, 100) / 100;
  const shape = String(input.logoShape ?? 'rounded');
  const fit = input.logoFit === 'cover' ? 'cover' : 'contain';

  return {
    height: `${Math.round(88 * scale)}px`,
    width: fit === 'cover' ? `${Math.round(88 * scale)}px` : 'auto',
    maxWidth: '78vw',
    objectFit: fit,
    borderRadius: RADIUS[shape] ?? RADIUS.rounded,
  };
}

/** Flex alignment for the logo's row. */
export function heroLogoAlignClass(input: HeroStyleInput): string {
  if (input.logoAlign === 'left') return 'justify-start';
  if (input.logoAlign === 'right') return 'justify-end';
  return 'justify-center';
}
