import axiosInstance from "../axios-instance";
import { API_ENDPOINTS } from "../endpoints/config";
import type {
  ApiResponse,
  CreateDisputeReportCommentRequest,
  CreateDisputeReportRequest,
  DisputeReportCommentDTO,
  DisputeReportDTO,
  ResolveDisputeRequest,
  ReviewDisputeReportRequest,
  UpdateDisputeReportRequest,
} from "@/libs/types";

const LEGACY_DISPUTE_COMMENTS_ENDPOINT = (id: string) => `/${id}/comments`;

export const disputeService = {
  getAllDisputes: async (): Promise<ApiResponse<DisputeReportDTO[]>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.DISPUTES.GET_ALL);
    return response.data;
  },

  getMyDisputes: async (): Promise<ApiResponse<DisputeReportDTO[]>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.DISPUTES.GET_MINE);
    return response.data;
  },

  getDisputeById: async (id: string): Promise<ApiResponse<DisputeReportDTO>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.DISPUTES.GET_BY_ID(id));
    return response.data;
  },

  createDispute: async (
    payload: CreateDisputeReportRequest
  ): Promise<ApiResponse<DisputeReportDTO>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.DISPUTES.CREATE, payload);
    return response.data;
  },

  updateDispute: async (
    id: string,
    payload: UpdateDisputeReportRequest
  ): Promise<ApiResponse<DisputeReportDTO>> => {
    const response = await axiosInstance.put(API_ENDPOINTS.DISPUTES.UPDATE(id), payload);
    return response.data;
  },

  deleteDispute: async (id: string): Promise<ApiResponse<object>> => {
    const response = await axiosInstance.delete(API_ENDPOINTS.DISPUTES.DELETE(id));
    return response.data;
  },

  reviewDispute: async (
    id: string,
    payload: ReviewDisputeReportRequest
  ): Promise<ApiResponse<DisputeReportDTO>> => {
    const response = await axiosInstance.put(API_ENDPOINTS.DISPUTES.REVIEW(id), payload);
    return response.data;
  },

  resolveDispute: async (
    id: string,
    payload: ResolveDisputeRequest
  ): Promise<ApiResponse<DisputeReportDTO>> => {
    const response = await axiosInstance.put(API_ENDPOINTS.DISPUTES.RESOLVE(id), payload);
    return response.data;
  },

  getComments: async (id: string): Promise<ApiResponse<DisputeReportCommentDTO[]>> => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DISPUTES.GET_COMMENTS(id));
      return response.data;
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        throw error;
      }

      const fallbackResponse = await axiosInstance.get(LEGACY_DISPUTE_COMMENTS_ENDPOINT(id));
      return fallbackResponse.data;
    }
  },

  addComment: async (
    id: string,
    payload: CreateDisputeReportCommentRequest
  ): Promise<ApiResponse<DisputeReportCommentDTO>> => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.DISPUTES.ADD_COMMENT(id), payload);
      return response.data;
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        throw error;
      }

      const fallbackResponse = await axiosInstance.post(LEGACY_DISPUTE_COMMENTS_ENDPOINT(id), payload);
      return fallbackResponse.data;
    }
  },
};
