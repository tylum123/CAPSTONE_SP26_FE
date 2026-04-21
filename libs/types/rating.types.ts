export interface RatingUserRefDTO {
    id: string;
    email: string;
    phoneNumber: string;
    address?: string;
    role: string;
    createdAt: string;
    isActive: boolean;
    isVerified: boolean;
}

export interface RatingFarmerProfileDTO {
    id: string;
    userId: string;
    contactName: string;
    address: string;
    dateOfBirth: string;
    averageRating: number;
    totalJobsPosted: number;
    totalJobsCompleted: number;
    createdAt: string;
    updatedAt: string;
    avatarUrl?: string;
    user?: RatingUserRefDTO;
}

export interface RatingSkillRefDTO {
    id: string;
    categoryId: string;
    name: string;
    description?: string;
}

export interface RatingWorkerProfileDTO {
    id: string;
    userId: string;
    fullName: string;
    date_of_birth: string;
    primaryLocation: string;
    travelRadiusKmPreference?: number;
    experienceLevelId: number;
    experienceLevel: string;
    averageRating: number;
    availabilitySchedule: string;
    totalJobsCompleted: number;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
    email: string;
    phoneNumber: string;
    skills: RatingSkillRefDTO[];
    genderId: number;
    gender: string;
}

export interface RatingUserProfileDTO {
    userId: string;
    role: string;
    farmerProfile?: RatingFarmerProfileDTO;
    workerProfile?: RatingWorkerProfileDTO;
}

export interface RatingDTO {
    id: string;
    raterId: string;
    rateeId: string;
    jobPostId: string;
    ratingScore: number;
    reviewText: string;
    typeId: RatingType;
    createdAt: string;
    raterProfile?: RatingUserProfileDTO;
    rateeProfile?: RatingUserProfileDTO;
}

export enum RatingType {
    FarmerToWorker = 1,
    WorkerToFarmer = 2,
}

export interface RatingCreateDTO {
    rateeId: string;
    jobPostId: string;
    ratingScore: number;
    reviewText: string;
    typeId: RatingType;
    createdAt: string;
}