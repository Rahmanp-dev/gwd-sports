"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { homepageService } from "@/services/homepageService";
import { eventService } from "@/services/eventService";
import { showToast } from "@/utils/toast";
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Search,
  Save,
  Eye,
  Calendar,
  MapPin,
  Users,
} from "lucide-react";
import type { LandingPageEventCard } from "@/services/homepageService";
import type { Event } from "@/types";

const COLOR_SCHEMES = [
  { value: "from-green-600 to-emerald-500", label: "Green to Emerald" },
  { value: "from-orange-600 to-red-500", label: "Orange to Red" },
  { value: "from-blue-600 to-cyan-500", label: "Blue to Cyan" },
  { value: "from-purple-600 to-violet-500", label: "Purple to Violet" },
  { value: "from-pink-600 to-rose-500", label: "Pink to Rose" },
  { value: "from-yellow-600 to-amber-500", label: "Yellow to Amber" },
  { value: "from-indigo-600 to-blue-500", label: "Indigo to Blue" },
  { value: "from-red-600 to-pink-500", label: "Red to Pink" },
];

export const LandingPageManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedColorScheme, setSelectedColorScheme] = useState(
    COLOR_SCHEMES[0].value,
  );
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Record<string, number>>({});

  // Fetch landing page event cards
  const { data: cardsData, isLoading: cardsLoading } = useQuery({
    queryKey: ["adminLandingPageEvents"],
    queryFn: () => homepageService.getAdminLandingPageEvents(),
  });

  // Fetch all published events for selection
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["publishedEvents"],
    queryFn: () =>
      eventService.getAllEvents({
        status: "published",
        limit: 100,
      }),
    enabled: showAddDialog,
  });

  const cards = cardsData?.data || [];
  const events = eventsData?.data?.events || [];

  // Filter events that are not already added
  const availableEvents = events.filter(
    (event: Event) => !cards.some((card) => card.eventId._id === event._id),
  );

  // Search filtered events
  const filteredEvents = availableEvents.filter((event: Event) =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Add event card mutation
  const addMutation = useMutation({
    mutationFn: ({
      eventId,
      colorScheme,
    }: {
      eventId: string;
      colorScheme: string;
    }) => homepageService.addEventCard(eventId, colorScheme),
    onSuccess: () => {
      showToast.success("Event added to landing page");
      queryClient.invalidateQueries({ queryKey: ["adminLandingPageEvents"] });
      queryClient.invalidateQueries({ queryKey: ["landingPageEvents"] });
      setShowAddDialog(false);
      setSelectedEvent("");
      setSelectedColorScheme(COLOR_SCHEMES[0].value);
      setSearchTerm("");
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || "Failed to add event");
    },
  });

  // Update event card mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { order?: number; colorScheme?: string };
    }) => homepageService.updateEventCard(id, data),
    onSuccess: () => {
      showToast.success("Event updated successfully");
      queryClient.invalidateQueries({ queryKey: ["adminLandingPageEvents"] });
      queryClient.invalidateQueries({ queryKey: ["landingPageEvents"] });
      setEditingOrder({});
    },
    onError: (error: any) => {
      showToast.error(
        error.response?.data?.message || "Failed to update event",
      );
    },
  });

  // Delete event card mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => homepageService.deleteEventCard(id),
    onSuccess: () => {
      showToast.success("Event removed from landing page");
      queryClient.invalidateQueries({ queryKey: ["adminLandingPageEvents"] });
      queryClient.invalidateQueries({ queryKey: ["landingPageEvents"] });
      setDeleteCardId(null);
    },
    onError: (error: any) => {
      showToast.error(
        error.response?.data?.message || "Failed to remove event",
      );
    },
  });

  const handleAddEvent = () => {
    if (!selectedEvent) {
      showToast.error("Please select an event");
      return;
    }
    addMutation.mutate({
      eventId: selectedEvent,
      colorScheme: selectedColorScheme,
    });
  };

  const handleUpdateOrder = (cardId: string, newOrder: number) => {
    if (newOrder < 1 || newOrder > cards.length) {
      showToast.error(`Order must be between 1 and ${cards.length}`);
      return;
    }
    updateMutation.mutate({ id: cardId, data: { order: newOrder } });
  };

  const handleMoveUp = (card: LandingPageEventCard) => {
    if (card.order > 1) {
      handleUpdateOrder(card._id, card.order - 1);
    }
  };

  const handleMoveDown = (card: LandingPageEventCard) => {
    if (card.order < cards.length) {
      handleUpdateOrder(card._id, card.order + 1);
    }
  };

  const handleOrderInputChange = (cardId: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setEditingOrder({ ...editingOrder, [cardId]: numValue });
    }
  };

  const handleOrderInputBlur = (cardId: string) => {
    const newOrder = editingOrder[cardId];
    if (newOrder) {
      handleUpdateOrder(cardId, newOrder);
    }
  };

  if (cardsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Landing Page Event Management</h2>
          <p className="text-muted-foreground">
            Manage featured events on the landing page
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Event Cards List */}
      {cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No events added to landing page yet.
              <br />
              Click "Add Event" to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <Card key={card._id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Event Image */}
                  <div className="w-full md:w-48 h-32 shrink-0">
                    {card.eventId.images && card.eventId.images.length > 0 ? (
                      <img
                        src={card.eventId.images[0]}
                        alt={card.eventId.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold line-clamp-1">
                          {card.eventId.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge
                            className={`bg-gradient-to-r ${card.colorScheme} text-white capitalize`}
                          >
                            {card.eventId.sport}
                          </Badge>
                          <Badge variant="outline">Order: {card.order}</Badge>
                        </div>
                      </div>

                      {/* Order Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleMoveUp(card)}
                            disabled={
                              card.order === 1 || updateMutation.isPending
                            }
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleMoveDown(card)}
                            disabled={
                              card.order === cards.length ||
                              updateMutation.isPending
                            }
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={cards.length}
                            value={editingOrder[card._id] ?? card.order}
                            onChange={(e) =>
                              handleOrderInputChange(card._id, e.target.value)
                            }
                            onBlur={() => handleOrderInputBlur(card._id)}
                            className="w-16 h-8 text-center"
                            disabled={updateMutation.isPending}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700"
                            onClick={() =>
                              window.open(
                                `/events/${card.eventId._id}`,
                                "_blank",
                              )
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => setDeleteCardId(card._id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(card.eventId.startDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{card.eventId.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {card.eventId.participants.length}
                          {card.eventId.maxParticipants &&
                            `/${card.eventId.maxParticipants}`}
                        </span>
                      </div>
                    </div>

                    {/* Color Scheme */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Color:
                      </span>
                      <div
                        className={`h-6 w-32 rounded bg-gradient-to-r ${card.colorScheme}`}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Event to Landing Page</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Color Scheme Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Color Scheme</label>
              <Select
                value={selectedColorScheme}
                onValueChange={setSelectedColorScheme}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_SCHEMES.map((scheme) => (
                    <SelectItem key={scheme.value} value={scheme.value}>
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-6 w-24 rounded bg-gradient-to-r ${scheme.value}`}
                        />
                        <span>{scheme.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Events */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Event</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Event Selection */}
            {eventsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm
                  ? "No events found matching your search"
                  : "No available events to add"}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredEvents.map((event: Event) => (
                  <Card
                    key={event._id}
                    className={`cursor-pointer transition-all ${
                      selectedEvent === event._id
                        ? "ring-2 ring-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedEvent(event._id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Event Image Preview */}
                        <div className="w-24 h-16 shrink-0">
                          {event.images && event.images.length > 0 ? (
                            <img
                              src={event.images[0]}
                              alt={event.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                        </div>

                        {/* Event Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">
                            {event.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="capitalize">
                              {event.sport}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.startDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setSelectedEvent("");
                  setSearchTerm("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddEvent}
                disabled={!selectedEvent || addMutation.isPending}
              >
                {addMutation.isPending ? (
                  <>
                    <LoadingSpinner />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteCardId !== null}
        onOpenChange={(open) => !open && setDeleteCardId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the event from the landing page. The event itself
              will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteCardId && deleteMutation.mutate(deleteCardId)
              }
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
