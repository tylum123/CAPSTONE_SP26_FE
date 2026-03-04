// Common API Types

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
}

export interface RegisterRequest {
  email: string;
  password: string;
  phoneNumber?: string;
  address?: string;
  roleId: number;
}

export interface GoogleLoginRequest {
  googleToken: string;
  roleId: number;
}

// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: 'farmer' | 'worker' | 'admin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  avatar?: string;
}

// Job Types
export interface Job {
  id: string;
  title: string;
  description: string;
  farmerId: string;
  farmerName: string;
  location: string;
  salary: number;
  startDate: string;
  endDate: string;
  workingHours: string;
  requirements: string[];
  numberOfWorkers: number;
  appliedWorkers: number;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  location: string;
  salary: number;
  startDate: string;
  endDate: string;
  workingHours: string;
  requirements: string[];
  numberOfWorkers: number;
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  status?: 'open' | 'in-progress' | 'completed' | 'cancelled';
}

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
