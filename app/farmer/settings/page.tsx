"use client"

import { useState, useEffect, useRef } from "react"
import { FarmerFarmManager } from "@/components/farmer/farmer-farm-manager"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Save, Loader2 } from "lucide-react"
import { handleApiError } from "@/lib/utils/error-handler"
import { FarmerProfile, UpdateFarmerRequest } from "@/libs/api/types"
import { farmerService } from "@/libs/api/services/farmer.service"
import { cloudinaryService } from "@/libs/api/services/cloudinary.service"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {  
  const [profile, setProfile] = useState<FarmerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState("")
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<UpdateFarmerRequest>({
    organizationName: "",
    contactName: "",
    contactNumber: "",
    cooperativeAffiliation: "",
    farmType: "",
    avatarUrl: "",
  })

  const [notifications, setNotifications] = useState({
    newApplications: true,
    completedJobs: true,
    paymentReminders: true,
    promotions: false,
  })

  const { toast } = useToast()

  // Fetch profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const response = await farmerService.getProfile()
        if (response.data) {
          setProfile(response.data)
          const initialAvatar = response.data.avatarUrl || ""
          setAvatarPreview(initialAvatar)
          setFormData({
            organizationName: response.data.organizationName || "",
            contactName: response.data.contactName || "",
            contactNumber: response.data.contactNumber || "",
            cooperativeAffiliation: response.data.cooperativeAffiliation || "",
            farmType: response.data.farmType || "",
            avatarUrl: initialAvatar,
          })
        }
      } catch (error: any) {
        console.error("Failed to load profile:", error)
        toast({
          title: "Lỗi",
          description: handleApiError(error, {
            defaultMessage: "Không thể tải thông tin hồ sơ",
          }),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [toast])

  const handleInputChange = (field: keyof UpdateFarmerRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await farmerService.updateProfile(formData)
      if (response.data) {
        setProfile(response.data)
        setAvatarPreview(response.data.avatarUrl || "")
        toast({
          title: "Thành công",
          description: "Cập nhật thông tin thành công",
        })
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error)
      toast({
        title: "Lỗi",
        description: handleApiError(error, {
          defaultMessage: "Không thể cập nhật thông tin tài khoản của bạn",
        }),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingAvatar(true)

      const uploadResponse = await cloudinaryService.uploadImage(file)
      const uploadedUrl = uploadResponse.data

      if (!uploadedUrl) {
        throw new Error("Không nhận được URL ảnh từ server")
      }

      setAvatarPreview(uploadedUrl)
      setFormData((prev) => ({
        ...prev,
        avatarUrl: uploadedUrl,
      }))

      toast({
        title: "Thành công",
        description: "Tải ảnh lên thành công. Nhấn 'Lưu thay đổi' để cập nhật hồ sơ.",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: handleApiError(error, {
          defaultMessage: "Không thể tải ảnh đại diện lên",
        }),
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
      event.target.value = ""
    }
  }


  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-agro-green" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt tài khoản</h1>
        <p className="text-muted-foreground">Quản lý thông tin cá nhân, hồ sơ nông trại và các địa điểm canh tác</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-fit">
          <TabsTrigger value="account">Tài khoản</TabsTrigger>
          <TabsTrigger value="farm">Nông trại</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview || "/placeholder.svg"} />
                  <AvatarFallback className="bg-agro-green text-white text-2xl">
                    {profile?.contactName?.charAt(0).toUpperCase() || "NA"}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button
                  variant="outline"
                  className="gap-2 bg-transparent"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploadingAvatar ? "Đang tải lên..." : "Đổi ảnh đại diện"}
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên</Label>
                  <Input
                    id="name"
                    value={formData.contactName || ""}
                    onChange={(e) => handleInputChange("contactName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ""}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={formData.contactNumber || ""}
                    onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-agro-green text-white hover:bg-agro-green-dark md:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="farm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin nông trại</CardTitle>
              <CardDescription>Cập nhật hồ sơ nông trại sẽ hiển thị công khai trên tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="farmName">Tên nông trại</Label>
                  <Input
                    id="farmName"
                    value={formData.organizationName || ""}
                    onChange={(e) => handleInputChange("organizationName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="farmType">Loại nông trại</Label>
                  <Input
                    id="farmType"
                    value={formData.farmType || ""}
                    onChange={(e) => handleInputChange("farmType", e.target.value)}
                    placeholder="vd: Rau, Lúa, Chăn nuôi..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cooperative">Hiệp hội liên kết</Label>
                  <Input
                    id="cooperative"
                    value={formData.cooperativeAffiliation || ""}
                    onChange={(e) => handleInputChange("cooperativeAffiliation", e.target.value)}
                    placeholder="vd: Hiệp hội nông dân xã..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-agro-green text-white hover:bg-agro-green-dark md:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu hồ sơ nông trại
              </>
            )}
          </Button>

          <FarmerFarmManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
