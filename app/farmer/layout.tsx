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
  PersonStandingIcon,
  ChevronLeft,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { farmerService, authService, notificationService } from "@/libs/api/services"
import type { FarmerProfile } from "@/libs/types"
import type { NotificationDTO } from "@/libs/types/notifications.types";
import { useAuth } from "@/libs/stores/auth.store";
import { AnimatedBubbles } from "@/components/farmer/animated-bubbles";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignalRProvider } from "@/contexts/signalr-context";

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
  const [notifPage, setNotifPage] = useState(1);
  const [notifTotalPages, setNotifTotalPages] = useState(1);
  const NOTIF_PAGE_SIZE = 4;
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getAll({ pageNumber: notifPage, pageSize: NOTIF_PAGE_SIZE });
      const payload = res.data;

      if (Array.isArray(payload)) {
        setNotifications(payload);
        setNotifTotalPages(1);
      } else {
        const paginated = payload as any;
        setNotifications(paginated?.data ?? []);
        setNotifTotalPages(paginated?.pagination?.totalPages || 1);
      }
    } catch {
      setNotifications([]);
    }
  }, [notifPage]);

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
    // { icon: PersonStandingIcon, label: "Ứng viên", href: "/farmer/applications" },
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
        } else {
          setIsProfileMissing(false);
          console.error("Failed to fetch farmer profile:", error);
        }
      } finally {
        setCheckingProfile(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, pathname]);

  useEffect(() => {
    const justCompletedSetup = typeof window !== "undefined" && sessionStorage.getItem("profile_setup_completed") === "1";
    if (justCompletedSetup) {
      sessionStorage.removeItem("profile_setup_completed");
      return;
    }

    if (!checkingProfile && isAuthenticated && isProfileMissing && !pathname.startsWith("/farmer/setup-profile")) {
      router.replace("/farmer/setup-profile");
    }
  }, [checkingProfile, isAuthenticated, isProfileMissing, pathname, router]);

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

  // Show loading state only during initial auth check
  // NOTE: We no longer block on checkingProfile to avoid unmounting
  // SignalRProvider (and killing the real-time connection) on navigation.
  if (isLoading) {
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
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 lg:gap-3 xl:gap-6">
            {/* Logo */}
            <Link href="/farmer/dashboard" className="flex items-center gap-2 justify-self-start">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="AgroTemp Logo"
                  className="h-10 w-10 object-contain"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex justify-center">
              <nav className="flex items-center gap-4 rounded-full border border-border/70 bg-background/70 p-1 shadow-sm">
                {navItems.map((item) => {
                  const isActive = item.href === "/farmer"
                    ? pathname === "/farmer"
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`h-9 rounded-full px-3 gap-2 ${isActive
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
            </div>
            {/* Right Side - Notifications & Profile */}
            <div className="flex items-center justify-self-end gap-2 lg:gap-3">
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
                    <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 bg-agro-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notification Dropdown Panel */}
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-agro-green">Thông báo</span>
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border rounded-md px-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-agro-green/10"
                            onClick={() => setNotifPage((p) => Math.max(1, p - 1))}
                            disabled={notifPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-[10px] font-bold min-w-8 text-center">
                            {notifPage}/{notifTotalPages}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-agro-green/10"
                            onClick={() => setNotifPage((p) => Math.min(notifTotalPages, p + 1))}
                            disabled={notifPage === notifTotalPages || notifTotalPages === 0}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-agro-green hover:text-agro-green-dark hover:underline font-bold"
                        >
                          Đọc tất cả
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-100 overflow-y-auto divide-y divide-border">
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
                              className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${!notif.isRead ? "bg-agro-orange" : "bg-transparent"
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
                              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors text-xs mt-1"
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
                  <Button variant="ghost" className="gap-2 hidden xl:flex">
                    <Avatar className="h-10 w-10 border-2 border-agro-white relative flex items-center justify-center">
                      <AvatarImage src={profile?.avatarUrl || "/placeholder.svg"} className="object-cover" />
                      <AvatarFallback className="bg-agro-green text-white">
                        {profile?.contactName?.charAt(0).toUpperCase() || "NA"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{profile?.contactName || 'Nông dân'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/farmer/profile" className="cursor-pointer">
                      <UserCircle className="h-4 w-4 mr-2" />
                      Hồ sơ
                    </Link>
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem asChild>
                    <Link href="/farmer/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Cài đặt
                    </Link>
                  </DropdownMenuItem> */}
                  
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
                <SheetTrigger asChild className="xl:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[88vw] max-w-sm p-0">
                  <div className="flex h-full flex-col">
                    <div className="px-5 pt-8 pb-5 border-b bg-linear-to-b from-muted/30 to-transparent">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14 ring-2 ring-agro-green/10">
                          <AvatarImage src={profile?.avatarUrl || "/placeholder.svg"} className="object-cover" />
                          <AvatarFallback className="bg-agro-green text-white text-base font-semibold">
                            {profile?.contactName?.charAt(0).toUpperCase() || "ND"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-xl truncate">{profile?.contactName || "Nông dân"}</p>
                          <p className="text-sm text-muted-foreground">Nông dân</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4">
                      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Điều hướng
                      </p>
                      <nav className="flex flex-col gap-1.5">
                        {navItems.map((item) => {
                          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                          return (
                            <Link key={item.href} href={item.href}>
                              <Button
                                variant="ghost"
                                className={`h-12 w-full justify-start rounded-xl px-3 gap-3 text-base ${
                                  isActive
                                    ? "bg-agro-green text-white hover:bg-agro-green-dark hover:text-white"
                                    : "hover:bg-muted"
                                }`}
                              >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                              </Button>
                            </Link>
                          );
                        })}
                      </nav>

                      <div className="mt-5 border-t pt-4">
                        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Tài khoản
                        </p>
                        <div className="flex flex-col gap-1.5">
                          <Link href="/farmer/settings">
                            <Button variant="ghost" className="h-12 w-full justify-start rounded-xl px-3 gap-3 text-base hover:bg-muted">
                              <Settings className="h-5 w-5" />
                              Cài đặt
                            </Button>
                          </Link>
                          <Link href="/farmer/profile">
                            <Button variant="ghost" className="h-12 w-full justify-start rounded-xl px-3 gap-3 text-base hover:bg-muted">
                              <UserCircle className="h-5 w-5" />
                              Hồ sơ
                            </Button>
                          </Link>
                          <Link href="/">
                            <Button variant="ghost" className="h-12 w-full justify-start rounded-xl px-3 gap-3 text-base hover:bg-muted">
                              <Leaf className="h-5 w-5" />
                              Về trang chủ
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="border-t p-4 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">
                      <Button
                        variant="ghost"
                        className="h-12 w-full justify-start rounded-xl px-3 gap-3 text-base text-destructive hover:text-destructive hover:bg-destructive/10"
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
      <main className="relative z-10 container mx-auto px-4 lg:px-8 py-6">
        <SignalRProvider>{children}</SignalRProvider>
      </main>
    </div>
  );
}
