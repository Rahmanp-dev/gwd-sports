"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Trophy } from "lucide-react";
import { Link } from "@/lib/router-shim";
import {
  deriveProgramsFromSports,
  type DerivedProgram,
} from "@/lib/branding/sports";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * WHAT THIS SECTION IS ALLOWED TO CLAIM
 * ════════════════════════════════════════════════════════════════════════════
 *
 * This used to fall back to five hardcoded demo cards — Football Academy,
 * Basketball, Racing League, Model United Nations, Galaxy Events — linking to
 * the platform's own showcase pages. The override it checked for
 * (`theme.programs`) did not exist on the schema and nothing ever wrote it, so
 * the fallback was ALWAYS taken: every academy on the platform advertised
 * Formula racing and Model UN whether or not they had ever offered either, and
 * the "Explore Program" links sent that academy's own visitors to a different
 * academy's page.
 *
 * Resolution order now, most truthful first:
 *   1. `theme.programs` — what the owner explicitly wrote.
 *   2. Derived from `sports[]` — what the academy actually offers.
 *   3. Nothing. The section disappears.
 *
 * There is deliberately no demo fallback. A page that lists disciplines an
 * academy does not teach is worse than a page with no disciplines section.
 * ════════════════════════════════════════════════════════════════════════════
 */
export default function SportsGrid({ academy }: { academy?: any }) {
  const authored: DerivedProgram[] = academy?.theme?.programs?.length
    ? academy.theme.programs
    : [];
  const displaySports: DerivedProgram[] = authored.length
    ? authored
    : deriveProgramsFromSports(academy?.sports ?? []);

  // Owner switched the section off, or there is genuinely nothing to show.
  if (academy?.theme?.sections?.programs === false || displaySports.length === 0) {
    return null;
  }

  return (
    <section className="relative py-16 md:py-32 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      {/* Premium Apple-style Light Background */}
      <div className="absolute inset-0 bg-slate-50">
        <div className="absolute top-40 right-0 w-[30rem] h-[30rem] rounded-full bg-[var(--brand-soft)]/50 blur-3xl" />
        <div className="absolute bottom-40 left-0 w-[30rem] h-[30rem] rounded-full bg-[var(--brand-soft)]/50 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-2 bg-[var(--brand-soft)] border border-[color:var(--brand-soft)] text-[color:var(--brand)] rounded-full shadow-sm mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
            <span className="text-sm font-semibold tracking-wider uppercase">
              Disciplines
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 font-display tracking-tight"
          >
            Master Your <span className="text-[color:var(--brand)]">Game</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm sm:text-lg text-slate-500 max-w-2xl mx-auto"
          >
            Train with elite coaches in state-of-the-art facilities across
            multiple disciplines.
          </motion.p>
        </motion.div>

        {/**
         * Two-up on a phone, four-up on desktop.
         *
         * These were one enormous 400px-tall tile per row on mobile — three
         * disciplines meant three full screens of scrolling before a parent
         * reached anything else. Someone scanning "what do they teach" wants to
         * see the whole list at once, not tour it.
         */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {displaySports.map((sport: DerivedProgram, index: number) => (
            <motion.div
              key={sport.id || sport.label || index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="relative group cursor-pointer"
            >
              {/* Enrolling is the only honest destination: these are this
                  academy's own disciplines, not pages that exist per sport. */}
              <Link to="/user/auth" className="block h-full">
                <div className="relative h-[210px] sm:h-[300px] lg:h-[340px] rounded-2xl sm:rounded-[2rem] overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100">
                  {sport.image ? (
                    <>
                      <img
                        loading="lazy"
                        decoding="async"
                        src={sport.image}
                        alt={sport.label}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
                    </>
                  ) : (
                    /* No photo supplied — the academy's own colour rather than
                       a stock image of a sport they may not teach. */
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(160deg, var(--brand), var(--brand-strong))",
                      }}
                    />
                  )}

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
                    <div className="text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-4 transform transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-2">
                      {sport.emoji || "🏅"}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 font-display tracking-tight leading-tight">
                        {sport.label}
                      </h3>
                      {sport.description ? (
                        <p className="text-white/80 font-medium text-xs sm:text-sm">
                          {sport.description}
                        </p>
                      ) : null}
                    </div>

                    {/* Hover Reveal Details */}
                    <div className="mt-6 overflow-hidden h-0 group-hover:h-auto opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex items-center gap-2 text-white/90 font-medium">
                        Enrol now <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          {/* Special CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: displaySports.length * 0.1 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="relative group cursor-pointer"
          >
            <Link to="/user/auth" className="block h-full">
              <div className="relative h-[400px] rounded-[2rem] overflow-hidden bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center p-8 transition-shadow duration-300 hover:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-strong)]/50 via-slate-900 to-[var(--brand-strong)]/50" />
                
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                    <Trophy className="w-10 h-10 text-[color:var(--brand)]" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4 font-display tracking-tight">
                    Join The Academy
                  </h3>
                  <p className="text-slate-300 mb-8 max-w-[250px] mx-auto text-lg">
                    Begin your journey to greatness with professional coaching.
                  </p>
                  <span className="inline-flex items-center gap-2 text-[color:var(--brand)] font-semibold group-hover:text-[color:var(--brand-soft)] transition-colors">
                    Enroll Now <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
