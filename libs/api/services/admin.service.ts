import axiosInstance from '../axios-instance';
import { API_ENDPOINTS } from '../config';
import type { ApiResponse, PaginatedResponse, User } from '../types';

export const adminService = {
  /**
   * Get admin dashboard data
   */
  getDashboard: async (): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.DASHBOARD);
    return response.data;
  },

  /**
   * Get all users
   */
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.USERS, { params });
    return response.data;
  },

  /**
   * Get user detail
   */
  getUserDetail: async (id: string): Promise<ApiResponse<User>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.USER_DETAIL(id));
    return response.data;
  },

  /**
   * Get all disputes
   */
  getDisputes: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.DISPUTES, { params });
    return response.data;
  },

  /**
   * Get dispute detail
   */
  getDisputeDetail: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.DISPUTE_DETAIL(id));
    return response.data;
  },

  /**
   * Resolve dispute
   */
  resolveDispute: async (id: string, resolution: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.ADMIN.RESOLVE_DISPUTE(id), {
      resolution,
    });
    return response.data;
  },

  /**
   * Get settings
   */
  getSettings: async (): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.SETTINGS);
    return response.data;
  },

  /**
   * Update settings
   */
  updateSettings: async (data: any): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put(API_ENDPOINTS.ADMIN.SETTINGS, data);
    return response.data;
  },

  /**
   * Get statistics
   */
  getStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.STATISTICS, { params });
    return response.data;
  },
};
