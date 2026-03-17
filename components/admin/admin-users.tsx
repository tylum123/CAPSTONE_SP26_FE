"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, MoreHorizontal, Eye, Ban, CheckCircle, Shield, Download, UserPlus, Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { adminService } from "@/libs/api/services/admin.service"
import type { GetUserResponse } from "@/libs/api/types"
import { useToast } from "@/hooks/use-toast"
import { handleApiError } from "@/lib/utils/error-handler"

type UserWithRoleMetadata = GetUserResponse & {
  roleId?: number | string
  roleName?: string
  role?: string | { name?: string; roleName?: string }
}

export function AdminUsers() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [users, setUsers] = useState<GetUserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [pendingDeleteUser, setPendingDeleteUser] = useState<GetUserResponse | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [selectedUserDetail, setSelectedUserDetail] = useState<GetUserResponse | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        const response = await adminService.getUsers()
        const data = response.data
        const items = Array.isArray(data) ? data : data?.data || []
        setUsers(Array.isArray(items) ? items : [])
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: handleApiError(error, {
            defaultMessage: "Không thể tải danh sách người dùng",
          }),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [toast])

  const getNormalizedRole = (user: GetUserResponse): "farmer" | "worker" | "admin" | "unknown" => {
    const currentUser = user as UserWithRoleMetadata
    const roleValue =
      typeof currentUser.role === "string"
        ? currentUser.role
        : currentUser.role?.name || currentUser.role?.roleName || currentUser.roleName || ""
    const normalized = roleValue.trim().toLowerCase()
    const roleId = Number(currentUser.roleId)

    if (normalized === "farmer" || normalized.includes("farmer") || normalized.includes("nông")) {
      return "farmer"
    }

    if (normalized === "worker" || normalized.includes("worker") || normalized.includes("lao")) {
      return "worker"
    }

    if (normalized === "admin" || normalized.includes("admin")) {
      return "admin"
    }

    if (roleId === 2) return "farmer"
    if (roleId === 3) return "worker"
    if (roleId === 1) return "admin"

    return "unknown"
  }

  const getRoleLabel = (user: GetUserResponse) => {
    const role = getNormalizedRole(user)
    if (role === "farmer") return "Nông dân"
    if (role === "worker") return "Người lao động"
    if (role === "admin") return "Quản trị"

    const currentUser = user as UserWithRoleMetadata
    if (typeof currentUser.role === "string" && currentUser.role.trim()) {
      return currentUser.role
    }

    return "Chưa xác định"
  }

  const getDisplayName = (user: GetUserResponse) => {
    return user.email?.split("@")[0] || "Người dùng"
  }

  const updateUserInState = (nextUser: GetUserResponse) => {
    setUsers((current) => current.map((user) => (user.id === nextUser.id ? nextUser : user)))
  }

  const handleToggleActive = async (user: GetUserResponse) => {
    try {
      setActionUserId(user.id)
      const response = await adminService.setUserActiveStatus(user, !user.isActive)
      updateUserInState(response.data)

      toast({
        title: "Thành công",
        description: response.data.isActive ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: handleApiError(error, {
          defaultMessage: "Không thể cập nhật trạng thái tài khoản",
        }),
        variant: "destructive",
      })
    } finally {
      setActionUserId(null)
    }
  }

  const handleToggleVerified = async (user: GetUserResponse) => {
    try {
      setActionUserId(user.id)
      const response = await adminService.setUserVerificationStatus(user, !user.isVerified)
      updateUserInState(response.data)

      toast({
        title: "Thành công",
        description: response.data.isVerified ? "Đã xác minh người dùng" : "Đã hủy xác minh người dùng",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: handleApiError(error, {
          defaultMessage: "Không thể cập nhật trạng thái xác minh",
        }),
        variant: "destructive",
      })
    } finally {
      setActionUserId(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!pendingDeleteUser) {
      return
    }

    try {
      setDeletingUserId(pendingDeleteUser.id)
      await adminService.deleteUser(pendingDeleteUser.id)

      setUsers((current) => current.filter((user) => user.id !== pendingDeleteUser.id))
      setSelectedUsers((current) => current.filter((id) => id !== pendingDeleteUser.id))

      toast({
        title: "Thành công",
        description: "Đã xóa người dùng",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: handleApiError(error, {
          defaultMessage: "Không thể xóa người dùng",
        }),
        variant: "destructive",
      })
    } finally {
      setDeletingUserId(null)
      setPendingDeleteUser(null)
    }
  }

  const handleViewUserDetail = async (user: GetUserResponse) => {
    try {
      setDetailLoading(true)
      const response = await adminService.getUserDetail(user.id)
      setSelectedUserDetail(response.data)
      setIsDetailOpen(true)
    } catch (error: any) {
      setSelectedUserDetail(user)
      setIsDetailOpen(true)

      toast({
        title: "Lỗi",
        description: handleApiError(error, {
          defaultMessage: "Không thể tải chi tiết người dùng, đang hiển thị dữ liệu hiện có",
        }),
        variant: "destructive",
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      getDisplayName(user).toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "farmers" && getNormalizedRole(user) === "farmer") ||
      (activeTab === "workers" && getNormalizedRole(user) === "worker") ||
      (activeTab === "suspended" && !user.isActive)
    return matchesSearch && matchesTab
  })

  const userStats = useMemo(() => {
    return {
      total: users.length,
      farmers: users.filter((user) => getNormalizedRole(user) === "farmer").length,
      workers: users.filter((user) => getNormalizedRole(user) === "worker").length,
      suspended: users.filter((user) => !user.isActive).length,
    }
  }, [users])

  const getStatusBadge = (user: GetUserResponse) => {
    if (!user.isActive) {
      return <Badge variant="destructive">Bị khóa</Badge>
    }

    if (!user.isVerified) {
      return <Badge variant="secondary">Chờ duyệt</Badge>
    }

    return <Badge className="bg-agro-green/10 text-agro-green">Hoạt động</Badge>
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const toggleAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-agro-green" />
      </div>
    )
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
            <p className="text-2xl font-bold text-agro-green">{userStats.total}</p>
            <p className="text-sm text-muted-foreground">Tổng người dùng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-card-foreground">{userStats.farmers}</p>
            <p className="text-sm text-muted-foreground">Nông dân</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-card-foreground">{userStats.workers}</p>
            <p className="text-sm text-muted-foreground">Người lao động</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-agro-orange">{userStats.suspended}</p>
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
                <TableHead>Liên hệ</TableHead>
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
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback>{getDisplayName(user)[0]?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getDisplayName(user)}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getRoleLabel(user)}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell>
                    {user.isVerified ? (
                      <Badge className="bg-agro-green/10 text-agro-green">
                        <Shield className="mr-1 h-3 w-3" />
                        Đã xác minh
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Chưa xác minh</Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">{user.phoneNumber || "-"}</p>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewUserDetail(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleVerified(user)} disabled={actionUserId === user.id}>
                          {actionUserId === user.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Shield className="mr-2 h-4 w-4" />
                          )}
                          {user.isVerified ? "Hủy xác minh" : "Xác minh tài khoản"}
                        </DropdownMenuItem>
                        {user.isActive ? (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleToggleActive(user)}
                            disabled={actionUserId === user.id}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Khóa tài khoản
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-agro-green"
                            onClick={() => handleToggleActive(user)}
                            disabled={actionUserId === user.id}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mở khóa
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setPendingDeleteUser(user)}
                          disabled={deletingUserId === user.id}
                        >
                          {deletingUserId === user.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="mr-2 h-4 w-4" />
                          )}
                          Xóa người dùng
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(pendingDeleteUser)} onOpenChange={(open) => !open && setPendingDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa người dùng?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteUser
                ? `Bạn sắp xóa tài khoản ${getDisplayName(pendingDeleteUser)} (${pendingDeleteUser.email}). Hành động này không thể hoàn tác.`
                : "Hành động này không thể hoàn tác."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingUserId)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={Boolean(deletingUserId)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deletingUserId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa người dùng"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
            <DialogDescription>Thông tin tài khoản chi tiết</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex min-h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-agro-green" />
            </div>
          ) : selectedUserDetail ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>{getDisplayName(selectedUserDetail)[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getDisplayName(selectedUserDetail)}</p>
                  <p className="text-muted-foreground">{selectedUserDetail.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Vai trò</p>
                  <p className="font-medium">{getRoleLabel(selectedUserDetail.role)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{selectedUserDetail.phoneNumber || "-"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Ngày tham gia</p>
                  <p className="font-medium">{new Date(selectedUserDetail.createdAt).toLocaleDateString("vi-VN")}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Trạng thái</p>
                  <p className="font-medium">{selectedUserDetail.isActive ? "Hoạt động" : "Bị khóa"}</p>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Địa chỉ</p>
                <p className="font-medium">{selectedUserDetail.address || "-"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có dữ liệu người dùng.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
