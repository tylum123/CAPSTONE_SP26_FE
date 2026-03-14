"use client";

import type React from "react";

import { useState, Suspense } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { authService } from "@/libs/api/services/auth.service";
import { useToast } from "@/hooks/use-toast";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { handleRegistrationError } from "@/libs/utils/error-handler";
import { useAuth } from "@/stores/auth.store";

function RegisterContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Lỗi",
        description: "Email không hợp lệ",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register({
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        roleId: 2,
      });

      const isSuccess =
        response.status_code === 0 ||
        response.status_code === 200 ||
        response.status_code === 201 ||
        Boolean(response.data?.token);

      if (!isSuccess) {
        const errorMessage = handleRegistrationError({ response: { data: response } });
        toast({
          title: "❌ Đăng ký thất bại",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (response.data?.token) {
        localStorage.setItem("access_token", response.data.token);
        localStorage.setItem("user_email", response.data.email);
        localStorage.setItem("token_expires_at", response.data.expiresAt);

        // Create user object for auth context
        const user = {
          id: response.data.id || '',
          email: response.data.email || formData.email,
          fullName: response.data.fullName || '',
          role: 'farmer' as const,
        };

        // Update auth context to auto-login user after registration
        login(user, response.data.token, response.data.refresh_token || '');
      }

      toast({
        title: "Success",
        description: response.message || "Đăng ký thành công! Đang chuyển hướng...",
        variant: "default",
      });

      setTimeout(() => {
        router.push("/farmer/dashboard");
      }, 1000);
    } catch (error: any) {
      const errorMessage = handleRegistrationError(error);
      toast({
        title: "❌ Đăng ký thất bại",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
              <div className="flex h-16 w-16 items-center justify-center rounded-full">
                <img
                  src="/logo.png"
                  alt="AgroTemp Logo"
                  className="h-10 w-10 object-contain"
                />
              </div>
            </div>
            <CardTitle className="text-2xl text-agro-green">
              Đăng ký
            </CardTitle>
            <CardDescription>Đăng ký dành cho Nông dân</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  className="border-agro-green/30 focus:border-agro-green"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <Input
                  id="phoneNumber"
                  name="tel"
                  type="tel"
                  placeholder="0912 345 678"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phoneNumber: e.target.value,
                    })
                  }
                  className="border-agro-green/30 focus:border-agro-green"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Số nhà, đường, xã/phường, huyện/quận, tỉnh"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: e.target.value,
                    })
                  }
                  className="border-agro-green/30 focus:border-agro-green min-h-20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tối thiểu 8 ký tự"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        password: e.target.value,
                      })
                    }
                    className="border-agro-green/30 focus:border-agro-green pr-10"
                    required
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="border-agro-green/30 focus:border-agro-green pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-agro-cream rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Bằng việc đăng ký, bạn đồng ý với{" "}
                  <Link
                    href="/terms"
                    className="text-agro-green hover:underline"
                  >
                    Điều khoản sử dụng
                  </Link>{" "}
                  và{" "}
                  <Link
                    href="/privacy"
                    className="text-agro-green hover:underline"
                  >
                    Chính sách bảo mật
                  </Link>{" "}
                  của AgroTemp.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button asChild type="button" variant="outline" className="w-full">
                  <Link href="/auth/login">Hủy</Link>
                </Button>
                <Button
                  type="submit"
                  className="w-full bg-agro-green hover:bg-agro-green-dark text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                </Button>
              </div>

              <GoogleLoginButton roleId={2} showDivider />

              <p className="text-center text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link
                  href="/auth/login"
                  className="text-agro-green hover:underline font-medium"
                >
                  Đăng nhập
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
