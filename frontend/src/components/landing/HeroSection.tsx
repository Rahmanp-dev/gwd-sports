import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Zap } from "lucide-react";

export default function HeroSection() {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background Video with Overlay */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className="w-full h-full object-cover"
        >
          <source src="/videos/landing.webm" type="video/webm" />
        </video>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: videoLoaded ? 1 : 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/50 to-black/85"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: videoLoaded ? 1 : 0 }}
          transition={{ duration: 1.5, delay: 0.8 }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent"
        />
      </div>

      {/* Animated Background Elements */}
      <AnimatePresence>
        {videoLoaded && (
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

      {/* Top Section - MASTER GRADE */}
      <div className="absolute top-[10%] left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Floating Badge */}
          {/* <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: videoLoaded ? 1 : 0, y: videoLoaded ? 0 : -20 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="inline-block mb-8"
          >
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 rounded-full shadow-2xl shadow-amber-500/30">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="text-amber-400 text-sm font-black uppercase tracking-[0.3em] font-display">
                Elite Sports Academy
              </span>
            </div>
          </motion.div> */}

          {/* Main Heading with Stagger */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: videoLoaded ? 1 : 0, y: videoLoaded ? 0 : 30 }}
            transition={{ duration: 1.2, delay: 1.8 }}
            className="flex justify-center"
          >
            <h1 className="text-7xl sm:text-8xl lg:text-[140px] font-black text-white uppercase leading-[0.9] tracking-tighter font-display flex items-center gap-4">
              MASTER
              <motion.span
                initial={{ opacity: 0, x: -50 }}
                animate={{
                  opacity: videoLoaded ? 1 : 0,
                  x: videoLoaded ? 0 : -50,
                }}
                transition={{ duration: 1, delay: 2.2 }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)] font-display"
              >
                GRADE
              </motion.span>
            </h1>
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
                opacity: videoLoaded ? 1 : 0,
                y: videoLoaded ? 0 : 20,
              }}
              transition={{ duration: 1, delay: 2.8 }}
              className="text-3xl sm:text-4xl lg:text-5xl text-white font-black uppercase tracking-wider drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] font-display"
            >
              Where Legends Are Born
            </motion.p>

            {/* Description */}
            {/* <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: videoLoaded ? 1 : 0 }}
              transition={{ duration: 1, delay: 3.2 }}
              className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-semibold"
            >
              Transform your passion into power. Elite coaching, world-class
              facilities, and a community of champions waiting for you.
            </motion.p> */}

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: videoLoaded ? 1 : 0,
                y: videoLoaded ? 0 : 20,
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

      {/* Floating Stats */}
      {/* <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: videoLoaded ? 1 : 0, y: videoLoaded ? 0 : 40 }}
        transition={{ duration: 1, delay: 4 }}
        className="grid grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto"
      >
        {[
          { value: "10K+", label: "Athletes" },
          { value: "7", label: "Sports" },
          { value: "98%", label: "Success" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: videoLoaded ? 1 : 0, y: videoLoaded ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 4.2 + index * 0.15 }}
            whileHover={{ y: -10, scale: 1.05 }}
            className="relative group"
          >
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 p-6 rounded-2xl shadow-2xl hover:shadow-[0_0_40px_rgba(251,191,36,0.4)] transition-all duration-300">
              <div className="text-5xl sm:text-6xl font-black text-amber-500 mb-2 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)] font-display">
                {stat.value}
              </div>
              <div className="text-amber-300 uppercase tracking-[0.2em] font-bold text-sm font-display">
                {stat.label}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </motion.div>
        ))}
      </motion.div> */}

      {/* Scroll Indicator */}
      {/* <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: videoLoaded ? 1 : 0,
          y: videoLoaded ? [0, 15, 0] : 0 
        }}
        transition={{ 
          opacity: { duration: 1, delay: 4.5 },
          y: { duration: 2, repeat: Infinity } 
        }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2"
      >
        <div className="w-8 h-14 border-4 border-amber-500/40 rounded-full flex justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)]"
          />
        </div>
      </motion.div> */}
    </section>
  );
}
