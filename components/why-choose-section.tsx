import { Zap, Shield, Wallet } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Tốc độ",
    description: "Tuyển người chỉ trong 5 phút. Thuật toán thông minh tìm lao động gần nhất.",
    color: "bg-agro-green",
  },
  {
    icon: Shield,
    title: "Tin cậy",
    description: "Hồ sơ minh bạch, có đánh giá 2 chiều. Hệ thống xác thực danh tính.",
    color: "bg-agro-orange",
  },
  {
    icon: Wallet,
    title: "An toàn",
    description: "Thanh toán đảm bảo qua ví điện tử. Tiền chỉ chuyển khi công việc hoàn thành.",
    color: "bg-agro-green",
  },
]

export function WhyChooseSection() {
  return (
    <section id="about" className="bg-agro-cream py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-agro-green/10 px-4 py-2 text-sm font-semibold text-agro-green">
            Lợi ích
          </span>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Tại sao chọn AgroTemp?</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Chúng tôi mang đến giải pháp toàn diện cho cả nông dân và người lao động thời vụ
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group rounded-2xl bg-white p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-xl"
            >
              <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${feature.color}`}>
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
