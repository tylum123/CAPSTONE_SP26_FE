"use client";

import {
  Users,
  Briefcase,
  DollarSign,
  AlertCircle,
  Settings,
  Home,
} from "lucide-react";

interface AdminSidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function AdminSidebar({ currentPage, onPageChange }: AdminSidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "users", label: "Quản lý người dùng", icon: Users },
    { id: "jobs", label: "Quản lý công việc", icon: Briefcase },
    { id: "transactions", label: "Giao dịch & Ví", icon: DollarSign },
    { id: "disputes", label: "Tranh chấp", icon: AlertCircle },
    { id: "config", label: "Cấu hình hệ thống", icon: Settings },
  ];

  return (
    <aside className="relative w-64 bg-[#3A8250] text-white border-r border-[#2D6641] flex flex-col">
      <div className="p-6 border-b border-[#2D6641]">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-[#28683C] flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="font-bold text-lg">AgroTemp</h1>
            <p className="text-xs text-white/70">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#28683C] text-white"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#2D6641]">
        <div className="bg-white/10 rounded-lg p-3">
          <p className="text-xs text-white/70 mb-2">Phiên bản hệ thống</p>
          <p className="font-semibold text-sm">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
