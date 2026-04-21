import axiosInstance from '../axios-instance';
import { API_ENDPOINTS } from '../endpoints/config';
import type { ApiResponse, PaginatedResponse, GetUserResponse, UpdateUserRequest } from '@/libs/types';

const ROLE_TO_ID: Record<string, number> = {
  admin: 1,
  farmer: 2,
  worker: 3,
};

const ADMIN_FALLBACK_ENDPOINTS = {
  DISPUTES: '/disputes',
  DISPUTE_DETAIL: (id: string) => `/disputes/${id}`,
  RESOLVE_DISPUTE: (id: string) => `/disputes/${id}/resolve`,
  SETTINGS: '/admin/settings',
  STATISTICS: '/admin/statistics',
} as const;

const roleToId = (role: string): number => {
  return ROLE_TO_ID[role?.toLowerCase?.() || ''] ?? 3;
};

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
  }): Promise<ApiResponse<PaginatedResponse<GetUserResponse> | GetUserResponse[]>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.USERS, { params });
    return response.data;
  },

  /**
   * Get user detail
   */
  getUserDetail: async (id: string): Promise<ApiResponse<GetUserResponse>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.USER_DETAIL(id));
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserRequest): Promise<ApiResponse<GetUserResponse>> => {
    const response = await axiosInstance.put(API_ENDPOINTS.ADMIN.UPDATE_USER(id), data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete(API_ENDPOINTS.ADMIN.DELETE_USER(id));
    return response.data;
  },

  setUserActiveStatus: async (user: GetUserResponse, isActive: boolean): Promise<ApiResponse<GetUserResponse>> => {
    return adminService.updateUser(user.id, {
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      roleId: roleToId(user.role),
      isActive,
      isVerified: user.isVerified,
    });
  },

  setUserVerificationStatus: async (
    user: GetUserResponse,
    isVerified: boolean
  ): Promise<ApiResponse<GetUserResponse>> => {
    return adminService.updateUser(user.id, {
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      roleId: roleToId(user.role),
      isActive: user.isActive,
      isVerified,
    });
  },

  /**
   * Get all disputes
   */
  getDisputes: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const response = await axiosInstance.get(ADMIN_FALLBACK_ENDPOINTS.DISPUTES, { params });
    return response.data;
  },

  /**
   * Get dispute detail
   */
  getDisputeDetail: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(ADMIN_FALLBACK_ENDPOINTS.DISPUTE_DETAIL(id));
    return response.data;
  },

  /**
   * Get dispute comments
   */
  getDisputeComments: async (id: string): Promise<ApiResponse<any[]>> => {
    const response = await axiosInstance.get(`/disputes/${id}/comments`);
    return response.data;
  },

  /**
   * Add a dispute comment (admin can optionally target a specific party)
   */
  addDisputeComment: async (id: string, content: string, targetUserId?: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post(`/disputes/${id}/comments`, { content, targetUserId: targetUserId ?? null });
    return response.data;
  },

  /**
   * Resolve dispute
   */
  resolveDispute: async (id: string, resolution: any): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put(ADMIN_FALLBACK_ENDPOINTS.RESOLVE_DISPUTE(id), resolution);
    return response.data;
  },

  /**
   * Get settings
   */
  getSettings: async (): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(ADMIN_FALLBACK_ENDPOINTS.SETTINGS);
    return response.data;
  },

  /**
   * Update settings
   */
  updateSettings: async (data: any): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put(ADMIN_FALLBACK_ENDPOINTS.SETTINGS, data);
    return response.data;
  },

  /**
   * Get statistics
   */
  getStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(ADMIN_FALLBACK_ENDPOINTS.STATISTICS, { params });
    return response.data;
  },
};
