/**
 * Farmer/Worker dispute service — calls the same endpoints the mobile app uses.
 * - GET  /api/v1/disputes/mine        → list my disputes
 * - GET  /api/v1/disputes/{id}        → single dispute detail
 * - POST /api/v1/disputes             → create dispute
 * - PUT  /api/v1/disputes/{id}        → update (pending only)
 * - DELETE /api/v1/disputes/{id}      → delete (pending only)
 * - GET  /api/v1/disputes/{id}/comments → comment thread
 * - POST /api/v1/disputes/{id}/comments → add comment
 */
import axiosInstance from '../axios-instance';

export const disputeService = {
  getMyDisputes: async () => {
    const res = await axiosInstance.get('/disputes/mine');
    return res.data; // ApiResponse<DisputeReportDTO[]>
  },

  getDisputeById: async (id: string) => {
    const res = await axiosInstance.get(`/disputes/${id}`);
    return res.data; // ApiResponse<DisputeReportDTO>
  },

  createDispute: async (data: {
    jobPostId: string;
    disputeTypeId: number;
    reason: string;
    description?: string;
    evidenceUrl?: string;
  }) => {
    const res = await axiosInstance.post('/disputes', data);
    return res.data;
  },

  deleteDispute: async (id: string) => {
    const res = await axiosInstance.delete(`/disputes/${id}`);
    return res.data;
  },

  getComments: async (id: string) => {
    const res = await axiosInstance.get(`/disputes/${id}/comments`);
    return res.data; // ApiResponse<DisputeReportCommentDTO[]>
  },

  addComment: async (id: string, content: string) => {
    const res = await axiosInstance.post(`/disputes/${id}/comments`, { content });
    return res.data; // ApiResponse<DisputeReportCommentDTO>
  },
};
