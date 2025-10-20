import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Zap } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1920&h=1080&fit=crop"
          alt="Athletes training"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-black/90 to-black/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
      </div>

      {/* Animated Background Elements */}
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
        className="absolute top-20 right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"
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
        className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Floating Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-block mb-8"
          >
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 rounded-full shadow-2xl shadow-amber-500/30">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="text-amber-400 text-sm font-black uppercase tracking-[0.3em]" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.3em' }}>
                Elite Sports Academy
              </span>
            </div>
          </motion.div>

          {/* Main Heading with Stagger */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-7xl sm:text-8xl lg:text-[140px] font-black text-white mb-6 uppercase leading-[0.9] tracking-tighter" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              MASTER
              <motion.span
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]"
              >
                GRADE
              </motion.span>
            </h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="w-32 h-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 mx-auto mb-8 shadow-[0_0_20px_rgba(251,191,36,0.6)]"
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="text-3xl sm:text-4xl lg:text-5xl text-white font-black uppercase mb-6 tracking-wider drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
          >
            Where Legends Are Born
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-semibold"
          >
            Transform your passion into power. Elite coaching, world-class facilities, and a community of champions waiting for you.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className="relative bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-600 hover:to-yellow-600 text-xl font-black uppercase tracking-widest px-12 py-8 rounded-none shadow-[0_0_40px_rgba(251,191,36,0.6)] hover:shadow-[0_0_60px_rgba(251,191,36,0.8)] transition-all duration-300 group overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Start Your Journey
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="border-4 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black text-xl font-black uppercase tracking-widest px-12 py-8 rounded-none backdrop-blur-md bg-amber-500/10 transition-all duration-300"
              >
                <Phone className="mr-3 w-6 h-6" />
                Book Free Trial
              </Button>
            </motion.div>
          </motion.div>

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
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
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.8 + index * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="relative group"
              >
                <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 p-6 rounded-2xl shadow-2xl hover:shadow-[0_0_40px_rgba(251,191,36,0.4)] transition-all duration-300">
                  <div className="text-5xl sm:text-6xl font-black text-amber-500 mb-2 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {stat.value}
                  </div>
                  <div className="text-amber-300 uppercase tracking-[0.2em] font-bold text-sm">
                    {stat.label}
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <div className="w-8 h-14 border-4 border-amber-500/40 rounded-full flex justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)]"
          />
        </div>
      </motion.div>
    </section>
  );
}