"use client";
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
    content: `${BRAND_NAME} didn't just improve my game - they transformed my entire life. From struggling player to state champion in 18 months. The coaches here are legends!`,
    rating: 5,
    achievement: "State Champion 2025",
  },
  {
    name: "Michael Chen",
    role: "Professional Footballer",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    content: `The intensity, professionalism, and world-class training here pushed me beyond my limits. Now I'm playing professionally. Dreams do come true at ${BRAND_NAME}!`,
    rating: 5,
    achievement: "Pro League Player",
  },
  {
    name: "Priya Sharma",
    role: "National Swimming Champion",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    content: `Olympic-standard facilities, expert coaches, and a supportive community. ${BRAND_NAME} gave me everything I needed to become a national champion. Forever grateful!`,
    rating: 5,
    achievement: "National Gold Medalist",
  },
];

export default function TestimonialsCarousel({ academy }: { academy?: any }) {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((current + 1) % testimonials.length);
  const prev = () =>
    setCurrent((current - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-blue-50/50 rounded-full blur-3xl"
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
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-full shadow-sm mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm font-semibold tracking-wider uppercase">
              Success Stories
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 mb-6 font-display tracking-tight">
            Champion{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Testimonials
            </span>
          </h2>
        </motion.div>

        {/* Testimonial */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-100 overflow-hidden">
                {/* Quote Icon */}
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-6 -left-6 w-20 h-20 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shadow-sm"
                >
                  <Quote className="w-8 h-8 text-blue-500" />
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-8 items-center pt-4">
                  {/* Image */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex-shrink-0 relative"
                  >
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                      <img
                        src={testimonials[current].image}
                        alt={testimonials[current].name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase shadow-md border border-white flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Verified
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 text-center lg:text-left">
                    {/* Rating */}
                    <div className="flex gap-1 mb-4 justify-center lg:justify-start">
                      {Array.from({ length: testimonials[current].rating }).map(
                        (_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                          </motion.div>
                        ),
                      )}
                    </div>

                    {/* Quote */}
                    <blockquote className="text-xl sm:text-2xl text-slate-700 mb-6 font-medium leading-relaxed">
                      "{testimonials[current].content}"
                    </blockquote>

                    {/* Author */}
                    <div>
                      <div className="text-2xl font-bold text-slate-900 mb-1 font-display tracking-tight">
                        {testimonials[current].name}
                      </div>
                      <div className="text-blue-600 font-semibold mb-3">
                        {testimonials[current].role}
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-full text-sm font-semibold">
                        🏆 {testimonials[current].achievement}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={prev}
                size="icon"
                variant="outline"
                className="w-12 h-12 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={next}
                size="icon"
                variant="outline"
                className="w-12 h-12 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </motion.div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrent(index)}
                whileHover={{ scale: 1.1 }}
                className={`h-2 transition-all duration-300 rounded-full ${
                  current === index
                    ? "w-8 bg-blue-600"
                    : "w-2 bg-slate-300 hover:bg-blue-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
