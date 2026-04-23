"use client";

import {
  Search,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  Edit,
  UserX,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
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
type UserMap = Record<string, { fullName: string; email: string }>;

export function AdminDisputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<UserMap>({});

  useEffect(() => {
    let ignore = false;
    async function fetchDisputesAndUsers() {
      setLoading(true);
      setError(null);
      try {
        // Fetch disputes
        const res = await disputeService.getAllDisputes();
        let disputesData = Array.isArray(res.data) ? res.data : [];
        // Collect all user IDs (reporter, accused)
        const userIds = new Set<string>();
        disputesData.forEach((d: any) => {
          if (d.reporterUserId) userIds.add(d.reporterUserId);
          if (d.accusedUserId) userIds.add(d.accusedUserId);
        });
        // Fetch all users (adminService.getUsers returns paginated)
        // let users: any[] = [];
        let page = 1;
        let hasMore = true;
        // while (hasMore) {
        //   const userRes = await adminService.getUsers({ page, limit: 100 });
        //   let pageData = Array.isArray(userRes.data?.data)
        //     ? userRes.data.data
        //     : userRes.data;
        //   if (Array.isArray(pageData)) users.push(...pageData);
        //   hasMore = pageData && pageData.length === 100;
        //   page++;
        // }
        // Map userId to user info
        const map: UserMap = {};
        // users.forEach((u: any) => {
        //   map[u.userId] = { fullName: u.fullName, email: u.email };
        // });
        debugger;

        if (!ignore) {
          setDisputes(res.data.disputeReports);
          const userMap: UserMap = {};
          res.data.farmers.forEach((farmer: FarmerProfileDTO) => {
            userMap[farmer.userId] = {
              fullName: farmer.contactName,
              email: farmer.user.email,
            };
          });
          res.data.workers.forEach((worker: WorkerProfileDTO) => {
            userMap[worker.userId] = {
              fullName: worker.fullName,
              email: worker.email,
            };
          });
          setUserMap(userMap);
          // Fetch summary counts for stats (best-effort)
          try {
            const sumRes = await disputeService.getSummary();
            const data = Array.isArray(sumRes)
              ? sumRes
              : Array.isArray(sumRes?.data)
              ? sumRes.data
              : sumRes?.data?.data ?? [];
            if (!ignore) setSummaryStats(data as any[]);
          } catch (err) {
            console.error("Failed to fetch dispute summary", err);
          }
        }
      } catch (e: any) {
        setError(e?.message || "Lỗi khi gọi API");
      } finally {
        setLoading(false);
      }
    }
    fetchDisputesAndUsers();
    return () => {
      ignore = true;
    };
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [summaryStats, setSummaryStats] = useState<Array<{statusId:number;statusName:string;count:number}>>([]);

  const filteredDisputes = disputes.filter((dispute) => {
    // Tùy chỉnh lại các trường filter cho phù hợp với API trả về
    const matchSearch =
      (dispute.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())) ??
      false;
    const matchStatus =
      statusFilter === "All" || dispute.status === statusFilter;
    // severity có thể không có trong API, tạm bỏ filter này nếu không có
    return matchSearch && matchStatus;
  });

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      High: "bg-destructive/20 text-destructive",
      Medium: "bg-[#D28228]/20 text-[#D28228]",
      Low: "bg-[#10B981]/20 text-[#10B981]",
    };
    return colors[severity] ?? "bg-muted text-muted-foreground";
  };

  const getStatusIcon = (status: string) => {
    if (status === "Resolved") {
      return <CheckCircle size={18} className="text-green-600" />;
    } else if (status === "Investigating") {
      return <AlertCircle size={18} className="text-[#D28228]" />;
    } else {
      return <AlertCircle size={18} className="text-destructive" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Resolved: "bg-green-100 text-green-700",
      Investigating: "bg-[#D28228]/20 text-[#D28228]",
      Pending: "bg-destructive/20 text-destructive",
    };
    return colors[status] ?? "bg-muted text-muted-foreground";
  };

  

  // Build stats from API summary (fallback to defaults)
  const statusLabelMap: Record<number, { label: string; color: string }> = {
    1: { label: "Tranh chấp đang chờ", color: "text-destructive" },
    2: { label: "Đang xử lý", color: "text-[#D28228]" },
    3: { label: "Đã giải quyết", color: "text-green-700" },
    4: { label: "Từ chối", color: "text-destructive" },
  };

  const statsSource = summaryStats && summaryStats.length
    ? summaryStats
    : [
        { statusId: 1, statusName: "Pending", count: 0 },
        { statusId: 2, statusName: "UnderReview", count: 0 },
        { statusId: 3, statusName: "Resolved", count: 0 },
        { statusId: 4, statusName: "Rejected", count: 0 },
      ];

  const stats = statsSource.map((s: any) => {
    const meta = statusLabelMap[s.statusId] ?? { label: s.statusName ?? String(s.statusId), color: "text-muted-foreground" };
    return { label: meta.label, value: String(s.count ?? 0), textColor: meta.color };
  });

  // Determine responsive grid columns for stats (max 4 columns)
  const statsCols = Math.min(stats.length, 4);
  let mdGridColsClass = "md:grid-cols-1";
  if (statsCols === 2) mdGridColsClass = "md:grid-cols-2";
  else if (statsCols === 3) mdGridColsClass = "md:grid-cols-3";
  else if (statsCols >= 4) mdGridColsClass = "md:grid-cols-4";

  const openStatusDialog = (dispute: any) => {
    setSelectedDispute(dispute);
    setSelectedStatusId(dispute?.status ?? 1);
    setIsStatusDialogOpen(true);
  };

  const submitStatusChange = async () => {
    if (!selectedDispute || selectedStatusId == null) return;
    setStatusSubmitting(true);
    try {
      await disputeService.updateStatus(selectedDispute.id, Number(selectedStatusId));
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === selectedDispute.id ? { ...d, status: Number(selectedStatusId) } : d,
        ),
      );
      setIsStatusDialogOpen(false);
      setSelectedDispute(null);
      setSelectedStatusId(null);
      alert("Cập nhật trạng thái thành công");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Lỗi khi cập nhật trạng thái");
    } finally {
      setStatusSubmitting(false);
    }
  };

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
            <DialogDescription>Chọn trạng thái cho tranh chấp</DialogDescription>
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
              <option value={1} disabled>Đang chờ</option>
              <option value={2}>Đang xử lý</option>
              <option value={3}>Đã giải quyết</option>
              <option value={4}>Từ chối</option>
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)} className="mr-2">
              Hủy
            </Button>
            <Button onClick={submitStatusChange} disabled={statusSubmitting || selectedStatusId == null}>
              {statusSubmitting ? "Đang gửi..." : "Cập nhật"}
            </Button>
          </DialogFooter>
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
            placeholder="Tìm kiếm theo tên hoặc khiếu nại..."
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
          <option>All</option>
          <option>Pending</option>
          <option>Investigating</option>
          <option>Resolved</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-card text-foreground"
        >
          <option>All</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
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
              {filteredDisputes.map((dispute) => (
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
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                      {dispute.disputeType === 1
                        ? "Chất lượng công việc"
                        : dispute.disputeType === 2
                          ? "Thanh toán"
                          : "Khác"}
                    </span>
                  </td>
                  {/* Trạng thái */}
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                      {dispute.status === 1
                        ? "Đang chờ"
                        : dispute.status === 2
                          ? "Đang xử lý"
                          : dispute.status === 3
                            ? "Đã giải quyết"
                            : dispute.status === 4
                              ? "Từ chối"
                              : "-"}
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
                    {dispute.status === 2 && (
                      <button
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Bình luận"
                      >
                        <MessageSquare size={18} className="text-primary" />
                      </button>
                    )}
                    {dispute.status !== 3 && dispute.status !== 4 && (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
