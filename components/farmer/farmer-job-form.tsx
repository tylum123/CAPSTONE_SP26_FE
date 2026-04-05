"use client"

import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Check, CheckCheck, ChevronsUpDown, MapPin, Plus, X, Calendar as CalendarIcon, Briefcase, FileText, CalendarRange, CheckSquare, Award, Gift, AlignLeft, Layout, Clock, Info, DollarSign, DollarSignIcon, ChevronLeft, ChevronRight, User, Users } from "lucide-react"
import { eachDayOfInterval, format, isSameDay, startOfDay } from "date-fns"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FarmerFarmManager } from "@/components/farmer/farmer-farm-manager"
import { Switch } from "@/components/ui/switch"
import { TimePicker } from "@/components/ui/time-picker"
import { OsmLocationPicker } from "@/components/farmer/osm-location-picker"
import { farmerService } from "@/libs/api/services/farmer.service"
import { FarmService } from "@/libs/api/services/farm.service"
import { jobCategoryService } from "@/libs/api/services/job-category.service"
import { skillService } from "@/libs/api/services/skill.service"
import type { CreateJobRequest, GetFarmResponse, Job, JobCategory, Skill, UpdateJobRequest } from "@/libs/types"
import { cn } from "@/libs/utils/utils"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@radix-ui/react-collapsible"
import { jobService } from "@/libs/api/services/jobs.service"
import { JobDraftDialog, LeavingPromptDialog } from "@/components/farmer/job-draft-dialog"

type WorkScheduleType = "contract" | "daily"

type OSMPlace = {
  place_id?: string | number
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

type FarmerJobFormProps = {
  mode?: "create" | "edit"
  jobId?: string
}

const DEFAULT_FARM_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
const DEFAULT_JOB_CATEGORY_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
const JOB_TYPE_CONTRACT_ID = 1
const JOB_TYPE_DAILY_ID = 2
const DEFAULT_STATUS_ID = 2
const DEFAULT_IS_URGENT = false

const OSM_REVERSE_URL = process.env.NEXT_PUBLIC_OSM_REVERSE_URL || "https://nominatim.openstreetmap.org/reverse"

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

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left},${bottom},${right},${top}&layer=mapnik`
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

const extractEditableDescription = (rawDescription: string) => {
  return rawDescription
    .split("\n")
    .filter((line) => {
      const trimmedLine = line.trim()
      return !trimmedLine.startsWith("Yêu cầu:") && !trimmedLine.startsWith("Quyền lợi:") && !trimmedLine.startsWith("Lịch làm:")
    })
    .join("\n")
    .trim()
}

export function FarmerJobForm({ mode = "create", jobId }: FarmerJobFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isFarmManagerDialogOpen, setIsFarmManagerDialogOpen] = useState(false)
  const isEditMode = mode === "edit" && Boolean(jobId)

  // Draft dialogs
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false)
  const [isLeavingPromptOpen, setIsLeavingPromptOpen] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  // Stores the URL to navigate to after user decides on the leaving prompt
  const pendingNavigationUrl = useRef<string | null>(null)
  // Mirror of isDirty as a ref so callbacks always read the latest value without stale closures
  const isDirtyRef = useRef(false)

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
  const [skillPage, setSkillPage] = useState(1)
  const [totalSkillPages, setTotalSkillPages] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingExistingJob, setIsLoadingExistingJob] = useState(false)

  const [isAddSkillDialogOpen, setIsAddSkillDialogOpen] = useState(false)
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillDesc, setNewSkillDesc] = useState("")
  const [isCreatingSkill, setIsCreatingSkill] = useState(false)
  const [skillListVersion, setSkillListVersion] = useState(0)
  const [newSkillCategoryId, setNewSkillCategoryId] = useState("")
  const [isAddSkillCategoryPopoverOpen, setIsAddSkillCategoryPopoverOpen] = useState(false)

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

  // Keep ref in sync with state so callbacks always see the latest value
  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  // Mark form dirty whenever the user changes any field (skip first mount via isMounted guard)
  const isMountedRef = useRef(false)
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      return
    }
    if (!isDirty) {
      setIsDirty(true)
      isDirtyRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title, description, income, workersNeeded, location,
    requirements, benefits, selectedSkillIds, selectedFarmId,
    selectedJobCategoryId, scheduleType, contractStartDate, contractEndDate,
    selectedDailyDates, dailyStartTime, dailyEndTime, isUrgent,
  ])


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

  const handleCreateSkill = async () => {
    if (!newSkillName.trim() || !newSkillCategoryId) return

    try {
      setIsCreatingSkill(true)
      const response = await skillService.createSkill({
        name: newSkillName.trim(),
        description: newSkillDesc.trim() || newSkillName.trim(),
        categoryId: newSkillCategoryId,
        isActive: true,
      })

      const createdSkill = response.data

      if (createdSkill && createdSkill.id && newSkillCategoryId === selectedJobCategoryId) {
        setSelectedSkillIds((prev) => [...prev, createdSkill.id])
      }

      setIsAddSkillDialogOpen(false)
      setNewSkillName("")
      setNewSkillDesc("")

      setSkillPage(1)
      setSkillListVersion((v) => v + 1)
    } catch (error) {
      console.error(error)
    } finally {
      setIsCreatingSkill(false)
    }
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
      if (!selectedJobCategoryId || selectedJobCategoryId === DEFAULT_JOB_CATEGORY_ID) return;
      try {
        setIsLoadingSkills(true)
        const response = await skillService.getSkillsByCategory(selectedJobCategoryId, { page: skillPage, limit: 6 })
        const payload = response.data as any

        let fetchedSkills: Skill[] = []
        let totalPages = 1

        if (payload?.data && Array.isArray(payload.data)) {
          fetchedSkills = payload.data
          totalPages = payload.pagination?.totalPages || 1
        } else if (Array.isArray(payload)) {
          fetchedSkills = payload
        }

        setAvailableSkills(fetchedSkills)
        setTotalSkillPages(totalPages)
      } catch (error) {
        console.error(error)
        setAvailableSkills([])
        setTotalSkillPages(1)
      } finally {
        setIsLoadingSkills(false)
      }
    }

    void loadSkills()
  }, [selectedJobCategoryId, skillPage, skillListVersion])

  useEffect(() => {
    setSkillPage(1)
  }, [selectedJobCategoryId])

  useEffect(() => {
    const hydrateJobForEdit = async () => {
      if (!isEditMode || !jobId) {
        return
      }

      try {
        setIsLoadingExistingJob(true)
        const response = await jobService.getJobDetail(jobId)
        const existingJob = response.data as Job

        setTitle(existingJob.title ?? "")
        setDescription(extractEditableDescription(existingJob.description ?? ""))
        setIncome(String(existingJob.wageAmount ?? ""))
        setWorkersNeeded(String(existingJob.workersNeeded ?? 1))
        setLocation(existingJob.address ?? "")
        setLocationLat(existingJob.farm?.latitude)
        setLocationLng(existingJob.farm?.longitude)
        setRequirements(existingJob.requirements?.length ? existingJob.requirements : ["Có sức khỏe tốt"])
        setBenefits(existingJob.privileges?.length ? existingJob.privileges : ["Bao ăn"])
        setSelectedSkillIds((existingJob.jobSkillRequirements ?? []).map((skill) => skill.id).filter(Boolean))
        setSelectedJobCategoryId(existingJob.jobCategory?.id ?? DEFAULT_JOB_CATEGORY_ID)
        setSelectedFarmId(existingJob.farm?.farmId || (existingJob.farm as any)?.id || DEFAULT_FARM_ID)
        setIsUrgent(Boolean(existingJob.isUrgent))

        const normalizedStartTime = existingJob.startTime ? existingJob.startTime.slice(0, 5) : "09:00"
        const normalizedEndTime = existingJob.endTime ? existingJob.endTime.slice(0, 5) : "17:00"
        setDailyStartTime(normalizedStartTime)
        setDailyEndTime(normalizedEndTime)

        if (existingJob.jobTypeId === JOB_TYPE_DAILY_ID) {
          setScheduleType("daily")
          setContractStartDate("")
          setContractEndDate("")

          const selectedDates = (existingJob.selectedDays ?? [])
            .map((item) => {
              const date = new Date(item)
              if (Number.isNaN(date.getTime())) {
                return null
              }
              return startOfDay(date)
            })
            .filter((item): item is Date => item instanceof Date)

          setSelectedDailyDates(selectedDates)
        } else {
          setScheduleType("contract")
          setSelectedDailyDates([])

          const startDate = existingJob.startDate ? formatDateDDMMYYYY(existingJob.startDate) : ""
          const endDate = existingJob.endDate ? formatDateDDMMYYYY(existingJob.endDate) : ""
          setContractStartDate(startDate)
          setContractEndDate(endDate)
        }
      } catch (error) {
        console.error(error)
        setSubmitError("Không thể tải dữ liệu tin tuyển dụng để chỉnh sửa.")
      } finally {
        setIsLoadingExistingJob(false)
      }
    }

    void hydrateJobForEdit()
  }, [isEditMode, jobId])

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

  const handleMapPick = async (latitude: number, longitude: number) => {
    setLocationLat(latitude)
    setLocationLng(longitude)

    // Reverse geocode to get address
    try {
      const response = await fetch(
        `${OSM_REVERSE_URL}?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "vi",
          },
        },
      )

      if (response.ok) {
        const data = (await response.json()) as { display_name?: string }
        if (data.display_name) {
          setLocation(data.display_name)
        }
      }
    } catch {
      // Continue with just coordinates if reverse geocode fails
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

    const payload: UpdateJobRequest = {
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
      updatedAt: nowISO,
      isUrgent,
      statusId: DEFAULT_STATUS_ID,
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      const response = isEditMode && jobId
        ? await jobService.updateJob(jobId, payload)
        : await jobService.createJob({
          ...(payload as CreateJobRequest),
          publishedAt: nowISO,
          createdAt: nowISO,
        })
      const savedJob = response.data

      const postedPayload: PostedJobPreview = {
        id: savedJob.id,
        createdAt: savedJob.createdAt ?? nowISO,
        title: savedJob.title ?? title.trim(),
        income: savedJob.wageAmount ?? incomeNumber,
        workersNeeded:
          savedJob.workersNeeded ?? (scheduleType === "daily" ? workersNeededNumber : 1),
        location: savedJob.address ?? location.trim(),
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
      let errorMessage = isEditMode
        ? "Không thể cập nhật tin công việc. Vui lòng thử lại."
        : "Không thể đăng tin công việc. Vui lòng thử lại."

      if (typeof apiMessage === "string") {
        if (apiMessage.includes("Insufficient wallet balance to create job post. Please top up your wallet.")) {
          errorMessage = "Số dư ví không đủ để đăng tin. Vui lòng nạp thêm tiền vào ví."
          toast({
            title: "Số dư không đủ",
            description: "Ví của bạn không đủ số dư để đăng tin. Hệ thống đang chuyển hướng đến trang nạp tiền...",
            variant: "destructive",
          })
          router.push("/farmer/payments")
        } else {
          errorMessage = apiMessage
        }
      }

      setSubmitError(errorMessage)
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
    setIsDirty(false)
    isDirtyRef.current = false
  }

  // ─── Draft helpers ───────────────────────────────────────────────────────

  const buildDraftPayload = useCallback((): CreateJobRequest => {
    const now = new Date()
    const nowISO = now.toISOString()
    const nowDateOnly = toDateOnlyFromDate(now)

    const formatTimeOnly = (t: string) => (t.length === 5 ? `${t}:00` : t)

    let startDate = nowDateOnly
    let endDate = nowDateOnly
    let startTime = formatTimeOnly(dailyStartTime || "09:00")
    let endTime = formatTimeOnly(dailyEndTime || "17:00")

    if (scheduleType === "contract") {
      startDate = toDateOnlyString(contractStartDate) ?? nowDateOnly
      endDate = toDateOnlyString(contractEndDate) ?? nowDateOnly
    } else if (normalizedSelectedDailyDates.length > 0) {
      startDate = toDateOnlyFromDate(normalizedSelectedDailyDates[0])
      endDate = toDateOnlyFromDate(normalizedSelectedDailyDates[normalizedSelectedDailyDates.length - 1])
      startTime = formatTimeOnly(dailyStartTime)
      endTime = formatTimeOnly(dailyEndTime)
    }

    return {
      skillIds: selectedSkillIds,
      farmId: selectedFarmId || DEFAULT_FARM_ID,
      jobCategoryId: selectedJobCategoryId || DEFAULT_JOB_CATEGORY_ID,
      jobTypeId: scheduleType === "daily" ? JOB_TYPE_DAILY_ID : JOB_TYPE_CONTRACT_ID,
      title: title.trim() || "(Bản nháp)",
      description: description.trim(),
      address: location.trim(),
      startDate,
      endDate,
      startTime,
      endTime,
      selectedDays: normalizedSelectedDailyDates.map((d) => toDateOnlyFromDate(d)),
      requirements,
      privileges: benefits,
      wageAmount: incomeNumber,
      workersNeeded: workersNeededNumber || 1,
      workersAccepted: 0,
      isUrgent,
      statusId: 1, // Draft status
      publishedAt: nowISO,
      createdAt: nowISO,
      updatedAt: nowISO,
    }
  }, [
    title, description, income, location, selectedSkillIds, selectedFarmId,
    selectedJobCategoryId, scheduleType, contractStartDate, contractEndDate,
    dailyStartTime, dailyEndTime, normalizedSelectedDailyDates, requirements,
    benefits, incomeNumber, workersNeededNumber, isUrgent,
  ])

  const saveDraft = useCallback(async () => {
    try {
      setIsSavingDraft(true)
      const payload = buildDraftPayload()
      await jobService.saveDraft(payload)
      setIsDirty(false)
      isDirtyRef.current = false
      toast({
        title: "Đã lưu bản nháp",
        description: "Bản nháp của bạn đã được lưu thành công.",
      })
    } catch {
      toast({
        title: "Lưu thất bại",
        description: "Không thể lưu bản nháp. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsSavingDraft(false)
    }
  }, [buildDraftPayload, toast])

  const loadDraft = useCallback((draft: Job) => {
    setTitle(draft.title ?? "")
    setDescription(extractEditableDescription(draft.description ?? ""))
    setIncome(String(draft.wageAmount ?? ""))
    setWorkersNeeded(String(draft.workersNeeded ?? 1))
    setLocation(draft.address ?? "")
    setRequirements(draft.requirements?.length ? draft.requirements : ["Có sức khỏe tốt"])
    setBenefits(draft.privileges?.length ? draft.privileges : ["Bao ăn"])
    setSelectedSkillIds((draft.jobSkillRequirements ?? []).map((s) => s.id).filter(Boolean))
    setSelectedJobCategoryId(draft.jobCategory?.id ?? DEFAULT_JOB_CATEGORY_ID)
    setSelectedFarmId(draft.farm?.farmId || (draft.farm as any)?.id || DEFAULT_FARM_ID)
    setIsUrgent(Boolean(draft.isUrgent))
    setDailyStartTime(draft.startTime?.slice(0, 5) ?? "09:00")
    setDailyEndTime(draft.endTime?.slice(0, 5) ?? "17:00")

    if (draft.jobTypeId === JOB_TYPE_DAILY_ID) {
      setScheduleType("daily")
      setContractStartDate("")
      setContractEndDate("")
      const dates = (draft.selectedDays ?? [])
        .map((d) => { const dd = new Date(d); return Number.isNaN(dd.getTime()) ? null : startOfDay(dd) })
        .filter((d): d is Date => d !== null)
      setSelectedDailyDates(dates)
    } else {
      setScheduleType("contract")
      setSelectedDailyDates([])
      setContractStartDate(draft.startDate ? formatDateDDMMYYYY(draft.startDate) : "")
      setContractEndDate(draft.endDate ? formatDateDDMMYYYY(draft.endDate) : "")
    }

    setStep(1)
    toast({ title: "Đã tải bản nháp", description: `"${draft.title}" đã được tải vào form.` })
  }, [toast])

  // ─── Navigation interception ──────────────────────────────────────────────

  // Intercept browser tab close / refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current && !postedJob) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [postedJob])

  // Uses the ref (not state) so the callback never captures a stale dirty value
  const handleNavigateAway = useCallback((url: string) => {
    if (isDirtyRef.current && !postedJob) {
      pendingNavigationUrl.current = url
      setIsLeavingPromptOpen(true)
    } else {
      router.push(url)
    }
  }, [router, postedJob])

  const handleLeavingPromptSaveDraft = useCallback(async () => {
    await saveDraft()
    setIsLeavingPromptOpen(false)
    if (pendingNavigationUrl.current) {
      router.push(pendingNavigationUrl.current)
      pendingNavigationUrl.current = null
    }
  }, [saveDraft, router])

  const handleLeavingPromptLeave = useCallback(() => {
    setIsLeavingPromptOpen(false)
    setIsDirty(false)
    isDirtyRef.current = false
    if (pendingNavigationUrl.current) {
      router.push(pendingNavigationUrl.current)
      pendingNavigationUrl.current = null
    }
  }, [router])

  const handleLeavingPromptStay = useCallback(() => {
    setIsLeavingPromptOpen(false)
    pendingNavigationUrl.current = null
  }, [])

  if (isLoadingExistingJob) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 border-muted-foreground/20"
            onClick={() => handleNavigateAway("/farmer/jobs")}
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {isEditMode ? "Chỉnh sửa tin tuyển dụng" : "Đăng tin tuyển dụng"}
            </h1>
            <p className="text-muted-foreground mt-1 mb-2">
              {isEditMode
                ? "Cập nhật nội dung bài đăng để phù hợp hơn với nhu cầu tuyển dụng hiện tại."
                : "Tạo nhân công phù hợp cho địa điểm canh tác của bạn."}
            </p>
          </div>
        </div>

        {!postedJob && (
          <div className="flex items-center gap-3">
            {/* Draft buttons */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover:text-foreground"
              onClick={() => setIsDraftDialogOpen(true)}
            >
              <FileText className="h-4 w-4" />
              Bản nháp
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={saveDraft}
              disabled={isSavingDraft}
            >
              {isSavingDraft ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent inline-block" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Lưu nháp
                </>
              )}
            </Button>

            {/* Step indicator */}
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
                <CardTitle className="text-2xl text-green-700 dark:text-green-400">
                  {isEditMode ? "Cập nhật tin thành công!" : "Đăng tin thành công!"}
                </CardTitle>
                <CardDescription className="text-base text-green-600/80 dark:text-green-400/80">
                  {isEditMode
                    ? "Thông tin bài đăng đã được cập nhật thành công."
                    : "Tin tuyển dụng của bạn đã được công khai. Ứng viên sẽ sớm liên hệ với bạn."}
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
              {isEditMode ? (
                <Button size="lg" onClick={() => setPostedJob(null)} className="bg-green-600 hover:bg-green-700 text-white shadow-md">
                  Chỉnh sửa lại
                </Button>
              ) : (
                <Button size="lg" onClick={resetAll} className="bg-green-600 hover:bg-green-700 text-white shadow-md">
                  <Plus className="mr-2 h-4 w-4" /> Đăng tin khác
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {step === 1 ? (
            <div className="space-y-8 max-w-4xl mx-auto">
              {/* Card thông tin */}
              <Card className="overflow-hidden border-t-4 border-t-primary shadow-md">
                <CardHeader className="bg-muted/10 pb-0">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Thông tin công việc
                  </CardTitle>
                  <CardDescription>Mô tả chi tiết công việc để ứng viên hiểu rõ hơn.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid gap-6 md:grid-cols-5">
                    <div className="space-y-3 col-span-4">
                      <Label htmlFor="job-title" className="text-base font-semibold">
                        Tiêu đề <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="job-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Ví dụ: Cần thu hoạch dưa lưới tại vườn"
                        className="text-lg py-6 shadow-sm border-muted-foreground/30 focus-visible:border-primary"
                      />
                    </div>

                    <div className="space-y-10">
                      <Label className="font-semibold flex items-center justify-between">
                        <span></span>
                      </Label>
                      <div className="flex items-center justify-between rounded-lg border border-muted-foreground/30 p-3 h-11">
                        <span className="text-sm">Tuyển gấp</span>
                        <Switch checked={isUrgent} onCheckedChange={setIsUrgent} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-semibold">Lĩnh vực công việc <span className="text-destructive">*</span></Label>
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
                    <Label htmlFor="job-description" className="font-semibold">Mô tả chi tiết <span className="text-destructive">*</span></Label>
                    <textarea
                      id="job-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className="flex w-full rounded-md border border-muted-foreground/30 bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                      placeholder="Mô tả công việc cụ thể, số lượng hoặc diện tích canh tác..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md border-t-4 border-t-purple-500">
                <CardHeader className="bg-muted/10">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarRange className="h-5 w-5 text-purple-600" />
                    Lịch làm việc
                  </CardTitle>
                  <span className="text-sm font-normal text-muted-foreground">Chọn loại hình làm việc bạn muốn.</span>
                  <Collapsible className="space-y-2">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        Khoán và Ngày khác nhau như thế nào?
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                      <Card className="flex flex-col gap-4 rounded-lg border bg-muted/50 p-4">
                        <p className="text-sm text-foreground">Khoán sẽ được thực hiện trong một khoảng thời gian được đề ra nhất định, tiền công sẽ được thanh toán theo độ hoàn thiện sau ngày kết thúc.</p>
                        <p className="text-sm text-foreground">Ngày sẽ được thực hiện theo giờ vào những ngày được đăng kí, tiền công sẽ được thanh toán dựa theo mức độ hoàn thiện sau khi kết thúc công việc.</p>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>

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
                      Khoán
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType("daily")}
                      className={cn(
                        "py-2 px-3 text-sm font-medium rounded-md transition-all duration-200",
                        scheduleType === "daily" ? "bg-background text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-background/50"
                      )}
                    >
                      Ngày
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
                              <Calendar mode="single" selected={selectedContractStartDate} onSelect={handleContractStartSelect} disabled={(d) => d < tomorrow} />
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
                              <Calendar mode="single" selected={selectedContractEndDate} onSelect={handleContractEndSelect} disabled={(d) => d < tomorrow || (selectedContractStartDate ? d < selectedContractStartDate : false)} />
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
                            <Button type="button" size="sm" variant={isRangePicking ? "default" : "outline"} className="h-7 text-[15px] px-2" onClick={toggleRangeSelectionMode}>
                              {isRangePicking ? "Chọn đích" : "Khoảng"}
                            </Button>
                            <Button type="button" size="sm" variant="ghost" className="h-7 text-[15px] px-2 text-destructive" onClick={clearAllSelectedDailyDates} disabled={selectedDailyDaysCount === 0}>
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
                            className="rounded-md scale-100 w-full"
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

                      <div className="space-y-2 pt-5 border-t">
                        <Label className="flex justify-between">
                          <span>Số lượng nhân công</span>
                          <span className="font-bold text-primary">{workersNeeded}</span>
                        </Label>
                        <Input type="number" min="1" value={workersNeeded} onChange={(e) => setWorkersNeeded(e.target.value)} />
                      </div>


                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute left-3 top-2.5 text-muted-foreground text-xs pr-3">VNĐ</div>
                    <Input
                      type="number"
                      min="0"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      className="pl-12 text-lg font-medium text-teal-700 dark:text-teal-400"
                      placeholder="300,000"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md overflow-hidden border-t-4 border-t-teal-500">
                <CardHeader className="bg-muted/10">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-teal-600" />
                    Địa điểm làm việc<span className="text-destructive">*</span>
                  </CardTitle>
                  <span className="text-sm font-normal text-muted-foreground">Chọn nơi bạn muốn công việc được thực hiện.</span>
                </CardHeader>
                <CardContent className="space-y-7 pt-6">

                  <div className="space-y-2">
                    <Label>Tên</Label>
                    <Popover open={isFarmPopoverOpen} onOpenChange={setIsFarmPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between" disabled={isLoadingFarms}>
                          <span className="truncate">{selectedFarmLabel || "Chọn địa điểm"}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Tìm địa điểm..." />
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
                        <div className="border-t mt-2 pt-2">
                          <Button
                            variant="ghost"
                            className="flex justify-start gap-2 text-primary mb-2 ml-2"
                            onClick={() => {
                              setIsFarmPopoverOpen(false)
                              setIsFarmManagerDialogOpen(true)
                            }}
                          >
                            <Plus className="h-4 w-4" /> Thêm địa điểm
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Farm Manager Dialog */}
                    <Dialog open={isFarmManagerDialogOpen} onOpenChange={(open) => {
                      setIsFarmManagerDialogOpen(open)
                      if (!open) {
                        // Refresh farm list after closing dialog
                        // (re-run loadFarms logic)
                        (async () => {
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
                          } catch (error) {
                            setFarms([])
                          } finally {
                            setIsLoadingFarms(false)
                          }
                        })()
                      }
                    }}>
                      <DialogContent className="sm:max-w-[1200px] w-[95vw] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Quản lý địa điểm</DialogTitle>
                        </DialogHeader>
                        <FarmerFarmManager />
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-2">
                    <Label>Địa chỉ</Label>
                    <div className="relative z-1000 ">
                      <Input disabled value={location} onChange={(e) => { setLocation(e.target.value); setLocationLat(undefined); setLocationLng(undefined); }} placeholder="Nhập địa chỉ chi tiết..." />
                      {/* Search suggestions dropdown */}
                      {(isSearchingLocation || locationSuggestions.length > 0) && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 shadow-md">
                          {locationSuggestions.map((place) => (
                            <div key={place.place_id} onClick={() => selectOSMLocation(place)} className="cursor-pointer truncate rounded px-2 py-1.5 text-xs hover:bg-muted">
                              {place.display_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative h-100 w-full overflow-hidden rounded-md border bg-muted/20">
                    <OsmLocationPicker
                      latitude={locationLat ?? null}
                      longitude={locationLng ?? null}
                      onPick={handleMapPick}
                      className="h-full"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Bấm vào bản đồ để chọn vị trí công việc</p>
                </CardContent>
              </Card>



              <Card className="shadow-md overflow-hidden border-t-4 border-t-blue-500 flex flex-col">
                <CardHeader className="bg-muted/10 pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-500" />
                    Yêu cầu & Quyền lợi
                  </CardTitle>
                  <span className="text-sm font-normal text-muted-foreground">Thêm những yêu cầu bổ sung và quyền lợi cho công việc.</span>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground uppercase">Kỹ năng</Label>
                        <p className="text-sm text-muted-foreground">Chọn các kỹ năng ứng viên cần có:</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAddSkillDialogOpen(true)
                          setNewSkillCategoryId(selectedJobCategoryId)
                        }}
                        disabled={selectedJobCategoryId === DEFAULT_JOB_CATEGORY_ID}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Thêm kỹ năng
                      </Button>
                    </div>

                    <Dialog open={isAddSkillDialogOpen} onOpenChange={setIsAddSkillDialogOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Thêm kỹ năng</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label>Danh mục công việc <span className="text-destructive">*</span></Label>
                            <Popover open={isAddSkillCategoryPopoverOpen} onOpenChange={setIsAddSkillCategoryPopoverOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between font-normal"
                                >
                                  {getJobCategoryLabel(newSkillCategoryId) || "Chọn danh mục"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[375px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Tìm kiếm danh mục..." />
                                  <CommandList>
                                    <CommandEmpty>Không tìm thấy.</CommandEmpty>
                                    <CommandGroup>
                                      {jobCategories.map((category) => (
                                        <CommandItem
                                          key={category.id}
                                          value={category.name}
                                          onSelect={() => {
                                            setNewSkillCategoryId(category.id)
                                            setIsAddSkillCategoryPopoverOpen(false)
                                          }}
                                        >
                                          <Check className={cn("mr-2 h-4 w-4", newSkillCategoryId === category.id ? "opacity-100" : "opacity-0")} />
                                          {category.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-skill-name">
                              Tên kỹ năng <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="new-skill-name"
                              value={newSkillName}
                              onChange={(e) => setNewSkillName(e.target.value)}
                              placeholder="VD: Sử dụng máy cày..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-skill-desc">Mô tả (Không bắt buộc)</Label>
                            <Input
                              id="new-skill-desc"
                              value={newSkillDesc}
                              onChange={(e) => setNewSkillDesc(e.target.value)}
                              placeholder="Mô tả ngắn gọn về kỹ năng này..."
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => { setIsAddSkillDialogOpen(false); setNewSkillName(""); setNewSkillDesc(""); }}>
                            Hủy
                          </Button>
                          <Button type="button" onClick={handleCreateSkill} disabled={isCreatingSkill || !newSkillName.trim() || !newSkillCategoryId}>
                            {isCreatingSkill ? "Đang lưu..." : "Lưu lại"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <div className="grid grid-cols-2 gap-2">
                      {isLoadingSkills ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" /> Đang tải kỹ năng...</div>
                      ) : availableSkills.length > 0 ? (
                        <>
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
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Không có kỹ năng nào cho danh mục này.</p>
                      )}
                    </div>
                    {totalSkillPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={skillPage <= 1}
                          onClick={() => setSkillPage(p => Math.max(1, p - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="sr-only">Trước</span>
                        </Button>
                        <span className="text-sm text-muted-foreground">Trang {skillPage} / {totalSkillPages}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={skillPage >= totalSkillPages}
                          onClick={() => setSkillPage(p => Math.min(totalSkillPages, p + 1))}
                        >
                          <ChevronRight className="h-4 w-4" />
                          <span className="sr-only">Sau</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4">
                    <Label className="text-sm font-semibold text-muted-foreground uppercase">Yêu cầu bổ sung</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newRequirement}
                          onChange={(e) => setNewRequirement(e.target.value)}
                          onKeyDown={handleRequirementKeyDown}
                          placeholder="VD: Độ tuổi ưu tiên, giới tính, những loại công cụ cần thiết..."
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
                          placeholder="VD: Ăn uống, nơi nghỉ ngơi..."
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

              {/* Action Bar */}
              <div className="sticky bottom-4 z-1000 bg-background/95 backdrop-blur p-4 border rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
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
                  <Button type="button" onClick={goToPreview} className="flex-1 sm:flex-none shadow-sm">
                    {isEditMode ? "Xem trước cập nhật" : "Xem trước tin đăng"} <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
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
                        <div className="flex items-center font-medium"><User className="mr-1 h-4 w-4" /> {workersNeededNumber} người</div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Địa điểm</p>
                        <div className="flex items-center font-medium truncate" title={selectedFarmLabel}><MapPin className="mr-1 h-4 w-4" /> {selectedFarmLabel}</div>
                      </div>
                      <div className="space-y-1 bg-primary/10 p-3 rounded-md col-span-2 md:col-span-4 flex items-center justify-between border border-primary/20 mt-2">
                        <span className="font-semibold text-primary uppercase text-sm">Tổng chi phí dự kiến:</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(scheduleType === "contract" ? incomeNumber : incomeNumber * workersNeededNumber * selectedDailyDaysCount)}</span>
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
                      {isSubmitting ? "Đang xử lý..." : isEditMode ? "Xác nhận & Cập nhật" : "Xác nhận & Đăng tin"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
      {/* Draft Dialogs */}
      <JobDraftDialog
        open={isDraftDialogOpen}
        onOpenChange={setIsDraftDialogOpen}
        onLoadDraft={loadDraft}
      />
      <LeavingPromptDialog
        open={isLeavingPromptOpen}
        onSaveDraft={handleLeavingPromptSaveDraft}
        onLeaveWithoutSave={handleLeavingPromptLeave}
        onStay={handleLeavingPromptStay}
        isSaving={isSavingDraft}
      />
    </div>
  )
}
