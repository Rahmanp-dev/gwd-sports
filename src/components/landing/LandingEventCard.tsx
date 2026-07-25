"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  IndianRupee,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "@/lib/router-shim";
import { useCountdown } from "@/hooks/useCountdown";
import type { LandingPageEventCard } from "@/services/homepageService";

interface LandingEventCardProps {
  card: LandingPageEventCard;
  index: number;
}

export const LandingEventCard: React.FC<LandingEventCardProps> = ({
  card,
  index,
}) => {
  const navigate = useNavigate();
  const event = card.eventId;

  // Always call the hook unconditionally (React Hooks rule)
  const timeLeft = useCountdown(
    event.registrationDeadline ||
      new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  );

  // Only use timeLeft if registrationDeadline exists
  const showCountdown = event.registrationDeadline && timeLeft.total > 0;
  const showClosed = event.registrationDeadline && timeLeft.total <= 0;

  const formatDateRange = () => {
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : null;

    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };

    if (end && start.toDateString() !== end.toDateString()) {
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", options)}`;
    }
    return start.toLocaleDateString("en-US", options);
  };

  const handleCardClick = () => {
    navigate(`/events/${event._id}`);
  };

  // Convert legacy color schemes to light theme equivalents
  const getLightGradient = (scheme?: string) => {
    if (!scheme) return "from-[var(--brand-soft)] to-[var(--brand-soft)] text-[color:var(--brand)]";
    if (scheme.includes("amber") || scheme.includes("yellow")) return "from-amber-50 to-orange-50 text-amber-600";
    if (scheme.includes("green") || scheme.includes("emerald")) return "from-emerald-50 to-teal-50 text-emerald-600";
    if (scheme.includes("red") || scheme.includes("rose")) return "from-rose-50 to-red-50 text-rose-600";
    if (scheme.includes("purple") || scheme.includes("pink")) return "from-purple-50 to-fuchsia-50 text-purple-600";
    return "from-[var(--brand-soft)] to-[var(--brand-soft)] text-[color:var(--brand)]";
  };
  const lightStyle = getLightGradient(card.colorScheme);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative bg-white rounded-[var(--brand-radius)] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative h-72 lg:h-auto overflow-hidden">
            {event.images && event.images.length > 0 ? (
              <motion.img
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6 }}
                src={event.images[0]}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                <span className="text-6xl">
                  {event.sport === "football" ? "⚽" : "🏆"}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />

            {/* Floating Badge */}
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className={`absolute top-6 left-6 px-4 py-2 bg-white text-slate-800 rounded-full font-semibold text-xs shadow-md border border-slate-100`}
            >
              🔥 Featured Event
            </motion.div>

            {/* Sport Badge */}
            <div className="absolute bottom-6 left-6">
              <Badge
                className={`bg-[var(--brand)] text-white text-xs px-3 py-1 capitalize font-medium`}
              >
                {event.sport}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-10 flex flex-col justify-center bg-white">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 tracking-tight group-hover:text-[color:var(--brand)] transition-colors font-display line-clamp-2">
              {event.name}
            </h3>

            <div className="space-y-4 mb-8">
              {/* Date */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${lightStyle} rounded-xl flex items-center justify-center shadow-sm shrink-0`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-slate-700 font-semibold text-base font-display">
                  {formatDateRange()}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${lightStyle} rounded-xl flex items-center justify-center shadow-sm shrink-0`}>
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-700 font-semibold text-base font-display">
                    {event.venue}
                  </span>
                  <span className="text-slate-500 text-sm">
                    {event.location}
                  </span>
                </div>
              </div>

              {/* Participants */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${lightStyle} rounded-xl flex items-center justify-center shadow-sm shrink-0`}>
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-slate-700 font-semibold text-base font-display">
                  {event.participants.length}
                  {event.maxParticipants && ` / ${event.maxParticipants}`}{" "}
                  Participants
                </span>
              </div>

              {/* Entry Fee */}
              {event.entryFee !== undefined && event.entryFee && (
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${lightStyle} rounded-xl flex items-center justify-center shadow-sm shrink-0`}>
                    <IndianRupee className="w-6 h-6" />
                  </div>
                  {event.entryFee === 0 ? (
                    <span className="text-slate-700 font-semibold text-base font-display">
                      Free Entry
                    </span>
                  ) : (
                    <span className="text-slate-700 font-semibold text-base font-display">
                      {event.entryFee} Entry Fee
                    </span>
                  )}
                </div>
              )}

              {/* Registration Countdown Timer */}
              {showCountdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative mt-2"
                >
                  <div className="relative bg-slate-50 border border-slate-200 rounded-[var(--brand-radius)] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-[color:var(--brand)]" />
                      <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">
                        Registration Closes In
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Days", value: timeLeft.days },
                        { label: "Hours", value: timeLeft.hours },
                        { label: "Mins", value: timeLeft.minutes },
                        { label: "Secs", value: timeLeft.seconds },
                      ].map((unit, idx) => (
                        <div key={unit.label} className="text-center">
                          <div className={`bg-white border border-slate-100 rounded-lg p-2 mb-1 shadow-sm`}>
                            <span className="text-slate-800 font-bold text-xl font-mono">
                              {String(unit.value).padStart(2, "0")}
                            </span>
                          </div>
                          <span className="text-slate-500 text-[10px] font-bold uppercase">
                            {unit.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Urgency Indicator */}
                    {timeLeft.days === 0 && timeLeft.hours < 24 && (
                      <div className="mt-3 text-center">
                        <span className="text-red-500 font-bold text-xs uppercase tracking-wider">
                          🔥 Hurry! Last Chance
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Registration Closed */}
              {showClosed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-50 border border-red-100 rounded-[var(--brand-radius)] p-4"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Clock className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 font-bold text-xs uppercase tracking-wider">
                      Registration Closed
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                className={`bg-slate-900 text-white hover:bg-slate-800 text-base font-semibold px-8 py-6 rounded-xl w-full group/btn shadow-md`}
              >
                View Details
                <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
