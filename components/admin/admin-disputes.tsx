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
import { User } from "@/libs/types";
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
          res.data.users.forEach((user: User) => {
            userMap[user.userId] = {
              fullName: user.fullName,
              email: user.email,
            };
          });
          setUserMap(userMap);
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

  const stats = [
    { label: "Tranh chấp đang chờ", value: "2", textColor: "text-destructive" },
    { label: "Đang điều tra", value: "1", textColor: "text-[#D28228]" },
    { label: "Đã giải quyết", value: "2", textColor: "text-green-700" },
  ];

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  Bên chịu phạt
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
                    {dispute.jobPostId || "-"}
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
                  {/* Bên chịu phạt */}
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                      {dispute.penaltyTarget === 0
                        ? "Không có"
                        : dispute.penaltyTarget === 1
                          ? "Người tố cáo"
                          : dispute.penaltyTarget === 2
                            ? "Người bị tố cáo"
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
                    <button
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Bình luận"
                    >
                      <MessageSquare size={18} className="text-primary" />
                    </button>
                    <button
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Cập nhật"
                    >
                      <Edit size={18} className="text-blue-500" />
                    </button>
                    <button
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Ban tài khoản"
                    >
                      <UserX size={18} className="text-destructive" />
                    </button>
                    <button
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={18} className="text-destructive" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">
          Cac tuy chon giai quyet tranh chap
        </h2>
        <div className="space-y-3">
          <button className="w-full flex items-center gap-3 p-4 border-2 border-border rounded-lg hover:bg-muted transition-colors">
            <CheckCircle size={20} className="text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-foreground">
                Hoan tien toan bo cho Farmer
              </p>
              <p className="text-sm text-muted-foreground">
                Huy bo giao dich hoan toan
              </p>
            </div>
          </button>
          <button className="w-full flex items-center gap-3 p-4 border-2 border-border rounded-lg hover:bg-muted transition-colors">
            <CheckCircle size={20} className="text-[#D28228]" />
            <div className="text-left">
              <p className="font-semibold text-foreground">
                Thanh toan mot phan
              </p>
              <p className="text-sm text-muted-foreground">
                Chia se tai chinh giua hai ben
              </p>
            </div>
          </button>
          <button className="w-full flex items-center gap-3 p-4 border-2 border-border rounded-lg hover:bg-muted transition-colors">
            <CheckCircle size={20} className="text-primary" />
            <div className="text-left">
              <p className="font-semibold text-foreground">Tu choi yeu cau</p>
              <p className="text-sm text-muted-foreground">
                Giu nguyen giao dich hien tai
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
