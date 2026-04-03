"use client";

import type React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  Wallet,
  Settings,
  Bell,
  LogOut,
  Menu,
  Leaf,
  MessageCircle,
  Loader2,
  Home,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { farmerService, authService, notificationService } from "@/libs/api/services"
import type { FarmerProfile } from "@/libs/types"
import type { NotificationDTO } from "@/libs/types/notifications.types";
import { useAuth } from "@/libs/stores/auth.store";
import { AnimatedBubbles } from "@/components/farmer/animated-bubbles";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [isProfileMissing, setIsProfileMissing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getAll({ pageNumber: 1, pageSize: 99 });
      // The actual array is likely nested under res.data.data
      const data: NotificationDTO[] = res.data?.data ?? [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore notification fetch errors
      setNotifications([]); // Ensure state is an array on error
    }
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
    } catch {
      // ignore
    }
  };

  const handleDeleteNotif = async (id: string) => {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Tổng quan", href: "/farmer/dashboard" },
    { icon: Leaf, label: "Bài đăng", href: "/farmer/jobs" },
    { icon: PlusCircle, label: "Đăng tin", href: "/farmer/create-job" },
    { icon: MessageCircle, label: "Tin nhắn", href: "/farmer/messages" },
    { icon: Wallet, label: "Thanh toán", href: "/farmer/payments" },
  ];
  const [profile, setProfile] = useState<FarmerProfile | null>(null)

  // Auth gate - redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch notifications on mount and poll every 60s
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) return;

      setCheckingProfile(true);
      try {
        const response = await farmerService.getProfile();
        setProfile(response.data);
        // Also check if any requisite fields are missing 
        if (!response.data?.contactName && !response.data?.address) {
          setIsProfileMissing(true);
          if (!pathname.startsWith("/farmer/setup-profile")) {
            router.replace("/farmer/setup-profile");
          }
        } else {
          setIsProfileMissing(false);
        }
      } catch (error: any) {
        const statusCode = error?.response?.status;
        const backendMessage = error?.response?.data?.message;

        const profileNotFound = (statusCode === 500 && typeof backendMessage === "string" && backendMessage.toLowerCase().includes("farmer profile not found")) || statusCode === 404;

        if (profileNotFound) {
          setIsProfileMissing(true);
          setProfile(null);

          // Force users with missing profile to complete settings first.
          if (!pathname.startsWith("/farmer/setup-profile")) {
            router.replace("/farmer/setup-profile");
          }
        } else {
          console.error("Failed to fetch farmer profile:", error);
        }
      } finally {
        setCheckingProfile(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, pathname, router]);

  useEffect(() => {
    if (isAuthenticated && isProfileMissing && !pathname.startsWith("/farmer/setup-profile")) {
      router.replace("/farmer/setup-profile");
    }
  }, [isAuthenticated, isProfileMissing, pathname, router]);

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      // ignore API errors — still clear local state
    } finally {
      logout()
      router.push("/auth/login")
    }
  };

  // Show loading state while checking authentication
  if (isLoading || checkingProfile) {
    return (
      <div className="min-h-screen bg-agro-cream flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-agro-green" />
      </div>
    );
  }

  // Don't render if not authenticated (redirect will happen in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-agro-cream relative">
      <AnimatedBubbles />
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/farmer/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="AgroTemp Logo"
                  className="h-10 w-10 object-contain"
                />
              </div>
              <span className="text-xl font-bold text-agro-green">AgroTemp</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = item.href === "/farmer"
                  ? pathname === "/farmer"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`gap-2 ${isActive
                        ? "bg-agro-green text-white hover:bg-agro-green-dark"
                        : "text-foreground hover:bg-gray-200"
                        }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side - Notifications & Profile */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setNotifOpen((prev) => !prev)}
                  aria-label="Thông báo"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-agro-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notification Dropdown Panel */}
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <span className="font-semibold text-sm">Thông báo</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-agro-green hover:underline font-medium"
                        >
                          Đánh dấu tất cả đã đọc
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          Không có thông báo nào
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`flex gap-3 px-4 py-3 hover:bg-muted/40 transition-colors ${!notif.isRead ? "bg-agro-green/5" : ""
                              }`}
                          >
                            {/* Unread dot */}
                            <span
                              className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${!notif.isRead ? "bg-agro-orange" : "bg-transparent"
                                }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-snug truncate">{notif.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[11px] text-muted-foreground">
                                  {new Date(notif.sentAt).toLocaleString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {!notif.isRead && (
                                  <button
                                    onClick={() => handleMarkRead(notif.id)}
                                    className="text-[11px] text-agro-green hover:underline"
                                  >
                                    Đánh dấu đã đọc
                                  </button>
                                )}
                              </div>
                            </div>
                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteNotif(notif.id)}
                              className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors text-xs mt-1"
                              aria-label="Xoá thông báo"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hidden md:flex">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback className="bg-agro-green text-white">
                        {profile?.contactName?.charAt(0).toUpperCase() || "NA"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{profile?.contactName || 'Nông dân'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/farmer/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Cài đặt
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/" className="cursor-pointer">
                      <Leaf className="h-4 w-4 mr-2" />
                      Về trang chủ
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <span className="flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      Đăng xuất
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <div className="flex flex-col gap-4 mt-8">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile?.avatarUrl || "/placeholder.svg"} />
                        <AvatarFallback className="bg-agro-green text-white">
                          {profile?.contactName?.charAt(0).toUpperCase() || "NA"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{profile?.contactName || 'Null'}</p>
                        <p className="text-sm text-muted-foreground">Nông dân</p>
                      </div>
                    </div>
                    <nav className="flex flex-col gap-1">
                      {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link key={item.href} href={item.href}>
                            <Button
                              variant={isActive ? "default" : "ghost"}
                              className={`w-full justify-start gap-3 ${isActive ? "bg-agro-green text-white" : ""
                                }`}
                            >
                              <item.icon className="h-5 w-5" />
                              {item.label}
                            </Button>
                          </Link>
                        );
                      })}
                    </nav>
                    <div className="mt-auto pt-4 border-t">
                      <Link href="/">
                        <Button variant="ghost" className="w-full justify-start gap-3">
                          <Leaf className="h-5 w-5" />
                          Về trang chủ
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-destructive"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5" />
                        Đăng xuất
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 lg:px-8 py-6">{children}</main>
    </div>
  );
}
