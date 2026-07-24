'use client';

import React, { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';

interface StatsBarProps {
  academyCount: number;
  sportsCount: number;
  city: string;
}

const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
      ease: "easeOut" as const
    });
    return controls.stop;
  }, [value]);

  return <>{displayValue}</>;
};

export default function StatsBar({ academyCount, sportsCount, city }: StatsBarProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="absolute bottom-8 left-8 z-20 bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-[#1a1a24]"
    >
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <span className="text-4xl font-bold font-mono text-white tracking-tighter">
            <AnimatedNumber value={academyCount} />
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
            Academies Live
          </span>
        </div>
        
        <div className="w-px h-12 bg-white/10"></div>
        
        <div className="flex flex-col">
          <span className="text-4xl font-bold font-mono text-white tracking-tighter">
            <AnimatedNumber value={sportsCount} />
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
            Sports
          </span>
        </div>
        
        <div className="w-px h-12 bg-white/10"></div>
        
        <div className="flex flex-col">
          <span className="text-4xl font-bold font-mono text-white tracking-tighter uppercase">
            {city.slice(0, 3)}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
            City
          </span>
        </div>
      </div>
    </motion.div>
  );
}
