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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { handleApiError } from "@/lib/utils/error-handler"
import { FarmService } from "@/libs/api/services/farm.service"
import type { GetFarmResponse, UpdateFarmRequest } from "@/libs/api/types"
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react"

type FarmFormState = {
  address: string
  latitude: string
  longitude: string
  locationName: string
  isPrimary: boolean
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
  latitude: "",
  longitude: "",
  locationName: "",
  isPrimary: false,
}

function toFormState(farm: GetFarmResponse): FarmFormState {
  return {
    address: farm.address,
    latitude: String(farm.latitude),
    longitude: String(farm.longitude),
    locationName: farm.locationName,
    isPrimary: farm.isPrimary,
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
  const [locationSuggestions, setLocationSuggestions] = useState<OSMPlace[]>([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)

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
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=vn&q=${encodeURIComponent(keyword)}`,
          {
            headers: {
              "Accept-Language": "vi",
            },
          }
        )

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

  const handleFieldChange = (field: keyof FarmFormState, value: string | boolean) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetForm = () => {
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
        description: "Không tìm thấy mã nông trại để chỉnh sửa",
        variant: "destructive",
      })
      return
    }

    setEditingFarmId(farmId)
    setFormData(toFormState(farm))
    setShowLocationSuggestions(false)
  }

  const handleAddressChange = (value: string) => {
    setFormData((current) => ({
      ...current,
      address: value,
    }))
    setShowLocationSuggestions(true)
  }

  const selectOSMLocation = (place: OSMPlace) => {
    const latitude = Number.parseFloat(place.lat)
    const longitude = Number.parseFloat(place.lon)
    const fallbackName = place.display_name.split(",")[0]?.trim() || ""

    setFormData((current) => ({
      ...current,
      address: place.display_name,
      latitude: Number.isNaN(latitude) ? current.latitude : String(latitude),
      longitude: Number.isNaN(longitude) ? current.longitude : String(longitude),
      locationName: current.locationName.trim() || place.name || fallbackName,
    }))
    setLocationSuggestions([])
    setShowLocationSuggestions(false)
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

    const latitude = Number(formData.latitude)
    const longitude = Number(formData.longitude)

    if (!formData.locationName.trim() || !formData.address.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên địa điểm và địa chỉ nông trại",
        variant: "destructive",
      })
      return
    }

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      toast({
        title: "Tọa độ không hợp lệ",
        description: "Vui lòng nhập vĩ độ và kinh độ hợp lệ",
        variant: "destructive",
      })
      return
    }

    const payload: UpdateFarmRequest = {
      address: formData.address.trim(),
      latitude,
      longitude,
      locationName: formData.locationName.trim(),
      isPrimary: formData.isPrimary,
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

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingFarmId ? "Chỉnh sửa nông trại" : "Thêm nông trại"}</CardTitle>
            <CardDescription>Quản lý các địa điểm canh tác và chọn địa điểm chính cho hồ sơ của bạn</CardDescription>
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

              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <div className="relative">
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(event) => handleAddressChange(event.target.value)}
                    onFocus={() => setShowLocationSuggestions(true)}
                    onBlur={() => {
                      window.setTimeout(() => {
                        setShowLocationSuggestions(false)
                      }, 150)
                    }}
                    placeholder="vd: Ấp 3, xã Tân Phú, Đồng Tháp"
                  />

                  {showLocationSuggestions && (isSearchingLocation || locationSuggestions.length > 0) ? (
                    <div className="absolute top-full z-20 mt-2 w-full rounded-lg border bg-background shadow-lg">
                      {isSearchingLocation ? (
                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang tìm gợi ý địa chỉ từ OSM...
                        </div>
                      ) : (
                        <div className="py-1">
                          {locationSuggestions.map((place, index) => (
                            <button
                              key={`${place.display_name}-${place.lat}-${place.lon}-${index}`}
                              type="button"
                              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                              onClick={() => selectOSMLocation(place)}
                            >
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-agro-green" />
                              <span>{place.display_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Vĩ độ</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(event) => handleFieldChange("latitude", event.target.value)}
                    placeholder="10.8231"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Kinh độ</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(event) => handleFieldChange("longitude", event.target.value)}
                    placeholder="106.6297"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="font-medium">Đặt làm nông trại chính</p>
                  <p className="text-sm text-muted-foreground">Địa điểm này sẽ được ưu tiên hiển thị trên hồ sơ</p>
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
                  {editingFarmId ? "Hủy chỉnh sửa" : "Làm mới form"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách nông trại</CardTitle>
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
                <p className="font-medium">Chưa có nông trại nào</p>
                <p className="text-sm text-muted-foreground">Tạo nông trại đầu tiên để quản lý địa điểm làm việc của bạn</p>
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
                        <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                          <span>Vĩ độ: {farm.latitude}</span>
                          <span>Kinh độ: {farm.longitude}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(farm)}>
                          <Pencil className="h-4 w-4" />
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
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
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