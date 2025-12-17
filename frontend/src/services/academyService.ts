import apiService from "./apiService";

export interface AcademyFees {
  monthly: number;
  quarterly: number;
  yearly: number;
}

export interface AcademyContactInfo {
  name: string;
  phone: string;
  email: string;
}

export interface AcademyTimings {
  opening: string;
  closing: string;
  workingDays: string[];
}

export interface Academy {
  _id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  sports: string[];
  trainers?: any[];
  students?: any[];
  fees: AcademyFees;
  contactInfo: AcademyContactInfo;
  facilities: string[];
  timings: AcademyTimings;
  capacity: number;
  images: string[];
  isActive: boolean;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AcademyFormData {
  name: string;
  description: string;
  location: string;
  address: string;
  sports: string[];
  fees: AcademyFees;
  contactInfo: AcademyContactInfo;
  facilities: string[];
  timings: AcademyTimings;
  capacity: number;
  images: string[];
  isActive?: boolean;
}

export interface AcademyFilters {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  sport?: string;
  isActive?: boolean;
}

export interface AcademyPagination {
  currentPage: number;
  totalPages: number;
  totalAcademies: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AcademyListResponse {
  success: boolean;
  data: {
    academies: Academy[];
    pagination: AcademyPagination;
  };
}

export interface AcademyResponse {
  success: boolean;
  message?: string;
  data: {
    academy: Academy;
  };
}

class AcademyService {
  private baseUrl = "/academy";

  async getAllAcademies(
    filters: AcademyFilters = {},
  ): Promise<AcademyListResponse> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.location) params.append("location", filters.location);
    if (filters.sport) params.append("sport", filters.sport);
    if (filters.isActive !== undefined)
      params.append("isActive", filters.isActive.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    return apiService.get<AcademyListResponse>(url);
  }

  async getAcademyById(id: string): Promise<AcademyResponse> {
    return apiService.get<AcademyResponse>(`${this.baseUrl}/${id}`);
  }

  async createAcademy(data: AcademyFormData): Promise<AcademyResponse> {
    return apiService.post<AcademyResponse>(this.baseUrl, data);
  }

  async updateAcademy(
    id: string,
    data: Partial<AcademyFormData>,
  ): Promise<AcademyResponse> {
    return apiService.put<AcademyResponse>(`${this.baseUrl}/${id}`, data);
  }

  async deleteAcademy(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return apiService.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/${id}`,
    );
  }
}

export const academyService = new AcademyService();
