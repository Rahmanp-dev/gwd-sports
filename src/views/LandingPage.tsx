'use client';

import React, { useState, useEffect } from 'react';
import EcoNavbar from '@/components/ecosystem/EcoNavbar';
import EcosystemMap from '@/components/ecosystem/EcosystemMap';
import HeroOverlay from '@/components/ecosystem/HeroOverlay';
import StatsBar from '@/components/ecosystem/StatsBar';
import LeaderboardSidebar from '@/components/ecosystem/LeaderboardSidebar';

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
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a0f]">
      <EcoNavbar />
      <EcosystemMap
        academies={academies}
        selectedAcademy={selectedAcademy}
        onSelectAcademy={setSelectedAcademy}
      />
      <HeroOverlay
        city={stats.primaryCity || 'Hyderabad'}
        academyCount={stats.totalAcademies || 0}
      />
      <StatsBar
        academyCount={stats.totalAcademies || 0}
        sportsCount={stats.totalSports || 0}
        city={stats.primaryCity || 'Hyd'}
      />
      <LeaderboardSidebar
        academies={academies}
        selectedAcademy={selectedAcademy}
        onSelectAcademy={(academy) => setSelectedAcademy(academy)}
        onClose={() => setSelectedAcademy(null)}
      />
    </div>
  );
}
