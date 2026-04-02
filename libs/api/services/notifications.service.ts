import { API_ENDPOINTS } from "../endpoints/config";
import { axiosInstance } from "../axios-instance";

export const notificationService = {
    getAll: async () => {
        return axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS.GET_ALL);
    },
    markRead: async (id: string) => {
        return axiosInstance.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ, { id });
    },
    markAllRead: async () => {
        return axiosInstance.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    },
    getAllUnread: async () => {
        return axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS.GET_ALL_UNREAD);
    },
    delete: async (id: string) => {
        return axiosInstance.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
    }
}