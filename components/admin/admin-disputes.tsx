'use client'

import {
  Search,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  User,
  Clock,
  Send,
  FileText,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Inbox,
  Tag,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { adminService } from '@/libs/api/services'
import { Button } from '@/components/ui/button'
import { cn } from '@/libs/utils/utils'

const LIMIT = 15

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DisputeReportCommentDTO {
  id: string
  disputeReportId: string
  userId: string
  userName: string
  role: number  // 2=Admin, 1=Farmer, 0=Worker
  content: string
  attachmentUrl: string | null
  targetUserId: string | null   // admin-directed message target; null = sent by reporter/accused
  createdAt: string
}

export interface DisputeReportDTO {
  id: string
  farmerId: string | null
  workerId: string | null
  jobPostId: string
  disputeTypeId: number
  reason: string
  description: string | null
  evidenceUrl: string | null
  statusId: number
  adminNote: string | null
  resolvedById: string | null
  createdAt: string
  resolvedAt: string | null
  reporterUserId: string | null
  accusedUserId: string | null
  penaltyTargetId: number
}

// ─── Status / Type helpers ────────────────────────────────────────────────────
const STATUS: Record<number, { label: string; color: string; bg: string; border: string; dot: string }> = {
  1: { label: 'Chờ duyệt',     color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200', dot: 'bg-amber-500'  },
  2: { label: 'Đang xem xét',  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',  dot: 'bg-blue-500'   },
  3: { label: 'Đã giải quyết', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  4: { label: 'Bị từ chối',    color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',   dot: 'bg-red-500'    },
}

const TYPE: Record<number, { label: string; color: string }> = {
  1: { label: 'Chất lượng',    color: 'text-orange-600 bg-orange-50 border-orange-200' },
  2: { label: 'Thanh toán',    color: 'text-red-600 bg-red-50 border-red-200' },
  3: { label: 'Khác',          color: 'text-slate-600 bg-slate-100 border-slate-200' },
}

function getStatusIcon(statusId: number, size = 14) {
  if (statusId === 3) return <CheckCircle size={size} className="text-emerald-600" />
  if (statusId === 4) return <XCircle      size={size} className="text-red-600" />
  if (statusId === 2) return <AlertCircle  size={size} className="text-blue-600" />
  return                     <AlertCircle  size={size} className="text-amber-500" />
}

function formatDate(iso: string, short = false) {
  const d = new Date(iso)
  if (short) return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── CommentBubble ────────────────────────────────────────────────────────────
function CommentBubble({ c, isAdmin }: { c: DisputeReportCommentDTO; isAdmin: boolean }) {
  const sentByAdmin = c.role === 2
  const roleLabel = c.role === 2 ? 'Admin' : c.role === 1 ? 'Chủ thuê' : 'Người lao động'

  if (sentByAdmin) {
    return (
      <div className="flex items-end gap-2 justify-end">
        <div className="max-w-[70%]">
          <div className="flex items-center gap-1.5 justify-end mb-1">
            <span className="text-[10px] text-slate-400">{formatDate(c.createdAt)}</span>
            <span className="text-[10px] font-bold text-emerald-700">{c.userName || 'Quản trị viên'}</span>
            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase">Admin</span>
          </div>
          <div className="bg-emerald-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-5 whitespace-pre-wrap">{c.content}</p>
            {c.attachmentUrl && (
              <a href={c.attachmentUrl} target="_blank" rel="noopener" className="flex items-center gap-1 mt-2 text-emerald-100 text-xs underline">
                <Paperclip size={10} /> Tệp đính kèm
              </a>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center mb-0.5">
          <Shield size={14} className="text-emerald-700" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-0.5">
        <User size={14} className="text-slate-500" />
      </div>
      <div className="max-w-[70%]">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-bold text-slate-700">{c.userName}</span>
          <span className="text-[9px] font-semibold text-slate-400 uppercase">{roleLabel}</span>
          <span className="text-[10px] text-slate-400">{formatDate(c.createdAt)}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm leading-5 text-slate-800 whitespace-pre-wrap">{c.content}</p>
          {c.attachmentUrl && (
            <a href={c.attachmentUrl} target="_blank" rel="noopener" className="flex items-center gap-1 mt-2 text-slate-500 text-xs underline">
              <Paperclip size={10} /> Tệp đính kèm
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminDisputes() {
  // List state
  const [disputes, setDisputes]     = useState<DisputeReportDTO[]>([])
  const [allDisputes, setAllDisputes] = useState<DisputeReportDTO[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ticket detail state
  const [selected, setSelected]         = useState<DisputeReportDTO | null>(null)
  const [activeTab, setActiveTab]       = useState<'reporter' | 'accused'>('reporter')
  const [reporterComments, setReporterComments] = useState<DisputeReportCommentDTO[]>([])
  const [accusedComments, setAccusedComments]   = useState<DisputeReportCommentDTO[]>([])
  const [commentsLoading, setCommentsLoading]   = useState(false)
  const [newComment, setNewComment]     = useState('')
  const [sending, setSending]           = useState(false)
  const chatEndReporter = useRef<HTMLDivElement>(null)
  const chatEndAccused  = useRef<HTMLDivElement>(null)

  // Resolve panel state
  const [resolving, setResolving]           = useState(false)
  const [adminNote, setAdminNote]           = useState('')
  const [penaltyTarget, setPenaltyTarget]   = useState<number>(0)
  const [isResolvedAction, setIsResolvedAction] = useState(true)

  // ── Debounce search ──
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setDebouncedSearch(searchTerm), 350)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [searchTerm])

  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter])

  // ── Fetch disputes ──
  const fetchDisputes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminService.getDisputes()
      const payload: DisputeReportDTO[] = Array.isArray(res.data) ? res.data : []

      setAllDisputes(payload)

      let filtered = [...payload]
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
        filtered = filtered.filter(d =>
          d.reason?.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q)
        )
      }
      const statusMap: Record<string, number> = { Pending: 1, UnderReview: 2, Resolved: 3, Rejected: 4 }
      if (statusFilter !== 'All') {
        filtered = filtered.filter(d => d.statusId === statusMap[statusFilter])
      }

      setTotalPages(Math.max(1, Math.ceil(filtered.length / LIMIT)))
      setDisputes(filtered.slice((page - 1) * LIMIT, page * LIMIT))
    } catch (err: any) {
      setError(err?.message || 'Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, statusFilter])

  useEffect(() => { fetchDisputes() }, [fetchDisputes])

  // ── Fetch comments (for BOTH threads) ──
  const fetchAllComments = useCallback(async (id: string) => {
    setCommentsLoading(true)
    try {
      const res = await adminService.getDisputeComments(id)
      const all: DisputeReportCommentDTO[] = res.data || []
      // Admin sees everything — split by targetUserId
      // Reporter thread: messages where targetUserId == reporterUserId OR sender is the reporter (no targetUserId set)
      // Accused thread:  messages where targetUserId == accusedUserId  OR sender is the accused
      setReporterComments(all.filter(c => c.targetUserId === selected?.reporterUserId || (!c.targetUserId && c.userId === selected?.reporterUserId)))
      setAccusedComments(all.filter(c =>  c.targetUserId === selected?.accusedUserId  || (!c.targetUserId && c.userId === selected?.accusedUserId)))
      setTimeout(() => {
        chatEndReporter.current?.scrollIntoView({ behavior: 'smooth' })
        chatEndAccused.current?.scrollIntoView({ behavior: 'smooth' })
      }, 80)
    } catch {
      // silent
    } finally {
      setCommentsLoading(false)
    }
  }, [selected])

  const openTicket = (dispute: DisputeReportDTO) => {
    setSelected(dispute)
    setReporterComments([])
    setAccusedComments([])
    setActiveTab('reporter')
    setAdminNote('')
    setPenaltyTarget(0)
    setIsResolvedAction(true)
  }

  // Fetch comments once selected is set
  useEffect(() => {
    if (selected) fetchAllComments(selected.id)
  }, [selected, fetchAllComments])

  // ── Send comment ──
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !newComment.trim()) return
    const targetId = activeTab === 'reporter' ? selected.reporterUserId : selected.accusedUserId
    if (!targetId) return
    setSending(true)
    const text = newComment.trim()
    setNewComment('')
    try {
      await adminService.addDisputeComment(selected.id, text, targetId)
      await fetchAllComments(selected.id)
    } catch (err: any) {
      setNewComment(text)
      alert('Lỗi gửi tin nhắn: ' + (err.message || err))
    } finally {
      setSending(false)
    }
  }

  // ── Resolve / Reject ──
  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setResolving(true)
    try {
      await adminService.resolveDispute(selected.id, {
        isResolved: isResolvedAction,
        adminNote,
        penaltyTarget: Number(penaltyTarget),
      } as any)
      const updated = { ...selected, statusId: isResolvedAction ? 3 : 4, adminNote }
      setSelected(updated)
      setAllDisputes(prev => prev.map(d => d.id === updated.id ? updated : d))
      fetchDisputes()
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || err))
    } finally {
      setResolving(false)
    }
  }

  // ── Stats ──
  const countByStatus = (sid: number) => allDisputes.filter(d => d.statusId === sid).length

  // ── Render ──
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quản lý Khiếu nại</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Xử lý khiếu nại giữa Farmer và Worker</p>
          </div>
          {/* Stat pills */}
          <div className="hidden md:flex items-center gap-2">
            {([1,2,3,4] as const).map(sid => {
              const s = STATUS[sid]
              return (
                <button
                  key={sid}
                  onClick={() => setStatusFilter(sid === 1 ? 'Pending' : sid === 2 ? 'UnderReview' : sid === 3 ? 'Resolved' : 'Rejected')}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105', s.bg, s.color, s.border)}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                  {countByStatus(sid)}
                  <span className="opacity-70">{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm lý do, ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="UnderReview">Đang xem xét</option>
            <option value="Resolved">Đã giải quyết</option>
            <option value="Rejected">Bị từ chối</option>
          </select>
        </div>
      </div>

      {/* ── Two-panel body ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Ticket List ─────────────────────────────────────────────── */}
        <div className={cn(
          'flex flex-col border-r border-border bg-white overflow-hidden transition-all duration-200',
          selected ? 'hidden md:flex md:w-80 lg:w-96' : 'flex w-full'
        )}>
          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                <Loader2 size={28} className="animate-spin text-emerald-600" />
                <span className="text-sm">Đang tải...</span>
              </div>
            ) : disputes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                <Inbox size={36} className="opacity-40" />
                <span className="text-sm">Không có khiếu nại nào</span>
              </div>
            ) : (
              disputes.map(d => {
                const s = STATUS[d.statusId] || STATUS[1]
                const t = TYPE[d.disputeTypeId] || TYPE[3]
                const isOpen = selected?.id === d.id
                return (
                  <button
                    key={d.id}
                    onClick={() => openTicket(d)}
                    className={cn(
                      'w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors focus:outline-none',
                      isOpen && 'bg-emerald-50 border-l-4 border-emerald-500'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getStatusIcon(d.statusId, 13)}
                        <span className="text-xs font-mono text-muted-foreground truncate">
                          #{d.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDate(d.createdAt, true)}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-foreground leading-5 line-clamp-2 mb-2">
                      {d.reason || 'Không có lý do'}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', t.color)}>
                        {t.label}
                      </span>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', s.bg, s.color, s.border)}>
                        {s.label}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
              <span className="text-xs text-muted-foreground">Trang {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Ticket Detail ──────────────────────────────────────────── */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

            {/* Ticket Header */}
            <div
              className={cn('flex-shrink-0 px-5 py-4 border-b', STATUS[selected.statusId]?.bg || 'bg-white', STATUS[selected.statusId]?.border || 'border-border')}
            >
              {/* Back on mobile */}
              <button
                onClick={() => setSelected(null)}
                className="md:hidden flex items-center gap-1 text-xs text-muted-foreground mb-3 hover:text-foreground"
              >
                <ChevronLeft size={14} /> Danh sách
              </button>

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{selected.id.substring(0, 8).toUpperCase()}
                    </span>
                    <span className={cn(
                      'flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border',
                      STATUS[selected.statusId]?.bg, STATUS[selected.statusId]?.color, STATUS[selected.statusId]?.border
                    )}>
                      {getStatusIcon(selected.statusId, 11)}
                      {STATUS[selected.statusId]?.label}
                    </span>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', TYPE[selected.disputeTypeId]?.color || '')}>
                      {TYPE[selected.disputeTypeId]?.label || 'Khác'}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-foreground leading-5 line-clamp-2">
                    {selected.reason}
                  </h2>
                  {selected.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selected.description}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 justify-end">
                    <Clock size={11} />
                    <span>{formatDate(selected.createdAt)}</span>
                  </div>
                  {selected.evidenceUrl && (
                    <a
                      href={selected.evidenceUrl}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-1 mt-1.5 text-emerald-700 hover:underline justify-end"
                    >
                      <ExternalLink size={11} /> Xem bằng chứng
                    </a>
                  )}
                </div>
              </div>

              {/* Jury bar — reporter / accused */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-black/5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText size={12} />
                  <span>Người gửi: <span className="font-semibold text-foreground truncate">{selected.reporterUserId?.substring(0,8) || '—'}</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Tag size={12} />
                  <span>Bị tố cáo: <span className="font-semibold text-foreground truncate">{selected.accusedUserId?.substring(0,8) || '—'}</span></span>
                </div>
              </div>
            </div>

            {/* ── Two-Tab Chat ─────────────────────────────────────────────── */}

            {/* Tab switcher */}
            <div className="flex-shrink-0 flex border-b border-border bg-white">
              {(['reporter', 'accused'] as const).map(tab => {
                const isReporter = tab === 'reporter'
                const label = isReporter ? '👤 Người khiếu nại' : '🎯 Người bị tố'
                const userId = isReporter ? selected.reporterUserId : selected.accusedUserId
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors',
                      activeTab === tab
                        ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-slate-50'
                    )}
                  >
                    {label}
                    {userId && (
                      <span className="text-[10px] font-mono opacity-60">
                        #{userId.substring(0, 6)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Chat thread */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Open marker */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare size={10} />
                  {activeTab === 'reporter' ? 'Trao đổi với người khiếu nại' : 'Trao đổi với người bị tố'}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="flex justify-center">
                <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Ticket mở ngày {formatDate(selected.createdAt)}
                </span>
              </div>

              {commentsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={22} className="animate-spin text-emerald-600" />
                </div>
              ) : (activeTab === 'reporter' ? reporterComments : accusedComments).length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-2 text-muted-foreground">
                  <MessageSquare size={32} className="opacity-30" />
                  <p className="text-sm">
                    Chưa có tin nhắn với {activeTab === 'reporter' ? 'người khiếu nại' : 'người bị tố'}
                  </p>
                </div>
              ) : (
                (activeTab === 'reporter' ? reporterComments : accusedComments).map(c => (
                  <CommentBubble key={c.id} c={c} isAdmin={c.role === 2} />
                ))
              )}

              {/* Closed banner */}
              {selected.statusId > 2 && (
                <div className="flex justify-center mt-4">
                  <div className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border',
                    STATUS[selected.statusId]?.bg, STATUS[selected.statusId]?.color, STATUS[selected.statusId]?.border
                  )}>
                    {getStatusIcon(selected.statusId, 12)}
                    Ticket đã đóng · {selected.resolvedAt ? formatDate(selected.resolvedAt) : ''}
                  </div>
                </div>
              )}

              <div ref={activeTab === 'reporter' ? chatEndReporter : chatEndAccused} />
            </div>

            {/* ── Compose Bar ──────────────────────────────────────────────── */}
            {(selected.statusId === 1 || selected.statusId === 2) && (
              <form
                onSubmit={handleSend}
                className="flex-shrink-0 flex items-end gap-2 px-5 py-3 border-t border-border bg-white"
              >
                <div className="flex-1 bg-slate-50 border border-border rounded-2xl px-4 py-2.5 min-h-[44px] flex items-center">
                  <textarea
                    rows={1}
                    className="flex-1 bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none max-h-[120px] leading-5"
                    placeholder={`Gửi tin cho ${activeTab === 'reporter' ? 'người khiếu nại' : 'người bị tố'}...`}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend(e as any)
                      }
                    }}
                  />
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={sending || !newComment.trim()}
                  className={cn(
                    'h-11 w-11 rounded-full flex-shrink-0 transition-all',
                    newComment.trim()
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200'
                      : 'bg-slate-100 text-slate-400'
                  )}
                >
                  {sending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Send size={16} className={newComment.trim() ? 'text-white' : ''} />
                  }
                </Button>
              </form>
            )}

            {/* Closed compose fallback */}
            {selected.statusId > 2 && (
              <div className={cn(
                'flex-shrink-0 flex items-center gap-2 px-5 py-3 border-t border-border text-sm font-medium',
                STATUS[selected.statusId]?.bg, STATUS[selected.statusId]?.color
              )}>
                {getStatusIcon(selected.statusId, 14)}
                Ticket đã đóng — không thể gửi thêm tin nhắn
              </div>
            )}

            {/* ── Resolve Panel ─────────────────────────────────────────────── */}
            {(selected.statusId === 1 || selected.statusId === 2) && (
              <div className="flex-shrink-0 border-t border-border bg-white px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Đóng Ticket</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <form onSubmit={handleResolve} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">Phán quyết</label>
                    <select
                      value={isResolvedAction ? 'true' : 'false'}
                      onChange={e => setIsResolvedAction(e.target.value === 'true')}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="true">✅ Chấp nhận khiếu nại (Resolved)</option>
                      <option value="false">❌ Bác bỏ khiếu nại (Rejected)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">Hình phạt</label>
                    <select
                      value={penaltyTarget}
                      onChange={e => setPenaltyTarget(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value={0}>Không phạt ai</option>
                      <option value={1}>⚠️ Cảnh cáo người gửi</option>
                      <option value={2}>⚠️ Cảnh cáo người bị tố</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-foreground block mb-1.5">Kết luận (bắt buộc)</label>
                    <textarea
                      required
                      rows={2}
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                      placeholder="Ghi rõ phán quyết để hai bên xem..."
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={resolving || !adminNote.trim()}
                      className="bg-slate-800 hover:bg-slate-900 text-white gap-2"
                    >
                      {resolving && <Loader2 size={14} className="animate-spin" />}
                      Thực thi &amp; Đóng Ticket
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Verdict display if closed */}
            {selected.statusId > 2 && selected.adminNote && (
              <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-white">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Kết luận của Quản trị viên</p>
                <p className="text-sm text-foreground bg-muted px-4 py-3 rounded-xl border border-border whitespace-pre-wrap">
                  {selected.adminNote}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Empty state when nothing is selected (desktop) */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground bg-slate-50">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-border flex items-center justify-center shadow-sm">
              <MessageSquare size={28} className="text-emerald-600" />
            </div>
            <p className="text-base font-semibold">Chọn một ticket để xem chi tiết</p>
            <p className="text-sm opacity-70">Nhấp vào bất kỳ khiếu nại nào ở bên trái để bắt đầu trao đổi</p>
          </div>
        )}
      </div>
    </div>
  )
}
