"use client"

import { useState } from "react"
import { Search, AlertTriangle, Clock, CheckCircle, MessageSquare, Eye, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export function AdminDisputes() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("pending")

  const disputes = [
    {
      id: 1,
      title: "Tranh chấp thanh toán",
      description: "Người lao động không nhận được thanh toán sau khi hoàn thành công việc",
      farmer: {
        name: "Nguyễn Văn A",
        avatar: "/farmer1.jpg",
        type: "farmer",
      },
      worker: {
        name: "Trần Minh Đức",
        avatar: "/worker1.jpg",
        type: "worker",
      },
      job: "Thu hoạch lúa mùa đông",
      amount: 250000,
      status: "pending",
      priority: "high",
      createdAt: "10/01/2026",
      messages: 5,
    },
    {
      id: 2,
      title: "Chất lượng công việc không đạt",
      description: "Nông dân phàn nàn về chất lượng công việc của người lao động",
      farmer: {
        name: "Lê Thị B",
        avatar: "/farmer2.jpg",
        type: "farmer",
      },
      worker: {
        name: "Phạm Văn C",
        avatar: "/worker2.jpg",
        type: "worker",
      },
      job: "Chăm sóc vườn cam",
      amount: 600000,
      status: "investigating",
      priority: "medium",
      createdAt: "09/01/2026",
      messages: 12,
    },
    {
      id: 3,
      title: "Vi phạm hợp đồng",
      description: "Người lao động không đến làm việc theo lịch đã cam kết",
      farmer: {
        name: "Hoàng Văn D",
        avatar: "/farmer3.jpg",
        type: "farmer",
      },
      worker: {
        name: "Nguyễn Thị E",
        avatar: "/worker3.jpg",
        type: "worker",
      },
      job: "Phun thuốc trừ sâu",
      amount: 350000,
      status: "pending",
      priority: "high",
      createdAt: "08/01/2026",
      messages: 3,
    },
    {
      id: 4,
      title: "Yêu cầu hoàn tiền",
      description: "Công việc bị hủy do thời tiết, nông dân yêu cầu hoàn tiền escrow",
      farmer: {
        name: "Trần Văn F",
        avatar: "/farmer4.jpg",
        type: "farmer",
      },
      worker: {
        name: "Lê Văn G",
        avatar: "/worker4.jpg",
        type: "worker",
      },
      job: "Làm đất trồng khoai",
      amount: 400000,
      status: "resolved",
      priority: "low",
      createdAt: "05/01/2026",
      messages: 8,
      resolution: "Đã hoàn tiền cho nông dân",
    },
  ]

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.worker.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && dispute.status === "pending") ||
      (activeTab === "investigating" && dispute.status === "investigating") ||
      (activeTab === "resolved" && dispute.status === "resolved")
    return matchesSearch && matchesTab
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-destructive text-destructive">
            <Clock className="mr-1 h-3 w-3" />
            Chờ xử lý
          </Badge>
        )
      case "investigating":
        return (
          <Badge variant="secondary">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Đang điều tra
          </Badge>
        )
      case "resolved":
        return (
          <Badge className="bg-agro-green/10 text-agro-green">
            <CheckCircle className="mr-1 h-3 w-3" />
            Đã giải quyết
          </Badge>
        )
      default:
        return null
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Cao</Badge>
      case "medium":
        return <Badge variant="secondary">Trung bình</Badge>
      case "low":
        return <Badge variant="outline">Thấp</Badge>
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quản lý khiếu nại</h1>
        <p className="text-muted-foreground">Xử lý các tranh chấp giữa nông dân và người lao động</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-agro-orange">5</p>
            <p className="text-sm text-muted-foreground">Chờ xử lý</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-agro-green-dark">3</p>
            <p className="text-sm text-muted-foreground">Đang điều tra</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-agro-green">127</p>
            <p className="text-sm text-muted-foreground">Đã giải quyết</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-card-foreground">2.3 ngày</p>
            <p className="text-sm text-muted-foreground">Thời gian xử lý TB</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm khiếu nại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="pending">Chờ xử lý</TabsTrigger>
            <TabsTrigger value="investigating">Đang điều tra</TabsTrigger>
            <TabsTrigger value="resolved">Đã giải quyết</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Disputes List */}
      <div className="flex flex-col gap-4">
        {filteredDisputes.map((dispute) => (
          <Card key={dispute.id}>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-card-foreground">{dispute.title}</h3>
                      {getStatusBadge(dispute.status)}
                      {getPriorityBadge(dispute.priority)}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{dispute.description}</p>
                    <p className="mt-2 text-sm">
                      <span className="text-muted-foreground">Công việc:</span>{" "}
                      <span className="font-medium">{dispute.job}</span>
                      <span className="text-muted-foreground"> • Giá trị:</span>{" "}
                      <span className="font-medium text-agro-green">{dispute.amount.toLocaleString()}đ</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Chi tiết
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{dispute.title}</DialogTitle>
                          <DialogDescription>Chi tiết khiếu nại và các bên liên quan</DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border border-border p-4">
                              <p className="mb-2 text-sm font-medium text-muted-foreground">Nông dân</p>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={dispute.farmer.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>{dispute.farmer.name[0]}</AvatarFallback>
                                </Avatar>
                                <p className="font-medium">{dispute.farmer.name}</p>
                              </div>
                            </div>
                            <div className="rounded-lg border border-border p-4">
                              <p className="mb-2 text-sm font-medium text-muted-foreground">Người lao động</p>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={dispute.worker.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>{dispute.worker.name[0]}</AvatarFallback>
                                </Avatar>
                                <p className="font-medium">{dispute.worker.name}</p>
                              </div>
                            </div>
                          </div>
                          <Separator />
                          <div>
                            <Label>Mô tả vấn đề</Label>
                            <p className="mt-2 text-sm text-muted-foreground">{dispute.description}</p>
                          </div>
                          {dispute.status !== "resolved" && (
                            <>
                              <Separator />
                              <div>
                                <Label>Quyết định xử lý</Label>
                                <Select>
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Chọn phương án xử lý" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="refund_farmer">Hoàn tiền cho nông dân</SelectItem>
                                    <SelectItem value="pay_worker">Thanh toán cho người lao động</SelectItem>
                                    <SelectItem value="split">Chia đều cho hai bên</SelectItem>
                                    <SelectItem value="investigate">Cần điều tra thêm</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Ghi chú xử lý</Label>
                                <Textarea placeholder="Nhập ghi chú về quyết định..." className="mt-2" />
                              </div>
                              <Button className="bg-agro-green text-white hover:bg-agro-green-dark">Xác nhận xử lý</Button>
                            </>
                          )}
                          {dispute.resolution && (
                            <div className="rounded-lg bg-agro-green/10 p-4">
                              <p className="text-sm font-medium text-agro-green">Đã giải quyết</p>
                              <p className="mt-1 text-sm text-muted-foreground">{dispute.resolution}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" className="bg-agro-green text-white hover:bg-agro-green-dark">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Liên hệ
                    </Button>
                  </div>
                </div>

                {/* Parties */}
                <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={dispute.farmer.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{dispute.farmer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{dispute.farmer.name}</p>
                      <p className="text-xs text-muted-foreground">Nông dân</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={dispute.worker.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{dispute.worker.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{dispute.worker.name}</p>
                      <p className="text-xs text-muted-foreground">Người lao động</p>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    {dispute.messages} tin nhắn
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tạo ngày: {dispute.createdAt}</span>
                  <span>ID: #{dispute.id.toString().padStart(6, "0")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
