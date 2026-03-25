"use client"

import { type KeyboardEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, CheckCheck, ChevronsUpDown, MapPin, MapPinned, Plus, X, Calendar as CalendarIcon, Briefcase, Banknote, Users, FileText, CalendarRange, CheckSquare, Award, Gift, AlignLeft } from "lucide-react"
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

const MAX_DAILY_RANGE_DAYS = 4
const DAILY_RANGE_WARNING = `Khoảng giữa những ngày được chọn không được dài hơn ${MAX_DAILY_RANGE_DAYS} ngày.`

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

  const [dailyStartTime, setDailyStartTime] = useState("06:00")
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

  const tryUpdateSelectedDailyDates = (computeCandidate: (current: Date[]) => Date[] | null) => {
    let didUpdate = false

    setSelectedDailyDates((current) => {
      const candidate = computeCandidate(current)

      if (!candidate) {
        return current
      }

      const next = mergeAndSortDates(candidate)

      if (next.length && getSelectionSpanInDays(next) > MAX_DAILY_RANGE_DAYS) {
        setDailySelectionNotice(DAILY_RANGE_WARNING)
        return current
      }

      setDailySelectionNotice(null)
      didUpdate = true
      return next
    })

    return didUpdate
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
          const didAdd = tryUpdateSelectedDailyDates((current) => {
            if (current.some((date) => isSameDay(date, normalizedDay))) {
              return null
            }
            return [...current, normalizedDay]
          })

          if (!didAdd) {
            return
          }
        }

        setRangeSelectionAnchor(normalizedDay)
        return
      }

      const [rangeStart, rangeEnd] =
        rangeSelectionAnchor.getTime() <= normalizedDay.getTime()
          ? [rangeSelectionAnchor, normalizedDay]
          : [normalizedDay, rangeSelectionAnchor]

      const rangeDates = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
      const didApplyRange = tryUpdateSelectedDailyDates((current) => [...current, ...rangeDates])

      if (didApplyRange) {
        setRangeSelectionAnchor(null)
        setIsRangePicking(false)
      }
      return
    }

    tryUpdateSelectedDailyDates((current) => {
      const alreadySelected = current.some((date) => isSameDay(date, normalizedDay))
      if (alreadySelected) {
        return current.filter((date) => !isSameDay(date, normalizedDay))
      }
      return [...current, normalizedDay]
    })
  }

  const removeSelectedDailyDate = (dateToRemove: Date) => {
    tryUpdateSelectedDailyDates((current) => {
      if (!current.some((date) => isSameDay(date, dateToRemove))) {
        return null
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
      if (!normalizedSelectedDailyDates.length) {
        setSubmitError("Vui lòng chọn ít nhất một ngày làm việc trên lịch.")
        return
      }

      const sortedDates = normalizedSelectedDailyDates
      const start = sortedDates[0]
      const end = sortedDates[sortedDates.length - 1]

      startDate = start.toISOString()
      endDate = end.toISOString()
      estimatedHours = toDailyEstimatedHours(dailyStartTime, dailyEndTime, sortedDates.length)
    }

    const descriptionParts = [
      description.trim(),
      requirements.length ? `Yêu cầu: ${requirements.join(", ")}` : "",
      benefits.length ? `Quyền lợi: ${benefits.join(", ")}` : "",
      scheduleType === "daily"
        ? `Lịch làm: ${selectedDailyDaysCount} ngày, ${dailyStartTime} - ${dailyEndTime}`
        : `Lịch làm: ${formatDateDDMMYYYY(contractStartDate)} - ${formatDateDDMMYYYY(contractEndDate)}`,
    ].filter(Boolean)

    const payload: CreateJobRequest = {
      skillIds: selectedSkillIds,
      requiredSkills: selectedSkillIds,
      farmId: selectedFarmId || DEFAULT_FARM_ID,
      jobCategoryId: selectedJobCategoryId || DEFAULT_JOB_CATEGORY_ID,
      title: title.trim(),
      description: descriptionParts.join("\n"),
      address: location.trim(),
      startDate,
      endDate,
      selectedDays: normalizedSelectedDailyDates.map(date => date.toISOString()),
      estimatedHours,
      workersNeeded: scheduleType === "daily" ? workersNeededNumber : 1,
      workersAccepted: 0,
      jobTypeId: scheduleType === "daily" ? 1 : 2,
      wageTypeId: DEFAULT_WAGE_TYPE_ID,
      wageAmount: incomeNumber,
      requirements,
      privileges: benefits,
      paymentMethodId: DEFAULT_PAYMENT_METHOD_ID,
      genderPreference: DEFAULT_GENDER_PREFERENCE,
      publishedAt: nowISO,
      createdAt: nowISO,
      updatedAt: nowISO,
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
    setScheduleType("contract")
    setContractStartDate("")
    setContractEndDate("")
    setDailyStartTime("06:00")
    setDailyEndTime("17:00")
    clearAllSelectedDailyDates()
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
              <Card>
                <CardHeader>
                  <CardTitle>Loại hình công việc</CardTitle>
                  <CardDescription>Chọn loại hình khoán hoặc ngày trước khi điền thông tin chi tiết.</CardDescription>
                </CardHeader>
                <CardContent>
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
                        <p className="font-medium">Khoán</p>
                        <p className="text-sm text-muted-foreground">
                          Chỉ cần điền ngày bắt đầu và ngày kết thúc.
                        </p>
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
                        <p className="font-medium">Ngày</p>
                        <p className="text-sm text-muted-foreground">
                          Chọn những ngày bạn muốn thuê và giờ làm việc cụ thể cho từng ngày.
                        </p>
                      </div>
                    </label>
                  </RadioGroup>
                </CardContent>
              </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Thời gian làm việc</CardTitle>
                    <CardDescription>Nhập thời gian theo loại hình bạn đã chọn.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                                  disabled={(date) => date < tomorrow}
                                  locale={vi}
                                  className="[--cell-size:2.5rem]"
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
                                    date < tomorrow || (selectedContractStartDate ? date < selectedContractStartDate : false)
                                  }
                                  locale={vi}
                                  className="[--cell-size:2.5rem]"
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 rounded-lg border p-4">
                        <div className="space-y-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Label className="text-sm font-medium">Chọn ngày làm việc *</Label>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" variant={isRangePicking ? "default" : "outline"} onClick={toggleRangeSelectionMode}>
                                {isRangePicking
                                  ? rangeSelectionAnchor
                                    ? "Chọn ngày kết thúc"
                                    : "Chọn ngày bắt đầu"
                                  : "Chọn nhanh theo khoảng"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={clearAllSelectedDailyDates}
                                disabled={!selectedDailyDaysCount}
                              >
                                Xóa tất cả
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Bấm từng ngày để thêm/bỏ. Dùng nút trên để chọn nhanh một khoảng liên tiếp.
                          </p>
                          {dailySelectionNotice ? (
                            <p className="text-sm text-destructive">{dailySelectionNotice}</p>
                          ) : null}
                          {isRangePicking && rangeSelectionAnchor ? (
                            <p className="text-xs text-primary">Đã chọn ngày bắt đầu: {format(rangeSelectionAnchor, "dd/MM/yyyy")}</p>
                          ) : null}
                          <div className="flex justify-center rounded-lg border bg-card p-3 shadow-sm">
                            <Calendar
                              key={calendarSelectionSignature}
                              mode="multiple"
                              selected={calendarSelectedDates}
                              onDayClick={handleDailyCalendarDayClick}
                              disabled={(date) => date < tomorrow}
                              locale={vi}
                              className="pointer-events-auto w-full max-w-[520px] [--cell-size:2.75rem]"
                            />
                          </div>
                          {selectedDailyDaysCount > 0 ? (
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                              <span>
                                {selectedDailyRange
                                  ? `Đã chọn ${selectedDailyDaysCount} ngày, từ ${format(selectedDailyRange.first, "dd/MM")} đến ${format(selectedDailyRange.last, "dd/MM")}.`
                                  : `Đã chọn ${selectedDailyDaysCount} ngày.`}
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {normalizedSelectedDailyDates.map((date) => (
                                  <Badge key={date.toISOString()} variant="secondary" className="flex items-center gap-1">
                                    {format(date, "dd/MM")}
                                    <button
                                      type="button"
                                      className="rounded-full p-0.5 text-muted-foreground/70 hover:bg-muted hover:text-foreground"
                                      onClick={(event) => {
                                        event.preventDefault()
                                        event.stopPropagation()
                                        removeSelectedDailyDate(date)
                                      }}
                                      aria-label="Bỏ ngày"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Chưa chọn ngày nào.</p>
                          )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="daily-start">Giờ bắt đầu *</Label>
                            <div className="mt-2">
                              <TimePicker
                                value={dailyStartTime}
                                onChange={setDailyStartTime}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="daily-end">Giờ kết thúc *</Label>
                            <div className="mt-2">
                              <TimePicker
                                value={dailyEndTime}
                                onChange={setDailyEndTime}
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="workers-needed-daily">Số người cần thuê *</Label>
                          <Input
                            id="workers-needed-daily"
                            type="number"
                            min="1"
                            value={workersNeeded}
                            onChange={(event) => setWorkersNeeded(event.target.value)}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

              <div className="space-y-6">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Chi tiết công việc</CardTitle>
                    <CardDescription>Tiêu đề, danh mục, thu nhập và địa điểm làm việc.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="job-title">Tiêu đề *</Label>
                      <Input
                        id="job-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="VD: Thu hoạch dưa lưới nhà màng C1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="job-description">Mô tả chi tiết *</Label>
                      <textarea
                        id="job-description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Mô tả các công việc cần làm, môi trường làm việc..."
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

                    <div className="grid gap-4">
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
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label htmlFor="farm-select">Chọn địa điểm *</Label>
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
                            <span>{selectedFarmLabel || (isLoadingFarms ? "Đang tải..." : "Chọn địa điểm")}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          {isLoadingFarms ? (
                            <div className="p-4 text-sm text-muted-foreground">Đang tải địa điểm...</div>
                          ) : farms.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground">Chưa có địa điểm khả dụng.</div>
                          ) : (
                            <Command>
                              <CommandInput placeholder="Tìm địa điểm..." />
                              <CommandList>
                                <CommandEmpty>Không tìm thấy địa điểm phù hợp.</CommandEmpty>
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
                              <div className="max-h-50 overflow-auto space-y-1">
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
                            <p>Chọn địa điểm hoặc nhập địa điểm để xem bản đồ</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <CardDescription>* là những mục cần thiết.</CardDescription>
                  </CardContent>
                </Card>
              </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Kỹ năng</CardTitle>
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

              <Card>
                <CardHeader>
                  <CardTitle>Yêu cầu</CardTitle>
                  <CardDescription>
                    Bạn có thể tự thêm yêu cầu (dụng cụ, độ tuổi, giới tính, điều kiện khác...).
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
              </Card>



              <Card>
                <CardHeader>
                  <CardTitle>Quyền lợi</CardTitle>
                  <CardDescription>Bạn có thể tự thêm quyền lợi (bao ăn, nghỉ 15 phút, hỗ trợ đi lại...).</CardDescription>
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
              </Card>

              

              {submitError ? <p className="text-sm font-medium text-destructive">{submitError}</p> : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                  <Link href="/ /jobs">Hủy</Link>
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
              <CardContent className="space-y-6">
                <div className="grid gap-6 rounded-xl border bg-slate-50/50 p-6 text-sm sm:grid-cols-2 dark:bg-slate-900/50">
                  <div className="col-span-1 space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Tiêu đề</span>
                    </div>
                    <p className="pl-6 text-base font-semibold">{title}</p>
                  </div>

                  <div className="col-span-1 space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlignLeft className="h-4 w-4" />
                      <span className="font-medium">Mô tả</span>
                    </div>
                    <p className="whitespace-pre-wrap pl-6 text-muted-foreground">{description}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Banknote className="h-4 w-4" />
                      <span className="font-medium">Thu nhập</span>
                    </div>
                    <p className="pl-6 font-semibold text-primary">{formatCurrency(incomeNumber)}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Số nhân công cần</span>
                    </div>
                    <p className="pl-6 font-medium">{scheduleType === "daily" ? workersNeededNumber : "Không bắt buộc"}</p>
                  </div>

                  <div className="col-span-1 space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Khu vực làm việc</span>
                    </div>
                    <p className="pl-6">
                      <span className="font-medium">{selectedFarmLabel || "Chưa chọn"}</span>
                      {location ? ` - ${location}` : ""}
                    </p>
                  </div>

                  <div className="col-span-1 space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span className="font-medium">Danh mục</span>
                    </div>
                    <p className="pl-6">{selectedJobCategoryLabel || "Chưa chọn"}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 font-medium text-muted-foreground">
                      <CheckSquare className="h-4 w-4" />
                      <p>Yêu cầu</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {requirements.length > 0 ? (
                        requirements.map((item, index) => (
                          <Badge key={`${item}-${index}`} variant="secondary">
                            {item}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">Không có</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 font-medium text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <p>Kinh nghiệm</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {selectedSkillIds.length > 0 ? (
                        selectedSkillIds.map((skillId) => (
                          <Badge key={skillId} variant="outline">
                            {getSkillLabel(skillId)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">Không yêu cầu</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 font-medium text-muted-foreground">
                      <Gift className="h-4 w-4" />
                      <p>Quyền lợi</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {benefits.length > 0 ? (
                        benefits.map((item, index) => (
                          <Badge key={`${item}-${index}`} variant="secondary">
                            {item}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">Không có</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-slate-50/50 p-5 text-sm dark:bg-slate-900/50">
                  <div className="mb-3 flex items-center gap-2 font-medium text-muted-foreground">
                    <CalendarRange className="h-4 w-4" />
                    <p>Thời gian làm việc</p>
                  </div>
                  <div className="pl-6">
                    {scheduleType === "contract" ? (
                      <p className="text-muted-foreground">
                        Làm việc theo khoán từ <span className="font-medium text-foreground">{formatDateDDMMYYYY(contractStartDate)}</span> đến <span className="font-medium text-foreground">{formatDateDDMMYYYY(contractEndDate)}</span>.
                      </p>
                    ) : (
                      <div className="space-y-1.5 text-muted-foreground">
                        <p>
                          {selectedDailyRange
                            ? <>
                                Làm việc theo ngày từ <span className="font-medium text-foreground">{format(selectedDailyRange.first, "dd/MM/yyyy")}</span> đến <span className="font-medium text-foreground">{format(selectedDailyRange.last, "dd/MM/yyyy")}</span> (<span className="font-medium text-foreground">{selectedDailyDaysCount}</span> ngày).
                              </>
                            : "Chưa chọn ngày cụ thể."}
                        </p>
                        <p>
                          Khung giờ làm việc hàng ngày: <span className="font-medium text-foreground">{dailyStartTime} - {dailyEndTime}</span>
                        </p>
                        <p>Số lượng nhân công: <span className="font-medium text-foreground">{workersNeededNumber}</span></p>
                      </div>
                    )}
                  </div>
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
