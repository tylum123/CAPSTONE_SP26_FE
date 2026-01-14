"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  Clock,
  DollarSign,
  MessageCircle,
  CheckCircle,
  Hourglass,
  Star,
  Briefcase,
  Calendar,
} from "lucide-react"

const appliedJobs = [
  {
    id: 1,
    title: "Gat lua 2 ngay",
    location: "Xa Tan Phu, Ben Tre",
    salary: "350,000d/ngay",
    date: "15-16/01/2026",
    status: "pending",
    farmer: "Nguyen Van An",
  },
  {
    id: 2,
    title: "Phun thuoc tru sau",
    location: "Ap 3, Xa Long Hoa",
    salary: "400,000d/ngay",
    date: "18/01/2026",
    status: "approved",
    farmer: "Tran Van Binh",
  },
]

const upcomingJobs = [
  {
    id: 3,
    title: "Bon phan cho vuon cam",
    location: "Xa Phu Thanh, Vinh Long",
    salary: "300,000d/ngay",
    date: "14/01/2026",
    time: "7:00 sang",
    farmer: "Le Thi Cam",
    canCheckin: true,
  },
]

const historyJobs = [
  {
    id: 4,
    title: "Lam dat chuan bi vu mua",
    location: "Xa My Hoa, Dong Thap",
    salary: "380,000d/ngay",
    date: "10-12/01/2026",
    totalEarned: "1,140,000d",
    farmer: "Pham Van Dung",
    rating: 5,
  },
  {
    id: 5,
    title: "Thu hoach dua hau",
    location: "Xa Tan Hung, Long An",
    salary: "320,000d/ngay",
    date: "05-06/01/2026",
    totalEarned: "640,000d",
    farmer: "Nguyen Thi E",
    rating: 4,
  },
]

export default function MyJobsPage() {
  const [activeTab, setActiveTab] = useState("applied")

  return (
    <div className="container mx-auto px-4 lg:px-8 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Viec cua toi</h1>
        <p className="text-muted-foreground">Quan ly cac cong viec da ung tuyen va hoan thanh</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Hourglass className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{appliedJobs.filter((j) => j.status === "pending").length}</p>
              <p className="text-sm text-muted-foreground">Dang cho duyet</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-agro-green/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-agro-green" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingJobs.length}</p>
              <p className="text-sm text-muted-foreground">Viec sap toi</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-agro-orange/10 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-agro-orange" />
            </div>
            <div>
              <p className="text-2xl font-bold">{historyJobs.length}</p>
              <p className="text-sm text-muted-foreground">Da hoan thanh</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger
                value="applied"
                className="gap-2 data-[state=active]:bg-agro-orange data-[state=active]:text-white"
              >
                <Hourglass className="h-4 w-4" />
                Da ung tuyen ({appliedJobs.length})
              </TabsTrigger>
              <TabsTrigger
                value="upcoming"
                className="gap-2 data-[state=active]:bg-agro-orange data-[state=active]:text-white"
              >
                <Calendar className="h-4 w-4" />
                Sap toi ({upcomingJobs.length})
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="gap-2 data-[state=active]:bg-agro-orange data-[state=active]:text-white"
              >
                <CheckCircle className="h-4 w-4" />
                Lich su ({historyJobs.length})
              </TabsTrigger>
            </TabsList>

            {/* Applied Jobs */}
            <TabsContent value="applied">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appliedJobs.map((job) => (
                  <Card key={job.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.farmer}</p>
                        </div>
                        <Badge
                          variant={job.status === "approved" ? "default" : "secondary"}
                          className={
                            job.status === "approved" ? "bg-agro-green text-white" : "bg-yellow-100 text-yellow-700"
                          }
                        >
                          {job.status === "approved" ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Da nhan
                            </>
                          ) : (
                            <>
                              <Hourglass className="h-3 w-3 mr-1" />
                              Cho duyet
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {job.date}
                        </div>
                        <div className="flex items-center gap-2 text-agro-green font-medium">
                          <DollarSign className="h-4 w-4" />
                          {job.salary}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Upcoming Jobs */}
            <TabsContent value="upcoming">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingJobs.map((job) => (
                  <Card key={job.id} className="border-l-4 border-l-agro-green">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.farmer}</p>
                        </div>
                        <Badge className="bg-agro-green text-white">Hom nay</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {job.date} - {job.time}
                        </div>
                        <div className="flex items-center gap-2 text-agro-green font-medium">
                          <DollarSign className="h-4 w-4" />
                          {job.salary}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {job.canCheckin && (
                          <Button className="flex-1 bg-agro-green hover:bg-agro-green-dark text-white">Check-in</Button>
                        )}
                        <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                          <MessageCircle className="h-4 w-4" />
                          Chat voi chu
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {upcomingJobs.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Khong co viec sap toi</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* History */}
            <TabsContent value="history">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {historyJobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.farmer}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-agro-green text-lg">{job.totalEarned}</p>
                          <div className="flex items-center justify-end gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < job.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {job.date}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
