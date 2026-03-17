"use client"

import { useState } from "react"
import { Search, MoreHorizontal, Eye, Ban, CheckCircle, Shield, Download, UserPlus, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

export function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])

  const users = [
    {
      id: 1,
      name: "Nguyễn Văn A",
      email: "nguyenvana@email.com",
      phone: "0901 234 567",
      type: "farmer",
      status: "active",
      verified: true,
      joinedAt: "15/06/2025",
      totalJobs: 45,
      totalSpent: 15500000,
      avatar: "/farmer1.jpg",
    },
    {
      id: 2,
      name: "Trần Minh Đức",
      email: "tranminhduc@email.com",
      phone: "0912 345 678",
      type: "worker",
      status: "active",
      verified: true,
      joinedAt: "20/07/2025",
      totalJobs: 78,
      totalEarned: 19500000,
      avatar: "/worker1.jpg",
    },
    {
      id: 3,
      name: "Lê Thị Hoa",
      email: "lethihoa@email.com",
      phone: "0923 456 789",
      type: "worker",
      status: "pending",
      verified: false,
      joinedAt: "05/01/2026",
      totalJobs: 0,
      totalEarned: 0,
      avatar: "/worker2.jpg",
    },
    {
      id: 4,
      name: "Phạm Văn Farmer",
      email: "phamvanfarmer@email.com",
      phone: "0934 567 890",
      type: "farmer",
      status: "suspended",
      verified: true,
      joinedAt: "10/08/2025",
      totalJobs: 12,
      totalSpent: 3200000,
      avatar: "/farmer2.jpg",
    },
    {
      id: 5,
      name: "Hoàng Thị Worker",
      email: "hoangthiworker@email.com",
      phone: "0945 678 901",
      type: "worker",
      status: "active",
      verified: true,
      joinedAt: "01/09/2025",
      totalJobs: 56,
      totalEarned: 14000000,
      avatar: "/worker3.jpg",
    },
  ]

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "farmers" && user.type === "farmer") ||
      (activeTab === "workers" && user.type === "worker") ||
      (activeTab === "suspended" && user.status === "suspended")
    return matchesSearch && matchesTab
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-agro-green/10 text-agro-green">Hoạt động</Badge>
      case "pending":
        return <Badge variant="secondary">Chờ duyệt</Badge>
      case "suspended":
        return <Badge variant="destructive">Bị khóa</Badge>
      default:
        return null
    }
  }

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const toggleAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý người dùng</h1>
          <p className="text-muted-foreground">Xem và quản lý tài khoản người dùng trên hệ thống</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </Button>
          <Button className="bg-agro-green text-white hover:bg-agro-green-dark">
            <UserPlus className="mr-2 h-4 w-4" />
            Thêm người dùng
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-agro-green">15,234</p>
            <p className="text-sm text-muted-foreground">Tổng người dùng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-card-foreground">5,120</p>
            <p className="text-sm text-muted-foreground">Nông dân</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-card-foreground">10,114</p>
            <p className="text-sm text-muted-foreground">Người lao động</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-agro-orange">45</p>
            <p className="text-sm text-muted-foreground">Bị khóa</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="farmers">Nông dân</TabsTrigger>
            <TabsTrigger value="workers">Người lao động</TabsTrigger>
            <TabsTrigger value="suspended">Bị khóa</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm text-muted-foreground">Đã chọn {selectedUsers.length} người dùng</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                Gửi email
              </Button>
              <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                <Ban className="mr-2 h-4 w-4" />
                Khóa tài khoản
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={selectedUsers.length === filteredUsers.length} onCheckedChange={toggleAllUsers} />
                </TableHead>
                <TableHead>Người dùng</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Xác minh</TableHead>
                <TableHead>Ngày tham gia</TableHead>
                <TableHead>Hoạt động</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.type === "farmer" ? "Nông dân" : "Người lao động"}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    {user.verified ? (
                      <Badge className="bg-agro-green/10 text-agro-green">
                        <Shield className="mr-1 h-3 w-3" />
                        Đã xác minh
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Chưa xác minh</Badge>
                    )}
                  </TableCell>
                  <TableCell>{user.joinedAt}</TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {user.totalJobs} việc
                      {user.type === "farmer" ? (
                        <span className="text-muted-foreground"> • {user.totalSpent?.toLocaleString()}đ chi</span>
                      ) : (
                        <span className="text-muted-foreground"> • {user.totalEarned?.toLocaleString()}đ thu</span>
                      )}
                    </p>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Gửi email
                        </DropdownMenuItem>
                        {user.status !== "suspended" ? (
                          <DropdownMenuItem className="text-destructive">
                            <Ban className="mr-2 h-4 w-4" />
                            Khóa tài khoản
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-agro-green">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mở khóa
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
