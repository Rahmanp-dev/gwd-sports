import type { LoginCredentials, ApiResponse, User } from '@/types';
import apiService from './apiService';

class AuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    return apiService.post('/user/login', credentials);
  }

  async logout(): Promise<ApiResponse<any>> {
    return apiService.post('/user/logout');
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return apiService.get('/user/profile');
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return apiService.post('/user/refresh-token');
  }
}

export default new AuthService();