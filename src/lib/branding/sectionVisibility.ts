import { buildEmbedUrl } from '@/components/landing/videoEmbed';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * WILL THIS SECTION ACTUALLY RENDER?
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every landing section returns null when it has nothing genuine to show — no
 * photos, no disciplines, no valid video link. That rule is deliberate and
 * stays.
 *
 * The problem it created is that `AcademyPublicPage` decided each section's
 * alternating band BEFORE rendering it, counting any section the owner had not
 * explicitly switched off. A section that then self-nulled still consumed a
 * band slot, so the two sections after it both got the same colour and the page
 * showed a visible seam where two identically-tinted bands met. The comment in
 * that file claimed the opposite — that null sections could not break the
 * rhythm — which is exactly the kind of confident wrong note that stops anyone
 * looking.
 *
 * Rather than duplicate six visibility conditions into the page (where they
 * would drift the first time one changed), this is the one place that knows.
 * Each section imports its own predicate for its early return, and the page
 * imports the same function to assign bands. There is no second copy to keep
 * in sync.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** Section keys that appear in the ordered, toggleable set. */
export type VisibilitySectionKey =
  | 'programs'
  | 'stats'
  | 'achievements'
  | 'video'
  | 'gallery'
  | 'testimonials';

/** An owner's explicit off switch. Absent means on. */
function switchedOff(academy: any, key: string): boolean {
  return academy?.theme?.sections?.[key] === false;
}

/** Array.isArray everywhere: a non-array persisted here must not throw. */
function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

export function programsContentCount(academy: any): number {
  const authored = asArray(academy?.theme?.programs);
  if (authored.length) return authored.length;
  // Falls back to the academy's real `sports` list — see SportsGrid.
  return asArray(academy?.sports).filter(Boolean).length;
}

export function statsContentCount(academy: any): number {
  const derived =
    (asArray(academy?.students).length > 0 ? 1 : 0) +
    (asArray(academy?.achievements).filter(Boolean).length > 0 ? 1 : 0) +
    (asArray(academy?.sports).length > 0 ? 1 : 0) +
    (Number.isFinite(Number(academy?.establishedYear)) &&
    Number(academy?.establishedYear) > 1900
      ? 1
      : 0);

  const authored = asArray(academy?.theme?.customStats).filter(
    (s: any) => s?.label && Number.isFinite(Number(s.value)) && Number(s.value) > 0,
  ).length;

  return derived + authored;
}

export function highlightsContentCount(academy: any): number {
  const authored = asArray(academy?.theme?.highlights).filter((h: any) => h?.title);
  // WhyChooseUs falls back to six platform-true defaults, so this section
  // always has content unless it is switched off.
  return authored.length > 0 ? authored.length : 6;
}

export function galleryContentCount(academy: any): number {
  return asArray(academy?.theme?.gallery).filter((g: any) => g?.url).length;
}

export function testimonialsContentCount(academy: any): number {
  return asArray(academy?.theme?.testimonials).filter((t: any) =>
    String(t?.quote ?? '').trim(),
  ).length;
}

export function videoEmbedFor(academy: any): string | null {
  const cfg = academy?.theme?.videoSection;
  if (!cfg?.url) return null;
  const provider = cfg.provider === 'instagram' ? 'instagram' : 'youtube';
  return buildEmbedUrl(provider, String(cfg.url));
}

/**
 * The predicate. True only when the section will produce visible markup, so a
 * caller can count bands, decide whether to show an editor affordance, or skip
 * a wrapper entirely.
 */
export function sectionWillRender(key: string, academy: any): boolean {
  if (switchedOff(academy, key)) return false;

  switch (key) {
    case 'programs':
      return programsContentCount(academy) > 0;
    case 'stats':
      return statsContentCount(academy) > 0;
    case 'achievements':
      return highlightsContentCount(academy) > 0;
    case 'video':
      return Boolean(videoEmbedFor(academy));
    case 'gallery':
      return galleryContentCount(academy) > 0;
    case 'testimonials':
      return testimonialsContentCount(academy) > 0;
    default:
      // An unknown key has no component, so it renders nothing.
      return false;
  }
}
