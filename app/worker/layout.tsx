"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Briefcase, Wallet, User, Menu, LogOut, Bell, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { icon: Home, label: "Trang chu", href: "/worker/home" },
    { icon: Briefcase, label: "Viec cua toi", href: "/worker/my-jobs" },
    { icon: Wallet, label: "Vi tien", href: "/worker/wallet" },
    { icon: User, label: "Ho so", href: "/worker/profile" },
  ]

  return (
    <div className="min-h-screen bg-agro-cream">
      {/* Top Header - Web Style */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/worker/home" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-agro-green flex items-center justify-center">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-agro-green">AgroTemp</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`gap-2 ${isActive ? "bg-agro-orange text-white hover:bg-agro-orange-dark" : "text-foreground hover:bg-agro-cream"}`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
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
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-agro-orange text-white">NV</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">Nguyen Van B</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/worker/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Ho so
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/" className="cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Dang xuat
                    </Link>
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
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="bg-agro-orange text-white">NV</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">Nguyen Van B</p>
                        <p className="text-sm text-muted-foreground">Lao dong</p>
                      </div>
                    </div>
                    <nav className="flex flex-col gap-1">
                      {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <Link key={item.href} href={item.href}>
                            <Button
                              variant={isActive ? "default" : "ghost"}
                              className={`w-full justify-start gap-3 ${isActive ? "bg-agro-orange text-white" : ""}`}
                            >
                              <item.icon className="h-5 w-5" />
                              {item.label}
                            </Button>
                          </Link>
                        )
                      })}
                    </nav>
                    <div className="mt-auto pt-4 border-t">
                      <Link href="/">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive">
                          <LogOut className="h-5 w-5" />
                          Dang xuat
                        </Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
