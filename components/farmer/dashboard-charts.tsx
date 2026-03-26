"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const data = [
  { name: "T2", ung_tuyen: 4, cong_viec: 2 },
  { name: "T3", ung_tuyen: 3, cong_viec: 1 },
  { name: "T4", ung_tuyen: 7, cong_viec: 3 },
  { name: "T5", ung_tuyen: 5, cong_viec: 2 },
  { name: "T6", ung_tuyen: 8, cong_viec: 4 },
  { name: "T7", ung_tuyen: 12, cong_viec: 5 },
  { name: "CN", ung_tuyen: 10, cong_viec: 4 },
]

export function ActivityChart() {
  return (
    <Card className="col-span-1 lg:col-span-2 shadow-sm border-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Hoạt động tuần này</CardTitle>
        <CardDescription>Số lượng ứng tuyển và công việc mới</CardDescription>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
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

const jobStatusData = [
  { name: "Đang tuyển", value: 5, color: "#10b981" }, // emerald-500
  { name: "Đang thực hiện", value: 3, color: "#f97316" }, // orange-500
  { name: "Đã hoàn thành", value: 8, color: "#2563eb" }, // blue-600
  { name: "Đã hủy", value: 1, color: "#ef4444" }, // red-500
]

export function JobStatusChart() {
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
                data={jobStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {jobStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-4 flex-wrap">
          {jobStatusData.map((item, index) => (
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
