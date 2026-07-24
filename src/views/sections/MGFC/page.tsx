"use client";
import { useEffect } from "react";
import { useNavigate } from "@/lib/router-shim";
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
import StatsSection from "@/components/landing/StatsSection";

export default function MGFCPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <SectionHero
        title={MGFC_HERO_DATA.title}
        subtitle={MGFC_HERO_DATA.subtitle}
        description=""
        backgroundImage={MGFC_HERO_DATA.backgroundImage}
        icon={MGFC_HERO_DATA.icon}
        logo="/logos/mgfc.png"
        stats={MGFC_HERO_DATA.stats}
        accentColor="from-amber-400 to-yellow-500"
        ctaText="Join MGFC"
        secondaryCtaText="Book Trial"
        onCtaClick={() => navigate("/mgfc/student/register")}
      />

      <StatsSection />

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
        accentColor="from-amber-400 to-yellow-500"
        bgGradient="from-amber-500/10 to-yellow-500/10"
      />

      {/* Features Section */}
      <FeaturesGrid
        title="The MGFC Advantage"
        subtitle="Why Choose MGFC"
        features={MGFC_FEATURES}
        accentColor="from-amber-400 to-yellow-500"
        bgGradient="from-amber-500/20 to-yellow-500/20"
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
