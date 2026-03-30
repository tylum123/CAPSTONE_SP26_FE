import axiosInstance from '../axios-instance'
import { API_ENDPOINTS } from '../endpoints/config'
import type {
  ApiResponse,
  JobCategory,
  CreateJobCategoryRequest,
  UpdateJobCategoryRequest,
} from '@/libs/types'

export const jobCategoryService = {
  getJobCategories: async (): Promise<ApiResponse<JobCategory[]>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.JOB_CATEGORY.LIST)
    return response.data
  },

  getJobCategoryDetail: async (id: string): Promise<ApiResponse<JobCategory>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.JOB_CATEGORY.DETAIL(id))
    return response.data
  },

  createJobCategory: async (data: CreateJobCategoryRequest): Promise<ApiResponse<JobCategory>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.JOB_CATEGORY.CREATE, data)
    return response.data
  },

  updateJobCategory: async (
    id: string,
    data: UpdateJobCategoryRequest,
  ): Promise<ApiResponse<JobCategory>> => {
    const response = await axiosInstance.put(API_ENDPOINTS.JOB_CATEGORY.UPDATE(id), data)
    return response.data
  },

  deleteJobCategory: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete(API_ENDPOINTS.JOB_CATEGORY.DELETE(id))
    return response.data
  },
}
