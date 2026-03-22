"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Briefcase, Users, DollarSign, Clock, ChevronRight, Star, Cloud, Droplets, Wind, X, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { farmerService } from "@/libs/api/services/farmer.service"
import type { FarmerProfile } from "@/libs/api/types"
import { useWeather } from "@/hooks/use-weather"
import Image from "next/image"

const stats = [
  { label: "Tin đang tuyển", value: "3", icon: Briefcase, color: "text-agro-green", bgColor: "bg-agro-green/10" },
  { label: "Đã thuê hôm nay", value: "5", icon: Users, color: "text-agro-orange", bgColor: "bg-agro-orange/10" },
  {
    label: "Chi phí tháng này",
    value: "4.2M",
    icon: DollarSign,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
]

const recentApplications = [
  {
    id: 1,
    workerName: "Trần Văn Bình",
    job: "Gặt lúa 2 ngày",
    rating: 4.8,
    distance: "0.8km",
    skills: ["Thu hoạch", "Máy gặt"],
    appliedAt: "5 phút trước",
  },
  {
    id: 2,
    workerName: "Lê Thị Cẩm",
    job: "Phun thuốc trừ sâu",
    rating: 4.5,
    distance: "1.2km",
    skills: ["Phun thuốc", "Bón phân"],
    appliedAt: "15 phút trước",
  },
  {
    id: 3,
    workerName: "Phạm Văn Dũng",
    job: "Gặt lúa 2 ngày",
    rating: 4.9,
    distance: "2.5km",
    skills: ["Thu hoạch", "Làm đất"],
    appliedAt: "30 phút trước",
  },
]

const scheduledDates = [
  new Date('2026-01-15'),
  new Date('2026-01-16'),
  new Date('2026-01-18'),
  new Date('2026-01-20'),
]

export default function FarmerDashboard() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [profile, setProfile] = useState<FarmerProfile | null>(null)
  const [weatherPopup, setWeatherPopup] = useState<{ date: Date; position: { x: number; y: number } } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const { currentWeather, loading: weatherLoading, refetch } = useWeather({
    city: 'Hanoi',
  })

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await farmerService.getProfile()
        setProfile(response.data)
      } catch (error) {
        console.error('Failed to fetch farmer profile:', error)
      }
    }

    fetchProfile()
  }, [])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Xin chào, {profile?.contactName || 'Loading...'}!
          </h1>
          <p className="text-muted-foreground">Đây là tổng quan hoạt động của nông trại.</p>
        </div>
        <Link href="/farmer/create-job">
          <Button className="bg-agro-green hover:bg-agro-green-dark text-white">+ Đăng tin tuyển dụng</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Ứng viên mới cần duyệt</CardTitle>
              <Link href="/farmer/applications">
                <Button variant="ghost" size="sm" className="text-agro-green">
                  Xem tất cả
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-agro-green/10 flex items-center justify-center">
                        <span className="text-agro-green font-semibold">{app.workerName.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{app.workerName}</p>
                          <div className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs">{app.rating}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {app.job} • {app.distance}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {app.skills.map((skill, i) => (
                            <Badge key={i} variant="secondary" className="text-xs py-0">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {app.appliedAt}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs h-7 bg-transparent">
                          Xem
                        </Button>
                        <Button size="sm" className="text-xs h-7 bg-agro-green hover:bg-agro-green-dark text-white">
                          Duyệt
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Widget */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Lịch mùa vụ & Thời tiết</CardTitle>
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

            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md w-full"
              modifiers={{
                scheduled: scheduledDates,
              }}
              modifiersStyles={{
                scheduled: {
                  backgroundColor: "oklch(0.55 0.15 145 / 0.2)",
                  color: "oklch(0.55 0.15 145)",
                  fontWeight: "bold",
                },
              }}
              components={{
                DayButton: ({ day, ...props }) => (
                  <button
                    {...props}
                    className={`${props.className} ${currentWeather ? 'cursor-pointer' : ''}`}
                    onClick={(e) => {
                      setDate(day.date);
                      if (currentWeather) {
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
                      }
                    }}
                  >
                    {day.date.getDate()}
                  </button>
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
                    <span>Click ngày bất kỳ để xem thời tiết</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weather Popup */}
      {weatherPopup && currentWeather && (
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
                    {currentWeather.description}
                  </p>
                </div>
                <Image
                  src={currentWeather.iconUrl}
                  alt={currentWeather.description}
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
                      {Math.round(currentWeather.tempMin)}° - {Math.round(currentWeather.tempMax)}°C
                    </p>
                    <p className="text-xs text-muted-foreground">Cảm giác như {Math.round(currentWeather.feelsLike)}°C</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-2 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-lg hover:scale-[1.02] transition-transform border border-blue-200 dark:border-blue-800">
                    <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg w-fit shadow-lg">
                      <Droplets className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Độ ẩm</p>
                      <p className="text-base font-bold">{currentWeather.humidity}%</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg hover:scale-[1.02] transition-transform border border-green-200 dark:border-green-800">
                    <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg w-fit shadow-lg">
                      <Wind className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Gió</p>
                      <p className="text-base font-bold">{currentWeather.windSpeed} m/s</p>
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
