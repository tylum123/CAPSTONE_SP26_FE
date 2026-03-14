"use client";

const partners = [
  { name: "VNPay", logo: "/vnpay.png" },
];

export function StatsSection() {
  return (
    <section className="bg-agro-green py-20 text-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Đối tác thanh toán
          </h2>
          <p className="mx-auto max-w-2xl text-white/80">
            Các đối tác tin tưởng của AgroTemp
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/5 to-white/10 p-10 backdrop-blur-md">
          {/* Decorative background elements */}
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center justify-center gap-6">
              {partners.map((partner, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`,
                  }}
                >
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  <div className="relative flex h-16 w-28 items-center justify-center">
                    <img
                      src={partner.logo || "/placeholder.svg"}
                      alt={partner.name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-white/60">
              Thanh toán an toàn, nhanh chóng và tiện lợi
            </p>
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
