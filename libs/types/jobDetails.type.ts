import { ApplicationWorkerDTO } from "./application.types";

export interface JobAttachment {
    id: string;
    jobDetailId: string;
    cloudinaryPublicId: string;
    fileUrl: string;
    format: string;
    fileSize: number;
    createdAt: string;
}

export interface JobDetail {
    id: string;
    jobApplicationId: string;
    jobPostId: string;
    workerId: string;
    worker: ApplicationWorkerDTO;
    statusId: JobStatus;
    workDate: string;
    workerDescription: string;
    farmerFeedback: string;
    farmerApprovedPercent: number;
    jobPrice: number;
    workerPaymentAmount: number;
    refundAmount: number;
    completedAt: string;
    createdAt: string;
    updatedAt: string;
    attachments: JobAttachment[];
}

export interface ApproveJobDetailRequest {
    farmerApprovedPercent: number;
    farmerFeedback: string;
}

export enum JobStatus {
    InProgress = 1,
    Reported = 2,
    Completed = 3
}