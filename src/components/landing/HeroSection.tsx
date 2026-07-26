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
  const [videoFailed, setVideoFailed] = useState(false);
  const [heroMode, setHeroMode] = useState<"video" | "carousel">("video");
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Extract theme directly from props when available
  const theme = academy?.theme ?? {};
  const logoUrl = theme?.logoUrl || "";
  const tagline = theme?.tagline || "Where Legends Are Born";
  const brandName = academy?.name || BRAND_NAME;

  const videoSrc = theme?.heroVideoUrl || "/videos/landing.webm";

  useEffect(() => {
    if (academy) {
      const mode = theme?.heroMode || (theme?.heroImages && theme.heroImages.length > 0 ? "carousel" : "video");
      setHeroMode(mode);
      if (theme?.heroImages && theme.heroImages.length > 0) {
        setHeroImages(theme.heroImages);
      }
      setMediaLoaded(true);
      return;
    }

    // Global landing page fallback when no academy prop is provided
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/homepage/settings`);
        if (res.data?.success && res.data.data) {
          const data = res.data.data;
          setHeroMode(data.heroMode || "video");
          setHeroImages(data.heroImages || []);
          setMediaLoaded(true);
        }
      } catch (err) {
        console.error("Failed to fetch landing page settings:", err);
        setMediaLoaded(true);
      }
    };
    fetchSettings();
  }, [academy, theme?.heroImages, theme?.heroMode, theme?.heroVideoUrl]);

  // Carousel auto-advance interval
  useEffect(() => {
    if (heroMode === "carousel" && heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIdx((prev) => (prev + 1) % heroImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [heroMode, heroImages]);

  const posterUrl =
    heroImages.length > 0
      ? heroImages[0].startsWith("http")
        ? heroImages[0]
        : `${IMAGE_BASE_URL}${heroImages[0]}`
      : null;

  const brandFirstPart = brandName.split(" ")[0] || brandName;
  const brandSecondPart = brandName.split(" ").slice(1).join(" ") || "";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* ── Background Media & Dark Scrim ───────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {heroMode === "video" && !videoFailed ? (
          <video
            key={videoSrc}
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
            <source src={videoSrc} type="video/webm" />
            <source src={videoSrc} type="video/mp4" />
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
                transition={{ duration: 1.2 }}
                onLoad={() => setMediaLoaded(true)}
                className="absolute inset-0 w-full h-full object-cover"
                alt={brandName}
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(150deg, var(--brand-strong), var(--page-card, #090d16), var(--brand))",
                }}
              />
            )}
          </AnimatePresence>
        )}

        {/* Dynamic Dark Scrim Overlay & Backdrop Blur based on owner's settings */}
        <div
          className="absolute inset-0 z-10 transition-all duration-500"
          style={heroScrimStyle(theme)}
        />

        {/* Subtle Brand Ambient Glow at Corners */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[var(--brand)]/20 rounded-full blur-[100px] pointer-events-none z-10" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[var(--accent)]/15 rounded-full blur-[120px] pointer-events-none z-10" />
      </div>

      {/* ── Foreground Hero Content ─────────────────────────────────────── */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center justify-between min-h-screen py-20">
        
        {/* Top Spacer / Layout Guard */}
        <div className="h-10 sm:h-16" />

        {/* Center Content: Logo + Title + Tagline */}
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 max-w-5xl my-auto">
          
          {/* Logo Presentation (Respects logoScale, logoShape, logoFit, logoAlign) */}
          {logoUrl ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`w-full flex ${heroLogoAlignClass(theme)}`}
            >
              <div className="relative group">
                {/* Subtle outer glow behind logo */}
                <div
                  className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] opacity-40 blur-md group-hover:opacity-75 transition duration-500"
                  style={{ borderRadius: heroLogoStyle(theme).borderRadius }}
                />
                <img
                  src={
                    logoUrl.startsWith("http")
                      ? logoUrl
                      : `${IMAGE_BASE_URL}${logoUrl}`
                  }
                  alt={`${brandName} logo`}
                  className="relative shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                  style={heroLogoStyle(theme)}
                />
              </div>
            </motion.div>
          ) : null}

          {/* Main Title Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className={`w-full flex ${heroLogoAlignClass(theme)}`}
          >
            <h1
              className="text-4xl sm:text-7xl lg:text-[100px] font-extrabold text-white uppercase leading-[0.95] tracking-tight flex flex-wrap items-center justify-center gap-x-4 gap-y-1 drop-shadow-[0_4px_25px_rgba(0,0,0,0.85)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <span>{brandFirstPart}</span>
              {brandSecondPart && (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand)] via-[var(--accent)] to-[var(--brand-strong)]">
                  {brandSecondPart}
                </span>
              )}
            </h1>
          </motion.div>

          {/* Subtitle / Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg sm:text-2xl lg:text-3xl text-slate-200/90 font-medium tracking-wide max-w-3xl drop-shadow-md"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {tagline}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="pt-4 flex flex-wrap items-center justify-center gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className="relative text-white text-base sm:text-lg font-bold tracking-wide px-9 py-6 rounded-[var(--brand-radius)] shadow-2xl transition-all duration-300 group overflow-hidden border border-white/20"
                style={{
                  background: "linear-gradient(135deg, var(--brand), var(--brand-strong))",
                  boxShadow: "0 10px 30px -5px rgb(var(--brand-rgb) / 0.5)",
                }}
                onClick={() => {
                  window.location.href = "/user/auth";
                }}
              >
                <span className="relative z-10 flex items-center gap-3">
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                </span>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Cue Indicator */}
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          onClick={() =>
            window.scrollTo({ top: window.innerHeight * 0.92, behavior: "smooth" })
          }
          aria-label="Scroll down to see more"
          className="group flex flex-col items-center gap-1.5 text-white/80 hover:text-white transition-colors cursor-pointer pt-6"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] drop-shadow-md">
            Scroll down
          </span>
          <motion.span
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center leading-none"
          >
            <ChevronDown className="h-4 w-4 drop-shadow-md text-[var(--accent)]" />
          </motion.span>
        </motion.button>

      </div>
    </section>
  );
}
