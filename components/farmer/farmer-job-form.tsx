"use client"

import { type KeyboardEvent, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCheck, MapPinned, Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
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

const SKILL_OPTIONS = [
  "Thu hoạch",
  "Gieo trồng",
  "Làm đất",
  "Tưới tiêu",
  "Phun thuốc",
  "Vận chuyển nông sản",
]

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

  const [skills, setSkills] = useState<string[]>(["Thu hoạch"])

  const [benefits, setBenefits] = useState<string[]>(["Bao ăn"])
  const [newBenefit, setNewBenefit] = useState("")

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

  const toggleSkill = (skillName: string) => {
    setSkills((currentSkills) =>
      currentSkills.includes(skillName)
        ? currentSkills.filter((item) => item !== skillName)
        : [...currentSkills, skillName],
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

    if (!requirements.length) {
      return "Vui lòng thêm ít nhất 1 yêu cầu."
    }

    if (!skills.length) {
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

  const postFakeJob = () => {
    const payload: PostedJobPreview = {
      id: `JOB-${Date.now()}`,
      createdAt: new Date().toISOString(),
      title: title.trim(),
      income: incomeNumber,
      workersNeeded: workersNeededNumber,
      location: location.trim(),
      locationLat,
      locationLng,
      requirements,
      skills,
      benefits,
      scheduleType,
      contractStartDate: scheduleType === "contract" ? contractStartDate : undefined,
      contractEndDate: scheduleType === "contract" ? contractEndDate : undefined,
      daysToHire: scheduleType === "daily" ? daysToHireNumber : undefined,
      dailyStartTime: scheduleType === "daily" ? dailyStartTime : undefined,
      dailyEndTime: scheduleType === "daily" ? dailyEndTime : undefined,
    }

    setPostedJob(payload)
    setSubmitError(null)
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
    setSkills(["Thu hoạch"])
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
              Đăng bài thành công (fake data)
            </CardTitle>
            <CardDescription>Tin đã được tạo phía client, chưa gọi backend.</CardDescription>
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
                  <CardTitle>Thông tin chính</CardTitle>
                  <CardDescription>Tiêu đề, thu nhập, số lượng nhân công và địa điểm.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div>
                    <Label htmlFor="job-title">Tiêu đề (tên công việc) *</Label>
                    <Input
                      id="job-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="VD: Thu hoạch dưa lưới nhà màng C1"
                      className="mt-2"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="income">Thu nhập (VNĐ) *</Label>
                      <Input
                        id="income"
                        type="number"
                        min="0"
                        value={income}
                        onChange={(event) => setIncome(event.target.value)}
                        placeholder="Ví dụ: 300000"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="workers-needed">Số lượng nhân công cần *</Label>
                      <Input
                        id="workers-needed"
                        type="number"
                        min="1"
                        value={workersNeeded}
                        onChange={(event) => setWorkersNeeded(event.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Địa điểm (OpenStreetMap) *</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(event) => {
                        setLocation(event.target.value)
                        setLocationLat(undefined)
                        setLocationLng(undefined)
                      }}
                      placeholder="Nhập địa điểm"
                      className="mt-2"
                    />
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
                  </div>

                  <div className="overflow-hidden rounded-xl border">
                    <div className="flex items-center gap-2 border-b bg-muted/30 p-3 text-sm text-muted-foreground">
                      <MapPinned className="h-4 w-4" />
                      Xem nhanh vị trí
                    </div>
                    {locationLat != null && locationLng != null ? (
                      <iframe
                        title="OpenStreetMap preview"
                        src={buildOSMEmbedUrl(locationLat, locationLng)}
                        className="h-70 w-full"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-70 items-center justify-center p-4 text-center text-sm text-muted-foreground">
                        Chọn một địa điểm từ gợi ý để hiển thị bản đồ.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
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
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kinh nghiệm</CardTitle>
                  <CardDescription>Chọn skill cần thiết (đang dùng danh sách hardcode tạm thời).</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {SKILL_OPTIONS.map((skillName) => {
                    const isSelected = skills.includes(skillName)

                    return (
                      <label
                        key={skillName}
                        htmlFor={`skill-${skillName}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3",
                          isSelected ? "border-primary bg-primary/5" : "border-border",
                        )}
                      >
                        <Checkbox
                          id={`skill-${skillName}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleSkill(skillName)}
                        />
                        <span>{skillName}</span>
                      </label>
                    )
                  })}
                </CardContent>
              </Card>

              <Card>
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
              </Card>

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
                        <Input
                          id="contract-start"
                          type="text"
                          value={contractStartDate}
                          onChange={(event) => setContractStartDate(event.target.value)}
                          placeholder="dd/mm/yyyy"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contract-end">Ngày kết thúc *</Label>
                        <Input
                          id="contract-end"
                          type="text"
                          value={contractEndDate}
                          onChange={(event) => setContractEndDate(event.target.value)}
                          placeholder="dd/mm/yyyy"
                          className="mt-2"
                        />
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
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Yêu cầu</p>
                  <div className="flex flex-wrap gap-2">
                    {requirements.map((item, index) => (
                      <Badge key={`${item}-${index}`} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Kinh nghiệm</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((item) => (
                      <Badge key={item} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Quyền lợi</p>
                  <div className="flex flex-wrap gap-2">
                    {benefits.map((item, index) => (
                      <Badge key={`${item}-${index}`} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

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
                  <Button type="button" onClick={postFakeJob}>
                    Xác nhận đăng bài
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
