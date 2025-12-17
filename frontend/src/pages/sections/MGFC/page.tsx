import { useEffect } from "react";
import { SectionHero } from "@/components/shared/SectionHero";
import { ProgramsSection } from "@/components/shared/ProgramsSection";
import { EventsSection } from "@/components/shared/EventsSection";
import { FeaturesGrid } from "@/components/shared/FeaturesGrid";
import Footer from "@/components/landing/Footer";
import {
  MGFC_HERO_DATA,
  MGFC_EVENTS,
  MGFC_FEATURES,
  MGFC_PROGRAMS,
} from "@/utils/data/mgfcData";

export default function MGFCPage() {
  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <SectionHero
        title={MGFC_HERO_DATA.title}
        subtitle={MGFC_HERO_DATA.subtitle}
        description={MGFC_HERO_DATA.description}
        backgroundImage={MGFC_HERO_DATA.backgroundImage}
        icon={MGFC_HERO_DATA.icon}
        stats={MGFC_HERO_DATA.stats}
        accentColor="from-green-500 to-emerald-500"
        ctaText="Join MGFC"
        secondaryCtaText="Book Trial"
      />

      {/* Programs Section */}
      {/* <ProgramsSection
        title="Our Training Programs"
        subtitle="Choose Your Path"
        programs={MGFC_PROGRAMS}
        icon="⚽"
      /> */}

      {/* Events Section */}
      <EventsSection
        title="Upcoming & Tournaments"
        subtitle="Football Events"
        events={MGFC_EVENTS}
        accentColor="from-green-500 to-emerald-500"
        bgGradient="from-green-500/10 to-emerald-500/10"
      />

      {/* Features Section */}
      <FeaturesGrid
        title="The MGFC Advantage"
        subtitle="Why Choose MGFC"
        features={MGFC_FEATURES}
        accentColor="from-green-500 to-emerald-500"
        bgGradient="from-green-500/20 to-emerald-500/20"
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
