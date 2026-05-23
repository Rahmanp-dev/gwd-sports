import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/utils/constants";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Basketball Champion",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    content:
      `${BRAND_NAME} didn't just improve my game - they transformed my entire life. From struggling player to state champion in 18 months. The coaches here are legends!`,
    rating: 5,
    achievement: "State Champion 2025",
  },
  {
    name: "Michael Chen",
    role: "Professional Footballer",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    content:
      `The intensity, professionalism, and world-class training here pushed me beyond my limits. Now I'm playing professionally. Dreams do come true at ${BRAND_NAME}!`,
    rating: 5,
    achievement: "Pro League Player",
  },
  {
    name: "Priya Sharma",
    role: "National Swimming Champion",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    content:
      `Olympic-standard facilities, expert coaches, and a supportive community. ${BRAND_NAME} gave me everything I needed to become a national champion. Forever grateful!`,
    rating: 5,
    achievement: "National Gold Medalist",
  },
];

export default function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((current + 1) % testimonials.length);
  const prev = () =>
    setCurrent((current - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-amber-500/10 rounded-full blur-3xl"
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-full mb-8 shadow-lg shadow-amber-500/50"
          >
            <span className="text-sm font-black uppercase tracking-[0.3em] font-display">
              Success Stories
            </span>
          </motion.div>

          <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-6 uppercase tracking-wider leading-none font-display">
            Champion
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-500 font-display">
              Testimonials
            </span>
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-32 h-2 bg-gradient-to-r from-amber-500 to-yellow-500 mx-auto shadow-lg shadow-amber-500/50"
          />
        </motion.div>

        {/* Testimonial */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 100, rotateY: -20 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -100, rotateY: 20 }}
              transition={{ duration: 0.5 }}
              style={{ perspective: "1000px" }}
            >
              <div className="relative bg-gray-900/80 backdrop-blur-md rounded-3xl p-8 sm:p-12 shadow-2xl hover:shadow-[0_30px_80px_rgba(251,191,36,0.3)] transition-all duration-500 border-4 border-amber-500/30">
                {/* Quote Icon */}
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-8 -left-8 w-20 h-20 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/50"
                >
                  <Quote className="w-10 h-10 text-black" />
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-8 items-center">
                  {/* Image */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="flex-shrink-0 relative"
                  >
                    <div className="w-40 h-40 rounded-3xl overflow-hidden ring-8 ring-amber-500 shadow-2xl">
                      <img
                        src={testimonials[current].image}
                        alt={testimonials[current].name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-4 py-2 rounded-full text-xs font-black uppercase shadow-xl">
                      ⭐ Verified
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 text-center lg:text-left">
                    {/* Rating */}
                    <div className="flex gap-2 mb-6 justify-center lg:justify-start">
                      {Array.from({ length: testimonials[current].rating }).map(
                        (_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <Star className="w-8 h-8 fill-amber-500 text-amber-500 drop-shadow-lg" />
                          </motion.div>
                        ),
                      )}
                    </div>

                    {/* Quote */}
                    <blockquote className="text-2xl sm:text-3xl text-white mb-6 leading-relaxed font-bold">
                      "{testimonials[current].content}"
                    </blockquote>

                    {/* Author */}
                    <div className="mb-4">
                      <div
                        className="text-3xl font-black text-white uppercase mb-2"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                      >
                        {testimonials[current].name}
                      </div>
                      <div className="text-amber-400 font-bold uppercase tracking-wider text-lg mb-2">
                        {testimonials[current].role}
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-full text-sm font-black uppercase shadow-lg">
                        🏆 {testimonials[current].achievement}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Glowing Border */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-500 to-yellow-500 opacity-0 hover:opacity-20 blur-2xl transition-opacity duration-500 -z-10" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-center gap-6 mt-12">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={prev}
                size="icon"
                className="w-16 h-16 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black rounded-full shadow-xl hover:shadow-2xl hover:shadow-amber-500/50 transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={next}
                size="icon"
                className="w-16 h-16 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black rounded-full shadow-xl hover:shadow-2xl hover:shadow-amber-500/50 transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </motion.div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-3 mt-8">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrent(index)}
                whileHover={{ scale: 1.2 }}
                className={`h-3 transition-all duration-300 rounded-full ${
                  current === index
                    ? "w-16 bg-gradient-to-r from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/50"
                    : "w-3 bg-gray-600 hover:bg-amber-500/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
