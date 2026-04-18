export interface UpdateFarmerRequest {
  contactName: string;
  address: string;
  dateOfBirth: string;
  avatarUrl: string;
}

export interface FarmerUserRefDTO {
  id: string;
  email: string;
  phoneNumber: string;
  passwordHash: string;
  role: string;
  createdAt: string;
  isActive: boolean;
  isVerified: boolean;
}

export interface FarmerProfile {
  id: string;
  userId: string;
  contactName: string;
  address?: string;
  dateOfBirth: string;
  mainFarmId: string;
  averageRating: number;
  totalJobsPosted: number;
  totalJobsCompleted: number;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  user?: FarmerUserRefDTO;
}

export interface FarmerProfileDTO extends FarmerProfile {
  address: string;
  avatarUrl: string;
  user: FarmerUserRefDTO;
}

export interface WorkerSkillDTO {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  isActive?: boolean;
}

export interface WorkerProfileDTO {
  id: string;
  userId: string;
  fullName: string;
  date_of_birth: string;
  primaryLocation: string;
  travelRadiusKmPreference?: number | null;
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
  skills: WorkerSkillDTO[];
  genderId: number;
  gender: string;
}

export interface DashboardStats {
  profile: {
    contactName: string;
    averageRating: number;
    totalJobsPosted: number;
    totalJobsCompleted: number;
    avatarUrl: string;
  };
  wallet: {
    availableBalance: number;
    lockedBalance: number;
  };
  counters: {
    pendingApplications: number;
    workReportsToApprove: number;
    totalWorkersCurrentlyHired: number;
  };
  activeJobs: {
    id: string;
    title: string;
    workersNeeded: number;
    workersAccepted: number;
    isUrgent: boolean;
    statusId: number;
    createdAt: string;
  }[];
  weeklyActivity: {
    name: string;
    applicationsCount: number;
    jobPostsCount: number;
  }[];
  jobStatusDistribution: {
    statusId: number;
    statusName: string;
    count: number;
  }[];
  schedulesDates: {
    scheduleDate: string;
  }[];
}
