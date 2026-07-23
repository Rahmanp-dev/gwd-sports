"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router-shim";
import { useQuery } from "@tanstack/react-query";
import { homepageService } from "@/services/homepageService";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { LandingEventCard } from "./LandingEventCard";

export default function EventsTimeline() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["landingPageEvents"],
    queryFn: () => homepageService.getLandingPageEvents(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const rawEvents = data?.data;
  const events: any[] = Array.isArray(rawEvents)
    ? rawEvents
    : Array.isArray((rawEvents as any)?.events)
    ? (rawEvents as any).events
    : [];

  if (isLoading) {
    return (
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (error || events.length === 0) {
    return null; // Don't show section if no events
  }

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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full blur-3xl opacity-40"
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
            className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-full mb-8 shadow-lg shadow-amber-500/50"
          >
            <Zap className="w-5 h-5" />
            <span className="text-sm font-black uppercase tracking-[0.3em] font-display">
              Upcoming Events
            </span>
          </motion.div>

          <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-6 uppercase leading-none font-display">
            Compete &
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-500">
              Conquer
            </span>
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-32 h-2 bg-gradient-to-r from-amber-500 to-yellow-500 mx-auto shadow-lg shadow-amber-500/50"
          />
        </motion.div>

        {/* Events */}
        <div className="space-y-12">
          {events.map((card, index) => (
            <LandingEventCard key={card._id} card={card} index={index} />
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
                className="border-4 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black text-xl font-black uppercase px-12 py-7 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-amber-500/50 transition-all"
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
}
