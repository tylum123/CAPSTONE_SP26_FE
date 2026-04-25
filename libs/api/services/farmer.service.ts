import axiosInstance from '../axios-instance';
import { API_ENDPOINTS } from '../endpoints/config';
import { ApplicationStatusId } from '@/libs/types';
import type {
  ApiResponse,
  PaginatedResponse,
  Job,
  CreateJobRequest,
  UpdateJobRequest,
  ApplicationDTO,
  FarmerProfile,
  FarmerProfileDTO,
  RespondApplicationRequest,
  UpdateFarmerRequest,
  DashboardStats,
  WorkerProfileDTO,
} from '@/libs/types';

export const farmerService = {

  getProfile: async (): Promise<ApiResponse<FarmerProfile>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARMER.PROFILE);
    return response.data;
  },

  getFarmerProfileById: async (id: string): Promise<ApiResponse<FarmerProfileDTO>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARMER.PROFILE_BY_ID(id));
    return response.data;
  },

  getWorkerProfileById: async (id: string): Promise<ApiResponse<WorkerProfileDTO>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WORKER.PROFILE_BY_ID(id));
    return response.data;
  },

  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARMER.DASHBOARD);
    return response.data;
  },

  /**
   * Update farmer profile
   */
  updateProfile: async (data: UpdateFarmerRequest): Promise<ApiResponse<FarmerProfile>> => {
    try {
      const payload: UpdateFarmerRequest = {
        contactName: data.contactName.trim(),
        address: data.address.trim(),
        dateOfBirth: data.dateOfBirth,
        avatarUrl: data.avatarUrl?.trim() || "",
      };

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      const response = await axiosInstance.put(API_ENDPOINTS.FARMER.PROFILE, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: any) {
      // Fallback to POST if PUT is not available
      if (error.response?.status === 405) {
        const payload: UpdateFarmerRequest = {
          contactName: data.contactName.trim(),
          address: data.address.trim(),
          dateOfBirth: data.dateOfBirth,
          avatarUrl: data.avatarUrl?.trim() || "",
        };
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const response = await axiosInstance.post(API_ENDPOINTS.FARMER.PROFILE, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response.data;
      }
      throw error;
    }
  },
}