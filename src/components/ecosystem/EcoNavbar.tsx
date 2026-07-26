'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function EcoNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, x: '-50%' }}
      animate={{ y: 0, x: '-50%' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      /**
       * `gap-3` + shrink rules matter here. Logo, links and CTA together are
       * wider than the pill on a phone, so the row used to overflow its own
       * rounded container — the CTA sat half outside the border and the links
       * collided with the wordmark. The links hide below `sm`, where they have
       * no room, and the two things that must always be reachable — the
       * wordmark and the join button — stay.
       */
      className={`fixed top-4 sm:top-6 left-1/2 z-50 flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 sm:py-3 w-[92%] max-w-4xl rounded-full transition-all duration-300 border ${
        scrolled
          ? 'bg-black/70 backdrop-blur-3xl border-[#FF1744]/30 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(255,23,68,0.2)]'
          : 'bg-black/40 backdrop-blur-[24px] border-[#FF1744]/20 shadow-[0_8px_25px_rgba(0,0,0,0.5),0_0_15px_rgba(255,23,68,0.15)]'
      }`}
    >
      <a
        href="/"
        className="flex flex-shrink-0 items-center gap-1.5 font-['DM_Sans',sans-serif] text-base sm:text-lg font-bold tracking-wider text-white"
      >
        <span className="text-[#FF1744]">GWD</span>
        <span>SPORTS</span>
      </a>

      {/* No room for these on a phone; they are duplicated in the page below. */}
      <div className="hidden items-center gap-6 text-xs font-medium text-[#888899] sm:flex">
        <a href="#" className="hover:text-white transition-colors">Ecosystem</a>
        <a href="/rankings" className="hover:text-white transition-colors">Leagues</a>
        <a href="/rankings" className="hover:text-white transition-colors">Rankings</a>
      </div>

      {/**
       * "Login", not "Join GWD".
       *
       * This links to /user/auth, which is a sign-in screen — an academy owner
       * who read "Join GWD" and landed there could not join anything, because
       * onboarding is done with the team rather than self-serve. Joining is the
       * hero CTA and the onboarding section; this is for people who already
       * have an account.
       */}
      <a
        href="/user/auth"
        className="flex-shrink-0 whitespace-nowrap border border-[#FF1744]/60 bg-[#FF1744]/10 hover:bg-[#FF1744] text-[#FF1744] hover:text-white px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shadow-[0_0_12px_rgba(255,23,68,0.2)]"
      >
        Login
      </a>
    </motion.nav>
  );
}
