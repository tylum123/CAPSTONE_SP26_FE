"use client"

import { type KeyboardEvent, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, CheckCheck, ChevronsUpDown, MapPinned, Plus, X, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { farmerService } from "@/libs/api/services/farmer.service"
import { FarmService } from "@/libs/api/services/farm.service"
import { jobCategoryService } from "@/libs/api/services/job-category.service"
import { skillService } from "@/libs/api/services/skill.service"
import type { CreateJobRequest, GetFarmResponse, JobCategory, Skill } from "@/libs/api/types"
import { cn } from "@/libs/utils"

type WorkScheduleType = "contract" | "daily"

type OSMPlace = {
  display_name: string
  lat: string
  lon: string
}

type PostedJobPreview = {
  id: string
  createdAt: string
  title: string
  income: number
  workersNeeded: number
  location: string
  locationLat?: number
  locationLng?: number
  requirements: string[]
  skills: string[]
  benefits: string[]
  scheduleType: WorkScheduleType
  contractStartDate?: string
  contractEndDate?: string
  daysToHire?: number
  dailyStartTime?: string
  dailyEndTime?: string
}

const DEFAULT_FARM_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
const DEFAULT_JOB_CATEGORY_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
const DEFAULT_WAGE_TYPE_ID = 1
const DEFAULT_PAYMENT_METHOD_ID = 1
const DEFAULT_STATUS_ID = 1
const DEFAULT_GENDER_PREFERENCE = "any"
const DEFAULT_IS_URGENT = false

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)

const formatDateDDMMYYYY = (dateValue: string) => {
  if (!dateValue) {
    return ""
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
    return dateValue
  }

  const [year, month, day] = dateValue.split("-")

  if (!year || !month || !day) {
    return dateValue
  }

  return `${day}/${month}/${year}`
}

const parseDDMMYYYYToDate = (dateValue: string) => {
  const normalized = dateValue.trim()
  const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)

  if (!match) {
    return null
  }

  const [, dayStr, monthStr, yearStr] = match
  const day = Number.parseInt(dayStr, 10)
  const month = Number.parseInt(monthStr, 10)
  const year = Number.parseInt(yearStr, 10)
  const parsedDate = new Date(year, month - 1, day)

  const isSameDate =
    parsedDate.getFullYear() === year && parsedDate.getMonth() === month - 1 && parsedDate.getDate() === day

  if (!isSameDate) {
    return null
  }

  return parsedDate
}

const buildOSMEmbedUrl = (lat: number, lng: number) => {
  const delta = 0.0035
  const left = lng - delta
  const right = lng + delta
  const top = lat + delta
  const bottom = lat - delta

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left},${bottom},${right},${top}&layer=mapnik&marker=${lat},${lng}`
}

export function FarmerJobForm() {
  const [step, setStep] = useState<1 | 2>(1)
  const [title, setTitle] = useState("")
  const [income, setIncome] = useState("")
  const [workersNeeded, setWorkersNeeded] = useState("1")
  const [location, setLocation] = useState("")
  const [locationLat, setLocationLat] = useState<number | undefined>(undefined)
  const [locationLng, setLocationLng] = useState<number | undefined>(undefined)

  const [requirements, setRequirements] = useState<string[]>(["Có sức khỏe tốt"])
  const [newRequirement, setNewRequirement] = useState("")

  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [benefits, setBenefits] = useState<string[]>(["Bao ăn"])
  const [newBenefit, setNewBenefit] = useState("")

  const [jobCategories, setJobCategories] = useState<JobCategory[]>([])
  const [selectedJobCategoryId, setSelectedJobCategoryId] = useState(DEFAULT_JOB_CATEGORY_ID)
  const [isLoadingJobCategories, setIsLoadingJobCategories] = useState(true)
  const [isJobCategoryPopoverOpen, setIsJobCategoryPopoverOpen] = useState(false)

  const [farms, setFarms] = useState<GetFarmResponse[]>([])
  const [selectedFarmId, setSelectedFarmId] = useState(DEFAULT_FARM_ID)
  const [isLoadingFarms, setIsLoadingFarms] = useState(true)
  const [isFarmPopoverOpen, setIsFarmPopoverOpen] = useState(false)

  const [scheduleType, setScheduleType] = useState<WorkScheduleType>("contract")
  const [contractStartDate, setContractStartDate] = useState("")
  const [contractEndDate, setContractEndDate] = useState("")

  const [daysToHire, setDaysToHire] = useState("1")
  const [dailyStartTime, setDailyStartTime] = useState("06:00")
  const [dailyEndTime, setDailyEndTime] = useState("17:00")

  const [locationSuggestions, setLocationSuggestions] = useState<OSMPlace[]>([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [postedJob, setPostedJob] = useState<PostedJobPreview | null>(null)

  const workersNeededNumber = Number.parseInt(workersNeeded, 10) || 0
  const daysToHireNumber = Number.parseInt(daysToHire, 10) || 0
  const incomeNumber = Number.parseInt(income, 10) || 0

  const hasDailyRuleError = scheduleType === "daily" && workersNeededNumber < daysToHireNumber
  const selectedContractStartDate = contractStartDate ? parseDDMMYYYYToDate(contractStartDate) ?? undefined : undefined
  const selectedContractEndDate = contractEndDate ? parseDDMMYYYYToDate(contractEndDate) ?? undefined : undefined

  const getSkillLabel = (skillId: string) => {
    const foundSkill = availableSkills.find((item) => item.id === skillId)
    return foundSkill?.name ?? skillId
  }

  const getJobCategoryLabel = (categoryId: string) => {
    const foundCategory = jobCategories.find((item) => item.id === categoryId)
    return foundCategory?.name ?? ""
  }

  const getFarmLabel = (farmId: string) => {
    const foundFarm = farms.find((farm) => (farm.farmId || (farm as any).id) === farmId)
    return foundFarm?.locationName || foundFarm?.address || ""
  }

  const selectedJobCategoryLabel = getJobCategoryLabel(selectedJobCategoryId)
  const selectedFarmLabel = getFarmLabel(selectedFarmId)

  const toISODate = (dateValue: string) => {
    const parsedDate = parseDDMMYYYYToDate(dateValue)
    return parsedDate ? parsedDate.toISOString() : null
  }

  const toDailyEstimatedHours = (startTime: string, endTime: string, days: number) => {
    const [startHour = "0", startMinute = "0"] = startTime.split(":")
    const [endHour = "0", endMinute = "0"] = endTime.split(":")

    const startInMinutes = Number.parseInt(startHour, 10) * 60 + Number.parseInt(startMinute, 10)
    const endInMinutes = Number.parseInt(endHour, 10) * 60 + Number.parseInt(endMinute, 10)
    const minutesPerDay = Math.max(0, endInMinutes - startInMinutes)

    return Math.max(1, Math.round((minutesPerDay / 60) * Math.max(1, days)))
  }

  const toContractEstimatedHours = (startISO: string, endISO: string) => {
    const startDate = new Date(startISO)
    const endDate = new Date(endISO)
    const millisecondsPerDay = 1000 * 60 * 60 * 24
    const diffInDays = Math.floor((endDate.getTime() - startDate.getTime()) / millisecondsPerDay) + 1

    return Math.max(1, diffInDays * 8)
  }

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((currentSkills) =>
      currentSkills.includes(skillId)
        ? currentSkills.filter((item) => item !== skillId)
        : [...currentSkills, skillId],
    )
  }

  const addRequirement = () => {
    const value = newRequirement.trim()

    if (!value) {
      return
    }

    setRequirements((current) => [...current, value])
    setNewRequirement("")
  }

  const addBenefit = () => {
    const value = newBenefit.trim()

    if (!value) {
      return
    }
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nhập ít nhất 3 ký tự để hiển thị gợi ý địa điểm.
                    </p>

                    {(isSearchingLocation || locationSuggestions.length > 0) && (
                      <div className="mt-2 rounded-md border bg-background p-2">
                        {isSearchingLocation ? (
                          <p className="text-sm text-muted-foreground">Đang tìm địa điểm...</p>
                        ) : (
                          <div className="space-y-1">
                            {locationSuggestions.map((place) => (
                              <button
                                key={`${place.lat}-${place.lon}-${place.display_name}`}
                                type="button"
                                onClick={() => selectOSMLocation(place)}
                                className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                              >
                                {place.display_name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

    setBenefits((current) => [...current, value])
    setNewBenefit("")
  }

  const handleRequirementKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      addRequirement()
    }
  }

  const handleBenefitKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      addBenefit()
    }
  }

  useEffect(() => {
    const loadSkills = async () => {
      try {
        setIsLoadingSkills(true)
        const response = await skillService.getSkills()
        const payload = response.data as Skill[] | { data?: Skill[] }

        const fetchedSkills = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : []

        setAvailableSkills(fetchedSkills)
        setSelectedSkillIds((currentSelected) => {
          if (currentSelected.length > 0) {
            return currentSelected
          }

          return fetchedSkills.length > 0 ? [fetchedSkills[0].id] : []
        })
      } catch (error) {
        console.error(error)
        setAvailableSkills([])
      } finally {
        setIsLoadingSkills(false)
      }
    }

    void loadSkills()
  }, [])

  useEffect(() => {
    const loadJobCategories = async () => {
      try {
        setIsLoadingJobCategories(true)
        const response = await jobCategoryService.getJobCategories()
        const payload = response.data as JobCategory[] | { data?: JobCategory[] }

        const fetchedCategories = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : []

        const activeCategories = fetchedCategories.filter((category) => category.isActive !== false)
        setJobCategories(activeCategories)
        setSelectedJobCategoryId((currentSelected) => {
          if (currentSelected && currentSelected !== DEFAULT_JOB_CATEGORY_ID) {
            return currentSelected
          }

          return activeCategories[0]?.id ?? DEFAULT_JOB_CATEGORY_ID
        })
      } catch (error) {
        console.error(error)
        setJobCategories([])
      } finally {
        setIsLoadingJobCategories(false)
      }
    }

    void loadJobCategories()
  }, [])

  useEffect(() => {
    const loadFarms = async () => {
      try {
        setIsLoadingFarms(true)
        const response = await FarmService.getFarms()
        const payload = response.data as GetFarmResponse[] | { data?: GetFarmResponse[] }

        const fetchedFarms = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : []

        setFarms(fetchedFarms)
        setSelectedFarmId((currentSelected) => {
          if (currentSelected && currentSelected !== DEFAULT_FARM_ID) {
            return currentSelected
          }

          const firstFarm = fetchedFarms[0]
          return firstFarm?.farmId || (firstFarm as any)?.id || DEFAULT_FARM_ID
        })
      } catch (error) {
        console.error(error)
        setFarms([])
      } finally {
        setIsLoadingFarms(false)
      }
    }

    void loadFarms()
  }, [])

  useEffect(() => {
    const keyword = location.trim()

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
          },
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
  }, [location])

  const selectOSMLocation = (place: OSMPlace) => {
    const lat = Number.parseFloat(place.lat)
    const lng = Number.parseFloat(place.lon)

    setLocation(place.display_name)
    setLocationSuggestions([])

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      setLocationLat(lat)
      setLocationLng(lng)
    }
  }

  const handleContractStartSelect = (date?: Date) => {
    if (!date) {
      setContractStartDate("")
      return
    }

    const formatted = format(date, "dd/MM/yyyy")
    setContractStartDate(formatted)

    const parsedEndDate = parseDDMMYYYYToDate(contractEndDate)
    if (parsedEndDate && parsedEndDate < date) {
      setContractEndDate("")
    }
  }

  const handleContractEndSelect = (date?: Date) => {
    if (!date) {
      setContractEndDate("")
      return
    }

    setContractEndDate(format(date, "dd/MM/yyyy"))
  }

  const validateBeforePreview = () => {
    if (!title.trim()) {
      return "Vui lòng nhập tiêu đề công việc."
    }

    if (!incomeNumber || incomeNumber < 1) {
      return "Vui lòng nhập thu nhập hợp lệ."
    }

    if (!workersNeededNumber || workersNeededNumber < 1) {
      return "Số lượng nhân công cần phải lớn hơn 0."
    }

    if (!location.trim()) {
      return "Vui lòng nhập địa điểm làm việc."
    }

    if (!selectedFarmId) {
      return "Vui lòng chọn nông trại."
    }

    if (!selectedJobCategoryId) {
      return "Vui lòng chọn danh mục công việc."
    }

    if (!requirements.length) {
      return "Vui lòng thêm ít nhất 1 yêu cầu."
    }

    if (!selectedSkillIds.length) {
      return "Vui lòng chọn ít nhất 1 kỹ năng kinh nghiệm."
    }

    if (!benefits.length) {
      return "Vui lòng thêm ít nhất 1 quyền lợi."
    }

    if (scheduleType === "contract") {
      if (!contractStartDate || !contractEndDate) {
        return "Vui lòng chọn ngày bắt đầu và kết thúc cho công việc khoán."
      }

      const parsedStartDate = parseDDMMYYYYToDate(contractStartDate)
      const parsedEndDate = parseDDMMYYYYToDate(contractEndDate)

      if (!parsedStartDate || !parsedEndDate) {
        return "Vui lòng nhập ngày theo định dạng dd/mm/yyyy."
      }

      if (parsedEndDate < parsedStartDate) {
        return "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu."
      }
    }

    if (scheduleType === "daily") {
      if (!daysToHireNumber || daysToHireNumber < 1) {
        return "Vui lòng nhập số ngày muốn thuê hợp lệ."
      }

      if (!dailyStartTime || !dailyEndTime) {
        return "Vui lòng nhập giờ làm việc theo ngày."
      }

      if (workersNeededNumber < daysToHireNumber) {
        return "Số lượng nhân công luôn phải lớn hơn hoặc bằng số ngày muốn thuê."
      }
    }

    return null
  }

  const goToPreview = () => {
    const validationError = validateBeforePreview()

    if (validationError) {
      setSubmitError(validationError)
      return
    }

    setSubmitError(null)
    setStep(2)
  }

  const submitJob = async () => {
    const validationError = validateBeforePreview()

    if (validationError) {
      setSubmitError(validationError)
      return
    }

    const nowISO = new Date().toISOString()

    let startDate = nowISO
    let endDate = nowISO
    let estimatedHours = 1

    if (scheduleType === "contract") {
      const startISO = toISODate(contractStartDate)
      const endISO = toISODate(contractEndDate)

      if (!startISO || !endISO) {
        setSubmitError("Vui lòng nhập ngày theo định dạng dd/mm/yyyy.")
        return
      }

      startDate = startISO
      endDate = endISO
      estimatedHours = toContractEstimatedHours(startISO, endISO)
    } else {
      const start = new Date()
      const end = new Date()
      end.setDate(end.getDate() + Math.max(0, daysToHireNumber - 1))

      startDate = start.toISOString()
      endDate = end.toISOString()
      estimatedHours = toDailyEstimatedHours(dailyStartTime, dailyEndTime, daysToHireNumber)
    }

    const descriptionParts = [
      requirements.length ? `Yêu cầu: ${requirements.join(", ")}` : "",
      benefits.length ? `Quyền lợi: ${benefits.join(", ")}` : "",
      scheduleType === "daily"
        ? `Lịch làm: ${daysToHireNumber} ngày, ${dailyStartTime} - ${dailyEndTime}`
        : `Lịch làm: ${formatDateDDMMYYYY(contractStartDate)} - ${formatDateDDMMYYYY(contractEndDate)}`,
    ].filter(Boolean)

    const payload: CreateJobRequest = {
      jobSkillRequirementIds: selectedSkillIds,
      farmId: selectedFarmId || DEFAULT_FARM_ID,
      jobCategoryId: selectedJobCategoryId || DEFAULT_JOB_CATEGORY_ID,
      title: title.trim(),
      description: descriptionParts.join("\n"),
      address: location.trim(),
      startDate,
      endDate,
      estimatedHours,
      workersNeeded: workersNeededNumber,
      workersAccepted: 0,
      wageTypeId: DEFAULT_WAGE_TYPE_ID,
      wageAmount: incomeNumber,
      paymentMethodId: DEFAULT_PAYMENT_METHOD_ID,
      genderPreference: DEFAULT_GENDER_PREFERENCE,
      publishedAt: nowISO,
      isUrgent: DEFAULT_IS_URGENT,
      statusId: DEFAULT_STATUS_ID,
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      const response = await farmerService.createJob(payload)
      const createdJob = response.data

      const postedPayload: PostedJobPreview = {
        id: createdJob.id,
        createdAt: createdJob.createdAt ?? nowISO,
        title: createdJob.title ?? title.trim(),
        income: createdJob.wageAmount ?? incomeNumber,
        workersNeeded: createdJob.workersNeeded ?? workersNeededNumber,
        location: createdJob.address ?? location.trim(),
        locationLat,
        locationLng,
        requirements,
        skills: selectedSkillIds.map((skillId) => getSkillLabel(skillId)),
        benefits,
        scheduleType,
        contractStartDate: scheduleType === "contract" ? contractStartDate : undefined,
        contractEndDate: scheduleType === "contract" ? contractEndDate : undefined,
        daysToHire: scheduleType === "daily" ? daysToHireNumber : undefined,
        dailyStartTime: scheduleType === "daily" ? dailyStartTime : undefined,
        dailyEndTime: scheduleType === "daily" ? dailyEndTime : undefined,
      }

      setPostedJob(postedPayload)
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message
      setSubmitError(typeof apiMessage === "string" ? apiMessage : "Không thể đăng tin công việc. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetAll = () => {
    setStep(1)
    setTitle("")
    setIncome("")
    setWorkersNeeded("1")
    setLocation("")
    setLocationLat(undefined)
    setLocationLng(undefined)
    setRequirements(["Có sức khỏe tốt"])
    setNewRequirement("")
    setSelectedSkillIds([])
    setSelectedFarmId(farms[0]?.farmId ?? DEFAULT_FARM_ID)
    setSelectedJobCategoryId(jobCategories[0]?.id ?? DEFAULT_JOB_CATEGORY_ID)
    setBenefits(["Bao ăn"])
    setNewBenefit("")
    setScheduleType("contract")
    setContractStartDate("")
    setContractEndDate("")
    setDaysToHire("1")
    setDailyStartTime("06:00")
    setDailyEndTime("17:00")
    setSubmitError(null)
    setPostedJob(null)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/farmer/jobs">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Đăng tin công việc</h1>
          <p className="text-muted-foreground">
            Bước {step}/2: {step === 1 ? "Điền thông tin" : "Xem sơ lược trước khi đăng"}
          </p>
        </div>
      </div>

      {postedJob ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCheck className="h-5 w-5" />
              Đăng bài thành công
            </CardTitle>
            <CardDescription>Tin tuyển dụng đã được tạo thành công từ backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-background p-4 text-sm">
              <p>
                <span className="font-medium">Mã tin:</span> {postedJob.id}
              </p>
              <p>
                <span className="font-medium">Tiêu đề:</span> {postedJob.title}
              </p>
              <p>
                <span className="font-medium">Thu nhập:</span> {formatCurrency(postedJob.income)}
              </p>
              <p>
                <span className="font-medium">Địa điểm:</span> {postedJob.location}
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="button" onClick={resetAll}>
                Đăng tin mới
              </Button>
              <Button variant="outline" asChild>
                <Link href="/farmer/jobs">Về danh sách công việc</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {step === 1 ? (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Chi tiết công việc</CardTitle>
                    <CardDescription>Tiêu đề, danh mục và thu nhập.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="job-title">Tiêu đề (tên công việc) *</Label>
                      <Input
                        id="job-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="VD: Thu hoạch dưa lưới nhà màng C1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="job-category">Danh mục công việc *</Label>
                      <Popover open={isJobCategoryPopoverOpen} onOpenChange={setIsJobCategoryPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            id="job-category"
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={isJobCategoryPopoverOpen}
                            className="w-full justify-between"
                            disabled={isLoadingJobCategories || jobCategories.length === 0}
                          >
                            <span>
                              {selectedJobCategoryLabel || (isLoadingJobCategories ? "Đang tải..." : "Chọn danh mục")}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          {isLoadingJobCategories ? (
                            <div className="p-4 text-sm text-muted-foreground">Đang tải danh mục...</div>
                          ) : jobCategories.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground">Chưa có danh mục khả dụng.</div>
                          ) : (
                            <Command>
                              <CommandInput placeholder="Tìm danh mục..." />
                              <CommandList>
                                <CommandEmpty>Không tìm thấy danh mục phù hợp.</CommandEmpty>
                                <CommandGroup>
                                  {jobCategories.map((category) => {
                                    const isSelected = selectedJobCategoryId === category.id

                                    return (
                                      <CommandItem
                                        key={category.id}
                                        value={category.name}
                                        onSelect={() => {
                                          setSelectedJobCategoryId(category.id)
                                          setIsJobCategoryPopoverOpen(false)
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                        <div>
                                          <p className="font-medium">{category.name}</p>
                                          {category.description ? (
                                            <p className="text-xs text-muted-foreground">{category.description}</p>
                                          ) : null}
                                        </div>
                                      </CommandItem>
                                    )
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="income">Thu nhập (VNĐ) *</Label>
                        <Input
                          id="income"
                          type="number"
                          min="0"
                          value={income}
                          onChange={(event) => setIncome(event.target.value)}
                          placeholder="Ví dụ: 300000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workers-needed">Số lượng nhân công *</Label>
                        <Input
                          id="workers-needed"
                          type="number"
                          min="1"
                          value={workersNeeded}
                          onChange={(event) => setWorkersNeeded(event.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Địa điểm làm việc</CardTitle>
                    <CardDescription>Chọn nông trại hoặc nhập địa điểm cụ thể.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="farm-select">Nông trại *</Label>
                      <Popover open={isFarmPopoverOpen} onOpenChange={setIsFarmPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            id="farm-select"
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={isFarmPopoverOpen}
                            className="w-full justify-between"
                            disabled={isLoadingFarms || farms.length === 0}
                          >
                            <span>{selectedFarmLabel || (isLoadingFarms ? "Đang tải..." : "Chọn nông trại")}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          {isLoadingFarms ? (
                            <div className="p-4 text-sm text-muted-foreground">Đang tải nông trại...</div>
                          ) : farms.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground">Chưa có nông trại khả dụng.</div>
                          ) : (
                            <Command>
                              <CommandInput placeholder="Tìm nông trại..." />
                              <CommandList>
                                <CommandEmpty>Không tìm thấy nông trại phù hợp.</CommandEmpty>
                                <CommandGroup>
                                  {farms.map((farm) => {
                                    const farmId = farm.farmId || (farm as any).id
                                    const isSelected = selectedFarmId === farmId

                                    return (
                                      <CommandItem
                                        key={farmId}
                                        value={farm.locationName ?? farm.address ?? farmId}
                                        onSelect={() => {
                                          setSelectedFarmId(farmId)
                                          setIsFarmPopoverOpen(false)
                                          if (farm.address) {
                                            setLocation(farm.address)
                                          }
                                          if (farm.latitude && farm.longitude) {
                                            setLocationLat(farm.latitude)
                                            setLocationLng(farm.longitude)
                                          }
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                        <div>
                                          <p className="font-medium">{farm.locationName || farm.address}</p>
                                          <p className="text-xs text-muted-foreground">{farm.address}</p>
                                        </div>
                                      </CommandItem>
                                    )
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Địa chỉ chi tiết</Label>
                      <div className="relative">
                        <Input
                          id="location"
                          value={location}
                          onChange={(event) => {
                            setLocation(event.target.value)
                            setLocationLat(undefined)
                            setLocationLng(undefined)
                          }}
                          placeholder="Nhập địa điểm"
                        />
                        {(isSearchingLocation || locationSuggestions.length > 0) && (
                          <div className="absolute top-full z-10 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
                            {isSearchingLocation ? (
                              <p className="text-sm text-muted-foreground">Đang tìm địa điểm...</p>
                            ) : (
                              <div className="max-h-[200px] overflow-auto space-y-1">
                                {locationSuggestions.map((place) => (
                                  <button
                                    key={`${place.lat}-${place.lon}-${place.display_name}`}
                                    type="button"
                                    onClick={() => selectOSMLocation(place)}
                                    className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                                  >
                                    {place.display_name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                      {locationLat != null && locationLng != null ? (
                        <iframe
                          title="OpenStreetMap preview"
                          src={buildOSMEmbedUrl(locationLat, locationLng)}
                          className="h-48 w-full"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-muted/10 p-4 text-center text-sm text-muted-foreground">
                          <div className="space-y-2">
                             <MapPinned className="mx-auto h-8 w-8 opacity-50" />
                             <p>Chọn nông trại hoặc nhập địa điểm để xem bản đồ</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* <Card>
                <CardHeader>
                  <CardTitle>Yêu cầu</CardTitle>
                  <CardDescription>
                    Farmer có thể tự thêm yêu cầu (dụng cụ, độ tuổi, giới tính, điều kiện khác...).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {requirements.map((item, index) => (
                      <Badge key={`${item}-${index}`} variant="secondary" className="gap-1">
                        {item}
                        <button
                          type="button"
                          onClick={() => setRequirements((current) => current.filter((_, i) => i !== index))}
                          className="ml-1 rounded-full hover:text-destructive"
                          aria-label={`Xóa yêu cầu ${item}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newRequirement}
                      onChange={(event) => setNewRequirement(event.target.value)}
                      onKeyDown={handleRequirementKeyDown}
                      placeholder="Thêm yêu cầu mới..."
                    />
                    <Button type="button" variant="outline" onClick={addRequirement}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card> */}

              <Card>
                <CardHeader>
                  <CardTitle>Kinh nghiệm</CardTitle>
                  <CardDescription>Chọn kỹ năng cần thiết cho công việc.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {isLoadingSkills ? <p className="text-sm text-muted-foreground">Đang tải danh sách kỹ năng...</p> : null}
                  {!isLoadingSkills && availableSkills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Không có kỹ năng khả dụng.</p>
                  ) : null}
                  {availableSkills.map((skill) => {
                    const isSelected = selectedSkillIds.includes(skill.id)

                    return (
                      <label
                        key={skill.id}
                        htmlFor={`skill-${skill.id}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3",
                          isSelected ? "border-primary bg-primary/5" : "border-border",
                        )}
                      >
                        <Checkbox
                          id={`skill-${skill.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleSkill(skill.id)}
                        />
                        <span>{skill.name}</span>
                      </label>
                    )
                  })}
                </CardContent>
              </Card>

              {/* <Card>
                <CardHeader>
                  <CardTitle>Quyền lợi</CardTitle>
                  <CardDescription>Farmer có thể tự thêm quyền lợi (bao ăn, nghỉ 15 phút, hỗ trợ đi lại...).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {benefits.map((item, index) => (
                      <Badge key={`${item}-${index}`} variant="secondary" className="gap-1">
                        {item}
                        <button
                          type="button"
                          onClick={() => setBenefits((current) => current.filter((_, i) => i !== index))}
                          className="ml-1 rounded-full hover:text-destructive"
                          aria-label={`Xóa quyền lợi ${item}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newBenefit}
                      onChange={(event) => setNewBenefit(event.target.value)}
                      onKeyDown={handleBenefitKeyDown}
                      placeholder="Thêm quyền lợi mới..."
                    />
                    <Button type="button" variant="outline" onClick={addBenefit}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card> */}

              <Card>
                <CardHeader>
                  <CardTitle>Thời gian làm việc</CardTitle>
                  <CardDescription>Chọn theo khoán hoặc theo ngày theo đúng quy tắc bạn mô tả.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={scheduleType}
                    onValueChange={(value) => setScheduleType(value as WorkScheduleType)}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <label
                      htmlFor="schedule-contract"
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                        scheduleType === "contract" ? "border-primary bg-primary/5" : "border-border",
                      )}
                    >
                      <RadioGroupItem id="schedule-contract" value="contract" className="mt-1" />
                      <div>
                        <p className="font-medium">Theo khoán</p>
                        <p className="text-sm text-muted-foreground">Chọn ngày bắt đầu và ngày kết thúc.</p>
                      </div>
                    </label>

                    <label
                      htmlFor="schedule-daily"
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                        scheduleType === "daily" ? "border-primary bg-primary/5" : "border-border",
                      )}
                    >
                      <RadioGroupItem id="schedule-daily" value="daily" className="mt-1" />
                      <div>
                        <p className="font-medium">Theo ngày</p>
                        <p className="text-sm text-muted-foreground">Có số ngày muốn thuê và khung giờ cố định.</p>
                      </div>
                    </label>
                  </RadioGroup>

                  {scheduleType === "contract" ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="contract-start">Ngày bắt đầu *</Label>
                        <div className="mt-2 flex gap-2">
                          <Input
                            id="contract-start"
                            type="text"
                            value={contractStartDate}
                            onChange={(event) => setContractStartDate(event.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="flex-1"
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="outline" size="icon" aria-label="Chọn ngày bắt đầu">
                                <CalendarIcon className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <Calendar
                                mode="single"
                                selected={selectedContractStartDate}
                                onSelect={handleContractStartSelect}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="contract-end">Ngày kết thúc *</Label>
                        <div className="mt-2 flex gap-2">
                          <Input
                            id="contract-end"
                            type="text"
                            value={contractEndDate}
                            onChange={(event) => setContractEndDate(event.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="flex-1"
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="outline" size="icon" aria-label="Chọn ngày kết thúc">
                                <CalendarIcon className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <Calendar
                                mode="single"
                                selected={selectedContractEndDate}
                                onSelect={handleContractEndSelect}
                                disabled={(date) =>
                                  selectedContractStartDate ? date < selectedContractStartDate : false
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <Label htmlFor="days-to-hire">Số ngày muốn thuê *</Label>
                          <Input
                            id="days-to-hire"
                            type="number"
                            min="1"
                            value={daysToHire}
                            onChange={(event) => setDaysToHire(event.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="daily-start">Từ mấy giờ *</Label>
                          <Input
                            id="daily-start"
                            type="time"
                            value={dailyStartTime}
                            onChange={(event) => setDailyStartTime(event.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="daily-end">Đến mấy giờ *</Label>
                          <Input
                            id="daily-end"
                            type="time"
                            value={dailyEndTime}
                            onChange={(event) => setDailyEndTime(event.target.value)}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      {hasDailyRuleError ? (
                        <p className="text-sm font-medium text-destructive">
                          Số lượng nhân công luôn phải lớn hơn hoặc bằng số ngày muốn thuê.
                        </p>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>

              {submitError ? <p className="text-sm font-medium text-destructive">{submitError}</p> : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                  <Link href="/farmer/jobs">Hủy</Link>
                </Button>
                <Button type="button" onClick={goToPreview}>
                  Tiếp tục
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Sơ lược tin sẽ đăng</CardTitle>
                <CardDescription>Kiểm tra lại thông tin trước khi tiến hành đăng bài.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 rounded-lg border p-4 text-sm sm:grid-cols-2">
                  <p>
                    <span className="font-medium">Tiêu đề:</span> {title}
                  </p>
                  <p>
                    <span className="font-medium">Thu nhập:</span> {formatCurrency(incomeNumber)}
                  </p>
                  <p>
                    <span className="font-medium">Số nhân công cần:</span> {workersNeededNumber}
                  </p>
                  <p>
                    <span className="font-medium">Địa điểm:</span> {location}
                  </p>
                  <p>
                    <span className="font-medium">Nông trại:</span> {selectedFarmLabel || "Chưa chọn"}
                  </p>
                  <p>
                    <span className="font-medium">Danh mục:</span> {selectedJobCategoryLabel || "Chưa chọn"}
                  </p>
                </div>

                {/* <div>
                  <p className="mb-2 text-sm font-medium">Yêu cầu</p>
                  <div className="flex flex-wrap gap-2">
                    {requirements.map((item, index) => (
                      <Badge key={`${item}-${index}`} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div> */}

                <div>
                  <p className="mb-2 text-sm font-medium">Kinh nghiệm</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkillIds.map((skillId) => (
                      <Badge key={skillId} variant="outline">
                        {getSkillLabel(skillId)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* <div>
                  <p className="mb-2 text-sm font-medium">Quyền lợi</p>
                  <div className="flex flex-wrap gap-2">
                    {benefits.map((item, index) => (
                      <Badge key={`${item}-${index}`} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div> */}

                <div className="rounded-lg border p-4 text-sm">
                  <p className="font-medium">Thời gian làm việc</p>
                  {scheduleType === "contract" ? (
                    <p className="mt-2 text-muted-foreground">
                      Theo khoán từ {formatDateDDMMYYYY(contractStartDate)} đến {formatDateDDMMYYYY(contractEndDate)}.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-1 text-muted-foreground">
                      <p>Theo ngày, thuê {daysToHireNumber} ngày.</p>
                      <p>
                        Khung giờ cố định: {dailyStartTime} - {dailyEndTime}
                      </p>
                    </div>
                  )}
                </div>

                {submitError ? <p className="text-sm font-medium text-destructive">{submitError}</p> : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Quay lại chỉnh sửa
                  </Button>
                  <Button type="button" onClick={submitJob} disabled={isSubmitting}>
                    {isSubmitting ? "Đang đăng..." : "Xác nhận đăng bài"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
