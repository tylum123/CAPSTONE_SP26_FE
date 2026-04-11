"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { adminService } from "@/libs/api/services";

interface DashboardStats {
  totalUsers: number;
  activeJobs: number;
  totalRevenue: number;
  completionRate: number;
}

interface TrendItem {
  month: string;
  newUsers: number;
  newJobs: number;
  revenue: number;
}

interface JobStatusBreakdown {
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  actorName: string;
  amount?: number;
  createdAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  trends: TrendItem[];
  jobStatusBreakdown: JobStatusBreakdown;
  recentActivities: RecentActivity[];
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getDashboard()
      .then((res) => {
        setData(res.data ?? res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        {
          label: "Tổng người dùng",
          value: data.stats.totalUsers.toLocaleString(),
          icon: Users,
          color: "bg-primary",
        },
        {
          label: "Công việc đang hoạt động",
          value: data.stats.activeJobs.toLocaleString(),
          icon: Briefcase,
          color: "bg-[#D28228]",
        },
        {
          label: "Tổng doanh thu",
          value: data.stats.totalRevenue.toLocaleString("vi-VN") + " ₫",
          icon: DollarSign,
          color: "bg-[#10B981]",
        },
        {
          label: "Tỷ lệ hoàn thành",
          value: data.stats.completionRate.toFixed(1) + "%",
          icon: TrendingUp,
          color: "bg-primary",
        },
      ]
    : [];

  const chartData = (data?.trends ?? []).map((t) => ({
    month: t.month,
    users: t.newUsers,
    jobs: t.newJobs,
    revenue: t.revenue,
  }));

  const jobStatusData = data
    ? [
        {
          name: "Hoàn thành",
          value: data.jobStatusBreakdown.completed,
          color: "#3A8250",
        },
        {
          name: "Đang tiến hành",
          value: data.jobStatusBreakdown.inProgress,
          color: "#10B981",
        },
        {
          name: "Chờ xử lý",
          value: data.jobStatusBreakdown.pending,
          color: "#D28228",
        },
        {
          name: "Hủy bỏ",
          value: data.jobStatusBreakdown.cancelled,
          color: "#EF4444",
        },
      ]
    : [];

  const recentActivities = data?.recentActivities ?? [];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Tổng quan hệ thống AgroTemp
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </h3>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            Xu hướng hệ thống (6 tháng)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                }}
                labelStyle={{ color: "#111827" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#3A8250"
                strokeWidth={2}
                name="Người dùng"
              />
              <Line
                type="monotone"
                dataKey="jobs"
                stroke="#10B981"
                strokeWidth={2}
                name="Công việc"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#D28228"
                strokeWidth={2}
                name="Doanh thu"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            Trạng thái công việc
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={jobStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {jobStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toString()} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2 text-sm">
            {jobStatusData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-foreground">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity size={20} className="text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            Hoạt động gần đây
          </h2>
        </div>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 border-b border-border pb-4 last:border-0"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#10B981]/20">
                <Activity size={18} className="text-[#10B981]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {activity.description}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activity.actorName}
                  {activity.amount !== undefined && (
                    <span className="ml-2 font-medium text-primary">
                      {activity.amount.toLocaleString("vi-VN")} ₫
                    </span>
                  )}
                </p>
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {formatTimeAgo(activity.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
