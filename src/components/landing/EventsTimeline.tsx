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

export default function EventsTimeline({ academy }: { academy?: any }) {
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
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-slate-50">
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
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-br from-[var(--brand-soft)]/50 to-[var(--brand-soft)]/50 rounded-full blur-3xl opacity-60"
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
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-full shadow-sm mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
            <span className="text-sm font-semibold tracking-wider uppercase">
              Upcoming Events
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 mb-6 font-display tracking-tight">
            Compete &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand)] to-[var(--brand-strong)]">
              Conquer
            </span>
          </h2>
        </motion.div>

        {/* Events */}
        <div className="space-y-12">
          {events.map((card, index) => (
            <LandingEventCard key={card._id} card={card} index={index} />
          ))}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
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
                className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 hover:text-[color:var(--brand)] text-lg font-semibold px-10 py-6 rounded-[var(--brand-radius)] shadow-sm hover:shadow-md transition-all"
              >
                View All Events
                <ArrowRight className="ml-3 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
