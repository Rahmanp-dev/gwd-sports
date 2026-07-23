import apiService from "./apiService";
import type {
  Trainer,
  IQualification,
  IExperience,
  ITrainerProfile,
  TrainerFilters,
  UserFormData,
  User,
} from "@/types";

interface TrainerProfileData {
  userId: string;
  sports: string[];
  specializations?: string[];
  qualifications?: {
    certification: string;
    issuedBy: string;
    issuedDate: string;
    expiryDate?: string;
    certificateUrl?: string;
  }[];
  experience?: {
    organization: string;
    position: string;
    startDate: string;
    endDate?: string;
    description: string;
  }[];
  hourlyRate?: number;
  availability?: {
    days: string[];
    timeSlots: {
      start: string;
      end: string;
    }[];
  };
  academyId?: string;
}

interface TrainerListResponse {
  trainers: Trainer[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  data: any;
}

interface TrainerResponse {
  trainer: Trainer;
  message?: string;
  data: any;
}

interface UserResponse {
  user: User;
  message?: string;
  data: any;
}

class TrainerAdminService {
  private baseUrl = "/admin/trainers";
  private userBaseUrl = "/admin/users";

  // Get all trainers with filters
  async getAllTrainers(
    filters: TrainerFilters = {},
  ): Promise<TrainerListResponse> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.sport) params.append("sport", filters.sport);
    if (filters.search) params.append("search", filters.search);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    if (filters.isActive !== undefined)
      params.append("isActive", filters.isActive.toString());

    const response = await apiService.get<TrainerListResponse>(
      `${this.baseUrl}?${params.toString()}`,
    );
    return response.data;
  }

  // Get trainer by ID
  async getTrainerById(trainerId: string): Promise<TrainerResponse> {
    const response = await apiService.get<TrainerResponse>(
      `${this.baseUrl}/${trainerId}`,
    );
    return response.data;
  }

  // Create user (step 1 of trainer creation)
  async createUser(userData: UserFormData): Promise<UserResponse> {
    const response = await apiService.post<UserResponse>(
      this.userBaseUrl,
      userData,
    );
    return response.data;
  }

  // Create trainer profile (step 2 of trainer creation)
  async createTrainerProfile(
    trainerData: TrainerProfileData,
  ): Promise<TrainerResponse> {
    const response = await apiService.post<TrainerResponse>(
      this.baseUrl,
      trainerData,
    );
    return response.data;
  }

  // Update trainer profile
  async updateTrainer(
    trainerId: string,
    trainerData: Partial<TrainerProfileData>,
  ): Promise<TrainerResponse> {
    const response = await apiService.put<TrainerResponse>(
      `${this.baseUrl}/${trainerId}`,
      trainerData,
    );
    return response.data;
  }

  // Delete trainer (deactivate)
  async deleteTrainer(
    trainerId: string,
  ): Promise<{ success: boolean; message: string; data: any }> {
    const response = await apiService.delete<{
      success: boolean;
      message: string;
      data: any;
    }>(`${this.baseUrl}/${trainerId}`);
    return response.data;
  }

  // Toggle trainer status
  async toggleTrainerStatus(trainerId: string): Promise<TrainerResponse> {
    const response = await apiService.patch<TrainerResponse>(
      `${this.baseUrl}/${trainerId}/toggle-status`,
    );
    return response.data;
  }

  // Get trainer statistics
  // async getTrainerStats(): Promise<any> {
  //   const response = await apiService.get(`${this.baseUrl}/stats`);
  //   console.log(response);
  //   return response?.data;
  // }
}

class TrainerService {
  private baseTrainerUrl = "/trainer";

  // Get Own Trainer Profile
  async getOwnTrainerProfile() {
    const response = await apiService.get<{
      success: boolean;
      data: {
        trainerProfile: ITrainerProfile;
      };
    }>(`${this.baseTrainerUrl}/profile`);
    return response;
  }

  // Update Own Trainer Profile
  async updateOwnTrainerProfile(data: {
    sports?: string[];
    specializations?: string[];
    qualifications?: Omit<IQualification, "_id">[];
    experience?: Omit<IExperience, "_id">[];
    hourlyRate?: number;
    availability?: {
      days: string[];
      timeSlots: {
        start: string;
        end: string;
      }[];
    };
  }) {
    const response = await apiService.put<{
      success: boolean;
      message: string;
      data: {
        trainerProfile: ITrainerProfile;
      };
    }>(`${this.baseTrainerUrl}/profile`, data);
    return response;
  }
}

export const trainerService = new TrainerService();
export const trainerAdminService = new TrainerAdminService();
export type {
  ITrainerProfile,
  IQualification,
  IExperience,
  TrainerProfileData,
};
