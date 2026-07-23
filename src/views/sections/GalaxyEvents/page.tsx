"use client";
import { useEffect } from "react";
import { SectionHero } from "@/components/shared/SectionHero";
import { ProgramsSection } from "@/components/shared/ProgramsSection";
import { EventsSection } from "@/components/shared/EventsSection";
import { FeaturesGrid } from "@/components/shared/FeaturesGrid";
import { CategoriesSection } from "@/components/shared/CategoriesSection";
import { StatsBanner } from "@/components/shared/StatsBanner";
import { FeaturedEventsShowcase } from "@/components/shared/FeaturedEventsShowcase";
import Footer from "@/components/landing/Footer";
import {
  GALAXY_EVENTS_HERO_DATA,
  GALAXY_MAJOR_EVENTS,
  GALAXY_FEATURES,
  GALAXY_EVENT_TYPES,
  GALAXY_EVENT_CATEGORIES,
  GALAXY_STATS,
  UPCOMING_HIGHLIGHTS,
} from "@/utils/data/galaxyEventsData";

export default function GalaxyEventsPage() {
  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <SectionHero
        title={GALAXY_EVENTS_HERO_DATA.title}
        subtitle={GALAXY_EVENTS_HERO_DATA.subtitle}
        description={GALAXY_EVENTS_HERO_DATA.description}
        backgroundImage={GALAXY_EVENTS_HERO_DATA.backgroundImage}
        icon={GALAXY_EVENTS_HERO_DATA.icon}
        logo="/logos/galaxy-events.png"
        stats={GALAXY_EVENTS_HERO_DATA.stats}
        accentColor="from-blue-500 to-slate-100"
        ctaText="View Events"
        secondaryCtaText="Register Interest"
      />

      {/* Stats Banner */}
      <StatsBanner
        stats={GALAXY_STATS}
        accentColor="from-purple-500 to-indigo-500"
      />

      {/* Featured Upcoming Events */}
      <FeaturedEventsShowcase
        events={UPCOMING_HIGHLIGHTS}
        title="Upcoming Highlights"
        subtitle="Don't Miss Out"
        accentColor="from-purple-500 to-fuchsia-500"
      />

      {/* Event Categories Section */}
      <CategoriesSection
        title="Event Categories"
        subtitle="Explore Our Events"
        categories={GALAXY_EVENT_CATEGORIES}
        accentColor="from-purple-500 to-indigo-500"
        bgGradient="from-purple-500/20 to-indigo-500/20"
      />

      {/* All Major Events */}
      <EventsSection
        title="Major Events Calendar"
        subtitle="Annual Events"
        events={GALAXY_MAJOR_EVENTS}
        accentColor="from-purple-500 to-indigo-500"
        bgGradient="from-purple-500/10 to-indigo-500/10"
      />

      {/* Event Types Section */}
      {/* <ProgramsSection
        title="Types of Events"
        subtitle="For Everyone"
        programs={GALAXY_EVENT_TYPES}
        icon="🌟"
        accentColor="from-purple-500 to-indigo-500"
      /> */}

      {/* Features Section */}
      <FeaturesGrid
        title="The Galaxy Experience"
        subtitle="Why Attend Our Events"
        features={GALAXY_FEATURES}
        accentColor="from-purple-500 to-indigo-500"
        bgGradient="from-purple-500/20 to-indigo-500/20"
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
