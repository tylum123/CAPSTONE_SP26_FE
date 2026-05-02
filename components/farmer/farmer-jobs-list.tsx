"use client"

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Users, Clock, Banknote, MapPin, Copy, Calendar, Inbox, LayoutGrid, LayoutList, Loader2, Filter, ChevronLeft, ChevronRight, ArrowUpDown, ArrowDownUp, XCircle, RefreshCw, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { farmerService } from "@/libs/api/services/farmer.service"
import { jobCategoryService } from "@/libs/api/services/job-category.service"
import { skillService } from "@/libs/api/services/skill.service"
import { useProvinces } from "@/hooks/use-provinces"
import type { ApplicationDTO, Job, JobCategory, PaginatedResponse, Skill } from "@/libs/types"
import { ApplicationStatusId, JobPostStatus } from "@/libs/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { jobService } from "@/libs/api/services/jobs.service"
import { jobApplicationService } from "@/libs/api/services/jobApplication.service"

type JobFilterTab = "all" | "draft" | "active" | "filled" | "in-progress" | "completed" | "cancelled"

export function FarmerJobsList() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<JobFilterTab>("active")
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState("all-categories")
  const [filterAddress, setFilterAddress] = useState("all-provinces")
  const [jobTypeFilter, setJobTypeFilter] = useState<number | undefined>(undefined)
  const [filterSkills, setFilterSkills] = useState<string[]>([])
  const [skillPage, setSkillPage] = useState(1)
  const [skillTotalPages, setSkillTotalPages] = useState(1)
  const SKILLS_PER_PAGE = 6
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [isApplicationsDialogOpen, setIsApplicationsDialogOpen] = useState(false)
  const [selectedJobForApplications, setSelectedJobForApplications] = useState<Job | null>(null)
  const [applications, setApplications] = useState<ApplicationDTO[]>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [applicationsError, setApplicationsError] = useState<string | null>(null)
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null)
  const [jobPendingCancel, setJobPendingCancel] = useState<Job | null>(null)
  const [sortByDatesDescending, setSortByDatesDescending] = useState(true)
  const [updatingUrgencyJobId, setUpdatingUrgencyJobId] = useState<string | null>(null)
  const [jobsPage, setJobsPage] = useState(1)
  const [jobsPageSize] = useState(9)
  const [jobsTotalPages, setJobsTotalPages] = useState(1)
  const [jobsTotalCount, setJobsTotalCount] = useState(0)

  // For combo boxes
  const [categories, setCategories] = useState<JobCategory[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [skillsLoading, setSkillsLoading] = useState(false)

  // Use provinces hook for address filter
  const { provinces, loading: provincesLoading } = useProvinces()

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

  const normalizeStatus = (statusId?: JobPostStatus): "draft" | "active" | "filled" | "in-progress" | "completed" | "cancelled" => {
    switch (statusId) {
      case JobPostStatus.Draft:
        return "draft"
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
        return "draft"
    }
  }

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        const categoriesResponse = await jobCategoryService.getJobCategories()
        const categoriesPayload = categoriesResponse.data as JobCategory[] | { data?: JobCategory[] }
        if (Array.isArray(categoriesPayload)) {
          setCategories(categoriesPayload)
        } else if (Array.isArray(categoriesPayload?.data)) {
          setCategories(categoriesPayload.data)
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err)
      } finally {
        setCategoriesLoading(false)
      }
    }
    void fetchCategories()
  }, [])

  // Fetch skills when filterCategory or skillPage changes
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setSkillsLoading(true)
        let skillsResponse;

        const selectedCat = categories.find(c => c.name === filterCategory || c.id === filterCategory);

        if (selectedCat && selectedCat.id && filterCategory !== "all-categories") {
          skillsResponse = await skillService.getSkillsByCategory(selectedCat.id, { page: skillPage, limit: SKILLS_PER_PAGE })

          const skillsPayload = skillsResponse.data as Skill[] | { data?: Skill[], items?: Skill[], metadata?: any, pagination?: any }
          const totalPages = (skillsResponse.data && !Array.isArray(skillsResponse.data) && (skillsResponse.data as any).totalPages) ||
            (skillsResponse as any).metadata?.totalPages ||
            (skillsResponse as any).pagination?.totalPages ||
            (skillsResponse as any).totalPages ||
            (skillsResponse as any).meta?.totalPages ||
            1;

          setSkillTotalPages(totalPages)

          if (Array.isArray(skillsPayload)) {
            setSkills(skillsPayload)
          } else if (Array.isArray(skillsPayload?.items)) {
            setSkills(skillsPayload.items)
          } else if (Array.isArray(skillsPayload?.data)) {
            setSkills(skillsPayload.data)
          } else {
            setSkills([])
          }
        } else {
          // Frontend pagination if no category selected
          skillsResponse = await skillService.getSkills()
          const skillsPayload = skillsResponse.data as Skill[] | { data?: Skill[], items?: Skill[] }

          let allItems: Skill[] = [];
          if (Array.isArray(skillsPayload)) {
            allItems = skillsPayload
          } else if (Array.isArray(skillsPayload?.items)) {
            allItems = skillsPayload.items
          } else if (Array.isArray(skillsPayload?.data)) {
            allItems = skillsPayload.data
          }

          setSkillTotalPages(Math.ceil(allItems.length / SKILLS_PER_PAGE) || 1)
          const startIdx = (skillPage - 1) * SKILLS_PER_PAGE
          setSkills(allItems.slice(startIdx, startIdx + SKILLS_PER_PAGE))
        }
      } catch (err) {
        console.error("Failed to fetch skills:", err)
      } finally {
        setSkillsLoading(false)
      }
    }

    if (categories.length > 0 || filterCategory === "all-categories") {
      void fetchSkills()
    }
  }, [filterCategory, categories, skillPage])

  useEffect(() => {
    setJobsPage(1)
  }, [searchQuery, filterCategory, filterAddress, filterSkills, sortByDatesDescending])

  const loadJobs = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params: any = {
        title: searchQuery || undefined,
        category: (filterCategory && filterCategory !== "all-categories") ? filterCategory : undefined,
        address: (filterAddress && filterAddress !== "all-provinces") ? filterAddress : undefined,
        skill: filterSkills.length > 0 ? filterSkills : undefined,
        page: jobsPage,
        limit: jobsPageSize,
        sortByDatesDescending,
      }

      const mapTabToStatus = (tab: JobFilterTab) => {
        switch (tab) {
          case "draft":
            return JobPostStatus.Draft
          case "active":
            return JobPostStatus.Published
          case "filled":
            return JobPostStatus.Closed
          case "in-progress":
            return JobPostStatus.InProgress
          case "completed":
            return JobPostStatus.Completed
          case "cancelled":
            return JobPostStatus.Cancelled
          default:
            return undefined
        }
      }

      const jobPostStatus = mapTabToStatus(activeTab)
      if (jobPostStatus !== undefined) params.jobPostStatus = jobPostStatus
      if (jobTypeFilter !== undefined) params.jobType = jobTypeFilter

      const response = await jobService.getFilteredJobsByFarmer(params)

      const payload = response.data as PaginatedResponse<Job> | Job[] | { data?: Job[]; items?: Job[] }

      if (Array.isArray(payload)) {
        setJobs(payload)
        setJobsTotalPages(1)
        setJobsTotalCount(payload.length)
        return
      }

      if (Array.isArray(payload?.data)) {
        setJobs(payload.data)
        setJobsTotalPages(payload.pagination?.totalPages ?? 1)
        setJobsTotalCount(payload.pagination?.total ?? payload.data.length)
        return
      }

      if (Array.isArray(payload?.items)) {
        setJobs(payload.items)
        setJobsTotalPages(1)
        setJobsTotalCount(payload.items.length)
        return
      }

      setJobs([])
      setJobsTotalPages(1)
      setJobsTotalCount(0)
    } catch (fetchError) {
      console.error(fetchError)
      setError("Không thể tải danh sách công việc. Vui lòng thử lại.")
      setJobs([])
      setJobsTotalPages(1)
      setJobsTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, filterCategory, filterAddress, filterSkills, sortByDatesDescending, jobsPage, jobsPageSize, activeTab, jobTypeFilter])

  useEffect(() => {
    void loadJobs()
  }, [loadJobs])

  const filteredJobs = useMemo(() => {
    const filtered = jobs.filter((job) => {
      const matchesSearch = [job.title, job.address, job.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchQuery.toLowerCase()))

      const status = normalizeStatus(job.statusId)
      const matchesTab = activeTab === "all" || activeTab === status

      return matchesSearch && matchesTab
    })

    // Client-side sort fallback (for the non-filtered getMyJobPosts path)
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime() || 0
      const dateB = new Date(b.createdAt).getTime() || 0
      return sortByDatesDescending ? dateB - dateA : dateA - dateB
    })
  }, [activeTab, jobs, searchQuery, sortByDatesDescending])

  const getStatusBadge = (status: "draft" | "active" | "filled" | "in-progress" | "completed" | "cancelled") => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-300 border-slate-300">Bản nháp</Badge>
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200">Đang tuyển</Badge>
      case "filled":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200">Đã đủ người</Badge>
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200">Đang làm việc</Badge>
      case "completed":
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-400 border-slate-200 dark:border-slate-700">
            Hoàn thành
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 border-red-200">
            Đã hủy
          </Badge>
        )
      default:
        return null
    }
  }

  const getApplicationStatusBadge = (statusId: number) => {
    if (statusId === 2) { // Approved/Accepted
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Đã duyệt</Badge>
    }

    if (statusId === 3) { // Rejected
      return <Badge variant="destructive" className="bg-rose-100 text-rose-800 border-rose-200">Từ chối</Badge>
    }

    return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Chờ duyệt</Badge>
  }

  const openApplicationsDialog = async (job: Job) => {
    setSelectedJobForApplications(job)
    setIsApplicationsDialogOpen(true)
    setIsLoadingApplications(true)
    setApplicationsError(null)
    setApplications([])

    try {
      const response = await jobApplicationService.getJobApplicationsByPost(job.id, {
        includeAll: true,
      })

      const paginatedData = response.data
      if (Array.isArray(paginatedData.data)) {
        setApplications(paginatedData.data)
      } else {
        setApplications([])
      }
    } catch (dialogError) {
      console.error(dialogError)
      setApplicationsError("Không thể tải danh sách ứng viên cho tin đăng này.")
    } finally {
      setIsLoadingApplications(false)
    }
  }

  const handleCancelJob = async (job: Job) => {
    try {
      setCancellingJobId(job.id)
      await jobService.cancelJob(job.id)
      setJobPendingCancel(null)
      // Auto-reload to get the latest status from the server
      await loadJobs()
    } catch (cancelError) {
      console.error(cancelError)
      setError("Không thể hủy bài đăng. Vui lòng thử lại.")
    } finally {
      setCancellingJobId(null)
    }
  }

  const handleToggleUrgency = async (job: Job) => {
    try {
      setUpdatingUrgencyJobId(job.id)
      const response = await jobService.updateUrgency(job.id, !Boolean(job.isUrgent))
      console.log(response)
      await loadJobs()


    } catch (urgencyError) {
      console.error(urgencyError)
      setError("Không thể đánh dấu bài đăng là cần gấp. Vui lòng thử lại.")
    } finally {
      setUpdatingUrgencyJobId(null)
    }
  }

  const handleActiveTabChange = (value: string) => {
    setActiveTab(value as JobFilterTab)
    setJobsPage(1)
  }

  const handleCardClick = (event: MouseEvent<HTMLDivElement>, jobId: string) => {
    const target = event.target as HTMLElement
    const clickedInteractiveElement = target.closest(
      "a, button, input, textarea, select, [role='menuitem'], [data-radix-collection-item]"
    )

    if (clickedInteractiveElement) {
      return
    }

    router.push(`/farmer/jobs/${jobId}`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 p-5 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/20">
        <div className="pointer-events-none absolute -top-12 right-6 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-700/20" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tin tuyển dụng</h1>
            <p className="text-muted-foreground">Quản lý các tin tuyển dụng và theo dõi ứng viên theo từng bài đăng</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/farmer/create-job">
                <Plus className="mr-2 h-4 w-4" />
                Đăng tin mới
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3 rounded-xl border shadow-sm">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tiêu đề..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setJobsPage(1)
            }}
            className="pl-9 h-10 w-full"
          />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 pl-3 sm:w-auto overflow-x-auto">
          {/* Status Select */}
          <div className="w-full sm:w-45 shrink-0 -mr- -ml-2">
            <Select value={activeTab} onValueChange={handleActiveTabChange}>
              <SelectTrigger className="h-10 font-medium bg-white dark:bg-slate-900 border-slate-200">
                <div className="flex items-center gap-2">
                  <SelectValue placeholder="Trạng thái" />
                </div>
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Tất cả bài đăng</SelectItem>
                  {/* <SelectItem value="draft">Bản nháp</SelectItem> */}
                <SelectItem value="active">Đang tuyển</SelectItem>
                <SelectItem value="filled">Đã tuyển đủ</SelectItem>
                <SelectItem value="in-progress">Đang làm việc</SelectItem>
                <SelectItem value="completed">Đã xong</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Job Type Select */}
          <div className="w-full sm:w-45 -mr-15 shrink-0">
            <Select value={jobTypeFilter?.toString() ?? "all"} onValueChange={(val) => { setJobTypeFilter(val === "all" ? undefined : Number(val)); setJobsPage(1) }}>
              <SelectTrigger className="h-10 font-medium bg-white dark:bg-slate-900 border-slate-200">
                <div className="flex items-center gap-2">
                  <SelectValue placeholder="Loại công việc" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="1">Khoán</SelectItem>
                <SelectItem value="2">Ngày</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

          {/* Sort Button */}
          <Button
            variant="outline"
              onClick={() => {
                setSortByDatesDescending((prev) => !prev)
                setJobsPage(1)
              }}
            className="h-10 shrink-0 gap-2 font-medium bg-white dark:bg-slate-900 border-slate-200"
          >
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="hidden lg:inline">{sortByDatesDescending ? "Mới nhất" : "Cũ nhất"}</span>
          </Button>

          {/* Advanced Filter Button */}
          <Button variant="outline" onClick={() => setIsFilterDialogOpen(true)} className="h-10 shrink-0 font-medium bg-white dark:bg-slate-900 border-slate-200">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" /> Bộ lọc
          </Button>

          {/* View Toggles */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`h-8 w-8 rounded-md ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-500" : "text-slate-500"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={`h-8 w-8 rounded-md ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-500" : "text-slate-500"}`}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => void loadJobs()}
            disabled={isLoading}
            className="bg-white/70 dark:bg-slate-900/70 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Bộ lọc tìm kiếm</DialogTitle>
            <DialogDescription>
              Tùy chỉnh các tiêu chí để lọc danh sách công việc
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Danh mục công việc</Label>
              <Select
                value={filterCategory}
                onValueChange={(val) => {
                  setFilterCategory(val)
                  setFilterSkills([]) // Reset skills when category changes
                  setSkillPage(1) // Reset skill page when category changes
                  setJobsPage(1)
                }}
                disabled={categoriesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={categoriesLoading ? "Đang tải..." : "Chọn danh mục"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-categories">Tất cả danh mục</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name || category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Kỹ năng</Label>
                <div className="flex items-center gap-2">
                  {filterSkills.length > 0 && (
                    <Button variant="ghost" className="h-auto p-0 text-xs text-muted-foreground mr-2" onClick={() => setFilterSkills([])}>
                      Xóa chọn ({filterSkills.length})
                    </Button>
                  )}
                  {skillTotalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setSkillPage((p) => Math.max(1, p - 1))}
                        disabled={skillPage === 1 || skillsLoading}
                      >
                        <ChevronLeft className="h-3 w-3" />
                        <span className="sr-only">Trang trước</span>
                      </Button>
                      <span className="text-xs font-medium min-w-[3ch] text-center">
                        {skillPage}/{skillTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setSkillPage((p) => Math.min(skillTotalPages, p + 1))}
                        disabled={skillPage === skillTotalPages || skillsLoading}
                      >
                        <ChevronRight className="h-3 w-3" />
                        <span className="sr-only">Trang sau</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {skillsLoading ? (
                <div className="flex items-center justify-center py-8 min-h-[140px]">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : skills.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 border rounded-md px-3 bg-slate-50 text-center min-h-[140px] flex items-center justify-center">Không có kỹ năng nào.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3 min-h-[140px] content-start p-1">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-start space-x-2 border rounded-md p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <Checkbox
                        id={`filter-skill-${skill.id}`}
                        checked={filterSkills.includes(skill.name || skill.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilterSkills([...filterSkills, skill.name || skill.id])
                          } else {
                            setFilterSkills(filterSkills.filter(s => s !== (skill.name || skill.id)))
                          }
                          setJobsPage(1)
                        }}
                        className="mt-0.5"
                      />
                      <Label htmlFor={`filter-skill-${skill.id}`} className="text-xs font-medium cursor-pointer flex-1 line-clamp-2 leading-relaxed h-full grid items-center">
                        {skill.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Khu vực</Label>
              <Select value={filterAddress} onValueChange={(value) => { setFilterAddress(value); setJobsPage(1) }} disabled={provincesLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={provincesLoading ? "Đang tải..." : "Chọn khu vực"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-provinces">Tất cả khu vực</SelectItem>
                  {provinces.map((province) => (
                    <SelectItem key={province.code} value={province.name}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Loại công việc</Label>
              <Select value={jobTypeFilter?.toString() ?? "all"} onValueChange={(value) => { setJobTypeFilter(value === "all" ? undefined : Number(value)); setJobsPage(1) }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="1">Khoán</SelectItem>
                  <SelectItem value="2">Ngày</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsFilterDialogOpen(false)}>Hoàn tất</Button>
          </div>
        </DialogContent>
      </Dialog>

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
          <Card key={job.id} className="overflow-hidden hover:shadow-md transition-all duration-200 border-slate-200 dark:border-slate-800 flex flex-col h-full cursor-pointer" onClick={(event) => handleCardClick(event, job.id)}>
            <CardContent className="p-0 flex flex-col h-full">
              <div className={`flex flex-col gap-5 p-6 flex-1 ${viewMode === "grid" ? "" : "lg:flex-row lg:items-start lg:justify-between"}`}>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-start gap-3 justify-between">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                      <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-1" title={job.title}>{job.title}</h3>
                      {getStatusBadge(normalizeStatus(job.statusId))}
                      {job.isUrgent && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-400 gap-1">
                          <Zap className="h-3 w-3" />
                          Gấp
                        </Badge>
                      )}
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
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link href={`/farmer/jobs/${job.id}`}>
                                <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                                Xem chi tiết
                              </Link>
                            </DropdownMenuItem>
                            {Number(job.statusId) === JobPostStatus.Published && (
                              <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href={`/farmer/jobs/${job.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                                  Chỉnh sửa
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {Number(job.statusId) === JobPostStatus.Published && (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => void handleToggleUrgency(job)}
                                disabled={updatingUrgencyJobId === job.id}
                              >
                                <Zap className={`mr-2 h-4 w-4 ${job.isUrgent ? "text-orange-500" : "text-muted-foreground"}`} />
                                {updatingUrgencyJobId === job.id
                                  ? "Đang cập nhật..."
                                  : job.isUrgent
                                    ? "Bỏ đánh dấu gấp"
                                    : "Đánh dấu gấp"}
                              </DropdownMenuItem>
                            )}
                            {Number(job.statusId) === JobPostStatus.Published && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive cursor-pointer"
                                  onClick={() => setJobPendingCancel(job)}
                                  disabled={cancellingJobId === job.id}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  {cancellingJobId === job.id ? "Đang hủy..." : "Hủy tin đăng"}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {job.jobSkillRequirements?.[0]?.name ?? job.requiredSkills ?? "Nông nghiệp"}
                    </Badge>
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {job.jobTypeId === 1 ? "Khoán" : job.jobTypeId === 2 ? "Ngày" : "Khác"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed max-w-4xl">{job.description || "Không có mô tả chi tiết."}</p>

                  <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-2 text-sm" : "flex flex-wrap items-center gap-x-6 gap-y-3 text-sm"}>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 min-w-0">
                      <MapPin className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span className={`truncate ${viewMode === "grid" ? "" : "max-w-xs lg:max-w-xl"}`} title={job.address}>{job.address}</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium text-primary shrink-0">
                      <Banknote className="h-4 w-4 shrink-0" />
                      <span className="truncate">{formatCurrency(job.wageAmount)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 shrink-0">
                      <Users className="h-4 w-4 shrink-0 text-amber-500" />
                      <span className="truncate">{job.workersAccepted}/{job.workersNeeded} người</span>
                    </div>
                  </div>

                  {normalizeStatus(job.statusId) !== "completed" && (
                    <div className={`bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 mt-2 w-full ${viewMode === "grid" ? "max-w-md" : "max-w-xl"}`}>
                      <div className="mb-2 flex items-center justify-between text-xs font-medium">
                        <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Tiến độ tuyển dụng</span>
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
                    <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
                      <Link href={`/farmer/jobs/${job.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Chi tiết
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href={`/farmer/jobs/${job.id}`}>
                            <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>
                        {Number(job.statusId) === JobPostStatus.Published && (
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/farmer/jobs/${job.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                              Chỉnh sửa
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="cursor-pointer">
                          <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                          Đăng lại
                        </DropdownMenuItem>
                        {Number(job.statusId) === JobPostStatus.Published && (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => void handleToggleUrgency(job)}
                            disabled={updatingUrgencyJobId === job.id}
                          >
                            <Zap className={`mr-2 h-4 w-4 ${job.isUrgent ? "text-orange-500" : "text-muted-foreground"}`} />
                            {updatingUrgencyJobId === job.id
                              ? "Đang cập nhật..."
                              : job.isUrgent
                                ? "Bỏ đánh dấu gấp"
                                : "Đánh dấu gấp"}
                          </DropdownMenuItem>
                        )}
                        {Number(job.statusId) === JobPostStatus.Published && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive cursor-pointer"
                              onClick={() => setJobPendingCancel(job)}
                              disabled={cancellingJobId === job.id}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              {cancellingJobId === job.id ? "Đang hủy..." : "Hủy tin đăng"}
                            </DropdownMenuItem>
                          </>
                        )}
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

      <AlertDialog
        open={Boolean(jobPendingCancel)}
        onOpenChange={(open) => {
          if (!open && !cancellingJobId) {
            setJobPendingCancel(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy bài đăng?</AlertDialogTitle>
            <AlertDialogDescription>
              {jobPendingCancel
                ? `Bạn có chắc muốn hủy bài đăng "${jobPendingCancel.title}"? Hành động này không thể hoàn tác.`
                : "Bạn có chắc muốn hủy bài đăng này?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(cancellingJobId)}>Không</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (jobPendingCancel) {
                  void handleCancelJob(jobPendingCancel)
                }
              }}
              disabled={Boolean(cancellingJobId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancellingJobId ? "Đang hủy..." : "Xác nhận hủy"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isApplicationsDialogOpen} onOpenChange={setIsApplicationsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Danh sách ứng viên</DialogTitle>
            <DialogDescription>
              {selectedJobForApplications ? `Ứng viên cho: ${selectedJobForApplications.title}` : "Danh sách ứng viên"}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-2 py-2">
            {isLoadingApplications ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-agro-green mb-2" />
                <p className="text-sm text-muted-foreground">Đang tải ứng viên...</p>
              </div>
            ) : applicationsError ? (
              <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-center border border-destructive/20">
                {applicationsError}
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed">
                <Inbox className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Chưa có ứng viên nào ứng tuyển.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm transition-all">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border shadow-xs">
                        <AvatarImage src={app.worker?.avatarUrl || "/placeholder.svg"} className="object-cover" />
                        <AvatarFallback className="bg-agro-green/10 text-agro-green">
                          {app.worker?.fullName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>

                      {jobsTotalPages > 1 && (
                        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm sm:flex-row sm:justify-between">
                          <p className="text-sm text-muted-foreground">
                            Hiển thị trang {jobsPage} trên {jobsTotalPages} với {jobsTotalCount} tin đăng
                          </p>
                          <Pagination className="mx-0 w-auto">
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  href="#"
                                  onClick={(event) => {
                                    event.preventDefault()
                                    setJobsPage((prev) => Math.max(1, prev - 1))
                                  }}
                                  className={jobsPage === 1 ? "pointer-events-none opacity-50" : undefined}
                                />
                              </PaginationItem>
                              <PaginationItem>
                                <div className="flex h-9 items-center rounded-md border px-3 text-sm font-medium">
                                  {jobsPage} / {jobsTotalPages}
                                </div>
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationNext
                                  href="#"
                                  onClick={(event) => {
                                    event.preventDefault()
                                    setJobsPage((prev) => Math.min(jobsTotalPages, prev + 1))
                                  }}
                                  className={jobsPage === jobsTotalPages ? "pointer-events-none opacity-50" : undefined}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                        <p className="font-semibold text-sm">{app.worker?.fullName || "Ứng viên"}</p>
                        <p className="text-xs text-muted-foreground">{app.worker?.phoneNumber || "Không có SĐT"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getApplicationStatusBadge(app.statusId)}
                      <Button variant="ghost" size="sm" asChild className="text-agro-green hover:text-agro-green hover:bg-agro-green/10">
                        <Link href={`/farmer/applications?jobId=${selectedJobForApplications?.id}`}>
                          Xem chi tiết
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
