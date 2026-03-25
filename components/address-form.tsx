"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useProvinces } from "@/hooks/use-provinces";
import { Loader2 } from "lucide-react";

interface AddressFormProps {
  value: {
    province: string;
    ward: string;
    detailedAddress: string;
  };
  onChange: (address: {
    province: string;
    ward: string;
    detailedAddress: string;
  }) => void;
  required?: boolean;
}

export function AddressForm({
  value,
  onChange,
  required = true,
}: AddressFormProps) {
  const { provinces, loading, error, wardsLoading, wardsError, fetchWardsByProvince } =
    useProvinces();
  const [allWards, setAllWards] = useState<
    { name: string; code: number; division_type: string }[]
  >([]);
  const [wardType, setWardType] = useState<"phường" | "xã">("phường");

  const handleProvinceChange = async (province: string) => {
    onChange({
      ...value,
      province,
      ward: "",
    });

    const selectedProvince = provinces.find((p) => p.name === province);
    if (selectedProvince) {
      const wards = await fetchWardsByProvince(selectedProvince.code);
      setAllWards(wards);
    } else {
      setAllWards([]);
    }
  };

  const handleWardTypeChange = (type: string) => {
    setWardType(type as "phường" | "xã");
    onChange({
      ...value,
      ward: "",
    });
  };

  const filteredWards = allWards.filter((ward) => ward.division_type === wardType);

  const handleWardChange = (ward: string) => {
    onChange({
      ...value,
      ward,
    });
  };

  const handleDetailedAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({
      ...value,
      detailedAddress: e.target.value,
    });
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-700">Lỗi tải tỉnh/thành: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="province">
          Tỉnh/Thành phố
          {loading && <Loader2 className="ml-2 inline-block h-4 w-4 animate-spin" />}
        </Label>
        <Select value={value.province} onValueChange={handleProvinceChange} disabled={loading}>
          <SelectTrigger
            id="province"
            className="w-full border-agro-green/30 focus:border-agro-green disabled:opacity-50"
          >
            <SelectValue
              placeholder={loading ? "Đang tải..." : "Chọn tỉnh/thành phố"}
            />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.code} value={province.name}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ward">
          Phường/Xã
          {wardsLoading && (
            <Loader2 className="ml-2 inline-block h-4 w-4 animate-spin" />
          )}
        </Label>
        <RadioGroup
          value={wardType}
          onValueChange={handleWardTypeChange}
          className="grid grid-cols-2 gap-4 rounded-md border border-agro-green/20 p-3"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem id="ward-type-phuong" value="phường" />
            <Label htmlFor="ward-type-phuong" className="cursor-pointer">Phường</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="ward-type-xa" value="xã" />
            <Label htmlFor="ward-type-xa" className="cursor-pointer">Xã</Label>
          </div>
        </RadioGroup>
        <Select
          value={value.ward}
          onValueChange={handleWardChange}
          disabled={!value.province || wardsLoading}
        >
          <SelectTrigger
            id="ward"
            className="w-full border-agro-green/30 focus:border-agro-green disabled:opacity-50"
          >
            <SelectValue
              placeholder={
                !value.province
                  ? "Vui lòng chọn tỉnh trước"
                  : wardsLoading
                  ? "Đang tải phường/xã..."
                  : `Chọn ${wardType}`
              }
            />
          </SelectTrigger>
          <SelectContent>
            {filteredWards.length > 0 ? (
              filteredWards.map((ward) => (
                <SelectItem key={ward.code} value={ward.name}>
                  {ward.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                {!value.province
                  ? "Vui lòng chọn tỉnh trước"
                  : wardsError
                  ? "Lỗi tải dữ liệu"
                  : `Không có dữ liệu ${wardType}`}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {wardsError && (
          <p className="text-sm text-red-600">Lỗi tải phường/xã: {wardsError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="detailedAddress">Địa chỉ chi tiết</Label>
        <Input
          id="detailedAddress"
          name="detailedAddress"
          type="text"
          placeholder="Số nhà, đường, ngõ, tên tòa nhà, v.v."
          value={value.detailedAddress}
          onChange={handleDetailedAddressChange}
          className="border-agro-green/30 focus:border-agro-green"
          required={required}
        />
      </div>

      {value.province && value.ward && (
        <div className="p-3 bg-agro-cream/50 rounded-md border border-agro-green/20">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Địa chỉ đầy đủ:</span>
            <br />
            {value.detailedAddress && `${value.detailedAddress}, `}
            {value.ward}, {value.province}
          </p>
        </div>
      )}
    </div>
  );
}
