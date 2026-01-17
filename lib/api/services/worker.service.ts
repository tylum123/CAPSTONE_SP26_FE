import axiosInstance from '../axios-instance';
import { API_ENDPOINTS } from '../config';
import type {
  ApiResponse,
  PaginatedResponse,
  Job,
  Application,
  SearchJobsRequest,
  Wallet,
  Transaction,
} from '../types';

export const workerService = {
  /**
   * Get worker dashboard data
   */
  getDashboard: async (): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WORKER.DASHBOARD);
    return response.data;
  },

  /**
   * Get all available jobs
   */
  getJobs: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Job>>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WORKER.JOBS, { params });
    return response.data;
  },

  /**
   * Get job detail
   */
  getJobDetail: async (id: string): Promise<ApiResponse<Job>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WORKER.JOB_DETAIL(id));
    return response.data;
  },

  /**
   * Search jobs
   */
  searchJobs: async (
    params: SearchJobsRequest
  ): Promise<ApiResponse<PaginatedResponse<Job>>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WORKER.SEARCH_JOBS, { params });
    return response.data;
  },

  /**
   * Apply for a job
   */
  applyJob: async (id: string): Promise<ApiResponse<Application>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.WORKER.APPLY_JOB(id));
    return response.data;
  },

  /**
   * Get worker's applications
   */
  getMyApplications: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Application>>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WORKER.MY_APPLICATIONS, { params });
    return response.data;
  },

  /**
   * Get worker's active jobs
   */
  getMyJobs: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Job>>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WORKER.MY_JOBS, { params });
    return response.data;
  },

  /**
   * Get job history
   */
  getJobHistory: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Job>>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WORKER.JOB_HISTORY, { params });
    return response.data;
  },

  /**
   * Get wallet information
   */
  getWallet: async (): Promise<ApiResponse<Wallet>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WORKER.WALLET);
    return response.data;
  },

  /**
   * Get transactions
   */
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.WORKER.TRANSACTIONS, { params });
    return response.data;
  },
};
