"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const { isAuthenticated } = useAuth();

  const navItems = [
    { label: language === "vi" ? "Giới thiệu" : "About", href: "#about" },
    { label: language === "vi" ? "Tính năng" : "Features", href: "#features" },
    { label: language === "vi" ? "Hướng dẫn" : "Guide", href: "#how-it-works" },
    { label: language === "vi" ? "Liên hệ" : "Contact", href: "#contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-agro-green/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-agro-green">
            <svg
              className="h-6 w-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L4 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-8-5zm0 15.5l-5-3v-6l5-3 5 3v6l-5 3z" />
            </svg>
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
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                {language === "vi" ? "VI" : "EN"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setLanguage("vi")}>
                Tiếng Việt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("en")}>
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Portal Navigation - Only show when logged in */}
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Menu className="h-4 w-4" />
                  {language === "vi" ? "Cổng thông tin" : "Portals"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/farmer" className="cursor-pointer">
                    {language === "vi" ? "Cổng Nông dân" : "Farmer Portal"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/worker/home" className="cursor-pointer">
                    {language === "vi" ? "Cổng Lao động" : "Worker Portal"}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Download App Button */}
          <Link href="/worker/home">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-agro-green text-agro-green hover:bg-agro-green hover:text-white bg-transparent"
            >
              <Smartphone className="h-4 w-4" />
              {language === "vi" ? "Tải App Worker" : "Download Worker App"}
            </Button>
          </Link>

          {/* Farmer Login Button */}
          <Link href="/auth/login">
            <Button
              size="sm"
              className="bg-agro-green hover:bg-agro-green-dark text-white"
            >
              {language === "vi" ? "Đăng nhập Nông dân" : "Farmer Login"}
            </Button>
          </Link>
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
              <Link href="/worker/home">
                <Button
                  variant="outline"
                  className="w-full gap-2 border-agro-green text-agro-green bg-transparent"
                >
                  <Smartphone className="h-4 w-4" />
                  {language === "vi" ? "Tải App Worker" : "Download Worker App"}
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button className="w-full bg-agro-green text-white hover:bg-agro-green-dark">
                  {language === "vi" ? "Đăng nhập Nông dân" : "Farmer Login"}
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
