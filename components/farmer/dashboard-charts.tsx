"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface ActivityData {
  name: string;
  applicationsCount: number;
  jobPostsCount: number;
}

export function ActivityChart({ data = [] }: { data?: ActivityData[] }) {
  const chartData = data.map(item => ({
    name: item.name,
    ung_tuyen: item.applicationsCount,
    cong_viec: item.jobPostsCount
  }));

  return (
    <Card className="col-span-1 lg:col-span-2 shadow-sm border-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Hoạt động tuần này</CardTitle>
        <CardDescription>Số lượng ứng tuyển và công việc mới</CardDescription>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${value}`} 
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Ứng tuyển
                            </span>
                            <span className="font-bold text-emerald-600">
                              {payload[0].value}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Công việc
                            </span>
                            <span className="font-bold text-orange-500">
                              {payload[1].value}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Bar
                name="Ứng tuyển"
                dataKey="ung_tuyen"
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name="Công việc mới"
                dataKey="cong_viec"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface JobStatusData {
  statusId: number;
  statusName: string;
  count: number;
}

const statusColors: Record<number, string> = {
  1: "#94a3b8", // Draft - slate-400
  2: "#2563eb", // Published - blue-600
  3: "#f59e0b", // Closed - amber-500
  4: "#f97316", // InProgress - orange-500
  5: "#10b981", // Completed - emerald-500
  6: "#ef4444", // Cancelled - red-500
};

const statusLabels: Record<number, string> = {
  1: "Nháp",
  2: "Đang tuyển",
  3: "Đã đóng",
  4: "Đang thực hiện",
  5: "Hoàn thành",
  6: "Đã hủy",
};

export function JobStatusChart({ data = [] }: { data?: JobStatusData[] }) {
  const chartData = data.map(item => ({
    name: statusLabels[item.statusId] || item.statusName,
    value: item.count,
    color: statusColors[item.statusId] || "#cccccc"
  }));

  return (
    <Card className="col-span-1 shadow-sm border-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Trạng thái công việc</CardTitle>
        <CardDescription>Phân bố các công việc hiện tại</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-4 flex-wrap">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
