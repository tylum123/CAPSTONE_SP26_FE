"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, Sparkles, Users, Briefcase, Smartphone, QrCode } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function HeroSection() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaFarmerRef = useRef<HTMLDivElement>(null);
  const ctaWorkerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = [headlineRef.current, subRef.current, ctaFarmerRef.current, ctaWorkerRef.current];
    const timers = els.map((el, i) =>
      setTimeout(() => el?.classList.add("in-view"), 150 + i * 180)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className="relative min-h-[92vh] overflow-hidden">
      {/* Ken Burns background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-ken-burns"
          style={{
            backgroundImage: `url('/vietnamese-rice-field-harvest-golden-sunset-farmer.jpg')`,
          }}
        />
        {/* Layered gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Floating ambient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[18%] h-64 w-64 rounded-full bg-agro-green/20 blur-3xl animate-float-slow" />
        <div className="absolute right-[12%] top-[30%] h-48 w-48 rounded-full bg-agro-orange/15 blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute bottom-[20%] left-[30%] h-56 w-56 rounded-full bg-agro-green/10 blur-3xl animate-float-slow" style={{ animationDelay: "-6s" }} />
      </div>

      {/* Content */}
      <div className="container relative mx-auto flex min-h-[92vh] flex-col items-center justify-center px-4 py-24 text-center">
        {/* Badge */}
        <div className="reveal-hidden in-view mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-agro-orange animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-white/90 uppercase">
            Nền tảng nông nghiệp số tại Việt Nam
          </span>
        </div>

        {/* Headline */}
        <h1
          ref={headlineRef}
          className="reveal-hidden mb-6 max-w-4xl text-balance text-4xl font-extrabold leading-[1.1] text-white md:text-6xl lg:text-7xl"
        >
          Tìm Việc Nhanh,{" "}
          <span className="relative inline-block">
            <span className="text-gradient-orange">Thuê Người Dễ</span>
            {/* Underline decoration */}
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
              <path d="M2 9 Q75 3 150 7 Q225 11 298 5" stroke="oklch(0.7 0.18 60 / 0.7)" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </span>
        </h1>

        {/* Sub-headline */}
        <p
          ref={subRef}
          className="reveal-hidden mb-12 max-w-2xl text-pretty text-lg text-white/85 md:text-xl leading-relaxed"
        >
          Nền tảng kết nối nông dân và lao động thời vụ tại Việt Nam.
          <br />
          <span className="font-bold text-agro-orange">Minh bạch · An toàn · Thanh toán nhanh.</span>
        </p>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl justify-center items-stretch">
          {/* Farmer CTA */}
          <div
            ref={ctaFarmerRef}
            className="reveal-hidden w-full max-w-sm"
          >
            <div className="group relative h-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-7 backdrop-blur-lg transition-all duration-500 hover:bg-white/20 hover:shadow-2xl hover:-translate-y-1">
              {/* Shine on hover */}
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              {/* Icon with pulse ring */}
              <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-agro-green/50 animate-pulse-ring" />
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-agro-green glow-green">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>

              <h3 className="mb-2 text-xl font-bold text-white">Tôi là Nông dân</h3>
              <p className="mb-5 text-sm text-white/75 leading-relaxed">
                Đăng tin tuyển dụng và tìm lao động phù hợp ngay hôm nay
              </p>
              <Link href="/auth/register" passHref>
                <Button
                  size="lg"
                  className="w-full bg-agro-green hover:bg-agro-green-dark text-white font-semibold cursor-pointer shadow-lg transition-all duration-300 hover:shadow-agro-green/40 hover:shadow-xl hover:-translate-y-0.5"
                >
                  Đăng tin ngay
                </Button>
              </Link>
            </div>
          </div>

          {/* Worker CTA */}
          <div
            ref={ctaWorkerRef}
            className="reveal-hidden w-full max-w-sm"
          >
            <div className="group relative h-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-7 backdrop-blur-lg transition-all duration-500 hover:bg-white/20 hover:shadow-2xl hover:-translate-y-1">
              {/* Shine on hover */}
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              {/* Icon with pulse ring */}
              <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-agro-orange/50 animate-pulse-ring" />
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-agro-orange glow-orange">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
              </div>

              <h3 className="mb-2 text-xl font-bold text-white">Tôi là Người lao động</h3>
              <p className="mb-5 text-sm text-white/75 leading-relaxed">
                Tìm kiếm việc làm canh tác thời vụ và tăng thu nhập ổn định
              </p>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="w-full bg-agro-orange hover:bg-agro-orange-dark text-white font-semibold cursor-pointer shadow-lg transition-all duration-300 hover:shadow-agro-orange/40 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Tìm việc ngay
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white border-agro-orange/20">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-agro-green flex items-center gap-2">
                      <Smartphone className="h-6 w-6 text-agro-orange" />
                      Tải ứng dụng AgroTemp
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-base">
                      Quét mã QR dưới đây để tải ứng dụng trên thiết bị di động (Android & iOS)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center justify-center gap-8 py-10">
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-agro-orange/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative rounded-[2rem] bg-white border-4 border-agro-orange/20 p-4 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                        <img
                          src="/qrcode.png"
                          alt="Download App QR Code"
                          className="h-48 w-48 object-contain"
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-xl shadow-lg">
                          <img src="/logo.png" alt="AgroTemp Logo" className="h-8 w-8" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 w-full">
                      <div className="flex items-center gap-2 text-sm font-bold text-agro-green uppercase tracking-widest">
                        <QrCode className="h-4 w-4" />
                        Scan to Download
                      </div>
                      <div className="w-full h-px bg-gray-100 px-10" />
                      <div className="flex gap-4">
                        <img src="/google-play-store-badge.png" alt="Get it on Google Play" className="h-12 cursor-pointer hover:scale-105 transition-transform" />
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
          <span className="text-xs font-medium tracking-widest text-white/50 uppercase">Khám phá</span>
          <div className="h-10 w-6 rounded-full border-2 border-white/40 p-1">
            <div className="h-2 w-1 mx-auto rounded-full bg-white/80 animate-scroll-dot" />
          </div>
          <ChevronDown className="h-4 w-4 text-white/40 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
