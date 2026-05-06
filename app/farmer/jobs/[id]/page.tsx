"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Banknote, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown, Clock, FileText, InfoIcon, MailIcon, MapPin, MessageSquare, Play, RotateCw, Star, Users, XCircle, Paperclip, MessageCircleIcon, ArrowDownUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { formatDistanceToNow, isToday, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/libs/utils/utils"
import { ApplicationStatusId } from "@/libs/types"
import { jobService } from "@/libs/api/services/jobs.service"
import { jobCategoryService } from "@/libs/api/services/job-category.service"
import { jobApplicationService } from "@/libs/api/services/jobApplication.service"
import { jobDetailsService } from "@/libs/api/services/jobDetails.service"
import type { ApplicationDTO, Job, JobDetail, PaginatedResponse, RespondApplicationRequest } from "@/libs/types"
import { JobPostStatus, JobStatus } from "@/libs/types"
import { ratingService } from "@/libs/api/services"

const APP_STATUS = {
  pending: ApplicationStatusId.Pending,
  accepted: ApplicationStatusId.Accepted,
  rejected: ApplicationStatusId.Rejected,
  cancelled: ApplicationStatusId.Cancelled,
} as const

const JOB_POST_STATUS = JobPostStatus;

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { JobStatusChart } from "@/components/farmer/dashboard-charts"
import { useAuth } from "@/libs/stores/auth.store"
import { RatingType, type RatingCreateDTO, type RatingDTO } from "@/libs/types/rating.types"
import { WorkerProfilePreviewDialog } from "@/components/farmer/worker-profile-preview-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

function JobReviews({ jobId }: { jobId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<RatingDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    ratingService.getReceivedByPost(jobId)
      .then(res => {
        if (res.data) {
          const filtered = res.data.filter(r => r.jobPostId === jobId && r.typeId === 2);
          setReviews(filtered);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [user?.userId, jobId]);

  return (
    <Card className="border-0 shadow-sm bg-white/70 dark:bg-zinc-900/70">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
          <Star className="h-5 w-5 fill-amber-600" />
        </div>
        <CardTitle className="text-lg">Đánh giá từ người làm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-r-transparent" />
            <p className="mt-3 text-sm">Đang tải đánh giá...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageCircleIcon className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">Chưa có đánh giá nào từ người làm.</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="p-4 rounded-lg bg-muted/30 border border-muted/50 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <WorkerProfilePreviewDialog
                  workerId={review.raterProfile?.workerProfile?.id}
                  workerUserId={review.raterProfile?.workerProfile?.userId}
                  workerName={review.raterProfile?.workerProfile?.fullName}
                >
                  <Avatar className="h-9 w-9 border shadow-xs">
                    <AvatarImage src={review.raterProfile?.workerProfile?.avatarUrl || "/placeholder.svg"} className="object-cover" />
                    <AvatarFallback className="bg-agro-green/10 text-agro-green text-xs font-semibold">
                      {(review.raterProfile?.workerProfile?.fullName || "W").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </WorkerProfilePreviewDialog>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {review.raterProfile?.workerProfile?.fullName || "Người làm"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {review.raterProfile?.workerProfile?.primaryLocation || "Không có địa điểm"}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-4 w-4", i < review.ratingScore ? "text-amber-500 fill-amber-500" : "text-muted stroke-muted-foreground/30")} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(review.createdAt))}
                </span>
              </div>
              <div className="mt-1 flex flex-col gap-2">
                {(() => {
                  if (!review.reviewText) return <p className="text-sm text-foreground leading-relaxed">Không có nội dung đánh giá.</p>;

                  // Extract format: [Tag 1, Tag 2] Review text
                  const match = review.reviewText.match(/^\[([\s\S]*?)\]\s*([\s\S]*)$/);
                  if (match) {
                    const tags = match[1].split(',').map(t => t.trim()).filter(Boolean);
                    const remainingText = match[2].trim();
                    return (
                      <>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {tags.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-amber-100/50 text-amber-700 hover:bg-amber-100 border-amber-200/50 font-normal">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {remainingText && (
                          <p className="text-sm text-foreground leading-relaxed mt-1">{remainingText}</p>
                        )}
                      </>
                    );
                  }

                  return <p className="text-sm text-foreground leading-relaxed">{review.reviewText}</p>;
                })()}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function WorkerAverageRating({ userId, fallback }: { userId?: string, fallback?: number }) {
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    ratingService.getAverage(userId)
      .then(res => {
        if (res.data !== undefined) {
          setRating(res.data);
        }
      })
      .catch(() => { });
  }, [userId]);

  const displayRating = rating !== null ? rating : fallback;

  return (
    <>
      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
      <span>{displayRating !== undefined && displayRating !== null ? displayRating.toFixed(1) : "5.0"}</span>
    </>
  );
}

export default function FarmerJobDetailPage() {
  const { user } = useAuth()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const jobId = Array.isArray(params?.id) ? params.id[0] : params?.id

  const [applicationFilter, setApplicationFilter] = useState<"all" | "pending" | "approved" | "cancelled">("all")
  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<ApplicationDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReloading, setIsReloading] = useState(false)
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applicationsError, setApplicationsError] = useState<string | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDTO | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isRespondDialogOpen, setIsRespondDialogOpen] = useState(false)
  const [isLoadingApplicationDetail, setIsLoadingApplicationDetail] = useState(false)
  const [applicationDetailError, setApplicationDetailError] = useState<string | null>(null)
  const [responseMessage, setResponseMessage] = useState("")
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false)
  const [responseStatus, setResponseStatus] = useState<ApplicationStatusId>(APP_STATUS.accepted)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isStartJobDialogOpen, setIsStartJobDialogOpen] = useState(false)
  const [isCompleteJobDialogOpen, setIsCompleteJobDialogOpen] = useState(false)
  const [jobDetails, setJobDetails] = useState<JobDetail[]>([])
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false)
  const [jobDetailStatusFilter, setJobDetailStatusFilter] = useState<"all" | "in-progress" | "reported" | "completed">("all")
  const [jobDetailOrderFilter, setJobDetailOrderFilter] = useState<"newest" | "oldest">("newest")
  const [selectedJobDetail, setSelectedJobDetail] = useState<JobDetail | null>(null)
  const [isJobDetailDialogOpen, setIsJobDetailDialogOpen] = useState(false)
  const [isApprovingDetail, setIsApprovingDetail] = useState(false)
  const [approvalFeedback, setApprovalFeedback] = useState("")
  const [approvalPercent, setApprovalPercent] = useState(100)
  const [isLoadingSingleJobDetail, setIsLoadingSingleJobDetail] = useState(false)
  const [applicationsPage, setApplicationsPage] = useState(1)
  const [applicationsTotalPages, setApplicationsTotalPages] = useState(1)
  const applicationsPageSize = 4
  const [jobDetailsPage, setJobDetailsPage] = useState(1)
  const [jobDetailsTotalPages, setJobDetailsTotalPages] = useState(1)
  const [autoAcceptingId, setAutoAcceptingId] = useState<string | null>(null)
  const [cancellingApplicationId, setCancellingApplicationId] = useState<string | null>(null)
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)
  const [ratingApplication, setRatingApplication] = useState<ApplicationDTO | null>(null)
  const [ratingScore, setRatingScore] = useState(5)
  const [ratingReviewText, setRatingReviewText] = useState("")
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)
  const [ratedByWorkerId, setRatedByWorkerId] = useState<Record<string, RatingDTO>>({})
  const [workersPerDay, setWorkersPerDay] = useState<{ date: string; acceptedWorkerCount: number }[]>([])
  const [isLoadingWorkersPerDay, setIsLoadingWorkersPerDay] = useState(false)
  const [resolvedJobCategoryName, setResolvedJobCategoryName] = useState("Chưa phân loại")
  const [confirmAction, setConfirmAction] = useState<{
    type: "cancel-application" | "auto-accept-application" | "approve-job-detail"
    applicationId?: string
  } | null>(null)

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (applicationFilter === "pending") return app.statusId === APP_STATUS.pending
      if (applicationFilter === "approved") return app.statusId === APP_STATUS.accepted
      if (applicationFilter === "cancelled") return app.statusId === APP_STATUS.cancelled || app.statusId === APP_STATUS.rejected
      return true
    })
  }, [applications, applicationFilter])

  const redirectIfDraftJob = (jobData: Job) => {
    if (jobData.statusId === JOB_POST_STATUS.Draft) {
      router.replace("/farmer/jobs")
      return true
    }

    return false
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value)

  const formatDate = (value: string) => {
    if (!value) {
      return "-"
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }

    return new Intl.DateTimeFormat("vi-VN").format(date)
  }

  const formatDateTime = (value?: string) => {
    if (!value) {
      return "-"
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }

    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date)
  }

  const statusBadge = (statusId: ApplicationStatusId) => {
    if (statusId === APP_STATUS.pending) {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Chờ duyệt</Badge>
    }

    if (statusId === APP_STATUS.accepted) {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Đã ứng tuyển</Badge>
    }

    if (statusId === APP_STATUS.rejected) {
      return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Đã từ chối</Badge>
    }

    return <Badge variant="secondary">Đã hủy</Badge>
  }

  const statusText = (statusId: ApplicationStatusId) => {
    if (statusId === APP_STATUS.pending) return "Chờ duyệt"
    if (statusId === APP_STATUS.accepted) return "Đã nhận"
    if (statusId === APP_STATUS.rejected) return "Đã từ chối"
    return "Đã hủy"
  }

  const normalizeStatus = (statusId?: JobPostStatus, startDate?: string) => {
    if (statusId === JobPostStatus.Published && startDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const jobStart = new Date(startDate)
      if (jobStart < today) {
        return "passed"
      }
    }

    switch (statusId) {
      case JobPostStatus.Published:
        return "active"
      case JobPostStatus.Closed:
        return "filled"
      case JobPostStatus.InProgress:
        return "in-progress"
      case JobPostStatus.Completed:
        return "completed"
      case JobPostStatus.Cancelled:
        return "cancelled"
      default:
        return "active"
    }
  }

  const status = useMemo(() => normalizeStatus(job?.statusId, job?.startDate), [job?.statusId, job?.startDate])
  const canDisplayJobReports =
    job?.statusId !== JOB_POST_STATUS.Draft &&
    job?.statusId !== JOB_POST_STATUS.Published &&
    job?.statusId !== JOB_POST_STATUS.Closed

  const jobStatusBadge = useMemo(() => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-100/80 text-emerald-800 border-emerald-200 px-3 py-1 flex items-center gap-1.5 ring-offset-background transition-all hover:bg-emerald-100">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đang tuyển dụng
          </Badge>
        )
      case "filled":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 flex items-center gap-1.5 hover:bg-blue-100">
            <Users className="h-3.5 w-3.5" />
            Đã đủ người
          </Badge>
        )
      case "in-progress":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1 flex items-center gap-1.5 hover:bg-amber-100">
            <RotateCw className="h-3.5 w-3.5 animate-spin-slow" />
            Đang thực hiện
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-slate-100 text-slate-800 border-slate-200 px-3 py-1 flex items-center gap-1.5 hover:bg-slate-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã hoàn thành
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-200 px-3 py-1 flex items-center gap-1.5 hover:bg-rose-100">
            <XCircle className="h-3.5 w-3.5" />
            Đã hủy bài
          </Badge>
        )
      case "passed":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-200 px-3 py-1 flex items-center gap-1.5 hover:bg-rose-100">
            <Clock className="h-3.5 w-3.5" />
            Hết hạn tuyển
          </Badge>
        )
      default:
        return null
    }
  }, [status])

  const jobDetailStatusBadge = (statusId: number) => {
    switch (statusId) {
      case JobStatus.InProgress:
        return <Badge variant="outline" className="bg-muted text-muted-foreground border-muted-foreground/20">Chưa báo cáo</Badge>
      case JobStatus.Reported:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 ring-1 ring-blue-500/20 shadow-sm">Đã gửi báo cáo</Badge>
      case JobStatus.Completed:
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm">Đã được phê duyệt</Badge>
      default:
        return <Badge variant="outline" className="opacity-50">Không xác định</Badge>
    }
  }

  const loadApplications = async (currentJobId: string, page: number = 1, statusId?: number) => {
    try {
      setIsLoadingApplications(true)
      setApplicationsError(null)

      const response = await jobApplicationService.getJobApplicationsByPost(currentJobId, {
        limit: 4,
        page: page,
        statusId: statusId,
        includeAll: statusId === undefined,
      })

      setApplications(response.data.data)
      setApplicationsTotalPages(response.data.pagination?.totalPages || 1)
    } catch (applicationsFetchError) {
      console.error(applicationsFetchError)
      setApplicationsError("Không thể tải danh sách ứng tuyển.")
      setApplications([])
    } finally {
      setIsLoadingApplications(false)
    }
  }

  const loadJobDetails = async (currentJobId: string, page: number = 1) => {
    try {
      setIsLoadingJobDetails(true)

      const jobStatus =
        jobDetailStatusFilter === "in-progress"
          ? "InProgress"
          : jobDetailStatusFilter === "reported"
            ? "Reported"
            : jobDetailStatusFilter === "completed"
              ? "Completed"
              : undefined

      const response = await jobDetailsService.getJobDetailsByPost(currentJobId, {
        page,
        limit: 4,
        jobStatus,
        orderByDescending: jobDetailOrderFilter === "newest",
      })

      setJobDetails(response.data.data)
      setJobDetailsTotalPages(response.data.pagination?.totalPages || 1)
    } catch (err) {
      console.error("Failed to fetch job details:", err)
      setJobDetails([])
      setJobDetailsTotalPages(1)
    } finally {
      setIsLoadingJobDetails(false)
    }
  }

  const resetApplicationDialogState = () => {
    setApplicationDetailError(null)
    setSelectedApplication(null)
    setResponseMessage("")
    setResponseStatus(APP_STATUS.accepted)
  }

  const openApplicationDialog = async (applicationId: string, mode: "detail" | "respond") => {
    try {
      setApplicationDetailError(null)
      setIsLoadingApplicationDetail(true)
      setSelectedApplication(null)

      if (mode === "detail") {
        setIsDetailDialogOpen(true)
      } else {
        setIsRespondDialogOpen(true)
      }

      const response = await jobApplicationService.getApplicationDetail(applicationId)
      console.log(response);
      setSelectedApplication(response.data)
      setResponseMessage(response.data.responseMessage ?? "")
      setResponseStatus(response.data.statusId === APP_STATUS.rejected ? APP_STATUS.rejected : APP_STATUS.accepted)
    } catch (detailError) {
      console.error(detailError)
      setSelectedApplication(null)
      setApplicationDetailError("Không thể tải chi tiết hồ sơ ứng tuyển.")
    } finally {
      setIsLoadingApplicationDetail(false)
    }
  }

  const openApplicationDetail = async (applicationId: string) => {
    await openApplicationDialog(applicationId, "detail")
  }

  const openApplicationRespond = async (applicationId: string) => {
    await openApplicationDialog(applicationId, "respond")
  }

  const handleRespondApplication = async (statusId: ApplicationStatusId) => {
    if (!selectedApplication) {
      return
    }

    try {
      setIsSubmittingResponse(true)

      const payload: RespondApplicationRequest = {
        statusId,
        respondedAt: new Date().toISOString(),
        responseMessage: responseMessage.trim() || undefined,
      }

      await jobApplicationService.respondApplicant(selectedApplication.id, payload)

      if (jobId) {
        await loadApplications(jobId)
      }

      const latest = await jobApplicationService.getApplicationDetail(selectedApplication.id)
      setSelectedApplication(latest.data)
      setResponseMessage(latest.data.responseMessage ?? "")
    } catch (respondError) {
      console.error(respondError)
      setApplicationDetailError("Không thể phản hồi hồ sơ ứng tuyển. Vui lòng thử lại.")
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  const handleCancelApplication = async (applicationId: string) => {
    if (!jobId) return

    try {
      setCancellingApplicationId(applicationId)
      await jobApplicationService.cancelApplication(applicationId)
      await loadApplications(jobId, applicationsPage)

      if (selectedApplication?.id === applicationId) {
        const latest = await jobApplicationService.getApplicationDetail(applicationId)
        setSelectedApplication(latest.data)
        setResponseMessage(latest.data.responseMessage ?? "")
      }
    } catch (cancelError) {
      console.error(cancelError)
      setApplicationDetailError("Không thể hủy hồ sơ ứng tuyển. Vui lòng thử lại.")
    } finally {
      setCancellingApplicationId(null)
    }
  }

  const handleUpdateStatus = async (newStatus: JobPostStatus) => {
    if (!jobId) return

    try {
      setIsUpdatingStatus(true)
      await jobService.updateStatus(jobId, newStatus)

      // Refresh job detail
      const response = await jobService.getJobDetail(jobId)
      if (redirectIfDraftJob(response.data)) {
        return
      }
      setJob(response.data)
    } catch (err) {
      console.error(err)
      setError("Không thể cập nhật trạng thái bài đăng.")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleOpenJobDetail = async (detailId: string) => {
    try {
      setIsJobDetailDialogOpen(true)
      setIsLoadingSingleJobDetail(true)
      const response = await jobDetailsService.getJobDetail(detailId)
      console.log(response)
      setSelectedJobDetail(response.data)
      setApprovalFeedback(response.data.farmerFeedback || "")
      setApprovalPercent(response.data.farmerApprovedPercent || 100)
    } catch (err) {
      console.error("Failed to fetch job detail:", err)
    } finally {
      setIsLoadingSingleJobDetail(false)
    }
  }

  const handleApproveJobDetail = async () => {
    if (!selectedJobDetail) return

    try {
      setIsApprovingDetail(true)
      await jobDetailsService.approveJobDetail(selectedJobDetail.id, {
        farmerApprovedPercent: approvalPercent,
        farmerFeedback: approvalFeedback,
      })

      // Refresh job detail in the list
      if (jobId) {
        await loadJobDetails(jobId, jobDetailsPage)
      }

      // If the approved details fall on the last day of the job, mark job as Completed
      if (job && job.endDate && selectedJobDetail.workDate && job.statusId === JOB_POST_STATUS.InProgress) {
        const endDateObj = new Date(job.endDate)
        const workDateObj = new Date(selectedJobDetail.workDate)
        const isSameDay = endDateObj.getFullYear() === workDateObj.getFullYear() &&
          endDateObj.getMonth() === workDateObj.getMonth() &&
          endDateObj.getDate() === workDateObj.getDate()

        if (isSameDay) {
          await handleUpdateStatus(JOB_POST_STATUS.Completed)
        }
      }

      // Close dialog or update current view
      setIsJobDetailDialogOpen(false)
    } catch (err) {
      console.error("Failed to approve job detail:", err)
    } finally {
      setIsApprovingDetail(false)
    }
  }

  const handleCancelJob = async () => {
    if (!jobId) return

    try {
      setIsCancelling(true)
      await jobService.cancelJob(jobId)

      // Refresh job detail
      const response = await jobService.getJobDetail(jobId)
      if (redirectIfDraftJob(response.data)) {
        return
      }
      setJob(response.data)
      setIsCancelDialogOpen(false)
    } catch (err) {
      console.error(err)
      setError("Không thể hủy bài đăng.")
    } finally {
      setIsCancelling(false)
    }
  }

  const reloadJobPost = async () => {
    if (!jobId) return
    try {
      setIsReloading(true)
      setError(null)

      // Reload job details
      const jobResponse = await jobService.getJobDetail(jobId)
      if (redirectIfDraftJob(jobResponse.data)) {
        return
      }
      setJob(jobResponse.data)

      // Reload applications
      await loadApplications(jobId, 1)

      // Reload workers per day
      const workersResponse = await jobService.getWorkersPerDay(jobId)
      setWorkersPerDay(workersResponse.data || [])

      // Reload job details if job is in progress
      if (jobResponse.data.statusId !== JOB_POST_STATUS.Draft &&
        jobResponse.data.statusId !== JOB_POST_STATUS.Published &&
        jobResponse.data.statusId !== JOB_POST_STATUS.Closed) {
        await loadJobDetails(jobId, 1)
        setJobDetailsPage(1)
      }
    } catch (err) {
      console.error(err)
      setError("Không thể tải lại dữ liệu. Vui lòng thử lại.")
    } finally {
      setIsReloading(false)
    }
  }

  const handleAutoAccept = async (applicationId: string) => {
    if (!jobId) return
    try {
      setAutoAcceptingId(applicationId)
      await jobApplicationService.autoAccept(applicationId)
      await loadApplications(jobId, applicationsPage)
    } catch (err) {
      console.error(err)
      setError("Không thể nhận ứng viên. Vui lòng thử lại.")
    } finally {
      setAutoAcceptingId(null)
    }
  }

  const requestCancelApplication = (applicationId: string) => {
    setConfirmAction({ type: "cancel-application", applicationId })
  }

  const requestAutoAccept = (applicationId: string) => {
    setConfirmAction({ type: "auto-accept-application", applicationId })
  }

  const requestApproveJobDetail = () => {
    setConfirmAction({ type: "approve-job-detail" })
  }

  const isConfirmActionLoading =
    (confirmAction?.type === "cancel-application" && !!cancellingApplicationId) ||
    (confirmAction?.type === "auto-accept-application" && !!autoAcceptingId) ||
    (confirmAction?.type === "approve-job-detail" && isApprovingDetail)

  const confirmDialogCopy = useMemo(() => {
    switch (confirmAction?.type) {
      case "cancel-application":
        return {
          title: "Xác nhận hủy ứng tuyển",
          description: "Bạn có chắc muốn hủy hồ sơ ứng tuyển này không? Ứng viên sẽ không còn ở trạng thái đã nhận.",
          confirmLabel: "Xác nhận hủy",
          confirmClassName: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        }
      case "auto-accept-application":
        return {
          title: "Xác nhận duyệt ứng viên",
          description: "Bạn có chắc muốn chấp nhận ứng viên này không?",
          confirmLabel: "Xác nhận duyệt",
          confirmClassName: "bg-agro-green text-white hover:bg-agro-green/90",
        }
      case "approve-job-detail":
        return {
          title: "Xác nhận phê duyệt báo cáo",
          description: "Bạn có chắc muốn lưu và phê duyệt báo cáo công việc này không?",
          confirmLabel: "Lưu & phê duyệt",
          confirmClassName: "bg-agro-green text-white hover:bg-agro-green/90",
        }
      default:
        return {
          title: "Xác nhận thao tác",
          description: "Bạn có chắc muốn tiếp tục thao tác này không?",
          confirmLabel: "Xác nhận",
          confirmClassName: "",
        }
    }
  }, [confirmAction?.type])

  const handleConfirmAction = async () => {
    if (!confirmAction) return

    if (confirmAction.type === "cancel-application" && confirmAction.applicationId) {
      await handleCancelApplication(confirmAction.applicationId)
    }

    if (confirmAction.type === "auto-accept-application" && confirmAction.applicationId) {
      await handleAutoAccept(confirmAction.applicationId)
    }

    if (confirmAction.type === "approve-job-detail") {
      await handleApproveJobDetail()
    }

    setConfirmAction(null)
  }

  const handleStartJobButtonClick = () => {
    if (!job) return

    // Parse the start date
    const startDate = parseISO(job.startDate)

    if (!isToday(startDate)) {
      setIsStartJobDialogOpen(true)
    } else {
      void handleUpdateStatus(JOB_POST_STATUS.InProgress)
    }
  }

  const handleRepostJob = () => {
    if (!jobId) return

    router.push(`/farmer/create-job?repostFromJobId=${encodeURIComponent(jobId)}`)
  }

  const openRatingDialog = (application: ApplicationDTO) => {
    const workerId = application.worker?.userId
    const existingRating = workerId ? ratedByWorkerId[workerId] : undefined

    setRatingApplication(application)
    setRatingScore(existingRating?.ratingScore ?? 5)
    setRatingReviewText(existingRating?.reviewText ?? "")
    setRatingError(null)
    setIsRatingDialogOpen(true)
  }

  const handleSubmitRating = async () => {
    if (!jobId || !ratingApplication?.worker?.userId) {
      setRatingError("Không đủ thông tin để gửi đánh giá.")
      return
    }

    try {
      setIsSubmittingRating(true)
      setRatingError(null)

      const payload: RatingCreateDTO = {
        rateeId: ratingApplication.worker.userId,
        jobPostId: jobId,
        ratingScore,
        reviewText: ratingReviewText.trim(),
        typeId: RatingType.FarmerToWorker,
        createdAt: new Date().toISOString(),
      }

      const response = await ratingService.create(payload)

      setRatedByWorkerId((prev) => ({
        ...prev,
        [payload.rateeId]: response.data,
      }))

      setIsRatingDialogOpen(false)
      setRatingApplication(null)
      setRatingScore(5)
      setRatingReviewText("")
    } catch (submitRatingError) {
      console.error(submitRatingError)
      setRatingError("Không thể gửi đánh giá. Vui lòng thử lại.")
    } finally {
      setIsSubmittingRating(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const nestedCategoryName = job?.jobCategory?.name?.trim()
    if (nestedCategoryName) {
      setResolvedJobCategoryName(nestedCategoryName)
      return () => {
        isMounted = false
      }
    }

    const categoryId = job?.jobCategoryId?.trim()
    if (!categoryId) {
      setResolvedJobCategoryName("Chưa phân loại")
      return () => {
        isMounted = false
      }
    }

    jobCategoryService
      .getJobCategoryDetail(categoryId)
      .then((response) => {
        if (!isMounted) return
        const categoryName = response.data?.name?.trim()
        setResolvedJobCategoryName(categoryName || "Chưa phân loại")
      })
      .catch(() => {
        if (!isMounted) return
        setResolvedJobCategoryName("Chưa phân loại")
      })

    return () => {
      isMounted = false
    }
  }, [job?.jobCategory?.name, job?.jobCategoryId])

  useEffect(() => {
    if (!jobId) {
      setError("Không tìm thấy bài đăng.")
      setIsLoading(false)
      return
    }

    const loadJobDetail = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await jobService.getJobDetail(jobId)
        if (redirectIfDraftJob(response.data)) {
          return
        }
        setJob(response.data)
      } catch (fetchError) {
        console.error(fetchError)
        setError("Không thể tải chi tiết bài đăng. Vui lòng thử lại.")
        setJob(null)
      } finally {
        setIsLoading(false)
      }
    }

    const loadWorkersPerDayData = async () => {
      try {
        setIsLoadingWorkersPerDay(true)
        const response = await jobService.getWorkersPerDay(jobId)
        setWorkersPerDay(response.data || [])
      } catch (err) {
        console.error("Failed to fetch workers per day:", err)
      } finally {
        setIsLoadingWorkersPerDay(false)
      }
    }

    void loadJobDetail()
    void loadWorkersPerDayData()
  }, [jobId])

  useEffect(() => {
    if (!jobId) {
      setApplications([])
      return
    }

    let statusId: number | undefined
    if (applicationFilter === "pending") statusId = APP_STATUS.pending
    else if (applicationFilter === "approved") statusId = APP_STATUS.accepted
    else if (applicationFilter === "cancelled") statusId = APP_STATUS.cancelled
    
    void loadApplications(jobId, applicationsPage, statusId)
  }, [jobId, applicationsPage, applicationFilter])

  useEffect(() => {
    if (job && jobId &&
      job.statusId !== JOB_POST_STATUS.Draft &&
      job.statusId !== JOB_POST_STATUS.Published &&
      job.statusId !== JOB_POST_STATUS.Closed) {
      void loadJobDetails(jobId, jobDetailsPage)
    }
  }, [job, jobId, jobDetailsPage, jobDetailStatusFilter, jobDetailOrderFilter])

  useEffect(() => {
    setJobDetailsPage(1)
  }, [jobDetailStatusFilter, jobDetailOrderFilter])

  useEffect(() => {
    if (!jobId || job?.statusId !== JOB_POST_STATUS.Completed) {
      setRatedByWorkerId({})
      return
    }

    ratingService.getGiven()
      .then((res) => {
        const ratings = res.data ?? []
        const ratingMap: Record<string, RatingDTO> = {}

        ratings
          .filter((rating) => rating.jobPostId === jobId && rating.typeId === RatingType.FarmerToWorker)
          .forEach((rating) => {
            ratingMap[rating.rateeId] = rating
          })

        setRatedByWorkerId(ratingMap)
      })
      .catch((givenRatingsError) => {
        console.error(givenRatingsError)
        setRatedByWorkerId({})
      })
  }, [job?.statusId, jobId])

  const jobTypeLabel = job?.jobTypeId === 1 ? "Khoán" : job?.jobTypeId === 2 ? "Ngày" : "-"

  // For per-plot jobs (jobTypeId === 1) we only allow responding/approving
  // the daily report that matches the job's end date. For other job types
  // approval is allowed unless the job is Completed.
  const isApprovalSectionDisabledFor = (detail?: JobDetail) => {
    if (!job) return true
    if (job.statusId === JOB_POST_STATUS.Completed) return true

    // If this is a per-plot job, only allow approval on the report whose
    // workDate equals the job's endDate.
    if (job.jobTypeId === 1) {
      if (!job.endDate || !detail?.workDate) return true
      const end = new Date(job.endDate)
      const work = new Date(detail.workDate)
      end.setHours(0, 0, 0, 0)
      work.setHours(0, 0, 0, 0)
      return end.getTime() !== work.getTime()
    }

    return false
  }
  const workersNeededPerDay = useMemo(() => {
    if (!job) {
      return 0
    }

    const dayCount = Array.isArray(job.jobPostDays) ? job.jobPostDays.length : 0
    if (dayCount <= 0) {
      return job.workersNeeded
    }

    const totalWorkersNeeded = job.jobPostDays?.reduce((sum, day) => sum + day.workersNeeded, 0) ?? job.workersNeeded
    return Math.ceil(totalWorkersNeeded / dayCount)
  }, [job])

  const getWorkersNeededForDate = (dateStr: string) => {
    if (!job || !job.jobPostDays || job.jobPostDays.length === 0) return job?.workersNeeded || 1;
    const targetDate = dateStr.split("T")[0];
    const match = job.jobPostDays.find(d => d.workDate.split("T")[0] === targetDate);
    return match ? match.workersNeeded : (job.workersNeeded || 1);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* breadcrumb-ish header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          asChild
          className="w-auto flex-none justify-start gap-2 bg-agro-green text-white hover:bg-agro-green/90 hover:text-white">
          <Link href="/farmer/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Về danh sách bài đăng
          </Link>
        </Button>
        <div className="flex gap-2">
          {job && (
            <>
              <Button
                variant="outline"
                onClick={() => void reloadJobPost()}
                disabled={isReloading}
                className="bg-white/70 dark:bg-slate-900/70 border-slate-200 hover:bg-slate-50"
              >
                <RotateCw className={`h-4 w-4 ${isReloading ? "animate-spin" : ""}`} />
                <span className="ml-2 hidden sm:inline">Tải lại</span>
              </Button>

              {/* Show "Bắt đầu công việc" if enough applicants and status is Closed */}
              {job.workersAccepted >= job.workersNeeded && job.statusId === JOB_POST_STATUS.Closed && (
                <Button
                  onClick={handleStartJobButtonClick}
                  disabled={isUpdatingStatus || isCancelling}
                  className="bg-agro-green hover:bg-agro-green/90 text-white"
                >
                  {isUpdatingStatus ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Bắt đầu công việc
                </Button>
              )}

              {/* Show "Hoàn thành công việc" if status is InProgress */}
              {job.statusId === JOB_POST_STATUS.InProgress && (
                <Button
                  onClick={() => setIsCompleteJobDialogOpen(true)}
                  disabled={isUpdatingStatus || isCancelling}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdatingStatus ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Hoàn thành công việc
                </Button>
              )}


              {/* Only show "Hủy tin đăng" if the job is not yet in progress or finished */}
              {job.statusId === JOB_POST_STATUS.Published && (
                <Button
                  variant="outline"
                  onClick={() => setIsCancelDialogOpen(true)}
                  disabled={isUpdatingStatus || isCancelling}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Hủy tin đăng
                </Button>
              )}

              {job.statusId === JOB_POST_STATUS.Published && (
                <Button variant="outline" asChild className="border-agro-green/20 text-agro-green hover:bg-agro-green/10">
                  <Link href={`/farmer/jobs/${jobId}/edit`}>
                    Sửa bài đăng
                  </Link>
                </Button>
              )}

              {job.statusId === JOB_POST_STATUS.Cancelled && (
                <Button
                  variant="outline"
                  onClick={handleRepostJob}
                  className="border-agro-green/20 text-agro-green hover:bg-agro-green/10"
                >
                  Đăng lại
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="py-24">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-agro-green border-r-transparent" />
              <p className="text-muted-foreground animate-pulse">Đang tải thông tin bài đăng...</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="py-12 text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto opacity-50" />
            <p className="text-destructive font-medium">{error}</p>
            <Button className="bg-destructive hover:bg-destructive/90" onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && job ? (
        <div className="space-y-8 animate-in fade-in duration-700">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-agro-green/10 via-emerald-50/5 to-teal-50/10 p-8 border border-emerald-100 dark:border-emerald-900/20 shadow-sm group">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl opacity-50 transition-all duration-500" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl opacity-50 transition-all duration-500" />

            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{job.title}</h1>
                    <Badge variant="outline" className="bg-white/60 dark:bg-zinc-800/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 text-sm mt-3">
                      {resolvedJobCategoryName}
                    </Badge>
                    {job.jobTypeId && (
                      <Badge variant="secondary" className="bg-white/60 dark:bg-zinc-800/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 text-sm mt-3">
                        {job.jobTypeId === 1 ? "Khoán" : job.jobTypeId === 2 ? "Ngày" : "Khác"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-agro-green" />
                    <span className="text-lg">{job.address}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 drop-shadow-sm">
                  {jobStatusBadge}
                  <div className="flex items-center gap-2 text-sm text-foreground/60 font-medium">
                    <CalendarDays className="h-4 w-4" />
                    <span>Đăng ngày: {formatDate(job.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            <div className="space-y-8 lg:col-span-3">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="border-0 shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                    <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 mb-0.5">
                      <Banknote className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">Mức lương</p>
                    <p className="text-lg font-bold text-emerald-600 leading-tight">{formatCurrency(job.wageAmount)}</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                    <div className="p-2 rounded-full bg-amber-100 text-amber-600 mb-0.5">
                      <Users className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">Số lượng</p>
                    <p className="text-lg font-bold leading-tight">{job.workersAccepted}/{job.workersNeeded}</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600 mb-0.5">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">Thời gian</p>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold leading-tight">{formatDate(job.startDate)}</p>
                      <p className="text-[9px] text-muted-foreground">Đến</p>
                      <p className="text-xs font-bold leading-tight">{formatDate(job.endDate)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-2 flex flex-col items-center text-center gap-1">
                    <div className="p-2 rounded-full bg-teal-100 text-teal-600 mb-0.5">
                      <Clock className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">Giờ làm việc</p>
                    <p className="text-base font-bold leading-tight">{job.startTime?.slice(0, 5)} - {job.endTime?.slice(0, 5)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Workers Per Day (Thợ theo ngày) */}
              {job.jobTypeId === 2 && workersPerDay.length > 0 && (
                <Card className="border-0 shadow-sm overflow-hidden bg-white/80 dark:bg-zinc-900/80">
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Số lượng nhân công từng ngày</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingWorkersPerDay ? (
                      <div className="flex animate-pulse space-x-4">
                        <div className="h-4 w-1/4 rounded bg-slate-200"></div>
                        <div className="h-4 w-1/4 rounded bg-slate-200"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                        {workersPerDay.map((dayData, index) => (
                          <Collapsible key={index} className="border rounded-lg bg-slate-50 dark:bg-slate-900/50 overflow-hidden group">
                            <CollapsibleTrigger className="flex flex-row items-center justify-between w-full p-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                              <span className="text-sm font-medium text-foreground">
                                {formatDate(dayData.date)}
                              </span>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span className={`text-sm font-bold ${dayData.acceptedWorkerCount >= getWorkersNeededForDate(dayData.date) ? "text-emerald-600" : "text-amber-600"}`}>
                                  {dayData.acceptedWorkerCount}/{getWorkersNeededForDate(dayData.date)}
                                </span>
                                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="p-3 pt-0 border-t bg-white dark:bg-zinc-900">
                                {dayData.workers && dayData.workers.length > 0 ? (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {dayData.workers.map((worker) => {
                                      const matchedApp = applications.find(a => a.worker?.id === worker.workerId || a.worker?.userId === worker.workerId);
                                      const workerUserId = (worker as any).userId || matchedApp?.worker?.userId;
                                      
                                      return (
                                        <WorkerProfilePreviewDialog
                                          key={worker.workerId}
                                          workerId={worker.workerId}
                                          workerUserId={workerUserId}
                                          workerName={worker.fullName}
                                        >
                                          <Avatar className="h-8 w-8 border cursor-pointer hover:scale-105 transition-transform" title={worker.fullName}>
                                            <AvatarImage src={worker.avatarUrl || "/placeholder.svg"} className="object-cover" />
                                            <AvatarFallback className="text-xs bg-agro-green/10 text-agro-green font-medium">{worker.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                          </Avatar>
                                        </WorkerProfilePreviewDialog>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground text-center py-2 mt-2">
                                    Chưa có nhân công
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Main Job Content */}
              <div className="grid gap-8">
                <Card className="border-0 shadow-sm overflow-hidden bg-white/80 dark:bg-zinc-900/80">
                  <div className="h-1 bg-agro-green" />
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                    <div className="p-2 rounded-lg bg-agro-green/10 text-agro-green">
                      <FileText className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl">Mô tả công việc</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-lg">
                      {job.description || "Không có mô tả chi tiết."}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Skills Card */}
                  <Card className="border-0 shadow-sm bg-white/70 dark:bg-zinc-900/70 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3 -mb-10 pt-2 px-6 border-b border-muted/30">
                      <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm border border-blue-100 shrink-0">
                        <Star className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">Kỹ năng</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex flex-wrap gap-2">
                        {job.jobSkillRequirements?.length ? (
                          job.jobSkillRequirements.map((skill) => (
                            <Badge key={skill.id} variant="secondary" className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50 transition-colors rounded-full shadow-sm">
                              {skill.name}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Không có kỹ năng cụ thể.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Requirements Card */}
                  <Card className="border-0 shadow-sm bg-white/70 dark:bg-zinc-900/70 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3 -mb-10 pt-2 px-6 border-b border-muted/30">
                      <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 shadow-sm border border-amber-100 shrink-0">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">Yêu cầu</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {job.requirements?.length ? (
                        <ul className="space-y-3.5">
                          {job.requirements.map((item, index) => (
                            <li key={`${item}-${index}`} className="flex items-start gap-3 text-sm text-muted-foreground group">
                              <div className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
                              <span className="leading-relaxed group-hover:text-foreground transition-colors">{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Không có yêu cầu thêm.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Privileges Card */}
                  <Card className="border-0 shadow-sm bg-white/70 dark:bg-zinc-900/70 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3 -mb-10 pt-2 px-6 border-b border-muted/30">
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 shadow-sm border border-emerald-100 shrink-0">
                        <Banknote className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">Quyền lợi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {job.privileges?.length ? (
                        <ul className="space-y-3.5">
                          {job.privileges.map((item, index) => (
                            <li key={`${item}-${index}`} className="flex items-start gap-3 text-sm text-muted-foreground group">
                              <div className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                              <span className="leading-relaxed group-hover:text-foreground transition-colors">{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Không có quyền lợi bổ sung.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Job Reviews Section */}
                {jobId && <JobReviews jobId={jobId} />}
              </div>
            </div>

            {/* Applications Sidebar */}
            <div className="lg:col-span-2 lg:sticky lg:top-8">
              <Card className="lg:top-8 border-0 shadow-sm overflow-hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md">
                <div className="h-1 bg-agro-green" />
                <CardHeader className="pb-4 flex flex-row items-center justify-between gap-3 space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-agro-green/10 text-agro-green">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Ứng viên ({filteredApplications.length})</CardTitle>
                      <CardDescription>Danh sách hồ sơ ứng tuyển</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-agro-green hover:bg-agro-green/10 transition-all"
                    onClick={() => jobId && loadApplications(jobId)}
                    disabled={isLoadingApplications}
                  >
                    <RotateCw className={cn("h-4 w-4", isLoadingApplications && "animate-spin")} />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 bg-muted p-1 rounded-lg mb-4 text-center">
                    <button
                      onClick={() => setApplicationFilter("all")}
                      className={cn("flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all", applicationFilter === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setApplicationFilter("pending")}
                      className={cn("flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all", applicationFilter === "pending" ? "bg-background shadow-sm text-amber-600" : "text-muted-foreground hover:text-foreground")}
                    >
                      Chờ duyệt
                    </button>
                    <button
                      onClick={() => setApplicationFilter("approved")}
                      className={cn("flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all", applicationFilter === "approved" ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground hover:text-foreground")}
                    >
                      Đã duyệt
                    </button>
                    <button
                      onClick={() => setApplicationFilter("cancelled")}
                      className={cn("flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all", applicationFilter === "cancelled" ? "bg-background shadow-sm text-rose-600" : "text-muted-foreground hover:text-foreground")}
                    >
                      Đã hủy/từ chối
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 max-h-150 overflow-y-auto pr-1 custom-scrollbar md:grid-cols-2">
                    {isLoadingApplications ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-12 md:col-span-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-agro-green border-r-transparent" />
                        <p className="text-xs text-muted-foreground tracking-wide">Đang tải hồ sơ...</p>
                      </div>
                    ) : null}

                    {!isLoadingApplications && applicationsError ? (
                      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 md:col-span-2">
                        <p className="text-sm text-destructive text-center">{applicationsError}</p>
                      </div>
                    ) : null}

                    {!isLoadingApplications && !applicationsError && applications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center space-y-3 py-12 text-center opacity-60 md:col-span-2">
                        <div className="p-4 rounded-full bg-muted">
                          <Users className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Chưa có ứng viên nào.</p>
                      </div>
                    ) : null}

                    {filteredApplications.map((application) => (
                        <div
                          key={application.id}
                          className="group relative flex h-full flex-col gap-3 rounded-xl border border-muted bg-muted/30 p-4 transition-all duration-300 hover:border-agro-green/30 hover:bg-muted/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <WorkerProfilePreviewDialog
                                workerId={application.worker?.id}
                                workerUserId={application.worker?.userId}
                                workerName={application.worker?.fullName}
                              >
                                <Avatar className="h-12 w-12 border-2 border-background shadow-sm hover:scale-105 transition-transform">
                                  <AvatarImage src={application.worker?.avatarUrl || "/placeholder.svg"} className="object-cover" />
                                  <AvatarFallback className="bg-agro-green/10 text-agro-green">
                                    <Image src="/placeholder.svg" alt="placeholder" width={48} height={48} className="object-cover" />
                                  </AvatarFallback>
                                </Avatar>
                              </WorkerProfilePreviewDialog>
                              <div className="min-w-0">
                                <p className="font-bold text-foreground truncate">{application.worker?.fullName || "Ứng viên"}</p>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                  <WorkerAverageRating userId={application.worker?.userId} fallback={application.worker?.averageRating} />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {statusBadge(application.statusId)}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-tight">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true, locale: vi })}
                          </div>
                          <div className="mt-auto flex flex-row items-center justify-between gap-2 border-t border-muted/50 pt-3">
                            <div className="flex gap-1.5">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 rounded-lg hover:bg-agro-green/10 text-agro-green"
                                onClick={() => void openApplicationDetail(application.id)}
                              >
                                <InfoIcon className="h-4 w-4" />
                              </Button>
                              {application.statusId === APP_STATUS.pending && (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-agro-green/10 text-agro-green"
                                    disabled={autoAcceptingId === application.id}
                                    onClick={() => requestAutoAccept(application.id)}
                                  >
                                    {autoAcceptingId === application.id ? (
                                      <RotateCw className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-agro-green/10 text-agro-green"
                                    onClick={() => void openApplicationRespond(application.id)}
                                  >
                                    <MailIcon className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                              {application.statusId === APP_STATUS.accepted && (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-agro-green/10 text-agro-green"
                                    onClick={() => {
                                      const query = new URLSearchParams();
                                      if (application.worker?.fullName) query.set("name", application.worker.fullName);
                                      if (application.worker?.avatarUrl) query.set("avatarUrl", application.worker.avatarUrl);
                                      router.push(`/farmer/messages/${application.worker?.userId}?${query.toString()}`);
                                    }}
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </Button>
                                  {job.statusId != JOB_POST_STATUS.Completed && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-8 w-8 p-0 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                      disabled={cancellingApplicationId === application.id}
                                      onClick={() => requestCancelApplication(application.id)}
                                    >
                                      {cancellingApplicationId === application.id ? (
                                        <RotateCw className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <XCircle className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  )
                                  }
                                  {job.statusId === JOB_POST_STATUS.Completed && application.worker?.userId ? (
                                    ratedByWorkerId[application.worker.userId] ? (
                                      <Badge className="h-8 border-amber-200 bg-amber-50 px-2 text-normal text-amber-700 hover:bg-amber-50">
                                        Đã đánh giá
                                      </Badge>
                                    ) : (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0 rounded-lg border-muted text-amber-700 hover:bg-amber-700/10 hover:text-amber-700/100"
                                        onClick={() => openRatingDialog(application)}
                                      >
                                        <Star className="h-3.5 w-3.5" />
                                      </Button>
                                    )
                                  ) : null}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                    {applicationsTotalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between border-t pt-4 md:col-span-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setApplicationsPage(prev => Math.max(1, prev - 1))}
                          disabled={applicationsPage === 1 || isLoadingApplications}
                          className="h-8"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Trước
                        </Button>
                        <span className="text-xs font-medium text-muted-foreground">
                          {applicationsPage} / {applicationsTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setApplicationsPage(prev => Math.min(applicationsTotalPages, prev + 1))}
                          disabled={applicationsPage === applicationsTotalPages || isLoadingApplications}
                          className="h-8"
                        >
                          Sau
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Job Reports / Job Details Card */}
              <Card className="border-0 mt-8 shadow-sm overflow-hidden bg-white/80 dark:bg-zinc-900/80">
                <div className="h-1 bg-blue-500" />
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Báo cáo công việc</CardTitle>
                      <CardDescription>Chi tiết quá trình thực hiện của các phiên làm việc</CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex w-fit gap-1 rounded-lg bg-muted p-1 pb-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (jobId) {
                          void loadJobDetails(jobId, jobDetailsPage)
                        }
                      }}
                      className="h-8 w-8 rounded-md pb-1 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                      disabled={isLoadingJobDetails || !canDisplayJobReports}
                    >
                      <RotateCw className={cn("h-4 w-4", isLoadingJobDetails && "animate-spin")} />
                    </Button>
                      <Button
                        onClick={() => setJobDetailOrderFilter((prev) => (prev === "newest" ? "oldest" : "newest"))}
                        title={jobDetailOrderFilter === "newest" ? "Sắp xếp: Mới nhất" : "Sắp xếp: Cũ nhất"}
                        className="h-7 w-7 rounded-md bg-background text-foreground shadow-sm transition-all hover:bg-muted/50"
                      >
                        {/* Make sure to import ArrowDownUp from lucide-react, or change this back to ChevronDown */}
                        <ArrowDownUp className={cn("h-3.5 w-3.5 transition-transform", jobDetailOrderFilter === "oldest" && "rotate-180")} />
                      </Button>
                    </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <div className="flex w-full gap-1 rounded-lg bg-muted p-1">
                      <button
                        onClick={() => setJobDetailStatusFilter("all")}
                        className={cn("flex-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all", jobDetailStatusFilter === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                      >
                        Tất cả
                      </button>
                      <button
                        onClick={() => setJobDetailStatusFilter("in-progress")}
                        className={cn("flex-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all", jobDetailStatusFilter === "in-progress" ? "bg-background shadow-sm text-amber-600" : "text-muted-foreground hover:text-foreground")}
                      >
                        Chưa báo cáo
                      </button>
                      <button
                        onClick={() => setJobDetailStatusFilter("reported")}
                        className={cn("flex-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all", jobDetailStatusFilter === "reported" ? "bg-background shadow-sm text-blue-600" : "text-muted-foreground hover:text-foreground")}
                      >
                        Đã gửi
                      </button>
                      <button
                        onClick={() => setJobDetailStatusFilter("completed")}
                        className={cn("flex-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all", jobDetailStatusFilter === "completed" ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground hover:text-foreground")}
                      >
                        Đã duyệt
                      </button>
                    </div>
                  </div>

                  {isLoadingJobDetails ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-r-transparent" />
                    </div>
                  ) : !canDisplayJobReports ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Clock className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-sm">Chưa có báo cáo công việc.</p>
                      <p className="text-xs">Báo cáo sẽ hiển thị khi công việc bắt đầu.</p>
                    </div>
                  ) : jobDetails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-sm">Chưa có báo cáo công việc nào được gửi.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {jobDetails.map((detail) => (
                        <div key={detail.id} className="p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col justify-between gap-4 h-full">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{formatDate(detail.workDate)}</p>
                              </div>
                              <div>
                                {jobDetailStatusBadge(detail.statusId)}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                Chi tiết: {detail.workerDescription || "Không có mô tả từ người làm."}
                              </p>
                              {detail.attachments && detail.attachments.length > 0 && (
                                <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                  <Paperclip className="h-3 w-3" />
                                  {detail.attachments.length} tệp đính kèm
                                </div>
                              )}
                              {detail.farmerFeedback && (
                                <div className="pt-1 border-t border-muted italic text-xs text-muted-foreground">
                                  Phản hồi từ bạn: {detail.farmerFeedback}
                                </div>
                              )}
                            </div>
                            <div className="mt-auto flex flex-col items-start gap-2">
                              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                                <Banknote className="h-4 w-4" />
                                {formatCurrency(detail.jobPrice)}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {detail.farmerApprovedPercent > 0 && (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    {detail.farmerApprovedPercent}% Duyệt
                                  </Badge>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-agro-green/10 text-agro-green"
                                  onClick={() => handleOpenJobDetail(detail.id)}
                                >
                                  <InfoIcon className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {jobDetailsTotalPages > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-4 border-t pt-6 md:col-span-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setJobDetailsPage(prev => Math.max(1, prev - 1))}
                            disabled={jobDetailsPage === 1 || isLoadingJobDetails}
                            className="h-8"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Trang trước
                          </Button>
                          <span className="text-sm font-medium">
                            Trang {jobDetailsPage} / {jobDetailsTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setJobDetailsPage(prev => Math.min(jobDetailsTotalPages, prev + 1))}
                            disabled={jobDetailsPage === jobDetailsTotalPages || isLoadingJobDetails}
                            className="h-8"
                          >
                            Trang sau
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}


      <Dialog
        open={isDetailDialogOpen}
        onOpenChange={(open) => {
          setIsDetailDialogOpen(open)
          if (!open) {
            if (!isRespondDialogOpen) {
              resetApplicationDialogState()
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết hồ sơ ứng tuyển</DialogTitle>
            <DialogDescription>
              {selectedApplication?.worker?.fullName
                ? `Ứng viên: ${selectedApplication.worker.fullName}`
                : "Thông tin ứng tuyển cho bài đăng này"}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            {isLoadingApplicationDetail ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-r-transparent" />
              </div>
            ) : null}

            {!isLoadingApplicationDetail && applicationDetailError ? (
              <p className="text-sm text-destructive">{applicationDetailError}</p>
            ) : null}

            {!isLoadingApplicationDetail && !applicationDetailError && selectedApplication ? (
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-5">
                    <WorkerProfilePreviewDialog
                      workerId={selectedApplication.worker?.id}
                      workerUserId={selectedApplication.worker?.userId}
                      workerName={selectedApplication.worker?.fullName}
                    >
                      <Avatar className="h-18 w-18 border-2 border-background shadow-sm hover:scale-105 transition-transform">
                        <AvatarImage src={selectedApplication.worker?.avatarUrl || "/placeholder.svg"} className="object-cover" />
                        <AvatarFallback className="bg-agro-green/10 text-agro-green">
                          <Image src="/placeholder.svg" alt="placeholder" width={48} height={48} className="object-cover" />
                        </AvatarFallback>
                      </Avatar>
                    </WorkerProfilePreviewDialog>
                    <div>
                      <p className="font-semibold text-base">{selectedApplication.worker?.fullName || "Ứng viên"}</p>
                      <p className="text-muted-foreground">SĐT: {selectedApplication.worker?.phoneNumber || "Không có"}</p>
                      <p className="text-muted-foreground">Email: {selectedApplication.worker?.email || "Không có"}</p>
                      <p className="text-muted-foreground">Địa điểm: {selectedApplication.worker?.primaryLocation || "Không có"}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="bg-muted capitalize font-lg">{selectedApplication.worker?.gender === "Male" ? "Nam" : "Nữ"}</Badge>
                        <Badge variant="outline" className="bg-muted font-lg">{selectedApplication.worker?.date_of_birth ? `${formatDate(selectedApplication.worker.date_of_birth)}` : "Không rõ NS"}</Badge>
                        <Badge variant="outline" className="bg-muted font-lg flex items-center gap-1.5"><WorkerAverageRating userId={selectedApplication.worker?.userId} fallback={selectedApplication.worker?.averageRating} /></Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedApplication.worker?.skills && selectedApplication.worker.skills.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground mb-2">Kỹ năng chuyên môn</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApplication.worker.skills.map((skill) => (
                        <Badge key={skill.id} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 transition-colors">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Trạng thái</p>
                    <div className="mt-2">{statusBadge(selectedApplication.statusId)}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Thời điểm ứng tuyển</p>
                    <p className="mt-2 font-medium">{formatDateTime(selectedApplication.appliedAt)}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Trình độ</p>
                    <p className="mt-2 font-medium">
                      {selectedApplication.worker?.experienceLevel === "Experienced" ? "Nhiều kinh nghiệm" :
                        selectedApplication.worker?.experienceLevel === "Intermediate" ? "Có kinh nghiệm" :
                          selectedApplication.worker?.experienceLevel === "Beginner" ? "Mới bắt đầu" : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Công việc đã hoàn thành</p>
                    <p className="mt-2 font-medium">{selectedApplication.worker?.totalJobsCompleted ?? 0}</p>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Thư ứng tuyển</p>
                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                    {selectedApplication.coverLetter || "Ứng viên chưa để lại thư ứng tuyển."}
                  </p>
                </div>

                {job?.jobTypeId !== 1 && (
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground mb-3">Ngày làm việc đề xuất</p>
                    {selectedApplication.workDates?.length ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedApplication.workDates.map((workDate, index) => (
                          <div
                            key={`${workDate}-${index}`}
                            className="flex items-center gap-3 rounded-xl border border-agro-green/20 bg-gradient-to-br from-agro-green/5 to-transparent p-3 shadow-sm transition-all hover:border-agro-green/40 hover:shadow-md"
                          >
                            <div className="flex flex-shrink-0 h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-agro-green/10 text-agro-green">
                              <CalendarDays className="h-5 w-5" />
                            </div>
                            <span className="font-semibold text-foreground/80 tracking-wide">{formatDate(workDate)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-muted-foreground">Không có ngày làm việc cụ thể.</p>
                    )}
                  </div>
                )}

                {selectedApplication.responseMessage ? (
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Phản hồi từ nông dân</p>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{selectedApplication.responseMessage}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isRespondDialogOpen}
        onOpenChange={(open) => {
          setIsRespondDialogOpen(open)
          if (!open) {
            if (!isDetailDialogOpen) {
              resetApplicationDialogState()
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Phản hồi hồ sơ ứng tuyển</DialogTitle>
            <DialogDescription>
              {selectedApplication?.worker?.fullName
                ? `Ứng viên: ${selectedApplication.worker.fullName}`
                : "Gửi phản hồi cho ứng viên"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoadingApplicationDetail ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-r-transparent" />
              </div>
            ) : null}

            {!isLoadingApplicationDetail && applicationDetailError ? (
              <p className="text-sm text-destructive">{applicationDetailError}</p>
            ) : null}

            {!isLoadingApplicationDetail && !applicationDetailError && selectedApplication ? (
              <>
                <div className="rounded-lg border p-4 text-sm">
                  <p className="font-semibold">{selectedApplication.worker?.fullName || "Ứng viên"}</p>
                  <p className="text-muted-foreground">SĐT: {selectedApplication.worker?.phoneNumber || "Không có"}</p>
                  <div className="mt-2">{statusBadge(selectedApplication.statusId)}</div>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-xs text-muted-foreground">Chọn trạng thái phản hồi</p>
                  <RadioGroup
                    value={String(responseStatus)}
                    onValueChange={(value) => setResponseStatus(Number(value) as ApplicationStatusId)}
                    className="space-y-2"
                  >
                    <div className="flex flex-row gap-10 mt-2">

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="resp-approved" value={String(APP_STATUS.accepted)} />
                        <Label htmlFor="resp-approved">Chấp nhận</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="resp-rejected" value={String(APP_STATUS.rejected)} />
                        <Label htmlFor="resp-rejected">Từ chối</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-xs text-muted-foreground">Nội dung phản hồi</p>
                  <Textarea
                    value={responseMessage}
                    onChange={(event) => setResponseMessage(event.target.value)}
                    placeholder="Nhập ghi chú phản hồi cho ứng viên..."
                    rows={4}
                  />
                </div>
              </>
            ) : null}
          </div>

          {!isLoadingApplicationDetail && selectedApplication ? (
            <DialogFooter>
              {!selectedApplication.respondedAt ? (
                <div className="flex w-full justify-end">
                  <Button
                    type="button"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => void handleRespondApplication(responseStatus)}
                    disabled={isSubmittingResponse}
                  >
                    {responseStatus === APP_STATUS.rejected ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    {isSubmittingResponse ? "Đang xử lý..." : "Submit"}
                  </Button>
                </div>
              ) : (
                <div className="flex w-full items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Hồ sơ này đã được phản hồi{selectedApplication.respondedAt ? ` lúc ${formatDateTime(selectedApplication.respondedAt)}` : ""}.
                  </p>
                  {selectedApplication.statusId === APP_STATUS.accepted ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => requestCancelApplication(selectedApplication.id)}
                      disabled={cancellingApplicationId === selectedApplication.id}
                    >
                      {cancellingApplicationId === selectedApplication.id ? (
                        <>
                          <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                          Đang hủy...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Hủy ứng tuyển
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              )}
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isRatingDialogOpen}
        onOpenChange={(open) => {
          setIsRatingDialogOpen(open)
          if (!open) {
            setRatingError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đánh giá người làm</DialogTitle>
            <DialogDescription>
              {ratingApplication?.worker?.fullName
                ? `Gửi đánh giá cho ${ratingApplication.worker.fullName}`
                : "Gửi đánh giá cho người làm"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-xs text-muted-foreground">Mức đánh giá</p>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, index) => {
                  const score = index + 1
                  return (
                    <Button
                      key={score}
                      type="button"
                      variant="ghost"
                      className="h-9 w-9 p-0"
                      onClick={() => setRatingScore(score)}
                    >
                      <Star
                        className={cn(
                          "h-5 w-5",
                          score <= ratingScore ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40"
                        )}
                      />
                    </Button>
                  )
                })}
                <span className="ml-1 text-sm font-medium">{ratingScore}/5</span>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="mb-2 text-xs text-muted-foreground">Nội dung đánh giá</p>
              <Textarea
                value={ratingReviewText}
                onChange={(event) => setRatingReviewText(event.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về người làm..."
                rows={4}
              />
            </div>

            {ratingError ? (
              <p className="text-sm text-destructive">{ratingError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRatingDialogOpen(false)}
              disabled={isSubmittingRating}
            >
              Hủy
            </Button>
            <Button
              className="bg-amber-500 text-white hover:bg-amber-600"
              onClick={() => void handleSubmitRating()}
              disabled={isSubmittingRating || !ratingApplication || !user?.userId}
            >
              {isSubmittingRating ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
              {isSubmittingRating ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hủy bài đăng?</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy bài đăng này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-5 sm:gap-5">
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} disabled={isCancelling}>
              Không, quay lại
            </Button>
            <Button variant="destructive" onClick={() => void handleCancelJob()} disabled={isCancelling}>
              {isCancelling ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStartJobDialogOpen} onOpenChange={setIsStartJobDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bắt đầu công việc sớm?</DialogTitle>
            <DialogDescription>
              Ngày bắt đầu dự kiến là {formatDate(job?.startDate || "")}, nhưng hôm nay chưa tới.
              <br />
              Bạn có chắc chắn muốn bắt đầu công việc này ngay bây giờ không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-5 sm:gap-5">
            <Button variant="outline" onClick={() => setIsStartJobDialogOpen(false)} disabled={isUpdatingStatus}>
              Hủy
            </Button>
            <Button
              className="bg-agro-green hover:bg-agro-green/90"
              onClick={async () => {
                await handleUpdateStatus(JOB_POST_STATUS.InProgress)
                setIsStartJobDialogOpen(false)
              }}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              Xác nhận bắt đầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompleteJobDialogOpen} onOpenChange={setIsCompleteJobDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hoàn thành công việc?</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn đánh dấu công việc này là đã hoàn thành không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-5 sm:gap-5">
            <Button variant="outline" onClick={() => setIsCompleteJobDialogOpen(false)} disabled={isUpdatingStatus}>
              Hủy
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={async () => {
                await handleUpdateStatus(JOB_POST_STATUS.Completed)
                setIsCompleteJobDialogOpen(false)
              }}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Xác nhận hoàn thành
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Báo cáo công việc  */}
      <Dialog open={isJobDetailDialogOpen} onOpenChange={setIsJobDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo công việc</DialogTitle>
            <DialogDescription>
              {selectedJobDetail ? `Báo cáo cho ngày ${formatDate(selectedJobDetail.workDate)}` : "Đang tải báo cáo..."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1 py-4">
            {isLoadingSingleJobDetail ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-agro-green border-r-transparent" />
              </div>
            ) : selectedJobDetail ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Người làm</p>
                    <div className="mt-2 flex items-center gap-3">
                      <WorkerProfilePreviewDialog
                        workerId={selectedJobDetail.worker?.id || selectedJobDetail.workerId}
                        workerUserId={selectedJobDetail.worker?.userId}
                        workerName={selectedJobDetail.worker?.fullName}
                      >
                        <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarImage src={selectedJobDetail.worker?.avatarUrl || "/placeholder.svg"} className="object-cover" />
                          <AvatarFallback className="bg-agro-green/10 text-agro-green">
                            <Users className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      </WorkerProfilePreviewDialog>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-foreground">{selectedJobDetail.worker?.fullName || `ID: ${selectedJobDetail.workerId.slice(0, 8)}`}</p>
                        <p className="text-[11px] text-muted-foreground">{selectedJobDetail.worker?.phoneNumber || "Không có SĐT"}</p>
                      </div>
                    </div>
                    {selectedJobDetail.worker?.skills && selectedJobDetail.worker.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {selectedJobDetail.worker.skills.slice(0, 3).map(skill => (
                          <span key={skill.id} className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {skill.name}
                          </span>
                        ))}
                        {selectedJobDetail.worker.skills.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{selectedJobDetail.worker.skills.length - 3} nữa</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trạng thái</p>
                    <div className="mt-2">
                      {jobDetailStatusBadge(selectedJobDetail.statusId)}
                    </div>
                    {selectedJobDetail.completedAt && (
                      <p className="mt-2 text-[11px] text-muted-foreground italic">Hoàn thành lúc: {formatDateTime(selectedJobDetail.completedAt)}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Mô tả công việc từ người làm</Label>
                  <div className="rounded-xl border p-4 bg-white dark:bg-zinc-950/50">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedJobDetail.workerDescription || "Người làm không để lại mô tả."}
                    </p>
                  </div>
                </div>

                {selectedJobDetail.attachments && selectedJobDetail.attachments.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Đính kèm từ người làm</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedJobDetail.attachments.map(att => (
                        <a
                          key={att.id}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square border rounded-xl overflow-hidden block group"
                        >
                          {att.format && (att.format.toLowerCase() === 'mp4' || att.format.toLowerCase() === 'video' || att.format.includes('video')) ? (
                            <video
                              src={att.fileUrl}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Image
                              src={att.fileUrl}
                              alt="Đính kèm"
                              fill
                              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm transition-opacity duration-300">
                              Xem chi tiết
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 dark:border-emerald-900/20 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Số tiền lao động</p>
                      <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                        {formatCurrency(selectedJobDetail.jobPrice)}
                      </p>
                    </div>
                    <Banknote className="h-10 w-10 text-emerald-500 opacity-20" />
                  </div>
                </div>

                {
                  !isApprovalSectionDisabledFor(selectedJobDetail) && selectedJobDetail.statusId !== JobStatus.Completed && (
                    <div className="space-y-4 pt-4 border-t border-dashed">
                      <h4 className="font-bold text-base text-foreground">Phê duyệt báo cáo</h4>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="approval-range" className="text-sm font-medium">% Công việc thực tế hoàn thành</Label>
                          <span className="text-lg font-bold text-agro-green">{approvalPercent}%</span>
                        </div>
                        <input
                          id="approval-range"
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={approvalPercent}
                          onChange={(e) => setApprovalPercent(parseInt(e.target.value))}
                          disabled={false}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-agro-green disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <p className="text-[10px] text-muted-foreground italic">
                          Lưu ý: % duyệt sẽ tương ứng với % lương mà người làm nhận được cho phiên làm việc này.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="farmer-feedback" className="text-sm font-medium">Phản hồi / Ghi chú của bạn</Label>
                        <Textarea
                          id="farmer-feedback"
                          placeholder="Nhập phản hồi cho người làm..."
                          value={approvalFeedback}
                          onChange={(e) => setApprovalFeedback(e.target.value)}
                          disabled={false}
                          className="min-h-[100px] bg-white dark:bg-zinc-950/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  )}
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-3 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setIsJobDetailDialogOpen(false)}
              disabled={isApprovingDetail}
              className="flex-1 sm:flex-none"
            >
              Thoát
            </Button>
            {!isApprovalSectionDisabledFor(selectedJobDetail) && selectedJobDetail?.statusId !== JobStatus.Completed && (
              <Button
                className="bg-agro-green hover:bg-agro-green/90 flex-1 sm:flex-none"
                onClick={requestApproveJobDetail}
                disabled={isApprovingDetail || !selectedJobDetail}
              >
                {isApprovingDetail ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Lưu & Phê duyệt
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open && !isConfirmActionLoading) {
            setConfirmAction(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmDialogCopy.title}</DialogTitle>
            <DialogDescription>{confirmDialogCopy.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={isConfirmActionLoading}
            >
              Quay lại
            </Button>
            <Button
              onClick={() => void handleConfirmAction()}
              disabled={isConfirmActionLoading}
              className={confirmDialogCopy.confirmClassName}
            >
              {isConfirmActionLoading ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isConfirmActionLoading ? "Đang xử lý..." : confirmDialogCopy.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
