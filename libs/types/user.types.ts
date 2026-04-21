export interface User {
  userId: string;
  email: string;
  fullName: string;
  role: "farmer" | "worker" | "admin";
  avatarUrl?: string;
  phoneNumber?: string;
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
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: "farmer" | "worker" | "admin";
  isActive?: boolean;
}
