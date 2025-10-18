import React from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const events = [
  {
    title: "Inter-Academy Football Championship",
    date: "February 15-18, 2026",
    location: "Master Grade Stadium",
    participants: "200+ Athletes",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop",
  },
  {
    title: "National Basketball Tournament",
    date: "March 5-10, 2026",
    location: "Elite Sports Complex",
    participants: "150+ Teams",
    image: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800&h=600&fit=crop",
  },
  {
    title: "Swimming Excellence Gala",
    date: "March 22-24, 2026",
    location: "Olympic Aquatic Center",
    participants: "300+ Swimmers",
    image: "https://images.unsplash.com/photo-1600965962102-9d260a71890d?w=800&h=600&fit=crop",
  },
];

export default function EventsTimeline() {
  return (
    <section className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-6 py-2 bg-purple-600 text-white text-sm font-black uppercase tracking-[0.2em] mb-6">
            Upcoming Events
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 uppercase tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
            Compete & <span className="text-purple-600">Dominate</span>
          </h2>
          <div className="w-24 h-1 bg-purple-600 mx-auto" />
        </motion.div>

        {/* Events */}
        <div className="space-y-8">
          {events.map((event, index) => (
            <motion.div
              key={event.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="grid md:grid-cols-2 gap-0 bg-white overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-purple-600">
                {/* Image */}
                <div className="relative h-64 md:h-auto overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase mb-6 group-hover:text-purple-600 transition-colors" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                    {event.title}
                  </h3>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-4 text-gray-700">
                      <Calendar className="w-6 h-6 text-purple-600 flex-shrink-0" />
                      <span className="font-bold">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-700">
                      <MapPin className="w-6 h-6 text-purple-600 flex-shrink-0" />
                      <span className="font-bold">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-700">
                      <Users className="w-6 h-6 text-purple-600 flex-shrink-0" />
                      <span className="font-bold">{event.participants}</span>
                    </div>
                  </div>

                  <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase w-full sm:w-auto group/btn">
                    Register Now
                    <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button
            variant="outline"
            size="lg"
            className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white font-black uppercase tracking-wider"
          >
            View All Events
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}