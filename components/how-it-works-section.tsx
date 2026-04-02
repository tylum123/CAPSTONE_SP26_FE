"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  CreditCard,
  MapPin,
  Calendar,
  Banknote,
  ArrowRight,
  MousePointer2,
} from "lucide-react";
import Link from "next/link";

const farmerSteps = [
  {
    icon: FileText,
    title: "Đăng việc & Địa điểm",
    description:
      "Tạo tin tuyển dụng với thông tin chi tiết về công việc, tiền công, địa điểm làm việc cụ thể trên bản đồ.",
    accent: "bg-agro-green",
    lightAccent: "bg-agro-green/10",
  },
  {
    icon: Users,
    title: "Duyệt hồ sơ người ứng tuyển",
    description:
      "Xem danh sách ứng viên, kiểm tra xếp hạng uy tín và lịch sử làm việc để chọn người phù hợp nhất.",
    accent: "bg-agro-green",
    lightAccent: "bg-agro-green/10",
  },
  {
    icon: CreditCard,
    title: "Thanh toán & Đánh giá",
    description:
      "Thanh toán an toàn qua ví điện tử sau khi hoàn thành. Đánh giá chất lượng để xây dựng cộng đồng uy tín.",
    accent: "bg-agro-green",
    lightAccent: "bg-agro-green/10",
  },
];

const workerSteps = [
  {
    icon: MapPin,
    title: "Bật vị trí & Tìm việc",
    description:
      "Cho phép truy cập vị trí để hệ thống tự động lọc và hiển thị hàng ngàn công việc nông vụ xung quanh bạn.",
    accent: "bg-agro-orange",
    lightAccent: "bg-agro-orange/10",
  },
  {
    icon: Calendar,
    title: "Ứng tuyển & Nhận việc",
    description:
      "Gửi yêu cầu ứng tuyển và nhận xác nhận tức thì. Theo dõi lịch trình làm việc ngay trên ứng dụng di động.",
    accent: "bg-agro-orange",
    lightAccent: "bg-agro-orange/10",
  },
  {
    icon: Banknote,
    title: "Hoàn thành & Nhận tiền",
    description:
      "Chụp ảnh nghiệm thu công việc và nhận tiền thù lao trực tiếp vào ví cá nhân ngay sau khi chủ vườn xác nhận.",
    accent: "bg-agro-orange",
    lightAccent: "bg-agro-orange/10",
  },
];

export function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState<"farmer" | "worker">("farmer");
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const steps = activeTab === "farmer" ? farmerSteps : workerSteps;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative z-10 bg-white py-24 md:py-32"
    >
      <div className="container relative mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className={`mb-16 text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-agro-orange/20 bg-agro-orange/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-agro-orange">
            Lộ trình sử dụng
          </span>
          <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Sẵn sàng trong <span className={activeTab === "farmer" ? "text-agro-green" : "text-agro-orange"}>3 bước đơn giản</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Quy trình thông minh, đơn giản và minh bạch, tối ưu hóa thời gian và hiệu quả cho người dùng.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={`mb-16 flex justify-center transition-all duration-700 delay-300 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <div className="flex rounded-2xl bg-gray-100 p-1.5 shadow-inner">
            <button
              onClick={() => setActiveTab("farmer")}
              className={`relative flex items-center gap-2 rounded-xl px-10 py-3 text-sm font-bold transition-all duration-300 ${activeTab === "farmer"
                ? "bg-white text-agro-green shadow-md"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <MousePointer2 className="h-4 w-4" />
              Nông dân
              {activeTab === "farmer" && (
                <span className="absolute -bottom-1 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-agro-green"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("worker")}
              className={`relative flex items-center gap-2 rounded-xl px-10 py-3 text-sm font-bold transition-all duration-300 ${activeTab === "worker"
                ? "bg-white text-agro-orange shadow-md"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Users className="h-4 w-4" />
              Lao động
              {activeTab === "worker" && (
                <span className="absolute -bottom-1 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-agro-orange"></span>
              )}
            </button>
          </div>
        </div>

        {/* Steps Container */}
        <div className="relative">
          {/* Animated Connectors - Desktop Only */}
          <div className="absolute left-[15%] right-[15%] top-1/2 hidden -translate-y-12 md:block">
            <div className={`h-0.5 w-full bg-gradient-to-r from-transparent ${activeTab === "farmer" ? "via-agro-green/30" : "via-agro-orange/30"} to-transparent`}>
              <div className={`h-full w-full animate-shimmer bg-gradient-to-r from-transparent ${activeTab === "farmer" ? "via-agro-green" : "via-agro-orange"} to-transparent`}></div>
            </div>
            {/* Arrows */}
            <div className={`absolute top-1/2 left-1/3 -translate-y-1/2 transition-colors ${activeTab === "farmer" ? "text-agro-green" : "text-agro-orange"}`}>
              <ArrowRight className="h-6 w-6 animate-bounce-slow" />
            </div>
            <div className={`absolute top-1/2 left-2/3 -translate-y-1/2 transition-colors ${activeTab === "farmer" ? "text-agro-green" : "text-agro-orange"}`}>
              <ArrowRight className="h-6 w-6 animate-bounce-slow" />
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={`${activeTab}-${index}`}
                className={`group relative transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Step Card */}
                <div className="relative flex flex-col items-center">
                  {/* Step Number Badge */}
                  <div className={`relative mb-8 flex h-20 w-20 items-center justify-center rounded-3xl ${step.accent} text-white shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                    <div className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-foreground shadow-lg border border-gray-100">
                      {index + 1}
                    </div>
                    <step.icon className="h-10 w-10 drop-shadow-md" />
                  </div>

                  {/* Card Content */}
                  <div className={`w-full rounded-[2.5rem] bg-gray-50 p-8 text-center transition-all duration-500 hover:bg-white hover:shadow-2xl border-2 border-transparent hover:border-gray-100`}>
                    <h3 className="mb-4 text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Info Callout */}
        {/* <div className={`mt-16 flex flex-col items-center gap-4 transition-all duration-1000 delay-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
           <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
             Bạn gặp khó khăn? <Link href="#contact" className="text-agro-green font-bold hover:underline">Liên hệ hỗ trợ 24/7</Link>
           </p>
        </div> */}
      </div>
    </section>
  );
}
