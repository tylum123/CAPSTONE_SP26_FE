import axiosInstance from '../axios-instance';
import { API_ENDPOINTS } from '../config';
import type {
  ApiResponse,
  PaginatedResponse,
  Job,
  CreateJobRequest,
  UpdateJobRequest,
  Application,
} from '../types';

export const farmerService = {
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
