'use client'

import { Search, AlertCircle, MessageSquare, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export function AdminDisputes() {
  const [disputes] = useState([
    { id: 1, complaint: 'Cong viec khong hoan thanh day du', farmer: 'Nguyen Van A', worker: 'Tran Thi B', amount: '$150', status: 'Pending', date: '2024-03-15', severity: 'High' },
    { id: 2, complaint: 'Thanh toan khong dung gio', farmer: 'Le Van C', worker: 'Pham Thi D', amount: '$200', status: 'Resolved', date: '2024-03-10', severity: 'Medium' },
    { id: 3, complaint: 'Nguoi dung vi pham thoa thuan', farmer: 'Do Minh E', worker: 'Vo Van G', amount: '$100', status: 'Investigating', date: '2024-03-14', severity: 'High' },
    { id: 4, complaint: 'Chat luong cong viec thap', farmer: 'Hoang Thi F', worker: 'Dinh Thi I', amount: '$80', status: 'Resolved', date: '2024-02-28', severity: 'Low' },
    { id: 5, complaint: 'Tranh chap ve so tien luong', farmer: 'Bui Van H', worker: 'Ngo Thi K', amount: '$120', status: 'Pending', date: '2024-03-13', severity: 'High' },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [severityFilter, setSeverityFilter] = useState('All')

  const filteredDisputes = disputes.filter(dispute => {
    const matchSearch = dispute.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       dispute.worker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       dispute.complaint.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'All' || dispute.status === statusFilter
    const matchSeverity = severityFilter === 'All' || dispute.severity === severityFilter
    return matchSearch && matchStatus && matchSeverity
  })

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'High': 'bg-destructive/20 text-destructive',
      'Medium': 'bg-[#D28228]/20 text-[#D28228]',
      'Low': 'bg-[#10B981]/20 text-[#10B981]',
    }
    return colors[severity] ?? 'bg-muted text-muted-foreground'
  }

  const getStatusIcon = (status: string) => {
    if (status === 'Resolved') {
      return <CheckCircle size={18} className="text-green-600" />
    } else if (status === 'Investigating') {
      return <AlertCircle size={18} className="text-[#D28228]" />
    } else {
      return <AlertCircle size={18} className="text-destructive" />
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Resolved': 'bg-green-100 text-green-700',
      'Investigating': 'bg-[#D28228]/20 text-[#D28228]',
      'Pending': 'bg-destructive/20 text-destructive',
    }
    return colors[status] ?? 'bg-muted text-muted-foreground'
  }

  const stats = [
    { label: 'Tranh chap dang cho', value: '2', color: 'bg-destructive/20 text-destructive' },
    { label: 'Dang dieu tra', value: '1', color: 'bg-[#D28228]/20 text-[#D28228]' },
    { label: 'Da giai quyet', value: '2', color: 'bg-green-100 text-green-700' },
  ]

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quan ly tranh chap</h1>
        <p className="text-muted-foreground mt-2">Xu ly khieu nai giua Farmer va Worker</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-card rounded-lg border border-border p-6">
            <p className="text-muted-foreground text-sm">{stat.label}</p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search size={20} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tim kiem theo ten hoac khieu nai..."
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Khieu nai</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Farmer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Worker</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">So tien</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Muc do</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Trang thai</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Ngay</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Hanh dong</th>
              </tr>
            </thead>
            <tbody>
              {filteredDisputes.map((dispute) => (
                <tr key={dispute.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground max-w-xs">{dispute.complaint}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-muted-foreground">{dispute.farmer}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-muted-foreground">{dispute.worker}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{dispute.amount}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(dispute.severity)}`}>
                      {dispute.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(dispute.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(dispute.status)}`}>
                        {dispute.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-muted-foreground text-sm">{dispute.date}</p>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Xem chi tiet">
                      <MessageSquare size={18} className="text-primary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Cac tuy chon giai quyet tranh chap</h2>
        <div className="space-y-3">
          <button className="w-full flex items-center gap-3 p-4 border-2 border-border rounded-lg hover:bg-muted transition-colors">
            <CheckCircle size={20} className="text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-foreground">Hoan tien toan bo cho Farmer</p>
              <p className="text-sm text-muted-foreground">Huy bo giao dich hoan toan</p>
            </div>
          </button>
          <button className="w-full flex items-center gap-3 p-4 border-2 border-border rounded-lg hover:bg-muted transition-colors">
            <CheckCircle size={20} className="text-[#D28228]" />
            <div className="text-left">
              <p className="font-semibold text-foreground">Thanh toan mot phan</p>
              <p className="text-sm text-muted-foreground">Chia se tai chinh giua hai ben</p>
            </div>
          </button>
          <button className="w-full flex items-center gap-3 p-4 border-2 border-border rounded-lg hover:bg-muted transition-colors">
            <CheckCircle size={20} className="text-primary" />
            <div className="text-left">
              <p className="font-semibold text-foreground">Tu choi yeu cau</p>
              <p className="text-sm text-muted-foreground">Giu nguyen giao dich hien tai</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
