"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Banknote, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText, InfoIcon, MailIcon, MapPin, Play, RotateCw, Star, Users, XCircle } from "lucide-react"
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
import { jobApplicationService } from "@/libs/api/services/jobApplication.service"
import { jobDetailsService } from "@/libs/api/services/jobDetails.service"
import type { ApplicationDTO, Job, JobDetail, PaginatedResponse, RespondApplicationRequest } from "@/libs/types"
import { JobPostStatus, JobStatus } from "@/libs/types"

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

export default function FarmerJobDetailPage() {
  const params = useParams<{ id: string }>()
  const jobId = Array.isArray(params?.id) ? params.id[0] : params?.id

  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<ApplicationDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
  const [jobDetails, setJobDetails] = useState<JobDetail[]>([])
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false)
  const [selectedJobDetail, setSelectedJobDetail] = useState<JobDetail | null>(null)
  const [isJobDetailDialogOpen, setIsJobDetailDialogOpen] = useState(false)
  const [isApprovingDetail, setIsApprovingDetail] = useState(false)
  const [approvalFeedback, setApprovalFeedback] = useState("")
  const [approvalPercent, setApprovalPercent] = useState(100)
  const [isLoadingSingleJobDetail, setIsLoadingSingleJobDetail] = useState(false)
  const [applicationsPage, setApplicationsPage] = useState(1)
  const [applicationsTotalPages, setApplicationsTotalPages] = useState(1)
  const [jobDetailsPage, setJobDetailsPage] = useState(1)
  const [jobDetailsTotalPages, setJobDetailsTotalPages] = useState(1)

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
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Đã được ứng tuyển</Badge>
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

  const loadApplications = async (currentJobId: string, page: number = 1) => {
    try {
      setIsLoadingApplications(true)
      setApplicationsError(null)

      const response = await jobApplicationService.getJobApplicationsByPost(currentJobId, {
        includeAll: true,
        limit: 5,
        page: page,
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

  const handleUpdateStatus = async (newStatus: JobPostStatus) => {
    if (!jobId) return

    try {
      setIsUpdatingStatus(true)
      await jobService.updateStatus(jobId, newStatus)

      // Refresh job detail
      const response = await jobService.getJobDetail(jobId)
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
      console.log(response);
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
        const response = await jobDetailsService.getJobDetailsByPost(jobId, {
          page: jobDetailsPage,
          limit: 5
        })
        setJobDetails(response.data.data)
        setJobDetailsTotalPages(response.data.pagination?.totalPages || 1)
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
      setJob(response.data)
      setIsCancelDialogOpen(false)
    } catch (err) {
      console.error(err)
      setError("Không thể hủy bài đăng.")
    } finally {
      setIsCancelling(false)
    }
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
        setJob(response.data)
      } catch (fetchError) {
        console.error(fetchError)
        setError("Không thể tải chi tiết bài đăng. Vui lòng thử lại.")
        setJob(null)
      } finally {
        setIsLoading(false)
      }
    }

    void loadJobDetail()
  }, [jobId])

  useEffect(() => {
    if (!jobId) {
      setApplications([])
      return
    }

    void loadApplications(jobId, applicationsPage)
  }, [jobId, applicationsPage])

  useEffect(() => {
    if (job && jobId &&
      job.statusId !== JOB_POST_STATUS.Draft &&
      job.statusId !== JOB_POST_STATUS.Published &&
      job.statusId !== JOB_POST_STATUS.Closed) {
      const loadJobDetails = async () => {
        try {
          setIsLoadingJobDetails(true)
          const response = await jobDetailsService.getJobDetailsByPost(jobId, {
            page: jobDetailsPage,
            limit: 5
          })
          setJobDetails(response.data.data)
          setJobDetailsTotalPages(response.data.pagination?.totalPages || 1)
        } catch (err) {
          console.error("Failed to fetch job details:", err)
        } finally {
          setIsLoadingJobDetails(false)
        }
      }
      void loadJobDetails()
    }
  }, [job, jobId, jobDetailsPage])

  const jobTypeLabel = job?.jobTypeId === 1 ? "Khoán" : job?.jobTypeId === 2 ? "Ngày" : "-"

  return (
    <div className="flex flex-col gap-8">
      {/* breadcrumb-ish header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="hover:bg-agro-green/5 text-muted-foreground hover:text-agro-green transition-all">
          <Link href="/farmer/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Về danh sách bài đăng
          </Link>
        </Button>
        <div className="flex gap-2">
          {job && (
            <>
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
                  onClick={() => handleUpdateStatus(JOB_POST_STATUS.Completed)}
                  disabled={isUpdatingStatus || isCancelling}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdatingStatus ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Hoàn thành công việc
                </Button>
              )}


              {/* Only show "Hủy tin đăng" if the job is not yet in progress or finished */}
              {job.statusId <= JOB_POST_STATUS.Closed && (
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

              {job.statusId <= JOB_POST_STATUS.Closed && (
                <Button variant="outline" asChild className="border-agro-green/20 text-agro-green hover:bg-agro-green/10">
                  <Link href={`/farmer/jobs/${jobId}/edit`}>
                    Sửa bài đăng
                  </Link>
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
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{job.title}</h1>
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

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
                    <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-600 mb-1">
                      <Banknote className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mức lương</p>
                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(job.wageAmount)}</p>
                    <p className="text-[10px] text-muted-foreground">Lương được trả ở cuối {job.jobTypeId === 1 ? "Khoán" : "Ngày"}</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
                    <div className="p-2.5 rounded-full bg-amber-100 text-amber-600 mb-1">
                      <Users className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số lượng</p>
                    <p className="text-xl font-bold">{job.workersAccepted}/{job.workersNeeded}</p>
                    <p className="text-[10px] text-muted-foreground">Ứng viên đã nhận</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
                    <div className="p-2.5 rounded-full bg-blue-100 text-blue-600 mb-1">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thời gian</p>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold">{formatDate(job.startDate)}</p>
                      <p className="text-[10px] text-muted-foreground">Đến</p>
                      <p className="text-sm font-bold">{formatDate(job.endDate)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
                    <div className="p-2.5 rounded-full bg-teal-100 text-teal-600 mb-1">
                      <Clock className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Giờ làm việc</p>
                    <p className="text-lg font-bold">{job.startTime?.slice(0, 5)} - {job.endTime?.slice(0, 5)}</p>
                    <p className="text-[10px] text-muted-foreground">Theo lịch bài đăng</p>
                  </CardContent>
                </Card>
              </div>

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

                <div className="grid gap-8 sm:grid-cols-2">
                  <Card className="border-0 shadow-sm bg-white/70 dark:bg-zinc-900/70">
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">Kỹ năng & Yêu cầu</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {job.jobSkillRequirements?.length ? (
                          job.jobSkillRequirements.map((skill) => (
                            <Badge key={skill.id} variant="secondary" className="px-3 py-1 font-medium bg-secondary/80">
                              {skill.name}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Không có kỹ năng cụ thể.</p>
                        )}
                      </div>
                      <div className="pt-2">
                        {job.requirements?.length ? (
                          <ul className="space-y-2">
                            {job.requirements.map((item, index) => (
                              <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white/70 dark:bg-zinc-900/70">
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                        <Banknote className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">Quyền lợi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {job.privileges?.length ? (
                        <ul className="space-y-2">
                          {job.privileges.map((item, index) => (
                            <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">Không có quyền lợi bổ sung.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Applications Sidebar */}
            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-8 border-0 shadow-sm overflow-hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md">
                <div className="h-1 bg-agro-green" />
                <CardHeader className="pb-4 flex flex-row items-center justify-between gap-3 space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-agro-green/10 text-agro-green">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Ứng viên ({applications.length})</CardTitle>
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
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                    {isLoadingApplications ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-agro-green border-r-transparent" />
                        <p className="text-xs text-muted-foreground tracking-wide">Đang tải hồ sơ...</p>
                      </div>
                    ) : null}

                    {!isLoadingApplications && applicationsError ? (
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive text-center">{applicationsError}</p>
                      </div>
                    ) : null}

                    {!isLoadingApplications && !applicationsError && applications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-60">
                        <div className="p-4 rounded-full bg-muted">
                          <Users className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Chưa có ứng viên nào.</p>
                      </div>
                    ) : null}

                    {applications.map((application) => (
                      <div
                        key={application.id}
                        className="group relative flex flex-col gap-3 rounded-xl border border-muted bg-muted/30 p-4 hover:border-agro-green/30 hover:bg-muted/50 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-12 w-12 border-2 border-background shadow-sm hover:scale-105 transition-transform">
                              <AvatarImage src={application.worker?.avatarUrl || "/placeholder.svg"} className="object-cover" />
                              <AvatarFallback className="bg-agro-green/10 text-agro-green">
                                <Image src="/placeholder.svg" alt="placeholder" width={48} height={48} className="object-cover" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{application.worker?.fullName || "Ứng viên"}</p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                <span>{application.worker?.averageRating?.toFixed(1) || "5.0"}</span>
                                <span className="opacity-40">•</span>
                                <span>{application.worker?.primaryLocation || "TP.HCM"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {statusBadge(application.statusId)}
                          </div>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-2 border-t border-muted/50 pt-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-tight">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true, locale: vi })}
                          </div>
                          <div className="flex gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg hover:bg-agro-green/10 text-agro-green"
                              onClick={() => void openApplicationDetail(application.id)}
                            >
                              <InfoIcon className="h-4 w-4" />
                            </Button>
                            {application.statusId === APP_STATUS.pending && (
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 px-3 rounded-lg bg-agro-green hover:bg-agro-green-dark text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all"
                                onClick={() => void openApplicationRespond(application.id)}
                              >
                                <MailIcon className="mr-1.5 h-3.5 w-3.5" />
                                Phản hồi
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {applicationsTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t mt-4">
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
              {job.statusId !== JOB_POST_STATUS.Draft &&
                job.statusId !== JOB_POST_STATUS.Published &&
                job.statusId !== JOB_POST_STATUS.Closed && (
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (jobId) {
                            setIsLoadingJobDetails(true)
                            jobDetailsService.getJobDetailsByPost(jobId, { page: 1, limit: 100 })
                              .then(res => setJobDetails(res.data.data))
                              .finally(() => setIsLoadingJobDetails(false))
                          }
                        }}
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                        disabled={isLoadingJobDetails}
                      >
                        <RotateCw className={cn("h-4 w-4", isLoadingJobDetails && "animate-spin")} />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {isLoadingJobDetails ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-r-transparent" />
                        </div>
                      ) : jobDetails.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <FileText className="h-12 w-12 mb-4 opacity-20" />
                          <p className="text-sm">Chưa có báo cáo công việc nào được gửi.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {jobDetails.map((detail) => (
                            <div key={detail.id} className="p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">{formatDate(detail.workDate)}</p>
                                    {jobDetailStatusBadge(detail.statusId)}
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {detail.workerDescription || "Không có mô tả từ người làm."}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
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
                                      className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={() => handleOpenJobDetail(detail.id)}
                                    >
                                      Chi tiết
                                      <InfoIcon className="ml-1.5 h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              {detail.farmerFeedback && (
                                <div className="mt-3 pt-3 border-t border-muted italic text-xs text-muted-foreground">
                                  Phản hồi từ bạn: {detail.farmerFeedback}
                                </div>
                              )}
                            </div>
                          ))}

                          {jobDetailsTotalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 pt-6 border-t mt-4">
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
                )}
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
                    <Avatar className="h-18 w-18 border-2 border-background shadow-sm hover:scale-105 transition-transform">
                      <AvatarImage src={selectedApplication.worker?.avatarUrl || "/placeholder.svg"} className="object-cover" />
                      <AvatarFallback className="bg-agro-green/10 text-agro-green">
                        <Image src="/placeholder.svg" alt="placeholder" width={48} height={48} className="object-cover" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-base">{selectedApplication.worker?.fullName || "Ứng viên"}</p>
                      <p className="text-muted-foreground">SĐT: {selectedApplication.worker?.phoneNumber || "Không có"}</p>
                      <p className="text-muted-foreground">Email: {selectedApplication.worker?.email || "Không có"}</p>
                      <p className="text-muted-foreground">Địa điểm: {selectedApplication.worker?.primaryLocation || "Không có"}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="bg-muted capitalize font-normal">{selectedApplication.worker?.gender || "Không rõ giới tính"}</Badge>
                        <Badge variant="outline" className="bg-muted font-normal">{selectedApplication.worker?.date_of_birth ? `Ngày sinh: ${formatDate(selectedApplication.worker.date_of_birth)}` : "Không rõ NS"}</Badge>
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
                    <p className="text-xs text-muted-foreground">Kinh nghiệm</p>
                    <p className="mt-2 font-medium">{selectedApplication.worker?.experienceLevel || "-"}</p>
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
                    <p className="text-xs text-muted-foreground">Ngày làm việc đề xuất</p>
                    {selectedApplication.workDates?.length ? (
                      <ul className="mt-2 grid gap-1">
                        {selectedApplication.workDates.map((workDate) => (
                          <li key={workDate} className="text-muted-foreground">- {formatDate(workDate)}</li>
                        ))}
                      </ul>
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
                <p className="text-sm text-muted-foreground">
                  Hồ sơ này đã được phản hồi{selectedApplication.respondedAt ? ` lúc ${formatDateTime(selectedApplication.respondedAt)}` : ""}.
                </p>
              )}
            </DialogFooter>
          ) : null}
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
                      <Avatar className="h-10 w-10 border shadow-sm">
                        <AvatarImage src={selectedJobDetail.worker?.avatarUrl || "/placeholder.svg"} className="object-cover" />
                        <AvatarFallback className="bg-agro-green/10 text-agro-green">
                          <Users className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
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
                  true && (
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
                          disabled={selectedJobDetail.statusId === JobStatus.Completed}
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
                          disabled={selectedJobDetail.statusId === JobStatus.Completed}
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
              Hủy
            </Button>
            <Button
              className="bg-agro-green hover:bg-agro-green/90 flex-1 sm:flex-none"
              onClick={handleApproveJobDetail}
              disabled={isApprovingDetail || !selectedJobDetail || selectedJobDetail.statusId === JobStatus.Completed}
            >
              {isApprovingDetail ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {selectedJobDetail?.statusId === JobStatus.Completed ? "Đã phê duyệt" : "Lưu & Phê duyệt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
