import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  Zap,
  LogOut,
  Filter,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { UserProtectedRoute } from "@/components/auth/UserProtectedRoute";
import { eventService } from "@/services/eventService";
import { showToast } from "@/utils/toast";
import { EVENT_STATUS_COLORS } from "@/utils/constants";
import Footer from "@/components/landing/Footer";
import type { Event } from "@/types";

function MyEventsContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "upcoming">("all");
  const [leaveEventId, setLeaveEventId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["myEvents", page, filter],
    queryFn: () =>
      eventService.getMyEvents({
        page,
        limit: 12,
        upcoming: filter === "upcoming",
      }),
  });

  const leaveMutation = useMutation({
    mutationFn: (eventId: string) => eventService.leaveEvent(eventId),
    onSuccess: () => {
      showToast.success("Successfully left the event");
      queryClient.invalidateQueries({ queryKey: ["myEvents"] });
      setLeaveEventId(null);
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || "Failed to leave event");
    },
  });

  const events = data?.data?.events || [];
  const pagination = data?.data?.pagination;

  const handleLeaveEvent = () => {
    if (leaveEventId) {
      leaveMutation.mutate(leaveEventId);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-950/30 to-black overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-indigo-400/30 rounded-full"
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
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full mb-8 shadow-lg"
          >
            <Trophy className="w-5 h-5" />
            <span
              className="text-sm font-black uppercase tracking-[0.3em]"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              My Events
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-6 uppercase tracking-tighter leading-none"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
              Journey
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-300 max-w-3xl mx-auto mb-8"
          >
            Track all events you've joined and manage your participation
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={() => navigate("/events")}
              size="lg"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              <Zap className="mr-2 h-5 w-5" />
              Discover More Events
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-gray-400">Filter:</span>
              <Select
                value={filter}
                onValueChange={(value: "all" | "upcoming") => setFilter(value)}
              >
                <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="upcoming">Upcoming Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-gray-400">
              Total Events:{" "}
              <span className="text-white font-bold">
                {pagination?.totalEvents || 0}
              </span>
            </div>
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
                <Trophy className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  No events yet
                </h3>
                <p className="mb-6">
                  Start your journey by joining exciting events
                </p>
                <Button
                  onClick={() => navigate("/events")}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500"
                >
                  Browse Events
                </Button>
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
                    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300 group overflow-hidden h-full">
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
                            <Badge
                              className={`absolute top-4 right-4 ${EVENT_STATUS_COLORS[event.status]}`}
                            >
                              {event.status}
                            </Badge>
                          </div>
                        )}

                        <div className="p-6">
                          {/* Sport Badge */}
                          <Badge
                            variant="outline"
                            className="capitalize border-indigo-500/50 text-indigo-400 mb-3"
                          >
                            {event.sport}
                          </Badge>

                          {/* Event Name */}
                          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">
                            {event.name}
                          </h3>

                          {/* Event Details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Calendar className="h-4 w-4 text-indigo-400" />
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
                                {event.participants?.length || 0} participants
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              onClick={() => navigate(`/events/${event._id}`)}
                              className="flex-1"
                              variant="outline"
                            >
                              View Details
                            </Button>
                            <Button
                              onClick={() => setLeaveEventId(event._id)}
                              variant="destructive"
                              size="icon"
                              disabled={
                                event.status === "completed" ||
                                event.status === "cancelled"
                              }
                            >
                              <LogOut className="h-4 w-4" />
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

      {/* Leave Event Dialog */}
      <AlertDialog
        open={leaveEventId !== null}
        onOpenChange={(open) => !open && setLeaveEventId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this event? You can always rejoin
              if registration is still open.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaveMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveEvent}
              disabled={leaveMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {leaveMutation.isPending ? "Leaving..." : "Leave Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}

export default function MyEventsPage() {
  return (
    <UserProtectedRoute>
      <MyEventsContent />
    </UserProtectedRoute>
  );
}
