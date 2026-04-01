import axiosInstance from "../axios-instance";
import { API_ENDPOINTS } from "../endpoints/config";
import type {
    ApiResponse,
    Job,
    CreateJobRequest,
    UpdateJobRequest,
} from '@/libs/types';

export const jobService = {

    getJobs: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<ApiResponse<Job[]>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.GET, { params });
        return response.data;
    },

    getMyJobPosts: async (): Promise<ApiResponse<Job[]>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.MY_JOB_POSTS);
        return response.data;
    },

    getJobsByFarmer: async (farmerId: string): Promise<ApiResponse<Job[]>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.GET_BY_FARMER(farmerId));
        return response.data;
    },

    getJobDetail: async (id: string): Promise<ApiResponse<Job>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.DETAIL(id));
        return response.data;
    },

    saveDraft: async (data: CreateJobRequest): Promise<ApiResponse<Job>> => {
        const response = await axiosInstance.post(API_ENDPOINTS.JOBS.SAVE_DRAFT, data);
        return response.data;
    },

    getDrafts: async (): Promise<ApiResponse<Job[]>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.GET_DRAFTS);
        return response.data;
    },

    getFilteredJobs: async (params?: {
        title?: string;
        category?: string;
        address?: string;
        skill?: string[];
        sortByDatesDescending: boolean;
    }): Promise<ApiResponse<Job[]>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.FILTERED_JOBS, { params });
        return response.data;
    },

    getFilteredJobsByFarmer: async (params?: {
        title?: string;
        category?: string;
        address?: string;
        skill?: string[];
        sortByDatesDescending: boolean;
    }): Promise<ApiResponse<Job[]>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.FILTERED_JOBS_BY_FARMER, { params });
        return response.data;
    },

    /**
     * Create new job
     */
    createJob: async (data: CreateJobRequest): Promise<ApiResponse<Job>> => {
        const response = await axiosInstance.post(API_ENDPOINTS.JOBS.CREATE, data);
        return response.data;
    },

    /**
     * Update job
     */
    updateJob: async (id: string, data: UpdateJobRequest): Promise<ApiResponse<Job>> => {
        const response = await axiosInstance.put(API_ENDPOINTS.JOBS.UPDATE(id), data);
        return response.data;
    },

    /**
     * Delete job
     */
    deleteJob: async (id: string): Promise<ApiResponse<void>> => {
        const response = await axiosInstance.delete(API_ENDPOINTS.JOBS.DELETE(id));
        return response.data;
    },
};