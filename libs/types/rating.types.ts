export interface RatingDTO {
    id: string;
    raterId: string;
    rateeId: string;
    jobPostId: string;
    ratingScore: number;
    reviewText: string;
    typeId: RatingType;
    createdAt: string;
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