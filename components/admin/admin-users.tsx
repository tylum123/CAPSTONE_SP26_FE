'use client'

import { Search, Lock, Unlock, Trash2, Eye } from 'lucide-react'
import { useState } from 'react'

export function AdminUsers() {
  const [users] = useState([
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@email.com', role: 'Farmer', status: 'Active', rating: 4.8, joinDate: '2024-01-15' },
    { id: 2, name: 'Trần Thị B', email: 'tranthib@email.com', role: 'Worker', status: 'Active', rating: 4.5, joinDate: '2024-02-20' },
    { id: 3, name: 'Lê Văn C', email: 'levanc@email.com', role: 'Farmer', status: 'Blocked', rating: 2.1, joinDate: '2024-01-10' },
    { id: 4, name: 'Phạm Thị D', email: 'phamthid@email.com', role: 'Worker', status: 'Active', rating: 4.9, joinDate: '2024-03-05' },
    { id: 5, name: 'Đỗ Minh E', email: 'dominhe@email.com', role: 'Farmer', status: 'Active', rating: 4.2, joinDate: '2024-02-12' },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredUsers = users.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = roleFilter === 'All' || user.role === roleFilter
    const matchStatus = statusFilter === 'All' || user.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quản lý người dùng</h1>
        <p className="text-muted-foreground mt-2">Quản lý tài khoản Farmer và Worker</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search size={20} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-card text-foreground"
        >
          <option>All</option>
          <option>Farmer</option>
          <option>Worker</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-card text-foreground"
        >
          <option>All</option>
          <option>Active</option>
          <option>Blocked</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Người dùng</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Vai trò</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Trạng thái</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Đánh giá</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Ngày tham gia</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{user.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'Farmer' ? 'bg-primary/20 text-primary' : 'bg-[#10B981]/20 text-[#10B981]'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-destructive/20 text-destructive'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">⭐ {user.rating}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-muted-foreground text-sm">{user.joinDate}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Xem chi tiết">
                        <Eye size={18} className="text-primary" />
                      </button>
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Khóa/Mở khóa">
                        {user.status === 'Active' ? (
                          <Lock size={18} className="text-[#D28228]" />
                        ) : (
                          <Unlock size={18} className="text-[#10B981]" />
                        )}
                      </button>
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Xóa">
                        <Trash2 size={18} className="text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm">Tổng người dùng</p>
          <p className="text-3xl font-bold text-foreground mt-2">2,547</p>
          <p className="text-sm text-green-600 mt-2">+5% so với tháng trước</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm">Hoạt động</p>
          <p className="text-3xl font-bold text-foreground mt-2">2,341</p>
          <p className="text-sm text-green-600 mt-2">91.9% tỷ lệ hoạt động</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm">Đã khóa</p>
          <p className="text-3xl font-bold text-destructive mt-2">206</p>
          <p className="text-sm text-muted-foreground mt-2">8.1% tỷ lệ khóa</p>
        </div>
      </div>
    </div>
  )
}
