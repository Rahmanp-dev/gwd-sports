import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Phone,
  Mail,
  User,
  ArrowLeft,
  Trophy,
  FileText,
  Tag,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { eventService } from "@/services/eventService";
import { useAppSelector } from "@/store";
import { showToast } from "@/utils/toast";
import { EVENT_STATUS_COLORS } from "@/utils/constants";
import Footer from "@/components/landing/Footer";
import type { Event } from "@/types";

export default function EventDetailsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  // Fetch event details
  const { data, isLoading, error } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventService.getEventById(eventId!),
    enabled: !!eventId,
  });

  const event = data?.data?.event;
  console.log(event);
  const isRegistered = event?.participants
    ? event.participants.some((participant: any) => {
        // Handle both cases: participant is an object or a string
        if (typeof participant === "string") {
          return participant === user?._id;
        }
        // If participant is an object, check _id property
        return participant._id === user?._id;
      })
    : false;

  const now = new Date();
  const isUpcoming = event ? new Date(event.startDate) > now : false;
  const isEventCompleted = event?.endDate
    ? new Date(event.endDate) < now
    : false;
  const isRegistrationDeadlinePassed = event?.registrationDeadline
    ? new Date(event.registrationDeadline) < now
    : false;

  // Event is open for registration if:
  // 1. Status is published
  // 2. registrationOpen flag is true
  // 3. Registration deadline hasn't passed (if set)
  // 4. Event hasn't completed
  const isRegistrationOpen =
    event?.status === "published" &&
    event?.registrationOpen &&
    !isRegistrationDeadlinePassed &&
    !isEventCompleted;

  // Check if event is full
  const isEventFull = event?.maxParticipants
    ? event.participants.length >= event.maxParticipants
    : false;

  // Join event mutation
  const joinMutation = useMutation({
    mutationFn: (id: string) => eventService.joinEvent(id),
    onSuccess: () => {
      showToast.success("Successfully joined the event!");
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["myEvents"] });
      setShowJoinDialog(false);
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || "Failed to join event");
    },
  });

  // Leave event mutation
  const leaveMutation = useMutation({
    mutationFn: (id: string) => eventService.leaveEvent(id),
    onSuccess: () => {
      showToast.success("Successfully left the event");
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["myEvents"] });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || "Failed to leave event");
    },
  });

  const handleJoin = () => {
    if (!isAuthenticated) {
      showToast.info("Please login to join events");
      navigate("/user/auth", { state: { from: `/events/${eventId}` } });
      return;
    }
    setShowJoinDialog(true);
  };

  const confirmJoin = () => {
    if (eventId) {
      joinMutation.mutate(eventId);
    }
  };

  const handleLeave = () => {
    if (eventId) {
      leaveMutation.mutate(eventId);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get registration button text
  const getRegistrationButtonText = () => {
    if (!event.registrationOpen) {
      return "Registration Closed";
    }
    if (isRegistrationDeadlinePassed) {
      return "Registration Deadline Passed";
    }
    if (!isUpcoming) {
      return "Event Has Started";
    }
    if (isEventFull) {
      return "Event is Full";
    }
    return "Register Now";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <h2 className="text-2xl font-bold">Event Not Found</h2>
        <Button onClick={() => navigate("/events")}>Back to Events</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-950/30 to-black">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/events")}
            className="mb-6 text-white hover:text-purple-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Header Card */}
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={EVENT_STATUS_COLORS[event.status]}>
                      {event.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="capitalize border-purple-500/50 text-purple-400"
                    >
                      {event.sport}
                    </Badge>
                    {isEventCompleted && (
                      <Badge className="bg-gray-600 text-white">
                        Event Completed
                      </Badge>
                    )}
                    {!isEventCompleted &&
                      !isRegistrationOpen &&
                      isRegistrationDeadlinePassed && (
                        <Badge className="bg-red-600 text-white">
                          Registration Deadline Passed
                        </Badge>
                      )}
                    {!isEventCompleted &&
                      !isRegistrationOpen &&
                      !isRegistrationDeadlinePassed && (
                        <Badge className="bg-red-600 text-white">
                          Registration Closed
                        </Badge>
                      )}
                    {!isEventCompleted && isRegistrationOpen && (
                      <Badge className="bg-green-600 text-white">
                        Registration Open
                      </Badge>
                    )}
                    {!event.isPublic && (
                      <Badge variant="secondary">Private Event</Badge>
                    )}
                  </div>
                  <CardTitle className="text-3xl md:text-4xl text-white">
                    {event.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Event Images */}
                  {event.images && event.images.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {event.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${event.name} - ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-400" />
                      Description
                    </h3>
                    <p className="text-gray-300 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>

                  <Separator className="bg-gray-700" />

                  {/* Requirements */}
                  {event.requirements && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Requirements
                        </h3>
                        <p className="text-gray-300 whitespace-pre-wrap">
                          {event.requirements}
                        </p>
                      </div>
                      <Separator className="bg-gray-700" />
                    </>
                  )}

                  {/* Prizes */}
                  {event.prizes && event.prizes.length > 0 && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-400" />
                          Prizes
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-300">
                          {event.prizes.map((prize, index) => (
                            <li key={index}>{prize}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator className="bg-gray-700" />
                    </>
                  )}

                  {/* Tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <Tag className="h-5 w-5 text-blue-400" />
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="border-gray-600 text-gray-300"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  {event.links && event.links.length > 0 && (
                    <>
                      <Separator className="bg-gray-700" />
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                          <ExternalLink className="h-5 w-5 text-green-400" />
                          Related Links
                        </h3>
                        <div className="space-y-2">
                          {event.links.map((link, index) => (
                            <a
                              key={index}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-purple-400 hover:text-purple-300"
                            >
                              <ExternalLink className="h-4 w-4" />
                              {link}
                            </a>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Action Card */}
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 sticky top-4">
                <CardHeader>
                  <CardTitle className="text-white">Registration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEventCompleted ? (
                    <div className="p-4 bg-gray-900/30 border border-gray-500/50 rounded-lg">
                      <p className="text-gray-400 font-medium text-center">
                        🏁 Event Completed
                      </p>
                    </div>
                  ) : isRegistered ? (
                    <>
                      <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                        <p className="text-green-400 font-medium">
                          ✓ You are registered for this event
                        </p>
                      </div>
                      {isUpcoming && !isEventCompleted && (
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={handleLeave}
                          disabled={leaveMutation.isPending}
                        >
                          {leaveMutation.isPending
                            ? "Processing..."
                            : "Leave Event"}
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      {!isRegistrationOpen ? (
                        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                          <p className="text-red-400 font-medium text-center flex items-center justify-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            {isRegistrationDeadlinePassed
                              ? "Registration Deadline Has Passed"
                              : "Registration is Closed"}
                          </p>
                        </div>
                      ) : isEventFull ? (
                        <div className="p-4 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                          <p className="text-yellow-400 font-medium text-center">
                            Event is Full
                          </p>
                        </div>
                      ) : (
                        <Button
                          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                          onClick={handleJoin}
                          disabled={
                            !isRegistrationOpen || !isUpcoming || isEventFull
                          }
                        >
                          {getRegistrationButtonText()}
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Event Info Card */}
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">
                    Event Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Event Status */}
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-400">
                        Status
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={EVENT_STATUS_COLORS[event.status]}>
                          {event.status.charAt(0).toUpperCase() +
                            event.status.slice(1)}
                        </Badge>
                        {isRegistrationOpen ? (
                          <Badge className="bg-green-600 text-white">
                            Registration Open
                          </Badge>
                        ) : isRegistrationDeadlinePassed ? (
                          <Badge className="bg-red-600 text-white">
                            Deadline Passed
                          </Badge>
                        ) : (
                          <Badge className="bg-red-600 text-white">
                            Registration Closed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-400">
                        Start Date
                      </p>
                      <p className="text-sm text-white">
                        {formatDate(event.startDate)}
                      </p>
                    </div>
                  </div>

                  {event.endDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-400">
                          End Date
                        </p>
                        <p className="text-sm text-white">
                          {formatDate(event.endDate)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-400">
                        Location
                      </p>
                      <p className="text-sm text-white">
                        {event.venue}, {event.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-400">
                        Participants
                      </p>
                      <p className="text-sm text-white">
                        {event.participants.length || 0}
                        {event.maxParticipants && ` / ${event.maxParticipants}`}
                        {isEventFull && (
                          <span className="ml-2 text-yellow-400 font-semibold">
                            (Full)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {event.entryFee !== undefined && event.entryFee > 0 && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-400">
                          Entry Fee
                        </p>
                        <p className="text-sm text-white">₹{event.entryFee}</p>
                      </div>
                    </div>
                  )}

                  {event.registrationDeadline && (
                    <div className="flex items-start gap-3">
                      <Clock
                        className={`h-5 w-5 mt-0.5 shrink-0 ${
                          isRegistrationDeadlinePassed
                            ? "text-red-400"
                            : "text-orange-400"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-400">
                          Registration Deadline
                        </p>
                        <p
                          className={`text-sm ${
                            isRegistrationDeadlinePassed
                              ? "text-red-400 font-semibold"
                              : "text-white"
                          }`}
                        >
                          {formatDate(event.registrationDeadline)}
                          {isRegistrationDeadlinePassed && " (Passed)"}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Info Card */}
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-400">
                        Contact Person
                      </p>
                      <p className="text-sm text-white">
                        {event.contactInfo.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-400">Phone</p>
                      <a
                        href={`tel:${event.contactInfo.phone}`}
                        className="text-sm text-purple-400 hover:text-purple-300"
                      >
                        {event.contactInfo.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-400">Email</p>
                      <a
                        href={`mailto:${event.contactInfo.email}`}
                        className="text-sm text-purple-400 hover:text-purple-300 break-all"
                      >
                        {event.contactInfo.email}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Join Confirmation Dialog */}
      <AlertDialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Join Event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to join "{event.name}"?
              {event.entryFee && event.entryFee > 0 && (
                <span className="block mt-2 font-semibold">
                  Entry Fee: ₹{event.entryFee}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={joinMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmJoin}
              disabled={joinMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-indigo-500"
            >
              {joinMutation.isPending ? "Joining..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
