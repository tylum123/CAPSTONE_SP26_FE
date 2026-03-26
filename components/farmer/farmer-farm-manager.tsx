"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { handleApiError } from "@/lib/utils/error-handler"
import { FarmService } from "@/libs/api/services/farm.service"
import type { GetFarmResponse, UpdateFarmRequest } from "@/libs/api/types"
import { Loader2, MapPin, Pencil, Plus, Star, Trash2, X, UploadCloud, Eye, ChevronLeft } from "lucide-react"
import Image from "next/image"

const FarmLocationPickerMap = dynamic(() => import("@/components/farmer/farm-location-picker-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed bg-muted/50">
      <Loader2 className="h-6 w-6 animate-spin text-agro-green" />
    </div>
  ),
})

type FarmFormState = {
  address: string
  latitude: number | null
  longitude: number | null
  locationName: string
  farmType: number
  livestockCount: number
  areaSize: number
  isPrimary: boolean
  images: string[]
}

type OSMPlace = {
  display_name: string
  lat: string
  lon: string
  name?: string
}

type FarmWithOptionalId = GetFarmResponse & {
  id?: string
}

const EMPTY_FORM: FarmFormState = {
  address: "",
  latitude: null,
  longitude: null,
  locationName: "",
  farmType: 2, // 2 = Crop by default
  livestockCount: 0,
  areaSize: 0,
  isPrimary: false,
  images: [],
}

function toFormState(farm: GetFarmResponse): FarmFormState {
  const latitude = Number(farm.latitude)
  const longitude = Number(farm.longitude)

  return {
    address: farm.address,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    locationName: farm.locationName,
    farmType: farm.farmType || 2,
    livestockCount: farm.livestockCount || 0,
    areaSize: farm.areaSize || 0,
    isPrimary: farm.isPrimary,
    images: Array.isArray(farm.imageUrl) ? farm.imageUrl : (farm.imageUrl ? [farm.imageUrl] : []),
  }
}

function getFarmId(farm: GetFarmResponse): string | undefined {
  const farmWithOptionalId = farm as FarmWithOptionalId
  return farmWithOptionalId.farmId || farmWithOptionalId.id
}

function normalizeFarm(farm: GetFarmResponse): GetFarmResponse {
  const farmId = getFarmId(farm)

  if (!farmId || farm.farmId === farmId) {
    return farm
  }

  return {
    ...farm,
    farmId,
  }
}

function sortFarms(farms: GetFarmResponse[]): GetFarmResponse[] {
  return [...farms].sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) {
      return Number(right.isPrimary) - Number(left.isPrimary)
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  })
}

function upsertFarm(farms: GetFarmResponse[], nextFarm: GetFarmResponse): GetFarmResponse[] {
  const normalizedFarm = normalizeFarm(nextFarm)
  const normalizedFarmId = getFarmId(normalizedFarm)

  if (!normalizedFarmId) {
    return sortFarms([normalizedFarm, ...farms])
  }

  const updatedFarms = farms.some((farm) => getFarmId(farm) === normalizedFarmId)
    ? farms.map((farm) => (getFarmId(farm) === normalizedFarmId ? normalizedFarm : farm))
    : [normalizedFarm, ...farms]

  const normalizedFarms = normalizedFarm.isPrimary
    ? updatedFarms.map((farm) => ({
        ...farm,
        isPrimary: getFarmId(farm) === normalizedFarmId,
      }))
    : updatedFarms

  return sortFarms(normalizedFarms)
}

export function FarmerFarmManager() {
  const { toast } = useToast()
  const [farms, setFarms] = useState<GetFarmResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingFarmId, setDeletingFarmId] = useState<string | null>(null)
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null)
  const [pendingDeleteFarm, setPendingDeleteFarm] = useState<GetFarmResponse | null>(null)
  const [formData, setFormData] = useState<FarmFormState>(EMPTY_FORM)
  const [syncingLocation, setSyncingLocation] = useState(false)
  const [viewingFarmId, setViewingFarmId] = useState<string | null>(null)
  const [viewingFarmDetails, setViewingFarmDetails] = useState<GetFarmResponse | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [isFormMode, setIsFormMode] = useState(false)

  const handleViewDetails = async (farmId: string) => {
    setViewingFarmId(farmId)
    setLoadingDetails(true)
    try {
      const response = await FarmService.getFarm(farmId)
      setViewingFarmDetails(response.data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: handleApiError(error, { defaultMessage: "Không thể tải thông tin chi tiết nông trại" }),
        variant: "destructive",
      })
      setViewingFarmId(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  useEffect(() => {
    const loadFarms = async () => {
      try {
        setLoading(true)
        const response = await FarmService.getFarms()
        setFarms(
          sortFarms(Array.isArray(response.data) ? response.data.map((farm) => normalizeFarm(farm)) : [])
        )
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: handleApiError(error, {
            defaultMessage: "Không thể tải danh sách nông trại",
          }),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadFarms()
  }, [toast])

  const handleFieldChange = (field: keyof FarmFormState, value: string | boolean | number | string[]) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const newFiles = Array.from(e.target.files)
    
    if (!editingFarmId) {
      toast({
        title: "Thông báo",
        description: "Vui lòng thêm nông trại trước khi tải ảnh lên.",
      })
      e.target.value = ""
      return
    }

    if (formData.images.length + newFiles.length > 3) {
      toast({
        title: "Lỗi",
        description: "Chỉ được upload tối đa 3 hình ảnh.",
        variant: "destructive",
      })
      e.target.value = ""
      return
    }

    try {
      setSubmitting(true)
      const uploadPromises = newFiles.map((file) => FarmService.uploadImage(editingFarmId, file))
      const results = await Promise.all(uploadPromises)
      
      const newImageUrls = results.map((res) => res.data)
      handleFieldChange("images", [...formData.images, ...newImageUrls])
      
      toast({
        title: "Thành công",
        description: "Đã tải ảnh lên.",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: handleApiError(error, {
          defaultMessage: "Không thể tải ảnh lên",
        }),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
      e.target.value = ""
    }
  }

  const removeImage = (indexToRemove: number) => {
    handleFieldChange(
      "images",
      formData.images.filter((_, index) => index !== indexToRemove)
    )
  }

  const resetForm = () => {
    setFormData(EMPTY_FORM)
    setEditingFarmId(null)
    setIsFormMode(false)
  }

  const handleEdit = (farm: GetFarmResponse) => {
    const farmId = getFarmId(farm)

    if (!farmId) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy mã nông trại để chỉnh sửa",
        variant: "destructive",
      })
      return
    }

    setEditingFarmId(farmId)
    setFormData(toFormState(farm))
    setIsFormMode(true)
  }

  const handleAddressChange = (value: string) => {
    setFormData((current) => ({
      ...current,
      address: value,
      latitude: null,
      longitude: null,
    }))
  }

  const handleSyncAddressToMap = async () => {
    const keyword = formData.address.trim()

    if (keyword.length < 3) {
      toast({
        title: "Thiếu địa chỉ",
        description: "Vui lòng nhập địa chỉ trước khi đồng bộ bản đồ",
        variant: "destructive",
      })
      return
    }

    try {
      setSyncingLocation(true)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&q=${encodeURIComponent(keyword)}`,
        {
          headers: {
            "Accept-Language": "vi",
          },
        }
      )

      if (!response.ok) {
        throw new Error("Không thể đồng bộ vị trí")
      }

      const places = (await response.json()) as OSMPlace[]
      const firstPlace = places[0]

      if (!firstPlace) {
        toast({
          title: "Không tìm thấy vị trí",
          description: "Không tìm thấy tọa độ phù hợp với địa chỉ đã nhập",
          variant: "destructive",
        })
        return
      }

      const latitude = Number.parseFloat(firstPlace.lat)
      const longitude = Number.parseFloat(firstPlace.lon)

      setFormData((current) => ({
        ...current,
        address: current.address.trim() || firstPlace.display_name,
        latitude: Number.isNaN(latitude) ? current.latitude : latitude,
        longitude: Number.isNaN(longitude) ? current.longitude : longitude,
      }))

      toast({
        title: "Đồng bộ thành công",
        description: "Đã đánh dấu vị trí trên bản đồ",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: handleApiError(error, {
          defaultMessage: "Không thể đồng bộ vị trí từ địa chỉ",
        }),
        variant: "destructive",
      })
    } finally {
      setSyncingLocation(false)
    }
  }

  const handleSelectLocationFromMap = async (latitude: number, longitude: number) => {
    setFormData((current) => ({
      ...current,
      latitude,
      longitude,
    }))

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            "Accept-Language": "vi",
          },
        }
      )

      if (!response.ok) {
        return
      }

      const result = (await response.json()) as { display_name?: string }

      if (!result.display_name) {
        return
      }

      setFormData((current) => ({
        ...current,
        latitude,
        longitude,
        address: result.display_name || current.address,
      }))
    } catch {
      // Keep the selected coordinates even if reverse geocoding fails.
    }
  }

  const handleDelete = async () => {
    const farmId = pendingDeleteFarm ? getFarmId(pendingDeleteFarm) : undefined

    if (!pendingDeleteFarm || !farmId) {
      setPendingDeleteFarm(null)
      toast({
        title: "Lỗi",
        description: "Không tìm thấy mã nông trại để xóa",
        variant: "destructive",
      })
      return
    }

    try {
      setDeletingFarmId(farmId)
      await FarmService.removeFarm(farmId)
      setFarms((current) => current.filter((farm) => getFarmId(farm) !== farmId))

      if (editingFarmId === farmId) {
        resetForm()
      }

      toast({
        title: "Thành công",
        description: "Đã xóa nông trại",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: handleApiError(error, {
          defaultMessage: "Không thể xóa nông trại",
        }),
        variant: "destructive",
      })
    } finally {
      setDeletingFarmId(null)
      setPendingDeleteFarm(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const latitude =
      formData.latitude === null ? null : Number(formData.latitude)
    const longitude =
      formData.longitude === null ? null : Number(formData.longitude)

    if (!formData.locationName.trim() || !formData.address.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên địa điểm và địa chỉ nông trại",
        variant: "destructive",
      })
      return
    }

    if (
      latitude === null ||
      longitude === null ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      toast({
        title: "Tọa độ không hợp lệ",
        description: "Vui lòng nhập địa chỉ và nhấn Đồng bộ để lấy tọa độ",
        variant: "destructive",
      })
      return
    }

    const payload: UpdateFarmRequest = {
      address: formData.address.trim(),
      latitude,
      longitude,
      locationName: formData.locationName.trim(),
      farmType: formData.farmType,
      livestockCount: Number(formData.livestockCount) || 0,
      areaSize: Number(formData.areaSize) || 0,
      isPrimary: formData.isPrimary,
      imageUrl: formData.images,
    }

    try {
      setSubmitting(true)

      const response = editingFarmId
        ? await FarmService.updateFarm(editingFarmId, payload)
        : await FarmService.addFarm(payload)

      setFarms((current) => upsertFarm(current, response.data))
      resetForm()

      toast({
        title: "Thành công",
        description: editingFarmId ? "Đã cập nhật nông trại" : "Đã thêm nông trại mới",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: handleApiError(error, {
          defaultMessage: editingFarmId ? "Không thể cập nhật nông trại" : "Không thể tạo nông trại",
        }),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Form + Map View
  if (isFormMode) {
    return (
      <>
        <div className="mb-4 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetForm}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại danh sách
          </Button>
          <h2 className="text-lg font-semibold">
            {editingFarmId ? "Chỉnh sửa địa điểm" : "Thêm địa điểm mới"}
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Form Section */}
          <Card>
            <CardHeader>
              <CardTitle>{editingFarmId ? "Chỉnh sửa thông tin" : "Thông tin địa điểm"}</CardTitle>
              <CardDescription>Điền đầy đủ các thông tin cần thiết</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="locationName">Tên địa điểm</Label>
                  <Input
                    id="locationName"
                    value={formData.locationName}
                    onChange={(event) => handleFieldChange("locationName", event.target.value)}
                    placeholder="vd: Khu ruộng số 1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Loại nông trại</Label>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant={formData.farmType === 2 ? "default" : "outline"}
                        className={`${formData.farmType === 2 ? "bg-agro-green text-white hover:bg-agro-green-dark" : ""}`}
                        onClick={() => {
                          handleFieldChange("farmType", 2)
                          handleFieldChange("livestockCount", 0)
                        }}
                      >
                        Trồng trọt
                      </Button>
                      <Button
                        type="button"
                        variant={formData.farmType === 1 ? "default" : "outline"}
                        className={`${formData.farmType === 1 ? "bg-agro-green text-white hover:bg-agro-green-dark" : ""}`}
                        onClick={() => {
                          handleFieldChange("farmType", 1)
                          handleFieldChange("areaSize", 0)
                        }}
                      >
                        Chăn nuôi
                      </Button>
                    </div>
                  </div>

                  {formData.farmType === 2 ? (
                    <div className="space-y-2">
                      <Label htmlFor="areaSize">Diện tích (m²)</Label>
                      <Input
                        id="areaSize"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.areaSize || ""}
                        onChange={(event) => handleFieldChange("areaSize", Number(event.target.value))}
                        placeholder="vd: 1000"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="livestockCount">Số lượng vật nuôi (con)</Label>
                      <Input
                        id="livestockCount"
                        type="number"
                        min="0"
                        value={formData.livestockCount || ""}
                        onChange={(event) => handleFieldChange("livestockCount", Number(event.target.value))}
                        placeholder="vd: 500"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(event) => handleAddressChange(event.target.value)}
                      placeholder="vd: Ấp 3, xã Tân Phú, Đồng Tháp"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSyncAddressToMap}
                      disabled={syncingLocation || !formData.address.trim()}
                      className="shrink-0"
                    >
                      {syncingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          Đồng bộ
                        </>
                      )}
                    </Button>
                  </div>
                  {formData.latitude !== null && formData.longitude !== null ? (
                    <p className="text-xs text-muted-foreground">
                      Tọa độ: {Number(formData.latitude).toFixed(6)}, {Number(formData.longitude).toFixed(6)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Nhập địa chỉ để đồng bộ nhanh, hoặc nhấn trực tiếp trên bản đồ để chọn lại vị trí.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Hình ảnh (Tối đa 3 ảnh)</Label>
                    <span className="text-xs text-muted-foreground">
                      {formData.images.length}/3
                    </span>
                  </div>
                  {!editingFarmId ? (
                    <p className="text-sm text-muted-foreground italic">
                      Vui lòng thêm nông trại trước khi tải ảnh lên.
                    </p>
                  ) : (
                    <>
                      {formData.images.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                          {formData.images.map((img, index) => (
                            <div key={index} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border">
                              <Image src={img} alt={`Farm image ${index + 1}`} fill className="object-cover" unoptimized />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {formData.images.length < 3 && (
                        <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed hover:bg-muted/50">
                          <UploadCloud className="h-6 w-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Nhấn để tải ảnh lên</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <p className="font-medium">Đặt làm địa điểm mặc định</p>
                    <p className="text-sm text-muted-foreground">Ưu tiên khi tạo bài đăng</p>
                  </div>
                  <Switch
                    checked={formData.isPrimary}
                    onCheckedChange={(checked) => handleFieldChange("isPrimary", checked)}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-agro-green text-white hover:bg-agro-green-dark"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        {editingFarmId ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                        {editingFarmId ? "Lưu cập nhật" : "Thêm nông trại"}
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Map Section */}
          <Card>
            <CardHeader>
              <CardTitle>Vị trí trên bản đồ</CardTitle>
              <CardDescription>Nhấn trực tiếp lên bản đồ để chọn lại vị trí địa điểm</CardDescription>
            </CardHeader>
            <CardContent>
              <FarmLocationPickerMap
                latitude={formData.latitude}
                longitude={formData.longitude}
                onSelectLocation={handleSelectLocationFromMap}
              />
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={Boolean(pendingDeleteFarm)} onOpenChange={(open) => !open && setPendingDeleteFarm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa nông trại?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDeleteFarm
                  ? `Nông trại ${pendingDeleteFarm.locationName} sẽ bị xóa khỏi tài khoản của bạn. Hành động này không thể hoàn tác.`
                  : "Hành động này không thể hoàn tác."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={Boolean(deletingFarmId)}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={Boolean(deletingFarmId)}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {deletingFarmId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  "Xóa nông trại"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  // List View
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Danh sách địa điểm</h2>
          <p className="text-sm text-muted-foreground">Quản lý các địa điểm canh tác của bạn</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setFormData(EMPTY_FORM)
            setEditingFarmId(null)
            setIsFormMode(true)
          }}
          className="bg-agro-green text-white hover:bg-agro-green-dark gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm địa điểm mới
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed">
              <Loader2 className="h-6 w-6 animate-spin text-agro-green" />
            </div>
          ) : farms.length === 0 ? (
            <div className="rounded-lg border border-dashed px-6 py-10 text-center">
              <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Chưa có địa điểm nào</p>
              <p className="text-sm text-muted-foreground">Tạo địa điểm đầu tiên để quản lý địa điểm làm việc của bạn</p>
            </div>
          ) : (
            <div className="space-y-4">
              {farms.map((farm, index) => {
                const farmId = getFarmId(farm)

                return (
                  <div key={`${farmId || "farm"}-${index}`} className="rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{farm.locationName}</p>
                          {farm.isPrimary ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-agro-green/10 px-2.5 py-1 text-xs font-medium text-agro-green">
                              <Star className="h-3.5 w-3.5" />
                              Chính
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">{farm.address}</p>
                        <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2 mt-1">
                          <span className="flex items-center gap-1.5 line-clamp-1">
                            <span className="font-medium text-foreground">Loại:</span> {farm.farmTypeName || (farm.farmType === 1 ? "Chăn nuôi" : "Trồng trọt")}
                          </span>
                          {farm.farmType === 2 ? (
                            <span className="flex items-center gap-1.5 line-clamp-1">
                              <span className="font-medium text-foreground">Diện tích:</span> {farm.areaSize ? `${farm.areaSize} m²` : "Không có"}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 line-clamp-1">
                              <span className="font-medium text-foreground">Vật nuôi:</span> {farm.livestockCount ? `${farm.livestockCount} con` : "0 con"}
                            </span>
                          )}
                        </div>
                        <div className="grid gap-1 text-xs text-muted-foreground/70 sm:grid-cols-2 mt-2 pt-2 border-t">
                          <span>Vĩ độ: {farm.latitude}</span>
                          <span>Kinh độ: {farm.longitude}</span>
                        </div>
                        {Array.isArray(farm.imageUrl) && farm.imageUrl.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {farm.imageUrl.map((img, index) => (
                              <div key={index} className="relative h-12 w-12 overflow-hidden rounded-md border">
                                <Image src={img} alt={`Farm image ${index + 1}`} fill className="object-cover" unoptimized />
                              </div>
                            ))}
                          </div>
                        )}
                        {typeof farm.imageUrl === 'string' && farm.imageUrl !== "" && (
                          <div className="flex gap-2 mt-2">
                            <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                              <Image src={farm.imageUrl} alt={`Farm image`} fill className="object-cover" unoptimized />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <Button type="button" variant="outline" size="sm" onClick={() => farmId && handleViewDetails(farmId)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Chi tiết
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(farm)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Sửa
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setPendingDeleteFarm(farm)}
                          disabled={!farmId || deletingFarmId === farmId}
                        >
                          {deletingFarmId === farmId ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1 h-4 w-4" />
                          )}
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                )
                })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(pendingDeleteFarm)} onOpenChange={(open) => !open && setPendingDeleteFarm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nông trại?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteFarm
                ? `Nông trại ${pendingDeleteFarm.locationName} sẽ bị xóa khỏi tài khoản của bạn. Hành động này không thể hoàn tác.`
                : "Hành động này không thể hoàn tác."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingFarmId)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={Boolean(deletingFarmId)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deletingFarmId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa nông trại"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(viewingFarmId)} onOpenChange={(open) => {
        if (!open) {
          setViewingFarmId(null)
          setTimeout(() => setViewingFarmDetails(null), 300)
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{viewingFarmDetails?.locationName}</DialogTitle>
            <DialogDescription>
              {viewingFarmDetails?.address}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {loadingDetails ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-agro-green" />
              </div>
            ) : viewingFarmDetails ? (
              <div className="space-y-4 text-sm">
                {Array.isArray(viewingFarmDetails.imageUrl) && viewingFarmDetails.imageUrl.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {viewingFarmDetails.imageUrl.map((img, i) => (
                      <div key={i} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border">
                        <Image src={img} alt={`Farm image ${i}`} fill className="object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                )}
                {typeof viewingFarmDetails.imageUrl === 'string' && viewingFarmDetails.imageUrl !== "" && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border">
                      <Image src={viewingFarmDetails.imageUrl} alt={`Farm image`} fill className="object-cover" unoptimized />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground block mb-1">Loại:</span>
                    <p className="font-medium text-base">{viewingFarmDetails.farmTypeName || (viewingFarmDetails.farmType === 1 ? "Chăn nuôi" : "Trồng trọt")}</p>
                  </div>
                  {viewingFarmDetails.farmType === 2 ? (
                    <div>
                      <span className="text-muted-foreground block mb-1">Diện tích:</span>
                      <p className="font-medium text-base">{viewingFarmDetails.areaSize ? `${viewingFarmDetails.areaSize} m²` : "Không có"}</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-muted-foreground block mb-1">Số lượng vật nuôi:</span>
                      <p className="font-medium text-base">{viewingFarmDetails.livestockCount ? `${viewingFarmDetails.livestockCount} con` : "0 con"}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground block mb-1">Trạng thái:</span>
                    <p className="font-medium text-base">{viewingFarmDetails.isPrimary ? "Địa điểm chính" : "Phụ"}</p>
                  </div>
                  {(viewingFarmDetails.latitude || viewingFarmDetails.longitude) && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Tọa độ:</span>
                      <p className="font-medium text-base">
                        {viewingFarmDetails.latitude},{' '}
                        {viewingFarmDetails.longitude}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                Không có dữ liệu
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
