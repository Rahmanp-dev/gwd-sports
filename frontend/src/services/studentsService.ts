import type { Student, StudentFilters, ApiResponse, PaginatedResponse } from '@/types';
import apiService from './apiService';
import { buildQueryString } from '@/utils/helpers';

class StudentsService {
  async getAll(filters: StudentFilters): Promise<PaginatedResponse<Student>> {
    const queryString = buildQueryString(filters);
    return apiService.get(`/admin/students${queryString}`);
  }

  async getById(id: string): Promise<ApiResponse<{ student: Student }>> {
    return apiService.get(`/admin/students/${id}`);
  }

  async create(data: Partial<Student>): Promise<ApiResponse<{ student: Student }>> {
    return apiService.post('/admin/students', data);
  }

  async update(id: string, data: Partial<Student>): Promise<ApiResponse<{ student: Student }>> {
    return apiService.put(`/admin/students/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/admin/students/${id}`);
  }

  async updateKitStatus(
    studentId: string, 
    kitId: string, 
    data: { status: string; cost?: number }
  ): Promise<ApiResponse<any>> {
    return apiService.put(`/admin/students/${studentId}/kits/${kitId}`, data);
  }

  async getStats(): Promise<ApiResponse<any>> {
    return apiService.get('/admin/students/stats');
  }
}

export const studentsService = new StudentsService();