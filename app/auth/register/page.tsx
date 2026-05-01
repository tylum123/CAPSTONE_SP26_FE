"use client";

import type React from "react";

import { useState, Suspense, useEffect } from "react";
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
import { useAuth } from "@/libs/stores/auth.store";

function RegisterContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    phoneNumber?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateEmail = (value: string) => {
    const normalizedEmail = value.trim().toLowerCase();
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const [localPart = "", domainPart = ""] = normalizedEmail.split("@");

    if (!normalizedEmail) return "Email là bắt buộc";

    if (
      !emailRegex.test(normalizedEmail) ||
      normalizedEmail.includes("..") ||
      localPart.length > 64 ||
      normalizedEmail.length > 254 ||
      domainPart.startsWith("-") ||
      domainPart.endsWith("-")
    ) {
      return "Email không hợp lệ";
    }

    return undefined;
  };

  const validatePhoneNumber = (value: string) => {
    const normalizedPhone = value.replace(/\D/g, "");
    if (!normalizedPhone) return "Số điện thoại là bắt buộc";
    if (!/^\d{10}$/.test(normalizedPhone)) {
      return "Số điện thoại phải gồm đúng 10 chữ số";
    }
    return undefined;
  };

  const validatePassword = (value: string) => {
    if (!value) return "Mật khẩu là bắt buộc";
    if (value.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
    if (!passwordRegex.test(value)) {
      return "Mật khẩu phải có ít nhất 1 chữ hoa, 1 số và 1 ký tự đặc biệt";
    }

    return undefined;
  };

  const validateConfirmPassword = (password: string, confirmPassword: string) => {
    if (!confirmPassword) return "Vui lòng xác nhận mật khẩu";
    if (password !== confirmPassword) return "Mật khẩu xác nhận không khớp";
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedPhone = formData.phoneNumber.replace(/\D/g, "");

    const nextErrors = {
      email: validateEmail(formData.email),
      phoneNumber: validatePhoneNumber(formData.phoneNumber),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(
        formData.password,
        formData.confirmPassword
      ),
    };

    setFieldErrors(nextErrors);

    const firstError = Object.values(nextErrors).find(Boolean);
    if (firstError) {
      toast({
        title: "Lỗi",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register({
        email: normalizedEmail,
        password: formData.password,
        phoneNumber: normalizedPhone,
        roleId: 2,
      });

      // Successfully registered
      setIsVerifying(true);
      setRegisteredEmail(normalizedEmail);
      setCountdown(60);

      toast({
        title: "Thành công",
        description: "Vui lòng kiểm tra email để nhận mã OTP.",
        variant: "default",
      });

    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Đăng ký thất bại";
      toast({
        title: "Đã có lỗi khi xử lý phiên đăng ký",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        email: registeredEmail,
        otp: otp
      });

      toast({
        title: "Thành công",
        description: "Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.",
        variant: "default",
      });

      router.push("/auth/login");
    } catch (error: any) {
      toast({
        title: "Lỗi xác thực",
        description: "Mã OTP không chính xác hoặc đã hết hạn",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    try {
      await authService.resendOTP(registeredEmail);
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
              {isVerifying ? "Xác thực tài khoản" : "Đăng ký"}
            </CardTitle>
            <CardDescription>
              {isVerifying
                ? "Vui lòng nhập mã OTP đã được gửi đến email của bạn"
                : "Đăng ký dành cho Nông dân"}
            </CardDescription>
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
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      const nextEmail = e.target.value;
                      setFormData({
                        ...formData,
                        email: nextEmail,
                      });
                      setFieldErrors((prev) => ({
                        ...prev,
                        email: validateEmail(nextEmail),
                      }));
                    }}
                    onBlur={() =>
                      setFieldErrors((prev) => ({
                        ...prev,
                        email: validateEmail(formData.email),
                      }))
                    }
                    className={`border-agro-green/30 focus:border-agro-green ${fieldErrors.email ? "border-red-500 focus:border-red-500" : ""
                      }`}
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Số điện thoại</Label>
                  <Input
                    id="phoneNumber"
                    name="tel"
                    type="tel"
                    placeholder="0912 345 678"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const nextPhone = e.target.value;
                      setFormData({
                        ...formData,
                        phoneNumber: nextPhone,
                      });
                      setFieldErrors((prev) => ({
                        ...prev,
                        phoneNumber: validatePhoneNumber(nextPhone),
                      }));
                    }}
                    onBlur={() =>
                      setFieldErrors((prev) => ({
                        ...prev,
                        phoneNumber: validatePhoneNumber(formData.phoneNumber),
                      }))
                    }
                    className={`border-agro-green/30 focus:border-agro-green ${fieldErrors.phoneNumber
                        ? "border-red-500 focus:border-red-500"
                        : ""
                      }`}
                    required
                  />
                  {fieldErrors.phoneNumber && (
                    <p className="text-sm text-red-600">{fieldErrors.phoneNumber}</p>
                  )}
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
                      onChange={(e) => {
                        const nextPassword = e.target.value;
                        setFormData({
                          ...formData,
                          password: nextPassword,
                        });
                        setFieldErrors((prev) => ({
                          ...prev,
                          password: validatePassword(nextPassword),
                          confirmPassword: validateConfirmPassword(
                            nextPassword,
                            formData.confirmPassword
                          ),
                        }));
                      }}
                      onBlur={() =>
                        setFieldErrors((prev) => ({
                          ...prev,
                          password: validatePassword(formData.password),
                        }))
                      }
                      className={`border-agro-green/30 focus:border-agro-green pr-10 ${fieldErrors.password ? "border-red-500 focus:border-red-500" : ""
                        }`}
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
                  {fieldErrors.password && (
                    <p className="text-sm text-red-600">{fieldErrors.password}</p>
                  )}
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
                      onChange={(e) => {
                        const nextConfirmPassword = e.target.value;
                        setFormData({
                          ...formData,
                          confirmPassword: nextConfirmPassword,
                        });
                        setFieldErrors((prev) => ({
                          ...prev,
                          confirmPassword: validateConfirmPassword(
                            formData.password,
                            nextConfirmPassword
                          ),
                        }));
                      }}
                      onBlur={() =>
                        setFieldErrors((prev) => ({
                          ...prev,
                          confirmPassword: validateConfirmPassword(
                            formData.password,
                            formData.confirmPassword
                          ),
                        }))
                      }
                      className={`border-agro-green/30 focus:border-agro-green pr-10 ${fieldErrors.confirmPassword
                          ? "border-red-500 focus:border-red-500"
                          : ""
                        }`}
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
                  {fieldErrors.confirmPassword && (
                    <p className="text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="p-4 bg-agro-cream rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Bằng việc đăng ký, bạn đồng ý với{" "}
                    <Link
                      href="/terms#terms"
                      className="text-agro-green hover:underline"
                    >
                      Điều khoản sử dụng
                    </Link>{" "}
                    và{" "}
                    <Link
                      href="/terms#privacy"
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
            )}
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
