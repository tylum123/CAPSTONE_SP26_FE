"use client"

import { type KeyboardEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, CheckCheck, ChevronsUpDown, MapPin, MapPinned, Plus, X, Calendar as CalendarIcon, Briefcase, Banknote, Users, FileText, CalendarRange, CheckSquare, Award, Gift, AlignLeft, Layout, Clock, Info, DollarSign } from "lucide-react"
import { eachDayOfInterval, format, isSameDay, startOfDay } from "date-fns"
import { vi } from "date-fns/locale"
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
import { Switch } from "@/components/ui/switch"
import { TimePicker } from "@/components/ui/time-picker"
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
const JOB_TYPE_CONTRACT_ID = 1
const JOB_TYPE_DAILY_ID = 2
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

const normalizeDay = (date: Date) => startOfDay(date)

const mergeAndSortDates = (dates: Date[]) => {
  const unique = new Map<number, Date>()

  dates.forEach((date) => {
    const normalized = normalizeDay(date)
    unique.set(normalized.getTime(), normalized)
  })

  return Array.from(unique.values()).sort((a, b) => a.getTime() - b.getTime())
}

const getSelectionSpanInDays = (sortedDates: Date[]) => {
  if (!sortedDates.length) {
    return 0
  }

  const first = sortedDates[0]
  const last = sortedDates[sortedDates.length - 1]
  const millisecondsPerDay = 1000 * 60 * 60 * 24

  return Math.floor((last.getTime() - first.getTime()) / millisecondsPerDay) + 1
}

export function FarmerJobForm() {
  const [step, setStep] = useState<1 | 2>(1)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
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
  const [isUrgent, setIsUrgent] = useState(DEFAULT_IS_URGENT)

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

  const [dailyStartTime, setDailyStartTime] = useState("09:00")
  const [dailyEndTime, setDailyEndTime] = useState("17:00")
  const [selectedDailyDates, setSelectedDailyDates] = useState<Date[]>([])
  const [isRangePicking, setIsRangePicking] = useState(false)
  const [rangeSelectionAnchor, setRangeSelectionAnchor] = useState<Date | null>(null)
  const [dailySelectionNotice, setDailySelectionNotice] = useState<string | null>(null)

  const [locationSuggestions, setLocationSuggestions] = useState<OSMPlace[]>([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [postedJob, setPostedJob] = useState<PostedJobPreview | null>(null)

  const workersNeededNumber = Number.parseInt(workersNeeded, 10) || 0
  const incomeNumber = Number.parseInt(income, 10) || 0

  const selectedContractStartDate = contractStartDate ? parseDDMMYYYYToDate(contractStartDate) ?? undefined : undefined
  const selectedContractEndDate = contractEndDate ? parseDDMMYYYYToDate(contractEndDate) ?? undefined : undefined
  const normalizedSelectedDailyDates = useMemo(() => mergeAndSortDates(selectedDailyDates), [selectedDailyDates])
  const calendarSelectedDates = useMemo(
    () => normalizedSelectedDailyDates.map((date) => new Date(date)),
    [normalizedSelectedDailyDates],
  )
  const calendarSelectionSignature = useMemo(() => {
    if (!calendarSelectedDates.length) {
      return "empty"
    }
    return calendarSelectedDates.map((date) => date.toISOString()).join("|")
  }, [calendarSelectedDates])
  const selectedDailyDaysCount = normalizedSelectedDailyDates.length
  const selectedDailyRange = selectedDailyDaysCount
    ? {
        first: normalizedSelectedDailyDates[0],
        last: normalizedSelectedDailyDates[selectedDailyDaysCount - 1],
      }
    : null

  const tomorrow = new Date()
  tomorrow.setHours(0, 0, 0, 0)
  tomorrow.setDate(tomorrow.getDate() + 1)

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

  const toDateOnlyString = (dateValue: string) => {
    const parsedDate = parseDDMMYYYYToDate(dateValue)
    if (!parsedDate) return null
    const year = parsedDate.getFullYear()
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0")
    const day = String(parsedDate.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const toDateOnlyFromDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
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

  const toggleRangeSelectionMode = () => {
    setIsRangePicking((prev) => {
      if (prev) {
        setRangeSelectionAnchor(null)
      }
      return !prev
    })
  }

  const handleDailyCalendarDayClick = (
    day: Date,
    modifiers: { disabled?: boolean },
  ) => {
    if (modifiers.disabled) {
      return
    }

    const normalizedDay = normalizeDay(day)

    if (isRangePicking) {
      if (!rangeSelectionAnchor) {
        const isAlreadySelected = normalizedSelectedDailyDates.some((date) => isSameDay(date, normalizedDay))

        if (!isAlreadySelected) {
          setSelectedDailyDates((current) => {
            if (current.some((date) => isSameDay(date, normalizedDay))) {
              return current
            }
            return mergeAndSortDates([...current, normalizedDay])
          })
        }

        setRangeSelectionAnchor(normalizedDay)
        return
      }

      const [rangeStart, rangeEnd] =
        rangeSelectionAnchor.getTime() <= normalizedDay.getTime()
          ? [rangeSelectionAnchor, normalizedDay]
          : [normalizedDay, rangeSelectionAnchor]

      const rangeDates = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
      
      setSelectedDailyDates((current) => mergeAndSortDates([...current, ...rangeDates]))
      setRangeSelectionAnchor(null)
      setIsRangePicking(false)
      return
    }

    setSelectedDailyDates((current) => {
      const alreadySelected = current.some((date) => isSameDay(date, normalizedDay))
      if (alreadySelected) {
        return current.filter((date) => !isSameDay(date, normalizedDay))
      }
      return mergeAndSortDates([...current, normalizedDay])
    })
  }

  const removeSelectedDailyDate = (dateToRemove: Date) => {
    setSelectedDailyDates((current) => {
      if (!current.some((date) => isSameDay(date, dateToRemove))) {
        return current
      }

      return current.filter((date) => !isSameDay(date, dateToRemove))
    })
  }

  const clearAllSelectedDailyDates = () => {
    setSelectedDailyDates([])
    setRangeSelectionAnchor(null)
    setIsRangePicking(false)
    setDailySelectionNotice(null)
  }

  const validateBeforePreview = () => {
    if (!title.trim()) {
      return "Vui lòng nhập tiêu đề công việc."
    }

    if (!description.trim()) {
      return "Vui lòng nhập mô tả chi tiết."
    }

    if (!incomeNumber || incomeNumber < 1) {
      return "Vui lòng nhập thu nhập hợp lệ."
    }

    if (!location.trim()) {
      return "Vui lòng nhập địa điểm làm việc."
    }

    if (!selectedFarmId) {
      return "Vui lòng chọn địa điểm."
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
      if (selectedDailyDaysCount < 1) {
        return "Vui lòng chọn ít nhất một ngày làm việc trên lịch."
      }

      if (!workersNeededNumber || workersNeededNumber < 1) {
        return "Vui lòng nhập số lượng nhân công hợp lệ cho công việc theo ngày."
      }

      if (!dailyStartTime || !dailyEndTime) {
        return "Vui lòng nhập giờ làm việc theo ngày."
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

      const now = new Date()
      const nowISO = now.toISOString()
      const nowDateOnly = toDateOnlyFromDate(now)

      let startDate = nowDateOnly
      let endDate = nowDateOnly
      let estimatedHours = 1
      let startTime = "07:00:00"
      let endTime = "17:00:00"

      const formatTimeOnly = (timeStr: string) => {
        if (!timeStr) return "00:00:00"
        return timeStr.length === 5 ? `${timeStr}:00` : timeStr
      }

      if (scheduleType === "contract") {
        const startOnly = toDateOnlyString(contractStartDate)
        const endOnly = toDateOnlyString(contractEndDate)

        if (!startOnly || !endOnly) {
          setSubmitError("Vui lòng nhập ngày theo định dạng dd/mm/yyyy.")
          return
        }

        startDate = startOnly
        endDate = endOnly
        estimatedHours = toContractEstimatedHours(startOnly, endOnly)
        // Default working hours for contract if daily is not used
        startTime = formatTimeOnly(dailyStartTime || "09:00")
        endTime = formatTimeOnly(dailyEndTime || "17:00")
      } else {
        if (!normalizedSelectedDailyDates.length) {
          setSubmitError("Vui lòng chọn ít nhất một ngày làm việc trên lịch.")
          return
        }

        const sortedDates = normalizedSelectedDailyDates
        const start = sortedDates[0]
        const end = sortedDates[sortedDates.length - 1]

        startDate = toDateOnlyFromDate(start)
        endDate = toDateOnlyFromDate(end)
        estimatedHours = toDailyEstimatedHours(dailyStartTime, dailyEndTime, sortedDates.length)
        startTime = formatTimeOnly(dailyStartTime)
        endTime = formatTimeOnly(dailyEndTime)
      }

      const descriptionParts = [
        description.trim(),
        requirements.length ? `Yêu cầu: ${requirements.join(", ")}` : "",
        benefits.length ? `Quyền lợi: ${benefits.join(", ")}` : "",
        scheduleType === "daily"
          ? `Lịch làm: ${selectedDailyDaysCount} ngày, ${dailyStartTime} - ${dailyEndTime}`
          : `Lịch làm: ${formatDateDDMMYYYY(contractStartDate)} - ${formatDateDDMMYYYY(contractEndDate)}`,
      ].filter(Boolean)

      const jobTypeId = scheduleType === "daily" ? JOB_TYPE_DAILY_ID : JOB_TYPE_CONTRACT_ID

      const payload: CreateJobRequest = {
        skillIds: selectedSkillIds,
        farmId: selectedFarmId || DEFAULT_FARM_ID,
        jobCategoryId: selectedJobCategoryId || DEFAULT_JOB_CATEGORY_ID,
        jobTypeId,
        title: title.trim(),
        description: descriptionParts.join("\n"),
        address: location.trim(),
        startDate,
        endDate,
        startTime,
        endTime,
        selectedDays: normalizedSelectedDailyDates.map(date => toDateOnlyFromDate(date)),
        requirements,
        privileges: benefits,
        wageAmount: incomeNumber,
         workersNeeded: workersNeededNumber,
         workersAccepted: 0,
        publishedAt: nowISO,
        createdAt: nowISO,
        updatedAt: nowISO,
        isUrgent,
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
        workersNeeded:
          createdJob.workersNeeded ?? (scheduleType === "daily" ? workersNeededNumber : 1),
        location: createdJob.address ?? location.trim(),
        locationLat,
        locationLng,
        requirements,
        skills: selectedSkillIds.map((skillId) => getSkillLabel(skillId)),
        benefits,
        scheduleType,
        contractStartDate: scheduleType === "contract" ? contractStartDate : undefined,
        contractEndDate: scheduleType === "contract" ? contractEndDate : undefined,
        daysToHire: scheduleType === "daily" ? selectedDailyDaysCount : undefined,
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
    setIsUrgent(DEFAULT_IS_URGENT)
    setScheduleType("contract")
    setContractStartDate("")
    setContractEndDate("")
    setDailyStartTime("09:00")
    setDailyEndTime("17:00")
    clearAllSelectedDailyDates()
    setSubmitError(null)
    setPostedJob(null)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-full h-10 w-10 border-muted-foreground/20">
            <Link href="/farmer/jobs">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Đăng tin tuyển dụng</h1>
            <p className="text-muted-foreground mt-1">
              Tạo công việc mới và tìm kiếm nhân sự phù hợp cho nông trại của bạn.
            </p>
          </div>
        </div>
        
        {!postedJob && (
          <div className="flex items-center rounded-lg border bg-card p-1 shadow-sm">
            <div 
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md transition-all", 
                step === 1 ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-xs font-bold">1</span>
              <span className="text-sm font-medium">Soạn thảo</span>
            </div>
            <div 
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md transition-all", 
                step === 2 ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-xs font-bold">2</span>
              <span className="text-sm font-medium">Xác nhận</span>
            </div>
          </div>
        )}
      </div>

      {postedJob ? (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10 overflow-hidden">
          <div className="h-2 bg-green-500 w-full" />
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-3 rounded-full text-green-600 dark:bg-green-900 dark:text-green-400">
                <CheckCheck className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl text-green-700 dark:text-green-400">Đăng tin thành công!</CardTitle>
                <CardDescription className="text-base text-green-600/80 dark:text-green-400/80">
                  Tin tuyển dụng của bạn đã được công khai. Ứng viên sẽ sớm liên hệ với bạn.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div className="rounded-xl border bg-background/80 p-6 shadow-sm backdrop-blur-sm">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1 border-l-4 border-primary pl-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Tiêu đề công việc</span>
                  <p className="font-semibold text-lg">{postedJob.title}</p>
                </div>
                <div className="space-y-1 border-l-4 border-green-500 pl-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Mức thu nhập</span>
                  <p className="font-semibold text-lg text-green-600 dark:text-green-400">{formatCurrency(postedJob.income)}</p>
                </div>
                <div className="space-y-1 border-l-4 border-orange-400 pl-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Thời gian làm việc</span>
                  <p className="font-medium">
                    {postedJob.scheduleType === "contract"
                      ? `${formatDateDDMMYYYY(postedJob.contractStartDate ?? "")} - ${formatDateDDMMYYYY(postedJob.contractEndDate ?? "")}`
                      : `${postedJob.daysToHire} ngày, ${postedJob.dailyStartTime?.slice(0, 5)} - ${postedJob.dailyEndTime?.slice(0, 5)}`
                    }
                  </p>
                </div>
                <div className="space-y-1 border-l-4 border-blue-400 pl-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Địa điểm</span>
                  <p className="font-medium truncate" title={postedJob.location}>{postedJob.location}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <Button variant="outline" size="lg" asChild className="border-green-200 hover:bg-green-50 text-green-700 dark:border-green-800 dark:hover:bg-green-900/20">
                <Link href="/farmer/jobs">Quản lý tin đăng</Link>
              </Button>
              <Button size="lg" onClick={resetAll} className="bg-green-600 hover:bg-green-700 text-white shadow-md">
                <Plus className="mr-2 h-4 w-4" /> Đăng tin khác
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {step === 1 ? (
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Left Column (8 cols) */}
              <div className="lg:col-span-7  space-y-8">
                 {/* Card 1: Job Info */}
                 <Card className="overflow-hidden border-t-4 border-t-primary shadow-md">
                   <CardHeader className="bg-muted/10 pb-4">
                     <CardTitle className="flex items-center gap-2 text-xl">
                       <Briefcase className="h-5 w-5 text-primary" />
                       Thông tin công việc
                     </CardTitle>
                     <CardDescription>Mô tả chi tiết công việc để ứng viên hiểu rõ hơn.</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-6 pt-6">
                      <div className="space-y-3">
                        <Label htmlFor="job-title" className="text-base font-semibold">
                          Tiêu đề tin đăng <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="job-title"
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          placeholder="Ví dụ: Cần 5 người thu hoạch dưa lưới tại vườn C1"
                          className="text-lg py-6 shadow-sm border-muted-foreground/30 focus-visible:border-primary"
                        />
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                            <Label className="font-semibold">Danh mục công việc <span className="text-destructive">*</span></Label>
                            <Popover open={isJobCategoryPopoverOpen} onOpenChange={setIsJobCategoryPopoverOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between h-11 border-muted-foreground/30"
                                >
                                  {selectedJobCategoryLabel || (isLoadingJobCategories ? "Đang tải..." : "Chọn danh mục")}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0" align="start">
                                 <Command>
                                    <CommandInput placeholder="Tìm kiếm danh mục..." />
                                    <CommandList>
                                       <CommandEmpty>Không tìm thấy.</CommandEmpty>
                                       <CommandGroup heading="Các danh mục phổ biến">
                                          {jobCategories.map((category) => (
                                             <CommandItem
                                                key={category.id}
                                                value={category.name}
                                                onSelect={() => {
                                                   setSelectedJobCategoryId(category.id)
                                                   setIsJobCategoryPopoverOpen(false)
                                                }}
                                             >
                                                <Check className={cn("mr-2 h-4 w-4 text-primary", selectedJobCategoryId === category.id ? "opacity-100" : "opacity-0")} />
                                                {category.name}
                                             </CommandItem>
                                          ))}
                                       </CommandGroup>
                                    </CommandList>
                                 </Command>
                              </PopoverContent>
                            </Popover>
                        </div>
                        
                        <div className="space-y-3">
                            <Label className="font-semibold flex items-center justify-between">
                               <span>Độ khẩn cấp</span>
                               {/* <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Tăng lượt xem</span> */}
                            </Label>
                            <div className="flex items-center justify-between rounded-lg border border-muted-foreground/30 p-3 h-11">
                                <span className="text-sm">Tuyển gấp</span>
                                <Switch checked={isUrgent} onCheckedChange={setIsUrgent} />
                            </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="job-description" className="font-semibold">Mô tả chi tiết <span className="text-destructive">*</span></Label>
                        <textarea
                          id="job-description"
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                          className="flex min-h-[150px] w-full rounded-md border border-muted-foreground/30 bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                          placeholder="Mô tả công việc cụ thể, yêu cầu sức khỏe, môi trường làm việc..."
                        />
                      </div>
                   </CardContent>
                 </Card>

                 {/* Card 2: Requirements & Stats */}
                 <div className="grid gap-8 md:grid-cols-2">
                    <Card className="shadow-md">
                        <CardHeader className="bg-muted/10 pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Award className="h-5 w-5 text-orange-500" />
                                Kỹ năng & Kinh nghiệm
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <p className="text-sm text-muted-foreground">Chọn các kỹ năng ứng viên cần có:</p>
                            <div className="grid grid-cols-1 gap-2">
                                {availableSkills.map((skill) => (
                                   <div
                                     key={skill.id}
                                     onClick={() => toggleSkill(skill.id)}
                                     className={cn(
                                       "flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-all",
                                       selectedSkillIds.includes(skill.id) ? "border-primary bg-primary/5 shadow-sm" : "border-border"
                                     )}
                                   >
                                     <Checkbox
                                       id={`skill-${skill.id}`}
                                       checked={selectedSkillIds.includes(skill.id)}
                                       onCheckedChange={() => toggleSkill(skill.id)}
                                       className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                     />
                                     <span className="text-sm font-medium">{skill.name}</span>
                                   </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md flex flex-col">
                        <CardHeader className="bg-muted/10 pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-500" />
                                Yêu cầu & Quyền lợi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-6 flex-1">
                             <div className="space-y-3">
                                 <Label className="text-sm font-semibold text-muted-foreground uppercase">Yêu cầu bổ sung</Label>
                                 <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Input 
                                           value={newRequirement} 
                                           onChange={(e) => setNewRequirement(e.target.value)}
                                           onKeyDown={handleRequirementKeyDown}
                                           placeholder="Thêm yêu cầu..." 
                                           className="h-9 text-sm"
                                        />
                                        <Button size="sm" variant="secondary" onClick={addRequirement} type="button">
                                           <Plus className="h-4 w-4" />
                                        </Button>
                                     </div>
                                     <div className="flex flex-wrap gap-2 min-h-[30px]">
                                        {requirements.map((item, index) => (
                                          <Badge key={`req-${index}`} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                                            {item}
                                            <button onClick={() => setRequirements(prev => prev.filter((_, i) => i !== index))} className="rounded-full hover:bg-destructive hover:text-white p-0.5 transition-colors">
                                               <X className="h-3 w-3" />
                                            </button>
                                          </Badge>
                                        ))}
                                     </div>
                                 </div>
                             </div>

                             <div className="space-y-3 pt-2 border-t">
                                 <Label className="text-sm font-semibold text-muted-foreground uppercase">Quyền lợi</Label>
                                 <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Input 
                                           value={newBenefit} 
                                           onChange={(e) => setNewBenefit(e.target.value)}
                                           onKeyDown={handleBenefitKeyDown}
                                           placeholder="Thêm quyền lợi..." 
                                           className="h-9 text-sm"
                                        />
                                        <Button size="sm" variant="secondary" onClick={addBenefit} type="button">
                                           <Plus className="h-4 w-4" />
                                        </Button>
                                     </div>
                                     <div className="flex flex-wrap gap-2 min-h-[30px]">
                                        {benefits.map((item, index) => (
                                          <Badge key={`ben-${index}`} variant="outline" className="pl-2 pr-1 py-1 gap-1 border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
                                            {item}
                                            <button onClick={() => setBenefits(prev => prev.filter((_, i) => i !== index))} className="rounded-full hover:bg-destructive hover:text-white p-0.5 transition-colors">
                                               <X className="h-3 w-3" />
                                            </button>
                                          </Badge>
                                        ))}
                                     </div>
                                 </div>
                             </div>
                        </CardContent>
                    </Card>
                 </div>
              </div>

              {/* Right Column (4 cols) - Sticky */}
              <div className="lg:col-span-5 space-y-6">
                 {/* Schedule Card */}
                 <Card className="shadow-md border-t-4 border-t-purple-500">
                    <CardHeader className="bg-muted/10 pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarRange className="h-5 w-5 text-purple-600" />
                        Lịch làm việc
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                       <div className="grid grid-cols-2 gap-3 p-1 bg-muted rounded-lg">
                           <button 
                             type="button"
                             onClick={() => setScheduleType("contract")}
                             className={cn(
                               "py-2 px-3 text-sm font-medium rounded-md transition-all duration-200",
                               scheduleType === "contract" ? "bg-background text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-background/50"
                             )}
                           >
                             Khoán việc
                           </button>
                           <button
                             type="button"
                             onClick={() => setScheduleType("daily")}
                             className={cn(
                               "py-2 px-3 text-sm font-medium rounded-md transition-all duration-200",
                               scheduleType === "daily" ? "bg-background text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-background/50"
                             )}
                           >
                             Theo ngày
                           </button>
                       </div>

                       {scheduleType === "contract" ? (
                          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                             <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Ngày bắt đầu</Label>
                                <div className="relative">
                                   <Input value={contractStartDate} onChange={(e) => setContractStartDate(e.target.value)} placeholder="dd/mm/yyyy" className="pl-10" />
                                   <Popover>
                                     <PopoverTrigger asChild>
                                       <Button type="button" variant="ghost" size="icon" className="absolute left-0 top-0 h-10 w-10 text-muted-foreground"><CalendarIcon className="h-4 w-4" /></Button>
                                     </PopoverTrigger>
                                     <PopoverContent className="w-auto p-0" align="start">
                                         <Calendar mode="single" selected={selectedContractStartDate} onSelect={handleContractStartSelect} disabled={(d) => d < tomorrow} initialFocus />
                                     </PopoverContent>
                                   </Popover>
                                </div>
                             </div>
                             <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Ngày kết thúc</Label>
                                <div className="relative">
                                   <Input value={contractEndDate} onChange={(e) => setContractEndDate(e.target.value)} placeholder="dd/mm/yyyy" className="pl-10" />
                                   <Popover>
                                     <PopoverTrigger asChild>
                                       <Button type="button" variant="ghost" size="icon" className="absolute left-0 top-0 h-10 w-10 text-muted-foreground"><CalendarIcon className="h-4 w-4" /></Button>
                                     </PopoverTrigger>
                                     <PopoverContent className="w-auto p-0" align="start">
                                         <Calendar mode="single" selected={selectedContractEndDate} onSelect={handleContractEndSelect} disabled={(d) => d < tomorrow || (selectedContractStartDate ? d < selectedContractStartDate : false)} initialFocus />
                                     </PopoverContent>
                                   </Popover>
                                </div>
                             </div>
                          </div>
                       ) : (
                          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                             <div className="rounded-lg border bg-card p-3 shadow-inner">
                                <div className="mb-3 flex items-center justify-between">
                                   <Label className="text-xs font-bold">CHỌN NGÀY</Label>
                                   <div className="flex gap-1">
                                      <Button type="button" size="sm" variant={isRangePicking ? "default" : "outline"} className="h-6 text-[10px] px-2" onClick={toggleRangeSelectionMode}>
                                         {isRangePicking ? "Chọn đích" : "Khoảng"}
                                      </Button>
                                      <Button type="button" size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-destructive" onClick={clearAllSelectedDailyDates} disabled={selectedDailyDaysCount === 0}>
                                         Xóa
                                      </Button>
                                   </div>
                                </div>
                                <div className="flex justify-center bg-background rounded-md p-1">
                                   <Calendar
                                      key={calendarSelectionSignature}
                                      mode="multiple"
                                      selected={calendarSelectedDates}
                                      onDayClick={handleDailyCalendarDayClick}
                                      disabled={(d) => d < tomorrow}
                                      className="rounded-md scale-90 origin-top p-0 w-full"
                                   />
                                </div>
                                <div className="mt-2 text-center">
                                   <Badge variant="secondary" className="font-normal">
                                      {selectedDailyDaysCount > 0 ? `Đã chọn ${selectedDailyDaysCount} ngày` : "Chưa chọn ngày"}
                                   </Badge>
                                </div>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                   <Label className="text-[10px] uppercase text-muted-foreground font-bold">Giờ bắt đầu</Label>
                                   <TimePicker value={dailyStartTime} onChange={setDailyStartTime} />
                                </div>
                                <div className="space-y-1">
                                   <Label className="text-[10px] uppercase text-muted-foreground font-bold">Giờ kết thúc</Label>
                                   <TimePicker value={dailyEndTime} onChange={setDailyEndTime} />
                                </div>
                             </div>

                             <div className="space-y-2 pt-2 border-t">
                                <Label className="flex justify-between">
                                   <span>Số người cần</span>
                                   <span className="font-bold text-primary">{workersNeeded}</span>
                                </Label>
                                <Input type="number" min="1" value={workersNeeded} onChange={(e) => setWorkersNeeded(e.target.value)} />
                             </div>
                          </div>
                       )}
                    </CardContent>
                 </Card>

                 {/* Location Card */}
                 <Card className="shadow-md border-t-4 border-t-teal-500">
                    <CardHeader className="bg-muted/10 pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-teal-600" />
                        Địa điểm & Thù lao
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-7 pt-6">
                       <div className="space-y-2">
                          <Label className="font-semibold">Mức công (VNĐ)</Label>
                          <div className="relative">
                             <div className="absolute left-3 top-2.5 text-muted-foreground"><DollarSign className="h-4 w-4" /></div>
                             <Input 
                                type="number" 
                                min="0" 
                                value={income} 
                                onChange={(e) => setIncome(e.target.value)} 
                                className="pl-9 text-lg font-medium text-teal-700 dark:text-teal-400" 
                                placeholder="300,000" 
                             />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <Label>Trang trại</Label>
                          <Popover open={isFarmPopoverOpen} onOpenChange={setIsFarmPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between" disabled={isLoadingFarms}>
                                <span className="truncate">{selectedFarmLabel || "Chọn trang trại"}</span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] p-0" align="start">
                               <Command>
                                  <CommandInput placeholder="Tìm trang trại..." />
                                  <CommandList>
                                     <CommandEmpty>Không tìm thấy.</CommandEmpty>
                                     <CommandGroup>
                                        {farms.map((farm) => {
                                           const fId = farm.farmId || (farm as any).id
                                           return (
                                              <CommandItem
                                                 key={fId}
                                                 value={farm.locationName ?? farm.address ?? fId}
                                                 onSelect={() => {
                                                    setSelectedFarmId(fId)
                                                    setIsFarmPopoverOpen(false)
                                                    if (farm.address) setLocation(farm.address)
                                                    if (farm.latitude && farm.longitude) {
                                                       setLocationLat(farm.latitude)
                                                       setLocationLng(farm.longitude)
                                                    }
                                                 }}
                                              >
                                                 <Check className={cn("mr-2 h-4 w-4", selectedFarmId === fId ? "opacity-100" : "opacity-0")} />
                                                 <div className="flex flex-col overflow-hidden">
                                                    <span className="truncate">{farm.locationName}</span>
                                                    <span className="text-xs text-muted-foreground truncate">{farm.address}</span>
                                                 </div>
                                              </CommandItem>
                                           )
                                        })}
                                     </CommandGroup>
                                  </CommandList>
                               </Command>
                            </PopoverContent>
                          </Popover>
                       </div>

                       <div className="space-y-2">
                          <Label>Địa chỉ chi tiết</Label>
                          <Input value={location} onChange={(e) => { setLocation(e.target.value); setLocationLat(undefined); setLocationLng(undefined); }} placeholder="Nhập địa chỉ..." />
                          {/* Search suggestions dropdown */}
                          {(isSearchingLocation || locationSuggestions.length > 0) && (
                              <div className="absolute z-50 mt-1 max-h-60 w-[85%] overflow-auto rounded-md border bg-popover p-1 shadow-md">
                                {locationSuggestions.map((place) => (
                                   <div key={place.place_id} onClick={() => selectOSMLocation(place)} className="cursor-pointer truncate rounded px-2 py-1.5 text-xs hover:bg-muted">
                                      {place.display_name}
                                   </div>
                                ))}
                              </div>
                          )}
                       </div>

                       <div className="h-40 w-full overflow-hidden rounded-md border bg-muted/20 relative">
                          {locationLat && locationLng ? (
                             <iframe title="Map" src={buildOSMEmbedUrl(locationLat, locationLng)} className="h-full w-full" loading="lazy" />
                          ) : (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                <MapPinned className="h-8 w-8 mb-2 opacity-30" />
                                <span className="text-xs text-center px-4">Bản đồ hiển thị khi có tọa độ</span>
                             </div>
                          )}
                       </div>
                    </CardContent>
                 </Card>
              </div>

              {/* Action Bar */}
              <div className="lg:col-span-12 sticky bottom-4 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="text-sm text-muted-foreground">
                    {submitError ? (
                        <span className="flex items-center text-destructive font-semibold"><Info className="mr-2 h-4 w-4" /> {submitError}</span>
                    ) : (
                        <span>Vui lòng điền đầy đủ thông tin có dấu <span className="text-destructive">*</span></span>
                    )}
                 </div>
                 <div className="flex gap-3 w-full sm:w-auto">
                   <Button type="button" variant="outline" asChild className="flex-1 sm:flex-none">
                      <Link href="/farmer/jobs">Hủy bỏ</Link>
                   </Button>
                   <Button type="button" onClick={goToPreview} className="flex-1 sm:flex-none min-w-[150px] shadow-sm">
                      Xem trước tin đăng <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                   </Button>
                 </div>
              </div>
            </div>
          ) : (
             /* Step 2: Preview */
             <div className="max-w-4xl mx-auto space-y-8 pb-10">
                <Card className="shadow-lg border-2 border-primary/10">
                   <CardHeader className="bg-muted/30 border-b pb-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div>
                            <CardTitle className="text-2xl">Xác nhận thông tin</CardTitle>
                            <CardDescription>Vui lòng kiểm tra kỹ nội dung tin tuyển dụng trước khi đăng công khai.</CardDescription>
                         </div>
                         <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("px-3 py-1 font-normal", isUrgent ? "bg-red-100 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200")}>
                               {isUrgent ? "🔥 Tuyển gấp" : "Tiêu chuẩn"}
                            </Badge>
                         </div>
                      </div>
                   </CardHeader>
                   <CardContent className="space-y-8 pt-8 px-6 md:px-10">
                      {/* Job Status Banner */}
                      <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                         <h3 className="text-2xl font-bold text-foreground mb-4">{title}</h3>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                               <p className="text-xs font-semibold text-muted-foreground uppercase">Mức lương</p>
                               <div className="flex items-center font-medium text-primary"><DollarSign className="mr-1 h-4 w-4" /> {formatCurrency(incomeNumber)}</div>
                            </div>
                            <div className="space-y-1">
                               <p className="text-xs font-semibold text-muted-foreground uppercase">Hình thức</p>
                               <div className="flex items-center font-medium"><CalendarRange className="mr-1 h-4 w-4" /> {scheduleType === "contract" ? "Khoán việc" : "Theo ngày"}</div>
                            </div>
                            <div className="space-y-1">
                               <p className="text-xs font-semibold text-muted-foreground uppercase">Số lượng</p>
                               <div className="flex items-center font-medium"><Users className="mr-1 h-4 w-4" /> {workersNeededNumber} người</div>
                            </div>
                            <div className="space-y-1">
                               <p className="text-xs font-semibold text-muted-foreground uppercase">Địa điểm</p>
                               <div className="flex items-center font-medium truncate" title={selectedFarmLabel}><MapPin className="mr-1 h-4 w-4" /> {selectedFarmLabel}</div>
                            </div>
                         </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-8">
                         <div className="md:col-span-2 space-y-6">
                            <div className="space-y-3">
                               <h4 className="flex items-center text-sm font-bold uppercase text-muted-foreground tracking-wide border-b pb-2">
                                  <AlignLeft className="mr-2 h-4 w-4" /> Chi tiết công việc
                               </h4>
                               <div className="bg-muted/10 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 border">
                                  {description}
                               </div>
                            </div>

                            <div className="space-y-3">
                               <h4 className="flex items-center text-sm font-bold uppercase text-muted-foreground tracking-wide border-b pb-2">
                                  <Award className="mr-2 h-4 w-4" /> Yêu cầu kỹ năng
                               </h4>
                               <div className="flex flex-wrap gap-2">
                                  {selectedSkillIds.length > 0 ? (
                                     selectedSkillIds.map(id => (
                                        <Badge key={id} variant="secondary" className="px-3 py-1">{getSkillLabel(id)}</Badge>
                                     ))
                                  ) : (
                                     <span className="text-sm text-muted-foreground italic">Không yêu cầu kỹ năng đặc biệt</span>
                                  )}
                               </div>
                            </div>
                         </div>

                         <div className="space-y-6">
                            <div className="space-y-3">
                               <h4 className="flex items-center text-sm font-bold uppercase text-muted-foreground tracking-wide border-b pb-2">
                                  <CalendarRange className="mr-2 h-4 w-4" /> Thời gian
                               </h4>
                               <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-900 space-y-2 text-sm">
                                  {scheduleType === "contract" ? (
                                     <>
                                        <div className="flex justify-between"><span>Bắt đầu:</span> <span className="font-semibold">{formatDateDDMMYYYY(contractStartDate)}</span></div>
                                        <div className="flex justify-between"><span>Kết thúc:</span> <span className="font-semibold">{formatDateDDMMYYYY(contractEndDate)}</span></div>
                                     </>
                                  ) : (
                                     <>
                                        <div className="flex justify-between"><span>Số ngày:</span> <span className="font-semibold">{selectedDailyDaysCount} ngày</span></div>
                                        <div className="flex justify-between"><span>Ca làm:</span> <span className="font-semibold">{dailyStartTime} - {dailyEndTime}</span></div>
                                     </>
                                  )}
                               </div>
                            </div>

                            <div className="space-y-3">
                               <h4 className="flex items-center text-sm font-bold uppercase text-muted-foreground tracking-wide border-b pb-2">
                                  <Gift className="mr-2 h-4 w-4" /> Quyền lợi
                               </h4>
                               <div className="flex flex-wrap gap-2">
                                  {benefits.length > 0 ? benefits.map(b => (
                                     <Badge key={b} variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">{b}</Badge>
                                  )) : <span className="text-sm text-muted-foreground">Cơ bản</span>}
                               </div>
                            </div>

                            <div className="space-y-3">
                               <h4 className="flex items-center text-sm font-bold uppercase text-muted-foreground tracking-wide border-b pb-2">
                                  <Info className="mr-2 h-4 w-4" /> Yêu cầu khác
                               </h4>
                               <div className="flex flex-wrap gap-2">
                                  {requirements.length > 0 ? requirements.map(r => (
                                     <Badge key={r} variant="outline">{r}</Badge>
                                  )) : <span className="text-sm text-muted-foreground">Không có</span>}
                               </div>
                            </div>
                         </div>
                      </div>
                   </CardContent>
                   <CardContent className="bg-muted/20 border-t p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                      {submitError && <p className="text-destructive font-semibold flex items-center"><Info className="mr-2 h-4 w-4" /> {submitError}</p>}
                      <div className="flex gap-4 w-full sm:w-auto ml-auto">
                         <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 sm:flex-none">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Chỉnh sửa
                         </Button>
                         <Button type="button" size="lg" onClick={submitJob} disabled={isSubmitting} className="flex-1 sm:flex-none shadow-md min-w-[200px]">
                            {isSubmitting ? "Đang xử lý..." : "Xác nhận & Đăng tin"}
                         </Button>
                      </div>
                   </CardContent>
                </Card>
             </div>
          )}
        </div>
      )}
    </div>
  )
}
