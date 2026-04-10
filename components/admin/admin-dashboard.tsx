"use client";

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

export function AdminDashboard() {
  const stats = [
    {
      label: "Tổng người dùng",
      value: "2,547",
      icon: Users,
      change: "+12%",
      color: "bg-primary",
    },
    {
      label: "Công việc đang hoạt động",
      value: "342",
      icon: Briefcase,
      change: "+8%",
      color: "bg-[#D28228]",
    },
    {
      label: "Tổng doanh thu",
      value: "$48,250",
      icon: DollarSign,
      change: "+24%",
      color: "bg-[#10B981]",
    },
    {
      label: "Tỷ lệ hoàn thành",
      value: "94.2%",
      icon: TrendingUp,
      change: "+3%",
      color: "bg-primary",
    },
  ];

  const chartData = [
    { month: "Jan", users: 400, jobs: 240, revenue: 2400 },
    { month: "Feb", users: 520, jobs: 290, revenue: 2810 },
    { month: "Mar", users: 680, jobs: 350, revenue: 3200 },
    { month: "Apr", users: 750, jobs: 420, revenue: 3890 },
    { month: "May", users: 920, jobs: 510, revenue: 4500 },
    { month: "Jun", users: 1100, jobs: 620, revenue: 5200 },
  ];

  const jobStatusData = [
    { name: "Hoàn thành", value: 680, color: "#3A8250" },
    { name: "Đang tiến hành", value: 342, color: "#10B981" },
    { name: "Chờ xử lý", value: 156, color: "#D28228" },
    { name: "Hủy bỏ", value: 42, color: "#EF4444" },
  ];

  const recentActivity = [
    {
      id: 1,
      action: "Người dùng mới đăng ký",
      user: "Nguyễn Văn A",
      time: "2 phút trước",
    },
    {
      id: 2,
      action: "Công việc hoàn thành",
      job: "Trồng cà chua",
      time: "15 phút trước",
    },
    {
      id: 3,
      action: "Tranh chấp được giải quyết",
      amount: "$150",
      time: "1 giờ trước",
    },
    {
      id: 4,
      action: "Nạp tiền vào ví",
      user: "Trần Thị B",
      amount: "$500",
      time: "2 giờ trước",
    },
    {
      id: 5,
      action: "Tài khoản bị khóa",
      user: "Lê Văn C",
      time: "3 giờ trước",
    },
  ];

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
                <span className="text-sm font-semibold text-green-600">
                  {stat.change}
                </span>
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
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 border-b border-border pb-4 last:border-0"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#10B981]/20">
                <Activity size={18} className="text-[#10B981]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {activity.action}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {("user" in activity && activity.user) ||
                    ("job" in activity && activity.job) ||
                    ("amount" in activity && activity.amount) ||
                    ""}
                </p>
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
