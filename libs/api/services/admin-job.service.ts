import axiosInstance from "../axios-instance";
import { API_ENDPOINTS } from "../endpoints/config";

const STATUS_MAP: Record<number, string> = {
  1: "Draft",
  2: "Published",
  3: "Closed",
  4: "InProgress",
  5: "Completed",
  6: "Cancelled",
};

export const adminJobService = {
  getJobs: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    // Fallback to the general job posts endpoint
    const response = await axiosInstance.get(API_ENDPOINTS.JOBS.GET);
    
    // The backend returns an ApiResponse covering a list of JobPostDTOs
    let rawJobs: any[] = response.data?.data || response.data || [];
    
    // Filter by search term
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      rawJobs = rawJobs.filter(job => job.title?.toLowerCase().includes(searchLower));
    }

    const mappedJobs = rawJobs.map((job: any) => {
      const statusText = STATUS_MAP[job.statusId] || "Pending";
      return {
        id: job.id,
        title: job.title,
        farmer: {
          id: job.farmerProfileId || job.farmerProfile?.id || "N/A",
          fullName: job.farmerProfile?.contactName || "Unknown",
        },
        worker: `${job.workersAccepted || 0}/${job.workersNeeded || 1} người`,
        workersAccepted: job.workersAccepted || 0,
        workersNeeded: job.workersNeeded || 1,
        description: job.description || "",
        address: job.address || "",
        status: statusText,
        salary: job.wageAmount || 0,
        startDate: job.startDate || "-",
        endDate: job.endDate || "-",
      };
    });

    // Filter by status after mapping
    let filteredJobs = mappedJobs;
    if (params?.status && params.status !== "All") {
      filteredJobs = mappedJobs.filter(job => job.status === params.status);
    }

    const total = filteredJobs.length;
    
    // Client-side pagination
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIdx = (page - 1) * limit;
    const paginatedJobs = filteredJobs.slice(startIdx, startIdx + limit);

    // Compute summary statistics
    const active = mappedJobs.filter(j => j.status === "Published" || j.status === "InProgress").length;
    const completed = mappedJobs.filter(j => j.status === "Completed").length;
    const completionRate = mappedJobs.length > 0 ? (completed / mappedJobs.length) * 100 : 0;

    return {
      data: paginatedJobs,
      total: total,
      summary: {
        total: mappedJobs.length,
        active: active,
        completed: completed,
        completionRate: Math.round(completionRate)
      },
      page: page,
      limit: limit
    };
  },
};
