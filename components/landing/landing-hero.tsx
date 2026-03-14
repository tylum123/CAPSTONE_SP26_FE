import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin, Clock, Shield } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-background py-20 lg:py-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm text-secondary-foreground">
            <span className="flex h-2 w-2 rounded-full bg-primary" />
            Nền tảng tuyển dụng nông nghiệp hàng đầu Việt Nam
          </div>

          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Kết nối nông dân với <span className="text-primary">người lao động thời vụ</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground lg:text-xl">
            AgroTemp giúp nông dân tìm kiếm nhân công nhanh chóng và người lao động tìm việc làm thời vụ gần nhà với mức
            lương minh bạch.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/farmer">
                Đăng tuyển dụng
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-card-foreground">Tìm việc gần bạn</p>
              <p className="text-sm text-muted-foreground">Dựa trên vị trí GPS</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-card-foreground">Ứng tuyển nhanh</p>
              <p className="text-sm text-muted-foreground">Chỉ trong vài phút</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-card-foreground">Thanh toán an toàn</p>
              <p className="text-sm text-muted-foreground">Qua VNPay/Momo</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
