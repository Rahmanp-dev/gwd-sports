import apiService from './apiService';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
  message: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'mg_auth_token';
  private readonly USER_KEY = 'mg_user';

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/user/login', credentials);
    
    if (response.success && response.data.token) {
      // Store token and user in localStorage
      localStorage.setItem(this.TOKEN_KEY, response.data.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(response.data.user));
    }
    
    return response;
  }

  async logout(): Promise<void> {
    // Clear localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    // Call logout endpoint if needed
    try {
      await apiService.post('/user/logout');
    } catch (error) {
      // Ignore logout endpoint errors
      console.log('Logout endpoint error (non-critical):', error);
    }
  }

  async checkAuth() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token found');
      }

      const response = await apiService.get('/admin/profile');
      return response;
    } catch (error) {
      // Clear invalid tokens
      this.logout();
      throw error;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): any | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}

export const authService = new AuthService();