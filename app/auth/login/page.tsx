"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import { farmerService } from "@/libs/api/services/farmer.service";
import { useToast } from "@/hooks/use-toast";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { handleAuthError } from "@/libs/utils/error-handler";
import { useAuth } from "@/libs/stores/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Farmer login state
  const [farmerEmail, setFarmerEmail] = useState("");
  const [farmerPassword, setFarmerPassword] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyRegister({
        email: farmerEmail,
        otp: otp
      });

      toast({
        title: "Thành công",
        description: "Xác thực tài khoản thành công! Vui lòng đăng nhập lại.",
        variant: "default",
      });

      setIsVerifying(false);
      setOtp("");
      setIsLoading(false);
    } catch (error: any) {
      toast({
        title: "Lỗi xác thực",
        description: "Mã OTP không chính xác hoặc đã hết hạn",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    try {
      await authService.resendOTP(farmerEmail);
      toast({
        title: "Thành công",
        description: "Mã OTP mới đã được gửi đến email của bạn.",
      });
      setCountdown(60);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lấy lại mã OTP. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };

  const normalizeRole = (role: string | undefined): "admin" | "farmer" | "worker" | null => {
    const normalized = String(role || "").trim().toLowerCase();

    if (normalized === "admin") return "admin";
    if (normalized === "farmer") return "farmer";
    if (normalized === "worker") return "worker";

    return null;
  };

  const handleFarmerLogin = async (e: React.FormEvent, isAutoLogin = false) => {
    e?.preventDefault?.();
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

        if (userData.isVerified === false) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user_email");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");

          if (!isAutoLogin) {
            toast({
              title: "Tài khoản chưa xác thực",
              description: "Hệ thống đã tự động gửi mã OTP mới đến email của bạn. Vui lòng xác thực.",
            });

            // Automatically resend OTP
            try {
              await authService.resendOTP(farmerEmail);
              setCountdown(60);
              setIsVerifying(true);
            } catch (err) {
              toast({
                title: "Lỗi",
                description: "Không thể gửi lại mã OTP. Vui lòng chờ và thử lại.",
                variant: "destructive",
              });
            }
          }
          return;
        }

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
          userId: userData.userId || userData.id || '',
          email: userData.email || farmerEmail,
          fullName: userData.fullName || userData.email || '',
          role,
        };

        // Update auth context
        login(user, accessToken, refreshToken, (userData as any).expiresAt);

        toast({
          title: "Thành công",
          description: "Đăng nhập thành công. Đang kiểm tra thông tin...",
          variant: "default",
        });

        try {
          if (role === "farmer") {
            const profileRes = await farmerService.getProfile();
            const profile = profileRes.data;
            if (!profile?.contactName && !profile?.address) {
              router.push("/farmer/setup-profile");
              return;
            }
          }
        } catch (profileError: any) {
          const statusCode = profileError?.response?.status;
          const backendMessage = profileError?.response?.data?.message;
          const isProfileMissing =
            statusCode === 500 &&
            typeof backendMessage === "string" &&
            backendMessage.toLowerCase().includes("farmer profile not found");

          if (isProfileMissing || statusCode === 404) {
            router.push("/farmer/setup-profile");
            return;
          }
        }

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

      const isNotVerified = error?.response?.status === 403 &&
        (error?.response?.data?.message?.toLowerCase().includes("not verified") ||
          error?.response?.data?.error?.toLowerCase().includes("not verified"));

      if (isNotVerified) {
        if (!isAutoLogin) {
          toast({
            title: "Tài khoản chưa xác thực",
            description: "Hệ thống đã tự động gửi mã OTP mới đến email của bạn. Vui lòng xác thực.",
            variant: "destructive",
          });

          // Automatically resend OTP
          try {
            await authService.resendOTP(farmerEmail);
            setCountdown(60);
            setIsVerifying(true);
          } catch (err) {
            toast({
              title: "Lỗi",
              description: "Không thể gửi lại mã OTP. Vui lòng chờ và thử lại.",
              variant: "destructive",
            });
          }
        }
        return;
      }

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
              {isVerifying ? "Xác thực tài khoản" : "Đăng nhập"}
            </CardTitle>
            <CardDescription>{isVerifying ? "Vui lòng nhập mã OTP đã được gửi đến email của bạn" : "Đăng nhập dành cho Nông dân"}</CardDescription>
          </CardHeader>

          <CardContent>
            {isVerifying ? (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Mã OTP</Label>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    placeholder="Nhập mã OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="border-agro-green/30 focus:border-agro-green text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-agro-green hover:bg-agro-green-dark text-white"
                    disabled={isLoading || !otp}
                  >
                    {isLoading ? "Đang xác thực..." : "Xác thực"}
                  </Button>

                  <div className="text-center mt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Chưa nhận được mã?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResendOTP}
                      disabled={countdown > 0}
                      className="w-full"
                    >
                      {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setIsVerifying(false); setIsLoading(false); }}
                      className="w-full mt-2"
                    >
                      Quay lại đăng nhập
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
