"use client";

import { useEffect, useRef, useState } from "react";
import { Zap, Shield, Wallet, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Tốc độ vượt trội",
    description: "Thuật toán thông minh tự động tìm kiếm và đề xuất lao động ở gần nhất, giúp bạn hoàn thành công việc đúng vụ mùa.",
    color: "bg-agro-green",
    lightColor: "bg-agro-green/10",
    glowColor: "glow-green",
  },
  {
    icon: Shield,
    title: "Tuyệt đối tin cậy",
    description: "Hệ thống xác thực KYC nghiêm ngặt, hồ sơ minh bạch cùng cơ chế đánh giá 2 chiều đảm bảo uy tín cho cả hai bên.",
    color: "bg-agro-orange",
    lightColor: "bg-agro-orange/10",
    glowColor: "glow-orange",
  },
  {
    icon: Wallet,
    title: "Thanh toán an toàn",
    description: "Tích hợp ví điện tử hiện đại, tiền được kiểm soát minh bạch và chỉ giải ngân khi công việc được nghiệm thu hoàn tất.",
    color: "bg-agro-green",
    lightColor: "bg-agro-green/10",
    glowColor: "glow-green",
  },
];

export function WhyChooseSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative bg-agro-cream py-24 md:py-32 overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-agro-green/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-agro-orange/5 blur-3xl" />

      <div className="container relative mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className={`mb-20 text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-agro-green" />
            <span className="text-xs font-bold uppercase tracking-widest text-agro-green">
              Giá trị cốt lõi
            </span>
          </div>
          <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Tại sao chọn <span className="text-agro-green">AgroTemp</span>?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Chúng tôi không chỉ là một ứng dụng, mà là giải pháp chuyển đổi số toàn diện cho nông thôn Việt Nam.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group card-gradient-border relative p-1 transition-all duration-700 hover:-translate-y-3 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
                }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className="relative h-full rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-500 group-hover:shadow-2xl group-hover:shadow-agro-green/5">
                {/* Icon Container */}
                <div className={`relative mb-8 flex h-16 w-16 items-center justify-center rounded-2xl ${feature.lightColor} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                  <div className={`absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${feature.glowColor}`} />
                  <feature.icon className={`relative z-10 h-8 w-8 transition-colors duration-500 ${index === 1 ? "text-agro-orange" : "text-agro-green"}`} />
                </div>

                <h3 className="mb-4 text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-agro-green">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Corner Decoration */}
                <div className="absolute top-0 right-0 p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className={`h-1.5 w-1.5 rounded-full ${index === 1 ? "bg-agro-orange" : "bg-agro-green"}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Callout */}
        {/* <div className={`mt-20 flex justify-center transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <div className="flex items-center gap-6 rounded-3xl bg-white/50 backdrop-blur-sm border border-white p-6 shadow-sm">
            <div className="flex -space-x-3">
              {[
                "https://unavatar.io/twitter/sindresorhus",
                "https://unavatar.io/github/shadcn",
                "https://unavatar.io/twitter/jack",
                "https://unavatar.io/github/leeerob",
              ].map((src, i) => (
                <div key={i} className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-gray-200">
                  <img src={src} alt={`User ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Hơn 5,000+ nông dân đã tin dùng</p>
              <p className="text-xs text-muted-foreground">Phủ sóng rộng khắp 63 tỉnh thành Việt Nam</p>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
}
