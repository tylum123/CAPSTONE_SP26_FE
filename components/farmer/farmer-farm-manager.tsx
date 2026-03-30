"use client"

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
import { OsmLocationPicker } from "@/components/farmer/osm-location-picker"
import { useToast } from "@/hooks/use-toast"
import { useProvinces } from "@/hooks/use-provinces"
import { handleApiError } from "@/libs/utils/error-handler"
import { FarmService } from "@/libs/api/services/farm.service"
import type { GetFarmResponse, UpdateFarmRequest } from "@/libs/types"
import { Loader2, MapPin, Pencil, Plus, Star, Trash2, X, UploadCloud, Eye, ChevronDown, PlusCircleIcon } from "lucide-react"
import Image from "next/image"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible"
import { AddressForm } from "@/components/address-form"

const OSM_NOMINATIM_URL = process.env.NEXT_PUBLIC_OSM_NOMINATIM_URL || "https://nominatim.openstreetmap.org/search"
const OSM_REVERSE_URL = process.env.NEXT_PUBLIC_OSM_REVERSE_URL || "https://nominatim.openstreetmap.org/reverse"
const OSM_WEB_BASE_URL = process.env.NEXT_PUBLIC_OSM_WEB_BASE_URL || "https://www.openstreetmap.org"

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

type PendingImage = {
  file: File
  previewUrl: string
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

function buildOsmDetailUrl(latitude: number, longitude: number): string {
  return `${OSM_WEB_BASE_URL}/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
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
  const [locationSuggestions, setLocationSuggestions] = useState<OSMPlace[]>([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [viewingFarmId, setViewingFarmId] = useState<string | null>(null)
  const [viewingFarmDetails, setViewingFarmDetails] = useState<GetFarmResponse | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [isFormCollapsibleOpen, setIsFormCollapsibleOpen] = useState(false)
  const { provinces, loading: provincesLoading } = useProvinces()
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null)
  const [selectedImageForViewer, setSelectedImageForViewer] = useState<string | null>(null)
  const [imageZoom, setImageZoom] = useState(100)
  const [imagePanX, setImagePanX] = useState(0)
  const [imagePanY, setImagePanY] = useState(0)
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartY, setDragStartY] = useState(0)

  const clearPendingImages = () => {
    pendingImages.forEach((pendingImage) => {
      URL.revokeObjectURL(pendingImage.previewUrl)
    })
    setPendingImages([])
  }

  const handleViewDetails = async (farmId: string) => {
    setViewingFarmId(farmId)
    setLoadingDetails(true)
    try {
      const response = await FarmService.getFarm(farmId)
      setViewingFarmDetails(response.data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: handleApiError(error, { defaultMessage: "Không thể tải thông tin chi tiết địa điểm" }),
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
            defaultMessage: "Không thể tải danh sách địa điểm",
          }),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadFarms()
  }, [toast])

  useEffect(() => {
    return () => {
      pendingImages.forEach((pendingImage) => {
        URL.revokeObjectURL(pendingImage.previewUrl)
      })
    }
  }, [pendingImages])

  useEffect(() => {
    const keyword = formData.address.trim()

    if (keyword.length < 3) {
      setLocationSuggestions([])
      setIsSearchingLocation(false)
      return
    }

    const timer = window.setTimeout(async () => {
      try {
        setIsSearchingLocation(true)
        const searchUrl = new URL(OSM_NOMINATIM_URL)
        searchUrl.searchParams.set("format", "json")
        searchUrl.searchParams.set("limit", "5")
        searchUrl.searchParams.set("countrycodes", "vn")
        searchUrl.searchParams.set("q", keyword)

        const response = await fetch(searchUrl.toString(), {
          headers: {
            "Accept-Language": "vi",
          },
        })

        if (!response.ok) {
          setLocationSuggestions([])
          return
        }

        const places = (await response.json()) as OSMPlace[]
        setLocationSuggestions(Array.isArray(places) ? places : [])
      } catch {
        setLocationSuggestions([])
      } finally {
        setIsSearchingLocation(false)
      }
    }, 350)

    return () => {
      window.clearTimeout(timer)
    }
  }, [formData.address])

  const handleFieldChange = (field: keyof FarmFormState, value: string | boolean | number | string[]) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const newFiles = Array.from(e.target.files)

    if (formData.images.length + pendingImages.length + newFiles.length > 3) {
      toast({
        title: "Lỗi",
        description: "Chỉ được upload tối đa 3 hình ảnh.",
        variant: "destructive",
      })
      e.target.value = ""
      return
    }

    if (!editingFarmId) {
      const queuedImages = newFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }))

      setPendingImages((current) => [...current, ...queuedImages])

      toast({
        title: "Đã chọn ảnh",
        description: "Ảnh sẽ được tải lên sau khi bạn thêm địa điểm.",
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
    if (indexToRemove < formData.images.length) {
      handleFieldChange(
        "images",
        formData.images.filter((_, index) => index !== indexToRemove)
      )
      return
    }

    const pendingIndex = indexToRemove - formData.images.length
    setPendingImages((current) => {
      const imageToRemove = current[pendingIndex]
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl)
      }

      return current.filter((_, index) => index !== pendingIndex)
    })
  }

  const resetForm = () => {
    clearPendingImages()
    setFormData(EMPTY_FORM)
    setEditingFarmId(null)
    setLocationSuggestions([])
    setShowLocationSuggestions(false)
  }

  const handleEdit = (farm: GetFarmResponse) => {
    const farmId = getFarmId(farm)

    if (!farmId) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy mã địa điểm để chỉnh sửa",
        variant: "destructive",
      })
      return
    }

    clearPendingImages()
    setEditingFarmId(farmId)
    setFormData(toFormState(farm))
    setShowLocationSuggestions(false)
    setIsFormCollapsibleOpen(true)
  }

  const handleAddressChange = (value: string) => {
    setFormData((current) => ({
      ...current,
      address: value,
      latitude: null,
      longitude: null,
    }))
    setShowLocationSuggestions(true)
  }

  // When province changes, update address and clear lat/lng
  const handleProvinceChange = (provinceCode: number) => {
    setSelectedProvince(provinceCode)
    const provinceObj = provinces.find((p) => p.code === provinceCode)
    setFormData((current) => ({
      ...current,
      address: provinceObj ? provinceObj.name : "",
      latitude: null,
      longitude: null,
    }))
    setShowLocationSuggestions(false)
  }

  const selectOSMLocation = (place: OSMPlace) => {
    const latitude = Number.parseFloat(place.lat)
    const longitude = Number.parseFloat(place.lon)
    const fallbackName = place.display_name.split(",")[0]?.trim() || ""

    setFormData((current) => ({
      ...current,
      address: place.display_name,
      latitude: Number.isNaN(latitude) ? current.latitude : latitude,
      longitude: Number.isNaN(longitude) ? current.longitude : longitude,
      locationName: current.locationName.trim() || place.name || fallbackName,
    }))
    setLocationSuggestions([])
    setShowLocationSuggestions(false)
  }

  const handleMapPick = async (latitude: number, longitude: number) => {
    setFormData((current) => ({
      ...current,
      latitude,
      longitude,
    }))
    setShowLocationSuggestions(false)

    try {
      const reverseUrl = new URL(OSM_REVERSE_URL)
      reverseUrl.searchParams.set("format", "jsonv2")
      reverseUrl.searchParams.set("lat", String(latitude))
      reverseUrl.searchParams.set("lon", String(longitude))
      reverseUrl.searchParams.set("zoom", "18")

      const response = await fetch(reverseUrl.toString(), {
        headers: {
          "Accept-Language": "vi",
        },
      })

      if (!response.ok) {
        return
      }

      const reverseData = (await response.json()) as {
        display_name?: string
        name?: string
      }

      const fallbackName = reverseData.display_name?.split(",")[0]?.trim() || ""

      setFormData((current) => ({
        ...current,
        latitude,
        longitude,
        address: reverseData.display_name || current.address,
        locationName: current.locationName.trim() || reverseData.name || fallbackName,
      }))
    } catch {
      // Keep selected coordinates even if reverse geocoding fails.
    }
  }

  const handleDelete = async () => {
    const farmId = pendingDeleteFarm ? getFarmId(pendingDeleteFarm) : undefined

    if (!pendingDeleteFarm || !farmId) {
      setPendingDeleteFarm(null)
      toast({
        title: "Lỗi",
        description: "Không tìm thấy mã địa điểm để xóa",
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
        description: "Đã xóa địa điểm",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: handleApiError(error, {
          defaultMessage: "Không thể xóa địa điểm",
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
        description: "Vui lòng nhập tên địa điểm và địa chỉ địa điểm",
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
        description: "Vui lòng chọn địa chỉ từ gợi ý OSM để lấy tọa độ tự động",
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

      let savedFarm = response.data

      if (!editingFarmId && pendingImages.length > 0) {
        const createdFarmId = getFarmId(savedFarm)

        if (createdFarmId) {
          try {
            const uploadedImages = await Promise.all(
              pendingImages.map((pendingImage) => FarmService.uploadImage(createdFarmId, pendingImage.file))
            )

            const uploadedUrls = uploadedImages.map((result) => result.data).filter(Boolean)

            if (uploadedUrls.length > 0) {
              const existingUrls = Array.isArray(savedFarm.imageUrl) ? savedFarm.imageUrl : []
              const updatedFarmResponse = await FarmService.updateFarm(createdFarmId, {
                imageUrl: [...existingUrls, ...uploadedUrls],
              })

              savedFarm = updatedFarmResponse.data
            }
          } catch {
            toast({
              title: "Tạo địa điểm thành công",
              description: "Không thể tải một số ảnh. Bạn có thể tải lại khi chỉnh sửa địa điểm.",
              variant: "destructive",
            })
          }
        }
      }

      setFarms((current) => upsertFarm(current, savedFarm))
      resetForm()

      toast({
        title: "Thành công",
        description: editingFarmId ? "Đã cập nhật địa điểm" : "Đã thêm địa điểm mới",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: handleApiError(error, {
          defaultMessage: editingFarmId ? "Không thể cập nhật địa điểm" : "Không thể tạo địa điểm",
        }),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-row-[1.1fr_0.9fr]">


        <Card>
          <CardHeader>
            <CardTitle>Danh sách  </CardTitle>
            <CardDescription>Theo dõi toàn bộ địa điểm canh tác đang gắn với tài khoản của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              farms.map((farm, index) => {
                const farmId = getFarmId(farm)

                return (
                  <div key={`${farmId || "farm"}-${index}`} className="rounded-xl border p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
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
                            <span className="font-medium text-foreground">Loại:</span> {farm.farmType === 1 ? "Chăn nuôi" : farm.farmType === 2 ? "Trồng trọt" : "Nuôi trồng thủy hải sản"}
                          </span>
                          {farm.farmType === 2 || farm.farmType === 3 ? (
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

                      <div className="flex gap-2">
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
              })
            )}
          </CardContent>
        </Card>

        <Collapsible
          className="space-y-6 group"
          open={isFormCollapsibleOpen}
          onOpenChange={setIsFormCollapsibleOpen}
        >
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 px-2">
              <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-500">
                <PlusCircleIcon className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-semibold">
                Thêm mới
              </h4>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full hover:bg-muted transition-transform duration-200 data-[state=open]:rotate-180">
                <ChevronDown className="h-4 w-4" />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <Card>
              <CardHeader>
                <CardTitle>{editingFarmId ? "Chỉnh sửa địa điểm" : "Thêm địa điểm"}</CardTitle>
                <CardDescription>Quản lý các địa điểm canh tác và chọn địa điểm mặc định cho hồ sơ của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-4">
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
                        <Label>Lĩnh vực canh tác</Label>
                        <div className="flex gap-2 w-full">
                          <Button
                            type="button"
                            variant={formData.farmType === 2 ? "default" : "outline"}
                            className={`flex-1 min-w-0 ${formData.farmType === 2 ? "bg-agro-green text-white hover:bg-agro-green-dark" : ""}`}
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
                            className={`flex-1 min-w-0 ${formData.farmType === 1 ? "bg-agro-green text-white hover:bg-agro-green-dark" : ""}`}
                            onClick={() => {
                              handleFieldChange("farmType", 1)
                              handleFieldChange("areaSize", 0)
                            }}
                          >
                            Chăn nuôi
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant={formData.farmType === 3 ? "default" : "outline"}
                          className={`flex-1 min-w-0 w-full ${formData.farmType === 3 ? "bg-agro-green text-white hover:bg-agro-green-dark" : ""}`}
                          onClick={() => {
                            handleFieldChange("farmType", 3)
                            handleFieldChange("livestockCount", 0)
                          }}
                        >
                          Nuôi trồng thủy hải sản
                        </Button>
                      </div>

                      {/* Field logic: Crop (2) and Aquaculture (3) use areaSize, Livestock (1) uses livestockCount */}
                      {formData.farmType === 1 ? (
                        <div className="space-y-2">
                          <Label htmlFor="livestockCount">Số lượng (con)</Label>
                          <Input
                            id="livestockCount"
                            type="number"
                            min="0"
                            value={formData.livestockCount || ""}
                            onChange={(event) => handleFieldChange("livestockCount", Number(event.target.value))}
                            placeholder="vd: 500"
                          />
                        </div>
                      ) : (
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
                      )}
                    </div>

                    <div className="space-y-2">
                      <AddressForm
                        value={{
                          province: formData.province || "",
                          ward: formData.ward || "",
                          detailedAddress: formData.detailedAddress || ""
                        }}
                        onChange={({ province, ward, detailedAddress }) => {
                          setFormData((current) => ({
                            ...current,
                            province,
                            ward,
                            detailedAddress,
                            // Compose a full address string for OSM/geocoding if needed
                            address: [detailedAddress, ward, province].filter(Boolean).join(", ")
                          }))
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Hình ảnh địa điểm (Tối đa 3 ảnh)</Label>
                        <span className="text-xs text-muted-foreground">
                          {formData.images.length + pendingImages.length}/3
                        </span>
                      </div>
                      {formData.images.length + pendingImages.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                          {formData.images.map((img, index) => (
                            <div key={`${img}-${index}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border">
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
                          {pendingImages.map((pendingImage, index) => {
                            const combinedIndex = formData.images.length + index

                            return (
                              <div key={`${pendingImage.previewUrl}-${index}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border">
                                <Image src={pendingImage.previewUrl} alt={`Pending farm image ${combinedIndex + 1}`} fill className="object-cover" unoptimized />
                                <button
                                  type="button"
                                  onClick={() => removeImage(combinedIndex)}
                                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {formData.images.length + pendingImages.length < 3 && (
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
                      {!editingFarmId && pendingImages.length > 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          Ảnh sẽ được tải lên tự động sau khi thêm địa điểm.
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                      <div>
                        <p className="font-medium">Đặt làm địa điểm mặc định</p>
                        <p className="text-sm text-muted-foreground">Địa điểm này sẽ được ưu tiên khi tạo bài đăng mới</p>
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
                            {editingFarmId ? "Lưu cập nhật" : "Thêm địa điểm"}
                          </>
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                        {editingFarmId ? "Hủy chỉnh sửa" : "Làm mới form"}
                      </Button>
                    </div>
                  </div>

                  {/* map */}
                  <div className="overflow-hidden rounded-lg border bg-muted/20 lg:sticky lg:top-4 w-full min-h-105 lg:h-full flex flex-col">
                    <OsmLocationPicker
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onPick={handleMapPick}
                      className="flex-1 min-h-90"
                    />
                    <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
                      <span>Bấm vào bản đồ để ghim vị trí địa điểm</span>
                      {formData.latitude !== null && formData.longitude !== null ? (
                        <a
                          href={buildOsmDetailUrl(Number(formData.latitude), Number(formData.longitude))}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-agro-green hover:underline"
                        >
                          Mở trên OSM
                        </a>
                      ) : (
                        <span>Chưa chọn tọa độ</span>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>

            </Card>
          </CollapsibleContent>
        </Collapsible>


      </div>

      <AlertDialog open={Boolean(pendingDeleteFarm)} onOpenChange={(open) => !open && setPendingDeleteFarm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa địa điểm?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteFarm
                ? `địa điểm ${pendingDeleteFarm.locationName} sẽ bị xóa khỏi tài khoản của bạn. Hành động này không thể hoàn tác.`
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
                "Xóa địa điểm"
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
        <DialogContent>
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
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedImageForViewer(img)
                          setImageZoom(100)
                        }}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border hover:border-agro-green transition-colors cursor-pointer hover:shadow-md"
                      >
                        <Image src={img} alt={`Farm image ${i}`} fill className="object-cover" unoptimized />
                      </button>
                    ))}
                  </div>
                )}
                {typeof viewingFarmDetails.imageUrl === 'string' && viewingFarmDetails.imageUrl !== "" && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof viewingFarmDetails.imageUrl === 'string') {
                          setSelectedImageForViewer(viewingFarmDetails.imageUrl)
                          setImageZoom(100)
                        }
                      }}
                      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border hover:border-agro-green transition-colors cursor-pointer hover:shadow-md"
                    >
                      <Image src={viewingFarmDetails.imageUrl} alt={`Farm image`} fill className="object-cover" unoptimized />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground block mb-1">Loại:</span>
                    <p className="font-medium text-base">{viewingFarmDetails.farmType === 1 ? "Chăn nuôi" : viewingFarmDetails.farmType === 2 ? "Trồng trọt" : "Nuôi trồng thủy hải sản"}</p>
                  </div>
                  {viewingFarmDetails.farmType === 2 || viewingFarmDetails.farmType === 3 ? (
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
                    <p className="font-medium text-base">{viewingFarmDetails.isPrimary ? "Địa điểm mặc định" : "Bình thường"}</p>
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

      <Dialog open={Boolean(selectedImageForViewer)} onOpenChange={(open) => {
        if (!open) {
          setSelectedImageForViewer(null)
          setImageZoom(100)
          setImagePanX(0)
          setImagePanY(0)
          setIsDraggingImage(false)
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Xem ảnh chi tiết</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
            {selectedImageForViewer && (
              <div
                className="relative w-full h-full flex items-center justify-center bg-muted/50 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
                onWheel={(e) => {
                  e.preventDefault()
                  const delta = -e.deltaY > 0 ? 10 : -10
                  setImageZoom(Math.min(300, Math.max(50, imageZoom + delta)))
                }}
                onMouseDown={(e) => {
                  if (imageZoom > 100) {
                    setIsDraggingImage(true)
                    setDragStartX(e.clientX - imagePanX)
                    setDragStartY(e.clientY - imagePanY)
                  }
                }}
                onMouseMove={(e) => {
                  if (isDraggingImage && imageZoom > 100) {
                    const newPanX = e.clientX - dragStartX
                    const newPanY = e.clientY - dragStartY
                    // Constrain pan to reasonable bounds
                    const maxPan = (imageZoom / 100 - 1) * 300
                    setImagePanX(Math.max(-maxPan, Math.min(maxPan, newPanX)))
                    setImagePanY(Math.max(-maxPan, Math.min(maxPan, newPanY)))
                  }
                }}
                onMouseUp={() => setIsDraggingImage(false)}
                onMouseLeave={() => setIsDraggingImage(false)}
              >
                <div
                  className="relative transition-transform duration-200 ease-out"
                  style={{
                    transform: `scale(${imageZoom / 100}) translate(${imagePanX}px, ${imagePanY}px)`,
                    transformOrigin: 'center',
                  }}
                >
                  <Image
                    src={selectedImageForViewer}
                    alt="Farm image detail"
                    width={600}
                    height={600}
                    className="object-contain select-none"
                    unoptimized
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImageZoom(Math.max(50, imageZoom - 10))}
              disabled={imageZoom <= 50}
            >
              −
            </Button>
            <span className="w-16 text-center text-sm font-medium">
              {imageZoom}%
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImageZoom(Math.min(300, imageZoom + 10))}
              disabled={imageZoom >= 300}
            >
              +
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setImageZoom(100)
                setImagePanX(0)
                setImagePanY(0)
              }}
              className="ml-2"
            >
              Khôi phục
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Cuộn chuột để phóng to/thu nhỏ. Kéo để di chuyển khi phóng to.
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}