"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Phone,
  Search,
  Users,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { farmerService } from "@/libs/api/services/farmer.service"
import type {
  ApplicationDTO,
  ApplicationStatusId,
  Job,
  PaginatedResponse,
  RespondApplicationRequest,
} from "@/libs/types"

const APP_STATUS = {
  pending: 1,
  accepted: 2,
  rejected: 3,
  cancelled: 4,
} as const

export default function ApplicationsPage() {
  const searchParams = useSearchParams()
  const preselectedJobId = searchParams.get("jobId") ?? ""

  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>(preselectedJobId)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const [applications, setApplications] = useState<ApplicationDTO[]>([])
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDTO | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [responseMessage, setResponseMessage] = useState("")

  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatDateTime = (value?: string) => {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date)
  }

  const statusLabel = (statusId: number) => {
    if (statusId === APP_STATUS.pending) return "Chờ duyệt"
    if (statusId === APP_STATUS.accepted) return "Đã nhận"
    if (statusId === APP_STATUS.rejected) return "Đã từ chối"
    return "Đã hủy"
  }

  const statusBadge = (statusId: number) => {
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

  const loadJobs = async () => {
    try {
      setIsLoadingJobs(true)
      const response = await farmerService.getJobs()
      const payload = response.data as Job[] | { data?: Job[]; items?: Job[] }

      if (Array.isArray(payload)) {
        setJobs(payload)
      } else if (Array.isArray(payload?.data)) {
        setJobs(payload.data)
      } else if (Array.isArray(payload?.items)) {
        setJobs(payload.items)
      } else {
        setJobs([])
      }
    } catch (jobsError) {
      console.error(jobsError)
      setError("Không thể tải danh sách công việc.")
      setJobs([])
    } finally {
      setIsLoadingJobs(false)
    }
  }

  const loadApplicationsByJob = async (jobId: string) => {
    if (!jobId) {
      setApplications([])
      return
    }

    try {
      setIsLoadingApplications(true)
      setError(null)

      const response = await farmerService.getJobApplicationsByPost({
        jobId,
        includeAll: true,
        statusId: statusFilter === "all" ? undefined : Number(statusFilter),
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
    } catch (applicationsError) {
      console.error(applicationsError)
      setError("Không thể tải danh sách ứng tuyển cho công việc này.")
      setApplications([])
    } finally {
      setIsLoadingApplications(false)
    }
  }

  useEffect(() => {
    void loadJobs()
  }, [])

  useEffect(() => {
    if (preselectedJobId) {
      setSelectedJobId(preselectedJobId)
    }
  }, [preselectedJobId])

  useEffect(() => {
    if (!selectedJobId) {
      setApplications([])
      return
    }

    void loadApplicationsByJob(selectedJobId)
  }, [selectedJobId, statusFilter])

  const filteredApplications = useMemo(() => {
    if (!searchQuery.trim()) return applications

    const keyword = searchQuery.toLowerCase()
    return applications.filter((app) => {
      const name = app.worker?.fullName?.toLowerCase() ?? ""
      const phone = app.worker?.phoneNumber?.toLowerCase() ?? ""
      const coverLetter = app.coverLetter?.toLowerCase() ?? ""
      return name.includes(keyword) || phone.includes(keyword) || coverLetter.includes(keyword)
    })
  }, [applications, searchQuery])

  const openApplicationDetail = async (applicationId: string) => {
    try {
      const response = await farmerService.getApplicationDetail(applicationId)
      setSelectedApplication(response.data)
      setResponseMessage(response.data.responseMessage ?? "")
      setIsDetailOpen(true)
    } catch (detailError) {
      console.error(detailError)
      setError("Không thể tải chi tiết hồ sơ ứng tuyển.")
    }
  }

  const handleRespond = async (statusId: ApplicationStatusId) => {
    if (!selectedApplication) return

    try {
      setIsSubmittingResponse(true)

      const payload: RespondApplicationRequest = {
        statusId,
        respondedAt: new Date().toISOString(),
        responseMessage: responseMessage.trim() || undefined,
      }

      await farmerService.respondApplicant(selectedApplication.id, payload)

      setIsDetailOpen(false)
      setSelectedApplication(null)
      setResponseMessage("")
      await loadApplicationsByJob(selectedJobId)
    } catch (respondError) {
      console.error(respondError)
      setError("Không thể phản hồi hồ sơ. Vui lòng thử lại.")
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  const selectedJob = jobs.find((job) => job.id === selectedJobId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quản lý ứng tuyển</h1>
          <p className="text-muted-foreground">Xem chi tiết hồ sơ và phản hồi ứng viên theo từng bài đăng</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/farmer/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Về danh sách bài đăng
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-1">
            <Label>Công việc</Label>
            <Select value={selectedJobId || ""} onValueChange={setSelectedJobId} disabled={isLoadingJobs}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingJobs ? "Đang tải..." : "Chọn công việc"} />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-1">
            <Label>Trạng thái</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value={String(APP_STATUS.pending)}>Chờ duyệt</SelectItem>
                <SelectItem value={String(APP_STATUS.accepted)}>Đã nhận</SelectItem>
                <SelectItem value={String(APP_STATUS.rejected)}>Đã từ chối</SelectItem>
                <SelectItem value={String(APP_STATUS.cancelled)}>Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-1">
            <Label>Tìm ứng viên</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
                placeholder="Tên, SĐT hoặc cover letter..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {selectedJob ? (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Đang xem hồ sơ cho bài đăng</p>
              <p className="font-semibold">{selectedJob.title}</p>
            </div>
            <Badge variant="secondary">{filteredApplications.length} hồ sơ</Badge>
          </CardContent>
        </Card>
      ) : null}

      {isLoadingApplications ? (
        <Card>
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang tải hồ sơ ứng tuyển...</p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoadingApplications && selectedJobId && filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-2 text-center">
            <Users className="h-6 w-6 text-muted-foreground" />
            <p className="font-medium">Chưa có hồ sơ phù hợp</p>
            <p className="text-sm text-muted-foreground">Chưa có ứng viên cho bộ lọc hiện tại.</p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoadingApplications && filteredApplications.length > 0 ? (
        <div className="grid gap-4">
          {filteredApplications.map((application) => (
            <Card key={application.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{application.worker?.fullName || "Ứng viên"}</p>
                      {statusBadge(application.statusId)}
                    </div>

                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {application.worker?.phoneNumber || "-"}
                    </p>

                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {application.worker?.primaryLocation || application.locationName || "Không có vị trí"}
                    </p>

                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Nộp lúc: {formatDateTime(application.appliedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => void openApplicationDetail(application.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Xem chi tiết
                    </Button>
                    {application.statusId === APP_STATUS.pending ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-rose-200 text-rose-700 hover:bg-rose-50"
                          onClick={() => {
                            setSelectedApplication(application)
                            setResponseMessage("")
                            setIsDetailOpen(true)
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Từ chối
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            setSelectedApplication(application)
                            setResponseMessage("")
                            setIsDetailOpen(true)
                          }}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Duyệt
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết hồ sơ ứng tuyển</DialogTitle>
            <DialogDescription>
              {selectedApplication
                ? `${selectedApplication.worker?.fullName || "Ứng viên"} - ${statusLabel(selectedApplication.statusId)}`
                : "Thông tin hồ sơ"}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication ? (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Công việc</p>
                  <p className="font-medium">{selectedApplication.jobPost?.title || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ngày nộp</p>
                  <p className="font-medium">{formatDateTime(selectedApplication.appliedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kinh nghiệm</p>
                  <p className="font-medium">{selectedApplication.worker?.experienceLevel || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
                  <p className="font-medium">{selectedApplication.worker?.totalJobsCompleted ?? 0} việc</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Thư giới thiệu
                </Label>
                <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                  {selectedApplication.coverLetter || "Ứng viên không để lại thư giới thiệu."}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responseMessage">Phản hồi cho ứng viên</Label>
                <Textarea
                  id="responseMessage"
                  value={responseMessage}
                  onChange={(event) => setResponseMessage(event.target.value)}
                  placeholder="Gửi lời nhắn khi duyệt/từ chối ứng viên..."
                />
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)} disabled={isSubmittingResponse}>
              Đóng
            </Button>
            {selectedApplication?.statusId === APP_STATUS.pending ? (
              <>
                <Button
                  variant="outline"
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  disabled={isSubmittingResponse}
                  onClick={() => void handleRespond(APP_STATUS.rejected as ApplicationStatusId)}
                >
                  {isSubmittingResponse ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                  Từ chối
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={isSubmittingResponse}
                  onClick={() => void handleRespond(APP_STATUS.accepted as ApplicationStatusId)}
                >
                  {isSubmittingResponse ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Duyệt hồ sơ
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
