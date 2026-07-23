"use client";
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";

interface SectionHeroProps {
  title: string;
  subtitle: string;
  description: string;
  ctaText?: string;
  secondaryCtaText?: string;
  backgroundImage: string;
  accentColor?: string;
  icon?: string;
  logo?: string;
  stats?: Array<{ value: string; label: string }>;
  onCtaClick?: () => void;
  onSecondaryCtaClick?: () => void;
}

export const SectionHero: React.FC<SectionHeroProps> = ({
  title,
  subtitle,
  description,
  ctaText = "Join Now",
  secondaryCtaText = "Book Free Trial",
  backgroundImage,
  accentColor = "from-amber-500 to-yellow-500",
  icon = "⚽",
  logo,
  stats,
  onCtaClick,
  onSecondaryCtaClick,
}) => {
  // Determine theme colors
  const isPurpleTheme =
    accentColor.includes("purple") ||
    accentColor.includes("indigo") ||
    accentColor.includes("violet") ||
    accentColor.includes("fuchsia");
  const isOrangeTheme =
    accentColor.includes("orange") || accentColor.includes("red");
  const isAmberTheme =
    accentColor.includes("amber") || accentColor.includes("yellow");
  const isGreenTheme = !isPurpleTheme && !isOrangeTheme && !isAmberTheme;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-black/90 to-black/85" />

        {/* Theme-specific gradient overlay */}
        {isPurpleTheme ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent" />
          </>
        ) : isAmberTheme ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-yellow-500/15 via-transparent to-transparent" />
          </>
        ) : isOrangeTheme ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-red-500/15 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-500/20 via-transparent to-transparent" />
        )}
      </div>

      {/* Animated Background Elements - Theme Aware */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className={`absolute top-20 right-20 w-96 h-96 ${
          isOrangeTheme
            ? "bg-orange-500/10"
            : isAmberTheme
              ? "bg-amber-500/10"
              : "bg-green-500/10"
        } rounded-full blur-3xl`}
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [90, 0, 90],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className={`absolute bottom-20 left-20 w-[500px] h-[500px] ${
          isOrangeTheme
            ? "bg-red-500/10"
            : isAmberTheme
              ? "bg-yellow-500/10"
              : "bg-emerald-500/10"
        } rounded-full blur-3xl`}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          {logo ? (
            // Cinematic Logo + Heading Layout (Side by Side)
            <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 mb-16">
              {/* Logo Section */}
              <motion.div
                initial={{ opacity: 0, x: -100, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  duration: 1,
                  delay: 0.2,
                  type: "spring",
                  bounce: 0.4,
                }}
                className="relative group"
              >
                {/* Animated Glow Backdrop */}
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.4, 0.7, 0.4],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={`absolute inset-0 blur-3xl rounded-full ${
                    isAmberTheme
                      ? "bg-gradient-to-br from-amber-400/60 via-yellow-500/50 to-amber-600/40"
                      : isOrangeTheme
                        ? "bg-gradient-to-br from-orange-400/60 via-red-500/50 to-orange-600/40"
                        : "bg-gradient-to-br from-green-400/60 via-emerald-500/50 to-green-600/40"
                  }`}
                />

                {/* Glass Container */}
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`relative w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 p-6 lg:p-8 rounded-3xl backdrop-blur-xl border-2 ${
                    isAmberTheme
                      ? "bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent border-amber-400/30 shadow-[0_0_60px_rgba(245,158,11,0.4)]"
                      : isOrangeTheme
                        ? "bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent border-orange-400/30 shadow-[0_0_60px_rgba(249,115,22,0.4)]"
                        : "bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border-green-400/30 shadow-[0_0_60px_rgba(34,197,94,0.4)]"
                  } transition-all duration-500 flex items-center justify-center`}
                >
                  {/* Logo Image */}
                  <motion.img
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                    transition={{ duration: 0.6 }}
                    src={logo}
                    alt={title}
                    className={`max-w-[90%] max-h-[90%] w-auto h-auto object-contain relative z-10 ${
                      isAmberTheme
                        ? "drop-shadow-[0_0_40px_rgba(245,158,11,0.8)]"
                        : isOrangeTheme
                          ? "drop-shadow-[0_0_40px_rgba(249,115,22,0.8)]"
                          : "drop-shadow-[0_0_40px_rgba(34,197,94,0.8)]"
                    }`}
                  />

                  {/* Corner Accents */}
                  {[
                    "top-0 left-0",
                    "top-0 right-0 rotate-90",
                    "bottom-0 left-0 -rotate-90",
                    "bottom-0 right-0 rotate-180",
                  ].map((position, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                      className={`absolute ${position} w-12 h-12 border-l-4 border-t-4 ${
                        isAmberTheme
                          ? "border-amber-400/70"
                          : isOrangeTheme
                            ? "border-orange-400/70"
                            : "border-green-400/70"
                      }`}
                    />
                  ))}
                </motion.div>
              </motion.div>

              {/* Heading Section */}
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="text-center lg:text-left"
              >
                {/* Subtitle */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="mb-6"
                >
                  <span
                    className={`inline-block px-6 py-2 rounded-full border-2 backdrop-blur-md ${
                      isAmberTheme
                        ? "text-amber-400 border-amber-400/40 bg-amber-500/10"
                        : isOrangeTheme
                          ? "text-orange-400 border-orange-400/40 bg-orange-500/10"
                          : "text-green-400 border-green-400/40 bg-green-500/10"
                    } text-sm font-black uppercase tracking-[0.3em] font-display`}
                  >
                    {subtitle}
                  </span>
                </motion.div>

                {/* Main Title */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black uppercase leading-[0.85] font-display mb-6">
                  {title
                    .split(" ")
                    .slice(0, -1)
                    .map((word, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.8,
                          delay: 0.6 + index * 0.15,
                        }}
                        className="block text-white"
                      >
                        {word}
                      </motion.span>
                    ))}
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 1,
                      delay: 0.9,
                      type: "spring",
                      bounce: 0.5,
                    }}
                    className={`block text-transparent bg-clip-text bg-gradient-to-r ${accentColor} ${
                      isAmberTheme
                        ? "drop-shadow-[0_0_40px_rgba(245,158,11,0.9)]"
                        : isOrangeTheme
                          ? "drop-shadow-[0_0_40px_rgba(249,115,22,0.9)]"
                          : "drop-shadow-[0_0_40px_rgba(34,197,94,0.9)]"
                    }`}
                  >
                    {title.split(" ").slice(-1)[0]}
                  </motion.span>
                </h1>

                {/* Decorative Line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.2, delay: 1.2 }}
                  className={`w-48 h-1.5 bg-gradient-to-r ${accentColor} mb-8 origin-left ${
                    isAmberTheme
                      ? "shadow-[0_0_30px_rgba(245,158,11,0.8)]"
                      : isOrangeTheme
                        ? "shadow-[0_0_30px_rgba(249,115,22,0.8)]"
                        : "shadow-[0_0_30px_rgba(34,197,94,0.8)]"
                  }`}
                />
              </motion.div>
            </div>
          ) : (
            // Original Icon Badge Layout (when no logo)
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-block mb-8"
              >
                <div
                  className={`inline-flex items-center gap-3 px-8 py-4 ${
                    isOrangeTheme
                      ? "bg-orange-500/20 border-orange-500/30 shadow-orange-500/30"
                      : isAmberTheme
                        ? "bg-amber-500/20 border-amber-500/30 shadow-amber-500/30"
                        : "bg-green-500/20 border-green-500/30 shadow-green-500/30"
                  } backdrop-blur-md border rounded-full shadow-2xl`}
                >
                  <span className="text-4xl">{icon}</span>
                  <span
                    className={`${
                      isOrangeTheme
                        ? "text-orange-400"
                        : isAmberTheme
                          ? "text-amber-400"
                          : "text-green-400"
                    } text-sm font-black uppercase tracking-[0.3em] font-display`}
                  >
                    {subtitle}
                  </span>
                </div>
              </motion.div>

              {/* Main Heading */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mb-8"
              >
                <h1 className="text-6xl sm:text-7xl lg:text-[120px] font-black text-white mb-6 uppercase leading-[0.9] font-display">
                  {title.split(" ").slice(0, -1).join(" ")}
                  <motion.span
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className={`block text-transparent bg-clip-text bg-gradient-to-r ${accentColor} ${
                      isOrangeTheme
                        ? "drop-shadow-[0_0_30px_rgba(249,115,22,0.8)]"
                        : isAmberTheme
                          ? "drop-shadow-[0_0_30px_rgba(245,158,11,0.8)]"
                          : "drop-shadow-[0_0_30px_rgba(34,197,94,0.8)]"
                    }`}
                  >
                    {title.split(" ").slice(-1)[0]}
                  </motion.span>
                </h1>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className={`w-32 h-2 bg-gradient-to-r ${accentColor} mx-auto mb-8 ${
                    isOrangeTheme
                      ? "shadow-[0_0_20px_rgba(249,115,22,0.6)]"
                      : isAmberTheme
                        ? "shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                        : "shadow-[0_0_20px_rgba(34,197,94,0.6)]"
                  }`}
                />
              </motion.div>
            </div>
          )}

          {/* Description */}
          {description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-semibold text-center"
            >
              {description}
            </motion.p>
          )}

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                onClick={onCtaClick}
                className={`relative bg-gradient-to-r ${accentColor} ${
                  isOrangeTheme
                    ? "text-white hover:from-orange-600 hover:to-red-600 shadow-[0_0_40px_rgba(249,115,22,0.6)] hover:shadow-[0_0_60px_rgba(249,115,22,0.8)]"
                    : isAmberTheme
                      ? "text-black hover:from-amber-600 hover:to-yellow-600 shadow-[0_0_40px_rgba(245,158,11,0.6)] hover:shadow-[0_0_60px_rgba(245,158,11,0.8)]"
                      : "text-black hover:from-green-600 hover:to-emerald-600 shadow-[0_0_40px_rgba(34,197,94,0.6)] hover:shadow-[0_0_60px_rgba(34,197,94,0.8)]"
                } text-xl font-black uppercase tracking-widest px-12 py-8 rounded-none transition-all duration-300 group overflow-hidden`}
              >
                <span className="relative z-10 flex items-center gap-3">
                  {ctaText}
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Button>
            </motion.div>
            {/* <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                variant="outline"
                onClick={onSecondaryCtaClick}
                className={`border-4 ${
                  isOrangeTheme
                    ? "border-orange-500 text-orange-500 hover:bg-orange-500 bg-orange-500/10"
                    : isAmberTheme
                      ? "border-amber-500 text-amber-500 hover:bg-amber-500 bg-amber-500/10"
                      : "border-green-500 text-green-500 hover:bg-green-500 bg-green-500/10"
                } hover:text-black text-xl font-black uppercase tracking-widest px-12 py-8 rounded-none backdrop-blur-md transition-all duration-300`}
              >
                <Phone className="mr-3 w-6 h-6" />
                {secondaryCtaText}
              </Button>
            </motion.div> */}
          </motion.div>

          {/* Stats - Theme Aware */}
          {/* {stats && stats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.6 }}
              className="grid grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.8 + index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.05 }}
                  className="relative group"
                >
                  <div
                    className={`${
                      isOrangeTheme
                        ? "bg-orange-500/10 border-orange-500/20 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]"
                        : isAmberTheme
                          ? "bg-amber-500/10 border-amber-500/20 hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]"
                          : "bg-green-500/10 border-green-500/20 hover:shadow-[0_0_40px_rgba(34,197,94,0.4)]"
                    } backdrop-blur-md border p-6 rounded-2xl shadow-2xl transition-all duration-300`}
                  >
                    <div
                      className={`text-5xl sm:text-6xl font-black ${
                        isOrangeTheme
                          ? "text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.5)]"
                          : isAmberTheme
                            ? "text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                            : "text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                      } mb-2 font-display`}
                    >
                      {stat.value}
                    </div>
                    <div
                      className={`${
                        isOrangeTheme
                          ? "text-orange-300"
                          : isAmberTheme
                            ? "text-amber-300"
                            : "text-green-300"
                      } uppercase tracking-[0.2em] font-bold text-sm`}
                    >
                      {stat.label}
                    </div>
                  </div>
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      isOrangeTheme
                        ? "from-orange-500/20"
                        : isAmberTheme
                          ? "from-amber-500/20"
                          : "from-green-500/20"
                    } to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                  />
                </motion.div>
              ))}
            </motion.div>
          )} */}
        </div>
      </div>

      {/* Scroll Indicator - Theme Aware */}
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2"
      >
        <div
          className={`w-8 h-14 border-4 ${
            isOrangeTheme
              ? "border-orange-500/40"
              : isAmberTheme
                ? "border-amber-500/40"
                : "border-green-500/40"
          } rounded-full flex justify-center p-2`}
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-2 h-2 ${
              isOrangeTheme
                ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                : isAmberTheme
                  ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                  : "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
            } rounded-full`}
          />
        </div>
      </motion.div>
    </section>
  );
};
