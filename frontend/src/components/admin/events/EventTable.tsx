import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Eye, Users } from "lucide-react";
import { EVENT_STATUS_COLORS } from "@/utils/constants";
import type { Event } from "@/types";

interface EventTableProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onViewDetails: (event: Event) => void;
  onViewStats?: (event: Event) => void;
}

export const EventTable: React.FC<EventTableProps> = ({
  events,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No events found. Create your first event to get started.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Event Name</TableHead>
              <TableHead className="min-w-[100px]">Sport</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="min-w-[150px]">Start Date</TableHead>
              <TableHead className="min-w-[120px]">Location</TableHead>
              <TableHead className="min-w-[100px] text-center">
                Participants
              </TableHead>
              <TableHead className="min-w-[80px]">Registration</TableHead>
              <TableHead className="min-w-[80px]">Active</TableHead>
              <TableHead className="text-right min-w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event._id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{event.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {event.venue}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {event.sport}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={EVENT_STATUS_COLORS[event.status]}>
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDateTime(event.startDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{event.location}</div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {event.participants.length}
                    </span>
                    {event.maxParticipants && (
                      <span className="text-muted-foreground">
                        / {event.maxParticipants}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      event.registrationOpen
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {event.registrationOpen ? "Open" : "Closed"}
                  </Badge>
                  {!event.isPublic && (
                    <Badge variant="outline" className="ml-1">
                      Private
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={event.isActive ? "default" : "secondary"}
                    className={
                      event.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {event.isActive ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onViewDetails(event)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(event)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {
                        event.isActive ? 
                        (<DropdownMenuItem
                          onClick={() => onDelete(event._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                          Make inactive
                        </DropdownMenuItem>) : 
                        // Make event active here
                        (<DropdownMenuItem
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                          Event Already Deleted
                        </DropdownMenuItem>)
                      }
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
