import axiosInstance from '../axios-instance';
import { API_ENDPOINTS } from '../config';
import type {
  ApiResponse,
  PaginatedResponse,
  Job,
  CreateJobRequest,
  UpdateJobRequest,
  Application,
  FarmerProfile,
  UpdateFarmerRequest,
} from '../types';

export const farmerService = {

  getProfile: async (): Promise<ApiResponse<FarmerProfile>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARMER.PROFILE);
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

  /**
   * Upload farmer avatar
   */

  /**
   * Get farmer dashboard data
   */
  getDashboard: async (): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARMER.DASHBOARD);
    return response.data;
  },

  /**
   * Get all jobs created by farmer
   */
  getJobs: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Job>>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARMER.JOBS, { params });
    return response.data;
  },

  /**
   * Get job detail
   */
  getJobDetail: async (id: string): Promise<ApiResponse<Job>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARMER.JOB_DETAIL(id));
    return response.data;
  },

  /**
   * Create new job
   */
  createJob: async (data: CreateJobRequest): Promise<ApiResponse<Job>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.FARMER.CREATE_JOB, data);
    return response.data;
  },

  /**
   * Update job
   */
  updateJob: async (id: string, data: UpdateJobRequest): Promise<ApiResponse<Job>> => {
    const response = await axiosInstance.put(API_ENDPOINTS.FARMER.UPDATE_JOB(id), data);
    return response.data;
  },

  /**
   * Delete job
   */
  deleteJob: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete(API_ENDPOINTS.FARMER.DELETE_JOB(id));
    return response.data;
  },



  /**
   * Get all applicants for farmer's jobs
   */
  getApplicants: async (params?: {
    jobId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Application>>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARMER.APPLICANTS, { params });
    return response.data;
  },

  /**
   * Get applicant detail
   */
  getApplicantDetail: async (id: string): Promise<ApiResponse<Application>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARMER.APPLICANT_DETAIL(id));
    return response.data;
  },

  /**
   * Approve applicant
   */
  approveApplicant: async (id: string): Promise<ApiResponse<Application>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.FARMER.APPROVE_APPLICANT(id));
    return response.data;
  },

  /**
   * Reject applicant
   */
  rejectApplicant: async (
    id: string,
    reason?: string
  ): Promise<ApiResponse<Application>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.FARMER.REJECT_APPLICANT(id), {
      reason,
    });
    return response.data;
  },

  /**
   * Get payments
   */
  getPayments: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARMER.PAYMENTS, { params });
    return response.data;
  },

  /**
   * Get payment detail
   */
  getPaymentDetail: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARMER.PAYMENT_DETAIL(id));
    return response.data;
  },
};
