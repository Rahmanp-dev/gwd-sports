'use client';

import React from 'react';
import HeroSection from "@/components/landing/HeroSection";
import SportsGrid from "@/components/landing/SportsGrid";
import TestimonialsCarousel from "@/components/landing/TestimonialsCarousel";
import EventsTimeline from "@/components/landing/EventsTimeline";
import StatsSection from "@/components/landing/StatsSection";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import Footer from "@/components/landing/Footer";

export default function AcademyPublicPage({ academy }: { academy: any }) {
  return (
    <div className="relative bg-white overflow-hidden">
      <HeroSection academy={academy} />
      <SportsGrid academy={academy} />
      <WhyChooseUs academy={academy} />
      <StatsSection academy={academy} />
      <TestimonialsCarousel academy={academy} />
      <EventsTimeline academy={academy} />
      <Footer academy={academy} />
    </div>
  );
}
