import axiosInstance from "../axios-instance";
import { API_ENDPOINTS } from "../endpoints/config";
import type {
    ApiResponse,
    JobDetail,
    ApproveJobDetailRequest,
} from '@/libs/types';

export const jobDetailsService = {
    getJobDetails: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<ApiResponse<JobDetail[]>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.JOB_DETAILS, { params });
        return response.data;
    },

    getJobDetail: async (id: string): Promise<ApiResponse<JobDetail>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.JOB_DETAIL(id));
        return response.data;
    },

    getJobDetailsByPost: async (id: string): Promise<ApiResponse<JobDetail[]>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.JOB_DETAILS_BY_POST(id));
        return response.data;
    },

    approveJobDetail: async (id: string, data: ApproveJobDetailRequest): Promise<ApiResponse<JobDetail>> => {
        const response = await axiosInstance.put(API_ENDPOINTS.JOBS.APPROVE_JOB_DETAILS(id), data);
        return response.data;
    },
}