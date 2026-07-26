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
        className="absolute top-[88px] md:top-[120px] left-5 right-5 md:left-14 md:right-auto max-w-lg"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-[#FF1744] text-[9px] md:text-[10px] tracking-[0.2em] font-medium uppercase mb-2 md:mb-4">
          GWD SPORTS ECOSYSTEM
        </motion.div>

        {/* Smaller on a phone on purpose: this sits on top of the live map,
            and at the old 4xl the headline plus buttons covered most of it.
            The map is the point of the page — the copy should frame it, not
            bury it. */}
        <motion.h1 variants={itemVariants} className="text-[28px] md:text-[52px] font-['DM_Sans',sans-serif] font-extrabold leading-[1.1] text-white mb-2 md:mb-4 tracking-tight">
          {city}&apos;s<br />Sports Grid
        </motion.h1>

        <motion.p variants={itemVariants} className="text-[#888899] text-[13px] md:text-base leading-[1.5] md:leading-[1.6] mb-4 md:mb-8">
          Every academy. Every student. One living ecosystem.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-wrap gap-2 md:gap-3 mb-3 md:mb-4 pointer-events-auto">
          {/* Goes to the onboarding section further down the page, which is
              where an academy owner actually learns how to join and finds the
              phone/WhatsApp/email. It was previously an inert <button>. */}
          <a
            href="#onboard"
            className="flex items-center justify-center gap-2.5 bg-[#FF1744] hover:bg-[#ff2d55] text-white rounded-full px-4 md:px-6 py-2 md:py-3 text-[12px] md:text-[13px] font-semibold tracking-[0.02em] shadow-[0_4px_16px_rgba(255,23,68,0.2)] hover:shadow-[0_6px_24px_rgba(255,23,68,0.35)] transition-all group"
          >
            Join the Ecosystem
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/12 text-white group-hover:bg-white group-hover:text-[#FF1744] group-hover:rotate-45 transition-all">⊕</span>
          </a>
          <button className="flex items-center justify-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-[#F0F0F0] hover:text-[#FF1744] border border-white/[0.08] hover:border-[#FF1744]/40 rounded-full px-4 md:px-6 py-2 md:py-3 text-[12px] md:text-[13px] font-semibold tracking-[0.02em] transition-all group">
            Watch Demo
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/12 text-white group-hover:bg-[#FF1744]/15 group-hover:text-[#FF1744] group-hover:scale-110 transition-all">▶</span>
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="text-[11px] md:text-[12px] text-[#555566]">
          {academyCount} academies live · {city} · Est. 2025
        </motion.div>
      </motion.div>

      {/* HUD stats strip (Bottom Left) */}
      <HudStrip academyCount={academyCount} sportsCount={sportsCount} city={city} />

      {/* Scroll indicator — vertical on desktop, where there is side room. */}
      <div className="absolute right-10 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-2 md:flex">
        <span className="writing-vertical-rl text-[10px] text-[#444455] tracking-[0.2em] uppercase">SCROLL</span>
        <div className="w-3 h-3 border-r-[1.5px] border-b-[1.5px] border-[#444455] rotate-45 animate-[scrollBounce_2s_infinite]" />
      </div>

      {/**
       * Mobile scroll cue, centred under the HUD.
       *
       * The desktop indicator is pinned to the right edge and hidden below
       * `md`, so on a phone — where the map fills the screen with no visible
       * edge of the content beneath — there was nothing at all telling the
       * reader the page continues.
       */}
      <button
        type="button"
        onClick={() =>
          window.scrollTo({ top: window.innerHeight * 0.95, behavior: 'smooth' })
        }
        aria-label="Scroll down to see more"
        className="pointer-events-auto absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-col items-center gap-0.5 text-[#8b8b99] transition-colors hover:text-white md:hidden"
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em]">
          Scroll down
        </span>
        <span className="h-2.5 w-2.5 rotate-45 border-b-[1.5px] border-r-[1.5px] border-current animate-[scrollBounce_2s_infinite]" />
      </button>
    </div>
  );
}

/* ── HUD stat strip (bottom-left) ── */
function HudStrip({ academyCount, sportsCount, city }: { academyCount: number; sportsCount: number; city: string }) {
  /**
   * Real counts, or nothing.
   *
   * These used to fall back to `|| 20` and `|| 7` — so an empty or failed API
   * response advertised "20 academies live, 7 sports" on the public homepage.
   * That is a fabricated claim about the size of the business, shown to the
   * academies and parents being asked to trust it, and it is the same mistake
   * as the invented testimonials that used to sit further down this page.
   *
   * Zero is a true statement. Twenty is not.
   */
  const displayAcad = Number.isFinite(academyCount) ? academyCount : 0;
  const displaySports = Number.isFinite(sportsCount) ? sportsCount : 0;
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
    const target = Number.isFinite(end) ? end : 0;

    /**
     * THE NUMBER MUST NEVER BE STUCK AT ZERO.
     *
     * requestAnimationFrame does not fire in a background tab, and browsers
     * throttle or suspend it under low-power mode. This animation started at 0
     * and only reached `target` by running frames — so a visitor who opened the
     * page in a background tab and switched to it later saw a permanent "0
     * ACADEMIES LIVE". The headline count beside it said 2. The animation is
     * decoration; the number is a fact, and the fact has to survive the
     * decoration failing.
     *
     * Also honours prefers-reduced-motion, which is what that setting is for.
     */
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || document.visibilityState !== 'visible') {
      setVal(target);
      return;
    }

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

    // Belt and braces: if frames never arrive, land on the real number anyway.
    const settle = setTimeout(() => setVal(target), duration + 300);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(settle);
    };
  }, [end, duration]);

  return [val, ref] as const;
}
