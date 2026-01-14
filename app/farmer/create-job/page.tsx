"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Check, CalendarIcon, MapPin, ArrowLeft, ArrowRight, Info } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

const jobTypes = [
  { value: "harvest", label: "Thu hoạch" },
  { value: "spray", label: "Phun thuốc" },
  { value: "fertilize", label: "Bón phân" },
  { value: "land", label: "Làm đất" },
  { value: "plant", label: "Trồng cây" },
  { value: "transport", label: "Vận chuyển" },
]

const tools = ["Ủng", "Găng tay", "Liềm", "Mũ bảo hộ", "Khẩu trang", "Máy phun", "Xẻng", "Cuốc"]

export default function CreateJobPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [jobData, setJobData] = useState({
    title: "",
    type: "",
    description: "",
    dates: [] as Date[],
    location: "Nông trại Hạnh Phúc, Xã Tân Phú, Huyện Châu Thành, Bến Tre",
    workersNeeded: "",
    tools: [] as string[],
    salaryType: "daily",
    salary: "",
    startTime: "06:00",
    endTime: "17:00",
  })

  const toggleTool = (tool: string) => {
    setJobData((prev) => ({
      ...prev,
      tools: prev.tools.includes(tool) ? prev.tools.filter((t) => t !== tool) : [...prev.tools, tool],
    }))
  }

  const calculateTotal = () => {
    const salary = Number.parseInt(jobData.salary) || 0
    const workers = Number.parseInt(jobData.workersNeeded) || 0
    const days = jobData.dates.length || 1
    const subtotal = salary * workers * days
    const fee = Math.round(subtotal * 0.05) // 5% platform fee
    return { subtotal, fee, total: subtotal + fee }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      setStep(step + 1)
    } else {
      // Submit job
      router.push("/farmer/dashboard")
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Đăng tin tuyển dụng</h1>
          <p className="text-muted-foreground">Tạo tin tuyển lao động mới</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: "Thông tin cơ bản" },
          { num: 2, label: "Thời gian & Địa điểm" },
          { num: 3, label: "Yêu cầu & Lương" },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step >= s.num ? "bg-agro-green text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.num ? <Check className="h-5 w-5" /> : s.num}
              </div>
              <span className="text-xs mt-1 text-center hidden sm:block">{s.label}</span>
            </div>
            {idx < 2 && <div className={`w-16 sm:w-24 h-1 mx-2 ${step > s.num ? "bg-agro-green" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề công việc *</Label>
                <Input
                  id="title"
                  placeholder="Ví dụ: Gặt lúa 2 ngày, Phun thuốc vườn cam..."
                  value={jobData.title}
                  onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                  className="border-agro-green/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Loại công việc *</Label>
                <Select value={jobData.type} onValueChange={(v) => setJobData({ ...jobData, type: v })}>
                  <SelectTrigger className="border-agro-green/30">
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

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả công việc</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả chi tiết công việc cần làm..."
                  value={jobData.description}
                  onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                  className="border-agro-green/30 min-h-24"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Time & Location */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Thời gian & Địa điểm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Chọn ngày làm việc *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-agro-green/30 bg-transparent"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {jobData.dates.length > 0 ? `Đã chọn ${jobData.dates.length} ngày` : "Chọn ngày trên lịch"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="multiple"
                      selected={jobData.dates}
                      onSelect={(dates) => setJobData({ ...jobData, dates: dates || [] })}
                      locale={vi}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                {jobData.dates.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {jobData.dates.map((d, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {format(d, "dd/MM/yyyy")}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Giờ bắt đầu</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={jobData.startTime}
                    onChange={(e) => setJobData({ ...jobData, startTime: e.target.value })}
                    className="border-agro-green/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Giờ kết thúc</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={jobData.endTime}
                    onChange={(e) => setJobData({ ...jobData, endTime: e.target.value })}
                    className="border-agro-green/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Địa điểm làm việc</Label>
                <div className="p-3 bg-muted rounded-lg flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-agro-orange mt-0.5" />
                  <div>
                    <p className="font-medium">{jobData.location}</p>
                    <Button variant="link" className="h-auto p-0 text-agro-green text-sm">
                      Thay đổi địa điểm
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Requirements & Salary */}
        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Yêu cầu & Lương</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workers">Số lượng người cần *</Label>
                  <Input
                    id="workers"
                    type="number"
                    placeholder="5"
                    value={jobData.workersNeeded}
                    onChange={(e) => setJobData({ ...jobData, workersNeeded: e.target.value })}
                    className="border-agro-green/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Công cụ yêu cầu người lao động mang theo</Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg border-agro-green/30">
                    {tools.map((tool) => (
                      <Badge
                        key={tool}
                        variant={jobData.tools.includes(tool) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          jobData.tools.includes(tool)
                            ? "bg-agro-green hover:bg-agro-green-dark text-white"
                            : "border-agro-green/30 hover:bg-agro-green/10"
                        }`}
                        onClick={() => toggleTool(tool)}
                      >
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Hình thức trả lương</Label>
                  <RadioGroup
                    value={jobData.salaryType}
                    onValueChange={(v) => setJobData({ ...jobData, salaryType: v })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily">Theo ngày</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hourly" id="hourly" />
                      <Label htmlFor="hourly">Theo giờ</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="contract" id="contract" />
                      <Label htmlFor="contract">Khoán</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">
                    Mức lương (
                    {jobData.salaryType === "daily" ? "VNĐ/ngày" : jobData.salaryType === "hourly" ? "VNĐ/giờ" : "VNĐ"})
                    *
                  </Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="350000"
                    value={jobData.salary}
                    onChange={(e) => setJobData({ ...jobData, salary: e.target.value })}
                    className="border-agro-green/30"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cost Summary */}
            <Card className="border-agro-orange/30 bg-agro-orange/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-agro-orange" />
                  Chi phí ước tính
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>
                      Lương ({jobData.workersNeeded || 0} người x {jobData.dates.length || 0} ngày)
                    </span>
                    <span>{calculateTotal().subtotal.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Phí dịch vụ (5%)</span>
                    <span>{calculateTotal().fee.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Tổng cộng (Escrow)</span>
                    <span className="text-agro-orange">{calculateTotal().total.toLocaleString()}đ</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  * Số tiền này sẽ được giữ trong ví Escrow và chỉ chuyển cho người lao động khi công việc hoàn thành.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          )}
          <Button type="submit" className="flex-1 bg-agro-green hover:bg-agro-green-dark text-white">
            {step < 3 ? (
              <>
                Tiếp tục
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              "Đăng tin & Thanh toán Escrow"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
