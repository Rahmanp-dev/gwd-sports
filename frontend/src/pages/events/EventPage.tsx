import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Search,
  Filter,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { eventService } from "@/services/eventService";
import { useAppSelector } from "@/store";
import { showToast } from "@/utils/toast";
import Footer from "@/components/landing/Footer";
import type { Event } from "@/types";

const SPORTS_LIST = [
  "All Sports",
  "Football",
  "Basketball",
  "Cricket",
  "Tennis",
  "Badminton",
  "Swimming",
  "Athletics",
];

export default function EventPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("");
  const [location, setLocation] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["publicEvents", page, search, sport, location],
    queryFn: () =>
      eventService.getPublicEvents({
        page,
        limit: 12,
        search,
        sport: sport === "All Sports" ? "" : sport.toLowerCase(),
        location,
        isPublic: "true",
        registrationOpen: "true",
      }),
  });

  const events = data?.data?.events || [];
  const pagination = data?.data?.pagination;

  const viewDetails = (eventId: string) => {
    if (!isAuthenticated) {
      showToast.error("Please login to join events");
      navigate("/user/auth");
      return;
    }
    // Navigate to event details or show join confirmation
    navigate(`/events/${eventId}`);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-950/30 to-black overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full mb-8 shadow-lg"
          >
            <Zap className="w-5 h-5" />
            <span
              className="text-sm font-black uppercase tracking-[0.3em]"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              All Events
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-6 uppercase tracking-tighter leading-none"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Discover
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
              Amazing Events
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-300 max-w-3xl mx-auto mb-8"
          >
            Join tournaments, workshops, and competitions across all sports
          </motion.p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {SPORTS_LIST.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />

            <Button
              onClick={() => {
                setSearch("");
                setSport("");
                setLocation("");
              }}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-gray-400"
              >
                <Zap className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  No events found
                </h3>
                <p>Try adjusting your filters or check back later</p>
              </motion.div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event: Event, index: number) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 group overflow-hidden h-full">
                      <CardContent className="p-0">
                        {/* Event Image */}
                        {event.images && event.images.length > 0 && (
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={event.images[0]}
                              alt={event.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                          </div>
                        )}

                        <div className="p-6">
                          {/* Sport Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <Badge
                              variant="outline"
                              className="capitalize border-purple-500/50 text-purple-400"
                            >
                              {event.sport}
                            </Badge>
                            {event.entryFee !== undefined &&
                              event.entryFee > 0 && (
                                <div className="flex items-center gap-1 text-green-400">
                                  <DollarSign className="h-4 w-4" />
                                  <span className="font-bold">
                                    {event.entryFee}
                                  </span>
                                </div>
                              )}
                          </div>

                          {/* Event Name */}
                          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors line-clamp-2">
                            {event.name}
                          </h3>

                          {/* Event Details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Calendar className="h-4 w-4 text-purple-400" />
                              <span className="text-sm">
                                {formatDate(event.startDate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <MapPin className="h-4 w-4 text-green-400" />
                              <span className="text-sm truncate">
                                {event.location}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <Users className="h-4 w-4 text-blue-400" />
                              <span className="text-sm">
                                {event.participants?.length || 0}
                                {event.maxParticipants &&
                                  `/${event.maxParticipants}`}{" "}
                                participants
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              onClick={() => viewDetails(event._id)}
                              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                              disabled={!event.registrationOpen}
                            >
                              {event.registrationOpen
                                ? "View Details"
                                : "Registration Closed"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage}
                    variant="outline"
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    Previous
                  </Button>
                  <span className="text-white">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasNextPage}
                    variant="outline"
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
