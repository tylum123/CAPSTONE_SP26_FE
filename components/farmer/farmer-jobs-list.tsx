"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Users, Clock, Banknote, MapPin, Copy, Calendar, Inbox, LayoutGrid, LayoutList, CalendarDays, CheckCircle2, FileText, Briefcase } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export function FarmerJobsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("active")
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [viewingJob, setViewingJob] = useState<Job | null>(null)
  const [isViewingJob, setIsViewingJob] = useState(false)
  const [isJobLoading, setIsJobLoading] = useState(false)

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

  const handleViewJob = async (jobId: string) => {
    setIsViewingJob(true)
    setIsJobLoading(true)
    setViewingJob(null)
    try {
      const response = await farmerService.getJobDetail(jobId)
      setViewingJob(response.data)
    } catch (err) {
      console.error("Failed to fetch job detail:", err)
      // If full detail fetch fails, we can fallback to the list item briefly
      const fallbackJob = jobs.find((j) => j.id === jobId)
      if (fallbackJob) setViewingJob(fallbackJob)
    } finally {
      setIsJobLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200">Đang tuyển</Badge>
      case "filled":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200">Đã đủ người</Badge>
      case "completed":
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-400 border-slate-200 dark:border-slate-700">
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tiêu đề, khu vực..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-background"
          />
        </div>
        <div className="flex items-center justify-between gap-4 w-full lg:w-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-x-auto lg:w-auto flex-1">
            <TabsList className="h-10 p-1 w-full justify-start lg:w-auto">
              <TabsTrigger value="all" className="rounded-md px-4">Tất cả</TabsTrigger>
              <TabsTrigger value="active" className="rounded-md px-4">Đang tuyển</TabsTrigger>
              <TabsTrigger value="filled" className="rounded-md px-4">Đã đủ</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-md px-4">Hoàn thành</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
           
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`h-8 w-8 rounded-md ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-muted-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>

             <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={`h-8 w-8 rounded-md ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-muted-foreground"}`}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
        {isLoading ? (
          <div className={`flex flex-col items-center justify-center p-12 text-muted-foreground border rounded-xl border-dashed bg-slate-50/50 dark:bg-slate-900/50 ${viewMode === "grid" ? "col-span-full" : ""}`}>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent mb-4"></div>
            <p>Đang tải danh sách công việc...</p>
          </div>
        ) : null}
        
        {error ? (
          <div className={`p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-center ${viewMode === "grid" ? "col-span-full" : ""}`}>
            <p className="font-medium">{error}</p>
          </div>
        ) : null}

        {!isLoading && !error && filteredJobs.length === 0 ? (
          <div className={`flex flex-col items-center justify-center p-16 text-center border rounded-xl border-dashed bg-slate-50/50 dark:bg-slate-900/50 ${viewMode === "grid" ? "col-span-full" : ""}`}>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
              <Inbox className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Chưa có tin nào</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Không tìm thấy tin tuyển dụng nào phù hợp. Hãy tạo tin đăng mới để tuyển người làm.</p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/farmer/jobs/new">Đăng tin ngay</Link>
            </Button>
          </div>
        ) : null}

        {filteredJobs.map((job) => (
          <Card key={job.id} className="overflow-hidden hover:shadow-md transition-all duration-200 border-slate-200 dark:border-slate-800 flex flex-col h-full">
            <CardContent className="p-0 flex flex-col h-full">
              <div className={`flex flex-col gap-5 p-6 flex-1 ${viewMode === "grid" ? "" : "lg:flex-row lg:items-start lg:justify-between"}`}>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-start gap-3 justify-between">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                      <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-1" title={job.title}>{job.title}</h3>
                      {getStatusBadge(normalizeStatus(job.status))}
                    </div>
                    {viewMode === "grid" && (
                      <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-900 rounded-md p-1 border">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewJob(job.id)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                              Đăng lại
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa tin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  
                  <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800">{job.jobSkillRequirements?.[0]?.name ?? job.requiredSkills ?? "Nông nghiệp"}</Badge>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed max-w-4xl">{job.description || "Không có mô tả chi tiết."}</p>

                  <div className={`grid gap-y-3 text-sm ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2" : "flex flex-wrap gap-x-6"}`}>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <MapPin className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span className={`truncate ${viewMode === "grid" ? "" : "max-w-[200px] sm:max-w-xs"}`} title={job.address}>{job.address}</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium text-primary">
                      <Banknote className="h-4 w-4 shrink-0" />
                      <span className="truncate">{formatCurrency(job.wageAmount)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Clock className="h-4 w-4 shrink-0 text-blue-500" />
                      <span className="truncate">{job.estimatedHours} giờ</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Users className="h-4 w-4 shrink-0 text-amber-500" />
                      <span className="truncate">{job.workersAccepted}/{job.workersNeeded} người</span>
                    </div>
                  </div>

                  {normalizeStatus(job.status) !== "completed" && (
                    <div className={`max-w-md bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 mt-2 ${viewMode === "grid" ? "w-full" : ""}`}>
                      <div className="mb-2 flex items-center justify-between text-xs font-medium">
                        <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Tiến độ</span>
                        <span className="text-primary">
                          {Math.round(job.workersNeeded > 0 ? (job.workersAccepted / job.workersNeeded) * 100 : 0)}%
                        </span>
                      </div>
                      <Progress
                        value={job.workersNeeded > 0 ? (job.workersAccepted / job.workersNeeded) * 100 : 0}
                        className="h-2 bg-slate-200 dark:bg-slate-800"
                      />
                    </div>
                  )}
                </div>

                {viewMode === "list" && (
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 mt-4 lg:mt-0 lg:pl-4 border-slate-100 dark:border-slate-800">
                    <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => handleViewJob(job.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Chi tiết
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleViewJob(job.id)} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                          Đăng lại
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa tin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 px-6 py-3 text-xs text-muted-foreground gap-2">
                <span className="flex items-center gap-1.5 min-w-0">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Đăng: <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(job.createdAt)}</span></span>
                </span>
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate">Hạn: <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(job.endDate)}</span></span>
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isViewingJob} onOpenChange={setIsViewingJob}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết công việc</DialogTitle>
            <DialogDescription>
              Xem thông tin chi tiết về công việc đã đăng.
            </DialogDescription>
          </DialogHeader>

          {isJobLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : viewingJob ? (
            <div className="grid gap-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{viewingJob.title}</h2>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{viewingJob.address}</span>
                    </div>
                  </div>
                  {getStatusBadge(normalizeStatus(viewingJob.status))}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Mức lương</p>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(viewingJob.salary)} / {viewingJob.salaryType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Số lượng</p>
                      <p className="font-semibold text-foreground">
                        {viewingJob.employeeCount} người
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Thời gian</p>
                      <p className="font-semibold text-foreground truncate" title={`${formatDate(viewingJob.startDate)} - ${formatDate(viewingJob.endDate)}`}>
                        {formatDate(viewingJob.startDate)} - {formatDate(viewingJob.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Loại công việc</p>
                      <p className="font-semibold text-foreground capitalize">
                        {viewingJob.jobType}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 pt-4">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Mô tả công việc
                      </h3>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground border rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30">
                        <p className="whitespace-pre-wrap">{viewingJob.description}</p>
                      </div>
                    </div>

                    {(viewingJob.requirements && viewingJob.requirements.length > 0) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          Yêu cầu
                        </h3>
                        <div className="border rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30">
                          <ul className="grid gap-2">
                            {viewingJob.requirements.map((req, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {(viewingJob.skills && viewingJob.skills.length > 0) && (
                      <div>
                        <h3 className="text-base font-semibold mb-3">Kỹ năng chuyên môn</h3>
                        <div className="flex flex-wrap gap-2">
                          {viewingJob.skills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(viewingJob.materials && viewingJob.materials.length > 0) && (
                      <div>
                        <h3 className="text-base font-semibold mb-3">Công cụ / Vật tư</h3>
                        <div className="flex flex-wrap gap-2">
                          {viewingJob.materials.map((item, idx) => (
                            <Badge key={idx} variant="outline" className="border-slate-300 dark:border-slate-700">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              Không tìm thấy thông tin công việc.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
