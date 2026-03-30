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
