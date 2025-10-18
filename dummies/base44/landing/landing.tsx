import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Mail, MapPin } from "lucide-react";

import HeroSection from "../components/landing/HeroSection";
import SportsGrid from "../components/landing/SportsGrid";
import TestimonialsCarousel from "../components/landing/TestimonialsCarousel";
import EventsTimeline from "../components/landing/EventsTimeline";
import StatsSection from "../components/landing/StatsSection";
import Footer from "../components/landing/Footer";

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="relative bg-white overflow-hidden">
      {/* Animated background gradient */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.15), transparent)",
          y: backgroundY,
        }}
      />

      <HeroSection />
      <SportsGrid />
      <StatsSection />
      <TestimonialsCarousel />
      <EventsTimeline />
      <Footer />
    </div>
  );
}