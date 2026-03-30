"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Users, Clock, Banknote, MapPin, Copy, Calendar, Inbox, LayoutGrid, LayoutList, Loader2, Filter, ChevronLeft, ChevronRight } from "lucide-react"
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
import { farmerService } from "@/libs/api/services/farmer.service"
import { jobCategoryService } from "@/libs/api/services/job-category.service"
import { skillService } from "@/libs/api/services/skill.service"
import { useProvinces } from "@/hooks/use-provinces"
import type { Application, Job, JobCategory, PaginatedResponse, Skill } from "@/libs/types"
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
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState("all-categories")
  const [filterAddress, setFilterAddress] = useState("all-provinces")
  const [filterSkills, setFilterSkills] = useState<string[]>([])
  const [skillPage, setSkillPage] = useState(1)
  const [skillTotalPages, setSkillTotalPages] = useState(1)
  const SKILLS_PER_PAGE = 6
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [isApplicationsDialogOpen, setIsApplicationsDialogOpen] = useState(false)
  const [selectedJobForApplications, setSelectedJobForApplications] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [applicationsError, setApplicationsError] = useState<string | null>(null)
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)
  const [jobPendingDelete, setJobPendingDelete] = useState<Job | null>(null)

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
    const loadJobs = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Use getFilteredJobs if any filter parameters exist, otherwise use getJobs
        const hasFilters = searchQuery || (filterCategory && filterCategory !== "all-categories") || (filterAddress && filterAddress !== "all-provinces") || filterSkills.length > 0

        let response
        if (hasFilters) {
          response = await farmerService.getFilteredJobs({
            title: searchQuery || undefined,
            category: (filterCategory && filterCategory !== "all-categories") ? filterCategory : undefined,
            address: (filterAddress && filterAddress !== "all-provinces") ? filterAddress : undefined,
            skill: filterSkills.length > 0 ? filterSkills : undefined,
          })
        } else {
          response = await farmerService.getJobs()
        }

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
  }, [searchQuery, filterCategory, filterAddress, filterSkills])

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

  const getApplicationStatusBadge = (status: Application["status"]) => {
    if (status === "approved") {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Đã duyệt</Badge>
    }

    if (status === "rejected") {
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
      const response = await farmerService.getJobApplicationsByPost({
        jobId: job.id,
        includeAll: true,
      })

      const payload = response.data as PaginatedResponse<Application> | Application[] | { data?: Application[] }

      if (Array.isArray(payload)) {
        setApplications(payload)
      } else if (Array.isArray(payload?.data)) {
        setApplications(payload.data)
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

  const handleDeleteJob = async (job: Job) => {
    try {
      setDeletingJobId(job.id)
      await farmerService.deleteJob(job.id)
      setJobs((currentJobs) => currentJobs.filter((currentJob) => currentJob.id !== job.id))
      setJobPendingDelete(null)
    } catch (deleteError) {
      console.error(deleteError)
      setError("Không thể xóa bài đăng. Vui lòng thử lại.")
    } finally {
      setDeletingJobId(null)
    }
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
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/farmer/create-job">
              <Plus className="mr-2 h-4 w-4" />
              Đăng tin mới
            </Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3 rounded-xl border shadow-sm">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tiêu đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
          {/* Status Select */}
          <div className="w-full sm:w-[160px] shrink-0">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="h-10 font-medium">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang tuyển</SelectItem>
                <SelectItem value="filled">Đã đủ</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Button */}
          <Button variant="outline" onClick={() => setIsFilterDialogOpen(true)} className="h-10 shrink-0">
            <Filter className="mr-2 h-4 w-4" /> Bộ lọc
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
              <Select value={filterAddress} onValueChange={setFilterAddress} disabled={provincesLoading}>
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
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link href={`/farmer/jobs/${job.id}`}>
                                <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                                Xem chi tiết
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link href={`/farmer/jobs/${job.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                                Chỉnh sửa
                              </Link>
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem className="cursor-pointer">
                              <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                              Đăng lại
                            </DropdownMenuItem> */}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive cursor-pointer"
                              onClick={() => setJobPendingDelete(job)}
                              disabled={deletingJobId === job.id}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deletingJobId === job.id ? "Đang xóa..." : "Xóa tin"}
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
                      <span className={`truncate ${viewMode === "grid" ? "" : "max-w-50 sm:max-w-xs"}`} title={job.address}>{job.address}</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium text-primary">
                      <Banknote className="h-4 w-4 shrink-0" />
                      <span className="truncate">{formatCurrency(job.wageAmount)}</span>
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
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href={`/farmer/jobs/${job.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                            Chỉnh sửa
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                          Đăng lại
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => setJobPendingDelete(job)}
                          disabled={deletingJobId === job.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deletingJobId === job.id ? "Đang xóa..." : "Xóa tin"}
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

      <AlertDialog
        open={Boolean(jobPendingDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingJobId) {
            setJobPendingDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài đăng?</AlertDialogTitle>
            <AlertDialogDescription>
              {jobPendingDelete
                ? `Bạn có chắc muốn xóa bài đăng "${jobPendingDelete.title}"? Hành động này không thể hoàn tác.`
                : "Bạn có chắc muốn xóa bài đăng này?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingJobId)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (jobPendingDelete) {
                  void handleDeleteJob(jobPendingDelete)
                }
              }}
              disabled={Boolean(deletingJobId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingJobId ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
