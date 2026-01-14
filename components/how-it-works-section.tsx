"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  CreditCard,
  MapPin,
  Calendar,
  Banknote,
} from "lucide-react";

const farmerSteps = [
  {
    icon: FileText,
    title: "Đăng việc & Địa điểm",
    description:
      "Tạo tin tuyển dụng với thông tin chi tiết về công việc, địa điểm và yêu cầu.",
  },
  {
    icon: Users,
    title: "Duyệt hồ sơ người ứng tuyển",
    description: "Xem danh sách ứng viên, đánh giá và chọn người phù hợp nhất.",
  },
  {
    icon: CreditCard,
    title: "Thanh toán & Đánh giá",
    description:
      "Thanh toán an toàn qua ví điện tử và đánh giá sau khi hoàn thành.",
  },
];

const workerSteps = [
  {
    icon: MapPin,
    title: "Bật vị trí & Tìm việc quanh đây",
    description: "Cho phép truy cập vị trí để tìm công việc gần bạn nhất.",
  },
  {
    icon: Calendar,
    title: "Ứng tuyển & Xác nhận lịch",
    description: "Chọn công việc phù hợp và xác nhận lịch làm việc của bạn.",
  },
  {
    icon: Banknote,
    title: "Làm việc & Nhận tiền ngay",
    description: "Hoàn thành công việc và nhận tiền trực tiếp vào ví của bạn.",
  },
];

export function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState<"farmer" | "worker">("farmer");

  const steps = activeTab === "farmer" ? farmerSteps : workerSteps;

  return (
    <section id="how-it-works" className="bg-white py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full bg-agro-orange/10 px-4 py-2 text-sm font-semibold text-agro-orange">
            Quy trình
          </span>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Cách hoạt động
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Quy trình đơn giản, dễ hiểu cho cả nông dân và người lao động
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-12 flex justify-center gap-4">
          <Button
            size="lg"
            variant={activeTab === "farmer" ? "default" : "outline"}
            onClick={() => setActiveTab("farmer")}
            className={
              activeTab === "farmer"
                ? "bg-agro-green hover:bg-agro-green-dark text-white"
                : "border-agro-green text-agro-green hover:bg-agro-green hover:text-white"
            }
          >
            Nông dân
          </Button>
          <Button
            size="lg"
            variant={activeTab === "worker" ? "default" : "outline"}
            onClick={() => setActiveTab("worker")}
            className={
              activeTab === "worker"
                ? "bg-agro-orange hover:bg-agro-orange-dark text-white"
                : "border-agro-orange text-agro-orange hover:bg-agro-orange hover:text-white"
            }
          >
            Lao động
          </Button>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Horizontal Connection Line */}
          <div className="absolute left-0 top-[5rem] hidden h-1 w-full md:block">
            <div
              className={`h-full ${
                activeTab === "farmer"
                  ? "bg-agro-green/30"
                  : "bg-agro-orange/30"
              }`}
            />
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-white text-sm font-bold shadow-lg">
                  {index + 1}
                </div>

                <div
                  className={`rounded-2xl text-center transition-all hover:shadow-lg overflow-hidden ${
                    activeTab === "farmer"
                      ? "bg-agro-green/5"
                      : "bg-agro-orange/5"
                  }`}
                >
                  <div
                    className={`h-20 ${
                      activeTab === "farmer"
                        ? "bg-gradient-to-b from-agro-green/20 to-transparent"
                        : "bg-gradient-to-b from-agro-orange/20 to-transparent"
                    }`}
                  />
                  <div className="px-8 pb-8 -mt-10">
                    <div
                      className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${
                        activeTab === "farmer"
                          ? "bg-agro-green"
                          : "bg-agro-orange"
                      }`}
                    >
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="mb-3 text-lg font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
