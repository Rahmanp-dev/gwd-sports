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
import { EventTable } from "./EventTable";
import { EventForm } from "./EventForm";
import { EventDetails } from "./EventDetails";
import { EventStats } from "./EventStats";
import { adminEventService } from "@/services/eventService";
import { showToast } from "@/utils/toast";
import { Plus, Search, Filter, TrendingUp } from "lucide-react";
import type { Event, EventFormData, EventFilters } from "@/types";
import {
  SPORTS_LIST,
  EVENT_STATUS_OPTIONS,
  EVENT_SORT_OPTIONS,
} from "@/utils/constants";

type DialogMode = "create" | "edit" | "view" | "stats" | null;

export const EventManagement: React.FC = () => {
  const queryClient = useQueryClient();

  // State management
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<EventFilters>({
    page: 1,
    limit: 10,
    search: "",
    sport: "",
    status: undefined,
    sortBy: "startDate",
    sortOrder: "desc",
  });

  // Fetch events with filters
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["events", filters],
    queryFn: () => adminEventService.getAllEvents(filters),
    staleTime: 30000, // 30 seconds
  });

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: (eventData: EventFormData) =>
      adminEventService.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["eventStats"] });
      showToast.success("Event created successfully");
      setDialogMode(null);
      setSelectedEvent(null);
    },
    onError: (error: any) => {
      showToast.error(
        error?.response?.data?.message || "Failed to create event",
      );
    },
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EventFormData> }) =>
      adminEventService.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["eventStats"] });
      showToast.success("Event updated successfully");
      setDialogMode(null);
      setSelectedEvent(null);
    },
    onError: (error: any) => {
      showToast.error(
        error?.response?.data?.message || "Failed to update event",
      );
    },
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminEventService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["eventStats"] });
      showToast.success("Event deleted successfully");
      setDeleteEventId(null);
    },
    onError: (error: any) => {
      showToast.error(
        error?.response?.data?.message || "Failed to delete event",
      );
    },
  });

  // Handlers
  const handleCreateEvent = (data: EventFormData) => {
    createMutation.mutate(data);
  };

  const handleUpdateEvent = (data: EventFormData) => {
    if (selectedEvent) {
      updateMutation.mutate({ id: selectedEvent._id, data });
    }
  };

  const handleDeleteEvent = () => {
    if (deleteEventId) {
      deleteMutation.mutate(deleteEventId);
    }
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setDialogMode("edit");
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setDialogMode("view");
  };

  const handleViewStats = (event: Event) => {
    setSelectedEvent(event);
    setDialogMode("stats");
  };

  const handleDelete = (eventId: string) => {
    setDeleteEventId(eventId);
  };

  const handleFilterChange = (key: keyof EventFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
      sport: "",
      status: undefined,
      sortBy: "startDate",
      sortOrder: "desc",
    });
  };

  const events = data?.data?.events || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header with Stats Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Event Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage all events and tournaments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setDialogMode("stats")}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            View Statistics
          </Button>
          <Button onClick={() => setDialogMode("create")} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events by name, venue, or location..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            {/* Sport Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sport</label>
              <Select
                value={filters.sport || "all"}
                onValueChange={(value) =>
                  handleFilterChange("sport", value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {SPORTS_LIST.map((sport) => (
                    <SelectItem key={sport} value={sport.toLowerCase()}>
                      {sport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  handleFilterChange(
                    "status",
                    value === "all" ? undefined : value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {EVENT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select
                value={filters.sortBy || "startDate"}
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort Order</label>
              <Select
                value={filters.sortOrder || "desc"}
                onValueChange={(value) =>
                  handleFilterChange("sortOrder", value as "asc" | "desc")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Event Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-center text-red-600 p-8">
          <p className="text-lg font-semibold">Failed to load events</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      ) : (
        <>
          <EventTable
            events={events}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
            onViewStats={handleViewStats}
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {(pagination.currentPage - 1) * (filters.limit || 10) + 1} to{" "}
                {Math.min(
                  pagination.currentPage * (filters.limit || 10),
                  pagination.totalEvents,
                )}{" "}
                of {pagination.totalEvents} events
              </div>

              <div className="flex items-center gap-2">
                {/* First Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={!pagination.hasPrevPage}
                >
                  First
                </Button>

                {/* Previous Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="hidden sm:flex items-center gap-1">
                  {/* Show first page */}
                  {pagination.currentPage > 3 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                      >
                        1
                      </Button>
                      {pagination.currentPage > 4 && (
                        <span className="px-2">...</span>
                      )}
                    </>
                  )}

                  {/* Show pages around current page */}
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1,
                  )
                    .filter(
                      (page) =>
                        page === pagination.currentPage ||
                        page === pagination.currentPage - 1 ||
                        page === pagination.currentPage + 1 ||
                        page === pagination.currentPage - 2 ||
                        page === pagination.currentPage + 2,
                    )
                    .filter((page) => page > 0 && page <= pagination.totalPages)
                    .map((page) => (
                      <Button
                        key={page}
                        variant={
                          page === pagination.currentPage
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={
                          page === pagination.currentPage
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }
                      >
                        {page}
                      </Button>
                    ))}

                  {/* Show last page */}
                  {pagination.currentPage < pagination.totalPages - 2 && (
                    <>
                      {pagination.currentPage < pagination.totalPages - 3 && (
                        <span className="px-2">...</span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.totalPages)}
                      >
                        {pagination.totalPages}
                      </Button>
                    </>
                  )}
                </div>

                {/* Mobile: Show current page info */}
                <div className="sm:hidden text-sm font-medium px-3">
                  {pagination.currentPage} / {pagination.totalPages}
                </div>

                {/* Next Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>

                {/* Last Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={!pagination.hasNextPage}
                >
                  Last
                </Button>
              </div>

              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Per page:
                </span>
                <Select
                  value={String(filters.limit || 10)}
                  onValueChange={(value) =>
                    handleFilterChange("limit", Number(value))
                  }
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogMode === "create" || dialogMode === "edit"}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null);
            setSelectedEvent(null);
          }
        }}
      >
        <DialogContent className="max-w-[90vw] lg:max-w-[75vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Create New Event" : "Edit Event"}
            </DialogTitle>
          </DialogHeader>
          <EventForm
            event={selectedEvent || undefined}
            onSubmit={
              dialogMode === "create" ? handleCreateEvent : handleUpdateEvent
            }
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={dialogMode === "view"}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null);
            setSelectedEvent(null);
          }
        }}
      >
        <DialogContent className="max-w-[90vw] lg:max-w-[75vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && <EventDetails event={selectedEvent} />}
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog
        open={dialogMode === "stats"}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null);
            setSelectedEvent(null);
          }
        }}
      >
        <DialogContent className="max-w-[95vw] lg:max-w-[85vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Statistics</DialogTitle>
          </DialogHeader>
          <EventStats />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteEventId !== null}
        onOpenChange={(open) => !open && setDeleteEventId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will soft delete the event. The event will be marked
              as inactive but can be restored if needed, and this event won't be
              visible to participants. All participant data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Make Inactive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
