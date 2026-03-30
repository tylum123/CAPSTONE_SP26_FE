import axiosInstance from '../axios-instance';
import { API_ENDPOINTS } from '../endpoints/config';
import type { ApiResponse, PaginatedResponse, Notification, Message } from '@/libs/types';

export const commonService = {
  /**
   * Get notifications
   */
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    read?: boolean;
  }): Promise<ApiResponse<PaginatedResponse<Notification>>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS, { params });
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markNotificationAsRead: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.put(`${API_ENDPOINTS.NOTIFICATIONS}/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead: async (): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.put(`${API_ENDPOINTS.NOTIFICATIONS}/read-all`);
    return response.data;
  },

  /**
   * Get messages
   */
  getMessages: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<ApiResponse<PaginatedResponse<Message>>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.MESSAGES, { params });
    return response.data;
  },

  /**
   * Send message
   */
  sendMessage: async (receiverId: string, content: string): Promise<ApiResponse<Message>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.MESSAGES, {
      receiverId,
      content,
    });
    return response.data;
  },

  /**
   * Mark messages from `senderId` to current user as read.
   */
  markConversationAsRead: async (senderId: string): Promise<ApiResponse<number>> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.MESSAGES}/read`, {
      senderId,
    });
    return response.data;
  },

  /**
   * Upload file
   */
  uploadFile: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post(API_ENDPOINTS.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
