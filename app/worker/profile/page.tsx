"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MapPin,
  Star,
  Briefcase,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit,
  DollarSign,
  Calendar,
} from "lucide-react"
import Link from "next/link"

const userProfile = {
  name: "Nguyen Van B",
  phone: "0912 345 678",
  address: "Xa Tan Phu, Huyen Chau Thanh, Ben Tre",
  avatar: null,
  rating: 4.9,
  totalJobs: 28,
  totalEarned: "8,540,000d",
  joinDate: "01/2025",
  skills: ["Thu hoach lua", "Lam dat", "Phun thuoc", "Bon phan", "Van chuyen"],
  verified: true,
}

export default function ProfilePage() {
  const [notifications, setNotifications] = useState(true)
  const [locationSharing, setLocationSharing] = useState(true)

  return (
    <div className="container mx-auto px-4 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ho so cua toi</h1>
          <p className="text-muted-foreground">Quan ly thong tin ca nhan va cai dat</p>
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Edit className="h-4 w-4" />
          Chinh sua
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={userProfile.avatar || ""} />
                  <AvatarFallback className="bg-agro-orange text-white text-2xl">
                    {userProfile.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">{userProfile.name}</h2>
                  {userProfile.verified && <Shield className="h-5 w-5 text-agro-green fill-agro-green/20" />}
                </div>
                <p className="text-muted-foreground mb-2">{userProfile.phone}</p>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-lg">{userProfile.rating}</span>
                  <span className="text-muted-foreground">({userProfile.totalJobs} viec)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Thong ke</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-agro-green/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-agro-green" />
                  <span>Viec da lam</span>
                </div>
                <span className="font-bold text-agro-green">{userProfile.totalJobs}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-agro-orange/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-agro-orange" />
                  <span>Tong thu nhap</span>
                </div>
                <span className="font-bold text-agro-orange">{userProfile.totalEarned}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span>Tham gia tu</span>
                </div>
                <span className="font-medium">{userProfile.joinDate}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Dia chi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{userProfile.address}</p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Ky nang</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {userProfile.skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-agro-orange/10 text-agro-orange px-4 py-2">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Cai dat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span>Thong bao</span>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>Chia se vi tri</span>
                </div>
                <Switch checked={locationSharing} onCheckedChange={setLocationSharing} />
              </div>
              <Link
                href="/worker/settings"
                className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <span>Cai dat khac</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Link
                href="/help"
                className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <span>Tro giup</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>

          {/* Logout */}
          <Link href="/">
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive hover:bg-destructive/10 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Dang xuat
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
