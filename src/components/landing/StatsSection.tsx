"use client";
import React from "react";
import { motion, useInView } from "framer-motion";
import { Trophy, Users, Target, Award } from "lucide-react";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * EVERY NUMBER HERE MUST BE TRUE OF THIS ACADEMY
 * ════════════════════════════════════════════════════════════════════════════
 *
 * This section was four hardcoded constants — "1000+ Athletes Trained",
 * "25+ Championships", "98% Success Rate", "10+ Years Excellence" — plus a
 * "#1 Rated Sports Academy" badge, rendered identically on EVERY academy's
 * public page. A brand-new academy with four students advertised a thousand
 * athletes and a 98% success rate to the parents deciding whether to trust it.
 *
 * "98% Success Rate" is not a placeholder. It is a measurable claim, it was
 * false, and it sat on a page asking families for money.
 *
 * Now every figure is derived from that academy's own record, and any figure
 * that cannot be derived is not shown. If nothing can be derived, the whole
 * section removes itself — same rule as the disciplines grid and testimonials.
 * ════════════════════════════════════════════════════════════════════════════
 */
interface DerivedStat {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  color: string;
  bg: string;
  text: string;
}

/**
 * Two treatments, both built from theme tokens rather than a fixed Tailwind
 * palette. Previously three of the four stats were hardcoded amber/emerald/
 * purple regardless of the academy's actual brand colour — every academy's
 * numbers looked like the same rainbow no matter what they picked in the
 * theme engine. Alternating brand/accent gives the section visual variety
 * while staying entirely derived from that academy's own palette.
 *
 * If the owner has also picked "stats" as their one accent-focus section
 * (data-section-accent, see globals.css), --brand already equals --accent
 * there, so the two treatments collapse into one — a harmless, sensible
 * degradation, not a conflict.
 */
const BRAND_TREATMENT = {
  color: "from-[var(--brand)] to-[var(--brand-strong)]",
  bg: "bg-[var(--brand-soft)]",
  text: "text-[color:var(--brand)]",
};
const ACCENT_TREATMENT = {
  color: "from-[var(--accent)] to-[var(--accent-strong)]",
  bg: "bg-[var(--accent-soft)]",
  text: "text-[color:var(--accent)]",
};

function deriveStats(academy?: any): DerivedStat[] {
  const out: DerivedStat[] = [];

  const students = Array.isArray(academy?.students) ? academy.students.length : 0;
  if (students > 0) {
    out.push({
      icon: Users,
      value: students,
      suffix: "",
      label: students === 1 ? "Athlete Training" : "Athletes Training",
      ...BRAND_TREATMENT,
    });
  }

  const achievements = Array.isArray(academy?.achievements)
    ? academy.achievements.filter(Boolean).length
    : 0;
  if (achievements > 0) {
    out.push({
      icon: Trophy,
      value: achievements,
      suffix: "",
      label: achievements === 1 ? "Achievement" : "Achievements",
      ...ACCENT_TREATMENT,
    });
  }

  const sports = Array.isArray(academy?.sports) ? academy.sports.length : 0;
  if (sports > 0) {
    out.push({
      icon: Target,
      value: sports,
      suffix: "",
      label: sports === 1 ? "Discipline" : "Disciplines",
      ...BRAND_TREATMENT,
    });
  }

  const year = Number(academy?.establishedYear);
  const years = Number.isFinite(year) && year > 1900 ? new Date().getFullYear() - year : 0;
  if (years > 0) {
    out.push({
      icon: Award,
      value: years,
      suffix: years === 1 ? " yr" : " yrs",
      label: "Coaching Experience",
      ...ACCENT_TREATMENT,
    });
  }

  return out;
}

interface AnimatedCounterProps {
  value: number;
  suffix: string;
}

function AnimatedCounter({ value, suffix }: AnimatedCounterProps) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2000;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span
      ref={ref}
      className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display"
    >
      {count}
      {suffix}
    </span>
  );
}

export default function StatsSection({ academy }: { academy?: any }) {
  const stats = deriveStats(academy);

  // Owner switched it off, or this academy has nothing true to put here yet.
  if (academy?.theme?.sections?.stats === false || stats.length === 0) return null;

  return (
    <section className="relative py-[var(--section-py-sm)] md:py-[var(--section-py)] px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[var(--brand-soft)]/50 to-[var(--brand-soft)]/50 rounded-full blur-3xl opacity-60"
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold  mb-4 sm:mb-6 font-display tracking-tight" style={{ color: "var(--page-fg)" }}>
            Numbers That{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand)] to-[var(--brand-strong)]">
              Speak Volumes
            </span>
          </h2>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative"
            >
              <div className="relative bg-white border border-slate-100 rounded-[var(--brand-radius)] p-8 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden text-center">
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className={`w-16 h-16 mx-auto ${stat.bg} rounded-[var(--brand-radius)] flex items-center justify-center mb-6 shadow-sm group-hover:shadow-md transition-all duration-300`}
                >
                  <stat.icon className={`w-8 h-8 ${stat.text}`} />
                </motion.div>

                {/* Number */}
                <div
                  className={`text-transparent bg-clip-text bg-gradient-to-br ${stat.color} mb-2`}
                >
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>

                {/* Label */}
                <div className="text-slate-500 font-semibold text-lg tracking-wide">
                  {stat.label}
                </div>

                {/* Glowing Background on Hover */}
                <div
                  className={`absolute inset-0 rounded-[var(--brand-radius)] bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 -z-10`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/**
         * The "#1 Rated Sports Academy" badge that sat here has been removed
         * outright. It appeared on every academy's page, they cannot all be
         * number one, and there is no rating system behind it to appeal to.
         * A verified badge belongs here later — one that means something.
         */}
        {academy?.gwdFoundingAcademy ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-800 rounded-full shadow-md">
              <Trophy className="w-6 h-6 text-amber-500" />
              <span className="text-lg font-bold font-display tracking-wide">
                GWD Founding Academy
              </span>
            </div>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
