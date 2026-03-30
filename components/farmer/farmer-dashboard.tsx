"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users,
  Briefcase,
  Banknote,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { farmerService } from "@/libs/api/services/farmer.service"
import type { FarmerProfile } from "@/libs/types"

export function FarmerDashboard() {
  const [profile, setProfile] = useState<FarmerProfile | null>(null)

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

  const recentApplicants = [
    {
      id: 1,
      name: "Trần Minh Đức",
      avatar: "/worker1.jpg",
      job: "Thu hoạch lúa",
      appliedAt: "2 giờ trước",
      rating: 4.8,
      completedJobs: 24,
      status: "pending",
    },
    {
      id: 2,
      name: "Lê Thị Hoa",
      avatar: "/worker2.jpg",
      job: "Chăm sóc vườn cam",
      appliedAt: "5 giờ trước",
      rating: 4.5,
      completedJobs: 18,
      status: "pending",
    },
    {
      id: 3,
      name: "Phạm Văn Hùng",
      avatar: "/worker3.jpg",
      job: "Thu hoạch lúa",
      appliedAt: "1 ngày trước",
      rating: 4.9,
      completedJobs: 56,
      status: "approved",
    },
  ]

  const activeJobs = [
    {
      id: 1,
      title: "Thu hoạch lúa mùa đông",
      slots: 5,
      filled: 3,
      applicants: 8,
      wage: "250,000",
      status: "active",
      deadline: "15/01/2026",
    },
    {
      id: 2,
      title: "Chăm sóc vườn cam Vinh",
      slots: 3,
      filled: 1,
      applicants: 4,
      wage: "200,000",
      status: "active",
      deadline: "20/01/2026",
    },
    {
      id: 3,
      title: "Phun thuốc trừ sâu",
      slots: 4,
      filled: 4,
      applicants: 6,
      wage: "350,000",
      status: "filled",
      deadline: "12/01/2026",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Xin chào, {profile?.contactName || 'Nông dân'}
          </h1>
          <p className="text-muted-foreground">Đây là tổng quan hoạt động của nông trại hôm nay.</p>
        </div>
        <Button asChild>
          <Link href="/farmer/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            Đăng tin mới
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Applicants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ứng viên gần đây</CardTitle>
              <CardDescription>Những người ứng tuyển mới nhất</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/farmer/applicants">
                Xem tất cả
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {recentApplicants.map((applicant) => (
                <div
                  key={applicant.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={applicant.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{applicant.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-card-foreground">{applicant.name}</p>
                      <p className="text-sm text-muted-foreground">{applicant.job}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-accent text-accent" />
                          {applicant.rating}
                        </span>
                        <span>•</span>
                        <span>{applicant.completedJobs} việc</span>
                        <span>•</span>
                        <span>{applicant.appliedAt}</span>
                      </div>
                    </div>
                  </div>
                  {applicant.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <XCircle className="mr-1 h-4 w-4" />
                        Từ chối
                      </Button>
                      <Button size="sm">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Duyệt
                      </Button>
                    </div>
                  ) : (
                    <Badge className="bg-primary/10 text-primary">Đã duyệt</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tin tuyển dụng</CardTitle>
              <CardDescription>Các tin đang hoạt động</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/farmer/jobs">
                Xem tất cả
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {activeJobs.map((job) => (
                <div key={job.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-card-foreground">{job.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <Banknote className="mr-1 inline h-3.5 w-3.5" />
                        {job.wage}đ/ngày
                      </p>
                    </div>
                    <Badge variant={job.status === "filled" ? "secondary" : "default"}>
                      {job.status === "filled" ? "Đã đủ" : "Đang tuyển"}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Đã tuyển</span>
                      <span className="font-medium">
                        {job.filled}/{job.slots}
                      </span>
                    </div>
                    <Progress value={(job.filled / job.slots) * 100} className="h-2" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {job.applicants} ứng viên
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {job.deadline}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
