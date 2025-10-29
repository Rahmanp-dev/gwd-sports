import apiService from "./apiService";
import type {
  User,
  UserFormData,
  UserUpdateData,
  UserListResponse,
  UserResponse,
  UserStatsResponse,
  UserFilters,
} from "@/types";

class UserService {
  private baseUrl = "/admin/users";

  async getAllUsers(filters: UserFilters = {}): Promise<UserListResponse> {
    const queryParams = new URLSearchParams();

    // Add each filter parameter to the query string if it exists
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());
    if (filters.role) queryParams.append("role", filters.role);
    if (filters.isActive !== undefined)
      queryParams.append("isActive", filters.isActive.toString());
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);
    if (filters.sortOrder) queryParams.append("sortOrder", filters.sortOrder);

    const url = `${this.baseUrl}?${queryParams.toString()}`;
    return apiService.get<UserListResponse>(url);
  }

  async getUserById(id: string): Promise<UserResponse> {
    return apiService.get<UserResponse>(`${this.baseUrl}/${id}`);
  }

  async createUser(userData: UserFormData): Promise<UserResponse> {
    return apiService.post<UserResponse>(this.baseUrl, userData);
  }

  async updateUser(
    id: string,
    userData: UserUpdateData,
  ): Promise<UserResponse> {
    return apiService.put<UserResponse>(`${this.baseUrl}/${id}`, userData);
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return apiService.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/${id}`,
    );
  }

  async toggleUserStatus(id: string): Promise<UserResponse> {
    return apiService.patch<UserResponse>(
      `${this.baseUrl}/${id}/toggle-status`,
      {},
    );
  }

  async getUserStats(): Promise<UserStatsResponse> {
    return apiService.get<UserStatsResponse>(`${this.baseUrl}/stats`);
  }

  // Get current user profile
  async getProfile() {
    const response = await apiService.get<{
      success: boolean;
      data: {
        user: {
          _id: string;
          name: string;
          email: string;
          phone: string;
          role: string;
          sports: string[];
          isActive: boolean;
          lastLogin?: string;
          createdAt: string;
          updatedAt: string;
        };
      };
    }>("/user/profile");
    return response;
  }

  // Update current user profile
  async updateProfile(data: {
    name?: string;
    phone?: string;
    sports?: string[];
  }) {
    const response = await apiService.put<{
      success: boolean;
      message: string;
      data: {
        user: {
          _id: string;
          name: string;
          email: string;
          phone: string;
          role: string;
          sports: string[];
          isActive: boolean;
          lastLogin?: string;
          createdAt: string;
          updatedAt: string;
        };
      };
    }>("/user/profile", data);
    return response;
  }

  // Change password for current user
  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await apiService.put<{
      success: boolean;
      message: string;
    }>("/user/change-password", data);
    return response;
  }

  // Deactivate current user account
  async deactivateAccount() {
    const response = await apiService.put<{
      success: boolean;
      message: string;
    }>("/user/deactivate");
    return response;
  }

  async checkEmail(email: string): Promise<{
    success: boolean;
    message: string;
    data?: {
      user: User;
    };
  }> {
    return apiService.post<{
      success: boolean;
      message: string;
      data?: {
        user: User;
      };
    }>("/user/check-email", { email });
  }
}

export const userService = new UserService();
