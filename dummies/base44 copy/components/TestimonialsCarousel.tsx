import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Basketball Program",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    content: "Master Grade transformed my game completely. The coaching is world-class and the facilities are incredible. I went from bench player to team captain in one season!",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Football Academy",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    content: "Best decision I ever made. The intensity and professionalism here pushed me to levels I didn't think were possible. Now competing at state level!",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Swimming Champion",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    content: "The Olympic-standard training and expert coaches helped me achieve my national championship. This place builds champions, not just athletes.",
    rating: 5,
  },
  {
    name: "David Martinez",
    role: "Tennis Player",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    content: "From beginner to competitive player in less than a year. The structured training program and supportive community make all the difference.",
    rating: 5,
  },
];

export default function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((current + 1) % testimonials.length);
  const prev = () => setCurrent((current - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-6 py-2 bg-purple-600 text-white text-sm font-black uppercase tracking-[0.2em] mb-6">
            Success Stories
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 uppercase tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
            Real <span className="text-purple-600">Athletes</span>, Real Results
          </h2>
          <div className="w-24 h-1 bg-purple-600 mx-auto" />
        </motion.div>

        {/* Testimonial */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-50 p-8 sm:p-12 border-l-4 border-purple-600 shadow-xl"
            >
              <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Image */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-purple-600">
                    <img
                      src={testimonials[current].image}
                      alt={testimonials[current].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <Quote className="w-12 h-12 text-purple-600 mb-4 mx-auto md:mx-0" />
                  
                  <div className="flex gap-1 mb-4 justify-center md:justify-start">
                    {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-purple-600 text-purple-600" />
                    ))}
                  </div>

                  <blockquote className="text-xl sm:text-2xl text-gray-900 mb-6 leading-relaxed font-medium" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                    "{testimonials[current].content}"
                  </blockquote>

                  <div>
                    <div className="text-2xl font-black text-gray-900 uppercase mb-1" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                      {testimonials[current].name}
                    </div>
                    <div className="text-purple-600 font-bold uppercase tracking-wider">
                      {testimonials[current].role}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              onClick={prev}
              size="icon"
              className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              onClick={next}
              size="icon"
              className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`h-1 transition-all duration-300 ${
                  current === index ? "w-12 bg-purple-600" : "w-8 bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}