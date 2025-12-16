export type EventStatus =
  | "draft"
  | "published"
  | "ongoing"
  | "completed"
  | "cancelled";

export interface IEvent {
  _id: string;
  name: string;
  description: string;
  sport: string;
  startDate: string;
  endDate?: string;
  location: string;
  venue: string;
  participants: string[];
  maxParticipants?: number;
  links: string[];
  images: string[];
  createdBy: string;
  academyId?: string;
  status: EventStatus;
  isPublic: boolean;
  registrationOpen: boolean;
  registrationDeadline?: string;
  entryFee?: number;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  tags: string[];
  requirements?: string;
  prizes?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  participantCount?: number;
  canRegister?: boolean;
}

export interface EventsResponse {
  success: boolean;
  data: IEvent[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalEvents: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface EventResponse {
  success: boolean;
  data: IEvent;
}
