"use client";

import { Search, Eye, X } from "lucide-react";
import { useState } from "react";

export function AdminJobs() {
  const [jobs] = useState([
    {
      id: 1,
      title: "Trồng cà chua",
      farmer: "Nguyễn Văn A",
      worker: "Trần Thị B",
      status: "Completed",
      salary: "$150",
      startDate: "2024-01-10",
      endDate: "2024-01-20",
    },
    {
      id: 2,
      title: "Thu hoạch lúa",
      farmer: "Lê Văn C",
      worker: "Phạm Thị D",
      status: "In Progress",
      salary: "$200",
      startDate: "2024-03-01",
      endDate: "2024-03-15",
    },
    {
      id: 3,
      title: "Chăm sóc bò sữa",
      farmer: "Đỗ Minh E",
      worker: "-",
      status: "Pending",
      salary: "$100/ngày",
      startDate: "2024-03-10",
      endDate: "-",
    },
    {
      id: 4,
      title: "Trồng rau dền",
      farmer: "Hoàng Thị F",
      worker: "Võ Văn G",
      status: "Completed",
      salary: "$80",
      startDate: "2024-02-05",
      endDate: "2024-02-18",
    },
    {
      id: 5,
      title: "Quét vườn",
      farmer: "Bùi Văn H",
      worker: "Đinh Thị I",
      status: "Cancelled",
      salary: "$50",
      startDate: "2024-02-20",
      endDate: "2024-02-21",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredJobs = jobs.filter((job) => {
    const matchSearch = job.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "All" || job.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColors: Record<string, string> = {
    Completed: "bg-green-100 text-green-700",
    "In Progress": "bg-[#10B981]/20 text-[#10B981]",
    Pending: "bg-[#D28228]/20 text-[#D28228]",
    Cancelled: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="p-8 space-y-6">
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
          <option>Completed</option>
          <option>In Progress</option>
          <option>Pending</option>
          <option>Cancelled</option>
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
              {filteredJobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{job.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-muted-foreground">{job.farmer}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-foreground">{job.worker}</p>
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
                      {job.salary}
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
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} className="text-primary" />
                      </button>
                      {job.status === "In Progress" && (
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm">Tổng công việc</p>
          <p className="text-3xl font-bold text-foreground mt-2">1,245</p>
          <p className="text-sm text-muted-foreground mt-2">Tất cả thời gian</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm">Đang hoạt động</p>
          <p className="text-3xl font-bold text-[#10B981] mt-2">342</p>
          <p className="text-sm text-green-600 mt-2">27.5% của tổng</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm">Hoàn thành</p>
          <p className="text-3xl font-bold text-primary mt-2">680</p>
          <p className="text-sm text-green-600 mt-2">54.6% của tổng</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm">Tỷ lệ hoàn thành</p>
          <p className="text-3xl font-bold text-primary mt-2">94.2%</p>
          <p className="text-sm text-green-600 mt-2">Cao hơn mục tiêu</p>
        </div>
      </div>
    </div>
  );
}
