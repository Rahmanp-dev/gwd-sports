import type { Academy, AcademyFilters, ApiResponse, PaginatedResponse } from '@/types';
import apiService from './apiService';
import { buildQueryString } from '@/utils/helpers';

class AcademiesService {
  async getAll(filters: AcademyFilters): Promise<PaginatedResponse<Academy>> {
    const queryString = buildQueryString(filters);
    return apiService.get(`/admin/academies${queryString}`);
  }

  async getById(id: string): Promise<ApiResponse<{ academy: Academy }>> {
    return apiService.get(`/admin/academies/${id}`);
  }

  async create(data: Partial<Academy>): Promise<ApiResponse<{ academy: Academy }>> {
    return apiService.post('/admin/academies', data);
  }

  async update(id: string, data: Partial<Academy>): Promise<ApiResponse<{ academy: Academy }>> {
    return apiService.put(`/admin/academies/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/admin/academies/${id}`);
  }
}

export const academiesService = new AcademiesService();