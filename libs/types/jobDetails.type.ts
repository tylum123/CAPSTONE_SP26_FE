export interface JobDetail {
    id: string;
    jobApplicationId: string;
    jobPostId: string;
    workerId: string;
    statusId: number;
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
}

export interface ApproveJobDetailRequest {
    farmerApprovedPercent: number;
    farmerFeedback: string;
}