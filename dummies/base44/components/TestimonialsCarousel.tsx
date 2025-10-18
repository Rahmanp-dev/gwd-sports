import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Parent of Basketball Academy Student",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    content: "Master Grade transformed my daughter's passion into professional-level skills. The coaching staff is exceptional, and the facilities are world-class. We've seen tremendous growth in just 6 months!",
    rating: 5,
    sport: "Basketball",
  },
  {
    name: "Michael Chen",
    role: "Professional Football Athlete",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    content: "Started here as a beginner and now I'm playing at state level. The progressive training methodology and personalized attention made all the difference. Master Grade is where champions are truly built.",
    rating: 5,
    sport: "Football",
  },
  {
    name: "Priya Sharma",
    role: "Swimming Academy Graduate",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    content: "The Olympic-standard training and supportive environment helped me achieve my national championship. The coaches here don't just train athletes, they build confident, disciplined individuals.",
    rating: 5,
    sport: "Swimming",
  },
  {
    name: "David Martinez",
    role: "Parent of Tennis Student",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    content: "My son's journey from a beginner to a competitive player has been incredible. The structured curriculum and state-of-the-art facilities at Master Grade are unmatched. Highly recommended!",
    rating: 5,
    sport: "Tennis",
  },
];

export default function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((current + 1) % testimonials.length);
  const prev = () => setCurrent((current - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100/80 rounded-full mb-6">
            <span className="text-sm font-semibold text-violet-700">Testimonials</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
            Stories of <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">Success</span>
          </h2>
          <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto font-light">
            Hear from athletes and parents who've experienced the Master Grade difference
          </p>
        </motion.div>

        {/* Testimonial carousel */}
        <div className="relative max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-2xl rounded-3xl">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-white opacity-80" />
                
                {/* Quote icon */}
                <div className="absolute top-8 left-8 w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center opacity-10">
                  <Quote className="w-10 h-10" />
                </div>

                <div className="relative p-8 sm:p-12 lg:p-16">
                  <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden ring-4 ring-white shadow-xl">
                          <img
                            src={testimonials[current].image}
                            alt={testimonials[current].name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <Quote className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center lg:text-left">
                      {/* Rating */}
                      <div className="flex gap-1 mb-4 justify-center lg:justify-start">
                        {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>

                      {/* Quote */}
                      <blockquote className="text-lg sm:text-xl text-stone-700 leading-relaxed mb-6 font-light">
                        "{testimonials[current].content}"
                      </blockquote>

                      {/* Author */}
                      <div>
                        <div className="font-bold text-xl text-stone-900 mb-1">
                          {testimonials[current].name}
                        </div>
                        <div className="text-stone-500">{testimonials[current].role}</div>
                        <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-violet-100 rounded-full">
                          <span className="text-sm font-medium text-violet-700">
                            {testimonials[current].sport}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              onClick={prev}
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-full border-2 border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={next}
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-full border-2 border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  current === index
                    ? "w-8 bg-gradient-to-r from-violet-600 to-purple-600"
                    : "bg-stone-300 hover:bg-stone-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}