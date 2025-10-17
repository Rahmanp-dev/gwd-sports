import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EVENTS } from '@/data/sportsData';
import { Calendar, Clock, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import type { Event } from '@/types/landing';

export const EventsSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Events' },
    { id: 'tournament', label: 'Tournaments' },
    { id: 'workshop', label: 'Workshops' },
    { id: 'training', label: 'Training Camps' },
  ];

  const filteredEvents =
    selectedCategory === 'all'
      ? EVENTS
      : EVENTS.filter((event) => event.category === selectedCategory);

  const featuredEvent = EVENTS.find((event) => event.isFeatured);

  return (
    <section id="events" className="section-padding bg-gradient-to-b from-white to-purple-50/30">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="px-4 py-2 text-primary-700 border-primary-300">
            Upcoming Events
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            Join Our <span className="gradient-text">Exciting Events</span>
          </h2>
          <p className="text-lg text-gray-600">
            Participate in tournaments, workshops, and training camps throughout the year
          </p>
        </div>

        {/* Featured Event */}
        {featuredEvent && (
          <div className="mb-12">
            <FeaturedEventCard event={featuredEvent} />
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              className={`transition-all ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'border-primary-300 hover:bg-primary-50'
              }`}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents
            .filter((event) => !event.isFeatured)
            .map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button size="lg" variant="outline" className="text-base px-8 py-6">
            View All Events
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

interface FeaturedEventCardProps {
  event: Event;
}

const FeaturedEventCard: React.FC<FeaturedEventCardProps> = ({ event }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="overflow-hidden border-2 border-primary-300 shadow-2xl">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Image Section */}
        <div className="relative h-64 md:h-auto">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Featured Badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-primary-600 text-white px-4 py-2 text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Featured Event
            </Badge>
          </div>

          {/* Category Badge */}
          <div className="absolute bottom-4 left-4">
            <Badge variant="secondary" className="capitalize">
              {event.category}
            </Badge>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-3xl font-bold text-gray-900">{event.title}</h3>
            <p className="text-gray-600">{event.description}</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="h-5 w-5 text-primary-600" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="h-5 w-5 text-primary-600" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="h-5 w-5 text-primary-600" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button size="lg" className="w-full md:w-auto bg-primary-600 hover:bg-primary-700">
              Register Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

interface EventCardProps {
  event: Event;
  index: number;
}

const EventCard: React.FC<EventCardProps> = ({ event, index }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tournament':
        return 'bg-blue-100 text-blue-700';
      case 'workshop':
        return 'bg-green-100 text-green-700';
      case 'training':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card
      className="group overflow-hidden border-2 border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      style={{
        animation: `fade-in 0.6s ease-out ${index * 0.1}s both`,
      }}
    >
      <CardHeader className="p-0">
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <Badge className={`capitalize ${getCategoryColor(event.category)}`}>
              {event.category}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {event.title}
        </h3>

        <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-primary-600" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-primary-600" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-primary-600" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button className="w-full group-hover:bg-primary-600 group-hover:text-white transition-colors">
          Learn More
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};