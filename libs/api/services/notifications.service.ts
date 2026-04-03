import { API_ENDPOINTS } from "../endpoints/config";
import { axiosInstance } from "../axios-instance";
import { ApiResponse } from "@/libs/types";
import { NotificationDTO } from "@/libs/types/notifications.types";

export const notificationService = {
    getAll: async (params: { pageNumber: number, pageSize: number, isRead?: boolean }): Promise<ApiResponse<NotificationDTO[]>> => {
        return axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS.GET_ALL, { params });
    },
    markRead: async (id: string): Promise<ApiResponse<NotificationDTO>> => {
        return axiosInstance.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ, { id });
    },
    markAllRead: async (): Promise<ApiResponse<NotificationDTO>> => {
        return axiosInstance.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    },
    getAllUnread: async (): Promise<ApiResponse<NotificationDTO[]>> => {
        return axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS.GET_ALL_UNREAD);
    },
    delete: async (id: string): Promise<ApiResponse<NotificationDTO>> => {
        return axiosInstance.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
    }
}