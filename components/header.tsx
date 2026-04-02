"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Settings, LogOut, Leaf, User } from "lucide-react";
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
  const [isScrolled, setIsScrolled] = useState(false);
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <header 
      className={`fixed top-0 z-[60] w-full transition-all duration-500 ${
        isScrolled 
          ? "bg-white/80 backdrop-blur-lg shadow-sm py-2 border-b border-agro-green/10" 
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
            <img
              src="/logo.png"
              alt="AgroTemp Logo"
              className="h-7 w-7 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className={`text-xl font-bold leading-none transition-colors duration-300 ${isScrolled ? "text-agro-green" : "text-white"}`}>
              AgroTemp
            </span>
            <span className={`text-[10px] font-medium uppercase tracking-[0.2em] transition-colors duration-300 ${isScrolled ? "text-muted-foreground" : "text-white/60"}`}>
              Agriculture Digital
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative text-sm font-semibold transition-colors duration-300 ${
                isScrolled ? "text-foreground/80 hover:text-agro-green" : "text-white/90 hover:text-white"
              }`}
            >
              {item.label}
              <span className={`absolute -bottom-1 left-0 h-0.5 w-0 bg-agro-orange transition-all duration-300 group-hover:w-full`}></span>
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden items-center gap-4 md:flex">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link href="/farmer/dashboard">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`gap-2 rounded-full font-medium transition-all ${
                    isScrolled 
                      ? "text-agro-green hover:bg-agro-green/10 hover:text-agro-green" 
                      : "text-white hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Leaf className="h-4 w-4" />
                  Cổng Nông dân
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1 pr-3 backdrop-blur-md outline-none transition-all hover:bg-white/20 hover:border-white/40">
                    <Avatar className="h-8 w-8 border border-white/40 group-hover:scale-105 transition-transform">
                      <AvatarImage src={profile?.avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback className="bg-agro-green text-white">
                        {profile?.contactName?.charAt(0).toUpperCase() || "NA"}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`text-sm font-semibold ${isScrolled ? "text-foreground" : "text-white"}`}>
                      {profile?.contactName || "Nông dân"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-agro-green/10">
                  <div className="px-4 py-3 mb-2 bg-agro-green/5 rounded-xl">
                    <p className="text-xs font-semibold text-agro-green uppercase tracking-wider">Tài khoản</p>
                    <p className="text-sm font-bold truncate">{profile?.contactName || "Nông dân"}</p>
                  </div>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/farmer/settings">
                      <Settings className="h-4 w-4 mr-2 text-agro-green" />
                      Cài đặt cá nhân
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`font-semibold rounded-full px-6 transition-all ${
                    isScrolled ? "text-foreground hover:bg-gray-100" : "text-white hover:bg-white/10"
                  }`}
                >
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/auth/register?type=farmer">
                <Button
                  size="sm"
                  className="bg-agro-orange hover:bg-agro-orange-dark text-white font-bold rounded-full px-6 shadow-lg shadow-agro-orange/25 transition-all hover:-translate-y-0.5"
                >
                  Bắt đầu ngay
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all md:hidden ${
            isScrolled ? "bg-agro-green/10 text-agro-green" : "bg-white/10 text-white backdrop-blur-md"
          }`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="animate-reveal-up fixed inset-0 top-0 z-[50] flex flex-col bg-white p-6 pt-24 md:hidden">
          <div className="flex flex-col gap-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Menu</p>
            {navItems.map((item, idx) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ animationDelay: `${idx * 0.1}s` }}
                className="animate-reveal-left text-2xl font-bold text-foreground transition-colors hover:text-agro-green"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            <div className="mt-8 flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <Link href="/farmer/dashboard">
                    <Button className="w-full h-12 bg-agro-green text-white font-bold rounded-2xl">
                      Cổng Nông dân
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full h-12 border-destructive text-destructive font-bold rounded-2xl"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="w-full">
                    <Button variant="outline" className="w-full h-12 border-agro-green text-agro-green font-bold rounded-2xl">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href="/auth/register?type=farmer" className="w-full">
                    <Button className="w-full h-12 bg-agro-orange hover:bg-agro-orange-dark text-white font-bold rounded-2xl shadow-lg shadow-agro-orange/20">
                      Đăng ký ngay
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="mt-auto pb-4 text-center">
            <p className="text-sm text-muted-foreground italic">"Nâng tầm nông nghiệp Việt"</p>
          </div>
        </div>
      )}
    </header>
  );
}
