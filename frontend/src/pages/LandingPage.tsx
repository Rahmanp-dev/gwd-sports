import React, { useEffect } from 'react';
import { Navigation } from '@/components/landing/Navigation';
import { HeroSection } from '@/components/landing/HeroSection';
import { SportsSection } from '@/components/landing/SportsSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { EventsSection } from '@/components/landing/EventsSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { Footer } from '@/components/landing/Footer';

export const LandingPage: React.FC = () => {
  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main>
        <HeroSection />
        <SportsSection />
        <TestimonialsSection />
        <EventsSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};