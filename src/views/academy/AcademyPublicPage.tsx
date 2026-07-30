'use client';

import React from 'react';
import HeroSection from "@/components/landing/HeroSection";
import SportsGrid from "@/components/landing/SportsGrid";
import TestimonialsCarousel from "@/components/landing/TestimonialsCarousel";
import EventsTimeline from "@/components/landing/EventsTimeline";
import StatsSection from "@/components/landing/StatsSection";
import GallerySection from "@/components/landing/GallerySection";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import VideoSection from "@/components/landing/VideoSection";
import Footer from "@/components/landing/Footer";
import AcademyTheme from "@/components/branding/AcademyTheme";
import { DEFAULT_SECTION_ORDER } from "@/components/branding/AcademyBrandingEditor";
import { sectionWillRender } from "@/lib/branding/sectionVisibility";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * ACADEMY PUBLIC HOMEPAGE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * THEMING — everything inside `AcademyTheme` inherits that academy's brand
 * through CSS custom properties. Sections use `academy` only for CONTENT
 * (name, images, events), never for COLOUR.
 *
 * SECTION BACKGROUNDS — alternating bands via `data-band`:
 * Odd sections get `data-band="primary"` (–page-bg), even get
 * `data-band="alt"` (–page-alt). globals.css targets these attributes to
 * apply background colours WITHOUT touching the sections themselves — so
 * section components don't need to know they're in a themed context.
 *
 * WHY NOT TAILWIND ARBITRARY SELECTORS ON THE WRAPPER:
 * `[&>section:nth-of-type(even)]` broke when `<div data-section-accent>`
 * wrapped one section (disrupting the nth-of-type count) and when sections
 * rendered null (leaving gaps in the sequence). The explicit data-band
 * approach is O(n) with no sibling-counting edge cases.
 *
 * SECTION ORDER — owner-controlled:
 * `theme.sections.order[]` is a list of section keys in the owner's chosen
 * sequence. Missing keys are appended in default order so documents written
 * before this field existed keep their original appearance.
 *
 * DENSITY — two presets: 'compact' / 'spacious'.
 * Drives `--section-py` and `--content-gap` via `buildThemeVariables`.
 * Every section reads those vars for padding and grid gap.
 *
 * PER-SECTION ACCENT — one section can use `--accent` instead of `--brand`.
 * `theme.accentSection` holds the key of that section. We wrap it in a
 * `<div data-section-accent="KEY">` and globals.css swaps all --brand tokens
 * to --accent for every element inside.
 *
 * HEADING CONTRAST — section headings inherit `--page-fg` via globals.css
 * rules that remap `text-slate-{700..900}` inside `[data-brand-style]`.
 * This is a CSS-layer solution — no component changes needed.
 *
 * CARD BACKGROUNDS — globals.css also remaps `.bg-white` inside sections to
 * `var(--page-card)`. On dark themes --page-card is the slightly lifted dark
 * surface; on light themes it's white. Zero-JS, zero component changes.
 */

/** The component rendered for each section key. */
const SECTION_MAP: Record<string, React.ComponentType<{ academy: any }>> = {
  programs: SportsGrid,
  stats: StatsSection,
  achievements: WhyChooseUs,
  gallery: GallerySection,
  testimonials: TestimonialsCarousel,
  video: VideoSection,
};

export default function AcademyPublicPage({ academy }: { academy: any }) {
  const theme = academy?.theme;
  const accentSection: string = theme?.accentSection ?? '';

  // Build the ordered list of section keys, respecting the owner's saved order
  // and appending any keys they haven't explicitly positioned yet.
  const savedOrder: string[] = theme?.sections?.order ?? [];
  const sectionOrder: string[] = [
    ...savedOrder.filter((k) => DEFAULT_SECTION_ORDER.includes(k as typeof DEFAULT_SECTION_ORDER[number])),
    ...DEFAULT_SECTION_ORDER.filter((k) => !savedOrder.includes(k)),
  ];

  // Rendered section count (for alternating band calculation). We track the
  // index of actually-rendered sections, not just the sectionOrder index, so
  // null sections don't leave gaps in the alternation.
  let renderedCount = 0;

  return (
    <AcademyTheme
      theme={theme}
      as="main"
      style={{
        background: "var(--page-bg)",
        color: "var(--page-fg)",
        display: "block",
      }}
    >
      {/* Hero always first — it is not a toggleable section. */}
      <HeroSection academy={academy} />

      {sectionOrder.map((key) => {
        // Skip sections the owner has disabled.
        if (theme?.sections?.[key] === false) return null;

        const Section = SECTION_MAP[key];
        if (!Section) return null;

        /**
         * Skip sections that will render nothing.
         *
         * Every section self-nulls when it has no genuine content, and this
         * used to count them anyway — so a gallery with no photos consumed a
         * band slot and the two sections after it came out the same colour,
         * meeting in a visible seam. `sectionWillRender` is the single place
         * that knows, shared with the sections themselves so the two cannot
         * disagree.
         */
        if (!sectionWillRender(key, academy)) return null;

        // Alternating band: primary (--page-bg) for even count, alt (--page-alt)
        // for odd. renderedCount is incremented AFTER we determine the band, so
        // the first visible section (count=0) is "primary" (the page default).
        const band = renderedCount % 2 === 0 ? 'primary' : 'alt';
        renderedCount++;

        const isAccented = Boolean(accentSection && accentSection === key);
        const section = <Section key={key} academy={academy} />;

        // Two optional wrappers:
        //   data-band  — applied to all sections for alternating background.
        //   data-section-accent — applied to the accent section to swap --brand→--accent.
        // We avoid nesting both in order of specificity: the accent wrapper goes
        // outside the band div so globals.css accent rules beat band rules.
        if (isAccented) {
          return (
            <div key={key} data-section-accent={key} data-band={band}>
              {section}
            </div>
          );
        }

        return (
          <div key={key} data-band={band}>
            {section}
          </div>
        );
      })}

      {/* Events timeline is outside the ordered set — it is driven by live
          event data rather than owner-curated theme content, so it renders
          itself as null when the academy has no upcoming events. */}
      <EventsTimeline academy={academy} />

      <Footer academy={academy} />
    </AcademyTheme>
  );
}
