"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Zap, Globe, Coins } from "lucide-react";

const partners = [
  { name: "PayOS", logo: "/payOS.png" },
];

export function StatsSection() {
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
      ref={sectionRef}
      className={`relative z-10 bg-agro-green pt-24 md:pt-32 pb-48 md:pb-64 text-white overflow-hidden transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
    >
      {/* Dynamic Background Patterns */}
      <div className="absolute inset-0 z-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="mb-20 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/90">
            An tâm tuyệt đối
          </span>
          <h2 className="mb-6 text-3xl font-extrabold tracking-tight md:text-5xl">
            Đối tác chiến lược & <span className="text-agro-orange">Thanh toán</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/80 leading-relaxed">
            Hợp tác cùng các tập đoàn công nghệ và thanh toán hàng đầu Việt Nam để kiến tạo tương lai nông nghiệp số.
          </p>
        </div>

        {/* Stats and Partners Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Card 1: Security & Speed */}
          <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/5 p-10 backdrop-blur-md transition-all duration-500 hover:bg-white/10">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-agro-green-dark blur-3xl opacity-30" />
            <div className="relative">
              <h3 className="mb-8 flex items-center gap-3 text-2xl font-bold">
                <ShieldCheck className="h-8 w-8 text-agro-orange" />
                Hệ sinh thái thanh toán
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-3xl bg-white/5 p-6 border border-white/10 transition-transform group-hover:scale-105">
                  <Zap className="mb-3 h-6 w-6 text-agro-orange" />
                  <p className="text-xl font-black">10 Giây</p>
                  <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Xác nhận giao dịch</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-6 border border-white/10 transition-transform group-hover:scale-105 delay-75">
                  <Coins className="mb-3 h-6 w-6 text-agro-orange" />
                  <p className="text-xl font-black">0đ Phí</p>
                  <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Cho chủ vườn đăng việc</p>
                </div>
              </div>
              <p className="mt-8 text-sm text-white/70 leading-relaxed">
                Tích hợp giải pháp thanh toán PayOS giúp các giao dịch diễn ra tức thì, an toàn và bảo mật đúng theo tiêu chuẩn ngân hàng.
              </p>
            </div>
          </div>

          {/* Card 2: Partner Showcase */}
          <div className="group relative flex flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/5 p-10 backdrop-blur-md transition-all duration-500 hover:bg-white/10">
            <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-agro-orange blur-3xl opacity-20" />

            <div className="relative text-center">
              <Globe className="mx-auto mb-6 h-12 w-12 text-agro-orange animate-bounce-slow" />
              <h3 className="mb-8 text-2xl font-bold">Đối tác tin cậy</h3>

              <div className="flex flex-wrap items-center justify-center gap-6">
                {partners.map((partner, index) => (
                  <div
                    key={index}
                    className="group/partner relative h-24 w-48 overflow-hidden rounded-3xl bg-white p-5 shadow-2xl transition-all duration-500 hover:-translate-y-2"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${index * 0.2 + 0.3}s both`,
                    }}
                  >
                    {/* Shine effect on hover */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent transition-transform duration-1000 group-hover/partner:translate-x-full" />

                    <div className="relative flex h-full w-full items-center justify-center">
                      <img
                        src={partner.logo || "/payOS.jpg"}
                        alt={partner.name}
                        className="h-full w-full scale-130 object-contain transition-transform duration-300 group-hover/partner:scale-140"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-12 text-sm font-bold text-white/50 tracking-[0.2em] uppercase">
                Secured by PayOS Infrastructure
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </section>
  );
}
