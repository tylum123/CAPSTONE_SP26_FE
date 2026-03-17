"use client"

import {
  Users,
  Briefcase,
  Banknote,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Shield,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function AdminDashboard() {
  const stats = [
    {
      title: "Tổng người dùng",
      value: "15,234",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      description: "Farmers: 5,120 | Workers: 10,114",
    },
    {
      title: "Công việc đăng tải",
      value: "3,456",
      change: "+8.2%",
      trend: "up",
      icon: Briefcase,
      description: "Đang hoạt động: 1,234",
    },
    {
      title: "Tổng giao dịch",
      value: "2.5B",
      change: "+15.3%",
      trend: "up",
      icon: Banknote,
      description: "Tháng này: 450M",
    },
    {
      title: "Tỷ lệ hoàn thành",
      value: "94.5%",
      change: "-0.5%",
      trend: "down",
      icon: TrendingUp,
      description: "So với tháng trước",
    },
  ]

  const revenueData = [
    { month: "T7", revenue: 320, commission: 16 },
    { month: "T8", revenue: 380, commission: 19 },
    { month: "T9", revenue: 420, commission: 21 },
    { month: "T10", revenue: 390, commission: 19.5 },
    { month: "T11", revenue: 480, commission: 24 },
    { month: "T12", revenue: 520, commission: 26 },
    { month: "T1", revenue: 450, commission: 22.5 },
  ]

  const userGrowthData = [
    { month: "T7", farmers: 4200, workers: 8500 },
    { month: "T8", farmers: 4400, workers: 8900 },
    { month: "T9", farmers: 4600, workers: 9200 },
    { month: "T10", farmers: 4800, workers: 9600 },
    { month: "T11", farmers: 5000, workers: 9900 },
    { month: "T12", farmers: 5120, workers: 10114 },
  ]

  const recentDisputes = [
    {
      id: 1,
      title: "Tranh chấp thanh toán",
      parties: "Nguyễn Văn A vs Trần Minh Đức",
      status: "pending",
      priority: "high",
      date: "10/01/2026",
    },
    {
      id: 2,
      title: "Chất lượng công việc",
      parties: "Lê Thị B vs Phạm Văn C",
      status: "investigating",
      priority: "medium",
      date: "09/01/2026",
    },
    {
      id: 3,
      title: "Vi phạm hợp đồng",
      parties: "Hoàng Văn D vs Nguyễn Thị E",
      status: "pending",
      priority: "high",
      date: "08/01/2026",
    },
  ]

  const pendingVerifications = [
    {
      id: 1,
      name: "Trần Văn Farmer",
      type: "Farmer",
      documents: 3,
      submittedAt: "2 giờ trước",
      avatar: "/farmer1.jpg",
    },
    {
      id: 2,
      name: "Nguyễn Thị Worker",
      type: "Worker",
      documents: 2,
      submittedAt: "5 giờ trước",
      avatar: "/worker1.jpg",
    },
    {
      id: 3,
      name: "Lê Văn Nông",
      type: "Farmer",
      documents: 4,
      submittedAt: "1 ngày trước",
      avatar: "/farmer2.jpg",
    },
  ]

  const chartConfig = {
    revenue: {
      label: "Doanh thu (triệu)",
      color: "var(--chart-1)",
    },
    commission: {
      label: "Hoa hồng (triệu)",
      color: "var(--chart-2)",
    },
    farmers: {
      label: "Nông dân",
      color: "var(--chart-1)",
    },
    workers: {
      label: "Người lao động",
      color: "var(--chart-2)",
    },
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tổng quan hệ thống</h1>
        <p className="text-muted-foreground">Theo dõi hoạt động và số liệu của nền tảng AgroTemp</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <stat.icon className="h-6 w-6 text-agro-green" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${stat.trend === "up" ? "text-agro-green" : "text-agro-orange"}`}
                >
                  {stat.trend === "up" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu & Hoa hồng</CardTitle>
            <CardDescription>6 tháng gần nhất (đơn vị: triệu VNĐ)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" name="Doanh thu" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="commission" fill="var(--color-commission)" name="Hoa hồng" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tăng trưởng người dùng</CardTitle>
            <CardDescription>6 tháng gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="farmers"
                    stroke="var(--color-farmers)"
                    strokeWidth={2}
                    name="Nông dân"
                    dot={{ fill: "var(--color-farmers)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="workers"
                    stroke="var(--color-workers)"
                    strokeWidth={2}
                    name="Người lao động"
                    dot={{ fill: "var(--color-workers)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Disputes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-agro-orange" />
                Khiếu nại cần xử lý
              </CardTitle>
              <CardDescription>Các vụ tranh chấp đang chờ</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/disputes">Xem tất cả</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {recentDisputes.map((dispute) => (
                <div key={dispute.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-card-foreground">{dispute.title}</p>
                      <Badge variant={dispute.priority === "high" ? "destructive" : "secondary"}>
                        {dispute.priority === "high" ? "Cao" : "Trung bình"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{dispute.parties}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{dispute.date}</p>
                  </div>
                  <Badge variant={dispute.status === "pending" ? "outline" : "secondary"}>
                    {dispute.status === "pending" ? "Chờ xử lý" : "Đang điều tra"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Verifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-agro-green" />
                Chờ xác minh
              </CardTitle>
              <CardDescription>Người dùng đợi duyệt danh tính</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/verification">Xem tất cả</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {pendingVerifications.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-card-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.type} • {user.documents} tài liệu
                      </p>
                      <p className="text-xs text-muted-foreground">{user.submittedAt}</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-agro-green text-white hover:bg-agro-green-dark">Xem xét</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
