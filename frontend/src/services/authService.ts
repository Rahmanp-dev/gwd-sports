import type { User, RegisterData } from "@/types";
import apiService from "./apiService";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      _id: string;
      name: string;
      email: string;
      role: string;
      [key: string]: any;
    };
  };
  message: string;
}

class AuthService {
  private readonly ACCESS_TOKEN_KEY = "mg_auth_token";
  private readonly REFRESH_TOKEN_KEY = "mg_refresh_token";
  private readonly USER_KEY = "mg_user";

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    console.log("AuthService: Sending login request with:", credentials.email);
    return apiService.post<LoginResponse>("/user/login", credentials);
  }

  async register(userData: RegisterData): Promise<LoginResponse> {
    console.log("AuthService: Sending registration request with:", userData.email);
    return apiService.post<LoginResponse>("/user/register", userData);
  }

  async getProfile(): Promise<{ success: boolean; data: { user: User } }> {
    return apiService.get("/user/profile");
  }

  async updateProfile(data: { name?: string; phone?: string; sports?: string[] }): Promise<{
    success: boolean;
    message: string;
    data: { user: User };
  }> {
    return apiService.put("/user/profile", data);
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiService.put("/user/change-password", data);
  }

  async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // TODO: check this
      const response = await apiService.post<LoginResponse>(
        "/user/refresh-token",
        { refreshToken },
      );
      if (response.success && response.data.accessToken) {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, response.data.accessToken);
        return response.data.accessToken;
      }

      return null;
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await apiService.post("/user/logout", { refreshToken });
      }
    } catch (error) {
      console.error("Logout API call failed (non-critical):", error);
    } finally {
      // Clear localStorage regardless of API response
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      console.log("AuthService: Cleared auth data from localStorage");
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    console.log("AuthService: Checking authentication:", !!token);
    return !!token;
  }
}

export const authService = new AuthService();
