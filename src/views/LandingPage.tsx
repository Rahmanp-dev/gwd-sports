'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import EcoNavbar from '@/components/ecosystem/EcoNavbar';
import HeroOverlay from '@/components/ecosystem/HeroOverlay';
import AcademyGrid from '@/components/ecosystem/AcademyGrid';

import AcademyDetailSidebar from '@/components/ecosystem/AcademyDetailSidebar';
import HowItWorks from '@/components/ecosystem/HowItWorks';
import WhatItCosts from '@/components/ecosystem/WhatItCosts';
import PlatformFooter from '@/components/ecosystem/PlatformFooter';

const EcosystemMap = dynamic(() => import('@/components/ecosystem/EcosystemMap'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: '#050508' }} />,
});

export default function LandingPage() {
  const [academies, setAcademies] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [selectedAcademy, setSelectedAcademy] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/academy/discover');
        const data = await res.json();
        if (data.success) {
          setAcademies(data.data.academies);
          setStats(data.data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch academies:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-[#050508] min-h-screen text-white font-['DM_Sans',sans-serif] selection:bg-[#ff1744]/30 selection:text-white">
      <EcoNavbar />

      {/* Hero Section (Map) */}
      <div className="relative w-full h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <EcosystemMap
            academies={academies}
            selectedAcademy={selectedAcademy}
            onSelectAcademy={setSelectedAcademy}
          />
        </div>

        {/* Atmospheric overlays */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,5,8,0.7)_100%)]" />
        <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E")' }} />

        {/* Hero Content */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Real counts only. These were `|| 20` and `|| 7`, so an empty or
              failed stats response advertised twenty academies and seven
              sports on the public homepage. The same fabrication was inside
              HeroOverlay and was removed there; this call site still had it. */}
          <HeroOverlay
            city="Hyderabad"
            academyCount={stats.totalAcademies ?? 0}
            sportsCount={stats.totalSports ?? 0}
          />
        </div>
      </div>

      {/* Main Content Section (Scrolls up over the map) */}
      <div className="relative z-30 bg-[#050508] border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
        <AcademyGrid academies={academies} stats={stats} />

        {/* Why the platform exists, the flywheel, and how an academy joins.
            Below discovery on purpose: you see the academies first, then learn
            what you are looking at. */}
        <HowItWorks />

        {/* The commercial answer, the commitments, the roadmap, and what a
            student gets. Placed after HowItWorks because that section earns the
            interest and this one converts it: an owner who has just understood
            the loop immediately wants to know what it costs and what happens to
            their data. Ordered academy-first — the academy signs up, the
            student benefits. */}
        <WhatItCosts />

        <PlatformFooter />
      </div>

      {/* Map Pin Selected Academy Detail Sidebar */}
      <AcademyDetailSidebar
        selectedAcademy={selectedAcademy}
        onClose={() => setSelectedAcademy(null)}
      />
    </div>
  );
}
