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
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { authService } from "@/libs/api/services/auth.service";
import { useToast } from "@/hooks/use-toast";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { handleAuthError } from "@/libs/utils/error-handler";
import { useAuth } from "@/stores/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Farmer login state
  const [farmerEmail, setFarmerEmail] = useState("");
  const [farmerPassword, setFarmerPassword] = useState("");

  const normalizeRole = (role: string | undefined): "admin" | "farmer" | "worker" | null => {
    const normalized = String(role || "").trim().toLowerCase();

    if (normalized === "admin") return "admin";
    if (normalized === "farmer") return "farmer";
    if (normalized === "worker") return "worker";

    return null;
  };

  const handleFarmerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.login({
        email: farmerEmail,
        password: farmerPassword,
      });

      if (response.status_code === 200 || response.status_code === 0) {
        // Extract user data and tokens from response
        const userData = response.data as typeof response.data & {
          id?: string;
          fullName?: string;
          refresh_token?: string;
        };
        const accessToken = userData.token || '';
        const refreshToken = userData.refresh_token || '';
        const role = normalizeRole(userData.role);

        if (!role) {
          toast({
            title: "Đăng nhập thất bại",
            description: "Không xác định được vai trò tài khoản",
            variant: "destructive",
          });
          return;
        }

        if (role === "worker") {
          toast({
            title: "Thông báo",
            description: "Vui lòng chuyển sang ứng dụng điện thoại AgroTemp nếu bạn là người tìm việc.",
            variant: "default",
          });

          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");

          return;
        }
        
        // Create user object for auth context
        const user = {
          id: userData.id || '',
          email: userData.email || farmerEmail,
          fullName: userData.fullName || userData.email || '',
          role,
        };

        // Update auth context
        login(user, accessToken, refreshToken);

        toast({
          title: "Thành công",
          description: response.message || "Đăng nhập thành công. Đang chuyển hướng...",
          variant: "default",
        });
        
        // Redirect by role after a short delay
        setTimeout(() => {
          router.push(role === "admin" ? "/admin" : "/farmer/dashboard");
        }, 1000);
      } else {
        // Handle error response from API
        const errorMessage = handleAuthError({ response: { data: response } });
        toast({
          title: "Đăng nhập thất bại",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      // Handle network errors or unexpected errors
      console.error("Login error:", error);
      const errorMessage = handleAuthError(error);
      toast({
        title: "Đăng nhập thất bại",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-agro-cream via-white to-agro-green/5 flex items-center justify-center p-4">
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
              <div className="flex h-16 w-16 items-center justify-center rounded-full">
                <img
                  src="/logo.png"
                  alt="AgroTemp Logo"
                  className="h-10 w-10 object-contain"
                />
              </div>
            </div>
            <CardTitle className="text-2xl text-agro-green">
              Đăng nhập
            </CardTitle>
            <CardDescription>Đăng nhập dành cho Nông dân</CardDescription>
          </CardHeader>

          <CardContent>
            <div>
                <form onSubmit={handleFarmerLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="farmer-email">Email</Label>
                    <Input
                      id="farmer-email"
                      name="email"
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
                        name="password"
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
                        name="remember"
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
                    disabled={isLoading}
                  >
                    {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </Button>
                  
                  <GoogleLoginButton roleId={3} showDivider />

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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
