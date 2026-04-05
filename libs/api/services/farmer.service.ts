import axiosInstance from '../axios-instance';
import { API_ENDPOINTS } from '../endpoints/config';
import { ApplicationStatusId } from '@/libs/types';
import type {
  ApiResponse,
  PaginatedResponse,
  Job,
  CreateJobRequest,
  UpdateJobRequest,
  Application,
  ApplicationDTO,
  FarmerProfile,
  RespondApplicationRequest,
  UpdateFarmerRequest,
  DashboardStats,
} from '@/libs/types';

export const farmerService = {

  getProfile: async (): Promise<ApiResponse<FarmerProfile>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARMER.PROFILE);
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      const response = await axiosInstance.put(API_ENDPOINTS.FARMER.PROFILE, data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: any) {
      // Handle 403 Forbidden - try to retry with fresh login
      if (error.response?.status === 403) {
        try {
          // Clear current tokens
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_email');
            localStorage.removeItem('refresh_token');
          }
          // Redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        } catch (e) {
          console.error('Failed to handle 403 error:', e);
        }
        throw error;
      }

      // Fallback to POST if PUT is not available
      if (error.response?.status === 405) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const response = await axiosInstance.post(API_ENDPOINTS.FARMER.PROFILE, data, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response.data;
      }
      throw error;
    }
  },
}