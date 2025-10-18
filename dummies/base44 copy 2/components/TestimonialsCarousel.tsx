import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Basketball Champion",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    content: "Master Grade didn't just improve my game - they transformed my entire life. From struggling player to state champion in 18 months. The coaches here are legends!",
    rating: 5,
    achievement: "State Champion 2025",
  },
  {
    name: "Michael Chen",
    role: "Professional Footballer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    content: "The intensity, professionalism, and world-class training here pushed me beyond my limits. Now I'm playing professionally. Dreams do come true at Master Grade!",
    rating: 5,
    achievement: "Pro League Player",
  },
  {
    name: "Priya Sharma",
    role: "National Swimming Champion",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    content: "Olympic-standard facilities, expert coaches, and a supportive community. Master Grade gave me everything I needed to become a national champion. Forever grateful!",
    rating: 5,
    achievement: "National Gold Medalist",
  },
];

export default function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((current + 1) % testimonials.length);
  const prev = () => setCurrent((current - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-purple-50 overflow-hidden">
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
        className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-purple-200/40 rounded-full blur-3xl"
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
            className="inline-flex items-center gap-3 px-8 py-3 bg-purple-600 text-white rounded-full mb-8 shadow-lg shadow-purple-600/50"
          >
            <span className="text-sm font-black uppercase tracking-[0.3em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              Success Stories
            </span>
          </motion.div>
          
          <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black text-gray-900 mb-6 uppercase tracking-tighter leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Champion
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-400">
              Testimonials
            </span>
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-32 h-2 bg-gradient-to-r from-purple-600 to-purple-400 mx-auto shadow-lg shadow-purple-600/50"
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
              <div className="relative bg-white rounded-3xl p-8 sm:p-12 shadow-2xl hover:shadow-[0_30px_80px_rgba(147,51,234,0.3)] transition-all duration-500 border-4 border-purple-200">
                {/* Quote Icon */}
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-8 -left-8 w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-600/50"
                >
                  <Quote className="w-10 h-10 text-white" />
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-8 items-center">
                  {/* Image */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="flex-shrink-0 relative"
                  >
                    <div className="w-40 h-40 rounded-3xl overflow-hidden ring-8 ring-purple-600 shadow-2xl">
                      <img
                        src={testimonials[current].image}
                        alt={testimonials[current].name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full text-xs font-black uppercase shadow-xl">
                      ⭐ Verified
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 text-center lg:text-left">
                    {/* Rating */}
                    <div className="flex gap-2 mb-6 justify-center lg:justify-start">
                      {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <Star className="w-8 h-8 fill-yellow-400 text-yellow-400 drop-shadow-lg" />
                        </motion.div>
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote className="text-2xl sm:text-3xl text-gray-900 mb-6 leading-relaxed font-bold">
                      "{testimonials[current].content}"
                    </blockquote>

                    {/* Author */}
                    <div className="mb-4">
                      <div className="text-3xl font-black text-gray-900 uppercase mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                        {testimonials[current].name}
                      </div>
                      <div className="text-purple-600 font-bold uppercase tracking-wider text-lg mb-2">
                        {testimonials[current].role}
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-full text-sm font-black uppercase shadow-lg">
                        🏆 {testimonials[current].achievement}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Glowing Border */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600 to-purple-400 opacity-0 hover:opacity-20 blur-2xl transition-opacity duration-500 -z-10" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-center gap-6 mt-12">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={prev}
                size="icon"
                className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500 text-white rounded-full shadow-xl hover:shadow-2xl hover:shadow-purple-600/50 transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={next}
                size="icon"
                className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500 text-white rounded-full shadow-xl hover:shadow-2xl hover:shadow-purple-600/50 transition-all"
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
                    ? "w-16 bg-gradient-to-r from-purple-600 to-purple-400 shadow-lg shadow-purple-600/50"
                    : "w-3 bg-gray-300 hover:bg-purple-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}