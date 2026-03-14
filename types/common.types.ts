/**
 * Common types used across the application
 */

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type Status = "pending" | "active" | "completed" | "cancelled";

export interface SelectOption {
  label: string;
  value: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}
