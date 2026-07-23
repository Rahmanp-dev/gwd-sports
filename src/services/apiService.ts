import { logger } from "@/utils/logger";
import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { authService } from "./authService";

class ApiService {
  private api: AxiosInstance;
  private tokenKey = "mg_auth_token";

  constructor() {
    // Create axios instance
    this.api = axios.create({
      baseURL: "/api",
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
            // Token addition debugging is muted here or info level
            // logger.info("Adding token to request");
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
            logger.warn("Token refresh failed", { error: refreshError });
          }

          // If refresh failed or no token, redirect to login
          localStorage.removeItem(this.tokenKey);
          localStorage.removeItem("mg_refresh_token");
          localStorage.removeItem("mg_user");

          // Only redirect if not already on login page
          if (
            !window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/auth")
          ) {
            window.location.href = "/user/auth";
          }
        }

        // Extract error message - handle validation errors and other errors
        let errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "An error occurred";

        logger.error("API Request Failed", {
          endpoint: originalRequest?.url,
          method: originalRequest?.method,
          statusCode: error.response?.status,
          errorMessage,
          rawError: error.response?.data,
        });

        // Handle Mongoose validation errors
        if (error.response?.data?.errors) {
          const validationErrors = error.response.data.errors;

          // If it's a validation error object, format it nicely
          if (typeof validationErrors === "object") {
            const errorMessages = Object.entries(validationErrors)
              .map(([field, err]: [string, any]) => {
                const fieldName = field.replace(/\.\d+$/, ""); // Remove array indices
                const message = err.message || err.kind || "Invalid value";
                return `${fieldName}: ${message}`;
              })
              .join("\n");

            errorMessage = errorMessages || errorMessage;
          }
        }

        // Return rejected promise with structured error
        return Promise.reject({
          success: false,
          message: errorMessage,
          status: error.response?.status,
          errors: error.response?.data?.errors, // Include raw errors for custom handling
          response: error.response, // Include full response for debugging
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
