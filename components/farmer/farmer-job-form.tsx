"use client"

import { type KeyboardEvent, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BriefcaseBusiness, CalendarDays, CheckCheck, Coins, Info, Plus, TimerReset, Users, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/libs/utils"

type PaymentMode = "daily" | "contract"
type ApprovedWorker = {
  id: string
  name: string
  role: string
  status: string
}

type SchedulePlaceholder = {
  id: string
  dateLabel: string
  shortLabel: string
  timeRange: string
  area: string
  workers: ApprovedWorker[]
}

const jobTypes = [
  { value: "harvest", label: "Thu hoạch" },
  { value: "planting", label: "Gieo trồng" },
  { value: "soil", label: "Làm đất" },
  { value: "care", label: "Chăm sóc cây" },
  { value: "spray", label: "Phun thuốc" },
  { value: "transport", label: "Vận chuyển" },
  { value: "other", label: "Khác" },
]

const paymentModeOptions: Array<{
  value: PaymentMode
  title: string
  description: string
  helper: string
}> = [
  {
    value: "daily",
    title: "Tính công theo ngày",
    description: "Phù hợp khi trả công theo số ngày làm và số người tham gia.",
    helper: "Nhập đơn giá theo người/ngày. Hệ thống sẽ ước tính ngân sách theo số ngày làm việc.",
  },
  {
    value: "contract",
    title: "Khoán trọn công việc",
    description: "Phù hợp khi chốt giá cho toàn bộ đầu việc hoặc một khối lượng cụ thể.",
    helper: "Không tính lương theo giờ. Thời gian chỉ dùng để hẹn ca làm và theo dõi tiến độ.",
  },
]

const schedulePlaceholders: SchedulePlaceholder[] = [
  {
    id: "2026-03-18",
    dateLabel: "Thứ Tư, 18/03/2026",
    shortLabel: "18/03",
    timeRange: "06:00 - 11:00",
    area: "Lô xoài A3",
    workers: [
      { id: "w1", name: "Nguyễn Văn Phát", role: "Cắt cỏ", status: "Đã duyệt" },
      { id: "w2", name: "Trần Thị Hồng", role: "Thu gom cành", status: "Đã duyệt" },
      { id: "w3", name: "Lê Minh Tâm", role: "Bốc xếp", status: "Đã duyệt" },
    ],
  },
  {
    id: "2026-03-19",
    dateLabel: "Thứ Năm, 19/03/2026",
    shortLabel: "19/03",
    timeRange: "06:30 - 15:30",
    area: "Ruộng lúa khu B",
    workers: [
      { id: "w4", name: "Phạm Quốc Bảo", role: "Thu hoạch lúa", status: "Đã duyệt" },
      { id: "w5", name: "Đỗ Thị Lan", role: "Đóng bao", status: "Đã duyệt" },
    ],
  },
  {
    id: "2026-03-21",
    dateLabel: "Thứ Bảy, 21/03/2026",
    shortLabel: "21/03",
    timeRange: "07:00 - 16:00",
    area: "Vườn bưởi phía sau kho",
    workers: [
      { id: "w6", name: "Võ Thanh Hà", role: "Bao trái", status: "Đã duyệt" },
      { id: "w7", name: "Huỳnh Quốc Anh", role: "Phân loại trái", status: "Đã duyệt" },
      { id: "w8", name: "Ngô Thị Yến", role: "Vận chuyển sọt", status: "Đã duyệt" },
      { id: "w9", name: "Bùi Nhật Nam", role: "Hỗ trợ kiểm đếm", status: "Đã duyệt" },
    ],
  },
  {
    id: "2026-03-22",
    dateLabel: "Chủ Nhật, 22/03/2026",
    shortLabel: "22/03",
    timeRange: "05:30 - 10:30",
    area: "Nhà màng dưa lưới C1",
    workers: [
      { id: "w10", name: "Mai Khánh Vy", role: "Tỉa lá", status: "Đã duyệt" },
      { id: "w11", name: "Tạ Văn Hậu", role: "Thu gom dây", status: "Đã duyệt" },
    ],
  },
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)

export function FarmerJobForm() {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("daily")
  const [selectedScheduleId, setSelectedScheduleId] = useState(schedulePlaceholders[0].id)
  const [requirements, setRequirements] = useState<string[]>(["Có sức khỏe tốt"])
  const [newRequirement, setNewRequirement] = useState("")
  const [benefits, setBenefits] = useState<string[]>(["Bao ăn trưa"])
  const [newBenefit, setNewBenefit] = useState("")
  const [workersNeeded, setWorkersNeeded] = useState("5")
  const [workDays, setWorkDays] = useState("1")
  const [amount, setAmount] = useState("")
  const [startTime, setStartTime] = useState("06:00")
  const [endTime, setEndTime] = useState("17:00")

  const paymentCopy = useMemo(
    () =>
      paymentMode === "daily"
        ? {
            amountLabel: "Đơn giá theo ngày (VNĐ/người/ngày) *",
            amountPlaceholder: "Ví dụ: 280000",
            amountHint: "Số tiền mỗi người nhận cho một ngày làm việc hoàn chỉnh.",
            extraLabel: "Khối lượng công việc trong ngày",
            extraPlaceholder: "Ví dụ: Cắt cỏ 2 sào, gom trái trong vườn, làm cỏ luống dưa...",
            extraHint: "Mô tả để người lao động biết trong 1 ngày cần hoàn thành phần việc nào.",
            summaryTitle: "Ước tính ngân sách theo ngày",
            summaryFormula: "Đơn giá × số người × số ngày",
          }
        : {
            amountLabel: "Tiền khoán trọn gói (VNĐ/công việc) *",
            amountPlaceholder: "Ví dụ: 2500000",
            amountHint: "Tổng tiền trả cho toàn bộ đầu việc hoặc gói việc đã mô tả.",
            extraLabel: "Khối lượng khoán *",
            extraPlaceholder: "Ví dụ: Thu hoạch 2 công lúa, đóng bao và chuyển ra điểm tập kết.",
            extraHint: "Nêu rõ khối lượng hoặc đầu việc để worker biết tiêu chí hoàn thành.",
            summaryTitle: "Ước tính ngân sách khoán",
            summaryFormula: "Tiền khoán trọn gói cho cả công việc",
          },
    [paymentMode],
  )

  const { subtotal, fee, total } = useMemo(() => {
    const parsedAmount = Number.parseInt(amount, 10) || 0
    const parsedWorkers = Number.parseInt(workersNeeded, 10) || 0
    const parsedDays = Number.parseInt(workDays, 10) || 0

    const estimatedSubtotal = paymentMode === "daily" ? parsedAmount * parsedWorkers * parsedDays : parsedAmount
    const estimatedFee = Math.round(estimatedSubtotal * 0.05)

    return {
      subtotal: estimatedSubtotal,
      fee: estimatedFee,
      total: estimatedSubtotal + estimatedFee,
    }
  }, [amount, paymentMode, workDays, workersNeeded])

  const selectedSchedule = useMemo(
    () => schedulePlaceholders.find((schedule) => schedule.id === selectedScheduleId) ?? schedulePlaceholders[0],
    [selectedScheduleId],
  )

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()])
      setNewRequirement("")
    }
  }

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index))
  }

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setBenefits([...benefits, newBenefit.trim()])
      setNewBenefit("")
    }
  }

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index))
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

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0]?.toUpperCase())
      .join("")

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/farmer/jobs">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Đăng tin tuyển worker</h1>
          <p className="text-muted-foreground">Chọn cách trả công trước, sau đó điền thông tin công việc và lịch làm.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                <Coins className="h-3.5 w-3.5" />
                Không tính lương theo giờ
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Bắt đầu từ cách trả công
              </Badge>
            </div>
            <CardTitle>1. Chọn hình thức tính lương</CardTitle>
            <CardDescription>
              Nông dân chọn trả công theo ngày hoặc theo khoán trước để hệ thống hiển thị đúng trường thông tin và cách
              tính ngân sách.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={paymentMode}
              onValueChange={(value) => setPaymentMode(value as PaymentMode)}
              className="grid gap-4 md:grid-cols-2"
            >
              {paymentModeOptions.map((option) => {
                const isSelected = paymentMode === option.value

                return (
                  <label
                    key={option.value}
                    htmlFor={`payment-mode-${option.value}`}
                    className={cn(
                      "flex cursor-pointer rounded-2xl border p-4 transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem id={`payment-mode-${option.value}`} value={option.value} className="mt-1" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {option.value === "daily" ? (
                            <TimerReset className="h-4 w-4 text-primary" />
                          ) : (
                            <BriefcaseBusiness className="h-4 w-4 text-primary" />
                          )}
                          <p className="font-semibold text-foreground">{option.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                        <p className="text-sm text-foreground/80">{option.helper}</p>
                      </div>
                    </div>
                  </label>
                )
              })}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Thông tin cơ bản</CardTitle>
            <CardDescription>Mô tả đầu việc mà worker sẽ thực hiện.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label htmlFor="title">Tiêu đề công việc *</Label>
              <Input
                id="title"
                placeholder={paymentMode === "daily" ? "VD: Cắt cỏ vườn xoài 2 ngày" : "VD: Khoán thu hoạch 2 công lúa"}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="type">Loại công việc *</Label>
              <Select>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Chọn loại công việc" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Mô tả chi tiết *</Label>
              <Textarea
                id="description"
                placeholder="Mô tả rõ công việc, khu vực làm, lưu ý an toàn, cách nghiệm thu..."
                className="mt-2 min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Lịch làm việc & địa điểm</CardTitle>
            <CardDescription>
              Chỉ dùng để hẹn lịch làm việc. Hệ thống không dùng số giờ để tính lương cho tin tuyển này.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label htmlFor="location">Địa điểm làm việc *</Label>
              <Input id="location" placeholder="VD: Ấp 3, Xã Mỹ Khánh, Cần Thơ" className="mt-2" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="startDate">Ngày làm việc đầu tiên *</Label>
                <Input id="startDate" type="date" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="workDays">Số ngày làm dự kiến *</Label>
                <Input
                  id="workDays"
                  type="number"
                  min="1"
                  value={workDays}
                  onChange={(event) => setWorkDays(event.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="startTime">Làm từ mấy giờ</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="endTime">Đến mấy giờ</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
              Thời gian hiện tại là <span className="font-medium text-foreground">{startTime}</span> đến{" "}
              <span className="font-medium text-foreground">{endTime}</span>. Khung giờ này chỉ để worker chủ động sắp
              xếp lịch, không quy đổi thành lương theo giờ.
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Placeholder lịch làm việc đã có người được duyệt
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Hiển thị sẵn 4 ngày mẫu. Khi chọn một ngày, bên dưới sẽ liệt kê worker đã được duyệt cho ngày đó.
                  </p>
                </div>
                <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                  {schedulePlaceholders.length} ngày có lịch
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {schedulePlaceholders.map((schedule) => {
                  const isActive = schedule.id === selectedSchedule.id

                  return (
                    <button
                      key={schedule.id}
                      type="button"
                      onClick={() => setSelectedScheduleId(schedule.id)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition-all",
                        isActive
                          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                          : "border-border bg-background hover:border-primary/40 hover:bg-primary/5",
                      )}
                    >
                      <p className="text-sm font-semibold text-foreground">{schedule.shortLabel}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{schedule.timeRange}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{schedule.area}</span>
                        <span>{schedule.workers.length} người</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 rounded-2xl border bg-background p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{selectedSchedule.dateLabel}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSchedule.timeRange} • {selectedSchedule.area}
                    </p>
                  </div>
                  <Badge className="w-fit gap-1 rounded-full px-3 py-1">
                    <Users className="h-3.5 w-3.5" />
                    {selectedSchedule.workers.length} worker đã duyệt
                  </Badge>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  {selectedSchedule.workers.map((worker) => (
                    <div
                      key={worker.id}
                      className="flex flex-col gap-3 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border bg-primary/10">
                          <AvatarFallback className="bg-primary/10 font-medium text-primary">
                            {getInitials(worker.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{worker.name}</p>
                          <p className="text-sm text-muted-foreground">{worker.role}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="w-fit gap-1 rounded-full px-3 py-1">
                        <CheckCheck className="h-3.5 w-3.5 text-primary" />
                        {worker.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Mức lương & ngân sách</CardTitle>
            <CardDescription>
              {paymentMode === "daily"
                ? "Thiết lập đơn giá theo ngày rồi nhập số người để hệ thống ước tính chi phí."
                : "Thiết lập tiền khoán trọn gói cho toàn bộ đầu việc, không nhân theo giờ làm."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="slots">Số worker cần tuyển *</Label>
                  <Input
                    id="slots"
                    type="number"
                    min="1"
                    value={workersNeeded}
                    onChange={(event) => setWorkersNeeded(event.target.value)}
                    placeholder="5"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">{paymentCopy.amountLabel}</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder={paymentCopy.amountPlaceholder}
                    className="mt-2"
                  />
                  <p className="mt-2 text-sm text-muted-foreground">{paymentCopy.amountHint}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="scope">{paymentCopy.extraLabel}</Label>
                <Textarea
                  id="scope"
                  placeholder={paymentCopy.extraPlaceholder}
                  className="mt-2 min-h-[110px]"
                />
                <p className="mt-2 text-sm text-muted-foreground">{paymentCopy.extraHint}</p>
              </div>

              <div className="rounded-lg bg-primary/5 p-4">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="text-sm">
                    <p className="font-medium text-card-foreground">Phí dịch vụ & giữ tiền</p>
                    <p className="text-muted-foreground">
                      Hệ thống thu phí 5% trên tổng giá trị đăng tin. Khoản tiền này được giữ trong escrow và chỉ giải ngân
                      cho worker khi công việc đã hoàn thành theo thỏa thuận.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/30 p-5">
              <p className="text-sm font-medium text-muted-foreground">{paymentCopy.summaryTitle}</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Cách tính</span>
                  <span className="text-right font-medium text-foreground">{paymentCopy.summaryFormula}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Tạm tính công trả worker</span>
                  <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Phí nền tảng (5%)</span>
                  <span className="font-semibold text-foreground">{formatCurrency(fee)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-foreground">Tổng ngân sách cần chuẩn bị</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {paymentMode === "daily"
                    ? "Ngân sách tăng theo số worker và số ngày làm dự kiến."
                    : "Ngân sách khoán là số tiền trọn gói cho cả đầu việc, dù thời gian làm kéo dài nhiều ngày."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Yêu cầu công việc</CardTitle>
            <CardDescription>Các tiêu chí giúp lọc đúng worker phù hợp.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {requirements.map((req, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {req}
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="ml-1 rounded-full hover:text-destructive"
                    aria-label={`Xóa yêu cầu ${req}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Thêm yêu cầu mới..."
                value={newRequirement}
                onChange={(event) => setNewRequirement(event.target.value)}
                onKeyDown={handleRequirementKeyDown}
              />
              <Button type="button" variant="outline" onClick={addRequirement}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Quyền lợi</CardTitle>
            <CardDescription>Các hỗ trợ thêm để tin tuyển hấp dẫn hơn.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {benefits.map((benefit, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {benefit}
                  <button
                    type="button"
                    onClick={() => removeBenefit(index)}
                    className="ml-1 rounded-full hover:text-destructive"
                    aria-label={`Xóa quyền lợi ${benefit}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Thêm quyền lợi mới..."
                value={newBenefit}
                onChange={(event) => setNewBenefit(event.target.value)}
                onKeyDown={handleBenefitKeyDown}
              />
              <Button type="button" variant="outline" onClick={addBenefit}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Tùy chọn khác</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Checkbox id="urgent" />
              <Label htmlFor="urgent" className="font-normal">
                Đánh dấu là công việc <span className="font-medium text-destructive">GẤP</span>
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="tools" />
              <Label htmlFor="tools" className="font-normal">
                Nông trại cung cấp dụng cụ làm việc
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" asChild>
            <Link href="/farmer/jobs">Hủy bỏ</Link>
          </Button>
          <Button variant="secondary" type="button">
            Lưu nháp
          </Button>
          <Button type="button">Đăng tin tuyển dụng</Button>
        </div>
      </div>
    </div>
  )
}
