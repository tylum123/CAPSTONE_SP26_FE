'use client'

import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Clock,
  Search,
  Loader2,
  Send,
  Shield,
  User,
  FileText,
  Paperclip,
  ExternalLink,
  ChevronLeft,
  Inbox,
  PlusCircle,
  Trash2,
  Tag,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { disputeService } from '@/libs/api/services'
import { cn } from '@/libs/utils/utils'
import { Button } from '@/components/ui/button'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DisputeReportCommentDTO {
  id: string
  disputeReportId: string
  userId: string
  userName: string
  role: number  // 0=Worker, 1=Farmer, 2=Admin
  content: string
  attachmentUrl: string | null
  createdAt: string
}

interface DisputeReportDTO {
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

// ─── Config ────────────────────────────────────────────────────────────────────
const STATUS: Record<number, { label: string; color: string; bg: string; border: string; dot: string }> = {
  1: { label: 'Chờ duyệt',     color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200', dot: 'bg-amber-500'  },
  2: { label: 'Đang xem xét',  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',  dot: 'bg-blue-500'   },
  3: { label: 'Đã giải quyết', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  4: { label: 'Bị từ chối',    color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',   dot: 'bg-red-500'    },
}

const TYPE: Record<number, { label: string; color: string }> = {
  1: { label: 'Chất lượng', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  2: { label: 'Thanh toán', color: 'text-red-600 bg-red-50 border-red-200' },
  3: { label: 'Khác',       color: 'text-slate-600 bg-slate-100 border-slate-200' },
}

function StatusIcon({ statusId, size = 14 }: { statusId: number; size?: number }) {
  if (statusId === 3) return <CheckCircle size={size} className="text-emerald-600" />
  if (statusId === 4) return <XCircle size={size} className="text-red-600" />
  if (statusId === 2) return <AlertCircle size={size} className="text-blue-600" />
  return <AlertTriangle size={size} className="text-amber-500" />
}

function formatDate(iso: string, short = false) {
  const d = new Date(iso)
  if (short) return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Comment Bubble ────────────────────────────────────────────────────────────
// Role: 2=Admin (always left with Shield), 1=Farmer (= me → right green), 0=Worker (left white)
function CommentBubble({ c, myRole }: { c: DisputeReportCommentDTO; myRole: number }) {
  const isMe = c.role === myRole && c.role !== 2 // Admin always on left
  const isAdmin = c.role === 2
  const roleLabel = c.role === 2 ? 'Admin' : c.role === 1 ? 'Nông dân' : 'Người lao động'

  if (isAdmin) {
    return (
      <div className="flex items-end gap-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center mb-0.5">
          <Shield size={14} className="text-emerald-700" />
        </div>
        <div className="max-w-[70%]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold text-emerald-700">{c.userName || 'Quản trị viên'}</span>
            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase">Admin</span>
            <span className="text-[10px] text-slate-400">{formatDate(c.createdAt)}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-5 text-emerald-900 whitespace-pre-wrap">{c.content}</p>
            {c.attachmentUrl && (
              <a href={c.attachmentUrl} target="_blank" rel="noopener" className="flex items-center gap-1 mt-2 text-emerald-600 text-xs underline">
                <Paperclip size={10} /> Tệp đính kèm
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isMe) {
    return (
      <div className="flex items-end gap-2 justify-end">
        <div className="max-w-[70%]">
          <div className="flex items-center gap-1.5 mb-1 justify-end">
            <span className="text-[10px] text-slate-400">{formatDate(c.createdAt)}</span>
            <span className="text-[10px] font-bold text-slate-700">Bạn</span>
          </div>
          <div className="bg-agro-green text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm"
            style={{ backgroundColor: '#16a34a' }}
          >
            <p className="text-sm leading-5 whitespace-pre-wrap">{c.content}</p>
            {c.attachmentUrl && (
              <a href={c.attachmentUrl} target="_blank" rel="noopener" className="flex items-center gap-1 mt-2 text-green-100 text-xs underline">
                <Paperclip size={10} /> Tệp đính kèm
              </a>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mb-0.5">
          <User size={14} className="text-green-700" />
        </div>
      </div>
    )
  }

  // Other party (Worker)
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

// ─── Main Component ────────────────────────────────────────────────────────────
export function FarmerDisputes() {
  const [disputes, setDisputes]       = useState<DisputeReportDTO[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [searchTerm, setSearchTerm]   = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected]       = useState<DisputeReportDTO | null>(null)
  const [comments, setComments]       = useState<DisputeReportCommentDTO[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment]   = useState('')
  const [sending, setSending]         = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Farmer = role 1
  const MY_ROLE = 1

  // ── Fetch disputes ──────────────────────────────────────────────────────────
  const fetchDisputes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await disputeService.getMyDisputes()
      const data: DisputeReportDTO[] = Array.isArray(res.data) ? res.data : []
      setDisputes(data)
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách khiếu nại.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDisputes() }, [fetchDisputes])

  // ── Fetch comments ──────────────────────────────────────────────────────────
  const fetchComments = useCallback(async (id: string) => {
    setCommentsLoading(true)
    try {
      const res = await disputeService.getComments(id)
      setComments(Array.isArray(res.data) ? res.data : [])
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    } catch {
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }, [])

  const openTicket = (d: DisputeReportDTO) => {
    setSelected(d)
    setComments([])
    fetchComments(d.id)
  }

  // ── Send comment ────────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !newComment.trim()) return
    setSending(true)
    const text = newComment.trim()
    setNewComment('')
    try {
      await disputeService.addComment(selected.id, text)
      await fetchComments(selected.id)
    } catch (err: any) {
      setNewComment(text)
      alert('Lỗi gửi tin nhắn: ' + (err.message || err))
    } finally {
      setSending(false)
    }
  }

  // ── Delete dispute ──────────────────────────────────────────────────────────
  const handleDelete = async (d: DisputeReportDTO) => {
    if (!confirm(`Bạn có chắc muốn xóa khiếu nại này không?`)) return
    try {
      await disputeService.deleteDispute(d.id)
      setDisputes(prev => prev.filter(x => x.id !== d.id))
      if (selected?.id === d.id) setSelected(null)
    } catch (err: any) {
      alert('Lỗi xóa khiếu nại: ' + (err.message || err))
    }
  }

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = disputes.filter(d => {
    const q = searchTerm.toLowerCase()
    if (q && !d.reason?.toLowerCase().includes(q)) return false
    if (statusFilter !== 'all' && d.statusId !== parseInt(statusFilter)) return false
    return true
  })

  // ── Stats ───────────────────────────────────────────────────────────────────
  const countByStatus = (sid: number) => disputes.filter(d => d.statusId === sid).length

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
      style={{ height: 'calc(100vh - 6rem)' }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-white">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Khiếu nại của tôi</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Theo dõi và trao đổi về các khiếu nại bạn đã gửi</p>
          </div>
          {/* Mini stat pills */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            {([1, 2, 3, 4] as const).map(sid => {
              const s = STATUS[sid]
              const count = countByStatus(sid)
              if (!count) return null
              return (
                <button
                  key={sid}
                  onClick={() => setStatusFilter(String(sid))}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105',
                    s.bg, s.color, s.border,
                    statusFilter === String(sid) && 'ring-2 ring-offset-1 ring-current'
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                  {count} {s.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Tìm theo lý do..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-500/30"
          >
            <option value="all">Tất cả</option>
            <option value="1">Chờ duyệt</option>
            <option value="2">Đang xem xét</option>
            <option value="3">Đã giải quyết</option>
            <option value="4">Bị từ chối</option>
          </select>
        </div>
      </div>

      {/* ── Two-panel body ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Ticket list ─────────────────────────────────────────────── */}
        <div className={cn(
          'flex flex-col border-r border-border bg-slate-50/50 overflow-hidden transition-all duration-200',
          selected ? 'hidden md:flex md:w-80 lg:w-96' : 'flex w-full'
        )}>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                <Loader2 size={28} className="animate-spin text-green-600" />
                <span className="text-sm">Đang tải khiếu nại...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 px-6">
                <AlertCircle size={32} className="text-red-400" />
                <p className="text-sm text-red-600 text-center">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchDisputes}>Thử lại</Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
                <Inbox size={36} className="opacity-30" />
                <p className="text-sm">Không có khiếu nại nào</p>
              </div>
            ) : (
              filtered.map(d => {
                const s = STATUS[d.statusId] || STATUS[1]
                const t = TYPE[d.disputeTypeId] || TYPE[3]
                const isOpen = selected?.id === d.id
                return (
                  <button
                    key={d.id}
                    onClick={() => openTicket(d)}
                    className={cn(
                      'w-full text-left px-4 py-3.5 hover:bg-white transition-colors focus:outline-none group',
                      isOpen && 'bg-white border-l-4 border-green-500'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <StatusIcon statusId={d.statusId} size={12} />
                        <span className="text-xs font-mono text-muted-foreground">
                          #{d.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground">{formatDate(d.createdAt, true)}</span>
                        {/* Delete button — only if pending */}
                        {d.statusId === 1 && (
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(d) }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-600 text-muted-foreground transition-all"
                            title="Xóa khiếu nại"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-foreground leading-5 line-clamp-2 mb-2">
                      {d.reason || 'Không có lý do'}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
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
        </div>

        {/* ── RIGHT: Ticket detail ─────────────────────────────────────────── */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

            {/* Ticket header */}
            <div className={cn(
              'flex-shrink-0 px-5 py-4 border-b',
              STATUS[selected.statusId]?.bg || 'bg-white',
              STATUS[selected.statusId]?.border || 'border-border'
            )}>
              {/* Back (mobile) */}
              <button
                onClick={() => setSelected(null)}
                className="md:hidden flex items-center gap-1 text-xs text-muted-foreground mb-3 hover:text-foreground"
              >
                <ChevronLeft size={14} /> Danh sách
              </button>

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{selected.id.substring(0, 8).toUpperCase()}
                    </span>
                    <span className={cn(
                      'flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border',
                      STATUS[selected.statusId]?.bg, STATUS[selected.statusId]?.color, STATUS[selected.statusId]?.border
                    )}>
                      <StatusIcon statusId={selected.statusId} size={11} />
                      {STATUS[selected.statusId]?.label}
                    </span>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', TYPE[selected.disputeTypeId]?.color || '')}>
                      {TYPE[selected.disputeTypeId]?.label || 'Khác'}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-foreground leading-5">
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
                      className="flex items-center gap-1 mt-1.5 text-green-700 hover:underline justify-end"
                    >
                      <ExternalLink size={11} /> Xem bằng chứng
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ── Chat Thread ─────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* Open marker */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare size={10} /> Trao đổi hỗ trợ
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
                  <Loader2 size={22} className="animate-spin text-green-600" />
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-2 text-muted-foreground">
                  <MessageSquare size={32} className="opacity-20" />
                  <p className="text-sm">Chưa có tin nhắn nào trong ticket này</p>
                  <p className="text-xs opacity-70">Gửi tin nhắn để trao đổi với đội hỗ trợ</p>
                </div>
              ) : (
                comments.map(c => (
                  <CommentBubble key={c.id} c={c} myRole={MY_ROLE} />
                ))
              )}

              {/* Closed marker */}
              {selected.statusId > 2 && (
                <div className="flex justify-center mt-4">
                  <div className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border',
                    STATUS[selected.statusId]?.bg, STATUS[selected.statusId]?.color, STATUS[selected.statusId]?.border
                  )}>
                    <StatusIcon statusId={selected.statusId} size={12} />
                    Ticket đã đóng · {selected.resolvedAt ? formatDate(selected.resolvedAt) : ''}
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* ── Verdict (if closed) ───────────────────────────────────── */}
            {selected.statusId > 2 && selected.adminNote && (
              <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-white">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Kết luận từ Quản trị viên</p>
                <div className={cn(
                  'px-4 py-3 rounded-xl border text-sm whitespace-pre-wrap',
                  STATUS[selected.statusId]?.bg, STATUS[selected.statusId]?.color, STATUS[selected.statusId]?.border
                )}>
                  {selected.adminNote}
                </div>
                {selected.resolvedAt && (
                  <p className="text-[11px] text-muted-foreground mt-2 text-right">
                    Giải quyết lúc: {formatDate(selected.resolvedAt)}
                  </p>
                )}
              </div>
            )}

            {/* ── Compose bar ──────────────────────────────────────────── */}
            {(selected.statusId === 1 || selected.statusId === 2) ? (
              <form
                onSubmit={handleSend}
                className="flex-shrink-0 flex items-end gap-2 px-5 py-3 border-t border-border bg-white"
              >
                <div className="flex-1 bg-slate-50 border border-border rounded-2xl px-4 py-2.5 min-h-[44px] flex items-center">
                  <textarea
                    rows={1}
                    className="flex-1 bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none max-h-[120px] leading-5"
                    placeholder="Nhập tin nhắn..."
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
                      ? 'bg-green-600 hover:bg-green-700 shadow-md shadow-green-200'
                      : 'bg-slate-100 text-slate-400'
                  )}
                >
                  {sending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Send size={16} className={newComment.trim() ? 'text-white' : ''} />
                  }
                </Button>
              </form>
            ) : (
              <div className={cn(
                'flex-shrink-0 flex items-center gap-2 px-5 py-3 border-t border-border text-sm font-medium',
                STATUS[selected.statusId]?.bg, STATUS[selected.statusId]?.color
              )}>
                <StatusIcon statusId={selected.statusId} size={14} />
                Ticket đã đóng — không thể gửi thêm tin nhắn
              </div>
            )}
          </div>
        ) : (
          /* Empty right panel on desktop */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground bg-slate-50">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-border flex items-center justify-center shadow-sm">
              <MessageSquare size={28} className="text-green-600" />
            </div>
            <p className="text-base font-semibold">Chọn một khiếu nại để xem</p>
            <p className="text-sm opacity-70 text-center px-8">
              Nhấp vào bất kỳ ticket nào ở bên trái để xem chi tiết và trao đổi với hỗ trợ
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
