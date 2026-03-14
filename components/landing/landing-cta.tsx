import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Monitor } from "lucide-react"

export function LandingCTA() {
  return (
    <section className="bg-primary py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-primary-foreground lg:text-4xl">Bắt đầu ngay hôm nay</h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Tham gia cùng hàng ngàn nông dân và người lao động trên khắp Việt Nam
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              asChild
            >
              <Link href="/farmer">
                <Monitor className="mr-2 h-5 w-5" />
                Truy cập Farmer Portal
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
