export interface User {
  userId: string;
  email: string;
  fullName: string;
  role: "farmer" | "worker" | "admin";
  avatarUrl?: string;
  phoneNumber?: string;
  address?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface GetUserResponse extends User {
  lastLoginAt?: string;
  rating?: number;
}

export interface UpdateUserRequest {
  email?: string;
  phoneNumber?: string;
  address?: string;
  roleId?: number;
  isActive?: boolean;
  isVerified?: boolean;
}
