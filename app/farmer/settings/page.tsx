"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Upload, Save } from "lucide-react"

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Nguyễn Văn An",
    email: "nguyenvanan@email.com",
    phone: "0912 345 678",
    farmName: "Nông trại Hạnh Phúc",
    farmAddress: "Xã Tân Phú, Huyện Châu Thành, Bến Tre",
    farmSize: "5",
    description: "Nông trại chuyên trồng lúa và hoa màu theo hướng hữu cơ.",
  })

  const [notifications, setNotifications] = useState({
    newApplications: true,
    completedJobs: true,
    paymentReminders: true,
    promotions: false,
  })

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt tài khoản</h1>
        <p className="text-muted-foreground">Quản lý thông tin cá nhân và nông trại</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-agro-green text-white text-2xl">NA</AvatarFallback>
            </Avatar>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Upload className="h-4 w-4" />
              Đổi ảnh đại diện
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farm Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin nông trại</CardTitle>
          <CardDescription>Cập nhật thông tin về nông trại của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="farmName">Tên nông trại</Label>
            <Input
              id="farmName"
              value={profile.farmName}
              onChange={(e) => setProfile({ ...profile, farmName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="farmAddress">Địa chỉ nông trại</Label>
            <div className="relative">
              <Input
                id="farmAddress"
                value={profile.farmAddress}
                onChange={(e) => setProfile({ ...profile, farmAddress: e.target.value })}
                className="pr-10"
              />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="farmSize">Diện tích (hecta)</Label>
            <Input
              id="farmSize"
              type="number"
              value={profile.farmSize}
              onChange={(e) => setProfile({ ...profile, farmSize: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Giới thiệu về nông trại</Label>
            <Textarea
              id="description"
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              className="min-h-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Thông báo</CardTitle>
          <CardDescription>Cài đặt nhận thông báo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ứng viên mới</p>
              <p className="text-sm text-muted-foreground">Thông báo khi có người ứng tuyển</p>
            </div>
            <Switch
              checked={notifications.newApplications}
              onCheckedChange={(v) => setNotifications({ ...notifications, newApplications: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Công việc hoàn thành</p>
              <p className="text-sm text-muted-foreground">Thông báo khi công việc được hoàn thành</p>
            </div>
            <Switch
              checked={notifications.completedJobs}
              onCheckedChange={(v) => setNotifications({ ...notifications, completedJobs: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nhắc thanh toán</p>
              <p className="text-sm text-muted-foreground">Nhắc nhở khi cần xác nhận thanh toán</p>
            </div>
            <Switch
              checked={notifications.paymentReminders}
              onCheckedChange={(v) => setNotifications({ ...notifications, paymentReminders: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Khuyến mãi</p>
              <p className="text-sm text-muted-foreground">Nhận thông tin khuyến mãi từ AgroTemp</p>
            </div>
            <Switch
              checked={notifications.promotions}
              onCheckedChange={(v) => setNotifications({ ...notifications, promotions: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button className="w-full md:w-auto bg-agro-green hover:bg-agro-green-dark text-white">
        <Save className="h-4 w-4 mr-2" />
        Lưu thay đổi
      </Button>
    </div>
  )
}
