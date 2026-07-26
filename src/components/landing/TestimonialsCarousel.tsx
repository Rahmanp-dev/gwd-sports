"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * REAL TESTIMONIALS ONLY — OR NONE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * This section used to render three invented quotes from invented people
 * ("Sarah Johnson", "Michael Chen", "Priya Sharma") over stock headshots, with
 * the academy's name interpolated into them. On a live academy's public site
 * that is a fabricated endorsement of a real, named business shown to real
 * parents deciding where to send their child. The previous author flagged it in
 * a comment and left the decision open; there was no way to close it then,
 * because there was nowhere to store a genuine testimonial.
 *
 * There is now: `theme.testimonials`, editable in the branding editor. So the
 * placeholders are gone. An academy that has supplied testimonials shows them;
 * one that has not shows no section at all.
 * ════════════════════════════════════════════════════════════════════════════
 */
interface PublicTestimonial {
  name: string;
  role?: string;
  quote: string;
  avatarUrl?: string;
}

export default function TestimonialsCarousel({ academy }: { academy?: any }) {
  const [current, setCurrent] = useState(0);

  const testimonials: PublicTestimonial[] = React.useMemo(
    () =>
      (academy?.theme?.testimonials ?? []).filter(
        (t: PublicTestimonial) => t?.quote?.trim(),
      ),
    [academy?.theme?.testimonials],
  );

  const total = testimonials.length;
  const next = () => setCurrent((c) => (c + 1) % total);
  const prev = () => setCurrent((c) => (c - 1 + total) % total);

  // Nothing genuine to show, or the owner switched the section off.
  if (academy?.theme?.sections?.testimonials === false || total === 0) {
    return null;
  }

  const safeIndex = Math.min(current, total - 1);

  return (
    <section className="relative py-16 md:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[var(--brand-soft)]/50 rounded-full blur-3xl"
      />

      <div className="relative max-w-6xl mx-auto">
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
              Success Stories
            </span>
          </motion.div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 font-display tracking-tight">
            Champion{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand)] to-[var(--brand-strong)]">
              Testimonials
            </span>
          </h2>
        </motion.div>

        {/* Testimonial */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={safeIndex}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative bg-white rounded-[var(--brand-radius)] p-8 sm:p-12 shadow-xl border border-slate-100 overflow-hidden">
                {/* Quote Icon */}
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-6 -left-6 w-20 h-20 bg-[var(--brand-soft)] border border-[color:var(--brand-soft)] rounded-[var(--brand-radius)] flex items-center justify-center shadow-sm"
                >
                  <Quote className="w-8 h-8 text-[color:var(--brand)]" />
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-8 items-center pt-4">
                  {/* Photo, only when the academy actually supplied one. No
                      stock headshot stands in for a real person here. */}
                  {testimonials[safeIndex].avatarUrl ? (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex-shrink-0"
                    >
                      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                        <img
                          loading="lazy"
                          decoding="async"
                          src={testimonials[safeIndex].avatarUrl}
                          alt={testimonials[safeIndex].name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </motion.div>
                  ) : null}

                  {/* Content */}
                  <div className="flex-1 text-center lg:text-left">
                    <blockquote className="text-xl sm:text-2xl text-slate-700 mb-6 font-medium leading-relaxed">
                      “{testimonials[safeIndex].quote}”
                    </blockquote>

                    <div>
                      <div className="text-2xl font-bold text-slate-900 mb-1 font-display tracking-tight">
                        {testimonials[safeIndex].name}
                      </div>
                      {testimonials[safeIndex].role ? (
                        <div className="text-[color:var(--brand)] font-semibold">
                          {testimonials[safeIndex].role}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation — pointless with a single testimonial. */}
          <div className={`justify-center gap-4 mt-8 ${total > 1 ? "flex" : "hidden"}`}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={prev}
                size="icon"
                variant="outline"
                className="w-12 h-12 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[color:var(--brand)] transition-colors shadow-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={next}
                size="icon"
                variant="outline"
                className="w-12 h-12 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[color:var(--brand)] transition-colors shadow-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </motion.div>
          </div>

          {/* Dots */}
          <div className={`justify-center gap-2 mt-6 ${total > 1 ? "flex" : "hidden"}`}>
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrent(index)}
                whileHover={{ scale: 1.1 }}
                className={`h-2 transition-all duration-300 rounded-full ${
                  current === index
                    ? "w-8 bg-[var(--brand)]"
                    : "w-2 bg-slate-300 hover:bg-[var(--brand)]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
