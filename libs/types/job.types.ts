import type { GetFarmResponse } from "./farm.types";

export interface JobSkillRequirement {
  id: string;
  name: string;
}

export interface Job {
  id: string;
  farmerProfileId: string;
  contactName: string;
  jobSkillRequirements: JobSkillRequirement[];
  jobCategory: JobCategory;
  title: string;
  description: string;
  farm: GetFarmResponse;
  address: string;
  startDate: string;
  endDate: string;
  selectedDays: string[];
  startTime: string;
  endTime: string;
  workersNeeded: number;
  workersAccepted: number;
  jobTypeId: number;
  wageAmount: number;
  requiredSkills?: string[];
  requirements: string[];
  privileges: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  isUrgent: boolean;
  status: string;
}

export interface JobCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateJobCategoryRequest {
  name: string;
  description: string;
  isActive: boolean;
}

export interface UpdateJobCategoryRequest extends Partial<CreateJobCategoryRequest> { }

export interface CreateJobRequest {
  jobTypeId: number;
  title: string;
  description: string;
  jobCategoryId: string;
  farmId: string;
  address: string;
  startDate: string;
  endDate: string;
  selectedDays?: string[];
  startTime: string;
  endTime: string;
  skillIds: string[];
  workersNeeded: number;
  workersAccepted: number;
  wageAmount: number;
  requirements: string[];
  privileges: string[];
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isUrgent: boolean;
  statusId: number;
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  id?: string;
}
