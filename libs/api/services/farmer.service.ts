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
} from '@/libs/types';

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



  /**
   * Get all job application for farmer's job posts
   */
  getJobApplicationsByPost: async (params?: {
    jobId?: string;
    includeAll?: boolean;
    statusId?: number;
  }): Promise<ApiResponse<PaginatedResponse<ApplicationDTO> | ApplicationDTO[]>> => {
    const jobId = params?.jobId || '';
    const queryParams = {
      includeAll: params?.includeAll,
      statusId: params?.statusId,
    };
    const response = await axiosInstance.get(API_ENDPOINTS.FARMER.JOB_APPLICATIONS_BY_POST(jobId), { params: queryParams });
    return response.data;
  },

  /**
   * Get application detail
   */
  getApplicationDetail: async (id: string): Promise<ApiResponse<ApplicationDTO>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARMER.APPLICATION_DETAIL(id));
    return response.data;
  },

  /**
   * Respond to applicant (accept/reject/cancel)
   */
  respondApplicant: async (
    id: string,
    data: RespondApplicationRequest,
  ): Promise<ApiResponse<ApplicationDTO>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.FARMER.RESPOND_APPLICANT(id), data);
    return response.data;
  },

  /**
   * Backward-compatible approve helper
   */
  approveApplicant: async (id: string, responseMessage?: string): Promise<ApiResponse<ApplicationDTO>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.FARMER.RESPOND_APPLICANT(id), {
      statusId: ApplicationStatusId.Accepted,
      respondedAt: new Date().toISOString(),
      responseMessage,
    });
    return response.data;
  },

  /**
   * Backward-compatible reject helper
   */
  rejectApplicant: async (
    id: string,
    reason?: string
  ): Promise<ApiResponse<ApplicationDTO>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.FARMER.RESPOND_APPLICANT(id), {
      statusId: ApplicationStatusId.Rejected,
      respondedAt: new Date().toISOString(),
      responseMessage: reason,
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
