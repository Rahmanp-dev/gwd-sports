'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HeroOverlayProps {
  city: string;
  academyCount: number;
}

export default function HeroOverlay({ city, academyCount }: HeroOverlayProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  return (
    <motion.div 
      className="absolute top-1/4 left-8 md:left-16 z-20 max-w-xl pointer-events-none"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="text-[#e63946] text-xs tracking-[0.3em] uppercase font-bold mb-4">
        GWD SPORTS ECOSYSTEM
      </motion.div>
      
      <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl text-white font-['Clash_Display'] font-bold leading-tight mb-6">
        {city}'s<br/>Sports Grid
      </motion.h1>
      
      <motion.p variants={itemVariants} className="text-slate-400 text-base md:text-lg mb-8 max-w-md leading-relaxed">
        Every academy. Every student. One living ecosystem.
      </motion.p>
      
      <motion.div variants={itemVariants} className="flex items-center gap-4 pointer-events-auto">
        <button className="bg-[#e63946] hover:bg-[#ff4d5a] text-white rounded-full px-6 py-3 font-semibold transition-all shadow-[0_0_20px_rgba(230,57,70,0.4)]">
          Join the Ecosystem ⊕
        </button>
        <button className="border border-white/20 hover:bg-white/5 text-white rounded-full px-6 py-3 font-semibold transition-all">
          Watch Demo ▶
        </button>
      </motion.div>
      
      <motion.div variants={itemVariants} className="mt-12 flex items-center gap-3 text-sm text-slate-400 font-medium">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10b981]"></span>
        </span>
        {academyCount} academies live · {city} · Est. 2025
      </motion.div>
    </motion.div>
  );
}
