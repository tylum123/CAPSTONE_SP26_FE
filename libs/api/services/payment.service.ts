import axiosInstance from "../axios-instance";
import { API_ENDPOINTS } from "../endpoints/config";
import type { ApiResponse } from "@/libs/types";
import type {
    PaymentDTO,
    PaymentRequest,
    CancelPaymentDTO,
    PaymentCallbackRequestParams,
    VerifyPaymentDTO
} from "@/libs/types/payment.types";

export const PaymentService = {
    get: async (id: string): Promise<ApiResponse<PaymentDTO>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.PAYMENT.GET(id));
        return response.data;
    },

    create: async (data: PaymentRequest): Promise<ApiResponse<PaymentDTO>> => {
        const response = await axiosInstance.post(API_ENDPOINTS.PAYMENT.CREATE, data);
        return response.data;
    },

    cancel: async (id: string): Promise<ApiResponse<CancelPaymentDTO>> => {
        // Assuming cancel might be a POST or PUT request depending on your backend
        const response = await axiosInstance.post(API_ENDPOINTS.PAYMENT.CANCEL(id));
        return response.data;
    },

    callback: async (params: PaymentCallbackRequestParams): Promise<ApiResponse<any>> => {
        // Typically callback might be handled via backend webhooks, but if frontend is polling/sending
        const response = await axiosInstance.get(API_ENDPOINTS.PAYMENT.CALLBACK, { params });
        return response.data;
    },

    verify: async (data: any): Promise<ApiResponse<VerifyPaymentDTO>> => {
        const response = await axiosInstance.post(API_ENDPOINTS.PAYMENT.VERIFY, data);
        return response.data;
    }
};