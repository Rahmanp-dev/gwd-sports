'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AcademyGridProps {
  academies: any[];
  stats: any;
}

export default function AcademyGrid({ academies, stats }: AcademyGridProps) {
  // Compute total students across all academies
  const totalStudents = academies.reduce((acc, curr) => acc + (curr.studentCount || 0), 0);
  const foundingCount = academies.filter(a => a.verificationStatus === 'founding' || a.gwdFoundingAcademy).length;

  return (
    <div className="w-full bg-[#050508] relative pt-16 pb-32 px-6 md:px-14">
      {/* ── Stats Banner ── */}
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between md:justify-around gap-10 mb-32 pt-8 border-t border-white/[0.04]">
        <StatItem value={foundingCount || 20} label="Founding Academies" />
        <StatItem value={totalStudents || 1345} label="Student Athletes" />
        <StatItem value={stats?.totalSports || 7} label="Sports Live" />
        <StatItem value={2025} label="Established" />
      </div>

      {/* ── Grid Header ── */}
      <div className="max-w-6xl mx-auto mb-16">
        <div className="text-[#FF1744] text-[10px] tracking-[0.2em] font-medium uppercase mb-4">
          LIVE ACADEMIES
        </div>
        <h2 className="text-4xl md:text-5xl font-['Clash_Display'] font-bold text-white mb-6">
          {stats?.primaryCity || 'Hyderabad'}&apos;s Founding Ecosystem
        </h2>
        <p className="text-[#888899] max-w-2xl text-[15px] leading-relaxed">
          The first academies to join the GWD network. Every student they train is now part of something bigger.
        </p>
      </div>

      {/* ── Grid of Cards ── */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {academies.map((academy, idx) => (
          <AcademyCard key={academy._id || academy.slug || idx} academy={academy} index={idx} />
        ))}
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-[2px] bg-[#FF1744] mb-2" />
      <div className="text-4xl md:text-5xl font-semibold text-white font-mono leading-none tracking-tight">
        {value}
      </div>
      <div className="text-[10px] text-[#555566] tracking-[0.15em] uppercase font-medium mt-1">
        {label}
      </div>
    </div>
  );
}

function AcademyCard({ academy, index }: { academy: any; index: number }) {
  const isFounding = academy.verificationStatus === 'founding' || academy.gwdFoundingAcademy;
  
  // Sort out some default display values
  const sport = Array.isArray(academy.sports) && academy.sports.length > 0 ? academy.sports[0] : 'Multi-sport';
  const area = academy.location?.area || academy.location || 'Hyderabad';
  const isMastergrade = academy.name && /master\s*grade/i.test(academy.name);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative flex flex-col justify-between p-8 bg-[#0a0a0f] border border-white/[0.04] rounded-2xl overflow-hidden hover:border-[#FF1744]/20 transition-all cursor-pointer"
    >
      {/* Subtle hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF1744]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Top badge */}
        {isFounding && (
          <div className="inline-block border border-[#FF1744]/30 bg-[#FF1744]/10 text-[#FF1744] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-6">
            GWD FOUNDING MEMBER
          </div>
        )}

        {/* Title */}
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {academy.name}
          </h3>
          {isMastergrade && (
            <span className="flex items-center justify-center bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#f59e0b] text-[10px] font-bold px-1.5 py-0.5 rounded">
              #1
            </span>
          )}
        </div>

        {/* Subtitle */}
        <div className="text-[13px] text-[#666677] mb-8 capitalize">
          {sport} · {area}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Middle stats row */}
        <div className="flex items-center justify-between text-[13px] text-[#888899]">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            {academy.studentCount || 0} students
          </div>
          <div className="text-right">
            Hyderabad, TG
          </div>
        </div>

        {/* Bottom ratings row */}
        <div className="pt-6 border-t border-white/[0.04] flex flex-col gap-2">
          <div className="text-[9px] text-[#444455] font-bold uppercase tracking-[0.2em]">
            GWD RATING
          </div>
          <div className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF1744" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF1744" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF1744" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          {isFounding && (
            <div className="text-[10px] text-[#FF1744] mt-1 font-medium">
              Verified — Founding Academy
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
