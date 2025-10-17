import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SPORTS } from '@/data/sportsData';
import { ChevronRight, Clock, Users } from 'lucide-react';
import type { Sport } from '@/types/landing';

export const SportsSection: React.FC = () => {
  const [hoveredSport, setHoveredSport] = useState<string | null>(null);

  return (
    <section id="sports" className="section-padding bg-gradient-to-b from-white to-purple-50/30">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="px-4 py-2 text-primary-700 border-primary-300">
            Our Programs
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            Explore Our <span className="gradient-text">Sports Programs</span>
          </h2>
          <p className="text-lg text-gray-600">
            Choose from 7 world-class sports programs designed to bring out the champion in you
          </p>
        </div>

        {/* Sports Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {SPORTS.map((sport, index) => (
            <SportCard
              key={sport.id}
              sport={sport}
              index={index}
              isHovered={hoveredSport === sport.id}
              onHover={() => setHoveredSport(sport.id)}
              onLeave={() => setHoveredSport(null)}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button size="lg" variant="outline" className="text-base px-8 py-6">
            View All Programs
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

interface SportCardProps {
  sport: Sport;
  index: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

const SportCard: React.FC<SportCardProps> = ({ sport, index, isHovered, onHover, onLeave }) => {
  return (
    <Card
      className={`group relative overflow-hidden border-2 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/20 hover:-translate-y-2 cursor-pointer ${
        isHovered ? 'border-primary-400' : 'border-gray-200'
      }`}
      style={{
        animation: `fade-in 0.6s ease-out ${index * 0.1}s both`,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={sport.image}
          alt={sport.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Sport Icon */}
        <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg">
          {sport.icon}
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white">{sport.name}</h3>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-6 space-y-4">
        <p className="text-gray-600 line-clamp-2">{sport.description}</p>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{sport.ageGroup}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{sport.duration}</span>
          </div>
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap gap-2">
          {sport.benefits.slice(0, 3).map((benefit) => (
            <Badge key={benefit} variant="secondary" className="text-xs">
              {benefit}
            </Badge>
          ))}
        </div>

        {/* CTA */}
        <Button className="w-full group-hover:bg-primary-600 group-hover:text-white transition-colors">
          Learn More
          <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>

      {/* Hover Effect Border */}
      <div className={`absolute inset-0 border-2 border-primary-500 rounded-lg transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} pointer-events-none`} />
    </Card>
  );
};