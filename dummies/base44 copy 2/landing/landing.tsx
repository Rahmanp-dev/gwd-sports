import React from "react";
import { motion } from "framer-motion";

import HeroSection from "../components/landing/HeroSection";
import SportsGrid from "../components/landing/SportsGrid";
import TestimonialsCarousel from "../components/landing/TestimonialsCarousel";
import EventsTimeline from "../components/landing/EventsTimeline";
import StatsSection from "../components/landing/StatsSection";
import WhyChooseUs from "../components/landing/WhyChooseUs";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <div className="relative bg-white overflow-hidden">
      <HeroSection />
      <SportsGrid />
      <WhyChooseUs />
      <StatsSection />
      <TestimonialsCarousel />
      <EventsTimeline />
      <Footer />
    </div>
  );
}