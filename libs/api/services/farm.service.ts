import { id } from "date-fns/locale";
import axiosInstance from "../axios-instance";
import { API_ENDPOINTS } from "../config";
import type { ApiResponse, GetFarmResponse, UpdateFarmRequest } from "../types";

const createFormData = (field: string, files: File | File[]) => {
  const formData = new FormData()

  if (Array.isArray(files)) {
    files.forEach((file) => formData.append(field, file))
  } else {
    formData.append(field, files)
  }

  return formData
}

export const FarmService = {
  getFarms: async (): Promise<ApiResponse<GetFarmResponse[]>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARM.FARMS);
    return response.data;
  },

  getFarm: async (id: string): Promise<ApiResponse<GetFarmResponse>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FARM.FARM(id));
    return response.data;
  },

  addFarm: async (data: UpdateFarmRequest): Promise<ApiResponse<GetFarmResponse>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.FARM.ADD_FARM, data);
    return response.data;
  },

  updateFarm: async (
    id: string,
    data: Partial<UpdateFarmRequest>
  ): Promise<ApiResponse<GetFarmResponse>> => {
    const response = await axiosInstance.put(API_ENDPOINTS.FARM.UPDATE_FARM(id), data);
    return response.data;
  },

  removeFarm: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete(API_ENDPOINTS.FARM.REMOVE_FARM(id));
    return response.data;
  },

  uploadImage: async (id: string, file: File): Promise<ApiResponse<string>> => {
    const formData = createFormData('file', file)
    const response = await axiosInstance.post(API_ENDPOINTS.FARM.UPLOAD_IMAGE(id), formData, 
  {     headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },
};