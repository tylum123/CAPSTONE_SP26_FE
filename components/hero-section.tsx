import { Button } from "@/components/ui/button"
import { QrCode, FileText } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/vietnamese-rice-field-harvest-golden-sunset-farmer.jpg')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      </div>

      {/* Content */}
      <div className="container relative mx-auto flex min-h-[90vh] flex-col items-center justify-center px-4 py-20 text-center">
        {/* Headline */}
        <h1 className="mb-6 max-w-4xl text-balance text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
          Kết Nối Mùa Vụ - Tìm Việc Nhanh, Thuê Người Dễ
        </h1>

        {/* Sub-headline */}
        <p className="mb-12 max-w-2xl text-pretty text-lg text-white/90 md:text-xl">
          Nền tảng tiên phong kết nối nông dân và lao động thời vụ tại Việt Nam.
          <span className="font-semibold text-agro-orange"> Minh bạch, An toàn, Thanh toán nhanh.</span>
        </p>

        {/* Dual CTA */}
        <div className="flex w-full max-w-3xl flex-col gap-6 md:flex-row md:gap-8">
          {/* Farmer CTA */}
          <div className="flex-1 rounded-2xl bg-white/10 p-6 backdrop-blur-md transition-all hover:bg-white/20">
            <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-agro-green">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">Tôi là Nông dân</h3>
            <p className="mb-4 text-sm text-white/80">Đăng tin tuyển dụng và tìm lao động phù hợp ngay hôm nay</p>
            <Button size="lg" className="w-full bg-agro-green hover:bg-agro-green-dark text-white font-semibold">
              Đăng tin tuyển dụng ngay
            </Button>
          </div>

          {/* Worker CTA */}
          <div className="flex-1 rounded-2xl bg-white/10 p-6 backdrop-blur-md transition-all hover:bg-white/20">
            <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-agro-orange">
              <QrCode className="h-8 w-8 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">Tôi cần tìm việc</h3>
            <p className="mb-4 text-sm text-white/80">Tải ứng dụng và bắt đầu tìm việc làm gần bạn</p>
            <Button size="lg" className="w-full bg-agro-orange hover:bg-agro-orange-dark text-white font-semibold">
              Tải ứng dụng tìm việc
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-10 w-6 rounded-full border-2 border-white/50 p-1">
            <div className="h-2 w-1 mx-auto rounded-full bg-white/80" />
          </div>
        </div>
      </div>
    </section>
  )
}
