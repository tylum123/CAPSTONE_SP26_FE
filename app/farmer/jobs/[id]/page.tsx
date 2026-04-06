"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Banknote, CalendarDays, CheckCircle2, Clock, FileText, InfoIcon, MailIcon, MapPin, Play, RotateCw, Star, Users, XCircle } from "lucide-react"
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
import type { ApplicationDTO, Job, PaginatedResponse, RespondApplicationRequest } from "@/libs/types"
import { jobService } from "@/libs/api/services/jobs.service"
import { jobApplicationService } from "@/libs/api/services/jobApplication.service"

const APP_STATUS = {
  pending: ApplicationStatusId.Pending,
  accepted: ApplicationStatusId.Accepted,
  rejected: ApplicationStatusId.Rejected,
  cancelled: ApplicationStatusId.Cancelled,
} as const

const JOB_POST_STATUS = {
  Draft: 1,
  Published: 2,
  Closed: 3,
  InProgress: 4,
  Completed: 5,
  Cancelled: 6
} as const

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

  const normalizeStatus = (status?: string, startDate?: string) => {
    const normalized = (status ?? "").toLowerCase()

    if (startDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const jobStart = new Date(startDate)
      if (jobStart <= today) {
        return "passed"
      }
    }

    if (["open", "active", "published", "recruiting"].includes(normalized)) {
      return "active"
    }

    if (["filled", "full"].includes(normalized)) {
      return "filled"
    }

    if (["completed", "closed", "done"].includes(normalized)) {
      return "completed"
    }

    return "active"
  }

  const status = useMemo(() => normalizeStatus(job?.statusId.toString(), job?.startDate), [job?.statusId, job?.startDate])

  const jobStatusBadge = useMemo(() => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100/80 text-emerald-800 border-emerald-200 px-3 py-1 flex items-center gap-1.5 ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Đang tuyển
        </Badge>
      case "filled":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <Clock className="h-3.5 w-3.5" />
          Đã đủ người
        </Badge>
      case "completed":
        return <Badge variant="outline" className="px-3 py-1 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Hoàn thành
        </Badge>
      case "passed":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200 px-3 py-1 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <XCircle className="h-3.5 w-3.5" />
          Quá hạn
        </Badge>
      default:
        return null
    }
  }, [status])

  const loadApplications = async (currentJobId: string) => {
    try {
      setIsLoadingApplications(true)
      setApplicationsError(null)

      const response = await jobApplicationService.getJobApplicationsByPost({
        jobId: currentJobId,
        includeAll: true,
      })


      const payload = response.data as
        | PaginatedResponse<ApplicationDTO>
        | ApplicationDTO[]
        | { data?: ApplicationDTO[] }

      if (Array.isArray(payload)) {
        setApplications(payload)
      } else if (Array.isArray(payload?.data)) {
        setApplications(payload.data)
      } else {
        setApplications([])
      }
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

  const handleUpdateStatus = async (newStatus: number) => {
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

    void loadApplications(jobId)
  }, [jobId])

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


              {/* Only show "Hủy tin đăng" if not already cancelled or completed */}
              {job.statusId !== JOB_POST_STATUS.Cancelled && job.statusId !== JOB_POST_STATUS.Completed && job.statusId !== JOB_POST_STATUS.Closed && job.statusId === JOB_POST_STATUS.InProgress && (
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

              {job.statusId !== JOB_POST_STATUS.Cancelled && job.statusId !== JOB_POST_STATUS.Completed && job.statusId !== JOB_POST_STATUS.Closed && job.statusId === JOB_POST_STATUS.InProgress && (
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
              <Card className="lg:sticky lg:top-8 border-0 shadow-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Ứng viên ({applications.length})</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-agro-green hover:bg-agro-green/10 transition-all"
                        onClick={() => jobId && loadApplications(jobId)}
                        disabled={isLoadingApplications}
                      >
                        <RotateCw className={cn("h-4 w-4", isLoadingApplications && "animate-spin")} />
                      </Button>
                      <div className="p-1.5 rounded-full bg-agro-green/10 text-agro-green">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  <CardDescription>Danh sách hồ sơ ứng tuyển bài đăng này</CardDescription>
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
                        className="group relative flex flex-col gap-3 rounded-xl border border-muted bg-white/40 dark:bg-zinc-800/40 p-4 hover:border-agro-green/50 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all duration-300"
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

                        <div className="mt-1 flex items-center justify-between gap-2 border-t border-muted pt-3">
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
                  </div>
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
                    </div>
                  </div>
                </div>

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

                {selectedApplication.responseMessage ? (
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Phản hồi từ chủ trang trại</p>
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
    </div>
  )
}
