/**
 * Generic API Interfaces
 */

export interface ApiResponse<T = any> {
  message: string;
  status_code: number;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface SearchJobsRequest {
  keyword?: string;
  location?: string;
  minSalary?: number;
  maxSalary?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
