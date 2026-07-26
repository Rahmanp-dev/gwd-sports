"use client";
import React from "react";
import { motion } from "framer-motion";
import { Award, Users, Target, TrendingUp, Shield, Zap } from "lucide-react";
import { BRAND_NAME } from "@/utils/constants";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * CLAIMS THIS SECTION IS ALLOWED TO MAKE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * These six cards were hardcoded and rendered identically on every academy's
 * page, asserting things nobody had verified: "Train with world champions",
 * "Join a family of 10,000+ dedicated athletes", "Olympic-standard safety
 * protocols". A three-month-old academy with four students was telling parents
 * it had ten thousand athletes and Olympic safety standards.
 *
 * Same problem as the fabricated stats and testimonials already removed. The
 * defaults below are now things that are TRUE OF THE PLATFORM and therefore
 * true of any academy on it — attendance really is tracked, progress really is
 * recorded, a Passport really is issued. No headcounts, no medals, no
 * superlatives.
 *
 * `theme.highlights` lets an academy replace them with its own claims, which
 * it is then responsible for.
 * ════════════════════════════════════════════════════════════════════════════
 */
const PLATFORM_TRUE_DEFAULTS = [
  {
    icon: Award,
    title: "Qualified Coaching",
    description: "Sessions led by the academy's own registered coaches",
  },
  {
    icon: TrendingUp,
    title: "Tracked Progress",
    description: "Skills assessed and recorded session by session",
  },
  {
    icon: Users,
    title: "Parents Kept Informed",
    description: "Attendance confirmations and updates sent to parents",
  },
  {
    icon: Target,
    title: "A Record That Travels",
    description: "Every student gets a Sports Passport that stays theirs",
  },
  {
    icon: Shield,
    title: "Clear Fees",
    description: "Transparent fee structure with receipts for every payment",
  },
  {
    icon: Zap,
    title: "Simple Enrolment",
    description: "Join, pay and track progress from your phone",
  },
];

const ICON_BY_KEY: Record<string, React.ElementType> = {
  award: Award,
  progress: TrendingUp,
  users: Users,
  target: Target,
  shield: Shield,
  zap: Zap,
};

export default function WhyChooseUs({ academy }: { academy?: any }) {
  /** Academy-authored highlights win; otherwise the platform-true defaults. */
  const authored = Array.isArray(academy?.theme?.highlights)
    ? academy.theme.highlights.filter((h: any) => h?.title)
    : [];

  const reasons = (authored.length ? authored : PLATFORM_TRUE_DEFAULTS).map(
    (r: any) => ({
      icon: r.icon && typeof r.icon === "string" ? ICON_BY_KEY[r.icon] ?? Award : r.icon ?? Award,
      title: r.title,
      description: r.description ?? "",
    }),
  );

  if (academy?.theme?.sections?.highlights === false || reasons.length === 0) {
    return null;
  }

  return (
    <section className="relative py-16 md:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 overflow-hidden">
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
            className="inline-flex items-center gap-3 px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-full shadow-sm mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--brand)]" />
            <span className="text-sm font-semibold tracking-wider uppercase">
              Why {academy?.name || BRAND_NAME}
            </span>
          </motion.div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold  mb-4 sm:mb-6 font-display tracking-tight" style={{ color: "var(--page-fg)" }}>
            The Elite <span className="text-[color:var(--brand)]">Difference</span>
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((
            reason: { icon: React.ElementType; title: string; description: string },
            index: number,
          ) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative"
            >
              {/* Card sits on --page-card, so it stays readable whichever
                  background the academy chose. Each card previously carried its
                  own hardcoded pastel gradient (sky, rose, violet, fuchsia),
                  which fought whatever brand colour the academy had picked. */}
              <div
                className="relative rounded-[var(--brand-radius)] p-8 h-full shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                style={{
                  background: "var(--page-card)",
                  border: "1px solid var(--page-border)",
                }}
              >
                {/* Brand tint on hover, instead of six unrelated pastels. */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "var(--brand-soft)" }}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    className="w-16 h-16 rounded-[var(--brand-radius)] flex items-center justify-center mb-6 shadow-sm group-hover:shadow-md transition-all duration-300"
                    style={{
                      background: "var(--brand-soft)",
                      border: "1px solid var(--brand-border)",
                    }}
                  >
                    <reason.icon
                      className="w-8 h-8"
                      style={{ color: "var(--brand)" }}
                    />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight font-display">
                    {reason.title}
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed group-hover:text-slate-700 transition-colors">
                    {reason.description}
                  </p>
                </div>

                {/* Floating Number (Subtle) */}
                <div
                  className="absolute bottom-4 right-6 text-7xl font-black text-slate-50 group-hover:text-white transition-colors z-0"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  0{index + 1}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
