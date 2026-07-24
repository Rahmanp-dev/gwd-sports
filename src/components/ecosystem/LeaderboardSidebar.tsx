'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Trophy } from 'lucide-react';

interface LeaderboardSidebarProps {
  academies: any[];
  selectedAcademy: any | null;
  onSelectAcademy: (academy: any) => void;
  onClose: () => void;
}

const getSportColor = (sport: string) => {
  const colors: Record<string, string> = {
    football: '#10b981',
    cricket: '#3b82f6',
    badminton: '#f59e0b',
    basketball: '#8b5cf6',
    athletics: '#ef4444',
    tennis: '#06b6d4',
  };
  return colors[sport.toLowerCase()] || '#6b7280';
};

export default function LeaderboardSidebar({
  academies,
  selectedAcademy,
  onSelectAcademy,
  onClose
}: LeaderboardSidebarProps) {
  const [filterArea, setFilterArea] = useState<string>('All');

  const areas = useMemo(() => {
    const uniqueAreas = new Set<string>();
    academies.forEach(a => {
      if (a.location?.area) uniqueAreas.add(a.location.area);
    });
    return ['All', ...Array.from(uniqueAreas)];
  }, [academies]);

  const sortedAcademies = useMemo(() => {
    let filtered = academies;
    if (filterArea !== 'All') {
      filtered = filtered.filter(a => a.location?.area === filterArea);
    }
    return [...filtered].sort((a, b) => (b.ecosystemScore || 0) - (a.ecosystemScore || 0));
  }, [academies, filterArea]);

  return (
    <div className="absolute top-[73px] right-0 bottom-0 w-[360px] bg-[#111118]/95 backdrop-blur-xl border-l border-[#1a1a24] z-40 overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        {!selectedAcademy ? (
          <motion.div 
            key="leaderboard"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            <div className="p-6 border-b border-[#1a1a24]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-['Clash_Display'] font-bold tracking-wider text-sm">ACADEMY LEADERBOARD</h2>
                <div className="bg-[#e63946] text-white text-xs font-bold px-2 py-1 rounded">
                  {sortedAcademies.length}
                </div>
              </div>
              
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {areas.map(area => (
                  <button
                    key={area}
                    onClick={() => setFilterArea(area)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filterArea === area 
                        ? 'bg-white text-black' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {sortedAcademies.map((academy, index) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={academy._id || academy.slug || index}
                  onClick={() => onSelectAcademy(academy)}
                  className="flex items-center p-4 border-b border-[#1a1a24] hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <div className="w-8 flex justify-center text-slate-500 font-mono text-sm font-bold group-hover:text-white transition-colors">
                    {index === 0 ? <span className="text-[#f59e0b]">★</span> : index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0 px-3">
                    <div className="text-white font-bold truncate text-sm mb-1">{academy.name}</div>
                    <div className="flex flex-wrap gap-1">
                      {academy.sports?.slice(0, 2).map((sport: string) => (
                        <span 
                          key={sport} 
                          className="text-[9px] px-1.5 py-0.5 rounded text-white uppercase"
                          style={{ backgroundColor: getSportColor(sport) }}
                        >
                          {sport}
                        </span>
                      ))}
                      {academy.verificationStatus === 'founding' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#06b6d4] text-black font-bold uppercase">Founding</span>
                      )}
                      {academy.verificationStatus === 'verified' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#10b981] text-black font-bold uppercase">Verified</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-white font-bold font-mono text-sm">{academy.ecosystemScore || 0}</div>
                    <div className="text-[9px] text-slate-500 uppercase">Score</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="detail"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            <div className="relative p-6 border-b border-[#1a1a24] bg-gradient-to-b from-white/5 to-transparent">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="pr-8">
                {selectedAcademy.gwdFoundingAcademy && (
                  <div className="inline-block bg-[#06b6d4] text-black text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider mb-3">
                    GWD Founding Academy
                  </div>
                )}
                
                <h2 className="text-2xl text-white font-['Clash_Display'] font-bold leading-tight mb-2">
                  {selectedAcademy.name}
                </h2>
                
                <div className="flex items-center text-slate-400 text-xs mb-4">
                  <MapPin size={12} className="mr-1" />
                  {selectedAcademy.location?.address}, {selectedAcademy.location?.area}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedAcademy.sports?.map((sport: string) => (
                    <span 
                      key={sport} 
                      className="text-xs px-2 py-1 rounded text-white capitalize font-medium"
                      style={{ backgroundColor: getSportColor(sport) }}
                    >
                      {sport}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-slate-300 bg-black/40 p-3 rounded-lg border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px] uppercase">Students</span>
                    <span className="font-bold text-white">{selectedAcademy.studentCount || 0}</span>
                  </div>
                  <div className="w-px h-6 bg-white/10"></div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px] uppercase">Established</span>
                    <span className="font-bold text-white">{selectedAcademy.establishedYear || 'N/A'}</span>
                  </div>
                  <div className="w-px h-6 bg-white/10"></div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px] uppercase">Coach</span>
                    <span className="font-bold text-white truncate max-w-[80px]">{selectedAcademy.coachName || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedAcademy.achievements && selectedAcademy.achievements.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Trophy size={14} className="text-[#f59e0b]" /> Achievements
                  </h3>
                  <ul className="space-y-2">
                    {selectedAcademy.achievements.map((ach: string, i: number) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-[#f59e0b] mt-0.5">★</span> {ach}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">★ Star Players</h3>
                <div className="bg-black/20 rounded-lg p-4 border border-white/5 border-dashed text-center">
                  <span className="text-sm text-slate-600 font-medium">Coming soon</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Registered Teams</h3>
                <div className="bg-black/20 rounded-lg p-4 border border-white/5 border-dashed text-center">
                  <span className="text-sm text-slate-600 font-medium">Coming soon</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#1a1a24] bg-black/20">
              <a 
                href={`/${selectedAcademy.slug}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full py-3 bg-white/5 hover:bg-white/10 text-white text-center rounded-lg text-sm font-bold transition-colors"
              >
                View Full Profile →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
