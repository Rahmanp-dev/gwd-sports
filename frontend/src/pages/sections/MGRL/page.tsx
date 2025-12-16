import { useEffect } from "react";
import { SectionHero } from "@/components/shared/SectionHero";
import { ProgramsSection } from "@/components/shared/ProgramsSection";
import { EventsSection } from "@/components/shared/EventsSection";
import { FeaturesGrid } from "@/components/shared/FeaturesGrid";
import { CategoriesSection } from "@/components/shared/CategoriesSection";
import { StatsBanner } from "@/components/shared/StatsBanner";
import Footer from "@/components/landing/Footer";
import {
  MGRL_HERO_DATA,
  MGRL_EVENTS,
  MGRL_FEATURES,
  MGRL_PROGRAMS,
  MGRL_RACING_CATEGORIES,
} from "@/data/mgrlData";
import { Trophy, Users, Target, Award } from "lucide-react";

export default function MGRLPage() {
  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);

  // Stats for banner
  const racingStats = [
    {
      icon: Trophy,
      value: "24",
      label: "Championships",
      gradient: "from-amber-500 to-yellow-500",
    },
    {
      icon: Users,
      value: "200+",
      label: "Active Racers",
      gradient: "from-yellow-500 to-amber-500",
    },
    {
      icon: Target,
      value: "95%",
      label: "Safety Rate",
      gradient: "from-orange-500 to-amber-500",
    },
    {
      icon: Award,
      value: "50+",
      label: "Podium Finishes",
      gradient: "from-red-500 to-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <SectionHero
        title={MGRL_HERO_DATA.title}
        subtitle={MGRL_HERO_DATA.subtitle}
        description={MGRL_HERO_DATA.description}
        backgroundImage={MGRL_HERO_DATA.backgroundImage}
        icon={MGRL_HERO_DATA.icon}
        stats={MGRL_HERO_DATA.stats}
        accentColor="from-amber-500 to-yellow-500"
        ctaText="Join MGRL"
        secondaryCtaText="Book Test Drive"
      />

      {/* Stats Banner */}
      <StatsBanner
        stats={racingStats}
        accentColor="from-amber-500 to-yellow-500"
      />

      {/* Racing Categories Section */}
      <CategoriesSection
        title="Racing Categories"
        subtitle="Choose Your Track"
        categories={MGRL_RACING_CATEGORIES}
        accentColor="from-amber-500 to-yellow-500"
        bgGradient="from-amber-500/20 to-yellow-500/20"
      />

      {/* Programs Section */}
      {/* <ProgramsSection
        title="Our Training Programs"
        subtitle="Develop Your Skills"
        programs={MGRL_PROGRAMS}
        icon="🏁"
      /> */}

      {/* Events Section */}
      <EventsSection
        title="Upcoming Championships & Events"
        subtitle="Racing Events"
        events={MGRL_EVENTS}
        accentColor="from-amber-500 to-yellow-500"
        bgGradient="from-amber-500/10 to-yellow-500/10"
      />

      {/* Features Section */}
      <FeaturesGrid
        title="The MGRL Advantage"
        subtitle="Why Choose MGRL"
        features={MGRL_FEATURES}
        accentColor="from-amber-500 to-yellow-500"
        bgGradient="from-amber-500/20 to-yellow-500/20"
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
