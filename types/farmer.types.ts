/**
 * Farmer domain types
 */

export interface FarmerProfile {
  id: string;
  userId: string;
  email: string;
  contactName: string;
  contactNumber: string;
  farmType?: string;
  averageRating: number;
  totalJobsPosted: number;
  totalJobsCompleted: number;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
}

export interface UpdateFarmerProfileData {
  contactName?: string;
  contactNumber?: string;
  farmType?: string;
  avatarUrl?: string;
}
