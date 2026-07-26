"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import { BRAND_NAME, API_BASE_URL, IMAGE_BASE_URL } from "@/utils/constants";
import {
  heroScrimStyle,
  heroLogoStyle,
  heroLogoAlignClass,
} from "@/lib/branding/heroStyle";
import axios from "axios";

export default function HeroSection({ academy }: { academy?: any }) {
  const [mediaLoaded, setMediaLoaded] = useState(false);
  /** Video 404s or is blocked → fall through to images, then to the gradient. */
  const [videoFailed, setVideoFailed] = useState(false);
  const [heroMode, setHeroMode] = useState<"video" | "carousel">("video");
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoAlignment, setLogoAlignment] = useState<"top_left" | "middle">(
    "top_left",
  );
  const [logoIsCircular, setLogoIsCircular] = useState<boolean>(false);
  const [logoScale, setLogoScale] = useState<number>(100);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      // If we have an academy, we don't necessarily need to fetch global settings
      // or we can override with academy settings later.
      if (academy) {
        setLogoUrl(academy.theme?.logoUrl || "");
        setLogoAlignment("top_left");
        setLogoIsCircular(false);
        setLogoScale(100);
        
        if (academy.theme?.heroImages && academy.theme.heroImages.length > 0) {
          setHeroImages(academy.theme.heroImages);
          setHeroMode("carousel");
        } else {
          setHeroMode("video");
        }
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/homepage/settings`);
        if (res.data?.success && res.data.data) {
          setHeroMode(res.data.data.heroMode || "video");
          setHeroImages(res.data.data.heroImages || []);
          setLogoUrl(res.data.data.logoUrl || "");
          setLogoAlignment(res.data.data.logoAlignment || "top_left");
          setLogoIsCircular(res.data.data.logoIsCircular || false);
          setLogoScale(res.data.data.logoScale || 100);
        }
      } catch (err) {
        console.error("Failed to fetch landing page settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // Carousel timer
  useEffect(() => {
    if (heroMode === "carousel" && heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIdx((prev) => (prev + 1) % heroImages.length);
      }, 5000); // 5 seconds per slide
      return () => clearInterval(interval);
    }
  }, [heroMode, heroImages]);

  // If carousel and images exist, consider media loaded immediately
  useEffect(() => {
    if (heroMode === "carousel" && heroImages.length > 0) {
      setMediaLoaded(true);
    }
  }, [heroMode, heroImages]);

  const brandName = academy?.name || BRAND_NAME;

  /** Shows instantly and survives a video that never plays. See the media block. */
  const posterUrl =
    heroImages.length > 0
      ? heroImages[0].startsWith("http")
        ? heroImages[0]
        : `${IMAGE_BASE_URL}${heroImages[0]}`
      : null;
  const brandFirstPart = brandName.split(" ")[0] || brandName;
  const brandSecondPart = brandName.split(" ").slice(1).join(" ") || "";
  // Colour is no longer read here — it arrives as CSS custom properties from
  // <AcademyTheme>, which is why every section now honours the brand rather
  // than only the two that remembered to accept a prop.
  const tagline = academy?.theme?.tagline || "Where Legends Are Born";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50">
      {/* Background Media with Overlay */}
      <div className="absolute inset-0">
        {/**
         * MEDIA, WITH A FALLBACK AT EVERY LEVEL.
         *
         * Video autoplay is unreliable on mobile — iOS Low Power Mode refuses
         * it outright, and a hero video is a heavy download on Indian mobile
         * data regardless. So: the first hero image is used as the video's
         * `poster`, which shows instantly and remains if playback never starts,
         * and `onError` falls back to the brand gradient rather than a white
         * void. There is no state in which the hero is blank.
         *
         * `--brand` gradient is the last resort so an academy with no media at
         * all still gets a page in its own colours.
         */}
        {heroMode === "video" && !videoFailed ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={posterUrl ?? undefined}
            onLoadedData={() => setMediaLoaded(true)}
            onError={() => setVideoFailed(true)}
            className="w-full h-full object-cover"
          >
            <source src="/videos/landing.webm" type="video/webm" />
          </video>
        ) : (
          <AnimatePresence mode="wait">
            {heroImages.length > 0 ? (
              <motion.img
                key={currentImageIdx}
                src={
                  heroImages[currentImageIdx].startsWith("http")
                    ? heroImages[currentImageIdx]
                    : `${IMAGE_BASE_URL}${heroImages[currentImageIdx]}`
                }
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                onLoad={() => setMediaLoaded(true)}
                className="absolute inset-0 w-full h-full object-cover"
                alt=""
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(150deg, var(--brand), var(--brand-strong))",
                }}
              />
            )}
          </AnimatePresence>
        )}

        {/**
         * Legibility scrim over the media.
         *
         * The academy name sat directly on top of a photograph or a moving
         * video, so how readable it was depended entirely on which frame was
         * showing. A light blur plus a graded dark wash fixes the contrast
         * without softening the headline itself — the text sits above this
         * layer, so it stays sharp while the media behind it recedes.
         */}
        <div className="absolute inset-0" style={heroScrimStyle(academy?.theme ?? {})} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity:
              mediaLoaded ||
              (heroMode === "carousel" && heroImages.length === 0)
                ? 1
                : 0,
          }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="absolute inset-0 bg-gradient-to-br from-white/60 via-slate-50/70 to-slate-100/90"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity:
              mediaLoaded ||
              (heroMode === "carousel" && heroImages.length === 0)
                ? 1
                : 0,
          }}
          transition={{ duration: 1.5, delay: 0.8 }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[var(--brand)]/10 via-transparent to-transparent"
        />
      </div>

      {/* Animated Background Elements */}
      <AnimatePresence>
        {(mediaLoaded ||
          (heroMode === "carousel" && heroImages.length === 0)) && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                opacity: { duration: 1, delay: 1.2 },
                scale: { duration: 20, repeat: Infinity, ease: "linear" },
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              }}
              className="absolute top-20 right-20 w-96 h-96 bg-[var(--brand)]/5 rounded-full blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: [1.2, 1, 1.2],
                rotate: [90, 0, 90],
              }}
              transition={{
                opacity: { duration: 1, delay: 1.4 },
                scale: { duration: 25, repeat: Infinity, ease: "linear" },
                rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              }}
              className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-[var(--brand)]/5 rounded-full blur-3xl"
            />
          </>
        )}
      </AnimatePresence>

      {/* Top Section - BRAND NAME or LOGO */}
      <div className="absolute top-[10%] left-0 right-0 z-10">
        {logoUrl && logoAlignment === "top_left" && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{
              opacity:
                mediaLoaded ||
                (heroMode === "carousel" && heroImages.length === 0)
                  ? 1
                  : 0,
              x:
                mediaLoaded ||
                (heroMode === "carousel" && heroImages.length === 0)
                  ? 0
                  : -30,
            }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute top-[-50px] sm:top-[-80px] left-8 sm:left-12 lg:left-16 flex items-center justify-center"
          >
            <img
              src={
                logoUrl.startsWith("http")
                  ? logoUrl
                  : `${IMAGE_BASE_URL}${logoUrl}`
              }
              alt="Brand Logo"
              className={`h-24 sm:h-32 lg:h-40 drop-shadow-2xl ${logoIsCircular ? "rounded-full object-cover aspect-square" : "object-contain"}`}
              style={{
                transform: `scale(${logoScale / 100})`,
                transformOrigin: "top left",
              }}
            />
          </motion.div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Heading with Stagger */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity:
                mediaLoaded ||
                (heroMode === "carousel" && heroImages.length === 0)
                  ? 1
                  : 0,
              y:
                mediaLoaded ||
                (heroMode === "carousel" && heroImages.length === 0)
                  ? 0
                  : 30,
            }}
            transition={{ duration: 1.2, delay: 1.8 }}
            className={`flex ${heroLogoAlignClass(academy?.theme ?? {})} ${
              logoUrl && logoAlignment === "top_left" ? "mt-24 sm:mt-0" : ""
            }`}
          >
            {logoUrl && logoAlignment === "middle" ? (
              <img
                src={
                  logoUrl.startsWith("http")
                    ? logoUrl
                    : `${IMAGE_BASE_URL}${logoUrl}`
                }
                alt={`${brandName} logo`}
                /**
                 * Size, shape and crop all come from the academy's own theme
                 * now, via the same helper the branding preview uses — this
                 * used to be a fixed `h-40 sm:h-56 lg:h-72` with a boolean
                 * "circular" flag and a scale read from platform-wide
                 * GlobalSettings, so an academy could not actually control how
                 * its own mark was presented.
                 */
                className="drop-shadow-2xl"
                style={heroLogoStyle(academy?.theme ?? {})}
              />
            ) : (
              /**
               * White with a soft shadow, not `text-slate-900`.
               *
               * The name sits on a photograph or video with a dark scrim over
               * it, so near-black text was fighting the very layer that makes
               * it readable. White on the scrim is legible over any frame, and
               * the drop shadow lifts it off busy imagery without blurring the
               * glyphs — the blur belongs to the media behind, not the type.
               *
               * Uses --font-heading so it follows the academy's chosen
               * typeface rather than sitting on the platform default.
               */
              <h1
                className="text-[40px] sm:text-7xl lg:text-[120px] font-black text-white uppercase leading-[0.92] tracking-tighter flex flex-col sm:flex-row items-center gap-1 sm:gap-4 drop-shadow-[0_2px_20px_rgba(0,0,0,0.55)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {brandFirstPart}
                {brandSecondPart && (
                  <motion.span
                    initial={{ opacity: 0, x: -50 }}
                    animate={{
                      opacity:
                        mediaLoaded ||
                        (heroMode === "carousel" && heroImages.length === 0)
                          ? 1
                          : 0,
                      x:
                        mediaLoaded ||
                        (heroMode === "carousel" && heroImages.length === 0)
                          ? 0
                          : -50,
                    }}
                    transition={{ duration: 1, delay: 2.2 }}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand)] via-[var(--accent)] to-[var(--brand-strong)] font-display"
                  >
                    {brandSecondPart}
                  </motion.span>
                )}
              </h1>
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom Section - Tagline + CTA */}
      <div className="absolute bottom-[10%] left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity:
                  mediaLoaded ||
                  (heroMode === "carousel" && heroImages.length === 0)
                    ? 1
                    : 0,
                y:
                  mediaLoaded ||
                  (heroMode === "carousel" && heroImages.length === 0)
                    ? 0
                    : 20,
              }}
              transition={{ duration: 1, delay: 2.8 }}
              className="text-2xl sm:text-3xl lg:text-4xl text-slate-600 font-semibold uppercase tracking-wider font-display"
            >
              {tagline}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity:
                  mediaLoaded ||
                  (heroMode === "carousel" && heroImages.length === 0)
                    ? 1
                    : 0,
                y:
                  mediaLoaded ||
                  (heroMode === "carousel" && heroImages.length === 0)
                    ? 0
                    : 20,
              }}
              transition={{ duration: 1, delay: 3.6 }}
              className="flex justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="relative bg-slate-900 text-white hover:bg-slate-800 text-lg font-semibold tracking-wide px-10 py-6 rounded-[var(--brand-radius)] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                  onClick={() => {
                    window.location.href = "/user/auth";
                  }}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Start Your Journey
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/**
       * Scroll cue — same on phones and desktop.
       *
       * The hero fills the viewport exactly, so on a phone there is no visual
       * hint that anything follows it: no clipped card edge, no partial
       * heading. People assume the page is the hero and leave. This says
       * otherwise, and is clickable rather than decorative.
       */}
      <button
        type="button"
        onClick={() =>
          window.scrollTo({ top: window.innerHeight * 0.92, behavior: "smooth" })
        }
        aria-label="Scroll down to see more"
        className="group absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 text-white/70 transition-colors hover:text-white"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
          Scroll down
        </span>
        <motion.span
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center leading-none"
        >
          <ChevronDown className="h-4 w-4 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]" />
          <ChevronDown className="-mt-2 h-4 w-4 opacity-50 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]" />
        </motion.span>
      </button>
    </section>
  );
}
