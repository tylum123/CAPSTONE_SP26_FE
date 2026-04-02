"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, MessageCircle, BarChart3, Star, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: MapPin,
    title: "Bản đồ trực quan",
    description: "Tìm kiếm công việc và lao động theo bán kính 1km - 10km chính xác, giúp tiết kiệm thời gian di chuyển.",
    color: "bg-agro-green",
    lightColor: "bg-agro-green/10",
  },
  {
    icon: MessageCircle,
    title: "Chat thời gian thực",
    description: "Trao đổi công việc, gửi ảnh hiện trường và chốt công trực tiếp ngay trên ứng dụng không qua trung gian.",
    color: "bg-agro-orange",
    lightColor: "bg-agro-orange/10",
  },
  {
    icon: BarChart3,
    title: "Quản lý chuyên nghiệp",
    description: "Hệ thống báo cáo chi phí, lịch sử thuê mướn và đánh giá chất lượng công việc thông minh, minh bạch.",
    color: "bg-agro-green",
    lightColor: "bg-agro-green/10",
  },
];

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
      id="features"
      ref={sectionRef}
      className="relative bg-agro-cream py-24 md:py-32 overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute -left-20 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-agro-green/5 blur-3xl opacity-50" />
      <div className="absolute -right-20 top-0 h-[300px] w-[300px] rounded-full bg-agro-orange/5 blur-3xl opacity-50" />

      <div className="container relative mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className={`mb-20 text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 shadow-sm border border-agro-green/10">
            <Zap className="h-4 w-4 text-agro-green fill-current" />
            <span className="text-xs font-bold uppercase tracking-widest text-agro-green">
              Giải pháp đột phá
            </span>
          </div>
          <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Tính năng <span className="text-agro-green">vượt trội</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Áp dụng công nghệ GPS và thời gian thực để cách mạng hóa thị trường lao động nông nghiệp Việt Nam.
          </p>
        </div>

        {/* Content Content Container */}
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Device Mockups Side */}
          <div className={`relative order-2 lg:order-1 transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-95 -translate-x-10"}`}>
            <div className="relative flex items-center justify-center">
              {/* Phone Mockup - Animated Float */}
              <div className="relative z-20 w-56 md:w-64 animate-float shadow-2xl">
                <div className="overflow-hidden rounded-[3rem] border-[10px] border-gray-900 bg-gray-900 shadow-2xl">
                  <div className="aspect-[9/19] w-full">
                    <img
                      src="/mobile-app-map-view-agricultural-jobs-location-pin.jpg"
                      alt="AgroTemp Mobile App"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {/* Digital Notch */}
                  <div className="absolute left-1/2 top-0 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-gray-900" />
                </div>
                {/* Floating Elements on phone */}
                <div className="absolute -left-8 top-1/4 z-30 flex h-14 w-14 animate-bounce-slow items-center justify-center rounded-2xl bg-white shadow-xl">
                  <Star className="h-7 w-7 text-agro-orange fill-agro-orange" />
                </div>
                <div className="absolute -right-10 bottom-1/4 z-30 flex h-16 w-16 animate-float-slow items-center justify-center rounded-2xl bg-agro-green shadow-xl">
                  <ShieldCheck className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Laptop Mockup - Static Depth */}
              <div className="absolute -right-4 top-1/2 z-10 w-80 md:w-[480px] -translate-y-1/2 translate-x-10 scale-90 opacity-40 blur-[1px] grayscale transition-all duration-700 hover:opacity-80 hover:translate-x-4 hover:scale-100 hover:blur-0 hover:grayscale-0 lg:block lg:translate-x-20">
                <div className="overflow-hidden rounded-t-2xl border-[12px] border-gray-800 bg-gray-800 shadow-2xl">
                  <div className="aspect-video w-full">
                    <img
                      src="/web-dashboard-agricultural-management-statistics-c.jpg"
                      alt="AgroTemp Farmer Dashboard"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <div className="h-6 w-full rounded-b-3xl bg-gray-700 shadow-xl" />
                <div className="mx-auto h-2 w-32 rounded-b-xl bg-gray-600" />
              </div>
            </div>
          </div>

          {/* Features List Side */}
          <div className="order-1 lg:order-2 space-y-10">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group flex gap-6 p-6 rounded-3xl transition-all duration-500 hover:bg-white hover:shadow-xl hover:shadow-agro-green/5 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
                  }`}
                style={{ transitionDelay: `${index * 200 + 500}ms` }}
              >
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${feature.lightColor} text-agro-green transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <feature.icon className={`h-8 w-8 ${index === 1 ? "text-agro-orange" : "text-agro-green"}`} />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-agro-green">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  {/* Subtle link decoration */}
                  <div className={`mt-4 h-1 w-0 rounded-full transition-all duration-500 group-hover:w-16 ${index === 1 ? "bg-agro-orange" : "bg-agro-green"}`} />
                </div>
              </div>
            ))}

            <div className={`pt-6 transition-all duration-700 delay-[1200ms] ${isVisible ? "opacity-100" : "opacity-0"}`}>
              <Link href="/auth/register" passHref >
                <Button className="rounded-full bg-agro-green px-8 py-6 font-bold text-white shadow-lg shadow-agro-green/20 hover:bg-agro-green-dark hover:-translate-y-1 h-auto transition-all">
                  Khám phá toàn bộ tính năng
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
