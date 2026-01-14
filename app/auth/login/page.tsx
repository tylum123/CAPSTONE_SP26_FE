"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, Monitor, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<"farmer" | "worker">("farmer");

  // Farmer login state
  const [farmerEmail, setFarmerEmail] = useState("");
  const [farmerPassword, setFarmerPassword] = useState("");

  // Worker login state
  const [workerPhone, setWorkerPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const handleFarmerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/farmer/dashboard");
  };

  const handleWorkerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      setOtpSent(true);
    } else {
      router.push("/worker/home");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-agro-cream via-white to-agro-green/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-agro-green hover:text-agro-green-dark mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>

        <Card className="border-agro-green/20 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-agro-green">
                <svg
                  className="h-10 w-10 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L4 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-8-5zm0 15.5l-5-3v-6l5-3 5 3v6l-5 3z" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl text-agro-green">
              Đăng nhập AgroTemp
            </CardTitle>
            <CardDescription>Chọn loại tài khoản để tiếp tục</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              value={loginType}
              onValueChange={(v) => setLoginType(v as "farmer" | "worker")}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger
                  value="farmer"
                  className="gap-2 data-[state=active]:bg-agro-green data-[state=active]:text-white"
                >
                  <Monitor className="h-4 w-4" />
                  Nông dân
                </TabsTrigger>
                <TabsTrigger
                  value="worker"
                  className="gap-2 data-[state=active]:bg-agro-orange data-[state=active]:text-white"
                >
                  <Smartphone className="h-4 w-4" />
                  Lao động
                </TabsTrigger>
              </TabsList>

              {/* Farmer Login Form */}
              <TabsContent value="farmer">
                <form onSubmit={handleFarmerLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="farmer-email">Email</Label>
                    <Input
                      id="farmer-email"
                      type="email"
                      placeholder="email@example.com"
                      value={farmerEmail}
                      onChange={(e) => setFarmerEmail(e.target.value)}
                      className="border-agro-green/30 focus:border-agro-green"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="farmer-password">Mật khẩu</Label>
                    <div className="relative">
                      <Input
                        id="farmer-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu"
                        value={farmerPassword}
                        onChange={(e) => setFarmerPassword(e.target.value)}
                        className="border-agro-green/30 focus:border-agro-green pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-agro-green/30"
                      />
                      <span>Ghi nhớ đăng nhập</span>
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-agro-green hover:underline"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-agro-green hover:bg-agro-green-dark text-white"
                  >
                    Đăng nhập
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Chưa có tài khoản?{" "}
                    <Link
                      href="/auth/register?type=farmer"
                      className="text-agro-green hover:underline font-medium"
                    >
                      Đăng ký ngay
                    </Link>
                  </p>
                </form>
              </TabsContent>

              {/* Worker Login Form - Phone OTP */}
              <TabsContent value="worker">
                <form onSubmit={handleWorkerLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="worker-phone">Số điện thoại</Label>
                    <Input
                      id="worker-phone"
                      type="tel"
                      placeholder="0912 345 678"
                      value={workerPhone}
                      onChange={(e) => setWorkerPhone(e.target.value)}
                      className="border-agro-orange/30 focus:border-agro-orange"
                      disabled={otpSent}
                    />
                  </div>

                  {otpSent && (
                    <div className="space-y-2">
                      <Label htmlFor="otp">Mã xác thực OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Nhập mã 6 số"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="border-agro-orange/30 focus:border-agro-orange text-center text-2xl tracking-widest"
                        maxLength={6}
                      />
                      <p className="text-sm text-muted-foreground text-center">
                        Mã OTP đã gửi đến {workerPhone}.{" "}
                        <button
                          type="button"
                          className="text-agro-orange hover:underline"
                        >
                          Gửi lại
                        </button>
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-agro-orange hover:bg-agro-orange-dark text-white"
                  >
                    {otpSent ? "Xác nhận đăng nhập" : "Nhận mã OTP"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Chưa có tài khoản?{" "}
                    <Link
                      href="/auth/register?type=worker"
                      className="text-agro-orange hover:underline font-medium"
                    >
                      Đăng ký ngay
                    </Link>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
