import apiService from "./apiService";
import type {
  Event,
  EventFormData,
  EventFilters,
  EventStats,
  PaginatedEventsResponse,
} from "@/types";

class EventService {
  private baseUrl = "/events";

  // Admin: Get all events with pagination and filters
  async getAllEvents(filters: EventFilters = {}) {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const url = queryParams.toString()
      ? `${this.baseUrl}/admin/all-events?${queryParams.toString()}`
      : `${this.baseUrl}/admin/all-events`;

    return apiService.get<{
      success: boolean;
      data: PaginatedEventsResponse;
    }>(url);
  }

  // Admin: Get event statistics
  async getEventStats() {
    return apiService.get<{
      success: boolean;
      data: EventStats;
    }>(`${this.baseUrl}/admin/stats`);
  }

  // Admin: Create new event
  async createEvent(eventData: EventFormData) {
    return apiService.post<{
      success: boolean;
      message: string;
      data: { event: Event };
    }>(this.baseUrl, eventData);
  }

  // Admin: Update event
  async updateEvent(id: string, eventData: Partial<EventFormData>) {
    return apiService.put<{
      success: boolean;
      message: string;
      data: { event: Event };
    }>(`${this.baseUrl}/${id}`, eventData);
  }

  // Admin: Delete event (soft delete)
  async deleteEvent(id: string) {
    return apiService.delete<{
      success: boolean;
      message: string;
    }>(`${this.baseUrl}/${id}`);
  }

  // Public: Get event by ID
  async getEventById(id: string) {
    return apiService.get<{
      success: boolean;
      data: { event: Event };
    }>(`${this.baseUrl}/${id}`);
  }
}

export const eventService = new EventService();
