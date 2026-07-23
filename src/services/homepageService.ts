import apiService from "./apiService";

export interface LandingPageEventCard {
  _id: string;
  eventId: {
    _id: string;
    name: string;
    description: string;
    sport: string;
    startDate: string;
    endDate?: string;
    location: string;
    venue: string;
    maxParticipants?: number;
    participants: string[];
    registrationDeadline?: string;
    entryFee?: number;
    images: string[];
    status: string;
    isPublic?: boolean;
    registrationOpen?: boolean;
  };
  order: number;
  colorScheme: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class HomepageService {
  private baseUrl = "/homepage";

  // Public: Get landing page events
  async getLandingPageEvents() {
    return apiService.get<{
      success: boolean;
      data: LandingPageEventCard[];
    }>(`${this.baseUrl}/events`);
  }

  // Admin: Get all landing page events
  async getAdminLandingPageEvents() {
    return apiService.get<{
      success: boolean;
      data: LandingPageEventCard[];
    }>(`${this.baseUrl}/admin/events`);
  }

  // Admin: Add event card
  async addEventCard(eventId: string, colorScheme?: string) {
    return apiService.post<{
      success: boolean;
      message: string;
      data: LandingPageEventCard;
    }>(`${this.baseUrl}/admin/events`, { eventId, colorScheme });
  }

  // Admin: Update event card
  async updateEventCard(
    id: string,
    data: { order?: number; colorScheme?: string; isActive?: boolean },
  ) {
    return apiService.put<{
      success: boolean;
      message: string;
      data: LandingPageEventCard;
    }>(`${this.baseUrl}/admin/events/${id}`, data);
  }

  // Admin: Delete event card
  async deleteEventCard(id: string) {
    return apiService.delete<{
      success: boolean;
      message: string;
    }>(`${this.baseUrl}/admin/events/${id}`);
  }

  // Admin: Bulk update orders
  async bulkUpdateOrders(cards: Array<{ id: string; order: number }>) {
    return apiService.put<{
      success: boolean;
      message: string;
      data: LandingPageEventCard[];
    }>(`${this.baseUrl}/admin/events/bulk/reorder`, { cards });
  }
}

export const homepageService = new HomepageService();
