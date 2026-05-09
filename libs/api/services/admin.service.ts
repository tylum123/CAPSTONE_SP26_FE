import axiosInstance from "../axios-instance";
import { API_ENDPOINTS } from "../endpoints/config";
import type {
  ApiResponse,
  PaginatedResponse,
  GetUserResponse,
  UpdateUserRequest,
} from "@/libs/types";

const ROLE_TO_ID: Record<string, number> = {
  admin: 1,
  farmer: 2,
  worker: 3,
};

const ADMIN_FALLBACK_ENDPOINTS = {
  DISPUTES: "/disputes",
  DISPUTE_DETAIL: (id: string) => `/disputes/${id}`,
  RESOLVE_DISPUTE: (id: string) => `/disputes/${id}/resolve`,
  SETTINGS: "/admin/settings",
  STATISTICS: "/admin/statistics",
} as const;

const roleToId = (role: string): number => {
  return ROLE_TO_ID[role?.toLowerCase?.() || ""] ?? 3;
};

export const adminService = {
  /**
   * Get jobs (admin)
   */
  getJobs: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    title?: string;
    search?: string;
  }): Promise<any> => {
    const queryParams = { ...params };
    if (!queryParams.title && queryParams.search) {
      queryParams.title = queryParams.search;
    }
    delete queryParams.search;

    const response = await axiosInstance.get("/admin/jobpost", {
      params: queryParams,
    });
    return response.data;
  },
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
  }): Promise<
    ApiResponse<PaginatedResponse<GetUserResponse> | GetUserResponse[]>
  > => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.USERS, {
      params,
    });
    return response.data;
  },

  /**
   * Get user detail
   */
  getUserDetail: async (id: string): Promise<ApiResponse<GetUserResponse>> => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.ADMIN.USER_DETAIL(id),
    );
    return response.data;
  },

  updateUser: async (
    id: string,
    data: UpdateUserRequest,
  ): Promise<ApiResponse<GetUserResponse>> => {
    const response = await axiosInstance.put(
      API_ENDPOINTS.ADMIN.UPDATE_USER(id),
      data,
    );
    return response.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete(
      API_ENDPOINTS.ADMIN.DELETE_USER(id),
    );
    return response.data;
  },

  setUserActiveStatus: async (
    user: GetUserResponse,
    isActive: boolean,
  ): Promise<ApiResponse<GetUserResponse>> => {
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
    isVerified: boolean,
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
    pageNumber?: number;
    pageSize?: number;
    jobPostName?: string;
    disputeTypeId?: number;
    statusId?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(
      ADMIN_FALLBACK_ENDPOINTS.DISPUTES,
      { params },
    );
    return response.data;
  },

  /**
   * Get dispute detail
   */
  getDisputeDetail: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(
      ADMIN_FALLBACK_ENDPOINTS.DISPUTE_DETAIL(id),
    );
    return response.data;
  },

  /**
   * Resolve dispute
   */
  resolveDispute: async (
    id: string,
    resolution: string,
  ): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post(
      ADMIN_FALLBACK_ENDPOINTS.RESOLVE_DISPUTE(id),
      {
        resolution,
      },
    );
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
    const response = await axiosInstance.put(
      ADMIN_FALLBACK_ENDPOINTS.SETTINGS,
      data,
    );
    return response.data;
  },

  /**
   * Get statistics
   */
  getStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(
      ADMIN_FALLBACK_ENDPOINTS.STATISTICS,
      { params },
    );
    return response.data;
  },

  /**
   * Warn (ban) a user by id
   */
  warnUser: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post(`/user/${id}/warn`);
    return response.data;
  },
  /**
   * Get wallet statistics (admin)
   */
  getWalletStats: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.ADMIN.WALLET_STATS,
      );

      const raw = response.data ?? {};

      // If backend already returns the desired shape, return as-is
      if (raw.systemBalance || raw.payosToday) {
        return response.data;
      }

      // Otherwise normalize common backend shapes into requested shape
      const dataSource = raw.data ?? raw;

      const systemTotal =
        Number(
          dataSource.systemTotal ??
            dataSource.total ??
            dataSource.todayTotal ??
            0,
        ) || 0;
      const locked =
        Number(dataSource.locked ?? dataSource.pendingTotal ?? 0) || 0;
      const available =
        Number(dataSource.available ?? systemTotal - locked) || 0;
      const changeToday =
        Number(dataSource.changeToday ?? dataSource.totalChange) || 0;

      const depositAmount =
        Number(dataSource.depositAmount ?? dataSource.todayDeposit ?? 0) || 0;
      const withdrawAmount =
        Number(dataSource.withdrawAmount ?? dataSource.todayWithdraw ?? 0) || 0;
      const depositCount =
        Number(dataSource.depositCount ?? dataSource.depositCountToday ?? 0) ||
        0;
      const withdrawCount =
        Number(
          dataSource.withdrawCount ?? dataSource.withdrawCountToday ?? 0,
        ) || 0;
      const totalTransactions =
        Number(dataSource.totalTransactions ?? dataSource.totalCount ?? 0) || 0;
      const netFlow =
        Number(dataSource.netFlow ?? depositAmount - withdrawAmount) || 0;

      return {
        data: {
          systemBalance: {
            total: systemTotal,
            locked,
            available,
            changeToday,
          },
          payosToday: {
            depositAmount,
            withdrawAmount,
            depositCount,
            withdrawCount,
            totalTransactions,
            netFlow,
          },
        },
        success: true,
      } as any;
    } catch (err) {
      console.warn("adminService.getWalletStats failed", err);
      return {
        data: {
          systemBalance: {
            total: 0,
            locked: 0,
            available: 0,
            changeToday: 0,
          },
          payosToday: {
            depositAmount: 0,
            withdrawAmount: 0,
            depositCount: 0,
            withdrawCount: 0,
            totalTransactions: 0,
            netFlow: 0,
          },
        },
        success: false,
      } as any;
    }
  },

  /**
   * Get wallet transactions for admin (paginated + filters)
   */
  getWalletTransactions: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.ADMIN.WALLET_TRANSACTIONS,
      { params },
    );
    return response.data;
  },

  /**
   * Get all skills
   */
  getSkills: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    name?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.SKILL.SKILLS, {
      params,
    });
    return response.data;
  },

  /**
   * Create a new skill
   */
  createSkill: async (data: {
    name: string;
    description: string;
    categoryId: string;
    isActive: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.SKILL.CREATE_SKILL,
      data,
    );
    return response.data;
  },

  /**
   * Update a skill
   */
  updateSkill: async (
    id: string,
    data: {
      name: string;
      description: string;
      categoryId: string;
      isActive: boolean;
    },
  ): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.put(
      API_ENDPOINTS.SKILL.UPDATE_SKILL(id),
      data,
    );
    return response.data;
  },

  /**
   * Delete a skill
   */
  deleteSkill: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete(
      API_ENDPOINTS.SKILL.DELETE_SKILL(id),
    );
    return response.data;
  },
};
