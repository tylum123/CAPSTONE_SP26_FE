import { API_ENDPOINTS } from "../endpoints/config";
import { axiosInstance } from "../axios-instance";
import { ApiResponse, PaginatedResponse } from "@/libs/types";
import { NotificationDTO } from "@/libs/types/notifications.types";

export const notificationService = {
    getAll: async (params: { pageNumber: number, pageSize: number, isRead?: boolean }): Promise<ApiResponse<PaginatedResponse<NotificationDTO>>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS.GET_ALL, { params });
        return response.data;
    },
    markRead: async (notificationId: string): Promise<ApiResponse<NotificationDTO>> => {
        const response = await axiosInstance.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ, { notificationId });
        return response.data;
    },
    markAllRead: async (): Promise<ApiResponse<NotificationDTO>> => {
        const response = await axiosInstance.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
        return response.data;
    },
    getAllUnread: async (): Promise<ApiResponse<NotificationDTO[]>> => {
        const response = await axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS.GET_ALL_UNREAD);
        return response.data;
    },
    delete: async (id: string): Promise<ApiResponse<NotificationDTO>> => {
        const response = await axiosInstance.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
        return response.data;
    }
}
