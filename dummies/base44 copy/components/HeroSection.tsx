import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-purple-50 to-white">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1920&h=1080&fit=crop"
          alt="Athletes training"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>

      {/* Diagonal stripe accent */}
      <div className="absolute top-0 right-0 w-full h-full">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-purple-600/10 to-transparent skew-x-12 transform origin-top-right" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block mb-6"
          >
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 text-white text-sm font-black uppercase tracking-[0.2em]">
              <span>Elite Training Center</span>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-gray-900 mb-4 uppercase tracking-tighter leading-none" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
              MASTER
              <span className="block text-purple-600">GRADE</span>
            </h1>
            <div className="w-24 h-1 bg-purple-600 mb-6" />
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-700 font-black uppercase tracking-wide" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Where Champions Are Made
            </p>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed font-medium" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
          >
            Transform your athletic potential with world-class training, elite coaches, and state-of-the-art facilities. Join the academy that produces champions.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white text-lg font-black uppercase tracking-wider px-10 py-7 group shadow-lg shadow-purple-600/30"
            >
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white text-lg font-black uppercase tracking-wider px-10 py-7 group"
            >
              <Phone className="mr-2 w-5 h-5" />
              Call Now
            </Button>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="grid grid-cols-3 gap-6 mt-16 pt-16 border-t border-gray-200"
          >
            <div>
              <div className="text-4xl sm:text-5xl font-black text-purple-600 mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>10K+</div>
              <div className="text-sm sm:text-base text-gray-600 uppercase tracking-wider font-bold">Students</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black text-purple-600 mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>7</div>
              <div className="text-sm sm:text-base text-gray-600 uppercase tracking-wider font-bold">Sports</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black text-purple-600 mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>15+</div>
              <div className="text-sm sm:text-base text-gray-600 uppercase tracking-wider font-bold">Years</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-purple-600 rounded-full mt-2" />
        </div>
      </motion.div>
    </section>
  );
}