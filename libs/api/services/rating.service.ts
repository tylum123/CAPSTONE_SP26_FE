import axiosInstance from "../axios-instance";
import { API_ENDPOINTS } from "../endpoints/config";
import type { ApiResponse } from "@/libs/types";
import type { RatingCreateDTO, RatingDTO } from "@/libs/types/rating.types";

export const ratingService = {
    create: async (payload: RatingCreateDTO): Promise<ApiResponse<RatingDTO>> => {
        const response = await axiosInstance.post(API_ENDPOINTS.RATINGS.CREATE, payload);
        return response.data;
    },

    getSpecific: async (userId: string): Promise<ApiResponse<RatingDTO>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.RATINGS.SPECIFIC(userId));
        return response.data;
    },

    getAllByUser: async (userId: string): Promise<ApiResponse<RatingDTO[]>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.RATINGS.BY_USER(userId));
        return response.data;
    },

    getGiven: async (): Promise<ApiResponse<RatingDTO[]>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.RATINGS.GIVEN);
        return response.data;
    },

    getAverage: async (userId: string): Promise<ApiResponse<number>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.RATINGS.AVERAGE(userId));
        return response.data;
    }
};