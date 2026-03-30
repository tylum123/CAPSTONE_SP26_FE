"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Settings, LogOut, Leaf } from "lucide-react";
import { useAuth } from "@/libs/stores/auth.store";
import { farmerService } from "@/libs/api/services/farmer.service";
import { FarmerProfile } from "@/libs/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

  const navItems = [
    { label: "Giới thiệu", href: "#about" },
    { label: "Tính năng", href: "#features" },
    { label: "Hướng dẫn", href: "#how-it-works" },
    { label: "Liên hệ", href: "#contact" },
  ];

  const handleLogout = () => {
    logout();
    localStorage.clear();
    router.push("/auth/login");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await farmerService.getProfile();
        setProfile(response.data);
      } catch {
        setProfile(null);
      }
    };

    if (isAuthenticated) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [isAuthenticated]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-agro-green/10 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full">
            <img
              src="/logo.png"
              alt="AgroTemp Logo"
              className="h-10 w-10 object-contain"
            />
          </div>
          <span className="text-xl font-bold text-agro-green">AgroTemp</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-agro-green"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Portal Navigation - Only show when logged in */}
          {isAuthenticated && (
            <Link href="/farmer">
              <Button variant="ghost" size="sm" className="gap-2">
                <Menu className="h-4 w-4" />
                Cổng Nông dân
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatarUrl || "/placeholder.svg"} />
                    <AvatarFallback className="bg-agro-green text-white">
                      {profile?.contactName?.charAt(0).toUpperCase() || "NA"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{profile?.contactName || "Nông dân"}</span>
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
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth/register?type=farmer">
                <Button variant="outline" size="sm" className="border-agro-green text-agro-green hover:bg-agro-green/10 cursor-pointer">
                  Đăng ký
                </Button>
              </Link>

              <Link href="/auth/login">
                <Button
                  size="sm"
                  className="bg-agro-green hover:bg-agro-green-dark text-white cursor-pointer"
                >
                  Đăng nhập
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t bg-white md:hidden">
          <nav className="container mx-auto flex flex-col gap-4 px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-foreground/80"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              {isAuthenticated ? (
                <>
                  <Link href="/farmer/settings">
                    <Button variant="outline" className="w-full border-agro-green text-agro-green hover:bg-agro-green/10">
                      Cài đặt tài khoản
                    </Button>
                  </Link>
                  <Button
                    className="w-full bg-agro-green text-white hover:bg-agro-green-dark"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/register?type=farmer">
                    <Button variant="outline" className="w-full border-agro-green text-agro-green hover:bg-agro-green/10">
                      Đăng ký Nông dân
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button className="w-full bg-agro-green text-white hover:bg-agro-green-dark">
                      Đăng nhập Nông dân
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
