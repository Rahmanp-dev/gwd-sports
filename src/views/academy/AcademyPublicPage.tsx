'use client';

import React from 'react';
import HeroSection from "@/components/landing/HeroSection";
import SportsGrid from "@/components/landing/SportsGrid";
import TestimonialsCarousel from "@/components/landing/TestimonialsCarousel";
import EventsTimeline from "@/components/landing/EventsTimeline";
import StatsSection from "@/components/landing/StatsSection";
import GallerySection from "@/components/landing/GallerySection";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import Footer from "@/components/landing/Footer";
import AcademyTheme from "@/components/branding/AcademyTheme";

/**
 * An academy's public homepage.
 *
 * Everything inside `AcademyTheme` inherits that academy's brand through CSS
 * custom properties. Sections still take the `academy` prop for their CONTENT —
 * name, images, events — but no longer for their COLOUR, which is what the
 * previous arrangement got wrong: only two of these seven ever read the theme.
 *
 * SECTIONS REMOVE THEMSELVES. Each one below returns null when the owner has
 * switched it off in `theme.sections`, or when it has no real content to show.
 * That decision lives inside each section rather than here, so a section can
 * never be rendered into a state it has nothing to fill — which is how the
 * disciplines grid ended up advertising Model UN on football academies.
 */
export default function AcademyPublicPage({ academy }: { academy: any }) {
  return (
    <AcademyTheme
      theme={academy?.theme}
      className="relative overflow-hidden [&_section]:!bg-transparent"
      style={{ background: "var(--page-bg)", color: "var(--page-fg)" }}
    >
      <HeroSection academy={academy} />
      <SportsGrid academy={academy} />
      <WhyChooseUs academy={academy} />
      <StatsSection academy={academy} />
      <GallerySection academy={academy} />
      <TestimonialsCarousel academy={academy} />
      <EventsTimeline academy={academy} />
      <Footer academy={academy} />
    </AcademyTheme>
  );
}
