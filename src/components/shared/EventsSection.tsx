"use client";
import React from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router-shim";

export interface Event {
  title: string;
  date: string;
  location: string;
  participants: string;
  image: string;
  color: string;
}

interface EventsSectionProps {
  title: string;
  subtitle: string;
  events: Event[];
  accentColor?: string;
  bgGradient?: string;
}

export const EventsSection: React.FC<EventsSectionProps> = ({
  title,
  subtitle,
  events,
  accentColor = "from-amber-500 to-yellow-500",
  bgGradient = "from-amber-500/10 to-yellow-500/10",
}) => {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-br ${bgGradient} rounded-full blur-3xl opacity-40`}
      />

      <div className="relative max-w-7xl mx-auto">
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
            className={`inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r ${accentColor} text-black rounded-full mb-8 shadow-lg shadow-green-500/50`}
          >
            <Zap className="w-5 h-5" />
            <span className="text-sm font-black uppercase tracking-[0.3em] font-display">
              {subtitle}
            </span>
          </motion.div>

          <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-6 uppercase leading-none font-display">
            {title.split("&")[0]}
            <span
              className={`block text-transparent bg-clip-text bg-gradient-to-r ${accentColor}`}
            >
              {title.split("&")[1]}
            </span>
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className={`w-32 h-2 bg-gradient-to-r ${accentColor} mx-auto shadow-lg shadow-green-500/50`}
          />
        </motion.div>

        {/* Events */}
        <div className="space-y-12">
          {events.map((event, index) => (
            <motion.div
              key={event.title}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <div className="relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_30px_80px_rgba(34,197,94,0.3)] transition-all duration-500 border-4 border-green-500/20 hover:border-green-500/50">
                <div className="grid lg:grid-cols-2 gap-0">
                  {/* Image */}
                  <div className="relative h-96 lg:h-auto overflow-hidden">
                    <motion.img
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.6 }}
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent" />

                    {/* Floating Badge */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`absolute top-8 left-8 px-6 py-3 bg-gradient-to-r ${event.color} text-white rounded-full font-black uppercase text-sm shadow-2xl`}
                    >
                      🔥 Featured Event
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="p-12 flex flex-col justify-center bg-gradient-to-br from-gray-900 to-black">
                    <h3 className="text-4xl sm:text-5xl font-black text-white uppercase mb-8 tracking-tight group-hover:text-green-500 transition-colors font-display">
                      {event.title}
                    </h3>

                    <div className="space-y-5 mb-10">
                      <motion.div
                        whileHover={{ x: 10 }}
                        className="flex items-center gap-4"
                      >
                        <div
                          className={`w-14 h-14 bg-gradient-to-br ${event.color} rounded-xl flex items-center justify-center shadow-lg`}
                        >
                          <Calendar className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-white font-black text-lg uppercase font-display">
                          {event.date}
                        </span>
                      </motion.div>

                      <motion.div
                        whileHover={{ x: 10 }}
                        className="flex items-center gap-4"
                      >
                        <div
                          className={`w-14 h-14 bg-gradient-to-br ${event.color} rounded-xl flex items-center justify-center shadow-lg`}
                        >
                          <MapPin className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-white font-black text-lg uppercase font-display">
                          {event.location}
                        </span>
                      </motion.div>

                      <motion.div
                        whileHover={{ x: 10 }}
                        className="flex items-center gap-4"
                      >
                        <div
                          className={`w-14 h-14 bg-gradient-to-br ${event.color} rounded-xl flex items-center justify-center shadow-lg`}
                        >
                          <Users className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-white font-black text-lg uppercase font-display">
                          {event.participants}
                        </span>
                      </motion.div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        className={`bg-gradient-to-r ${event.color} hover:shadow-2xl hover:shadow-green-500/50 text-white text-xl font-black uppercase px-10 py-7 rounded-xl w-full sm:w-auto group/btn`}
                      >
                        Register Now
                        <ArrowRight className="ml-3 w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Glowing Border Effect */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${event.color} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 -z-10`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/events">
              <Button
                size="lg"
                variant="outline"
                className={`border-4 border-green-500 text-green-500 hover:bg-green-500 hover:text-black text-xl font-black uppercase px-12 py-7 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-green-500/50 transition-all`}
              >
                View All Events
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
