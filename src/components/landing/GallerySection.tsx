"use client";
import React from "react";
import { motion } from "framer-motion";

/**
 * The academy's own photographs, as a scrollable carousel.
 *
 * Renders nothing unless the academy uploaded images — there is no stock
 * fallback, for the same reason SportsGrid has none: a gallery of somebody
 * else's facility is worse than no gallery.
 */
export default function GallerySection({ academy }: { academy?: any }) {
  const gallery: { url: string; caption?: string }[] =
    academy?.theme?.gallery?.filter((g: any) => g?.url) ?? [];

  if (academy?.theme?.sections?.gallery === false || gallery.length === 0) {
    return null;
  }

  return (
    <section className="relative py-14 md:py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-[var(--brand-soft)] border border-[color:var(--brand-soft)] text-[color:var(--brand)] rounded-full shadow-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--brand)]" />
            <span className="text-sm font-semibold tracking-wider uppercase">
              Gallery
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold  font-display tracking-tight" style={{ color: "var(--page-fg)" }}>
            Inside{" "}
            <span className="text-[color:var(--brand)]">
              {academy?.name || "our academy"}
            </span>
          </h2>
        </motion.div>

        {/* Horizontal scroll on small screens, grid on large. The container
            scrolls, never the page body. */}
        <div className="flex gap-5 overflow-x-auto pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
          {gallery.map((item, index) => (
            <motion.figure
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: Math.min(index, 5) * 0.08 }}
              className="group relative w-[80vw] flex-shrink-0 overflow-hidden shadow-md sm:w-[45vw] lg:w-auto"
              style={{ borderRadius: "var(--brand-radius)" }}
            >
              <img
                src={item.url}
                alt={item.caption || `${academy?.name ?? "Academy"} photo ${index + 1}`}
                loading="lazy"
                className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {item.caption ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/85 to-transparent p-4 text-sm font-medium text-white">
                  {item.caption}
                </figcaption>
              ) : null}
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
