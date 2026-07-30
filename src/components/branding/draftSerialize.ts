import type { BrandingDraft } from './AcademyBrandingEditor';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * DRAFT → UPDATE PAYLOAD
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Pure, and in its own module so it is testable: this project's vitest setup
 * does not transform JSX, so nothing exported from a `.tsx` can be unit-tested.
 * (`BrandingDraft` is imported type-only, which esbuild erases — the component
 * file is never loaded.)
 *
 * ── WHY THE PRUNING EXISTS ──
 *
 * Every "Add …" button in the editor appends an EMPTY row so the owner has
 * somewhere to type. Several of those subdocuments have `required` fields in
 * the schema (`programs.id`/`.label`, `testimonials.name`/`.quote`,
 * `highlights.title`, `customStats.label`) and the update route runs
 * validators — so one untouched blank row failed validation and rejected the
 * ENTIRE save.
 *
 * The cost was never one lost row: colours, hero media and footer edits made
 * in the same sitting were discarded with it, behind a generic "Could not save
 * your changes." Clicking "Add number" and thinking better of it was enough.
 *
 * Dropping incomplete rows here is the honest fix — a row the owner never
 * filled in is not data they are trying to keep. Rows that are partly filled
 * but missing a REQUIRED field go too, because the alternative is failing the
 * whole save on their behalf.
 * ════════════════════════════════════════════════════════════════════════════
 */

const text = (v: unknown) => String(v ?? '').trim();

export function pruneDraftRows(draft: BrandingDraft) {
  return {
    // `id` is slugged from the label and is required — an emoji-only label
    // slugs to "" and would fail validation, so require both.
    programs: (draft.programs ?? []).filter((p) => text(p.id) && text(p.label)),
    testimonials: (draft.testimonials ?? []).filter(
      (t) => text(t.name) && text(t.quote),
    ),
    gallery: (draft.gallery ?? []).filter((g) => text(g.url)),
    highlights: (draft.highlights ?? []).filter((h) => text(h.title)),
    // A stat needs a label AND a real number. `Number("")` is 0, and the public
    // section hides `value <= 0`, so clearing the box mid-edit must not persist
    // a stat that then silently never appears.
    customStats: (draft.customStats ?? []).filter(
      (s) => text(s.label) && Number.isFinite(Number(s.value)) && Number(s.value) > 0,
    ),
    achievements: (draft.achievements ?? []).filter((a) => text(a)),
  };
}

/**
 * Dot-notation, NOT a nested `theme` object.
 *
 * `PUT /api/academy/:id` does a plain findByIdAndUpdate, so sending
 * `{ theme: {...} }` replaces the whole subdocument — silently wiping
 * heroImages, which nothing on that screen edits. Dot paths touch only the
 * keys named.
 */
export function draftToThemeUpdate(draft: BrandingDraft): Record<string, unknown> {
  const pruned = pruneDraftRows(draft);
  return {
    'theme.primaryColor': draft.primaryColor,
    'theme.accentColor': draft.accentColor,
    'theme.style': draft.style,
    'theme.fontPreset': draft.fontPreset,
    'theme.backgroundStyle': draft.backgroundStyle,
    'theme.backgroundColor': draft.backgroundColor,
    'theme.gradientType': draft.gradientType,
    'theme.gradientAngle': draft.gradientAngle,
    'theme.gradientStops': draft.gradientStops,
    'theme.logoScale': draft.logoScale,
    'theme.logoShape': draft.logoShape,
    'theme.logoAlign': draft.logoAlign,
    'theme.logoFit': draft.logoFit,
    'theme.heroBlur': draft.heroBlur,
    'theme.heroOverlay': draft.heroOverlay,
    'theme.heroMode': draft.heroMode,
    'theme.heroVideoUrl': draft.heroVideoUrl,
    'theme.heroEyebrow': draft.heroEyebrow,
    'theme.heroImages': draft.heroImages,
    'theme.tagline': draft.tagline,
    'theme.logoUrl': draft.logoUrl,
    'theme.programs': pruned.programs,
    'theme.testimonials': pruned.testimonials,
    'theme.gallery': pruned.gallery,
    'theme.highlights': pruned.highlights,
    'theme.customStats': pruned.customStats,
    'theme.videoSection': draft.videoSection,
    'theme.density': draft.density,
    'theme.accentSection': draft.accentSection,
    'theme.sections': draft.sections,
    'theme.footer': draft.footer,
    // NOT under `theme` — achievements live at the document root.
    achievements: pruned.achievements,
  };
}
