"use client"

import { useState } from "react"
import { Save, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AdminSettings() {
  const [commissionRate, setCommissionRate] = useState("5")
  const [minWage, setMinWage] = useState("150000")
  const [maxDistance, setMaxDistance] = useState("50")

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground">Cấu hình các thông số hoạt động của nền tảng</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Đặt lại mặc định
          </Button>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Lưu thay đổi
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Chung</TabsTrigger>
          <TabsTrigger value="payment">Thanh toán</TabsTrigger>
          <TabsTrigger value="matching">Ghép việc</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt chung</CardTitle>
                <CardDescription>Cấu hình cơ bản của nền tảng</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="platformName">Tên nền tảng</Label>
                    <Input id="platformName" defaultValue="AgroTemp" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="supportEmail">Email hỗ trợ</Label>
                    <Input id="supportEmail" defaultValue="support@agrotemp.vn" className="mt-2" />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Chế độ bảo trì</p>
                    <p className="text-sm text-muted-foreground">Tạm dừng hoạt động để bảo trì hệ thống</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Đăng ký mới</p>
                    <p className="text-sm text-muted-foreground">Cho phép người dùng mới đăng ký</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Yêu cầu xác minh</p>
                    <p className="text-sm text-muted-foreground">Bắt buộc xác minh danh tính để đăng/ứng tuyển việc</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ngôn ngữ & Vùng miền</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Ngôn ngữ mặc định</Label>
                    <Select defaultValue="vi">
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Múi giờ</Label>
                    <Select defaultValue="asia_ho_chi_minh">
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asia_ho_chi_minh">Asia/Ho_Chi_Minh (GMT+7)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Phí dịch vụ</CardTitle>
                <CardDescription>Cấu hình phí hoa hồng và thanh toán</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="commissionRate">Tỷ lệ hoa hồng (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="mt-2"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Phí thu trên mỗi giao dịch thành công</p>
                  </div>
                  <div>
                    <Label htmlFor="minWage">Lương tối thiểu (VNĐ/ngày)</Label>
                    <Input
                      id="minWage"
                      type="number"
                      value={minWage}
                      onChange={(e) => setMinWage(e.target.value)}
                      className="mt-2"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Mức lương thấp nhất cho phép đăng tuyển</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Thanh toán tự động</p>
                    <p className="text-sm text-muted-foreground">
                      Tự động giải ngân sau khi công việc được xác nhận hoàn thành
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div>
                  <Label>Thời gian giữ tiền escrow (ngày)</Label>
                  <Select defaultValue="3">
                    <SelectTrigger className="mt-2 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 ngày</SelectItem>
                      <SelectItem value="3">3 ngày</SelectItem>
                      <SelectItem value="5">5 ngày</SelectItem>
                      <SelectItem value="7">7 ngày</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Thời gian giữ tiền trước khi tự động giải ngân nếu không có khiếu nại
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-primary-foreground font-bold">
                      VP
                    </div>
                    <div>
                      <p className="font-medium">VNPay</p>
                      <p className="text-sm text-muted-foreground">Ví điện tử VNPay</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500 text-primary-foreground font-bold">
                      M
                    </div>
                    <div>
                      <p className="font-medium">Momo</p>
                      <p className="text-sm text-muted-foreground">Ví điện tử Momo</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500 text-primary-foreground font-bold">
                      TK
                    </div>
                    <div>
                      <p className="font-medium">Chuyển khoản ngân hàng</p>
                      <p className="text-sm text-muted-foreground">Chuyển khoản trực tiếp</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="matching" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt ghép việc</CardTitle>
              <CardDescription>Cấu hình thuật toán tìm kiếm và ghép việc</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="maxDistance">Khoảng cách tìm kiếm tối đa (km)</Label>
                  <Input
                    id="maxDistance"
                    type="number"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Ưu tiên ghép theo</Label>
                  <Select defaultValue="distance">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="distance">Khoảng cách gần nhất</SelectItem>
                      <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                      <SelectItem value="experience">Kinh nghiệm nhiều nhất</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Gợi ý việc tự động</p>
                  <p className="text-sm text-muted-foreground">Gửi thông báo gợi ý việc phù hợp cho người lao động</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Cho phép ứng tuyển đa công việc</p>
                  <p className="text-sm text-muted-foreground">Người lao động có thể ứng tuyển nhiều việc cùng lúc</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt thông báo</CardTitle>
              <CardDescription>Quản lý các loại thông báo gửi đến người dùng</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Việc mới gần đây</p>
                  <p className="text-sm text-muted-foreground">Thông báo khi có việc mới trong khu vực</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ứng viên mới</p>
                  <p className="text-sm text-muted-foreground">Thông báo cho nông dân khi có người ứng tuyển</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Thanh toán</p>
                  <p className="text-sm text-muted-foreground">Thông báo về các giao dịch thanh toán</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nhắc nhở công việc</p>
                  <p className="text-sm text-muted-foreground">Nhắc nhở trước khi công việc bắt đầu</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email marketing</p>
                  <p className="text-sm text-muted-foreground">Gửi email khuyến mãi và tin tức</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
