import type { JobSkillRequirement } from "./job.types";

export interface Application {
  id: string;
  jobId: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  workerAvatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedAt?: string;
}

export enum ApplicationStatusId {
  Pending = 1,
  Accepted = 2,
  Rejected = 3,
  Cancelled = 4,
}

export interface ApplicationWorkerDTO {
  id: string;
  userId: string;
  fullName: string;
  age: string;
  primaryLocation: string;
  travelRadiusKmPreference: number;
  experienceLevelId: number;
  experienceLevel: string;
  averageRating: number;
  availabilitySchedule: string;
  totalJobsCompleted: number;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  phoneNumber: string;
}

export interface ApplicationJobPostDTO {
  id: string;
  farmerProfileId: string;
  contactName: string;
  jobSkillRequirements: JobSkillRequirement[];
  farmId: string;
  jobCategoryId: string;
  title: string;
  description: string;
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
  requirements: string[];
  privileges: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  isUrgent: boolean;
  statusId: number;
}

export interface ApplicationDTO {
  id: string;
  jobPostId: string;
  jobPost: ApplicationJobPostDTO;
  worker: ApplicationWorkerDTO;
  statusId: ApplicationStatusId;
  coverLetter: string;
  appliedAt: string;
  respondedAt?: string;
  responseMessage?: string;
  workDates: string[];
  locationName: string;
}

export interface RespondApplicationRequest {
  statusId: ApplicationStatusId;
  respondedAt?: string;
  responseMessage?: string;
}
