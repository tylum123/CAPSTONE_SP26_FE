"use client";

import { Search, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { adminJobService } from "@/libs/api/services/admin-job.service";
import type {
  AdminJob,
  AdminJobListResponse,
} from "@/libs/types/admin-job.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AdminJobs() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    active: number;
    completed: number;
    completionRate: number;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);

  // Tính tổng số trang
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    let ignore = false;
    async function fetchJobs() {
      setLoading(true);
      setError(null);
      try {
        const params: any = { page, limit };
        if (searchTerm) params.search = searchTerm;
        if (statusFilter !== "All") params.status = statusFilter;
        const res: AdminJobListResponse = await adminJobService.getJobs(params);
        if (!ignore) {
          setJobs(res.data);
          setSummary(res.summary);
          setTotal(res.total);
        }
      } catch (e: any) {
        setError(e?.message || "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
    return () => {
      ignore = true;
    };
  }, [page, limit, searchTerm, statusFilter]);

  const statusColors: Record<string, string> = {
    Completed: "bg-green-100 text-green-700",
    InProgress: "bg-[#10B981]/20 text-[#10B981]",
    Pending: "bg-[#D28228]/20 text-[#D28228]",
    Cancelled: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="p-8 space-y-6">
      {loading && (
        <div className="text-center text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      )}
      {error && <div className="text-center text-destructive">{error}</div>}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Quản lý công việc
        </h1>
        <p className="text-muted-foreground mt-2">
          Theo dõi và kiểm soát các công việc trên nền tảng
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search
            size={20}
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Tìm kiếm công việc..."
            value={searchTerm}
            onChange={(e) => {
              setPage(1);
              setSearchTerm(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="px-4 py-2 border border-border rounded-lg bg-card text-foreground"
        >
          <option value="All">All</option>
          <option value="Completed">Completed</option>
          <option value="InProgress">In Progress</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Jobs Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Tiêu đề
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Người đăng
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Nhân công
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Lương
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Ngày bắt đầu
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{job.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-muted-foreground">
                      {job.farmer?.fullName || "-"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-foreground">
                      {job.worker || "-"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[job.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">
                      {job.salary?.toLocaleString?.() || "-"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-muted-foreground text-sm">
                      {job.startDate}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} className="text-primary" />
                      </button>
                      {job.status === "InProgress" && (
                        <button
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Hủy công việc"
                        >
                          <X size={18} className="text-destructive" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-card rounded-b-lg">
          <p className="text-sm text-muted-foreground">
            {/* Tổng{" "}
            <span className="font-semibold text-foreground">
              {total.toLocaleString()}
            </span>{" "}
            công việc */}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-foreground">
              Trang <span className="font-semibold">{page}</span> / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm">Tổng công việc</p>
          <p className="text-3xl font-bold text-foreground mt-2">
            {summary?.total ?? "-"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">Tất cả thời gian</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm">Đang hoạt động</p>
          <p className="text-3xl font-bold text-[#10B981] mt-2">
            {summary?.active ?? "-"}
          </p>
          <p className="text-sm text-green-600 mt-2">
            {summary && summary.total
              ? `${Math.round((summary.active / summary.total) * 100)}% của tổng`
              : "-"}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm">Hoàn thành</p>
          <p className="text-3xl font-bold text-primary mt-2">
            {summary?.completed ?? "-"}
          </p>
          <p className="text-sm text-green-600 mt-2">
            {summary && summary.total
              ? `${Math.round((summary.completed / summary.total) * 100)}% của tổng`
              : "-"}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm">Tỷ lệ hoàn thành</p>
          <p className="text-3xl font-bold text-primary mt-2">
            {summary?.completionRate ?? "-"}
          </p>
          <p className="text-sm text-green-600 mt-2">Cao hơn mục tiêu</p>
        </div>
      </div>

      {/* Pagination */}
      {/* <div className="flex justify-end items-center gap-2 mt-4">
        ... (commented out code) ...
      </div> */}
      
      {/* Job Details Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedJob?.title}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-sm text-muted-foreground">Người đăng</p>
                <p className="font-semibold text-foreground">{selectedJob.farmer?.fullName || "Chưa cập nhật"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${statusColors[selectedJob.status] ?? "bg-muted text-muted-foreground"}`}>
                  {selectedJob.status}
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Mô tả công việc</p>
                <div className="p-3 mt-1 rounded-lg bg-muted text-sm text-foreground whitespace-pre-wrap">
                  {selectedJob.description || "Không có mô tả"}
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Địa chỉ</p>
                <p className="font-medium text-foreground">{selectedJob.address || "Chưa cập nhật"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lương (VNĐ)</p>
                <p className="font-semibold text-foreground">{selectedJob.salary?.toLocaleString() || "Thỏa thuận"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Thời gian bắt đầu</p>
                <p className="font-semibold text-foreground">{selectedJob.startDate || "Chưa cập nhật"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số người nhận việc</p>
                <p className="font-semibold text-foreground">{selectedJob.workersAccepted} / {selectedJob.workersNeeded} người</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mã công việc</p>
                <p className="text-xs text-foreground font-mono truncate">{selectedJob.id}</p>
              </div>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setSelectedJob(null)}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
