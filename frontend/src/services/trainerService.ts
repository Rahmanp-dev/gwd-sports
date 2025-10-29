import apiService from "./apiService";
import type {
  Trainer,
  IQualification,
  IExperience,
  ITrainerProfile,
} from "@/types";

class TrainerAdminService {
  // Admin methods will go here
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
export type { ITrainerProfile, IQualification, IExperience };
