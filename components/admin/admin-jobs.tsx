"use client";

import { Search, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { adminService } from "@/libs/api/services/admin.service";
import { jobService } from "@/libs/api/services/jobs.service";
import type {
  AdminJob,
  AdminJobListResponse,
} from "@/libs/types/admin-job.types";

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
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Tính tổng số trang
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    let ignore = false;
    async function fetchJobs() {
      setLoading(true);
      setError(null);
      try {
        const params: any = { page, limit };
        if (searchTerm.trim()) params.title = searchTerm.trim();
        if (statusFilter !== "All") params.status = statusFilter;
        const res: AdminJobListResponse = await adminService.getJobs(params);
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

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const handleViewDetails = async (jobId: string) => {
    setIsModalOpen(true);
    setSelectedJob(null);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await jobService.getJobDetail(jobId);
      setSelectedJob(res?.data ?? res);
    } catch (e: any) {
      setDetailError(e?.message || "Không thể tải chi tiết công việc");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  const STATUS_ID_LABEL: Record<number, string> = {
    1: "Bản nháp",
    2: "Đã đăng",
    3: "Đã đóng",
    4: "Đang tiến hành",
    5: "Hoàn thành",
    6: "Đã hủy",
  };

  const STATUS_ID_COLORS: Record<number, string> = {
    1: "bg-muted text-muted-foreground",
    2: "bg-blue-100 text-blue-700",
    3: "bg-muted text-muted-foreground",
    4: "bg-[#10B981]/20 text-[#10B981]",
    5: "bg-green-100 text-green-700",
    6: "bg-destructive/20 text-destructive",
  };

  const statusColors: Record<string, string> = {
    Completed: "bg-green-100 text-green-700",
    InProgress: "bg-blue-100 text-blue-700",
    Published: "bg-yellow-100 text-yellow-700",
    Cancelled: "bg-red-100 text-red-600",
    Draft: "bg-gray-100 text-gray-500",
    Closed: "bg-orange-100 text-orange-600",
  };

  const STATUS_LABEL: Record<string, string> = {
    Completed: "Hoàn thành",
    InProgress: "Đang tiến hành",
    Cancelled: "Đã hủy",
    Draft: "Nháp",
    Published: "Đã đăng",
    Closed: "Đã đóng",
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
          <option value="All">Tất cả</option>
          <option value="Draft">Nháp</option>
          <option value="Published">Đã đăng</option>
          <option value="InProgress">Đang tiến hành</option>
          <option value="Completed">Hoàn thành</option>
          <option value="Cancelled">Đã hủy</option>
          <option value="Closed">Đã đóng</option>
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
                  Người nhận việc
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
                      {job.worker?.fullName || "-"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[job.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {STATUS_LABEL[job.status] ?? job.status}
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
                        onClick={() => handleViewDetails(job.id)}
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

      {/* <div className="flex justify-end items-center gap-2 mt-4">
        <button
          className="px-3 py-1 rounded border border-border bg-card text-foreground disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          Trang trước
        </button>
        <span className="text-sm">Trang {page}</span>
        <button
          className="px-3 py-1 rounded border border-border bg-card text-foreground disabled:opacity-50"
          onClick={() =>
            setPage((p) => (total && page * limit < total ? p + 1 : p))
          }
          disabled={loading || (total && page * limit >= total)}
        >
          Trang sau
        </button>
      </div> */}

      {/* ── Job Detail Centered Modal ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeDetail}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-xl max-h-[90vh] bg-card shadow-2xl flex flex-col overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeScaleIn 0.2s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/50">
              <h2 className="text-lg font-bold text-foreground">Chi tiết công việc</h2>
              <button
                onClick={closeDetail}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {detailLoading && (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {detailError && (
                <div className="text-center text-destructive py-10">{detailError}</div>
              )}
              {selectedJob && (
                <>
                  {/* Title + Status */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground leading-tight">
                        {selectedJob.title}
                      </h3>
                      {selectedJob.isUrgent && (
                        <span className="inline-block mt-1 text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                          🔥 Khẩn cấp
                        </span>
                      )}
                    </div>
                    <span
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                        STATUS_ID_COLORS[selectedJob.statusId] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {STATUS_ID_LABEL[selectedJob.statusId] ?? selectedJob.statusId}
                    </span>
                  </div>

                  {/* Description */}
                  {selectedJob.description && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Mô tả</p>
                      <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-3">
                        {selectedJob.description}
                      </p>
                    </div>
                  )}

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <JobInfoCard label="Người đăng" value={selectedJob.contactName || "-"} />
                    <JobInfoCard label="Danh mục" value={selectedJob.jobCategory?.name || "-"} />
                    <JobInfoCard
                      label="Mức lương"
                      value={selectedJob.wageAmount != null ? `${Number(selectedJob.wageAmount).toLocaleString()} VNĐ` : "-"}
                    />
                    <JobInfoCard label="Số lượng cần" value={selectedJob.workersNeeded ?? "-"} />
                    <JobInfoCard label="Đã nhận" value={selectedJob.workersAccepted ?? "-"} />
                    <JobInfoCard
                      label="Loại hình"
                      value={
                        selectedJob.jobTypeId === 1
                          ? "Toàn thời gian"
                          : selectedJob.jobTypeId === 2
                          ? "Bán thời gian"
                          : selectedJob.jobTypeId || "-"
                      }
                    />
                  </div>

                  {/* Schedule */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Lịch làm việc</p>
                    <div className="grid grid-cols-2 gap-3">
                      <JobInfoCard label="Ngày bắt đầu" value={selectedJob.startDate || "-"} />
                      <JobInfoCard label="Ngày kết thúc" value={selectedJob.endDate || "-"} />
                      <JobInfoCard label="Giờ bắt đầu" value={selectedJob.startTime || "-"} />
                      <JobInfoCard label="Giờ kết thúc" value={selectedJob.endTime || "-"} />
                    </div>
                    {Array.isArray(selectedJob.jobPostDays) && selectedJob.jobPostDays.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedJob.jobPostDays.map((day) => (
                          <span key={day.workDate} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                            {day.workDate}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  {(selectedJob.address || selectedJob.farm?.name) && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Địa điểm</p>
                      <div className="bg-muted/30 rounded-lg p-3 text-sm text-foreground space-y-1">
                        {selectedJob.farm?.name && <p className="font-medium">{selectedJob.farm.name}</p>}
                        {selectedJob.address && <p className="text-muted-foreground">{selectedJob.address}</p>}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {Array.isArray(selectedJob.jobSkillRequirements) && selectedJob.jobSkillRequirements.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Kỹ năng yêu cầu</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.jobSkillRequirements.map((s: any) => (
                          <span key={s.id} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements */}
                  {Array.isArray(selectedJob.requirements) && selectedJob.requirements.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Yêu cầu</p>
                      <ul className="space-y-1">
                        {selectedJob.requirements.map((r: string, i: number) => (
                          <li key={i} className="text-sm text-foreground flex gap-2">
                            <span className="text-primary">•</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Privileges */}
                  {Array.isArray(selectedJob.privileges) && selectedJob.privileges.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quyền lợi</p>
                      <ul className="space-y-1">
                        {selectedJob.privileges.map((p: string, i: number) => (
                          <li key={i} className="text-sm text-foreground flex gap-2">
                            <span className="text-green-500">✓</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Thời gian</p>
                    <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                      {selectedJob.createdAt && (
                        <span>Tạo lúc: {new Date(selectedJob.createdAt).toLocaleString("vi-VN")}</span>
                      )}
                      {selectedJob.publishedAt && (
                        <span>Đăng lúc: {new Date(selectedJob.publishedAt).toLocaleString("vi-VN")}</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function JobInfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-muted/40 rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
