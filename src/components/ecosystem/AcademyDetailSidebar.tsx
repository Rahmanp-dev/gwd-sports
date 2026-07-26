'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, ExternalLink } from 'lucide-react';

interface AcademyDetailSidebarProps {
  selectedAcademy: any | null;
  onClose: () => void;
}

export default function AcademyDetailSidebar({ selectedAcademy, onClose }: AcademyDetailSidebarProps) {
  if (!selectedAcademy) return null;

  const isFounding = selectedAcademy.verificationStatus === 'founding' || selectedAcademy.gwdFoundingAcademy;
  const sports = Array.isArray(selectedAcademy.sports) && selectedAcademy.sports.length > 0
    ? selectedAcademy.sports
    : ['CRICKET', 'FOOTBALL', 'BADMINTON'];
  const area = selectedAcademy.location?.area || (typeof selectedAcademy.location === 'string' ? selectedAcademy.location.split(',')[0] : 'Kukatpally');
  const isMastergrade = selectedAcademy.name && /master\s*grade/i.test(selectedAcademy.name);

  // Fallback star players if not set in DB
  const starPlayers = selectedAcademy.starPlayers && selectedAcademy.starPlayers.length > 0
    ? selectedAcademy.starPlayers
    : [
        { name: 'Rohit Sharma K', role: 'State U-16 Selection', badge: 'STATE', type: 'state' },
        { name: 'Aditya Varma', role: 'District MVP 2025', badge: 'DISTRICT', type: 'district' }
      ];

  // Fallback registered teams if not set in DB
  const registeredTeams = selectedAcademy.registeredTeams && selectedAcademy.registeredTeams.length > 0
    ? selectedAcademy.registeredTeams
    : [
        { name: 'MG Thunderbolts', category: 'U-14 · W12-L3', winRate: '80%' },
        { name: 'MG Strikers FC', category: 'U-17 · W8-L5', winRate: '62%' }
      ];

  // Achievements
  const achievements = selectedAcademy.achievements && selectedAcademy.achievements.length > 0
    ? selectedAcademy.achievements
    : ['District Semifinalist'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[420px] bg-[#050508]/50 backdrop-blur-[32px] border-l border-white/[0.08] shadow-[-20px_0_60px_rgba(0,0,0,0.85)] flex flex-col justify-between overflow-hidden text-white font-['DM_Sans',sans-serif]"
      >
        {/* Scrollable Content Container */}
        <div className="p-6 md:p-7 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {/* Top Row: Title & Close Button */}
          <div className="flex items-start justify-between gap-4 pt-1">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-[27px] font-bold font-['DM_Sans',sans-serif] text-white tracking-tight leading-[1.2]">
                {selectedAcademy.name}
              </h2>
              {isMastergrade && (
                <div className="inline-block bg-[#c2410c] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-[0_2px_10px_rgba(194,65,12,0.5)]">
                  #1
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-[#FF1744]/20 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all shrink-0 backdrop-blur-md"
              aria-label="Close panel"
            >
              <X size={15} />
            </button>
          </div>

          {/* Tags Row */}
          <div className="flex flex-wrap items-center gap-2">
            {sports.map((sport: string) => (
              <span
                key={sport}
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#3f0713]/80 backdrop-blur-md border border-[#7f1d1d] text-[#ff2d55]"
              >
                {sport}
              </span>
            ))}
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10 text-slate-300 backdrop-blur-md">
              {area}
            </span>
          </div>

          {/* Red Stars Rating */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#FF1744" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#FF1744" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#FF1744" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>

          {/* Founding Badge */}
          {isFounding && (
            <div className="inline-block bg-[#580a14]/80 backdrop-blur-md border border-[#831826] text-[#ff2d55] text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-md">
              GWD FOUNDING ACADEMY
            </div>
          )}

          {/* Achievements */}
          {achievements && achievements.length > 0 && (
            <div className="space-y-1.5">
              {achievements.map((ach: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-[#f59e0b]">
                  <span>★</span>
                  <span>{ach}</span>
                </div>
              ))}
            </div>
          )}

          {/* Glassmorphic Stats Box */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-slate-300 font-medium flex items-center gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span>{selectedAcademy.studentCount || 45} students</span>
            <span className="text-white/20">•</span>
            <span>Est. {selectedAcademy.establishedYear || 2024}</span>
          </div>

          <div className="h-px bg-white/[0.06] my-2" />

          {/* Star Players Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#f59e0b]">
              <span>★</span>
              <span>STAR PLAYERS</span>
            </div>

            <div className="space-y-2.5">
              {starPlayers.map((player: any, idx: number) => {
                const isCyan = player.type === 'district' || (player.badge && player.badge.toLowerCase().includes('district'));
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.025] backdrop-blur-xl border border-white/[0.07] hover:border-white/15 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1f152d]/80 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                        {player.name ? player.name.charAt(0) : 'P'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{player.name}</div>
                        <div className="text-[10px] text-slate-400">{player.role}</div>
                      </div>
                    </div>
                    {player.badge && (
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                        isCyan 
                          ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10' 
                          : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                      }`}>
                        {player.badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registered Teams Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              <Swords size={13} className="text-[#FF1744]" />
              <span>REGISTERED TEAMS</span>
            </div>

            <div className="space-y-2.5">
              {registeredTeams.map((team: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.025] backdrop-blur-xl border border-white/[0.07] hover:border-white/15 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                      <Swords size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{team.name}</div>
                      <div className="text-[10px] text-slate-400">{team.category}</div>
                    </div>
                  </div>
                  {team.winRate && (
                    <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded border border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                      {team.winRate}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Full-Width CTA Button */}
        <div className="p-6 border-t border-white/[0.08] bg-[#050508]/90 backdrop-blur-xl">
          <a
            href={`/${selectedAcademy.slug || ''}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#FF1744] hover:bg-[#ff2d55] text-white rounded-full text-xs font-bold tracking-wide transition-all shadow-[0_0_30px_rgba(255,23,68,0.45)] hover:shadow-[0_0_40px_rgba(255,23,68,0.6)] group"
          >
            View Full Profile
            <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
