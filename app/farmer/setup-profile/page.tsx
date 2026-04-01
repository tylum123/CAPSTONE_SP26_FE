"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2, CalendarIcon, MapPin, User, FileText } from "lucide-react";
import { handleApiError } from "@/libs/utils/error-handler";
import { UpdateFarmerRequest } from "@/libs/types";
import { farmerService } from "@/libs/api/services/farmer.service";
import { cloudinaryService } from "@/libs/api/services/cloudinary.service";
import { useToast } from "@/hooks/use-toast";
import { AddressForm } from "@/components/address-form";
import { format } from "date-fns";

export default function SetupProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [addressObj, setAddressObj] = useState({
    province: "",
    ward: "",
    detailedAddress: "",
  });

  const [formData, setFormData] = useState<UpdateFarmerRequest>({
    contactName: "",
    address: "",
    dateOfBirth: "",
    avatarUrl: "",
  });

  const handleInputChange = (field: keyof UpdateFarmerRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);

      const uploadResponse = await cloudinaryService.uploadImage(file);
      const uploadedUrl = uploadResponse.data;

      if (!uploadedUrl) {
        throw new Error("Không nhận được URL ảnh từ server");
      }

      setAvatarPreview(uploadedUrl);
      setFormData((prev) => ({
        ...prev,
        avatarUrl: uploadedUrl,
      }));

      toast({
        title: "Thành công",
        description: "Tải ảnh lên thành công. Vui lòng hoàn tất biểu mẫu.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: handleApiError(error, {
          defaultMessage: "Không thể tải ảnh đại diện lên",
        }),
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Construct the full address
    const fullAddressParts = [
      addressObj.detailedAddress,
      addressObj.ward,
      addressObj.province
    ].filter(Boolean);
    const fullAddress = fullAddressParts.join(", ");

    if (!formData.contactName || !fullAddress || fullAddressParts.length < 2) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ họ tên và địa chỉ (Tỉnh/Thành, Phường/Xã và Số nhà).",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      let finalData = { ...formData, address: fullAddress };
      if (finalData.dateOfBirth) {
        // Optionally format if needed for API compliance
      } else {
        delete finalData.dateOfBirth;
      }

      await farmerService.updateProfile(finalData);

      toast({
        title: "Thành công",
        description: "Hồ sơ của bạn đã được thiết lập.",
      });

      router.push("/farmer/dashboard");
    } catch (error: any) {
      console.error("Setup profile error:", error);
      toast({
        title: "Lỗi",
        description: handleApiError(error, {
          defaultMessage: "Không thể thiết lập cấu hình. Vui lòng thử lại sau.",
        }),
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-agro-cream via-white to-green-50/50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-agro-green flex items-center justify-center gap-2">
            <User className="h-8 w-8" />
            Thiết lập hồ sơ cá nhân
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Hoàn thiện thông tin để bắt đầu sử dụng dịch vụ của chúng tôi
          </p>
        </div>

        <Card className="border-agro-green/20 shadow-2xl rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <div className="h-2 w-full bg-linear-to-r from-agro-green to-agro-green-dark" />
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Profile Header section */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center justify-center gap-4 group shrink-0">
                  <div className="relative">
                    <Avatar className="h-32 w-32 shadow-md border-4 border-white ring-2 ring-agro-green/30">
                      <AvatarImage className="object-cover" src={avatarPreview || "/placeholder.svg"} />
                      <AvatarFallback className="bg-agro-green/10 text-agro-green text-5xl font-light">
                        {formData.contactName ? formData.contactName.charAt(0).toUpperCase() : <User size={48} />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="text-white h-8 w-8" />
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 border-agro-green/30 text-agro-green hover:bg-agro-green hover:text-white transition-colors"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingAvatar ? "Đang tải lên..." : "Tải ảnh lên"}
                  </Button>
                </div>

                <div className="flex-1 space-y-6 w-full">
                  <div className="space-y-4 border-b border-gray-100 pb-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-700">
                      <FileText className="h-5 w-5 text-agro-green" />
                      Thông tin cơ bản
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="contactName" className="font-medium text-gray-700">
                        Họ và Tên <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactName"
                        placeholder="VD: Nguyễn Văn A"
                        value={formData.contactName}
                        onChange={(e) => handleInputChange("contactName", e.target.value)}
                        className="bg-gray-50/50 border-gray-200 focus:bg-white focus:border-agro-green focus:ring-agro-green/20 h-11"
                        autoFocus
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="font-medium text-gray-700">
                        Ngày sinh
                      </Label>
                      <div className="grid grid-cols-3 gap-3">
                        {/* Day */}
                        <div className="relative">
                          <select
                            id="dob-day"
                            value={formData.dateOfBirth ? new Date(formData.dateOfBirth).getDate().toString() : ""}
                            onChange={(e) => {
                              const currentDate = formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date(2000, 0, 1);
                              const day = parseInt(e.target.value);
                              if (!isNaN(day)) {
                                currentDate.setDate(day);
                                handleInputChange("dateOfBirth", format(currentDate, "yyyy-MM-dd"));
                              }
                            }}
                            className="w-full h-11 rounded-md border border-gray-200 bg-gray-50/50 px-3 text-sm focus:border-agro-green focus:ring-2 focus:ring-agro-green/20 focus:bg-white outline-none appearance-none cursor-pointer transition-colors"
                          >
                            <option value="" disabled>Ngày</option>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <option key={d} value={d}>{d.toString().padStart(2, "0")}</option>
                            ))}
                          </select>
                          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Month */}
                        <div className="relative">
                          <select
                            id="dob-month"
                            value={formData.dateOfBirth ? (new Date(formData.dateOfBirth).getMonth() + 1).toString() : ""}
                            onChange={(e) => {
                              const currentDate = formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date(2000, 0, 1);
                              const month = parseInt(e.target.value) - 1;
                              if (!isNaN(month)) {
                                currentDate.setMonth(month);
                                handleInputChange("dateOfBirth", format(currentDate, "yyyy-MM-dd"));
                              }
                            }}
                            className="w-full h-11 rounded-md border border-gray-200 bg-gray-50/50 px-3 text-sm focus:border-agro-green focus:ring-2 focus:ring-agro-green/20 focus:bg-white outline-none appearance-none cursor-pointer transition-colors"
                          >
                            <option value="" disabled>Tháng</option>
                            {[
                              "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
                              "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
                              "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
                            ].map((label, i) => (
                              <option key={i} value={i + 1}>{label}</option>
                            ))}
                          </select>
                          <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                        </div>

                        {/* Year */}
                        <div className="relative">
                          <select
                            id="dob-year"
                            value={formData.dateOfBirth ? new Date(formData.dateOfBirth).getFullYear().toString() : ""}
                            onChange={(e) => {
                              const currentDate = formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date(2000, 0, 1);
                              const year = parseInt(e.target.value);
                              if (!isNaN(year)) {
                                currentDate.setFullYear(year);
                                handleInputChange("dateOfBirth", format(currentDate, "yyyy-MM-dd"));
                              }
                            }}
                            className="w-full h-11 rounded-md border border-gray-200 bg-gray-50/50 px-3 text-sm focus:border-agro-green focus:ring-2 focus:ring-agro-green/20 focus:bg-white outline-none appearance-none cursor-pointer transition-colors"
                          >
                            <option value="" disabled>Năm</option>
                            {Array.from(
                              { length: new Date().getFullYear() - 1930 + 1 },
                              (_, i) => new Date().getFullYear() - i
                            ).map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                          <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                        </div>
                      </div>
                      {formData.dateOfBirth && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Ngày sinh đã chọn: <span className="font-medium text-gray-700">{format(new Date(formData.dateOfBirth), "dd/MM/yyyy")}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4 pt-2">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-700">
                  <MapPin className="h-5 w-5 text-agro-green" />
                  Địa chỉ liên hệ <span className="text-red-500 ml-1 text-sm">*</span>
                </h3>
                <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100">
                  <AddressForm
                    value={addressObj}
                    onChange={setAddressObj}
                    required={true}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-agro-green hover:bg-agro-green-dark text-white rounded-xl h-14 text-lg font-medium shadow-lg shadow-agro-green/20 transition-all hover:scale-[1.01]"
                  disabled={saving || uploadingAvatar}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Đang lưu thông tin...
                    </>
                  ) : (
                    "Hoàn tất hồ sơ"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
