// Common API Types

enum FarmTypes {
  Aquaculture = 'Nuôi trồng thủy hải sản',
  Crop = 'Trồng trọt',
  Livestock = 'Chăn nuôi',
}

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

// Auth Types
export interface LoginRequest {
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface AuthData {
  token: string;
  expiresAt: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  email: string;
  role: string;
  isVerified: boolean;
}


export interface RegisterRequest {
  email: string;
  password: string;
  phoneNumber?: string;
  roleId: number;
}

export interface VerifyEmail {
  email: string;
  otp: string;
}

export interface ResendVerificationEmail {
  email: string;
}

export interface ForgetPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface UpdateFarmRequest {
  address: string,
  latitude: number,
  longitude: number,
  locationName: string,
  imageUrl: string [], 
  farmType: number, 
  livestockCount: number,
  areaSize: number,
  isPrimary: boolean,
}

export interface GetFarmResponse {
  farmId: string,
  farmerProfileId?: string,
  address: string,
  latitude: number,
  longitude: number,
  locationName: string,
  imageUrl: string [],
  farmType: number,
  farmTypeName: FarmTypes,
  livestockCount: number,
  areaSize: number,
  isPrimary: boolean,
  images?: string[], // Mock up for image upload
  createdAt: string,
  updatedAt: string
}

export interface GoogleLoginRequest {
  googleToken: string;
  roleId: number;
}


// Farmer Types

export interface UpdateFarmerRequest {
  contactName?: string;
  address?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
}
export interface FarmerProfile {
  id: string;
  userId: string;
  contactName: string;
  address?: string;
  dateOfBirth: string;
  averageRating: number;
  totalJobsPosted: number;
  totalJobsCompleted: number;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  user?: {
    id: string;
    email: string;
    phoneNumber: string;
    passwordHash: string;
    role: string;
    createdAt: string;
    isActive: boolean;
    isVerified: boolean;
  };
}

// Job Types
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

export interface UpdateJobCategoryRequest extends Partial<CreateJobCategoryRequest> {}

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

// Skill Types
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
}

export interface CreateSkillRequest {
  name: string;
  description: string;
  category: string;
  isActive: boolean;
}

export interface UpdateSkillRequest extends Partial<CreateSkillRequest> {}

// Application Types
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

// Payment Types
export interface Payment {
  id: string;
  jobId: string;
  farmerId: string;
  workerId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transactionDate: string;
  paymentMethod: string;
}

// Wallet Types
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

// Message Types
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

// Search Types
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
