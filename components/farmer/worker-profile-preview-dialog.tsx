"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, MapPin, Phone, Mail, Briefcase, Star, UserRound } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { farmerService } from "@/libs/api/services/farmer.service"
import type { WorkerProfileDTO } from "@/libs/types"
import { cn } from "@/libs/utils/utils"

type WorkerProfilePreviewDialogProps = {
  workerId?: string
  workerUserId?: string
  workerName?: string
  className?: string
  children: React.ReactNode
}

export function WorkerProfilePreviewDialog({
  workerId,
  workerUserId,
  workerName,
  className,
  children,
}: WorkerProfilePreviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<WorkerProfileDTO | null>(null)

  const targetId = useMemo(() => workerUserId || workerId || "", [workerUserId, workerId])

  useEffect(() => {
    if (!open || !targetId) {
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    farmerService
      .getWorkerProfileById(targetId)
      .then((response) => {
        if (!active) {
          return
        }
        setProfile(response.data)
      })
      .catch(() => {
        if (!active) {
          return
        }
        setProfile(null)
        setError("Không thể tải hồ sơ người làm.")
      })
      .finally(() => {
        if (!active) {
          return
        }
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, targetId])

  const disableOpen = !targetId

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disableOpen}
        className={cn(
          "rounded-full text-left transition-all",
          !disableOpen && "hover:ring-2 hover:ring-agro-green/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agro-green/50",
          disableOpen && "cursor-default",
          className,
        )}
      >
        {children}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{workerName ? `Hồ sơ: ${workerName}` : "Hồ sơ người làm"}</DialogTitle>
            <DialogDescription>Thông tin chi tiết người làm.</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : profile ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/20">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border shadow-sm">
                    <AvatarImage src={profile.avatarUrl || "/placeholder.svg"} className="object-cover" />
                    <AvatarFallback className="bg-agro-green/10 text-agro-green font-semibold">
                      {(profile.fullName || "W").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                      <p className="font-semibold text-base truncate">{profile.fullName || "Người làm"}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    {profile.averageRating?.toFixed?.(1) || "0.0"}
                  </Badge>
                  <Badge variant="outline">{profile.experienceLevel || "Chưa cập nhật"}</Badge>
                  <Badge variant="outline">{profile.totalJobsCompleted ?? 0} việc hoàn thành</Badge>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Khu vực chính
                  </p>
                  <p className="text-sm font-medium">{profile.primaryLocation || "Không có"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Ngày sinh
                  </p>
                  <p className="text-sm font-medium">{profile.date_of_birth || "Không có"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Số điện thoại
                  </p>
                  <p className="text-sm font-medium">{profile.phoneNumber || "Không có"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </p>
                  <p className="text-sm font-medium break-all">{profile.email || "Không có"}</p>
                </div>
                <div className="rounded-lg border p-3 sm:col-span-2">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    Lịch làm việc
                  </p>
                  <p className="text-sm font-medium">{profile.availabilitySchedule || "Không có"}</p>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-2">Kỹ năng</p>
                {profile.skills?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => (
                      <Badge key={skill.id} variant="secondary" className="font-normal">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa cập nhật kỹ năng.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có dữ liệu hồ sơ.</p>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
