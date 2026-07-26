'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const SPORT_FILTERS = ['All', 'Football', 'Cricket', 'Badminton', 'Basketball', 'Swimming', 'Athletics', 'Tennis'];

const SPORT_COLORS: Record<string, string> = {
  football: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/40',
  cricket: 'bg-blue-900/60 text-blue-300 border-blue-700/40',
  badminton: 'bg-amber-900/60 text-amber-300 border-amber-700/40',
  basketball: 'bg-purple-900/60 text-purple-300 border-purple-700/40',
  swimming: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/40',
  athletics: 'bg-rose-900/60 text-rose-300 border-rose-700/40',
  tennis: 'bg-lime-900/60 text-lime-300 border-lime-700/40',
};

function SportBadge({ sport }: { sport: string }) {
  const key = sport.toLowerCase();
  const cls = SPORT_COLORS[key] || 'bg-white/5 text-white/60 border-white/10';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${cls} capitalize`}>
      {sport}
    </span>
  );
}

function AcademyCardSkeleton() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 animate-pulse space-y-4">
      <div className="h-5 bg-white/[0.07] rounded-lg w-3/4" />
      <div className="flex gap-2">
        <div className="h-4 bg-white/[0.07] rounded-full w-16" />
        <div className="h-4 bg-white/[0.07] rounded-full w-20" />
      </div>
      <div className="h-3 bg-white/[0.07] rounded w-1/2" />
      <div className="h-9 bg-white/[0.07] rounded-xl w-full" />
    </div>
  );
}

interface Academy {
  _id: string;
  name: string;
  slug: string;
  location: string;
  sports: string[];
  studentCount: number;
  fees?: { monthly?: number; quarterly?: number; yearly?: number };
  verificationStatus?: string;
  ecosystemScore?: number;
  theme?: { logoUrl?: string; primaryColor?: string };
}

export default function DiscoverPage() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sport, setSport] = useState('All');
  const [city, setCity] = useState('');

  const fetchAcademies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search && { search }),
        ...(sport !== 'All' && { sport: sport.toLowerCase() }),
        ...(city && { city }),
      });
      const res = await fetch(`/api/academy/discover?${params}`);
      const data = await res.json();
      if (data.success) {
        setAcademies(data.data.academies || []);
        setTotal(data.data.total || 0);
        setTotalPages(data.data.totalPages || 1);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [search, sport, city, page]);

  useEffect(() => {
    const t = setTimeout(fetchAcademies, 300);
    return () => clearTimeout(t);
  }, [fetchAcademies]);

  function handleSportFilter(s: string) {
    setSport(s);
    setPage(1);
  }

  return (
    <div
      className="min-h-screen bg-[#050508] text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF1744]/5 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <p className="text-[#FF1744] text-xs tracking-[0.2em] uppercase font-medium mb-4">GWD Sports Ecosystem</p>
          <h1
            className="text-5xl md:text-[60px] font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Find Your Academy
          </h1>
          <p className="text-[#888899] text-base md:text-lg max-w-xl mx-auto mb-10">
            Search from 500+ sports academies across India. Find the perfect fit for your game.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search academy name..."
              className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-[#555] text-sm focus:outline-none focus:border-[#FF1744]/50 transition-colors"
            />
            <input
              type="text"
              value={city}
              onChange={e => { setCity(e.target.value); setPage(1); }}
              placeholder="City..."
              className="w-full sm:w-40 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-[#555] text-sm focus:outline-none focus:border-[#FF1744]/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <div className="flex gap-2 flex-wrap">
          {SPORT_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => handleSportFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                sport === s
                  ? 'bg-[#FF1744] border-[#FF1744] text-white'
                  : 'bg-white/[0.04] border-white/[0.08] text-[#888899] hover:border-white/20 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-[#555] text-xs mt-4 mb-6">
          {loading ? 'Searching...' : `${total} ${total === 1 ? 'academy' : 'academies'} found`}
        </p>
      </div>

      {/* Academy Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <AcademyCardSkeleton key={i} />)
            : academies.map(academy => (
                <div
                  key={academy._id}
                  className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4 hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-200 group"
                >
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-white leading-tight group-hover:text-[#FF1744] transition-colors">
                        {academy.name}
                      </h3>
                      {academy.verificationStatus === 'founding' && (
                        <span className="shrink-0 text-[9px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-700/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Founding
                        </span>
                      )}
                    </div>
                    <p className="text-[#666] text-xs flex items-center gap-1">
                      <svg className="w-3 h-3 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {academy.location || 'India'}
                    </p>
                  </div>

                  {/* Sport Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {academy.sports?.slice(0, 3).map(s => <SportBadge key={s} sport={s} />)}
                    {(academy.sports?.length || 0) > 3 && (
                      <span className="text-[#555] text-[10px] self-center">+{(academy.sports?.length || 0) - 3} more</span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-[#666]">
                    <span>{academy.studentCount || 0} students</span>
                    {academy.fees?.monthly ? (
                      <span className="text-white font-medium">₹{academy.fees.monthly}<span className="text-[#555] font-normal">/mo</span></span>
                    ) : null}
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/${academy.slug}`}
                    className="mt-auto w-full text-center px-4 py-2.5 rounded-xl bg-[#FF1744]/10 border border-[#FF1744]/20 text-[#FF1744] text-sm font-medium hover:bg-[#FF1744] hover:text-white transition-all duration-200"
                  >
                    View Academy →
                  </Link>
                </div>
              ))}
        </div>

        {/* Empty State */}
        {!loading && academies.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#333] text-5xl mb-4">🏟</p>
            <p className="text-[#555] text-base">No academies found for your search.</p>
            <button
              onClick={() => { setSearch(''); setSport('All'); setCity(''); setPage(1); }}
              className="mt-4 text-[#FF1744] text-sm hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
            >
              Previous
            </button>
            <span className="text-[#555] text-sm">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
