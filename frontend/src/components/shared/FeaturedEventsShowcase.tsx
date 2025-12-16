import React from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturedEvent {
  title: string;
  date: string;
  location: string;
  participants: string;
  image: string;
  color: string;
  featured?: boolean;
}

interface FeaturedEventsShowcaseProps {
  events: FeaturedEvent[];
  title: string;
  subtitle: string;
  accentColor?: string;
}

export const FeaturedEventsShowcase: React.FC<FeaturedEventsShowcaseProps> = ({
  events,
  title,
  subtitle,
  accentColor = "from-purple-500 to-indigo-500",
}) => {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-purple-950/20 to-black overflow-hidden">
      {/* Cosmic Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Gradient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.3, 1, 1.3],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 rounded-full blur-3xl"
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
            transition={{ duration: 0.6 }}
            className={`inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r ${accentColor} text-white rounded-full mb-8 shadow-[0_0_40px_rgba(168,85,247,0.6)]`}
          >
            <span className="text-sm font-black uppercase tracking-[0.3em] font-display">
              {subtitle}
            </span>
          </motion.div>

          <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-6 uppercase leading-none font-display">
            {title.split(" ").slice(0, -1).join(" ")}
            <span
              className={`block text-transparent bg-clip-text bg-gradient-to-r ${accentColor} drop-shadow-[0_0_30px_rgba(168,85,247,0.8)]`}
            >
              {title.split(" ").slice(-1)[0]}
            </span>
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className={`w-32 h-2 bg-gradient-to-r ${accentColor} mx-auto shadow-[0_0_30px_rgba(168,85,247,0.8)]`}
          />
        </motion.div>

        {/* Featured Events Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {events.map((event, index) => (
            <motion.div
              key={event.title}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              whileHover={{ y: -15, scale: 1.02 }}
              className="group relative"
            >
              <div className="relative h-[500px] rounded-3xl overflow-hidden bg-gradient-to-br from-purple-900/50 to-black border-4 border-purple-500/20 hover:border-purple-500/50 shadow-2xl hover:shadow-[0_30px_80px_rgba(168,85,247,0.5)] transition-all duration-500">
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                </div>

                {/* Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${event.color} opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
                />

                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-8">
                  {/* Featured Badge */}
                  {event.featured && (
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + index * 0.2, type: "spring" }}
                      className="absolute top-6 right-6"
                    >
                      <div
                        className={`bg-gradient-to-r ${event.color} px-4 py-2 rounded-full flex items-center gap-2 shadow-lg`}
                      >
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          ⭐
                        </motion.div>
                        <span className="text-white font-black text-sm uppercase tracking-wider">
                          Featured
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Event Details */}
                  <div className="space-y-4">
                    {/* Date & Location */}
                    <div className="flex flex-wrap gap-4 text-purple-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        <span className="font-bold">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        <span className="font-bold">{event.location}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-4xl font-black text-white uppercase tracking-wide leading-tight group-hover:text-purple-300 transition-colors font-display">
                      {event.title}
                    </h3>

                    {/* Participants */}
                    <div className="flex items-center gap-2 text-purple-200">
                      <Users className="w-5 h-5" />
                      <span className="font-bold">{event.participants}</span>
                    </div>

                    {/* CTA Button */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        className={`bg-gradient-to-r ${event.color} hover:shadow-2xl hover:shadow-purple-500/50 text-white font-black uppercase w-full group/btn mt-4`}
                      >
                        Register Now
                        <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Shine Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                />

                {/* Corner Accents */}
                <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-purple-500/50 rounded-tl-3xl" />
                <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-purple-500/50 rounded-br-3xl" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
