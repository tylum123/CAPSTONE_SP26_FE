"use client";

import {
  Users,
  Briefcase,
  DollarSign,
  AlertCircle,
  Settings,
  Home,
  LogOut,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/libs/stores/auth.store";
import { authService } from "@/libs/api";

interface AdminSidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function AdminSidebar({ currentPage, onPageChange }: AdminSidebarProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout API error", err);
    } finally {
      logout();
      router.push("/auth/login");
    }
  };
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "users", label: "Quản lý người dùng", icon: Users },
    { id: "jobs", label: "Quản lý công việc", icon: Briefcase },
    { id: "transactions", label: "Giao dịch & Ví", icon: DollarSign },
    { id: "disputes", label: "Tranh chấp", icon: AlertCircle },
    { id: "skills", label: "Quản lý kỹ năng", icon: Zap },
    // { id: "config", label: "Cấu hình hệ thống", icon: Settings },
  ];

  return (
    <aside className="relative w-64 bg-[#3A8250] text-white border-r border-[#2D6641] flex flex-col">
      <div className="p-6 border-b border-[#2D6641]">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img
              src="/logo.png"
              alt="AgroTemp Logo"
              className="h-7 w-7 object-contain"
            />
            {/* <span className="text-white font-bold text-lg">A</span> */}
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
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-white/10"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
