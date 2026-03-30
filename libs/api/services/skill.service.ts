import axiosInstance from '../axios-instance';
import { API_ENDPOINTS } from '../endpoints/config';
import type {
  ApiResponse,
  Skill,
  CreateSkillRequest,
  UpdateSkillRequest,
} from '@/libs/types';

export const skillService = {
  getSkills: async (): Promise<ApiResponse<Skill[]>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.SKILL.SKILLS);
    return response.data;
  },

  getSkillsByCategory: async (categoryId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<Skill[]>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.SKILL.SKILLS_CATEGORY(categoryId), { params });
    return response.data;
  },

  getSkillDetail: async (id: string): Promise<ApiResponse<Skill>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.SKILL.SKILL_DETAIL(id));
    return response.data;
  },

  createSkill: async (data: CreateSkillRequest): Promise<ApiResponse<Skill>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.SKILL.CREATE_SKILL, data);
    return response.data;
  },

  updateSkill: async (id: string, data: UpdateSkillRequest): Promise<ApiResponse<Skill>> => {
    const response = await axiosInstance.put(API_ENDPOINTS.SKILL.UPDATE_SKILL(id), data);
    return response.data;
  },

  deleteSkill: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete(API_ENDPOINTS.SKILL.DELETE_SKILL(id));
    return response.data;
  },
};
