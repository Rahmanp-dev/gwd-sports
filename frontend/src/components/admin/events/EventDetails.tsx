import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Mail,
  Phone,
  User,
  ExternalLink,
  Award,
  FileText,
  Tag,
} from 'lucide-react';
import { EVENT_STATUS_COLORS } from '@/utils/constants';
import type { Event } from '@/types';

interface EventDetailsProps {
  event: Event;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ event }) => {
  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-2xl font-bold">{event.name}</h2>
          <Badge className={EVENT_STATUS_COLORS[event.status]}>
            {event.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">
            {event.sport}
          </Badge>
          {event.isPublic && <Badge variant="secondary">Public</Badge>}
          {event.registrationOpen ? (
            <Badge className="bg-green-100 text-green-800">
              Registration Open
            </Badge>
          ) : (
            <Badge variant="secondary">Registration Closed</Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Description */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Description</h3>
        <p className="text-muted-foreground">{event.description}</p>
      </div>

      {/* Date & Location */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Date & Time</h3>
          <div className="flex items-start gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Start</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(event.startDate)}
              </p>
            </div>
          </div>
          {event.endDate && (
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">End</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(event.endDate)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Location</h3>
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{event.venue}</p>
              <p className="text-sm text-muted-foreground">{event.location}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Participants</h3>
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">
              {event.participants.length} Registered
            </p>
            {event.maxParticipants && (
              <p className="text-sm text-muted-foreground">
                Maximum: {event.maxParticipants}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Registration Details */}
      <div className="grid md:grid-cols-2 gap-4">
        {event.entryFee !== undefined && event.entryFee > 0 && (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Entry Fee</p>
              <p className="text-sm text-muted-foreground">₹{event.entryFee}</p>
            </div>
          </div>
        )}
        {event.registrationDeadline && (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Registration Deadline</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(event.registrationDeadline)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{event.contactInfo.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a
              href={`tel:${event.contactInfo.phone}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {event.contactInfo.phone}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a
              href={`mailto:${event.contactInfo.email}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {event.contactInfo.email}
            </a>
          </div>
        </div>
      </div>

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Requirements */}
      {event.requirements && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Requirements</h3>
          <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <p className="text-sm">{event.requirements}</p>
          </div>
        </div>
      )}

      {/* Prizes */}
      {event.prizes && event.prizes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Prizes</h3>
          <div className="space-y-2">
            {event.prizes.map((prize, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <Award className="h-5 w-5 text-yellow-600 mt-0.5" />
                <span className="text-sm">{prize}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      {event.links && event.links.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Event Links</h3>
          <div className="space-y-2">
            {event.links.map((link, index) => (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600 hover:underline truncate">
                  {link}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="pt-4 border-t">
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <p>Created by: {event.createdBy.name}</p>
            <p>Created: {formatDateTime(event.createdAt)}</p>
          </div>
          <div className="text-right">
            <p>Last updated: {formatDateTime(event.updatedAt)}</p>
            <p>Event ID: {event._id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};