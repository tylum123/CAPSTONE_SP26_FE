"use client"

import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Star, MapPin, Phone, Eye, Check, X, Briefcase } from "lucide-react"

const applications = [
  {
    id: 1,
    workerName: "Trần Văn Bình",
    job: "Gặt lúa 2 ngày",
    rating: 4.8,
    totalJobs: 32,
    distance: "0.8km",
    skills: ["Thu hoạch", "Máy gặt", "Làm đất"],
    phone: "0912 345 678",
    status: "pending",
    appliedAt: "14/01/2026 08:30",
  },
  {
    id: 2,
    workerName: "Lê Thị Cẩm",
    job: "Phun thuốc trừ sâu",
    rating: 4.5,
    totalJobs: 18,
    distance: "1.2km",
    skills: ["Phun thuốc", "Bón phân"],
    phone: "0923 456 789",
    status: "pending",
    appliedAt: "14/01/2026 08:15",
  },
  {
    id: 3,
    workerName: "Phạm Văn Dũng",
    job: "Gặt lúa 2 ngày",
    rating: 4.9,
    totalJobs: 45,
    distance: "2.5km",
    skills: ["Thu hoạch", "Làm đất", "Vận chuyển"],
    phone: "0934 567 890",
    status: "approved",
    appliedAt: "14/01/2026 07:45",
  },
  {
    id: 4,
    workerName: "Nguyễn Thị E",
    job: "Bón phân cho vườn cam",
    rating: 4.2,
    totalJobs: 12,
    distance: "3.1km",
    skills: ["Bón phân", "Trồng cây"],
    phone: "0945 678 901",
    status: "rejected",
    appliedAt: "13/01/2026 16:20",
  },
  {
    id: 5,
    workerName: "Hoàng Văn F",
    job: "Gặt lúa 2 ngày",
    rating: 4.7,
    totalJobs: 28,
    distance: "1.8km",
    skills: ["Thu hoạch", "Máy gặt"],
    phone: "0956 789 012",
    status: "completed",
    appliedAt: "12/01/2026 09:00",
  },
]

const statusConfig = {
  pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Đã nhận", color: "bg-agro-green/10 text-agro-green" },
  rejected: { label: "Từ chối", color: "bg-destructive/10 text-destructive" },
  completed: { label: "Hoàn thành", color: "bg-blue-100 text-blue-700" },
}

function ApplicationsContent() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWorker, setSelectedWorker] = useState<(typeof applications)[0] | null>(null)

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    const matchesSearch =
      app.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý ứng viên</h1>
        <p className="text-muted-foreground">Duyệt và quản lý người ứng tuyển</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc công việc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã nhận</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Danh sách ứng viên ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người lao động</TableHead>
                  <TableHead>Công việc</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Khoảng cách</TableHead>
                  <TableHead>Kỹ năng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback className="bg-agro-green/10 text-agro-green text-xs">
                            {app.workerName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{app.workerName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{app.job}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{app.rating}</span>
                        <span className="text-muted-foreground text-xs">({app.totalJobs})</span>
                      </div>
                    </TableCell>
                    <TableCell>{app.distance}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-40">
                        {app.skills.slice(0, 2).map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {app.skills.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{app.skills.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[app.status as keyof typeof statusConfig].color}>
                        {statusConfig[app.status as keyof typeof statusConfig].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedWorker(app)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Hồ sơ người lao động</DialogTitle>
                            </DialogHeader>
                            {selectedWorker && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarFallback className="bg-agro-green text-white text-xl">
                                      {selectedWorker.workerName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="text-lg font-semibold">{selectedWorker.workerName}</h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                      {selectedWorker.rating} ({selectedWorker.totalJobs} việc)
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedWorker.distance}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedWorker.phone}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedWorker.totalJobs} công việc</span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-2">Kỹ năng</p>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedWorker.skills.map((skill, i) => (
                                      <Badge key={i} variant="secondary">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                {selectedWorker.status === "pending" && (
                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      variant="outline"
                                      className="flex-1 text-destructive border-destructive bg-transparent"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Từ chối
                                    </Button>
                                    <Button className="flex-1 bg-agro-green hover:bg-agro-green-dark text-white">
                                      <Check className="h-4 w-4 mr-2" />
                                      Duyệt nhận
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        {app.status === "pending" && (
                          <>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <X className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-agro-green hover:text-agro-green">
                              <Check className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ApplicationsContent />
    </Suspense>
  )
}
