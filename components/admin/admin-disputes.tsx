"use client";

import {
  Search,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  Edit,
  UserX,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChatInterface } from "@/components/chat/chat-interface";
import { SignalRProvider } from "@/contexts/signalr-context";
import { disputeService, adminService } from "@/libs/api/services";
import { de } from "date-fns/locale";
import { FarmerProfileDTO, User, WorkerProfileDTO } from "@/libs/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChatSidebar } from "../chat/chat-sidebar";

const PAGE_SIZE = 10;

import { useToast } from "@/hooks/use-toast";
type UserMap = Record<string, { fullName: string; email: string }>;

const DISPUTE_TYPE_META: Record<number, { label: string; className: string }> =
  {
    1: {
      label: "Chất lượng công việc",
      className: "bg-amber-100 text-amber-800 border border-amber-200",
    },
    2: {
      label: "Thanh toán",
      className: "bg-sky-100 text-sky-800 border border-sky-200",
    },
    3: {
      label: "Khác",
      className: "bg-slate-100 text-slate-800 border border-slate-200",
    },
  };

const DISPUTE_STATUS_META: Record<
  number,
  { label: string; className: string }
> = {
  1: {
    label: "Đang chờ",
    className: "bg-orange-100 text-orange-800 border border-orange-200",
  },
  2: {
    label: "Đang xử lý",
    className: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  3: {
    label: "Đã giải quyết",
    className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  4: {
    label: "Từ chối",
    className: "bg-rose-100 text-rose-800 border border-rose-200",
  },
};

export function AdminDisputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<UserMap>({});
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [disputeTypeFilter, setDisputeTypeFilter] = useState("");

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(
      () => setDebouncedSearch(searchTerm),
      400,
    );
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm]);

  const [summaryStats, setSummaryStats] = useState<
    Array<{ statusId: number; statusName: string; count: number }>
  >([]);

  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [chatReceiver, setChatReceiver] = useState<{
    id: string;
    name: string;
    avatarUrl?: string;
  } | null>(null);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        pageNumber: page,
        pageSize: PAGE_SIZE,
      };
      if (debouncedSearch) params.jobPostName = debouncedSearch;
      if (statusFilter) params.statusId = Number(statusFilter);
      if (disputeTypeFilter) params.disputeTypeId = Number(disputeTypeFilter);

      const res = await adminService.getDisputes(
        params as Parameters<typeof adminService.getDisputes>[0],
      );

      const payload = res.data as any;

      // Handle the new API response format
      if (payload && typeof payload === "object") {
        // New format: items, total_count, page_number, page_size, total_pages
        if ("items" in payload) {
          setDisputes((payload.items as any[]) || []);
          setTotal(payload.total_count || 0);
          setTotalPages(payload.total_pages || 1);
        } else if ("data" in payload) {
          // Old PaginatedResponse format
          setDisputes(payload.data || []);
          if (payload.pagination) {
            setTotal(payload.pagination.total || 0);
            setTotalPages(payload.pagination.totalPages || 1);
          }
        }

        // Build user map from farmers and workers
        const newUserMap: UserMap = {};
        if (
          "farmers" in payload &&
          payload.farmers &&
          Array.isArray(payload.farmers)
        ) {
          payload.farmers.forEach((farmer: FarmerProfileDTO) => {
            newUserMap[farmer.userId] = {
              fullName: farmer.contactName,
              email: farmer.user?.email || "",
            };
          });
        }
        if (
          "workers" in payload &&
          payload.workers &&
          Array.isArray(payload.workers)
        ) {
          payload.workers.forEach((worker: WorkerProfileDTO) => {
            newUserMap[worker.userId] = {
              fullName: worker.fullName,
              email: worker.email,
            };
          });
        }
        setUserMap(newUserMap);
      }

      // Fetch summary stats
      try {
        const sumRes = await disputeService.getSummary();
        const data = Array.isArray(sumRes)
          ? sumRes
          : Array.isArray(sumRes?.data)
            ? sumRes.data
            : (sumRes?.data?.data ?? []);
        setSummaryStats(data as any[]);
      } catch (err) {
        console.error("Failed to fetch dispute summary", err);
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi khi gọi API");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, disputeTypeFilter]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, disputeTypeFilter]);

  const openChat = (
    userId?: string | null,
    displayName?: string,
    avatarUrl?: string,
  ) => {
    if (!userId) {
      toast({
        title: "Không thể mở trò chuyện",
        description: "Không tìm thấy người dùng để bắt đầu cuộc trò chuyện.",
        variant: "destructive",
      });
      return;
    }
    setChatReceiver({
      id: userId,
      name:
        displayName ||
        (userId.length > 8
          ? `Người dùng ${userId.substring(0, 8).toUpperCase()}`
          : userId),
      avatarUrl: avatarUrl || "/placeholder.svg",
    });
    setIsChatDialogOpen(true);
  };

  const openStatusDialog = (dispute: any) => {
    setSelectedDispute(dispute);
    setSelectedStatusId(dispute?.statusId ?? 1);
    setIsStatusDialogOpen(true);
  };

  const submitStatusChange = async () => {
    if (!selectedDispute || selectedStatusId == null) return;
    setStatusSubmitting(true);
    try {
      await disputeService.updateStatus(
        selectedDispute.id,
        Number(selectedStatusId),
      );
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === selectedDispute.id
            ? { ...d, statusId: Number(selectedStatusId) }
            : d,
        ),
      );
      setIsStatusDialogOpen(false);
      setSelectedDispute(null);
      setSelectedStatusId(null);
      toast({
        title: "Đã cập nhật trạng thái",
        description: "Trạng thái tranh chấp đã được lưu thành công.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Cập nhật thất bại",
        description:
          err?.message || "Không thể cập nhật trạng thái tranh chấp.",
        variant: "destructive",
      });
    } finally {
      setStatusSubmitting(false);
    }
  };

  // Build stats from API summary (fallback to defaults)
  const statusLabelMap: Record<number, { label: string; color: string }> = {
    1: { label: "Tranh chấp đang chờ", color: "text-destructive" },
    2: { label: "Đang xử lý", color: "text-[#D28228]" },
    3: { label: "Đã giải quyết", color: "text-green-700" },
    4: { label: "Từ chối", color: "text-destructive" },
  };

  const statsSource =
    summaryStats && summaryStats.length
      ? summaryStats
      : [
          { statusId: 1, statusName: "Pending", count: 0 },
          { statusId: 2, statusName: "UnderReview", count: 0 },
          { statusId: 3, statusName: "Resolved", count: 0 },
          { statusId: 4, statusName: "Rejected", count: 0 },
        ];

  const stats = statsSource.map((s: any) => {
    const meta = statusLabelMap[s.statusId] ?? {
      label: s.statusName ?? String(s.statusId),
      color: "text-muted-foreground",
    };
    return {
      label: meta.label,
      value: String(s.count ?? 0),
      textColor: meta.color,
    };
  });

  // Determine responsive grid columns for stats (max 4 columns)
  const statsCols = Math.min(stats.length, 4);
  let mdGridColsClass = "md:grid-cols-1";
  if (statsCols === 2) mdGridColsClass = "md:grid-cols-2";
  else if (statsCols === 3) mdGridColsClass = "md:grid-cols-3";
  else if (statsCols >= 4) mdGridColsClass = "md:grid-cols-4";

  return (
    <div className="p-8 space-y-6">
      {loading && <div>Đang tải danh sách khiếu nại...</div>}
      {error && <div className="text-destructive">{error}</div>}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Quản lý tranh chấp
        </h1>
        <p className="text-muted-foreground mt-2">
          Xử lý khiếu nại giữa nông dân và người làm
        </p>
      </div>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái</DialogTitle>
            <DialogDescription>
              Chọn trạng thái cho tranh chấp
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <p className="text-sm text-muted-foreground">
              Tranh chấp: {selectedDispute?.reason ?? "-"}
            </p>

            <select
              value={selectedStatusId ?? ""}
              onChange={(e) => setSelectedStatusId(Number(e.target.value))}
              className="w-full border border-border rounded px-3 py-2 bg-card text-foreground"
            >
              <option value={1}>Đang chờ</option>
              <option value={2}>Đang xử lý</option>
              <option value={3}>Đã giải quyết</option>
              <option value={4}>Từ chối</option>
            </select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              className="mr-2"
            >
              Hủy
            </Button>
            <Button
              onClick={submitStatusChange}
              disabled={statusSubmitting || selectedStatusId == null}
            >
              {statusSubmitting ? "Đang gửi..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
        <DialogContent className="sm:max-w-[1200px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {chatReceiver
                ? `Chat với ${chatReceiver.name}`
                : "Cuộc trò chuyện"}
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-[70vh] flex gap-4">
            <SignalRProvider>
              {/* <div className="w-80 shrink-0 bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <ChatSidebar
                  onConversationSelect={(conv) => {
                    const query = new URLSearchParams();
                    if (conv.userName) query.set("name", conv.userName);
                    if (conv.userAvatar) query.set("avatarUrl", conv.userAvatar);
                    // router.push(`/farmer/messages/${conv.id}?${query.toString()}`);
                  }}
                />
              </div> */}
              {chatReceiver && (
                <div className="flex-1 bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  <ChatInterface
                    receiver={{
                      id: chatReceiver.id,
                      name: chatReceiver.name,
                      avatarUrl: chatReceiver.avatarUrl || "/placeholder.svg",
                    }}
                  />
                </div>
              )}
            </SignalRProvider>
          </div>
        </DialogContent>
      </Dialog>

      <div className={`grid grid-cols-1 ${mdGridColsClass} gap-6`}>
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-card rounded-lg border border-border p-4 h-28 flex flex-col items-center justify-center"
          >
            <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.textColor} text-center`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search
            size={20}
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên công việc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-card text-foreground"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="1">Đang chờ</option>
          <option value="2">Đang xử lý</option>
          <option value="3">Đã giải quyết</option>
          <option value="4">Từ chối</option>
        </select>
        <select
          value={disputeTypeFilter}
          onChange={(e) => setDisputeTypeFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-card text-foreground"
        >
          <option value="">Tất cả loại</option>
          <option value="1">Chất lượng công việc</option>
          <option value="2">Thanh toán</option>
          <option value="3">Khác</option>
        </select>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Người tố cáo
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Người bị tố cáo
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Công việc
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Lý do
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Bằng chứng
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Ngày xử lý
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={11}
                    className="py-16 text-center text-muted-foreground"
                  >
                    <Loader2 size={28} className="inline animate-spin mr-2" />
                    Đang tải...
                  </td>
                </tr>
              ) : disputes.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="py-16 text-center text-muted-foreground"
                  >
                    Không tìm thấy tranh chấp nào.
                  </td>
                </tr>
              ) : (
                disputes.map((dispute) => (
                  <tr
                    key={dispute.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    {/* Người tố cáo */}
                    <td className="px-6 py-4 max-w-xs">
                      <span title={dispute.reporterUserId}>
                        {userMap[dispute.reporterUserId]?.fullName ||
                          dispute.reporterUserId ||
                          "-"}
                      </span>
                    </td>
                    {/* Người bị tố cáo */}
                    <td className="px-6 py-4 max-w-xs">
                      <span title={dispute.accusedUserId}>
                        {userMap[dispute.accusedUserId]?.fullName ||
                          dispute.accusedUserId ||
                          "-"}
                      </span>
                    </td>
                    {/* Công việc */}
                    <td className="px-6 py-4 max-w-xs">
                      {dispute.jobPost?.title || "-"}
                    </td>
                    {/* Lý do */}
                    <td className="px-6 py-4 max-w-xs">
                      <p
                        className="font-semibold text-foreground truncate"
                        title={dispute.reason}
                      >
                        {dispute.reason}
                      </p>
                    </td>
                    {/* Mô tả */}
                    <td className="px-6 py-4 max-w-xs">
                      <p
                        className="text-muted-foreground truncate"
                        title={dispute.description}
                      >
                        {dispute.description}
                      </p>
                    </td>
                    {/* Bằng chứng */}
                    <td className="px-6 py-4">
                      {dispute.evidenceUrl ? (
                        <a
                          href={dispute.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          Xem
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Không có</span>
                      )}
                    </td>
                    {/* Loại */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          DISPUTE_TYPE_META[dispute.disputeTypeId]?.className ||
                          "border border-muted bg-muted text-muted-foreground"
                        }`}
                      >
                        {DISPUTE_TYPE_META[dispute.disputeTypeId]?.label ||
                          "Khác"}
                      </span>
                    </td>
                    {/* Trạng thái */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          DISPUTE_STATUS_META[dispute.statusId]?.className ||
                          "border border-muted bg-muted text-muted-foreground"
                        }`}
                      >
                        {DISPUTE_STATUS_META[dispute.statusId]?.label || "-"}
                      </span>
                    </td>

                    {/* Ngày tạo */}
                    <td className="px-6 py-4">
                      <p className="text-muted-foreground text-sm">
                        {dispute.createdAt
                          ? new Date(dispute.createdAt).toLocaleString()
                          : ""}
                      </p>
                    </td>
                    {/* Ngày xử lý */}
                    <td className="px-6 py-4">
                      <p className="text-muted-foreground text-sm">
                        {dispute.resolvedAt
                          ? new Date(dispute.resolvedAt).toLocaleString()
                          : "-"}
                      </p>
                    </td>
                    {/* Hành động */}
                    <td className="px-6 py-4 flex gap-2">
                      {dispute.statusId === 2 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="Bình luận"
                            >
                              <MessageSquare
                                size={18}
                                className="text-primary"
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() =>
                                openChat(
                                  dispute.reporterUserId,
                                  userMap[dispute.reporterUserId]?.fullName,
                                )
                              }
                            >
                              Chat với người tố cáo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openChat(
                                  dispute.accusedUserId,
                                  userMap[dispute.accusedUserId]?.fullName,
                                )
                              }
                            >
                              Chat với người bị tố cáo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {dispute.statusId !== 3 && dispute.statusId !== 4 && (
                        <button
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Cập nhật"
                          onClick={() => openStatusDialog(dispute)}
                        >
                          <Edit size={18} className="text-blue-500" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Trang {page} / {totalPages} · Tổng {total} tranh chấp
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
