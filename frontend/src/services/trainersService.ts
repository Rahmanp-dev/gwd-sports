import type { Trainer, TrainerFilters, ApiResponse, PaginatedResponse } from '@/types';
import apiService from './apiService';
import { buildQueryString } from '@/utils/helpers';

class TrainersService {
  async getAll(filters: TrainerFilters): Promise<PaginatedResponse<Trainer>> {
    const queryString = buildQueryString(filters);
    return apiService.get(`/admin/trainers${queryString}`);
  }

  async getById(id: string): Promise<ApiResponse<{ trainer: Trainer }>> {
    return apiService.get(`/admin/trainers/${id}`);
  }

  async create(data: Partial<Trainer>): Promise<ApiResponse<{ trainer: Trainer }>> {
    return apiService.post('/admin/trainers', data);
  }

  async update(id: string, data: Partial<Trainer>): Promise<ApiResponse<{ trainer: Trainer }>> {
    return apiService.put(`/admin/trainers/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/admin/trainers/${id}`);
  }
}

export const trainersService = new TrainersService();