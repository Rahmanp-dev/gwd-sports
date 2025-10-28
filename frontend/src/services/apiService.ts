import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { authService } from "./authService";

class ApiService {
  private api: AxiosInstance;
  private tokenKey = "mg_auth_token";

  constructor() {
    // Create axios instance
    this.api = axios.create({
      baseURL: "http://localhost:3000/api",
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: false,
    });

    // Set up interceptors
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Add token to requests
    this.api.interceptors.request.use(
      (config) => {
        // Only add token if Authorization header is not already set
        if (!config.headers.Authorization) {
          const token = localStorage.getItem(this.tokenKey);
          if (token) {
            console.log(
              "Adding token to request:",
              token.substring(0, 15) + "...",
            );
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Handle response
    this.api.interceptors.response.use(
      (response) => {
        // Return the data portion of the response
        return response.data;
      },
      async (error) => {
        const originalRequest = error.config;

        // If 401 error and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh the token
            const newToken = await authService.refreshAccessToken();

            if (newToken) {
              // Retry with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
          }

          // If refresh failed or no token, redirect to login
          localStorage.removeItem(this.tokenKey);
          localStorage.removeItem("mg_refresh_token");
          localStorage.removeItem("mg_user");

          // Only redirect if not already on login page
          if (!window.location.pathname.includes("/login") && 
              !window.location.pathname.includes("/auth")) {
            window.location.href = "/user/auth";
          }
        }

        // Extract error message - handle both response.data structure
        const errorMessage =
          error.response?.data?.message || 
          error.response?.data?.error ||
          error.message || 
          "An error occurred";

        // Return rejected promise with structured error
        return Promise.reject({
          success: false,
          message: errorMessage,
          status: error.response?.status
        });
      },
    );
  }

  // API methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.api.get(url, config);
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.api.post(url, data, config);
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.api.put(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.api.delete(url, config);
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.api.patch(url, data, config);
  }
}

export default new ApiService();
