import { useEffect } from "react";
import { SectionHero } from "@/components/shared/SectionHero";
import { ProgramsSection } from "@/components/shared/ProgramsSection";
import { EventsSection } from "@/components/shared/EventsSection";
import { FeaturesGrid } from "@/components/shared/FeaturesGrid";
import { CategoriesSection } from "@/components/shared/CategoriesSection";
import { StatsBanner } from "@/components/shared/StatsBanner";
import { BasketballAnimation } from "@/components/shared/BasketballAnimation";
import Footer from "@/components/landing/Footer";
import {
  MGBC_HERO_DATA,
  MGBC_EVENTS,
  MGBC_FEATURES,
  MGBC_PROGRAMS,
  MGBC_TRAINING_FOCUS,
  MGBC_ACHIEVEMENTS,
} from "@/data/mgbcData";

export default function MGBCPage() {
  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Basketball Animation */}
      <div className="relative">
        <BasketballAnimation />
        <SectionHero
          title={MGBC_HERO_DATA.title}
          subtitle={MGBC_HERO_DATA.subtitle}
          description={MGBC_HERO_DATA.description}
          backgroundImage={MGBC_HERO_DATA.backgroundImage}
          icon={MGBC_HERO_DATA.icon}
          stats={MGBC_HERO_DATA.stats}
          accentColor="from-orange-500 to-red-500"
          ctaText="Join MGBC"
          secondaryCtaText="Book Free Trial"
        />
      </div>

      {/* Stats Banner */}
      <StatsBanner 
        stats={MGBC_ACHIEVEMENTS} 
        accentColor="from-orange-500 to-amber-500" 
      />

      {/* Training Focus Section */}
      <CategoriesSection
        title="Training Focus Areas"
        subtitle="Master The Game"
        categories={MGBC_TRAINING_FOCUS}
        accentColor="from-orange-500 to-amber-500"
        bgGradient="from-orange-500/20 to-amber-500/20"
      />

      {/* Programs Section */}
      <ProgramsSection
        title="Our Training Programs"
        subtitle="Find Your Level"
        programs={MGBC_PROGRAMS}
        icon="🏀"
        accentColor="from-orange-500 to-red-500"
      />

      {/* Events Section */}
      <EventsSection
        title="Upcoming Tournaments & Events"
        subtitle="Basketball Events"
        events={MGBC_EVENTS}
        accentColor="from-orange-500 to-red-500"
        bgGradient="from-orange-500/10 to-red-500/10"
      />

      {/* Features Section */}
      <FeaturesGrid
        title="The MGBC Advantage"
        subtitle="Why Choose MGBC"
        features={MGBC_FEATURES}
        accentColor="from-orange-500 to-red-500"
        bgGradient="from-orange-500/20 to-red-500/20"
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}