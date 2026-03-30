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
import { Upload, Save, Loader2, RotateCcw, CalendarIcon } from "lucide-react"
import { handleApiError } from "@/libs/utils/error-handler"
import { FarmerProfile, UpdateFarmerRequest } from "@/libs/types"
import { farmerService } from "@/libs/api/services/farmer.service"
import { cloudinaryService } from "@/libs/api/services/cloudinary.service"
import { useToast } from "@/hooks/use-toast"
import { AddressForm } from "@/components/address-form"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/libs/utils/utils";
import { vi } from "date-fns/locale"

export default function SettingsPage() {
  const [profile, setProfile] = useState<FarmerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState("")
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [addressObj, setAddressObj] = useState({
    province: "",
    ward: "",
    detailedAddress: "",
  })
  const [editingAddress, setEditingAddress] = useState(false)

  const [formData, setFormData] = useState<UpdateFarmerRequest>({
    contactName: "",
    address: "",
    dateOfBirth: "",
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
        console.log("Profile response:", response)
        if (response.data) {
          setProfile(response.data)
          const initialAvatar = response.data.avatarUrl || ""
          setAvatarPreview(initialAvatar)
          setFormData({
            contactName: response.data.contactName || "",
            address: response.data.address || "",
            dateOfBirth: response.data.dateOfBirth || "",
            avatarUrl: initialAvatar,
          })

          if (response.data.address) {
            const parts = response.data.address.split(",").map(p => p.trim())
            if (parts.length >= 3) {
              setAddressObj({
                province: parts[parts.length - 1],
                ward: parts[parts.length - 2],
                detailedAddress: parts.slice(0, parts.length - 2).join(", ")
              })
            } else {
              setAddressObj(prev => ({ ...prev, detailedAddress: response.data.address || "" }))
            }
          }
        }
      } catch (error: any) {
        console.error("Failed to load profile:", error)

        const statusCode = error?.response?.status
        const backendMessage = error?.response?.data?.message
        const isProfileMissing =
          statusCode === 500 &&
          typeof backendMessage === "string" &&
          backendMessage.toLowerCase().includes("farmer profile not found")

        if (isProfileMissing) {
          toast({
            title: "Thông báo",
            description: "Vui lòng cập nhật thông tin cá nhân",
          })
          return
        }

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

      const fullAddressParts = [
        addressObj.detailedAddress,
        addressObj.ward,
        addressObj.province
      ].filter(Boolean)
      const fullAddress = fullAddressParts.join(", ")

      const dataToSave = {
        ...formData,
        address: fullAddress || formData.address
      }

      const response = await farmerService.updateProfile(dataToSave)
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
        <h1 className="text-2xl font-bold">Thông tin</h1>
        <p className="text-muted-foreground">Chỉnh sửa thông tin cá nhân và các địa điểm canh tác</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-fit">
          <TabsTrigger value="account">Tài khoản</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
          <TabsTrigger value="farm">Quản lý địa điểm</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center gap-4 py-4 border-b border-muted/50 mb-6">
                <Avatar className="h-32 w-32 md:h-40 md:w-40 shadow-sm border border-muted/50">
                  <AvatarImage className="object-cover" src={avatarPreview || "/placeholder.svg"} />
                  <AvatarFallback className="bg-agro-green text-white text-5xl">
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
                  className="gap-2 bg-transparent w-full max-w-[200px]"
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name">Họ và tên</Label>
                    {profile && formData.contactName !== (profile.contactName || "") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-muted-foreground hover:text-agro-green"
                        onClick={() => handleInputChange("contactName", profile.contactName || "")}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        <span className="text-xs">Hoàn tác</span>
                      </Button>
                    )}
                  </div>
                  <Input
                    id="name"
                    value={formData.contactName || ""}
                    onChange={(e) => handleInputChange("contactName", e.target.value)}
                  />
                </div>

                <div className="space-y-2 flex flex-col">
                  <Label htmlFor="dateOfBirth" className="font-medium text-gray-700">
                    Ngày sinh
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-gray-50/50 border-gray-200 focus:bg-white focus:border-agro-green focus:ring-agro-green/20 h-9",
                          !formData.dateOfBirth && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5 opacity-50" />
                        {formData.dateOfBirth ? (
                          format(new Date(formData.dateOfBirth), "dd/MM/yyyy")
                        ) : (
                          <span>Chọn ngày sinh (dd/mm/yyyy)</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                        onSelect={(date) =>
                          handleInputChange("dateOfBirth", date ? format(date, "yyyy-MM-dd") : "")
                        }
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={vi}
                        captionLayout="dropdown-buttons"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>



              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.user?.email || ""}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={profile?.user?.phoneNumber || ""}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Địa chỉ</Label>
                {!editingAddress ? (
                  <div className="flex items-center gap-4 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <div className="flex-1 text-base text-gray-700 text-sm">
                      {profile?.address ? profile.address : <span className="text-muted-foreground">Chưa có địa chỉ</span>}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => setEditingAddress(true)}
                    >
                      Thay đổi địa chỉ
                    </Button>
                  </div>
                ) : (
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-2">
                    <AddressForm
                      value={addressObj}
                      onChange={setAddressObj}
                      required={false}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditingAddress(false)}
                        className="shrink-0"
                      >
                        Huỷ
                      </Button>
                    </div>
                  </div>
                )}
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

        <TabsContent value="notifications" className="space-y-6">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="farm" className="space-y-6">
          <FarmerFarmManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
