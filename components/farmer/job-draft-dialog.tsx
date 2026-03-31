"use client"

import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import {
  FileText,
  Clock,
  Briefcase,
  MapPin,
  ChevronRight,
  Inbox,
  Loader2,
  Save,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { jobService } from "@/libs/api/services/jobs.service"
import type { Job } from "@/libs/types"
import { cn } from "@/libs/utils/utils"

// ─── Types ──────────────────────────────────────────────────────────────────

type JobDraftDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadDraft: (draft: Job) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)

const formatRelativeDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "HH:mm, dd/MM/yyyy", { locale: vi })
  } catch {
    return dateStr
  }
}

const getScheduleLabel = (job: Job) => {
  if (job.jobTypeId === 2) {
    const days = job.selectedDays?.length ?? 0
    return `${days} ngày • ${job.startTime?.slice(0, 5) ?? "?"} - ${job.endTime?.slice(0, 5) ?? "?"}`
  }
  return `${job.startDate ?? "?"} → ${job.endDate ?? "?"}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export function JobDraftDialog({ open, onOpenChange, onLoadDraft }: JobDraftDialogProps) {
  const [drafts, setDrafts] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchDrafts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await jobService.getDrafts()
      const data = response.data
      const list = Array.isArray(data) ? data : (data as any)?.data ?? []
      setDrafts(list)
    } catch {
      setError("Không thể tải danh sách bản nháp. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setSelectedDraftId(null)
      void fetchDrafts()
    }
  }, [open, fetchDrafts])

  const handleLoad = () => {
    const draft = drafts.find((d) => d.id === selectedDraftId)
    if (draft) {
      onLoadDraft(draft)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Bản nháp đã lưu</DialogTitle>
              <DialogDescription className="mt-0.5">
                Chọn một bản nháp để tiếp tục chỉnh sửa
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
              <p className="text-sm">Đang tải bản nháp...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <FileText className="h-10 w-10 text-destructive/40" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchDrafts}>
                Thử lại
              </Button>
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <div className="bg-muted rounded-full p-4">
                <Inbox className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium">Chưa có bản nháp nào</p>
              <p className="text-xs text-center max-w-[260px]">
                Bạn có thể lưu bản nháp bất kỳ lúc nào trong quá trình soạn thảo tin tuyển dụng.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  isSelected={selectedDraftId === draft.id}
                  onSelect={() =>
                    setSelectedDraftId((prev) => (prev === draft.id ? null : draft.id))
                  }
                />
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Footer */}
        <DialogFooter className="px-6 py-4 shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleLoad}
            disabled={!selectedDraftId || isLoading}
            className="gap-2"
          >
            <ChevronRight className="h-4 w-4" />
            Dùng bản nháp này
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Draft Card ───────────────────────────────────────────────────────────────

function DraftCard({
  draft,
  isSelected,
  onSelect,
}: {
  draft: Job
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all duration-200 group",
        "hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm",
        isSelected
          ? "border-primary bg-primary/8 shadow-sm ring-1 ring-primary/20"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "mt-0.5 shrink-0 rounded-lg p-2 transition-colors",
            isSelected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}
        >
          <Briefcase className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn(
              "font-semibold text-sm leading-snug line-clamp-1",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {draft.title || "(Chưa có tiêu đề)"}
            </h3>
            {draft.isUrgent && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                Gấp
              </Badge>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {draft.address && (
              <span className="flex items-center gap-1 line-clamp-1 max-w-[200px]">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{draft.address}</span>
              </span>
            )}
            {draft.wageAmount > 0 && (
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatCurrency(draft.wageAmount)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getScheduleLabel(draft)}
            </span>
          </div>
        </div>

        {/* Selection indicator */}
        <div
          className={cn(
            "shrink-0 w-4 h-4 rounded-full border-2 transition-all mt-0.5",
            isSelected ? "border-primary bg-primary" : "border-muted-foreground/30 bg-transparent"
          )}
        >
          {isSelected && (
            <div className="w-full h-full rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Saved time */}
      <div className="mt-2.5 pl-9 text-[11px] text-muted-foreground/70 flex items-center gap-1">
        <Save className="h-2.5 w-2.5" />
        Lưu lúc {formatRelativeDate(draft.updatedAt ?? draft.createdAt)}
      </div>
    </button>
  )
}

// ─── Leave Page Prompt ────────────────────────────────────────────────────────

type LeavingPromptDialogProps = {
  open: boolean
  onSaveDraft: () => Promise<void>
  onLeaveWithoutSave: () => void
  onStay: () => void
  isSaving?: boolean
}

export function LeavingPromptDialog({
  open,
  onSaveDraft,
  onLeaveWithoutSave,
  onStay,
  isSaving = false,
}: LeavingPromptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onStay() }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-xl">
              <Save className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-lg">Lưu bản nháp?</DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed">
            Bạn đang rời khỏi trang này. Bạn có muốn lưu bản nháp hiện tại để tiếp tục sau không?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2 gap-2 flex-col sm:flex-row">
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={onLeaveWithoutSave}
            disabled={isSaving}
          >
            Không lưu &amp; Rời đi
          </Button>
          <Button variant="outline" onClick={onStay} disabled={isSaving}>
            Ở lại
          </Button>
          <Button onClick={onSaveDraft} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Lưu bản nháp
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
