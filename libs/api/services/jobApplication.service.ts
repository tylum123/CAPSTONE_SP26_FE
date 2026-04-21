import { ApiResponse, PaginatedResponse, ApplicationDTO, RespondApplicationRequest, ApplicationStatusId } from "@/libs/types";
import axiosInstance from "../axios-instance";
import { API_ENDPOINTS } from "../endpoints/config";

export const jobApplicationService = {
    /**
     * Get all job application for farmer's job posts with optional status filtering
     */
    getFarmerApplications: async (params?: { statusId?: number }): Promise<ApiResponse<ApplicationDTO[]>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.JOB_APPLICATIONS, { params });
        return response.data;
    },


    getJobApplicationsByPost: async (jobPostId: string, params?: {
        includeAll?: boolean;
        statusId?: number;
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<PaginatedResponse<ApplicationDTO>>> => {
        const queryParams = {
            includeAll: params?.includeAll,
            statusId: params?.statusId,
            page: params?.page,
            limit: params?.limit,
        };
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.JOB_APPLICATIONS_BY_POST(jobPostId), { params: queryParams });
        return response.data;
    },

    getJobApplicationsByFarmer: async (params?: {
        includeAll?: boolean;
        statusId?: number;
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<PaginatedResponse<ApplicationDTO>>> => {
        const queryParams = {
            includeAll: params?.includeAll,
            statusId: params?.statusId,
            page: params?.page,
            limit: params?.limit,
        };
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.JOB_APPLICATIONS_BY_FARMER, { params: queryParams });
        return response.data;
    },

    /**
     * Get application detail
     */
    getApplicationDetail: async (id: string): Promise<ApiResponse<ApplicationDTO>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.JOBS.APPLICATION_DETAIL(id));
        return response.data;
    },

    /**
     * Respond to applicant (accept/reject/cancel)
     */
    respondApplicant: async (
        id: string,
        data: RespondApplicationRequest,
    ): Promise<ApiResponse<ApplicationDTO>> => {
        const response = await axiosInstance.put(API_ENDPOINTS.JOBS.RESPOND_APPLICANT(id), data);
        return response.data;
    },

    /**
     * Backward-compatible approve helper
     */
    approveApplicant: async (id: string, responseMessage?: string): Promise<ApiResponse<ApplicationDTO>> => {
        const response = await axiosInstance.put(API_ENDPOINTS.JOBS.RESPOND_APPLICANT(id), {
            statusId: ApplicationStatusId.Accepted,
            respondedAt: new Date().toISOString(),
            responseMessage,
        });
        return response.data;
    },

    cancelApplication: async (id: string): Promise<ApiResponse<ApplicationDTO>> => {
        const response = await axiosInstance.put(API_ENDPOINTS.JOBS.CANCEL_APPLICATION(id));
        return response.data;
    },

    /**
     * Backward-compatible reject helper
     */
    rejectApplicant: async (
        id: string,
        reason?: string
    ): Promise<ApiResponse<ApplicationDTO>> => {
        const response = await axiosInstance.put(API_ENDPOINTS.JOBS.RESPOND_APPLICANT(id), {
            statusId: ApplicationStatusId.Rejected,
            respondedAt: new Date().toISOString(),
            responseMessage: reason,
        });
        return response.data;
    },

    autoAccept: async (id: string): Promise<ApiResponse<ApplicationDTO>> => {
        const response = await axiosInstance.put(API_ENDPOINTS.JOBS.RESPOND_APPLICANT(id), {
            statusId: ApplicationStatusId.Accepted,
            respondedAt: new Date().toISOString(),
        });
        return response.data;
    }
}