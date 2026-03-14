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
import { ArrowLeft, Eye, EyeOff, Mail, KeyRound, ShieldCheck } from "lucide-react";
import { authService } from "@/libs/api/services/auth.service";
import { useToast } from "@/hooks/use-toast";

type Step = "request" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("request");
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 – request OTP
  const [email, setEmail] = useState("");

  // Step 2 – reset
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Step 1: send OTP ──────────────────────────────────────────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await authService.forgotPassword({ email });
      toast({
        title: "📧 Đã gửi mã OTP",
        description: "Vui lòng kiểm tra email của bạn để nhận mã xác nhận.",
      });
      setStep("reset");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể gửi OTP. Vui lòng thử lại.";
      toast({
        title: "❌ Lỗi",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: reset password ────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "❌ Mật khẩu không khớp",
        description: "Mật khẩu xác nhận không trùng với mật khẩu mới.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "❌ Mật khẩu quá ngắn",
        description: "Mật khẩu phải có ít nhất 6 ký tự.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({ email, otp, newPassword });
      toast({
        title: "✅ Đặt lại mật khẩu thành công",
        description: "Bạn có thể đăng nhập bằng mật khẩu mới.",
      });
      setTimeout(() => router.push("/auth/login"), 1500);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "OTP không hợp lệ hoặc đã hết hạn.";
      toast({
        title: "❌ Đặt lại thất bại",
        description: msg,
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
          href="/auth/login"
          className="inline-flex items-center gap-2 text-agro-green hover:text-agro-green-dark mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>

        <Card className="border-agro-green/20 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-agro-green">
                {step === "request" ? (
                  <Mail className="h-8 w-8 text-white" />
                ) : (
                  <ShieldCheck className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl text-agro-green">
              {step === "request" ? "Quên mật khẩu" : "Đặt lại mật khẩu"}
            </CardTitle>
            <CardDescription>
              {step === "request"
                ? "Nhập email để nhận mã OTP xác nhận"
                : `Nhập mã OTP đã gửi đến ${email}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {/* ── Step indicator ── */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  step === "request"
                    ? "bg-agro-green text-white"
                    : "bg-agro-green/20 text-agro-green"
                }`}
              >
                1
              </div>
              <div className="h-px w-8 bg-agro-green/30" />
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  step === "reset"
                    ? "bg-agro-green text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
            </div>

            {/* ── Step 1: request OTP ── */}
            {step === "request" && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-agro-green/30 focus:border-agro-green"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-agro-green hover:bg-agro-green-dark text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
                </Button>
              </form>
            )}

            {/* ── Step 2: reset password ── */}
            {step === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-display">Email</Label>
                  <Input
                    id="email-display"
                    name="email"
                    type="email"
                    value={email}
                    readOnly
                    className="border-agro-green/30 bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Mã OTP</Label>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    placeholder="Nhập mã OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="border-agro-green/30 focus:border-agro-green tracking-widest text-center text-lg"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      name="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                  <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="border-agro-green/30 focus:border-agro-green pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-agro-green/30 text-agro-green hover:bg-agro-green/10"
                    onClick={() => setStep("request")}
                    disabled={isLoading}
                  >
                    Gửi lại OTP
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-agro-green hover:bg-agro-green-dark text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                  </Button>
                </div>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground mt-4">
              Nhớ mật khẩu rồi?{" "}
              <Link
                href="/auth/login"
                className="text-agro-green hover:underline font-medium"
              >
                Đăng nhập
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
