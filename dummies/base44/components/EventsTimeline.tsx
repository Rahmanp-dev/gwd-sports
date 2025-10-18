import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const events = [
  {
    title: "Inter-Academy Football Championship",
    date: "February 15-18, 2026",
    location: "Master Grade Main Stadium",
    participants: "200+ Athletes",
    category: "Football",
    gradient: "from-green-500 to-emerald-600",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop",
  },
  {
    title: "National Basketball Tournament",
    date: "March 5-10, 2026",
    location: "Elite Sports Complex",
    participants: "150+ Teams",
    category: "Basketball",
    gradient: "from-orange-500 to-red-600",
    image: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=600&h=400&fit=crop",
  },
  {
    title: "Swimming Excellence Gala",
    date: "March 22-24, 2026",
    location: "Olympic Aquatic Center",
    participants: "300+ Swimmers",
    category: "Swimming",
    gradient: "from-cyan-500 to-blue-600",
    image: "https://images.unsplash.com/photo-1600965962102-9d260a71890d?w=600&h=400&fit=crop",
  },
  {
    title: "Tennis Open Championships",
    date: "April 8-14, 2026",
    location: "Master Grade Tennis Courts",
    participants: "100+ Players",
    category: "Tennis",
    gradient: "from-yellow-500 to-amber-600",
    image: "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=600&h=400&fit=crop",
  },
];

export default function EventsTimeline() {
  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-violet-50/30 to-purple-50/40">
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
            <span className="text-sm font-semibold text-violet-700">Upcoming Events</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
            Compete & <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">Conquer</span>
          </h2>
          <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto font-light">
            Join prestigious tournaments and showcase your skills on the biggest stages
          </p>
        </motion.div>

        {/* Events grid */}
        <div className="space-y-8 lg:space-y-12">
          {events.map((event, index) => (
            <motion.div
              key={event.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl group">
                <div className={`grid lg:grid-cols-2 gap-0 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Image */}
                  <div className={`relative h-64 lg:h-auto overflow-hidden ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <img
                      src={event.image}
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${event.gradient} opacity-40 group-hover:opacity-50 transition-opacity duration-500`} />
                    
                    {/* Category badge */}
                    <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
                      <span className="text-sm font-bold text-stone-900">{event.category}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 sm:p-10 lg:p-12 bg-white flex flex-col justify-center">
                    <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4 group-hover:text-violet-600 transition-colors">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-stone-600">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${event.gradient} flex items-center justify-center`}>
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-3 text-stone-600">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${event.gradient} flex items-center justify-center`}>
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-stone-600">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${event.gradient} flex items-center justify-center`}>
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">{event.participants}</span>
                      </div>
                    </div>

                    <Button
                      className={`bg-gradient-to-r ${event.gradient} hover:shadow-lg text-white rounded-xl group/btn w-full sm:w-auto`}
                    >
                      Register Now
                      <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* View all CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Button
            variant="outline"
            size="lg"
            className="border-2 border-violet-200 hover:border-violet-400 hover:bg-violet-50 text-violet-700 rounded-2xl px-8 group"
          >
            View All Events
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}