"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Briefcase, Users, DollarSign, Clock, ChevronRight, Star } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

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

const scheduledDates = [new Date(2026, 0, 15), new Date(2026, 0, 16), new Date(2026, 0, 18), new Date(2026, 0, 20)]

export default function FarmerDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Xin chào, Nguyễn Văn An!</h1>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Lịch mùa vụ</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
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
            />
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground">
                <span className="inline-block w-3 h-3 rounded bg-agro-green/20 mr-2" />
                Ngày có thuê người làm
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
