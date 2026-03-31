import axiosInstance from "../axios-instance";
import { API_ENDPOINTS } from "../endpoints/config";
import type { ApiResponse } from "@/libs/types";
import type {
    PaymentDTO,
    PaymentRequest,
    CancelPaymentDTO,
    PaymentCallbackRequestParams,
    VerifyPaymentDTO,
    VerifyPaymentData
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

    cancel: async (id: string, cancellationReason?: string): Promise<ApiResponse<CancelPaymentDTO>> => {
        const url = cancellationReason
            ? `${API_ENDPOINTS.PAYMENT.CANCEL(id)}?cancellationReason=${encodeURIComponent(cancellationReason)}`
            : API_ENDPOINTS.PAYMENT.CANCEL(id);
        const response = await axiosInstance.post(url);
        return response.data;
    },

    callback: async (params: PaymentCallbackRequestParams): Promise<ApiResponse<any>> => {
        // Frontend can use this to check payment status after redirect
        const response = await axiosInstance.get(API_ENDPOINTS.PAYMENT.CALLBACK, { params });
        return response.data;
    },

    verifyWebhook: async (data: VerifyPaymentData): Promise<ApiResponse<VerifyPaymentDTO>> => {
        // Typically not called by frontend, PayOS webhook hits this
        const response = await axiosInstance.post(API_ENDPOINTS.PAYMENT.VERIFY, data);
        return response.data;
    }
};