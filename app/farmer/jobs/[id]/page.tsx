"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Banknote, CalendarDays, CheckCircle2, Clock, FileText, MapPin, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { farmerService } from "@/libs/api/services/farmer.service"
import type { Job } from "@/libs/api/types"

export default function FarmerJobDetailPage() {
  const params = useParams<{ id: string }>()
  const jobId = Array.isArray(params?.id) ? params.id[0] : params?.id

  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const normalizeStatus = (status?: string) => {
    const normalized = (status ?? "").toLowerCase()

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

  const status = useMemo(() => normalizeStatus(job?.status), [job?.status])

  const statusBadge = useMemo(() => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Đang tuyển</Badge>
      case "filled":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Đã đủ người</Badge>
      case "completed":
        return <Badge variant="outline">Hoàn thành</Badge>
      default:
        return null
    }
  }, [status])

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
        const response = await farmerService.getJobDetail(jobId)
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

  const jobTypeLabel = job?.jobTypeId === 1 ? "Khoán" : job?.jobTypeId === 2 ? "Ngày" : "-"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" asChild>
          <Link href="/farmer/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Về danh sách bài đăng
          </Link>
        </Button>
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
        <div className="grid gap-6">
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
                {statusBadge}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
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

            <div className="space-y-6">
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
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4" />
                  Yeu cau
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

            <Card>
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
      ) : null}
    </div>
  )
}
