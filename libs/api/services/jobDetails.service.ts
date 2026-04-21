import axiosInstance from "../axios-instance";
import { API_ENDPOINTS } from "../endpoints/config";
import type {
    ApiResponse,
    JobDetail,
    ApproveJobDetailRequest,
    PaginatedResponse,
} from '@/libs/types';

export const jobDetailsService = {
    getJobDetails: async (): Promise<ApiResponse<JobDetail[]>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.JOB_DETAILS);
        console.log(response)
        return response.data;
    },

    getJobDetail: async (id: string): Promise<ApiResponse<JobDetail>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.JOB_DETAIL(id));
        return response.data;
    },

    getJobDetailsByPost: async (id: string, params: { page: number, limit: number }): Promise<ApiResponse<PaginatedResponse<JobDetail>>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.JOB_DETAILS_BY_POST(id), { params });
        return response.data;
    },

    approveJobDetail: async (id: string, data: ApproveJobDetailRequest): Promise<ApiResponse<JobDetail>> => {
        const response = await axiosInstance.post(API_ENDPOINTS.JOBS.APPROVE_JOB_DETAILS(id), data);
        return response.data;
    },
}