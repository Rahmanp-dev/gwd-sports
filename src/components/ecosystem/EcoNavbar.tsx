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
      className={`fixed top-6 left-1/2 z-50 flex items-center justify-between px-6 py-3 w-[92%] max-w-4xl rounded-full transition-all duration-300 border ${
        scrolled
          ? 'bg-black/70 backdrop-blur-3xl border-[#FF1744]/30 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(255,23,68,0.2)]'
          : 'bg-black/40 backdrop-blur-[24px] border-[#FF1744]/20 shadow-[0_8px_25px_rgba(0,0,0,0.5),0_0_15px_rgba(255,23,68,0.15)]'
      }`}
    >
      <a href="/" className="flex items-center gap-1.5 font-['Playfair_Display',Georgia,serif] font-bold text-lg tracking-wider text-white">
        <span className="text-[#FF1744]">GWD</span>
        <span>SPORTS</span>
      </a>

      <div className="flex items-center gap-6 text-xs font-medium text-[#888899]">
        <a href="#" className="hover:text-white transition-colors">Ecosystem</a>
        <a href="/rankings" className="hover:text-white transition-colors">Leagues</a>
        <a href="/rankings" className="hover:text-white transition-colors">Rankings</a>
      </div>

      <a
        href="#"
        className="border border-[#FF1744]/60 bg-[#FF1744]/10 hover:bg-[#FF1744] text-[#FF1744] hover:text-white px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shadow-[0_0_12px_rgba(255,23,68,0.2)]"
      >
        Join GWD
      </a>
    </motion.nav>
  );
}
