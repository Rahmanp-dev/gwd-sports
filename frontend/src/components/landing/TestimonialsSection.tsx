import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TESTIMONIALS } from '@/data/sportsData';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Testimonial } from '@/types/landing';

export const TestimonialsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  // Get testimonials to display (current and next two)
  const getVisibleTestimonials = () => {
    const testimonials = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % TESTIMONIALS.length;
      testimonials.push(TESTIMONIALS[index]);
    }
    return testimonials;
  };

  return (
    <section id="testimonials" className="section-padding bg-gradient-to-b from-purple-50/30 to-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="px-4 py-2 text-primary-700 border-primary-300">
            Success Stories
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            What Our <span className="gradient-text">Athletes Say</span>
          </h2>
          <p className="text-lg text-gray-600">
            Join thousands of satisfied students and parents who trust Master Grade
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          {/* Desktop View - 3 Cards */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {getVisibleTestimonials().map((testimonial, index) => (
              <TestimonialCard
                key={`${testimonial.id}-${index}`}
                testimonial={testimonial}
                isActive={index === 0}
              />
            ))}
          </div>

          {/* Mobile View - 1 Card */}
          <div className="md:hidden">
            <TestimonialCard
              testimonial={TESTIMONIALS[currentIndex]}
              isActive={true}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              className="rounded-full border-2 border-primary-300 hover:bg-primary-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Dots Indicator */}
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-8 bg-primary-600'
                      : 'w-2 bg-gray-300 hover:bg-primary-300'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="rounded-full border-2 border-primary-300 hover:bg-primary-50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-16 border-t border-gray-200">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">98%</div>
            <div className="text-sm md:text-base text-gray-600">Satisfaction Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">4.9/5</div>
            <div className="text-sm md:text-base text-gray-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">500+</div>
            <div className="text-sm md:text-base text-gray-600">5-Star Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">100%</div>
            <div className="text-sm md:text-base text-gray-600">Recommended</div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface TestimonialCardProps {
  testimonial: Testimonial;
  isActive: boolean;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial, isActive }) => {
  return (
    <Card
      className={`relative transition-all duration-500 ${
        isActive
          ? 'scale-100 shadow-2xl border-primary-300 border-2'
          : 'scale-95 opacity-70'
      }`}
    >
      {/* Quote Icon */}
      <div className="absolute top-6 right-6 text-primary-200">
        <Quote className="h-12 w-12" fill="currentColor" />
      </div>

      <CardContent className="p-8 space-y-6">
        {/* Profile Section */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={testimonial.image}
              alt={testimonial.name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-primary-100"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg text-gray-900">{testimonial.name}</h4>
            <p className="text-sm text-gray-600">{testimonial.role}</p>
            <Badge variant="secondary" className="mt-1 text-xs">
              {testimonial.sport}
            </Badge>
          </div>
        </div>

        {/* Rating */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={`h-5 w-5 ${
                index < testimonial.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <p className="text-gray-700 leading-relaxed">{testimonial.content}</p>

        {/* Achievement Badge */}
        {testimonial.achievement && (
          <div className="pt-4 border-t border-gray-200">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-full">
              <span className="text-lg">🏆</span>
              <span className="text-sm font-medium text-primary-700">
                {testimonial.achievement}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};