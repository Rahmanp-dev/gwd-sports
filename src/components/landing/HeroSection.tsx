"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { BRAND_NAME, API_BASE_URL, IMAGE_BASE_URL } from "@/utils/constants";
import axios from "axios";

export default function HeroSection() {
  const [mediaLoaded, setMediaLoaded] = useState(false);
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

  const brandFirstPart = BRAND_NAME.split(" ")[0] || BRAND_NAME;
  const brandSecondPart = BRAND_NAME.split(" ")[1] || "";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background Media with Overlay */}
      <div className="absolute inset-0">
        {heroMode === "video" ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setMediaLoaded(true)}
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
                className="absolute inset-0 w-full h-full object-cover"
                alt="Hero Carousel"
              />
            ) : (
              // Fallback if carousel mode but no images
              <div className="absolute inset-0 bg-gray-900" />
            )}
          </AnimatePresence>
        )}

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
          className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/50 to-black/85"
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
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent"
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
              className="absolute top-20 right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"
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
              className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-3xl"
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
            className={`flex justify-center ${logoUrl && logoAlignment === "top_left" ? "mt-24 sm:mt-0" : ""}`}
          >
            {logoUrl && logoAlignment === "middle" ? (
              <img
                src={
                  logoUrl.startsWith("http")
                    ? logoUrl
                    : `${IMAGE_BASE_URL}${logoUrl}`
                }
                alt="Brand Logo"
                className={`h-40 sm:h-56 lg:h-72 drop-shadow-2xl ${logoIsCircular ? "rounded-full object-cover aspect-square" : "object-contain"}`}
                style={{
                  transform: `scale(${logoScale / 100})`,
                  transformOrigin: "center center",
                }}
              />
            ) : (
              <h1 className="text-7xl sm:text-8xl lg:text-[140px] font-black text-white uppercase leading-[0.9] tracking-tighter font-display flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
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
                    className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)] font-display"
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
              className="text-3xl sm:text-4xl lg:text-5xl text-white font-black uppercase tracking-wider drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] font-display"
            >
              Where Legends Are Born
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
                  className="relative bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-600 hover:to-yellow-600 text-xl font-black uppercase tracking-widest px-12 py-8 rounded-none shadow-[0_0_40px_rgba(251,191,36,0.6)] hover:shadow-[0_0_60px_rgba(251,191,36,0.8)] transition-all duration-300 group overflow-hidden font-display"
                  onClick={() => {
                    window.location.href = "/user/auth";
                  }}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Start Your Journey
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
