"use client";

import type React from "react";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Monitor,
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Upload,
} from "lucide-react";

const workerSkills = [
  "Thu hoạch lúa",
  "Làm đất",
  "Phun thuốc",
  "Bón phân",
  "Trồng cây",
  "Chăn nuôi",
  "Vận chuyển",
  "Máy gặt đập",
  "Lái máy cày",
  "Tưới tiêu",
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  const [registerType, setRegisterType] = useState<"farmer" | "worker">(
    typeParam === "worker" ? "worker" : "farmer"
  );

  // Farmer registration state
  const [farmerStep, setFarmerStep] = useState(1);
  const [farmerData, setFarmerData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    farmName: "",
    farmAddress: "",
    farmSize: "",
    description: "",
  });

  // Worker registration state
  const [workerStep, setWorkerStep] = useState(1);
  const [workerPhone, setWorkerPhone] = useState("");
  const [workerOtp, setWorkerOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [workerData, setWorkerData] = useState({
    name: "",
    avatar: null as File | null,
    skills: [] as string[],
    address: "",
    experience: "",
  });

  const toggleSkill = (skill: string) => {
    setWorkerData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleFarmerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (farmerStep < 3) {
      setFarmerStep(farmerStep + 1);
    } else {
      router.push("/farmer/dashboard");
    }
  };

  const handleWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (workerStep === 1) {
      if (!otpSent) {
        setOtpSent(true);
      } else {
        setWorkerStep(2);
      }
    } else {
      router.push("/worker/home");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-agro-cream via-white to-agro-green/5 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg">
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
              Đăng ký AgroTemp
            </CardTitle>
            <CardDescription>Tạo tài khoản mới để bắt đầu</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              value={registerType}
              onValueChange={(v) => setRegisterType(v as "farmer" | "worker")}
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

              {/* Farmer Registration - Multi Step */}
              <TabsContent value="farmer">
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-6">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          farmerStep >= step
                            ? "bg-agro-green text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {farmerStep > step ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          step
                        )}
                      </div>
                      {step < 3 && (
                        <div
                          className={`w-16 h-1 mx-2 ${
                            farmerStep > step ? "bg-agro-green" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleFarmerSubmit} className="space-y-4">
                  {farmerStep === 1 && (
                    <>
                      <h3 className="font-semibold text-lg mb-4">
                        Thông tin tài khoản
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="farmer-name">Họ và tên</Label>
                        <Input
                          id="farmer-name"
                          placeholder="Nguyễn Văn A"
                          value={farmerData.name}
                          onChange={(e) =>
                            setFarmerData({
                              ...farmerData,
                              name: e.target.value,
                            })
                          }
                          className="border-agro-green/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="farmer-email">Email</Label>
                        <Input
                          id="farmer-email"
                          type="email"
                          placeholder="email@example.com"
                          value={farmerData.email}
                          onChange={(e) =>
                            setFarmerData({
                              ...farmerData,
                              email: e.target.value,
                            })
                          }
                          className="border-agro-green/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="farmer-phone">Số điện thoại</Label>
                        <Input
                          id="farmer-phone"
                          type="tel"
                          placeholder="0912 345 678"
                          value={farmerData.phone}
                          onChange={(e) =>
                            setFarmerData({
                              ...farmerData,
                              phone: e.target.value,
                            })
                          }
                          className="border-agro-green/30"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="farmer-password">Mật khẩu</Label>
                          <Input
                            id="farmer-password"
                            type="password"
                            placeholder="Tối thiểu 8 ký tự"
                            value={farmerData.password}
                            onChange={(e) =>
                              setFarmerData({
                                ...farmerData,
                                password: e.target.value,
                              })
                            }
                            className="border-agro-green/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="farmer-confirm">
                            Xác nhận mật khẩu
                          </Label>
                          <Input
                            id="farmer-confirm"
                            type="password"
                            placeholder="Nhập lại mật khẩu"
                            value={farmerData.confirmPassword}
                            onChange={(e) =>
                              setFarmerData({
                                ...farmerData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className="border-agro-green/30"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {farmerStep === 2 && (
                    <>
                      <h3 className="font-semibold text-lg mb-4">
                        Thông tin nông trại
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="farm-name">Tên nông trại</Label>
                        <Input
                          id="farm-name"
                          placeholder="Nông trại Hạnh Phúc"
                          value={farmerData.farmName}
                          onChange={(e) =>
                            setFarmerData({
                              ...farmerData,
                              farmName: e.target.value,
                            })
                          }
                          className="border-agro-green/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="farm-address">Địa chỉ nông trại</Label>
                        <div className="relative">
                          <Input
                            id="farm-address"
                            placeholder="Số nhà, đường, xã/phường, huyện/quận, tỉnh"
                            value={farmerData.farmAddress}
                            onChange={(e) =>
                              setFarmerData({
                                ...farmerData,
                                farmAddress: e.target.value,
                              })
                            }
                            className="border-agro-green/30 pr-10"
                          />
                          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="farm-size">Diện tích (hecta)</Label>
                        <Input
                          id="farm-size"
                          type="number"
                          placeholder="5"
                          value={farmerData.farmSize}
                          onChange={(e) =>
                            setFarmerData({
                              ...farmerData,
                              farmSize: e.target.value,
                            })
                          }
                          className="border-agro-green/30"
                        />
                      </div>
                    </>
                  )}

                  {farmerStep === 3 && (
                    <>
                      <h3 className="font-semibold text-lg mb-4">Mô tả thêm</h3>
                      <div className="space-y-2">
                        <Label htmlFor="farm-description">
                          Giới thiệu về nông trại
                        </Label>
                        <Textarea
                          id="farm-description"
                          placeholder="Nông trại chuyên trồng lúa, hoa màu..."
                          value={farmerData.description}
                          onChange={(e) =>
                            setFarmerData({
                              ...farmerData,
                              description: e.target.value,
                            })
                          }
                          className="border-agro-green/30 min-h-24"
                        />
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
                    </>
                  )}

                  <div className="flex gap-3 pt-2">
                    {farmerStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFarmerStep(farmerStep - 1)}
                        className="flex-1"
                      >
                        Quay lại
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className="flex-1 bg-agro-green hover:bg-agro-green-dark text-white gap-2"
                    >
                      {farmerStep < 3 ? (
                        <>
                          Tiếp tục
                          <ArrowRight className="h-4 w-4" />
                        </>
                      ) : (
                        "Hoàn tất đăng ký"
                      )}
                    </Button>
                  </div>

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
              </TabsContent>

              {/* Worker Registration - Phone + Profile */}
              <TabsContent value="worker">
                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-6 gap-4">
                  {[1, 2].map((step) => (
                    <div key={step} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          workerStep >= step
                            ? "bg-agro-orange text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {workerStep > step ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          step
                        )}
                      </div>
                      {step < 2 && (
                        <div
                          className={`w-20 h-1 mx-2 ${
                            workerStep > step ? "bg-agro-orange" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleWorkerSubmit} className="space-y-4">
                  {workerStep === 1 && (
                    <>
                      <h3 className="font-semibold text-lg mb-4">
                        Xác thực số điện thoại
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="worker-phone">Số điện thoại</Label>
                        <Input
                          id="worker-phone"
                          type="tel"
                          placeholder="0912 345 678"
                          value={workerPhone}
                          onChange={(e) => setWorkerPhone(e.target.value)}
                          className="border-agro-orange/30"
                          disabled={otpSent}
                        />
                      </div>
                      {otpSent && (
                        <div className="space-y-2">
                          <Label htmlFor="worker-otp">Mã xác thực OTP</Label>
                          <Input
                            id="worker-otp"
                            type="text"
                            placeholder="Nhập mã 6 số"
                            value={workerOtp}
                            onChange={(e) => setWorkerOtp(e.target.value)}
                            className="border-agro-orange/30 text-center text-2xl tracking-widest"
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
                    </>
                  )}

                  {workerStep === 2 && (
                    <>
                      <h3 className="font-semibold text-lg mb-4">
                        Thiết lập hồ sơ
                      </h3>

                      {/* Avatar Upload */}
                      <div className="flex flex-col items-center gap-3 mb-4">
                        <div className="w-24 h-24 rounded-full bg-agro-orange/10 border-2 border-dashed border-agro-orange/30 flex items-center justify-center">
                          <Upload className="h-8 w-8 text-agro-orange/50" />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-agro-orange border-agro-orange/30 bg-transparent"
                        >
                          Tải ảnh đại diện
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="worker-name">Họ và tên</Label>
                        <Input
                          id="worker-name"
                          placeholder="Nguyễn Văn B"
                          value={workerData.name}
                          onChange={(e) =>
                            setWorkerData({
                              ...workerData,
                              name: e.target.value,
                            })
                          }
                          className="border-agro-orange/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="worker-address">Địa chỉ</Label>
                        <Input
                          id="worker-address"
                          placeholder="Xã/Phường, Huyện/Quận, Tỉnh"
                          value={workerData.address}
                          onChange={(e) =>
                            setWorkerData({
                              ...workerData,
                              address: e.target.value,
                            })
                          }
                          className="border-agro-orange/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Kỹ năng (chọn các việc bạn có thể làm)</Label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-lg border-agro-orange/30">
                          {workerSkills.map((skill) => (
                            <Badge
                              key={skill}
                              variant={
                                workerData.skills.includes(skill)
                                  ? "default"
                                  : "outline"
                              }
                              className={`cursor-pointer transition-colors ${
                                workerData.skills.includes(skill)
                                  ? "bg-agro-orange hover:bg-agro-orange-dark text-white"
                                  : "border-agro-orange/30 text-foreground hover:bg-agro-orange/10"
                              }`}
                              onClick={() => toggleSkill(skill)}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="worker-experience">
                          Kinh nghiệm (tùy chọn)
                        </Label>
                        <Textarea
                          id="worker-experience"
                          placeholder="Mô tả ngắn gọn kinh nghiệm làm việc..."
                          value={workerData.experience}
                          onChange={(e) =>
                            setWorkerData({
                              ...workerData,
                              experience: e.target.value,
                            })
                          }
                          className="border-agro-orange/30 min-h-20"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-2">
                    {workerStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setWorkerStep(1)}
                        className="flex-1"
                      >
                        Quay lại
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className="flex-1 bg-agro-orange hover:bg-agro-orange-dark text-white gap-2"
                    >
                      {workerStep === 1 ? (
                        otpSent ? (
                          <>
                            Xác nhận
                            <ArrowRight className="h-4 w-4" />
                          </>
                        ) : (
                          "Nhận mã OTP"
                        )
                      ) : (
                        "Hoàn tất đăng ký"
                      )}
                    </Button>
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    Đã có tài khoản?{" "}
                    <Link
                      href="/auth/login"
                      className="text-agro-orange hover:underline font-medium"
                    >
                      Đăng nhập
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
