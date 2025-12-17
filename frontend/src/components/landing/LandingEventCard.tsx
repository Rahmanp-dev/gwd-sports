import React from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ArrowRight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      whileHover={{ y: -10 }}
      className="group cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_30px_80px_rgba(251,191,36,0.3)] transition-all duration-500 border-4 border-amber-500/20 hover:border-amber-500/50">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative h-96 lg:h-auto overflow-hidden">
            {event.images && event.images.length > 0 ? (
              <motion.img
                whileHover={{ scale: 1.15 }}
                transition={{ duration: 0.6 }}
                src={event.images[0]}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <span className="text-6xl">
                  {event.sport === "football" ? "⚽" : "🏆"}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent" />

            {/* Floating Badge */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`absolute top-8 left-8 px-6 py-3 bg-gradient-to-r ${card.colorScheme} text-white rounded-full font-black uppercase text-sm shadow-2xl`}
            >
              🔥 Featured Event
            </motion.div>

            {/* Sport Badge */}
            <div className="absolute bottom-8 left-8">
              <Badge
                className={`bg-gradient-to-r ${card.colorScheme} text-white text-sm px-4 py-2 capitalize`}
              >
                {event.sport}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-12 flex flex-col justify-center bg-gradient-to-br from-gray-900 to-black">
            <h3 className="text-4xl sm:text-5xl font-black text-white uppercase mb-8 tracking-tight group-hover:text-amber-500 transition-colors font-display line-clamp-2">
              {event.name}
            </h3>

            <div className="space-y-5 mb-10">
              {/* Date */}
              <motion.div
                whileHover={{ x: 10 }}
                className="flex items-center gap-4"
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${card.colorScheme} rounded-xl flex items-center justify-center shadow-lg shrink-0`}
                >
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <span className="text-white font-black text-lg uppercase font-display">
                  {formatDateRange()}
                </span>
              </motion.div>

              {/* Location */}
              <motion.div
                whileHover={{ x: 10 }}
                className="flex items-center gap-4"
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${card.colorScheme} rounded-xl flex items-center justify-center shadow-lg shrink-0`}
                >
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-black text-lg uppercase font-display">
                    {event.venue}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {event.location}
                  </span>
                </div>
              </motion.div>

              {/* Participants */}
              <motion.div
                whileHover={{ x: 10 }}
                className="flex items-center gap-4"
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${card.colorScheme} rounded-xl flex items-center justify-center shadow-lg shrink-0`}
                >
                  <Users className="w-7 h-7 text-white" />
                </div>
                <span className="text-white font-black text-lg uppercase font-display">
                  {event.participants.length}
                  {event.maxParticipants && ` / ${event.maxParticipants}`}{" "}
                  Participants
                </span>
              </motion.div>

              {/* Entry Fee */}
              {event.entryFee !== undefined && event.entryFee > 0 && (
                <motion.div
                  whileHover={{ x: 10 }}
                  className="flex items-center gap-4"
                >
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${card.colorScheme} rounded-xl flex items-center justify-center shadow-lg shrink-0`}
                  >
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-white font-black text-lg uppercase font-display">
                    ₹{event.entryFee} Entry Fee
                  </span>
                </motion.div>
              )}

              {/* Registration Deadline */}
              {event.registrationDeadline && (
                <motion.div
                  whileHover={{ x: 10 }}
                  className="flex items-center gap-4"
                >
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${card.colorScheme} rounded-xl flex items-center justify-center shadow-lg shrink-0`}
                  >
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-sm">Register by</span>
                    <span className="text-white font-bold text-base">
                      {new Date(event.registrationDeadline).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className={`bg-gradient-to-r ${card.colorScheme} hover:shadow-2xl hover:shadow-amber-500/50 text-white text-xl font-black uppercase px-10 py-7 rounded-xl w-full sm:w-auto group/btn`}
              >
                View Details
                <ArrowRight className="ml-3 w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Glowing Border Effect */}
        <div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${card.colorScheme} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 -z-10`}
        />
      </div>
    </motion.div>
  );
};
