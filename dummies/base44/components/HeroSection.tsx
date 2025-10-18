import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-violet-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left space-y-8"
          >
            {/* Brand badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-50 to-purple-50 rounded-full border border-violet-200/50"
            >
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-medium text-violet-900">Elite Sports Training</span>
            </motion.div>

            {/* Main heading */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="block text-stone-900">Master</span>
                <span className="block bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700 bg-clip-text text-transparent">
                  Grade
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-stone-600 font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
                Where Champions Are Built, Dreams Take Flight, and Excellence Becomes Second Nature
              </p>
            </div>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 text-base px-8 py-6 rounded-2xl group"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-stone-200 hover:border-violet-300 hover:bg-violet-50/50 text-stone-900 text-base px-8 py-6 rounded-2xl group"
              >
                <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                Watch Story
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-8 justify-center lg:justify-start pt-8"
            >
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-violet-600">10K+</div>
                <div className="text-sm text-stone-500 font-medium">Athletes Trained</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-violet-600">7</div>
                <div className="text-sm text-stone-500 font-medium">Sports Programs</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-violet-600">98%</div>
                <div className="text-sm text-stone-500 font-medium">Success Rate</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-violet-100 via-purple-50 to-white shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-600/20" />
              <img
                src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=800&fit=crop"
                alt="Athletes training"
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
              />
              
              {/* Floating achievement cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-8 right-8 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    🏆
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-stone-900">250+ Medals</div>
                    <div className="text-xs text-stone-500">This Year</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                    ⭐
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-stone-900">4.9/5 Rating</div>
                    <div className="text-xs text-stone-500">From Parents</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Decorative rings */}
            <div className="absolute -top-6 -right-6 w-24 h-24 border-4 border-violet-200 rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 border-4 border-purple-200 rounded-full" />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="text-xs text-stone-400 font-medium tracking-wider">SCROLL</div>
        <div className="w-px h-12 bg-gradient-to-b from-stone-300 to-transparent" />
      </motion.div>
    </section>
  );
}