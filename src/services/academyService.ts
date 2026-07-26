import apiService from "./apiService";

export interface AcademyFees {
  monthly: number;
  quarterly: number;
  halfYearly: number;
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

export interface AcademyProgram {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
}

export interface AcademyTestimonial {
  name: string;
  role?: string;
  quote: string;
  avatarUrl?: string;
}

export interface AcademyGalleryItem {
  url: string;
  caption?: string;
}

export interface AcademyHomepageSections {
  programs: boolean;
  achievements: boolean;
  testimonials: boolean;
  gallery: boolean;
  stats: boolean;
}

export interface AcademyTheme {
  primaryColor: string;
  accentColor?: string;
  logoUrl?: string;
  heroImages?: string[];
  tagline?: string;
  style?: "bold" | "classic" | "minimal";
  fontPreset?: "sans" | "editorial" | "rounded";
  programs?: AcademyProgram[];
  testimonials?: AcademyTestimonial[];
  gallery?: AcademyGalleryItem[];
  sections?: AcademyHomepageSections;
}

export interface Academy {
  _id: string;
  name: string;
  slug?: string;
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
  theme?: AcademyTheme;
  platformFeePercent?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  ecosystemScore?: number;
  establishedYear?: number;
  achievements?: string[];
  coachName?: string;
  starPlayers?: any[];
  registeredTeams?: any[];
  gwdFoundingAcademy?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'founding';
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
  platformFeePercent?: number;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
  ecosystemScore?: number;
  verificationStatus?: 'pending' | 'verified' | 'founding';
  gwdFoundingAcademy?: boolean;
}

export interface CreateAcademyDTO {
  name: string;
  slug: string;
  location?: string;
  capacity?: number;
  platformFeePercent?: number;
  adminEmail: string;
  adminPassword?: string;
  adminName?: string;
  adminPhone?: string;
  sports?: string[];
  // Ecosystem fields
  coordinatesLat?: number;
  coordinatesLng?: number;
  ecosystemScore?: number;
  coachName?: string;
  verificationStatus?: 'pending' | 'verified' | 'founding';
  gwdFoundingAcademy?: boolean;
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
  private adminBaseUrl = "/admin/academies";

  async getAllAcademies(
    filters: AcademyFilters = {},
    options: { superAdmin?: boolean } = {},
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
    const base = options.superAdmin ? this.adminBaseUrl : this.baseUrl;
    const url = queryString ? `${base}?${queryString}` : base;

    const response = await apiService.get<any>(url);
    if (options.superAdmin && response?.data?.academies) {
      return {
        success: true,
        data: {
          academies: response.data.academies,
          pagination: {
            currentPage: response.data.pagination?.page || 1,
            totalPages: response.data.pagination?.totalPages || 1,
            totalAcademies: response.data.pagination?.total || response.data.academies.length,
            hasNextPage: (response.data.pagination?.page || 1) < (response.data.pagination?.totalPages || 1),
            hasPrevPage: (response.data.pagination?.page || 1) > 1,
          },
        },
      };
    }
    return response;
  }

  async getAcademyById(id: string): Promise<AcademyResponse> {
    return apiService.get<AcademyResponse>(`${this.baseUrl}/${id}`);
  }

  async createAcademy(data: AcademyFormData | CreateAcademyDTO | any): Promise<AcademyResponse> {
    if ("adminEmail" in data && data.adminEmail) {
      return this.onboardAcademy(data as CreateAcademyDTO);
    }
    return apiService.post<AcademyResponse>(this.baseUrl, data);
  }

  async onboardAcademy(dto: CreateAcademyDTO): Promise<AcademyResponse> {
    return apiService.post<AcademyResponse>(this.adminBaseUrl, dto);
  }

  async updateAcademy(
    id: string,
    data: Partial<AcademyFormData>,
    options: { superAdmin?: boolean } = {},
  ): Promise<AcademyResponse> {
    const base = options.superAdmin ? this.adminBaseUrl : this.baseUrl;
    const response = await apiService.put<any>(`${base}/${id}`, data);
    if (options.superAdmin && response?.data && !response.data.academy) {
      return { success: response.success, data: { academy: response.data } };
    }
    return response;
  }

  async deleteAcademy(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return apiService.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/${id}`,
    );
  }

  async getAcademyMembers(id: string): Promise<{
    success: boolean;
    data: {
      trainers: any[];
      students: any[];
    };
  }> {
    return apiService.get(`${this.baseUrl}/${id}/members`);
  }

  async addStudentToAcademy(
    academyId: string,
    studentId: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiService.post(`${this.baseUrl}/add-student`, {
      academyId,
      studentId,
    });
  }

  async removeStudentFromAcademy(
    academyId: string,
    studentId: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiService.post(`${this.baseUrl}/remove-student`, {
      academyId,
      studentId,
    });
  }

  async addTrainerToAcademy(
    academyId: string,
    trainerId: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiService.post(`${this.baseUrl}/add-trainer`, {
      academyId,
      trainerId,
    });
  }

  async removeTrainerFromAcademy(
    academyId: string,
    trainerId: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiService.post(`${this.baseUrl}/remove-trainer`, {
      academyId,
      trainerId,
    });
  }
}

export const academyService = new AcademyService();
