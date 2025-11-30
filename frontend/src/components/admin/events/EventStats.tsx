import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { adminEventService } from "@/services/eventService";
import {
  Calendar,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EVENT_STATUS_COLORS } from "@/utils/constants";

export const EventStats: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["eventStats"],
    queryFn: () => adminEventService.getEventStats(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="text-center text-red-600 p-4">
        Failed to load event statistics
      </div>
    );
  }

  const stats = data.data;

  const statCards = [
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Upcoming Events",
      value: stats.upcomingEvents,
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Ongoing Events",
      value: stats.ongoingEvents,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Completed Events",
      value: stats.completedEvents,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Total Participants",
      value: stats.totalParticipants,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Avg. Participants",
      value: Math.round(stats.averageParticipants),
      icon: Users,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stat.title}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Events by Status */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Events by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.eventsByStatus.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={EVENT_STATUS_COLORS[item._id]}>
                      {item._id}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {item.count} event{item.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{item.totalParticipants}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Events by Sport */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Events by Sport</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.eventsBySport.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-sm font-medium capitalize">
                      {item._id}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {item.count} event{item.count !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{item.totalParticipants}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      {stats.upcomingEventsList && stats.upcomingEventsList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.upcomingEventsList.slice(0, 5).map((event) => (
                <div
                  key={event._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/50 gap-2"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{event.name}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {event.sport}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{event.participantCount} participants</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
