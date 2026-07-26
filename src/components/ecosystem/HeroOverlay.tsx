'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface HeroOverlayProps {
  city: string;
  academyCount: number;
  sportsCount: number;
}

export default function HeroOverlay({ city, academyCount, sportsCount }: HeroOverlayProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Hero Content (Top Left) */}
      <motion.div
        className="absolute top-[120px] left-6 md:left-14 max-w-lg"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-[#FF1744] text-[10px] tracking-[0.2em] font-medium uppercase mb-4">
          GWD SPORTS ECOSYSTEM
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-4xl md:text-[52px] font-['DM_Sans',sans-serif] font-extrabold leading-[1.15] text-white mb-4 tracking-tight">
          {city}&apos;s<br />Sports Grid
        </motion.h1>

        <motion.p variants={itemVariants} className="text-[#888899] text-base leading-[1.6] mb-8">
          Every academy. Every student. One living ecosystem.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mb-4 pointer-events-auto">
          <button className="flex items-center justify-center gap-2.5 bg-[#FF1744] hover:bg-[#ff2d55] text-white rounded-full px-6 py-3 text-[13px] font-semibold tracking-[0.02em] shadow-[0_4px_16px_rgba(255,23,68,0.2)] hover:shadow-[0_6px_24px_rgba(255,23,68,0.35)] transition-all group">
            Join the Ecosystem
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/12 text-white group-hover:bg-white group-hover:text-[#FF1744] group-hover:rotate-45 transition-all">⊕</span>
          </button>
          <button className="flex items-center justify-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-[#F0F0F0] hover:text-[#FF1744] border border-white/[0.08] hover:border-[#FF1744]/40 rounded-full px-6 py-3 text-[13px] font-semibold tracking-[0.02em] transition-all group">
            Watch Demo
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/12 text-white group-hover:bg-[#FF1744]/15 group-hover:text-[#FF1744] group-hover:scale-110 transition-all">▶</span>
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="text-[12px] text-[#555566]">
          {academyCount} academies live · {city} · Est. 2025
        </motion.div>
      </motion.div>

      {/* HUD stats strip (Bottom Left) */}
      <HudStrip academyCount={academyCount} sportsCount={sportsCount} city={city} />

      {/* Scroll indicator (Right Center) */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        <span className="writing-vertical-rl text-[10px] text-[#444455] tracking-[0.2em] uppercase">SCROLL</span>
        <div className="w-3 h-3 border-r-[1.5px] border-b-[1.5px] border-[#444455] rotate-45 animate-[scrollBounce_2s_infinite]" />
      </div>
    </div>
  );
}

/* ── HUD stat strip (bottom-left) ── */
function HudStrip({ academyCount, sportsCount, city }: { academyCount: number; sportsCount: number; city: string }) {
  const displayAcad = academyCount || 20;
  const displaySports = sportsCount || 7;
  const displayCity = (city && city.length >= 3 ? city : 'Hyderabad').slice(0, 3).toUpperCase();
  const [acadVal, acadRef] = useCountUp(displayAcad, 2000);
  const [sportVal, sportRef] = useCountUp(displaySports, 2000);

  return (
    <motion.div
      className="absolute bottom-[60px] left-6 md:left-14 bg-white/[0.015] border border-[#FF1744]/[0.08] rounded-[20px] p-1.5 shadow-[0_12px_35px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl pointer-events-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
    >
      <div className="flex gap-8 bg-[#050508]/80 px-6 py-3.5 border border-white/[0.04] rounded-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex flex-col gap-1.5 relative before:content-[''] before:w-8 before:h-[2px] before:bg-[#FF1744]" ref={acadRef as any}>
          <span className="text-[28px] font-semibold text-white leading-none font-mono">{acadVal}</span>
          <span className="text-[11px] text-[#666677] tracking-[0.1em] uppercase">Academies Live</span>
        </div>
        <div className="flex flex-col gap-1.5 relative before:content-[''] before:w-8 before:h-[2px] before:bg-[#FF1744]" ref={sportRef as any}>
          <span className="text-[28px] font-semibold text-white leading-none font-mono">{sportVal}</span>
          <span className="text-[11px] text-[#666677] tracking-[0.1em] uppercase">Sports</span>
        </div>
        <div className="flex flex-col gap-1.5 relative before:content-[''] before:w-8 before:h-[2px] before:bg-[#FF1744]">
          <span className="text-[28px] font-semibold text-white leading-none font-mono">{displayCity}</span>
          <span className="text-[11px] text-[#666677] tracking-[0.1em] uppercase">City</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── CountUp hook using rAF (matches reference) ── */
function useCountUp(end: number, duration = 2000) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (end === undefined || end === null) return;
    const target = end || 0;
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (now: number) => {
      if (!startTimestamp) startTimestamp = now;
      const progress = Math.min((now - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return [val, ref] as const;
}
