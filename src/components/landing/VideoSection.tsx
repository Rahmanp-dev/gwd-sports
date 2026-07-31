"use client";
import React from "react";
import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";
import {
  buildEmbedUrl,
  resolveAspect,
  VIDEO_ASPECTS,
  type VideoLayout,
  type VideoProvider,
} from "./videoEmbed";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * EMBEDDED VIDEO SHOWCASE — YOUTUBE OR INSTAGRAM
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Renders nothing unless the owner has actually pasted a URL AND that URL
 * parses into an embeddable id. Same rule as every other section here: an
 * unconfigured section is absent, not a dead grey frame on a page that is
 * asking families for money.
 *
 * The URL parsing lives in ./videoEmbed.ts — pure, and testable there in a
 * way it would not be inside this .tsx.
 * ════════════════════════════════════════════════════════════════════════════
 */

function VideoFrame({
  src,
  title,
  aspectCss,
  className,
}: {
  src: string;
  title: string;
  /** e.g. "9 / 16". Never hard-coded — see the aspect notes in videoEmbed.ts. */
  aspectCss: string;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-[var(--brand-radius)] bg-black ${className ?? ""}`}
      style={{ aspectRatio: aspectCss }}
    >
      <iframe
        src={src}
        title={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}

export default function VideoSection({ academy }: { academy?: any }) {
  const config = academy?.theme?.videoSection ?? {};
  const provider: VideoProvider =
    config.provider === "instagram" ? "instagram" : "youtube";
  const layout: VideoLayout = (
    ["cinematic", "framed", "split"] as const
  ).includes(config.layout)
    ? config.layout
    : "cinematic";

  const embedUrl = buildEmbedUrl(provider, String(config.url ?? ""));

  // Off, or nothing valid to show.
  if (academy?.theme?.sections?.video === false || !embedUrl) return null;

  const heading = config.heading || "Watch Us Train";
  const subheading = config.subheading || "";
  const frameTitle = `${academy?.name ?? "Academy"} video`;

  /**
   * The frame's shape, and therefore how wide it may be.
   *
   * This used to cap purely by provider and then force every embed into 16:9,
   * which letterboxed Shorts, Reels and portrait posts into a black slab. The
   * cap now follows the ASPECT: a 9:16 clip has to stay narrow or it becomes
   * taller than the viewport, while a 16:9 one can run wide. A `cinematic`
   * layout is allowed to widen a landscape video but never a portrait one —
   * "full-width" applied to 9:16 is exactly the bug being fixed.
   */
  const aspect = resolveAspect(config.aspect, provider, String(config.url ?? ""));
  const { css: aspectCss, cap } = VIDEO_ASPECTS[aspect];
  const isWide = aspect === "16:9" || aspect === "21:9";
  const widthCap = isWide && layout === "cinematic" ? "max-w-6xl" : cap;

  return (
    <section className="relative py-[var(--section-py-sm)] md:py-[var(--section-py)] px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto">
        {layout === "split" ? (
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-5 text-xs font-semibold uppercase tracking-wider"
                style={{
                  borderColor: "var(--brand-border)",
                  background: "var(--brand-soft)",
                  color: "var(--brand)",
                }}
              >
                <PlayCircle className="h-3.5 w-3.5" />
                Video
              </div>
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 font-display tracking-tight"
                style={{ color: "var(--page-fg)" }}
              >
                {heading}
              </h2>
              {subheading && (
                <p
                  className="text-base sm:text-lg leading-relaxed"
                  style={{ color: "var(--page-muted)" }}
                >
                  {subheading}
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <VideoFrame
                src={embedUrl}
                title={frameTitle}
                aspectCss={aspectCss}
                className="shadow-2xl"
              />
            </motion.div>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-10 sm:mb-14"
            >
              <h2
                className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 font-display tracking-tight"
                style={{ color: "var(--page-fg)" }}
              >
                {heading}
              </h2>
              {subheading && (
                <p
                  className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
                  style={{ color: "var(--page-muted)" }}
                >
                  {subheading}
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className={`mx-auto ${widthCap}`}
            >
              {layout === "framed" ? (
                <div
                  className="rounded-[var(--brand-radius)] p-2 sm:p-3"
                  style={{
                    background: "var(--brand-soft)",
                    border: "1px solid var(--brand-border)",
                    boxShadow: "0 25px 60px -20px rgb(var(--brand-rgb) / 0.45)",
                  }}
                >
                  <VideoFrame src={embedUrl} title={frameTitle} aspectCss={aspectCss} />
                </div>
              ) : (
                <VideoFrame
                  src={embedUrl}
                  title={frameTitle}
                  aspectCss={aspectCss}
                  className="shadow-2xl"
                />
              )}
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
