import type { IEvent } from "@/types/event";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface EventCardProps {
  event: IEvent;
  showActions?: boolean;
  onRegister?: (eventId: string) => void;
  onLeave?: (eventId: string) => void;
  isRegistered?: boolean;
}

export default function EventCard({
  event,
  showActions = true,
  onRegister,
  onLeave,
  isRegistered = false,
}: EventCardProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-500",
      published: "bg-blue-500",
      ongoing: "bg-green-500",
      completed: "bg-purple-500",
      cancelled: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const isUpcoming = new Date(event.startDate) > new Date();
  const hasEnded = event.endDate ? new Date(event.endDate) < new Date() : false;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-lg md:text-xl line-clamp-2">
            {event.name}
          </CardTitle>
          <Badge
            className={`${getStatusColor(event.status)} text-white shrink-0`}
          >
            {event.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">
            {event.sport}
          </Badge>
          {event.registrationOpen && isUpcoming && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Open
            </Badge>
          )}
          {!event.isPublic && <Badge variant="secondary">Private</Badge>}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {event.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {format(new Date(event.startDate), "MMM dd, yyyy")}
              {event.endDate &&
                ` - ${format(new Date(event.endDate), "MMM dd, yyyy")}`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {event.venue}, {event.location}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {event.participantCount || 0}
              {event.maxParticipants && ` / ${event.maxParticipants}`}{" "}
              participants
            </span>
          </div>

          {event.entryFee !== undefined && event.entryFee > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span>₹{event.entryFee}</span>
            </div>
          )}

          {event.registrationDeadline && isUpcoming && (
            <div className="flex items-center gap-2 text-orange-600">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="text-xs">
                Register by{" "}
                {format(new Date(event.registrationDeadline), "MMM dd, yyyy")}
              </span>
            </div>
          )}
        </div>

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {event.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {event.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{event.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => navigate(`/events/${event._id}`)}
        >
          View Details
        </Button>

        {showActions && (
          <>
            {isRegistered
              ? isUpcoming && (
                  <Button
                    variant="destructive"
                    className="w-full sm:flex-1"
                    onClick={() => onLeave?.(event._id)}
                  >
                    Leave Event
                  </Button>
                )
              : event.canRegister &&
                !hasEnded && (
                  <Button
                    className="w-full sm:flex-1"
                    onClick={() => onRegister?.(event._id)}
                    disabled={!event.registrationOpen}
                  >
                    Register Now
                  </Button>
                )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
