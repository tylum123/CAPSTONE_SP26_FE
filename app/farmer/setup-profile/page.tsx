"use client";

import { useState, useRef } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2, CalendarIcon, MapPin, User, FileText } from "lucide-react";
import { handleApiError } from "@/libs/utils/error-handler";
import { UpdateFarmerRequest } from "@/libs/types";
import { farmerService } from "@/libs/api/services/farmer.service";
import { cloudinaryService } from "@/libs/api/services/cloudinary.service";
import { useToast } from "@/hooks/use-toast";
import { AddressForm } from "@/components/address-form";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/libs/utils/utils";

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

                    <div className="space-y-2 flex flex-col">
                      <Label htmlFor="dateOfBirth" className="font-medium text-gray-700">
                        Ngày sinh
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-gray-50/50 border-gray-200 focus:bg-white focus:border-agro-green focus:ring-agro-green/20 h-11",
                              !formData.dateOfBirth && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-5 w-5 opacity-50" />
                            {formData.dateOfBirth ? (
                              format(new Date(formData.dateOfBirth), "dd/MM/yyyy")
                            ) : (
                              <span>Chọn ngày sinh (dd/mm/yyyy)</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                            onSelect={(date) =>
                              handleInputChange("dateOfBirth", date ? format(date, "yyyy-MM-dd") : "")
                            }
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            locale={vi}
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
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
