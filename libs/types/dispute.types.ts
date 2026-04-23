import { FarmerProfileDTO, WorkerProfileDTO } from "./farmer.types";
import { User } from "./user.types";

export enum DisputeStatus {
  Pending = 1,
  UnderReview = 2,
  Resolved = 3,
  Rejected = 4,
}

export enum DisputeType {
  JobQuality = 1,
  Payment = 2,
  Other = 3,
}

export enum PenaltyTarget {
  None = 0,
  Reporter = 1,
  Accused = 2,
}

export enum DisputeUserRole {
  Admin = 1,
  Farmer = 2,
  Worker = 3,
}

export interface CustomDisputeReportDTO {
  disputeReports: DisputeReportDTO[];
  farmers: FarmerProfileDTO[];
  workers: WorkerProfileDTO[];
}
export interface DisputeReportDTO {
  id: string;
  farmerId?: string | null;
  workerId?: string | null;
  jobPostId: string;
  disputeTypeId: number;
  disputeType?: DisputeType;
  reason: string;
  description?: string | null;
  evidenceUrl?: string | null;
  statusId: number;
  status?: DisputeStatus;
  adminNote?: string | null;
  resolvedById?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  reporterUserId?: string | null;
  accusedUserId?: string | null;
  penaltyTargetId: number;
  penaltyTarget?: PenaltyTarget;
}

export interface DisputeReportCommentDTO {
  id: string;
  disputeReportId: string;
  userId: string;
  userName: string;
  role: DisputeUserRole;
  content: string;
  attachmentUrl?: string | null;
  createdAt: string;
}

export interface CreateDisputeReportRequest {
  farmerId?: string | null;
  workerId?: string | null;
  jobPostId: string;
  disputeTypeId: number;
  reason: string;
  description?: string | null;
  evidenceUrl?: string | null;
}

export interface UpdateDisputeReportRequest {
  disputeTypeId?: number;
  reason?: string;
  description?: string | null;
  evidenceUrl?: string | null;
  statusId?: number;
  adminNote?: string | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
}

export interface ReviewDisputeReportRequest {
  adminNote: string;
}

export interface ResolveDisputeRequest {
  isResolved: boolean;
  adminNote: string;
  penaltyTarget: PenaltyTarget;
}

export interface CreateDisputeReportCommentRequest {
  content: string;
  attachmentUrl?: string | null;
}
