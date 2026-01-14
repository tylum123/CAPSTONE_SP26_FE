"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Map, List, Search, MapPin, Clock, DollarSign, ChevronRight, Navigation, Filter, Wheat } from "lucide-react"
import Link from "next/link"

const mockJobs = [
  {
    id: 1,
    title: "Gat lua 2 ngay",
    location: "Xa Tan Phu, Ben Tre",
    distance: "0.5km",
    salary: "350,000d/ngay",
    startTime: "6:00 sang",
    duration: "2 ngay",
    type: "Thu hoach",
    urgent: true,
  },
  {
    id: 2,
    title: "Phun thuoc tru sau",
    location: "Ap 3, Xa Long Hoa",
    distance: "1.2km",
    salary: "400,000d/ngay",
    startTime: "5:30 sang",
    duration: "1 ngay",
    type: "Phun thuoc",
    urgent: false,
  },
  {
    id: 3,
    title: "Bon phan cho vuon cam",
    location: "Xa Phu Thanh, Vinh Long",
    distance: "2.8km",
    salary: "300,000d/ngay",
    startTime: "7:00 sang",
    duration: "3 ngay",
    type: "Bon phan",
    urgent: false,
  },
  {
    id: 4,
    title: "Lam dat chuan bi vu mua",
    location: "Xa My Hoa, Dong Thap",
    distance: "4.5km",
    salary: "380,000d/ngay",
    startTime: "6:00 sang",
    duration: "5 ngay",
    type: "Lam dat",
    urgent: true,
  },
]

export default function WorkerHomePage() {
  const [viewMode, setViewMode] = useState<"map" | "list">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [radiusFilter, setRadiusFilter] = useState([5])
  const [minSalary, setMinSalary] = useState("")
  const [jobType, setJobType] = useState("")
  const [showFilters, setShowFilters] = useState(true)

  return (
    <div className="container mx-auto px-4 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tim viec lam</h1>
          <p className="text-muted-foreground">Tim cong viec phu hop gan ban</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tim kiem viec lam..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            className="gap-2 md:hidden bg-transparent"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Loc
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <aside className={`lg:w-72 shrink-0 ${showFilters ? "block" : "hidden"} lg:block`}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Bo loc tim kiem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Ban kinh tim kiem: {radiusFilter[0]}km</label>
                <Slider value={radiusFilter} onValueChange={setRadiusFilter} max={20} min={1} step={1} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1km</span>
                  <span>20km</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Loai cong viec</label>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chon loai viec" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tat ca</SelectItem>
                    <SelectItem value="harvest">Thu hoach</SelectItem>
                    <SelectItem value="spray">Phun thuoc</SelectItem>
                    <SelectItem value="fertilize">Bon phan</SelectItem>
                    <SelectItem value="land">Lam dat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Luong toi thieu</label>
                <Select value={minSalary} onValueChange={setMinSalary}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chon muc luong" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="200000">200,000d/ngay</SelectItem>
                    <SelectItem value="300000">300,000d/ngay</SelectItem>
                    <SelectItem value="400000">400,000d/ngay</SelectItem>
                    <SelectItem value="500000">500,000d/ngay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-agro-orange hover:bg-agro-orange-dark text-white">Ap dung bo loc</Button>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* View Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "map" | "list")} className="mb-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger
                  value="list"
                  className="gap-2 data-[state=active]:bg-agro-orange data-[state=active]:text-white"
                >
                  <List className="h-4 w-4" />
                  Danh sach
                </TabsTrigger>
                <TabsTrigger
                  value="map"
                  className="gap-2 data-[state=active]:bg-agro-orange data-[state=active]:text-white"
                >
                  <Map className="h-4 w-4" />
                  Ban do
                </TabsTrigger>
              </TabsList>
              <p className="text-sm text-muted-foreground hidden md:block">
                Tim thay <span className="font-semibold text-foreground">{mockJobs.length}</span> viec lam
              </p>
            </div>

            <TabsContent value="map" className="mt-4">
              {/* Map View */}
              <Card className="overflow-hidden">
                <div className="relative h-[500px] bg-muted">
                  <img
                    src="/google-maps-agricultural-area-vietnam.jpg"
                    alt="Ban do"
                    className="w-full h-full object-cover"
                  />
                  {/* Current Location Marker */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                  </div>
                  {/* Job Markers */}
                  <div className="absolute top-[30%] left-[40%]">
                    <div className="w-10 h-10 bg-agro-orange rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                      <Wheat className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-[45%] left-[60%]">
                    <div className="w-10 h-10 bg-agro-green rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                      <Wheat className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-[60%] left-[35%]">
                    <div className="w-10 h-10 bg-agro-orange rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                      <Wheat className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  {/* Location Button */}
                  <Button
                    size="icon"
                    className="absolute bottom-4 right-4 bg-white text-agro-orange shadow-lg hover:bg-agro-cream"
                  >
                    <Navigation className="h-5 w-5" />
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="list" className="mt-4">
              {/* List View - Grid for larger screens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockJobs.map((job) => (
                  <Link key={job.id} href={`/worker/job/${job.id}`}>
                    <Card className="h-full border-agro-green/20 hover:border-agro-orange/50 hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
                              {job.urgent && (
                                <Badge variant="destructive" className="text-xs">
                                  Gap
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline" className="mb-3 text-agro-green border-agro-green">
                              {job.type}
                            </Badge>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span>{job.location}</span>
                                <span className="text-agro-orange font-medium">({job.distance})</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-agro-green font-semibold">
                                  <DollarSign className="h-4 w-4" />
                                  {job.salary}
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {job.startTime}
                                </div>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground mt-2 shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
