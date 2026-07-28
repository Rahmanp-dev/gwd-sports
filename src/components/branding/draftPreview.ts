import type { BrandingDraft } from './AcademyBrandingEditor';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * DRAFT → ACADEMY-SHAPED OBJECT
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The canvas editor renders the REAL landing components (HeroSection,
 * StatsSection, WhyChooseUs, ...) rather than mock markup, because a preview
 * assembled from its own approximation of the page is a preview that lies —
 * and the first time it lies the owner stops believing it.
 *
 * Those components read an `academy` prop. This builds one from the unsaved
 * draft laid over the real academy, so the canvas shows what the page will
 * look like AFTER save while still using the academy's real content (student
 * counts, events, established year) for anything the draft does not carry.
 *
 * Deliberately a pure function in its own module: the canvas calls it on
 * every keystroke, and it must be cheap and free of React coupling.
 * ════════════════════════════════════════════════════════════════════════════
 */
export function draftToPreviewAcademy(
  draft: BrandingDraft,
  academy?: Record<string, any> | null,
): Record<string, any> {
  return {
    // Real content first — student lists, events, coordinates, anything the
    // branding draft has no opinion about.
    ...(academy ?? {}),

    // `achievements` lives at the top level of the Academy document, not in
    // `theme`, and the draft owns it.
    achievements: draft.achievements,

    theme: {
      ...(academy?.theme ?? {}),

      primaryColor: draft.primaryColor,
      accentColor: draft.accentColor,
      style: draft.style,
      fontPreset: draft.fontPreset,
      backgroundStyle: draft.backgroundStyle,
      backgroundColor: draft.backgroundColor,
      gradientType: draft.gradientType,
      gradientAngle: draft.gradientAngle,
      gradientStops: draft.gradientStops,

      logoUrl: draft.logoUrl,
      logoScale: draft.logoScale,
      logoShape: draft.logoShape,
      logoAlign: draft.logoAlign,
      logoFit: draft.logoFit,

      tagline: draft.tagline,
      heroBlur: draft.heroBlur,
      heroOverlay: draft.heroOverlay,
      heroMode: draft.heroMode,
      heroVideoUrl: draft.heroVideoUrl,
      heroEyebrow: draft.heroEyebrow,
      heroImages: draft.heroImages,

      programs: draft.programs,
      testimonials: draft.testimonials,
      gallery: draft.gallery,
      highlights: draft.highlights,
      customStats: draft.customStats,
      videoSection: draft.videoSection,

      density: draft.density,
      accentSection: draft.accentSection,
      sections: draft.sections,
      footer: draft.footer,
    },
  };
}
