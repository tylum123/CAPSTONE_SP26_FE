"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Users, Clock, Banknote, MapPin, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { farmerService } from "@/libs/api/services/farmer.service"
import type { Job } from "@/libs/api/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"

export function FarmerJobsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("active")
  const [jobs, setJobs] = useState<Job[]>([])
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

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await farmerService.getJobs()
        const payload = response.data as Job[] | { data?: Job[]; items?: Job[] }

        if (Array.isArray(payload)) {
          setJobs(payload)
          return
        }

        if (Array.isArray(payload?.data)) {
          setJobs(payload.data)
          return
        }

        if (Array.isArray(payload?.items)) {
          setJobs(payload.items)
          return
        }

        setJobs([])
      } catch (fetchError) {
        console.error(fetchError)
        setError("Không thể tải danh sách công việc. Vui lòng thử lại.")
        setJobs([])
      } finally {
        setIsLoading(false)
      }
    }

    void loadJobs()
  }, [])

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const matchesSearch = [job.title, job.address, job.description]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchQuery.toLowerCase()))

    const status = normalizeStatus(job.status)
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && status === "active") ||
      (activeTab === "filled" && status === "filled") ||
      (activeTab === "completed" && status === "completed")

    return matchesSearch && matchesTab
  }), [activeTab, jobs, searchQuery])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-primary/10 text-primary">Đang tuyển</Badge>
      case "filled":
        return <Badge variant="secondary">Đã đủ người</Badge>
      case "completed":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Hoàn thành
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tin tuyển dụng</h1>
          <p className="text-muted-foreground">Quản lý các tin tuyển dụng của bạn</p>
        </div>
        <Button asChild>
          <Link href="/farmer/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            Đăng tin mới
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tin tuyển dụng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="active">Đang tuyển</TabsTrigger>
            <TabsTrigger value="filled">Đã đủ</TabsTrigger>
            <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Jobs List */}
      <div className="flex flex-col gap-4">
        {isLoading ? <p className="text-sm text-muted-foreground">Đang tải danh sách công việc...</p> : null}
        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

        {!isLoading && !error && filteredJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có tin tuyển dụng nào.</p>
        ) : null}

        {filteredJobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-card-foreground">{job.title}</h3>
                    {getStatusBadge(normalizeStatus(job.status))}
                    <Badge variant="outline">{job.jobSkillRequirements?.[0]?.name ?? job.requiredSkills ?? "Công việc"}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{job.description}</p>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.address}
                    </span>
                    <span className="flex items-center gap-1">
                      <Banknote className="h-4 w-4" />
                      {formatCurrency(job.wageAmount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {job.estimatedHours} giờ
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {job.workersAccepted}/{job.workersNeeded} đã nhận
                    </span>
                  </div>

                  {normalizeStatus(job.status) !== "completed" && (
                    <div className="mt-4 max-w-xs">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tiến độ tuyển dụng</span>
                        <span className="font-medium">
                          {job.workersAccepted}/{job.workersNeeded}
                        </span>
                      </div>
                      <Progress
                        value={job.workersNeeded > 0 ? (job.workersAccepted / job.workersNeeded) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/farmer/jobs/${job.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Xem chi tiết
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Nhân bản
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa tin
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                <span>Đăng ngày: {formatDate(job.createdAt)}</span>
                <span>Hạn tuyển: {formatDate(job.endDate)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
