"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Phone,
  Navigation,
  Star,
  CheckCircle,
  Briefcase,
  Wrench,
} from "lucide-react"
import Link from "next/link"

const jobDetail = {
  id: 1,
  title: "Gat lua 2 ngay",
  location: "Xa Tan Phu, Huyen Chau Thanh, Ben Tre",
  distance: "0.5km",
  salary: "350,000d/ngay",
  totalPay: "700,000d",
  startTime: "6:00 sang",
  endTime: "5:00 chieu",
  duration: "2 ngay",
  startDate: "15/01/2026",
  endDate: "16/01/2026",
  type: "Thu hoach",
  urgent: true,
  description: "Can 5 nguoi gat lua cho 2 hecta ruong. Lua da chin vang, can thu hoach gap truoc khi mua.",
  requirements: ["Biet su dung liem/may gat cam tay", "Co suc khoe tot", "Chiu duoc nang nong"],
  tools: ["Ung", "Gang tay", "Liem (neu co)"],
  farmer: {
    name: "Nguyen Van An",
    rating: 4.8,
    totalJobs: 45,
    phone: "0912 345 678",
  },
  spotsLeft: 3,
  totalSpots: 5,
  timeSlots: [
    { id: 1, label: "Ca ngay (6:00 - 17:00)", available: true },
    { id: 2, label: "Buoi sang (6:00 - 11:30)", available: true },
    { id: 3, label: "Buoi chieu (13:00 - 17:00)", available: false },
  ],
}

export default function JobDetailPage() {
  const router = useRouter()
  const [selectedSlot, setSelectedSlot] = useState("")
  const [applySuccess, setApplySuccess] = useState(false)

  const handleApply = () => {
    setApplySuccess(true)
    setTimeout(() => {
      router.push("/worker/my-jobs")
    }, 2000)
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/worker/home">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lai
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">Chi tiet cong viec</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-foreground">{jobDetail.title}</h1>
                    {jobDetail.urgent && <Badge variant="destructive">Gap</Badge>}
                  </div>
                  <Badge variant="outline" className="text-agro-green border-agro-green">
                    {jobDetail.type}
                  </Badge>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-3xl font-bold text-agro-green">{jobDetail.salary}</p>
                  <p className="text-muted-foreground">Tong: {jobDetail.totalPay}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-5 w-5 text-agro-orange mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Dia diem</p>
                    <p className="text-muted-foreground">{jobDetail.location}</p>
                    <p className="text-agro-orange font-medium">Cach ban {jobDetail.distance}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-agro-green mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Thoi gian</p>
                    <p className="text-muted-foreground">
                      {jobDetail.startDate} - {jobDetail.endDate}
                    </p>
                    <p className="text-muted-foreground">
                      {jobDetail.startTime} - {jobDetail.endTime}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <p className="text-sm">
                  <span className="text-agro-green font-semibold">{jobDetail.spotsLeft}</span> / {jobDetail.totalSpots}{" "}
                  cho con trong
                </p>
                <Button
                  variant="outline"
                  className="gap-2 text-agro-orange border-agro-orange hover:bg-agro-orange/10 bg-transparent"
                >
                  <Navigation className="h-4 w-4" />
                  Chi duong
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Mo ta cong viec
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{jobDetail.description}</p>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Yeu cau
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {jobDetail.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-agro-green shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Cong cu can mang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {jobDetail.tools.map((tool, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-agro-cream text-foreground">
                    {tool}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Farmer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thong tin chu nong trai</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-agro-green/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-agro-green" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{jobDetail.farmer.name}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{jobDetail.farmer.rating}</span>
                    <span className="text-muted-foreground">({jobDetail.farmer.totalJobs} viec)</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full gap-2 bg-transparent">
                <Phone className="h-4 w-4" />
                Goi dien: {jobDetail.farmer.phone}
              </Button>
            </CardContent>
          </Card>

          {/* Apply Card */}
          <Card className="border-agro-orange/30 bg-agro-orange/5">
            <CardContent className="p-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-agro-orange hover:bg-agro-orange-dark text-white text-lg py-6">
                    Ung tuyen ngay
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  {!applySuccess ? (
                    <>
                      <DialogHeader>
                        <DialogTitle>Chon khung gio lam viec</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <RadioGroup value={selectedSlot} onValueChange={setSelectedSlot} className="space-y-3">
                          {jobDetail.timeSlots.map((slot) => (
                            <div key={slot.id} className="flex items-center space-x-3">
                              <RadioGroupItem
                                value={slot.id.toString()}
                                id={`slot-${slot.id}`}
                                disabled={!slot.available}
                              />
                              <Label
                                htmlFor={`slot-${slot.id}`}
                                className={`flex-1 ${!slot.available ? "text-muted-foreground line-through" : ""}`}
                              >
                                {slot.label}
                                {!slot.available && <span className="text-xs ml-2">(Da du nguoi)</span>}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <Button
                        onClick={handleApply}
                        disabled={!selectedSlot}
                        className="w-full bg-agro-orange hover:bg-agro-orange-dark text-white"
                      >
                        Xac nhan ung tuyen
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-agro-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-agro-green" />
                      </div>
                      <h3 className="text-lg font-semibold text-agro-green mb-2">Ung tuyen thanh cong!</h3>
                      <p className="text-sm text-muted-foreground">
                        Cho chu nong trai xac nhan. Ban se nhan thong bao som.
                      </p>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              <p className="text-center text-sm text-muted-foreground mt-3">Con {jobDetail.spotsLeft} cho trong</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
