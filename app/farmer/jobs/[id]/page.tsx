"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Banknote, CalendarDays, CheckCircle2, Clock, FileText, InfoIcon, MailIcon, MapPin, Users, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
import { farmerService } from "@/libs/api/services/farmer.service"
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
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Đã nhận</Badge>
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

  const status = useMemo(() => normalizeStatus(job?.status, job?.startDate), [job?.status, job?.startDate])

  const jobStatusBadge = useMemo(() => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Đang tuyển</Badge>
      case "filled":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Đã đủ người</Badge>
      case "completed":
        return <Badge variant="outline">Hoàn thành</Badge>
      case "passed":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Quá hạn</Badge>
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

      console.log(response.data)

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
      console.log(response.data)
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/farmer/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Về danh sách bài đăng
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && job ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{job.title}</CardTitle>
                    <CardDescription className="flex items-start gap-2 text-sm">
                      <MapPin className="mt-0.5 h-4 w-4" />
                      <span>{job.address}</span>
                    </CardDescription>
                  </div>
                  {jobStatusBadge}
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="mb-1 text-xs text-muted-foreground">Mức lương</p>
                  <p className="font-semibold text-emerald-600">{formatCurrency(job.wageAmount)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-1 text-xs text-muted-foreground">Số lượng</p>
                  <p className="font-semibold">{job.workersAccepted}/{job.workersNeeded} người</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-1 text-xs text-muted-foreground">Thời gian</p>
                  <p className="font-semibold">{formatDate(job.startDate)} - {formatDate(job.endDate)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-1 text-xs text-muted-foreground">Loại công việc</p>
                  <p className="font-semibold">{jobTypeLabel}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Mô tả công việc
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">{job.description || "Không có mô tả."}</p>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">


              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Kỹ năng yêu cầu</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {job.jobSkillRequirements?.length ? (
                    job.jobSkillRequirements.map((skill) => (
                      <Badge key={skill.id} variant="secondary">{skill.name}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Không có kỹ năng cụ thể.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thông tin bổ sung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{job.startTime} - {job.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>Đăng ngày: {formatDate(job.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    <span>Mức lương: {formatCurrency(job.wageAmount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Cần tuyển: {job.workersNeeded} người</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4" />
                    Yêu cầu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {job.requirements?.length ? (
                    <ul className="grid gap-2">
                      {job.requirements.map((item, index) => (
                        <li key={`${item}-${index}`} className="text-sm text-muted-foreground">- {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Không có yêu cầu bổ sung.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">Quyền lợi</CardTitle>
                </CardHeader>
                <CardContent>
                  {job.privileges?.length ? (
                    <ul className="grid gap-2">
                      {job.privileges.map((item, index) => (
                        <li key={`${item}-${index}`} className="text-sm text-muted-foreground">- {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Không có quyền lợi bổ sung.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="text-base">Những ứng viên bài đăng</CardTitle>
                <CardDescription>Hiện có {applications.length} hồ sơ ứng tuyển</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingApplications ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-r-transparent" />
                  </div>
                ) : null}

                {!isLoadingApplications && applicationsError ? (
                  <p className="text-sm text-destructive">{applicationsError}</p>
                ) : null}

                {!isLoadingApplications && !applicationsError && applications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có ứng viên ứng tuyển vào bài đăng này.</p>
                ) : null}

                {!isLoadingApplications && !applicationsError && applications.length > 0 ? (
                  <ul className="grid gap-3">
                    {applications.map((application) => (
                      <li
                        key={application.id}
                        className="flex flex-col gap-2 rounded-lg border p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{application.worker?.fullName || "Ứng viên"}</p>
                            <p className="text-sm text-muted-foreground">
                              {application.worker?.phoneNumber || "Không có số điện thoại"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Ứng tuyển lúc: {formatDateTime(application.appliedAt)}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            {statusBadge(application.statusId)}
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => void openApplicationRespond(application.id)}
                                disabled={application.statusId !== APP_STATUS.pending}
                              >
                                <MailIcon className="h-4 w-4" />
                                <span className="sr-only">Phản hồi ứng viên</span>
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => void openApplicationDetail(application.id)}
                              >
                                <InfoIcon className="h-4 w-4" />
                                <span className="sr-only">Xem chi tiết</span>
                              </Button>

                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
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
                  <p className="font-semibold text-base">{selectedApplication.worker?.fullName || "Ứng viên"}</p>
                  <p className="text-muted-foreground">SĐT: {selectedApplication.worker?.phoneNumber || "Không có"}</p>
                  <p className="text-muted-foreground">Email: {selectedApplication.worker?.email || "Không có"}</p>
                  <p className="text-muted-foreground">Địa điểm: {selectedApplication.worker?.primaryLocation || "Không có"}</p>
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
    </div>
  )
}
