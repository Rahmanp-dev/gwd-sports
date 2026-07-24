'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function EcoNavbar() {
  return (
    <motion.nav 
      initial={{ y: -100 }} 
      animate={{ y: 0 }} 
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-black/40 backdrop-blur-xl border-b border-[#1a1a24]"
    >
      <div className="flex items-center gap-2 font-['Clash_Display'] text-2xl font-bold tracking-wide">
        <span className="text-[#e63946]">GWD</span>
        <span className="text-white">SPORTS</span>
      </div>
      
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#" className="hover:text-white transition-colors">Ecosystem</a>
        <a href="#" className="hover:text-white transition-colors">Leagues</a>
        <a href="#" className="hover:text-white transition-colors">Rankings</a>
      </div>
      
      <button className="bg-[#e63946] hover:bg-[#ff4d5a] text-white px-6 py-2 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(230,57,70,0.3)]">
        Join GWD
      </button>
    </motion.nav>
  );
}
