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
} from "lucide-react";
import { useEffect, useState } from "react";
import { FarmerProfile, farmerService } from "@/libs/api";
import { useAuth } from "@/stores/auth.store";
import { AnimatedBubbles } from "@/components/farmer/animated-bubbles";

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: "Tổng quan", href: "/farmer/dashboard" },
    { icon: Leaf, label: "Công việc", href: "/farmer/jobs" },
    { icon: PlusCircle, label: "Đăng tin", href: "/farmer/create-job" },
    { icon: MessageCircle, label: "Tin nhắn", href: "/farmer/messages", badge: 3 },
    { icon: Wallet, label: "Thanh toán", href: "/farmer/payments" },
  ];
  const [profile, setProfile] = useState<FarmerProfile | null>(null)

  // Auth gate - redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
      const fetchProfile = async () => {
        try {
          const response = await farmerService.getProfile()
          setProfile(response.data)
        } catch (error) {
          console.error('Failed to fetch farmer profile:', error)
        }
      }
  
      if (isAuthenticated) {
        fetchProfile()
      }
    }, [isAuthenticated])

  const handleLogout = () => {
    logout();
    localStorage.clear();
    router.push("/auth/login");
  };

  // Show loading state while checking authentication
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
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`gap-2 ${
                        isActive
                          ? "bg-agro-green text-white hover:bg-agro-green-dark"
                          : "text-foreground hover:bg-agro-cream"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      {item.badge && item.badge > 0 && (
                        <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side - Notifications & Profile */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-agro-orange rounded-full" />
              </Button>

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
                              className={`w-full justify-start gap-3 ${
                                isActive ? "bg-agro-green text-white" : ""
                              }`}
                            >
                              <item.icon className="h-5 w-5" />
                              {item.label}
                              {item.badge && item.badge > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                  {item.badge}
                                </span>
                              )}
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
