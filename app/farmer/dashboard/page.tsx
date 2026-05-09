"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Briefcase, Users, DollarSign, Clock, ChevronRight, ChevronLeft, Star, Cloud, Droplets, Wind, X, RefreshCw, ChevronDown, Plus, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { farmerService } from "@/libs/api/services/farmer.service"
import type { FarmerProfile, DashboardStats } from "@/libs/types"
import { useWeather } from "@/hooks/use-weather"
import Image from "next/image"
import { ActivityChart, JobStatusChart } from "@/components/farmer/dashboard-charts"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { jobApplicationService } from "@/libs/api/services/jobApplication.service"
import { ApplicationStatusId } from "@/libs/types"
import type { ApplicationDTO } from "@/libs/types"
import { JobPostStatus } from "@/libs/types"
import { formatDistanceToNow, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatCurrency } from "@/libs/utils/utils"
import { cn } from "@/libs/utils/utils"
import { WorkerProfilePreviewDialog } from "@/components/farmer/worker-profile-preview-dialog"

export default function FarmerDashboard() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [weatherPopup, setWeatherPopup] = useState<{ date: Date; position: { x: number; y: number } } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const [pendingApplications, setPendingApplications] = useState<ApplicationDTO[]>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [applicationsPage, setApplicationsPage] = useState(1)
  const [applicationsTotalPages, setApplicationsTotalPages] = useState(1)
  const { currentWeather, dailyForecast, loading: weatherLoading, error: weatherError, refetch } = useWeather({
    useCurrentUserAddress: true,
  })

  const getDateKey = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const popupForecast = useMemo(() => {
    if (!weatherPopup) return null
    return dailyForecast.get(getDateKey(weatherPopup.date)) || null
  }, [weatherPopup, dailyForecast])

  const weatherForecastDates = useMemo(() => {
    return Array.from(dailyForecast.values()).map((f) => f.date)
  }, [dailyForecast])

  const hasForecastForDate = useCallback((d: Date) => {
    return dailyForecast.has(getDateKey(d))
  }, [dailyForecast])

  useEffect(() => {
    setDate(new Date())
    setLastUpdated(new Date())
  }, [])

  const handleRefreshWeather = async () => {
    setIsRefreshing(true)
    await refetch()
    setLastUpdated(new Date())
    setIsRefreshing(false)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      handleRefreshWeather()
    }, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setWeatherPopup(null)
      }
    }

    if (weatherPopup) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [weatherPopup])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await farmerService.getDashboardStats()
      setDashboardData(response.data)
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      toast.error("Không thể tải dữ liệu tổng quan")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchPendingApplications = async (page: number = 1) => {
    try {
      setIsLoadingApplications(true)
      const response = await jobApplicationService.getJobApplicationsByFarmer({
        statusId: ApplicationStatusId.Pending,
        page: page,
        limit: 5
      })
      const pendingOnly = (response.data.data || []).filter(
        (application) => application.statusId === ApplicationStatusId.Pending
      )
      setPendingApplications(pendingOnly)
      setApplicationsTotalPages(response.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch pending applications:', error)
    } finally {
      setIsLoadingApplications(false)
    }
  }

  useEffect(() => {
    fetchPendingApplications(applicationsPage)
  }, [applicationsPage])

  const handleApproveApplication = async (applicationId: string, jobStatusId?: JobPostStatus) => {
    if (jobStatusId === JobPostStatus.Closed) {
      toast.error("Không thể duyệt hồ sơ vì bài đăng đã đóng")
      return
    }

    try {
      await jobApplicationService.approveApplicant(applicationId)
      toast.success("Hồ sơ đã được duyệt")
      await fetchPendingApplications()
      await fetchDashboardData() // Refresh counters
    } catch (error) {
      console.error('Failed to approve application:', error)
      toast.error("Không thể duyệt hồ sơ")
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    try {
      await jobApplicationService.rejectApplicant(applicationId)
      toast.info("Đã từ chối hồ sơ")
      await fetchPendingApplications()
      await fetchDashboardData() // Refresh counters
    } catch (error) {
      console.error('Failed to reject application:', error)
      toast.error("Không thể từ chối hồ sơ")
    }
  }

  const scheduledDates = useMemo(() => {
    if (!dashboardData?.schedulesDates) return []
    return dashboardData.schedulesDates.map(s => parseISO(s.scheduleDate))
  }, [dashboardData?.schedulesDates])

  const metrics = [
    {
      label: "Số dư khả dụng",
      value: formatCurrency(dashboardData?.wallet.availableBalance || 0),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      description: `Đang khóa: ${formatCurrency(dashboardData?.wallet.lockedBalance || 0)}`
    },
    {
      label: "Ứng tuyển mới",
      value: dashboardData?.counters.pendingApplications.toString() || "0",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Cần phản hồi gấp"
    },
    {
      label: "Báo cáo chờ duyệt",
      value: dashboardData?.counters.workReportsToApprove.toString() || "0",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "Đang chờ thanh toán"
    },
    {
      label: "Đang thuê",
      value: dashboardData?.counters.totalWorkersCurrentlyHired.toString() || "0",
      icon: Briefcase,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Nhân công đang làm việc"
    },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-sky-500/10 p-6 md:p-8 border border-emerald-100 dark:border-emerald-900/20 shadow-sm transition-all hover:shadow-md group">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl opacity-50 group-hover:bg-emerald-500/20 transition-all duration-500" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl opacity-50 group-hover:bg-teal-500/20 transition-all duration-500" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 border-2 border-agro-green/20 shadow-sm">
              <AvatarImage src={dashboardData?.profile.avatarUrl} className="object-cover" />
              <AvatarFallback className="bg-agro-green/10 text-agro-green text-xl font-bold">
                {dashboardData?.profile.contactName?.charAt(0) || "B"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-3">
                Chào ngày mới, <span className="text-agro-green">{dashboardData?.profile.contactName || 'Bạn'}</span>
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>{dashboardData?.profile.averageRating.toFixed(1) || "5.0"} Đánh giá</span>
                </div>
                <span>•</span>
                <span>{dashboardData?.profile.totalJobsPosted || 0} Bài đăng</span>
                <span>•</span>
                <span>{dashboardData?.profile.totalJobsCompleted || 0} Hoàn thành</span>
              </div>
            </div>
          </div>
          <Link href="/farmer/create-job">
            <Button size="lg" className="bg-agro-green hover:bg-agro-green-dark text-white rounded-full px-6 shadow-lg shadow-agro-green/20 hover:shadow-xl hover:shadow-agro-green/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
              <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              Đăng công việc mới
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <Card key={idx} className="shadow-sm border-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-2">
                <div className={`p-2.5 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{metric.label}</p>
                  <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic pl-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityChart data={dashboardData?.weeklyActivity || []} />
        <JobStatusChart data={dashboardData?.jobStatusDistribution || []} />
      </div>

      {/* Stats Cards */}


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <Collapsible defaultOpen className="space-y-2 group">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-2 px-2">
                <div className="p-1.5 rounded-full bg-agro-green/10 text-agro-green">
                  <Users className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold">
                  Ứng viên mới cần duyệt
                </h4>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full hover:bg-muted transition-transform duration-200 data-[state=open]:rotate-180">
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-2">
              <Card className="shadow-sm border-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Danh sách</CardTitle>
                  <Link href="/farmer/jobs">
                    <Button variant="ghost" size="sm" className="text-agro-green">
                      Xem tất cả
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoadingApplications ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-agro-green" />
                      </div>
                    ) : pendingApplications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-sm">Chưa có ứng viên mới nào cần duyệt.</p>
                      </div>
                    ) : (
                      pendingApplications.map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                            <WorkerProfilePreviewDialog
                              workerId={app.worker?.id}
                              workerUserId={app.worker?.userId}
                              workerName={app.worker?.fullName}
                            >
                              <Avatar className="h-10 w-10 border shrink-0">
                                <AvatarImage
                                  src={app.worker?.avatarUrl || "/placeholder.svg"}
                                  alt={app.worker?.fullName}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-agro-green/10 text-agro-green font-semibold">
                                  <Image src="/placeholder.svg" alt="placeholder" width={40} height={40} className="object-cover" />
                                </AvatarFallback>
                              </Avatar>
                            </WorkerProfilePreviewDialog>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{app.worker?.fullName || "Ẩn danh"}</p>
                                <div className="flex items-center gap-0.5">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  <span className="text-xs">{app.worker?.averageRating?.toFixed(1) || "5.0"}</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {app.jobPost?.title || "Công việc"} • {app.worker?.primaryLocation || "Lân cận"}
                              </p>
                              {app.worker?.experienceLevel && (
                                <div className="flex gap-1 mt-1">
                                  <Badge variant="secondary" className="text-[10px] py-0 px-1 font-normal">
                                    {app.worker.experienceLevel}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true, locale: vi })}
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/farmer/jobs/${app.jobPostId}`}>
                                <Button size="sm" variant="outline" className="text-xs h-7 bg-transparent px-2">
                                  Xem
                                </Button>
                              </Link>
                              {app.jobPost?.statusId !== JobPostStatus.Closed && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveApplication(app.id, app.jobPost?.statusId as JobPostStatus | undefined)}
                                  className="text-xs h-7 bg-agro-green hover:bg-agro-green-dark text-white px-2"
                                >
                                  Duyệt
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {(applicationsTotalPages > 1 || pendingApplications.length > 0) && (
                      <div className="flex items-center justify-between pt-4 border-t mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setApplicationsPage(prev => Math.max(1, prev - 1))}
                          disabled={applicationsPage === 1 || isLoadingApplications}
                          className="h-8 hover:bg-agro-green/5 transition-all"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Trước
                        </Button>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            {applicationsPage}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            / {applicationsTotalPages}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setApplicationsPage(prev => Math.min(applicationsTotalPages, prev + 1))}
                          disabled={applicationsPage === applicationsTotalPages || applicationsTotalPages === 0 || isLoadingApplications}
                          className="h-8 hover:bg-agro-green/5 transition-all"
                        >
                          Sau
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Calendar Widget */}
        <Collapsible defaultOpen className="space-y-2 group">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 px-2">
              <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-500">
                <Cloud className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-semibold">
                Lịch mùa vụ & Thời tiết
              </h4>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full hover:bg-muted transition-transform duration-200 data-[state=open]:rotate-180">
                <ChevronDown className="h-4 w-4" />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-2">
            <Card className="shadow-sm border-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Chi tiết</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshWeather}
                  disabled={isRefreshing}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent>
                {/* Current Weather */}
                {!weatherLoading && currentWeather && (
                  <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
                          {currentWeather.city}
                        </p>
                        <p className="text-3xl font-bold animate-in fade-in zoom-in-50 duration-500 delay-100">
                          {Math.round(currentWeather.temperature)}°C
                        </p>
                        <p className="text-xs text-muted-foreground capitalize animate-in fade-in slide-in-from-left-2 duration-300 delay-200">
                          {currentWeather.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {lastUpdated && `Cập nhật: ${lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-center animate-in fade-in slide-in-from-right-2 duration-500 delay-150">
                        <Image
                          src={currentWeather.iconUrl}
                          alt={currentWeather.description}
                          width={64}
                          height={64}
                          className="animate-bounce-slow"
                          unoptimized
                        />
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1 hover:scale-110 transition-transform">
                            <Droplets className="h-3 w-3" />
                            {currentWeather.humidity}%
                          </div>
                          <div className="flex items-center gap-1 hover:scale-110 transition-transform">
                            <Wind className="h-3 w-3" />
                            {currentWeather.windSpeed}m/s
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!weatherLoading && !currentWeather && weatherError && (
                  <div className="mb-4 p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive text-sm">
                    Không thể tải dữ liệu thời tiết. Vui lòng thử lại sau.
                  </div>
                )}

                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md w-full"
                  modifiers={{
                    scheduled: scheduledDates,
                    weatherAvailable: weatherForecastDates,
                  }}
                  modifiersStyles={{
                    scheduled: {
                      backgroundColor: "oklch(0.55 0.15 145 / 0.2)",
                      color: "oklch(0.55 0.15 145)",
                      fontWeight: "bold",
                      borderRadius: "0.375rem",
                    },
                    weatherAvailable: {
                      boxShadow: "inset 0 0 0 1px oklch(0.62 0.13 238 / 0.55)",
                      borderRadius: "0.375rem",
                      borderColor: "transparent",
                      backgroundColor: "oklch(0.7 0.1 239)",
                      fontWeight: "bold",
                      color: "oklch(1 0 239)",
                    },
                  }}
                  components={{
                    DayButton: ({ day, ...props }) => (
                      <CalendarDayButton
                        day={day}
                        {...props}
                        className={cn(
                          props.className,
                          hasForecastForDate(day.date) ? 'cursor-pointer' : 'cursor-default'
                        )}
                        onClick={(e) => {
                          setDate(day.date);
                          if (currentWeather && hasForecastForDate(day.date)) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const popupWidth = 320;
                            const popupHeight = 400;

                            let x = rect.right + 10;
                            if (x + popupWidth > window.innerWidth) {
                              x = rect.left - popupWidth - 10;
                            }

                            let y = rect.top;
                            if (y + popupHeight > window.innerHeight) {
                              y = window.innerHeight - popupHeight - 20;
                            }

                            setWeatherPopup({ date: day.date, position: { x, y } });
                          } else {
                            setWeatherPopup(null)
                            toast.info("Chỉ có dữ liệu dự báo cho những ngày được viền xanh")
                          }
                        }}
                      >
                        {day.date.getDate()}
                      </CalendarDayButton>
                    ),
                  }}
                />
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded bg-agro-green/20" />
                      <span>Ngày có thuê người làm</span>
                    </div>
                    {currentWeather && (
                      <div className="flex items-center gap-1.5">
                        <Cloud className="h-3 w-3 text-blue-500" />
                        <span>Click ngày màu xanh để xem dự báo</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Weather Popup */}
      {weatherPopup && currentWeather && popupForecast && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setWeatherPopup(null)}
          />
          <div
            ref={popupRef}
            className="fixed z-50 animate-in fade-in zoom-in-95 slide-in-from-left-5 duration-300"
            style={{
              left: `${weatherPopup.position.x}px`,
              top: `${weatherPopup.position.y}px`,
            }}
          >
            <div className="w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 relative">
              <button
                onClick={() => setWeatherPopup(null)}
                className="absolute top-2 right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-between mb-4 pr-6">
                <div>
                  <p className="text-base font-bold">
                    {weatherPopup.date.getDate()} tháng {weatherPopup.date.getMonth() + 1}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{currentWeather.city}, {currentWeather.country}</p>
                  <p className="text-sm text-muted-foreground capitalize mt-0.5">
                    {popupForecast.description}
                  </p>
                </div>
                <Image
                  src={popupForecast.iconUrl}
                  alt={popupForecast.description}
                  width={72}
                  height={72}
                  className="animate-bounce-slow"
                  unoptimized
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 rounded-lg hover:scale-[1.02] transition-transform border border-orange-200 dark:border-orange-800">
                  <div className="p-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg shadow-lg">
                    <span className="text-xl">🌡️</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium">Nhiệt độ</p>
                    <p className="text-lg font-bold">
                      {Math.round(popupForecast.tempMin)}° - {Math.round(popupForecast.tempMax)}°C
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nhiệt độ trung bình {Math.round(popupForecast.temp)}°C
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-2 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-lg hover:scale-[1.02] transition-transform border bg-blue-200 dark:bg-blue-800">
                    <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg w-fit shadow-lg">
                      <Droplets className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Độ ẩm</p>
                      <p className="text-base font-bold">{popupForecast.humidity}%</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg hover:scale-[1.02] transition-transform border border-green-200 dark:border-green-800">
                    <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg w-fit shadow-lg">
                      <Wind className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Gió</p>
                      <p className="text-base font-bold">{popupForecast.windSpeed} m/s</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
