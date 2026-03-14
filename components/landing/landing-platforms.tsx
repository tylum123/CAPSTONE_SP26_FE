import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Monitor, Settings, ArrowRight } from "lucide-react"

export function LandingPlatforms() {
  const platforms = [
    {
      icon: Monitor,
      title: "Farmer Web Portal",
      description: "Cổng thông tin web cho nông dân đăng tuyển, quản lý ứng viên và theo dõi tiến độ công việc.",
      features: ["Đăng tin tuyển dụng", "Quản lý ứng viên", "Theo dõi thanh toán", "Phân tích & báo cáo"],
      link: "/farmer",
      buttonText: "Truy cập Portal",
      color: "primary",
    },
    {
      icon: Settings,
      title: "Admin Dashboard",
      description: "Hệ thống quản trị cho admin giám sát hoạt động, xử lý tranh chấp và cấu hình hệ thống.",
      features: ["Quản lý người dùng", "Giám sát hoạt động", "Xử lý khiếu nại", "Cấu hình hệ thống"],
      link: "/admin",
      buttonText: "Admin Panel",
      color: "muted",
    },
  ]

  return (
    <section id="platforms" className="bg-secondary/30 py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground lg:text-4xl">Hai nền tảng, một hệ sinh thái</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Mỗi nền tảng được thiết kế riêng cho từng đối tượng sử dụng
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {platforms.map((platform, index) => (
            <div key={index} className="flex flex-col rounded-2xl border border-border bg-card p-8">
              <div
                className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${
                  platform.color === "primary"
                    ? "bg-primary/10"
                    : "bg-muted"
                }`}
              >
                <platform.icon
                  className={`h-7 w-7 ${
                    platform.color === "primary"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </div>
              <h3 className="mb-3 text-xl font-bold text-card-foreground">{platform.title}</h3>
              <p className="mb-6 text-muted-foreground">{platform.description}</p>
              <ul className="mb-8 flex-1 space-y-3">
                {platform.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant={platform.color === "primary" ? "default" : "outline"} asChild>
                <Link href={platform.link}>
                  {platform.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
