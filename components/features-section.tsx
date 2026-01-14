import { MapPin, MessageCircle, BarChart3 } from "lucide-react"

const features = [
  {
    icon: MapPin,
    title: "Bản đồ trực quan",
    description: "Tìm việc theo bán kính 1km - 5km xung quanh vị trí của bạn.",
  },
  {
    icon: MessageCircle,
    title: "Chat thời gian thực",
    description: "Trao đổi công việc trực tiếp không cần trung gian.",
  },
  {
    icon: BarChart3,
    title: "Quản lý mùa vụ",
    description: "Theo dõi chi phí và lịch sử thuê mướn dễ dàng.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="bg-agro-cream py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-agro-green/10 px-4 py-2 text-sm font-semibold text-agro-green">
            Tính năng
          </span>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Tính năng nổi bật</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">Công nghệ hiện đại phục vụ nông nghiệp Việt Nam</p>
        </div>

        {/* Content */}
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Device Mockup */}
          <div className="relative flex items-center justify-center">
            {/* Phone Mockup */}
            <div className="relative z-10 w-48 md:w-56">
              <div className="overflow-hidden rounded-3xl border-4 border-gray-800 bg-gray-800 shadow-2xl">
                <div className="aspect-[9/19] w-full">
                  <img
                    src="/mobile-app-map-view-agricultural-jobs-location-pin.jpg"
                    alt="Worker Mobile App"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              {/* Phone Notch */}
              <div className="absolute left-1/2 top-2 h-6 w-20 -translate-x-1/2 rounded-full bg-gray-800" />
            </div>

            {/* Laptop Mockup */}
            <div className="relative -ml-16 w-72 md:w-96">
              <div className="overflow-hidden rounded-t-xl border-4 border-gray-700 bg-gray-700">
                <div className="aspect-video w-full">
                  <img
                    src="/web-dashboard-agricultural-management-statistics-c.jpg"
                    alt="Farmer Web Dashboard"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              {/* Laptop Base */}
              <div className="h-4 rounded-b-xl bg-gray-600" />
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-8">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-agro-green text-white">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
