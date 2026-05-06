"use client"

import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, ArrowUpRight, Banknote, Check, CheckCheck, ChevronsUpDown, MapPin, Plus, X, Calendar as CalendarIcon, Briefcase, FileText, CalendarRange, CheckSquare, Award, Gift, AlignLeft, Layout, Clock, Info, DollarSign, DollarSignIcon, ChevronLeft, ChevronRight, User, Users } from "lucide-react"
import { eachDayOfInterval, format, isSameDay, startOfDay } from "date-fns"
import type { DateRange } from "react-day-picker"
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
import { JobPostStatus, JobStatus, type CreateJobRequest, type GetFarmResponse, type Job, type JobCategory, type Skill, type UpdateJobRequest } from "@/libs/types"
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

type PendingLeaveAction =
  | { type: "route"; url: string }
  | { type: "reload" }
  | null

const DEFAULT_FARM_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
const DEFAULT_JOB_CATEGORY_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
const JOB_TYPE_CONTRACT_ID = 1
const JOB_TYPE_DAILY_ID = 2
const DEFAULT_STATUS_ID = JobPostStatus.Published
const DEFAULT_IS_URGENT = false

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)

const toDigitsOnly = (value: string) => value.replace(/\D/g, "")

const formatThousandsWithDots = (value: string) => {
  const digits = toDigitsOnly(value)

  if (!digits) {
    return ""
  }

  const normalizedDigits = digits.replace(/^0+(?=\d)/, "")
  return normalizedDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

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

const toDailyWorkersPerDay = (totalWorkers: number | undefined, selectedDaysCount: number) => {
  const safeTotalWorkers = Number.isFinite(totalWorkers) ? Math.max(0, Number(totalWorkers)) : 0
  const safeSelectedDaysCount = Math.max(1, selectedDaysCount)

  if (!safeTotalWorkers) {
    return 1
  }

  return Math.max(1, Math.ceil(safeTotalWorkers / safeSelectedDaysCount))
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

const resolveJobCategoryId = (job: Job | null | undefined) => {
  if (!job) {
    return DEFAULT_JOB_CATEGORY_ID
  }

  const directCategoryId = job.jobCategoryId?.trim()

  if (directCategoryId) {
    return directCategoryId
  }

  const nestedCategoryId = job.jobCategory?.id?.trim()

  if (nestedCategoryId) {
    return nestedCategoryId
  }

  return DEFAULT_JOB_CATEGORY_ID
}

const resolveFarmId = (job: Job | null | undefined) => {
  if (!job) {
    return DEFAULT_FARM_ID
  }

  const directFarmId = (job as any).farmId?.toString().trim()

  if (directFarmId) {
    return directFarmId
  }

  const nestedFarmId = job.farm?.farmId?.toString().trim() || (job.farm as any)?.id?.toString().trim()

  if (nestedFarmId) {
    return nestedFarmId
  }

  return DEFAULT_FARM_ID
}

export function FarmerJobForm({ mode = "create", jobId }: FarmerJobFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isFarmManagerDialogOpen, setIsFarmManagerDialogOpen] = useState(false)
  const isEditMode = mode === "edit" && Boolean(jobId)
  const repostFromJobId = searchParams.get("repostFromJobId")?.trim()

  // Draft dialogs
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false)
  const [isLeavingPromptOpen, setIsLeavingPromptOpen] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  // Stores pending action after user confirms on leaving prompt
  const pendingLeaveActionRef = useRef<PendingLeaveAction>(null)
  // Allows browser-level exit after user confirms leaving
  const allowBrowserExitRef = useRef(false)
  // Mirror of isDirty as a ref so callbacks always read the latest value without stale closures
  const isDirtyRef = useRef(false)

  const [step, setStep] = useState<1 | 2>(1)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [income, setIncome] = useState("")
  const [workersNeeded, setWorkersNeeded] = useState("1")
  const [dailyWorkersNeededMap, setDailyWorkersNeededMap] = useState<Record<string, string>>({})
  const [location, setLocation] = useState("")
  const [locationLat, setLocationLat] = useState<number | undefined>(undefined)
  const [locationLng, setLocationLng] = useState<number | undefined>(undefined)

  const [requirements, setRequirements] = useState<string[]>(["Có sức khỏe tốt"])
  const [newRequirement, setNewRequirement] = useState("")

  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [skillLabelsById, setSkillLabelsById] = useState<Record<string, string>>({})
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

  const [benefits, setBenefits] = useState<string[]>(["Bao ăn"])
  const [newBenefit, setNewBenefit] = useState("")
  const [isUrgent, setIsUrgent] = useState(DEFAULT_IS_URGENT)

  const [jobCategories, setJobCategories] = useState<JobCategory[]>([])
  const [selectedJobCategoryId, setSelectedJobCategoryId] = useState(DEFAULT_JOB_CATEGORY_ID)
  const [isLoadingJobCategories, setIsLoadingJobCategories] = useState(true)
  const [isJobCategoryPopoverOpen, setIsJobCategoryPopoverOpen] = useState(false)

  const [farms, setFarms] = useState<GetFarmResponse[]>([])
  const [allFarms, setAllFarms] = useState<GetFarmResponse[]>([])
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
  const postedJobRef = useRef<PostedJobPreview | null>(null)
  const isHydratingPresetJobRef = useRef(false)

  useEffect(() => {
    postedJobRef.current = postedJob
  }, [postedJob])

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
    title, description, income, workersNeeded, dailyWorkersNeededMap, location,
    requirements, benefits, selectedSkillIds, selectedFarmId,
    selectedJobCategoryId, scheduleType, contractStartDate, contractEndDate,
    selectedDailyDates, dailyStartTime, dailyEndTime, isUrgent,
  ])


  const workersNeededNumber = Number.parseInt(workersNeeded, 10) || 0
  const incomeNumber = Number.parseInt(toDigitsOnly(income), 10) || 0

  const selectedContractDateRange = useMemo<DateRange | undefined>(() => {
    const from = contractStartDate ? parseDDMMYYYYToDate(contractStartDate) ?? undefined : undefined
    const to = contractEndDate ? parseDDMMYYYYToDate(contractEndDate) ?? undefined : undefined

    if (!from && !to) {
      return undefined
    }

    return { from, to }
  }, [contractStartDate, contractEndDate])
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

  const rememberSkillLabels = useCallback((skills: Array<{ id?: string | null; name?: string | null }>) => {
    if (!skills.length) {
      return
    }

    setSkillLabelsById((current) => {
      const next = { ...current }

      skills.forEach((skill) => {
        const id = skill.id?.trim()
        const name = skill.name?.trim()

        if (id && name) {
          next[id] = name
        }
      })

      return next
    })
  }, [])

  // Helper to normalize strings for diacritic-insensitive comparison
  const normalizeStr = (s = "") =>
    s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim()

  // Filter farms when job category changes
  useEffect(() => {
    if (!allFarms.length) {
      return
    }

    if (!selectedJobCategoryId || selectedJobCategoryId === DEFAULT_JOB_CATEGORY_ID) {
      setFarms(allFarms)
      return
    }

    const categoryNorm = normalizeStr(getJobCategoryLabel(selectedJobCategoryId))

    const filtered = allFarms.filter((f) => {
      if (!f) return false

      // Match by farmTypeId or farmId directly
      if ((f as any).farmTypeId && String((f as any).farmTypeId) === String(selectedJobCategoryId)) {
        return true
      }

      if (String(f.farmId) === String(selectedJobCategoryId)) {
        return true
      }

      // Match by farmTypeName using diacritic-insensitive comparison
      const farmTypeNameNorm = normalizeStr(f.farmTypeName)
      if (farmTypeNameNorm.includes(categoryNorm)) {
        return true
      }

      return false
    })

    // Set filtered list even if empty (shows "no farms" message to user)
    setFarms(filtered)
    
    if (filtered.length) {
      setSelectedFarmId((current) => {
        const exists = filtered.some((ff) => (ff.farmId || (ff as any).id) === current)
        if (exists) return current
        const first = filtered[0]
        return first?.farmId || (first as any)?.id || DEFAULT_FARM_ID
      })
    }
  }, [selectedJobCategoryId, allFarms])

  const getSkillLabel = (skillId: string) => {
    const rememberedLabel = skillLabelsById[skillId]

    if (rememberedLabel) {
      return rememberedLabel
    }

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

  const toggleAllVisibleSkills = () => {
    const visibleSkillIds = availableSkills.map((skill) => skill.id).filter(Boolean)

    if (!visibleSkillIds.length) {
      return
    }

    setSelectedSkillIds((currentSkills) => {
      const hasAllVisibleSkills = visibleSkillIds.every((skillId) => currentSkills.includes(skillId))

      if (hasAllVisibleSkills) {
        return currentSkills.filter((skillId) => !visibleSkillIds.includes(skillId))
      }

      return Array.from(new Set([...currentSkills, ...visibleSkillIds]))
    })
  }

  const handleCreateSkill = async () => {
    const skillCategoryId =
      selectedJobCategoryId && selectedJobCategoryId !== DEFAULT_JOB_CATEGORY_ID
        ? selectedJobCategoryId
        : jobCategories[0]?.id

    if (!newSkillName.trim() || !skillCategoryId) {
      return
    }

    try {
      setIsCreatingSkill(true)
      const response = await skillService.createSkill({
        name: newSkillName.trim(),
        description: newSkillDesc.trim() || newSkillName.trim(),
        categoryId: skillCategoryId,
        isActive: true,
      })

      const createdSkill = response.data

      if (createdSkill && createdSkill.id) {
        rememberSkillLabels([createdSkill])
        setSelectedSkillIds((prev) => (prev.includes(createdSkill.id) ? prev : [...prev, createdSkill.id]))
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
    const values = newRequirement
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

    if (!values.length) {
      return
    }

    setRequirements((current) => [...current, ...values])
    setNewRequirement("")
  }

  const addBenefit = () => {
    const values = newBenefit
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

    if (!values.length) {
      return
    }

    setBenefits((current) => [...current, ...values])
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
        rememberSkillLabels(fetchedSkills)
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
  }, [selectedJobCategoryId, skillPage, skillListVersion, rememberSkillLabels])

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
        setIncome(formatThousandsWithDots(String(existingJob.wageAmount ?? "")))
        setWorkersNeeded(String(Math.max(1, existingJob.workersNeeded ?? 1)))
        setLocation(existingJob.address ?? "")
        setLocationLat(existingJob.farm?.latitude)
        setLocationLng(existingJob.farm?.longitude)
        setRequirements(existingJob.requirements?.length ? existingJob.requirements : ["Có sức khỏe tốt"])
        setBenefits(existingJob.privileges?.length ? existingJob.privileges : ["Bao ăn"])
        rememberSkillLabels(existingJob.jobSkillRequirements ?? [])
        setSelectedSkillIds((existingJob.jobSkillRequirements ?? []).map((skill) => skill.id).filter(Boolean))
        setSelectedJobCategoryId(resolveJobCategoryId(existingJob))
        setSelectedFarmId(resolveFarmId(existingJob))
        setIsUrgent(Boolean(existingJob.isUrgent))

        const normalizedStartTime = existingJob.startTime ? existingJob.startTime.slice(0, 5) : "09:00"
        const normalizedEndTime = existingJob.endTime ? existingJob.endTime.slice(0, 5) : "17:00"
        setDailyStartTime(normalizedStartTime)
        setDailyEndTime(normalizedEndTime)

        if (existingJob.jobTypeId === JOB_TYPE_DAILY_ID) {
          setScheduleType("daily")
          setContractStartDate("")
          setContractEndDate("")

          const selectedDates = (existingJob.jobPostDays ?? [])
            .map((item) => {
              const date = new Date(item.workDate)
              if (Number.isNaN(date.getTime())) {
                return null
              }
              return startOfDay(date)
            })
            .filter((item): item is Date => item instanceof Date)

          setSelectedDailyDates(selectedDates)
          const initialDailyWorkersNeeded: Record<string, string> = {}
          const dailyWorkerCounts = (existingJob.jobPostDays ?? []).map((day) => {
            const dateStr = day.workDate.split("T")[0]
            initialDailyWorkersNeeded[dateStr] = String(Math.max(1, day.workersNeeded ?? 1))
            return day.workersNeeded
          })
          setDailyWorkersNeededMap(initialDailyWorkersNeeded)

          const maxWorkersNeeded = dailyWorkerCounts.length
            ? Math.max(...dailyWorkerCounts)
            : existingJob.workersNeeded
          setWorkersNeeded(String(Math.max(1, maxWorkersNeeded)))
        } else {
          setScheduleType("contract")
          setSelectedDailyDates([])
          setWorkersNeeded(String(Math.max(1, existingJob.workersNeeded ?? 1)))

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
  }, [isEditMode, jobId, rememberSkillLabels])

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
          const firstCategoryId = activeCategories[0]?.id ?? DEFAULT_JOB_CATEGORY_ID

          if (!currentSelected || currentSelected === DEFAULT_JOB_CATEGORY_ID) {
            return firstCategoryId
          }

          const isCurrentStillAvailable = activeCategories.some((category) => category.id === currentSelected)
          return isCurrentStillAvailable ? currentSelected : firstCategoryId
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

        setAllFarms(fetchedFarms)
        setFarms(fetchedFarms)
        setSelectedFarmId((currentSelected) => {
          if (currentSelected && currentSelected !== DEFAULT_FARM_ID) {
            return currentSelected
          }

          const firstFarm = fetchedFarms[0]
          return firstFarm?.farmId || (firstFarm as any)?.id || DEFAULT_FARM_ID
        })

        if (!isEditMode) {
          const firstFarm = fetchedFarms[0]

          if (firstFarm?.address) {
            setLocation((currentLocation) => (currentLocation.trim() ? currentLocation : firstFarm.address))
          }

          setLocationLat((currentLat) => (currentLat === undefined ? firstFarm?.latitude : currentLat))
          setLocationLng((currentLng) => (currentLng === undefined ? firstFarm?.longitude : currentLng))
        }
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

  const handleContractRangeSelect = (range?: DateRange) => {
    if (!range?.from) {
      setContractStartDate("")
      setContractEndDate("")
      return
    }

    setContractStartDate(format(range.from, "dd/MM/yyyy"))
    // Only set an end date when the picker provides a distinct end different from the start.
    if (range.to && !isSameDay(range.from, range.to)) {
      setContractEndDate(format(range.to, "dd/MM/yyyy"))
    } else {
      setContractEndDate("")
    }
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

      if (rangeSelectionAnchor && isSameDay(rangeSelectionAnchor, dateToRemove)) {
        setRangeSelectionAnchor(null)
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

  const validateContractDateRange = (startDateValue: string, endDateValue: string) => {
    if (!startDateValue || !endDateValue) {
      return "Vui lòng chọn ngày bắt đầu và kết thúc cho công việc khoán."
    }

    const parsedStartDate = parseDDMMYYYYToDate(startDateValue)
    const parsedEndDate = parseDDMMYYYYToDate(endDateValue)

    if (!parsedStartDate || !parsedEndDate) {
      return "Vui lòng nhập ngày theo định dạng dd/mm/yyyy."
    }

    if (isSameDay(parsedStartDate, parsedEndDate)) {
      return "Ngày kết thúc phải lớn hơn ngày bắt đầu."
    }

    if (parsedEndDate < parsedStartDate) {
      return "Ngày kết thúc phải lớn hơn ngày bắt đầu."
    }

    return null
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

    if (scheduleType === "contract") {
      const contractDateValidationError = validateContractDateRange(contractStartDate, contractEndDate)
      if (contractDateValidationError) {
        return contractDateValidationError
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

    const jobPostDaysForPayload =
      scheduleType === "daily"
        ? normalizedSelectedDailyDates.map((date) => {
            const dateStr = toDateOnlyFromDate(date)
            const neededStr = dailyWorkersNeededMap[dateStr]
            const needed = neededStr ? Number.parseInt(neededStr, 10) : Number.parseInt(workersNeeded, 10) || 1
            return {
              workDate: dateStr,
              workersNeeded: !isNaN(needed) && needed > 0 ? needed : 1,
            }
          })
        : []
        
    const maxDailyNeeded = jobPostDaysForPayload.length 
      ? Math.max(...jobPostDaysForPayload.map(d => d.workersNeeded))
      : 1
    const workersNeededForPayload = scheduleType === "daily"
      ? Math.max(1, maxDailyNeeded)
      : Math.max(1, workersNeededNumber || 1)

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
      jobPostDays: jobPostDaysForPayload,
      requirements,
      privileges: benefits,
      wageAmount: incomeNumber,
      workersNeeded: workersNeededForPayload,
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

      const savedJobUnitIncome = savedJob.wageAmount ?? incomeNumber
      const savedJobDailyDaysCount =
        scheduleType === "daily"
          ? ((savedJob.jobPostDays?.length ?? 0) > 0 ? (savedJob.jobPostDays?.length ?? selectedDailyDaysCount) : selectedDailyDaysCount)
          : 1
      const savedJobWorkersNeeded =
        scheduleType === "daily"
          ? toDailyWorkersPerDay(savedJob.workersNeeded, savedJobDailyDaysCount)
          : Math.max(1, savedJob.workersNeeded ?? workersNeededNumber ?? 1)
      const postedIncome =
        scheduleType === "daily"
          ? savedJobUnitIncome * savedJobWorkersNeeded * savedJobDailyDaysCount
          : savedJobUnitIncome

      const postedPayload: PostedJobPreview = {
        id: savedJob.id,
        createdAt: savedJob.createdAt ?? nowISO,
        title: savedJob.title ?? title.trim(),
        income: postedIncome,
        workersNeeded: savedJobWorkersNeeded,
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

          let isDraftSaved = false
          let savedDraftId: string | null = null
          let autoSaveErrorMessage: string | null = null
          try {
            const contractDateValidationError =
              scheduleType === "contract"
                ? validateContractDateRange(contractStartDate, contractEndDate)
                : null

            if (contractDateValidationError) {
              autoSaveErrorMessage = contractDateValidationError
            } else {
              const savedDraftResponse = await jobService.saveDraft(buildDraftPayload())
              savedDraftId = savedDraftResponse.data?.id ?? null
              setIsDirty(false)
              isDirtyRef.current = false
              isDraftSaved = true
            }
          } catch (saveDraftError) {
            console.error(saveDraftError)
          }

          toast({
            title: "Số dư không đủ",
            description: autoSaveErrorMessage
              ? `Không thể tự động lưu bản nháp: ${autoSaveErrorMessage} Hệ thống đang chuyển hướng đến trang nạp tiền...`
              : isDraftSaved
                ? "Bản nháp đã được lưu. Hệ thống đang chuyển hướng đến trang nạp tiền..."
                : "Không đủ số dư và chưa lưu được bản nháp. Hệ thống đang chuyển hướng đến trang nạp tiền...",
            variant: "destructive",
          })

          const paymentRedirectParams = new URLSearchParams({
            openTopUp: "1",
            source: "create-job",
            returnTo: "/farmer/create-job",
            returnStep: "confirm",
          })

          if (savedDraftId) {
            paymentRedirectParams.set("draftId", savedDraftId)
          }

          router.push(`/farmer/payments?${paymentRedirectParams.toString()}`)
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
    setSelectedFarmId(farms[0]?.farmId || (farms[0] as any)?.id || DEFAULT_FARM_ID)
    setSelectedJobCategoryId(jobCategories[0]?.id ?? DEFAULT_JOB_CATEGORY_ID)
    setBenefits(["Bao ăn"])
    setNewBenefit("")
    setIsUrgent(DEFAULT_IS_URGENT)
    setScheduleType("contract")
    setContractStartDate("")
    setContractEndDate("")
    setDailyStartTime("09:00")
    setDailyEndTime("17:00")
    setDailyWorkersNeededMap({})
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

    const draftJobPostDays =
      scheduleType === "daily"
        ? normalizedSelectedDailyDates.map((d) => {
          const workDate = toDateOnlyFromDate(d)
          const perDayValue = dailyWorkersNeededMap[workDate]
          const parsedPerDay = perDayValue ? Number.parseInt(perDayValue, 10) : workersNeededNumber
          return {
            workDate,
            workersNeeded: !Number.isNaN(parsedPerDay) && parsedPerDay > 0 ? parsedPerDay : 1,
          }
        })
        : []

    const draftWorkersNeeded =
      scheduleType === "daily"
        ? (draftJobPostDays.length
          ? Math.max(...draftJobPostDays.map((day) => day.workersNeeded))
          : Math.max(1, workersNeededNumber || 1))
        : Math.max(1, workersNeededNumber || 1)

    return {
      skillIds: selectedSkillIds,
      farmId: selectedFarmId?.trim() || DEFAULT_FARM_ID,
      jobCategoryId: selectedJobCategoryId || DEFAULT_JOB_CATEGORY_ID,
      jobTypeId: scheduleType === "daily" ? JOB_TYPE_DAILY_ID : JOB_TYPE_CONTRACT_ID,
      title: title.trim() || "(Bản nháp)",
      description: description.trim(),
      address: location.trim(),
      startDate,
      endDate,
      startTime,
      endTime,
      jobPostDays: draftJobPostDays,
      requirements,
      privileges: benefits,
      wageAmount: incomeNumber,
      workersNeeded: draftWorkersNeeded,
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
    benefits, incomeNumber, workersNeededNumber, dailyWorkersNeededMap, isUrgent,
  ])

  const saveDraft = useCallback(async (): Promise<boolean> => {
    const contractDateValidationError =
      scheduleType === "contract"
        ? validateContractDateRange(contractStartDate, contractEndDate)
        : null

    if (contractDateValidationError) {
      setSubmitError(contractDateValidationError)
      toast({
        title: "Không thể lưu bản nháp",
        description: contractDateValidationError,
        variant: "destructive",
      })
      return false
    }

    try {
      setIsSavingDraft(true)
      const payload = buildDraftPayload()
      await jobService.saveDraft(payload)
      setSubmitError(null)
      setIsDirty(false)
      isDirtyRef.current = false
      toast({
        title: "Đã lưu bản nháp",
        description: "Bản nháp của bạn đã được lưu thành công.",
      })
      return true
    } catch {
      toast({
        title: "Lưu thất bại",
        description: "Không thể lưu bản nháp. Vui lòng thử lại.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSavingDraft(false)
    }
  }, [
    buildDraftPayload,
    contractEndDate,
    contractStartDate,
    scheduleType,
    toast,
    validateContractDateRange,
  ])

  const loadDraft = useCallback((
    draft: Job,
    options?: {
      step?: 1 | 2
      showToast?: boolean
    },
  ) => {
    setTitle(draft.title ?? "")
    setDescription(extractEditableDescription(draft.description ?? ""))
    setIncome(formatThousandsWithDots(String(draft.wageAmount ?? "")))
    setWorkersNeeded(String(Math.max(1, draft.workersNeeded ?? 1)))
    setLocation(draft.address ?? "")
    setRequirements(draft.requirements?.length ? draft.requirements : ["Có sức khỏe tốt"])
    setBenefits(draft.privileges?.length ? draft.privileges : ["Bao ăn"])
    rememberSkillLabels(draft.jobSkillRequirements ?? [])
    setSelectedSkillIds((draft.jobSkillRequirements ?? []).map((s) => s.id).filter(Boolean))
    setSelectedJobCategoryId(resolveJobCategoryId(draft))
    setSelectedFarmId(resolveFarmId(draft))
    setIsUrgent(Boolean(draft.isUrgent))
    setDailyStartTime(draft.startTime?.slice(0, 5) ?? "09:00")
    setDailyEndTime(draft.endTime?.slice(0, 5) ?? "17:00")

    if (draft.jobTypeId === JOB_TYPE_DAILY_ID) {
      setScheduleType("daily")
      setContractStartDate("")
      setContractEndDate("")
      const draftDays = draft.jobPostDays?.length
        ? draft.jobPostDays.map((day) => day.workDate)
        : (draft as any).selectedDays ?? []
      const dates = draftDays
        .map((d: string): Date | null => { const dd = new Date(d); return Number.isNaN(dd.getTime()) ? null : startOfDay(dd) })
        .filter((d: Date | null): d is Date => d !== null)
      setSelectedDailyDates(dates)

      const initialDailyWorkersNeeded: Record<string, string> = {}
      ;(draft.jobPostDays ?? []).forEach((day) => {
        const dateStr = day.workDate.split("T")[0]
        initialDailyWorkersNeeded[dateStr] = String(Math.max(1, day.workersNeeded ?? 1))
      })
      setDailyWorkersNeededMap(initialDailyWorkersNeeded)

      const draftDayWorkers = draft.jobPostDays?.map((day) => day.workersNeeded) ?? []
      const maxWorkersNeeded = draftDayWorkers.length
        ? Math.max(...draftDayWorkers)
        : toDailyWorkersPerDay(draft.workersNeeded, dates.length)
      setWorkersNeeded(String(Math.max(1, maxWorkersNeeded)))
    } else {
      setScheduleType("contract")
      setSelectedDailyDates([])
      setDailyWorkersNeededMap({})
      setWorkersNeeded(String(Math.max(1, draft.workersNeeded ?? 1)))
      setContractStartDate(draft.startDate ? formatDateDDMMYYYY(draft.startDate) : "")
      setContractEndDate(draft.endDate ? formatDateDDMMYYYY(draft.endDate) : "")
    }

    setStep(options?.step ?? 1)

    if (options?.showToast !== false) {
      toast({ title: "Đã tải bản nháp", description: `"${draft.title}" đã được tải vào form.` })
    }
  }, [toast, rememberSkillLabels])

  useEffect(() => {
    if (isEditMode || isHydratingPresetJobRef.current) {
      return
    }

    const resumeFromTopUp = searchParams.get("resumeFromTopUp") === "1"

    if (!resumeFromTopUp && !repostFromJobId) {
      return
    }

    isHydratingPresetJobRef.current = true

    const finalizeResume = () => {
      router.replace("/farmer/create-job")
    }

    if (resumeFromTopUp) {
      const draftId = searchParams.get("draftId")?.trim()
      const shouldGoToConfirmStep = (searchParams.get("step") || "").toLowerCase() === "confirm"

      if (!draftId) {
        setSubmitError("Nạp tiền thành công. Vui lòng kiểm tra lại thông tin trước khi đăng tin.")
        if (shouldGoToConfirmStep) {
          setStep(2)
        }
        finalizeResume()
        return
      }

      const hydrateDraftAfterTopUp = async () => {
        try {
          setIsLoadingExistingJob(true)
          const response = await jobService.getJobDetail(draftId)
          loadDraft(response.data as Job, {
            step: shouldGoToConfirmStep ? 2 : 1,
            showToast: false,
          })
          setSubmitError(null)
          setIsDirty(false)
          isDirtyRef.current = false

          toast({
            title: "Nạp tiền thành công",
            description: "Hệ thống đã khôi phục bản nháp. Bạn có thể xác nhận đăng tin ngay.",
          })
        } catch {
          setSubmitError("Đã nạp tiền nhưng không thể khôi phục bản nháp. Vui lòng kiểm tra lại thông tin trước khi đăng tin.")
        } finally {
          setIsLoadingExistingJob(false)
          finalizeResume()
        }
      }

      void hydrateDraftAfterTopUp()
      return
    }

    const hydrateCancelledJobForRepost = async () => {
      try {
        setIsLoadingExistingJob(true)
        const response = await jobService.getJobDetail(repostFromJobId)
        loadDraft(response.data as Job, {
          step: 1,
          showToast: false,
        })
        setSubmitError(null)
        setIsDirty(false)
        isDirtyRef.current = false

        toast({
          title: "Đã tải dữ liệu bài đăng",
          description: "Bạn có thể chỉnh sửa nội dung, lưu nháp hoặc đăng lại ngay.",
        })
      } catch {
        setSubmitError("Không thể tải dữ liệu bài đăng để đăng lại. Vui lòng thử lại.")
      } finally {
        setIsLoadingExistingJob(false)
        finalizeResume()
      }
    }

    void hydrateCancelledJobForRepost()
  }, [isEditMode, loadDraft, router, searchParams, toast])

  // ─── Navigation interception ──────────────────────────────────────────────

  const queueLeaveAction = useCallback((action: Exclude<PendingLeaveAction, null>) => {
    pendingLeaveActionRef.current = action
    setIsLeavingPromptOpen(true)
  }, [])

  const continuePendingLeaveAction = useCallback(() => {
    const pendingAction = pendingLeaveActionRef.current
    pendingLeaveActionRef.current = null

    if (!pendingAction) {
      return
    }

    if (pendingAction.type === "route") {
      router.push(pendingAction.url)
      return
    }

    allowBrowserExitRef.current = true

    if (pendingAction.type === "reload") {
      window.location.reload()
    }
  }, [router])

  // Intercept browser tab close / refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (allowBrowserExitRef.current) {
        return
      }

      if (isDirtyRef.current && !postedJobRef.current) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  // Intercept in-app anchor navigation and show leave dialog if form has unsaved changes.
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!isDirtyRef.current || postedJobRef.current) {
        return
      }

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = event.target as HTMLElement | null
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null

      if (!anchor) {
        return
      }

      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return
      }

      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return
      }

      const destination = new URL(anchor.href, window.location.href)
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
      const next = `${destination.pathname}${destination.search}${destination.hash}`

      if (destination.origin !== window.location.origin || current === next) {
        return
      }

      event.preventDefault()
      queueLeaveAction({ type: "route", url: next })
    }

    document.addEventListener("click", handleDocumentClick, true)
    return () => document.removeEventListener("click", handleDocumentClick, true)
  }, [queueLeaveAction])

  // Intercept keyboard reload and route it through the leave prompt.
  useEffect(() => {
    const handleKeyboardReload = (event: globalThis.KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const isReloadShortcut = event.key === "F5" || ((event.ctrlKey || event.metaKey) && key === "r")

      if (!isReloadShortcut || !isDirtyRef.current || postedJobRef.current) {
        return
      }

      event.preventDefault()
      queueLeaveAction({ type: "reload" })
    }

    window.addEventListener("keydown", handleKeyboardReload)
    return () => window.removeEventListener("keydown", handleKeyboardReload)
  }, [queueLeaveAction])

  // Uses the ref (not state) so the callback never captures a stale dirty value
  const handleNavigateAway = useCallback((url: string) => {
    if (isDirtyRef.current && !postedJobRef.current) {
      queueLeaveAction({ type: "route", url })
    } else {
      router.push(url)
    }
  }, [queueLeaveAction, router])

  const handleLeavingPromptSaveDraft = useCallback(async () => {
    const isSaved = await saveDraft()
    if (!isSaved) {
      return
    }

    setIsLeavingPromptOpen(false)
    continuePendingLeaveAction()
  }, [continuePendingLeaveAction, saveDraft])

  const handleLeavingPromptLeave = useCallback(() => {
    setIsLeavingPromptOpen(false)
    setIsDirty(false)
    isDirtyRef.current = false
    continuePendingLeaveAction()
  }, [continuePendingLeaveAction])

  const handleLeavingPromptStay = useCallback(() => {
    setIsLeavingPromptOpen(false)
    pendingLeaveActionRef.current = null
    allowBrowserExitRef.current = false
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
      <div className="relative overflow-hidden rounded-2xl border bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 p-5 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/20">
        <div className="pointer-events-none absolute -top-12 right-6 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-700/20" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isEditMode
                ? "Chỉnh sửa tin tuyển dụng"
                : repostFromJobId
                  ? "Đăng lại tin tuyển dụng"
                  : "Đăng tin tuyển dụng"}
            </h1>
            <p className="text-muted-foreground mt-1 mb-2">
              {isEditMode
                ? "Cập nhật nội dung bài đăng để phù hợp hơn với nhu cầu tuyển dụng hiện tại."
                : repostFromJobId
                  ? "Dữ liệu từ tin đã hủy đã được nạp sẵn. Bạn có thể chỉnh sửa trước khi lưu nháp hoặc đăng lại."
                : "Tạo nhân công phù hợp cho địa điểm canh tác của bạn."}
            </p>
          </div>

          {!postedJob && (
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 sm:gap-6 mt-4 sm:mt-0">
              {/* Draft buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white/50 backdrop-blur-sm border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-colors shadow-sm"
                  onClick={() => setIsDraftDialogOpen(true)}
                >
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">Bản nháp</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white/50 backdrop-blur-sm border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-colors shadow-sm"
                  onClick={() => {
                    void saveDraft()
                  }}
                  disabled={isSavingDraft}
                >
                  {isSavingDraft ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-r-transparent inline-block" />
                      <span className="font-medium">Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium">Lưu nháp</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Divider for desktop */}
              <div className="hidden sm:block h-8 w-px bg-emerald-200/60 dark:bg-emerald-800/60" />

              {/* Step indicator */}
              <div className="flex items-center gap-2 sm:gap-3 py-1">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-sm",
                    step === 1 ? "border-agro-green bg-agro-green text-white scale-110" : "border-agro-green bg-white text-agro-green"
                  )}>
                    {step > 1 ? <Check className="h-4 w-4" /> : <span className="text-sm font-bold">1</span>}
                  </div>
                  <div className="hidden lg:block">
                    <p className={cn("text-[10px] font-bold uppercase tracking-wider", step === 1 ? "text-agro-green" : "text-muted-foreground")}>Bước 1</p>
                    <p className={cn("text-xs font-semibold", step === 1 ? "text-foreground" : "text-muted-foreground")}>Soạn thảo</p>
                  </div>
                </div>

                <div className="h-0.5 w-8 sm:w-10 overflow-hidden rounded-full bg-emerald-100">
                  <div className={cn("h-full bg-agro-green transition-all duration-500", step === 2 ? "w-full" : "w-0")} />
                </div>

                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-sm",
                    step === 2 ? "border-agro-green bg-agro-green text-white scale-110" : "border-emerald-100 bg-white text-muted-foreground"
                  )}>
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <div className="hidden lg:block">
                    <p className={cn("text-[10px] font-bold uppercase tracking-wider", step === 2 ? "text-agro-green" : "text-muted-foreground")}>Bước 2</p>
                    <p className={cn("text-xs font-semibold", step === 2 ? "text-foreground" : "text-muted-foreground")}>Xác nhận</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {postedJob ? (
        <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
          <Card className="border-emerald-100 shadow-2xl shadow-emerald-500/10 overflow-hidden bg-white dark:bg-zinc-900">
            <div className="h-2 w-full bg-linear-to-r from-agro-green to-emerald-400" />
            <div className="p-8 md:p-12 text-center space-y-6">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 mb-2 relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />
                <CheckCheck className="h-10 w-10 relative z-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-bold tracking-tight text-foreground">
                  {isEditMode ? "Cập nhật thành công!" : "Đăng tin thành công!"}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto text-lg">
                  {isEditMode
                    ? "Nội dung bài đăng đã được cập nhật và hiển thị đến các ứng viên."
                    : "Tin tuyển dụng của bạn đã được đăng công khai và sẵn sàng nhận ứng viên."}
                </p>
              </div>

              <div className="grid gap-4 py-8">
                <div className="rounded-2xl border bg-muted/30 p-6 grid gap-4 md:grid-cols-2 text-left">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tiêu đề</p>
                    <p className="font-semibold text-foreground wrap-break-word">{postedJob.title}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Địa điểm</p>
                    <p className="font-semibold text-foreground wrap-break-word">{postedJob.location}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" variant="outline" asChild className="h-12 px-8 font-semibold hover:bg-muted transition-all">
                  <Link href="/farmer/jobs">Quản lý bài đăng</Link>
                </Button>
                <Button size="lg" className="h-12 px-8 font-semibold transition-all cursor-pointer hover:bg-agro-green-dark" onClick={() => (isEditMode ? setPostedJob(null) : resetAll())}>
                  {isEditMode ? "Chỉnh sửa thêm" : "Tiếp tục đăng tin"}
                </Button>
                <Button size="lg" asChild className="h-12 px-8 font-semibold bg-agro-green hover:bg-agro-green-dark text-white shadow-lg shadow-agro-green/20">
                  <Link href={`/farmer/jobs/${postedJob.id}`}>
                    Xem bài đăng
                    <ArrowUpRight className="-ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {step === 1 ? (
            <div className="space-y-8 max-w-7xl mx-auto">
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
                      <div className="flex items-center justify-between rounded-lg border border-red-500 bg-red-100 p-3 h-11">
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
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Khoảng thời gian <span className="text-destructive">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                              {contractStartDate && contractEndDate
                                ? `${contractStartDate} - ${contractEndDate}`
                                : contractStartDate
                                  ? `${contractStartDate} - Chọn ngày kết thúc`
                                  : "Chọn ngày bắt đầu và ngày kết thúc"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              selected={selectedContractDateRange}
                              onSelect={handleContractRangeSelect}
                              numberOfMonths={2}
                              disabled={(d) => d < tomorrow}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          {/* <Label className="text-xs font-bold uppercase text-muted-foreground">Ngày bắt đầu <span className="text-destructive">*</span></Label> */}
                          <Input value={contractStartDate} placeholder="dd/mm/yyyy" readOnly className="bg-muted/30" />
                        </div>
                        <div className="space-y-2">
                          {/* <Label className="text-xs font-bold uppercase text-muted-foreground">Ngày kết thúc <span className="text-destructive">*</span></Label> */}
                          <Input value={contractEndDate} placeholder="dd/mm/yyyy" readOnly className="bg-muted/30" />
                        </div>
                      </div>
                      <div className="space-y-2 border-t pt-4">
                        <div className="flex justify-between text-sm">
                          <span>Tiền công <span className="text-destructive">*</span></span>
                        </div>
                        <div className="relative">
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={income}
                            onChange={(e) => setIncome(formatThousandsWithDots(e.target.value))}
                            className="pr-12 text-lg font-medium text-teal-700 dark:text-teal-400"
                            placeholder="Điền số tiền bạn muốn"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">VNĐ</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 animate-in fade-in zoom-in-95 duration-300 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
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
                        <div className="flex justify-center rounded-md bg-background p-1">
                          <Calendar
                            key={calendarSelectionSignature}
                            mode="multiple"
                            selected={calendarSelectedDates}
                            onDayClick={handleDailyCalendarDayClick}
                            disabled={(d) => d < tomorrow}
                          />
                        </div>
                        <div className="mt-2 text-center">
                          <Badge variant="secondary" className="font-normal">
                            {selectedDailyDaysCount > 0 ? `Đã chọn ${selectedDailyDaysCount} ngày` : "Chưa chọn ngày"}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-4 rounded-lg border bg-muted/20 p-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Giờ bắt đầu</Label>
                            <TimePicker value={dailyStartTime} onChange={setDailyStartTime} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Giờ kết thúc</Label>
                            <TimePicker value={dailyEndTime} onChange={setDailyEndTime} />
                          </div>
                        </div>

                        <div className="space-y-2 border-t pt-4">
                          <Label className="flex justify-between">
                            <span>Số lượng nhân công mỗi ngày <span className="text-destructive">*</span></span>
                          </Label>
                          {normalizedSelectedDailyDates.length === 0 ? (
                            <div className="text-sm text-muted-foreground italic py-2">Vui lòng chọn ngày trên lịch</div>
                          ) : (
                            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                              {normalizedSelectedDailyDates.map((date) => {
                                const dateStr = toDateOnlyFromDate(date);
                                const currentVal = dailyWorkersNeededMap[dateStr] !== undefined ? dailyWorkersNeededMap[dateStr] : workersNeeded;
                                return (
                                  <div key={dateStr} className="flex items-center justify-between gap-3 p-2 rounded-md bg-background border">
                                    <span className="text-sm font-medium">{date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                                    <div className="flex items-center gap-2">
                                      <Input 
                                        type="number" 
                                        min="1" 
                                        value={currentVal} 
                                        onChange={(e) => setDailyWorkersNeededMap(prev => ({...prev, [dateStr]: e.target.value}))}
                                        className="w-20 h-8 text-center" 
                                      />
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => removeSelectedDailyDate(date)}
                                        aria-label={`Xóa ngày ${date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 border-t pt-4">
                          <div className="flex justify-between text-sm">
                            <span>Đơn giá <span className="text-destructive">*</span></span>
                          </div>
                          <div className="relative">
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={income}
                              onChange={(e) => setIncome(formatThousandsWithDots(e.target.value))}
                              className="pr-12 text-lg font-medium text-teal-700 dark:text-teal-400"
                              placeholder="Điền số tiền bạn muốn"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">VNĐ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                      className="h-full"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Bản đồ chỉ hiển thị vị trí đã chọn.</p>
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
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={toggleAllVisibleSkills}
                          disabled={isLoadingSkills || availableSkills.length === 0}
                        >
                          <CheckSquare className="mr-2 h-4 w-4" />
                          {availableSkills.length > 0 && availableSkills.every((skill) => selectedSkillIds.includes(skill.id))
                            ? "Bỏ chọn tất cả"
                            : "Chọn tất cả"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsAddSkillDialogOpen(true)
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" /> Thêm kỹ năng
                        </Button>
                      </div>
                    </div>

                    <Dialog open={isAddSkillDialogOpen} onOpenChange={setIsAddSkillDialogOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Thêm kỹ năng</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label>Danh mục công việc <span className="text-destructive">*</span></Label>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between font-normal"
                              disabled
                            >
                              {selectedJobCategoryLabel || "Chọn danh mục ở phần thông tin công việc"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
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
                          <Button
                            type="button"
                            onClick={handleCreateSkill}
                            disabled={
                              isCreatingSkill ||
                              !newSkillName.trim()
                            }
                          >
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
                                onClick={() => toggleSkill(skill.id)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary cursor-pointer"
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
              <div className="sticky bottom-6 z-1000 bg-white dark:bg-zinc-900/80 p-5 border rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="text-sm flex items-center gap-2">
                  {submitError ? (
                    <span className="flex items-center text-rose-600 font-semibold bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100"><Info className="mr-2 h-4 w-4" /> {submitError}</span>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                      <div className="h-1.5 w-1.5 rounded-full bg-agro-green animate-pulse" />
                      <span>Vui lòng điền đủ thông tin <span className="text-destructive font-bold">*</span></span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button type="button" variant="ghost" className="flex-1 sm:flex-none font-semibold hover:bg-muted" onClick={() => handleNavigateAway("/farmer/jobs")}>
                    Hủy bỏ
                  </Button>
                  <Button type="button" onClick={goToPreview} className="flex-1 sm:flex-none shadow-lg shadow-agro-green/10 bg-agro-green hover:bg-agro-green-dark text-white font-bold h-11 px-8">
                    Tiếp theo <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Preview */
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <Card className="shadow-2xl border-0 overflow-hidden rounded-3xl bg-white dark:bg-zinc-900">
                <div className="bg-gradient-to-r from-agro-green/10 via-background to-background p-8 md:p-12 border-b">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                      <Badge className="bg-agro-green/10 text-agro-green border-agro-green/20 hover:bg-agro-green/20 mb-2">XÁC NHẬN BÀI ĐĂNG</Badge>
                      <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight">{title}</CardTitle>
                      <CardDescription className="text-lg">Kiểm tra kỹ thông tin trước khi xuất bản tin tuyển dụng</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className={cn("px-4 py-1.5 text-sm font-bold uppercase tracking-widest", isUrgent ? "bg-rose-50 text-rose-600 border-rose-200 shadow-sm" : "bg-blue-50 text-blue-700 border-blue-200")}>
                        {isUrgent ? "Tuyển gấp" : "Tiêu chuẩn"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <CardContent className="p-8 md:p-12 space-y-12">
                  {/* Key Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-muted/20 p-8 rounded-3xl border border-muted-foreground/10">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Đơn giá</p>
                      <div className="flex items-center text-xl font-extrabold text-agro-green"><Banknote className="mr-2 h-5 w-5" /> {formatCurrency(incomeNumber)}</div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Loại hình</p>
                      <div className="flex items-center text-xl font-bold"><CalendarRange className="mr-2 h-5 w-5 text-indigo-500" /> {scheduleType === "contract" ? "Khoán" : "Theo ngày"}</div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Nhân công</p>
                      <div className="flex items-center text-xl font-bold"><Users className="mr-2 h-5 w-5 text-amber-500" /> {scheduleType === "daily" ? (normalizedSelectedDailyDates.length > 0 ? (() => {
                        const dailyWorkersArr = normalizedSelectedDailyDates.map(date => {
                          const dateStr = toDateOnlyFromDate(date)
                          const neededStr = dailyWorkersNeededMap[dateStr]
                          return neededStr ? Number.parseInt(neededStr, 10) : Number.parseInt(workersNeeded, 10) || 1
                        });
                        const min = Math.min(...dailyWorkersArr);
                        const max = Math.max(...dailyWorkersArr);
                        return min === max ? `${max} người/ngày` : `${min}-${max} người/ngày`;
                      })() : `${workersNeededNumber} người/ngày`) : `${workersNeededNumber} người`}</div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Khu vực</p>
                      <div className="flex items-center text-xl font-bold truncate" title={selectedFarmLabel}><MapPin className="mr-2 h-5 w-5 text-rose-500" /> {selectedFarmLabel.split(',')[0]}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-agro-green p-6 rounded-2xl text-white shadow-xl shadow-agro-green/20">
                    <div>
                      <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Tổng chi phí dự tính</p>
                      <p className="text-2xl font-black">{formatCurrency(scheduleType === "contract" ? incomeNumber : incomeNumber * normalizedSelectedDailyDates.reduce((sum, date) => {
                        const dateStr = toDateOnlyFromDate(date)
                        const neededStr = dailyWorkersNeededMap[dateStr]
                        return sum + (neededStr ? Number.parseInt(neededStr, 10) : Number.parseInt(workersNeeded, 10) || 1)
                      }, 0))}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl">
                      <div className="h-8 w-8 text-white font-bold flex items-center">VNĐ</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-5 gap-12">
                    <div className="md:col-span-3 space-y-8">
                      <div className="space-y-4">
                        <h4 className="flex items-center text-xs font-black uppercase text-foreground bg-muted/50 w-fit px-3 py-1 rounded-full">
                          Mô tả công việc
                        </h4>
                        <div className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {description}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="flex items-center text-xs font-black uppercase text-foreground bg-muted/50 w-fit px-3 py-1 rounded-full">
                          Kỹ năng
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedSkillIds.length > 0 ? (
                            selectedSkillIds.map(id => (
                              <Badge key={id} variant="secondary" className="px-4 py-1.5 font-bold bg-secondary text-secondary-foreground">{getSkillLabel(id)}</Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground italic">Không yêu cầu</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-8">
                      <div className="space-y-4">
                        <h4 className="flex items-center text-xs font-black uppercase text-foreground bg-muted/50 w-fit px-3 py-1 rounded-full">
                          Thời gian cụ thể
                        </h4>
                        <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-6 border space-y-4">
                          {scheduleType === "contract" ? (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center"><span className="text-muted-foreground font-medium">Ngày bắt đầu:</span> <span className="font-bold text-lg">{formatDateDDMMYYYY(contractStartDate)}</span></div>
                              <div className="flex justify-between items-center"><span className="text-muted-foreground font-medium">Ngày kết thúc:</span> <span className="font-bold text-lg">{formatDateDDMMYYYY(contractEndDate)}</span></div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center"><span className="text-muted-foreground font-medium">Tổng số ngày:</span> <span className="font-bold text-lg text-agro-green">{selectedDailyDaysCount} ngày</span></div>
                              <div className="flex justify-between items-center"><span className="text-muted-foreground font-medium">Khung giờ làm:</span> <span className="font-bold text-lg">{dailyStartTime} - {dailyEndTime}</span></div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="flex items-center text-xs font-black uppercase text-foreground bg-muted/50 w-fit px-3 py-1 rounded-full">
                          Quyền lợi & Yêu cầu
                        </h4>
                        <div className="grid gap-3">
                          {benefits.length > 0 ? benefits.map(b => (
                            <div key={b} className="flex items-center gap-2 text-sm font-semibold text-emerald-600"><CheckCheck className="h-4 w-4 shrink-0" /> {b}</div>
                          )) : null}
                          {requirements.length > 0 ? requirements.map(r => (
                            <div key={r} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Plus className="h-4 w-4 shrink-0" /> {r}</div>
                          )) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardContent className="bg-muted/10 border-t p-8 md:p-12 flex flex-col sm:flex-row justify-between items-center gap-6">
                  {submitError && <p className="text-rose-600 font-bold flex items-center bg-rose-50 px-4 py-2 rounded-xl"><Info className="mr-2 h-4 w-4" /> {submitError}</p>}
                  <div className="flex gap-4 w-full sm:w-auto ml-auto">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1 sm:flex-none font-bold h-12">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Chỉnh sửa
                    </Button>
                    <Button type="button" size="lg" onClick={submitJob} disabled={isSubmitting} className="flex-1 sm:flex-none shadow-2xl shadow-agro-green/20 bg-agro-green hover:bg-agro-green-dark text-white font-black h-14 px-10 rounded-2xl">
                      {isSubmitting ? "ĐANG XỬ LÝ..." : isEditMode ? "CẬP NHẬT NGAY" : "XÁC NHẬN & ĐĂNG TIN"}
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
