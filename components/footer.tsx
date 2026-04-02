import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Twitter, ArrowUpRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="relative z-1000 bg-gray-950 pt-40 pb-12 text-white shadow-5xl">
      {/* Top Banner / CTA */}
      <div className="absolute top-0 left-1/2 w-full max-w-5xl pb-65 -translate-x-1/2 -translate-y-1/2 px-4 md:px-0">
        <div className="relative rounded-[2.5rem] bg-agro-green p-10 shadow-2xl overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-20 transition-transform group-hover:scale-150 duration-1000 rotate-12">
            <Leaf className="h-32 w-32" />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="text-center md:text-left">
              <h3 className="mb-2 text-2xl font-black md:text-3xl">Bắt đầu hành trình số hóa cùng AgroTemp</h3>
              <p className="text-agro-green-dark font-bold text-lg">Đăng ký và tìm kiếm lao động ngay bây giờ!</p>
            </div>
            <div className="flex gap-4">
              <Link href="/auth/register?type=farmer">
                <Button className="rounded-full bg-white px-8 py-7 font-black text-agro-green shadow-xl hover:bg-gray-100 hover:-translate-y-1 transition-all h-auto">
                  Trở thành Nông dân
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand & About */}
          <div className="space-y-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2">
                <img src="/logo.png" alt="AgroTemp Logo" className="h-full object-contain" />
              </div>
              <span className="text-2xl font-black text-white">AgroTemp</span>
            </Link>
            <p className="text-gray-400 leading-relaxed text-sm">
              Nền tảng tiên phong kết nối nông dân và lao động thời vụ tại Việt Nam bằng công nghệ 4.0. Chúng tôi cam kết mang lại giá trị bền vững cho cộng đồng nông thôn.
            </p>
            <div className="flex gap-4">
              {[Facebook, Instagram].map((Icon, idx) => (
                <Link
                  key={idx}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-agro-orange hover:border-agro-orange/50 transition-all"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div>
            <h3 className="mb-8 text-lg font-black uppercase tracking-widest text-agro-green">Dẫn hướng</h3>
            <ul className="space-y-4">
              {[
                { label: "Giới thiệu", href: "#about" },
                { label: "Tính năng", href: "#features" },
                { label: "Hướng dẫn", href: "#how-it-works" },
                { label: "Đối tác chiến lược", href: "/partners" },
                { label: "Báo cáo thường niên", href: "/reports" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="group flex items-center justify-between text-sm text-gray-400 transition-colors hover:text-white">
                    {item.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact & Support */}
          <div>
            <h3 className="mb-8 text-lg font-black uppercase tracking-widest text-agro-orange">Hỗ trợ 24/7</h3>
            <ul className="space-y-6 text-sm">
              <li className="flex items-start gap-4 text-gray-400 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:bg-agro-orange/10 group-hover:text-agro-orange group-hover:border-agro-orange/30 transition-all">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-white mb-1">Hotline</p>
                  <p>1900 8888 99</p>
                </div>
              </li>
              <li className="flex items-start gap-4 text-gray-400 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:bg-agro-orange/10 group-hover:text-agro-orange group-hover:border-agro-orange/30 transition-all">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-white mb-1">Email</p>
                  <p>support@agrotemp.vn</p>
                </div>
              </li>
              <li className="flex items-start gap-4 text-gray-400 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:bg-agro-orange/10 group-hover:text-agro-orange group-hover:border-agro-orange/30 transition-all">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-white mb-1">Trụ sở</p>
                  <p>Quận 9, TP. Hồ Chí Minh, Việt Nam</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: App Download & Certs */}
          <div className="space-y-8">
            <h3 className="text-lg font-black uppercase tracking-widest text-agro-green">Trải nghiệm di động</h3>
            <div className="flex gap-4 items-center">
              <div className="h-28 w-28 rounded-2xl bg-white p-2 shadow-2xl">
                <img src="/qrcode.png" alt="Download QR" className="h-full w-full object-contain" />
              </div>
              <div className="space-y-2 rounded-[0.5rem] overflow-hidden">
                <img src="/google-play-store-badge.png" alt="Google Play" className="h-10 cursor-pointer hover:opacity-80 transition-opacity" />
              </div>
            </div>
            {/* <div className="pt-6 border-t border-white/10">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-4">Chứng nhận bảo mật</p>
              <div className="flex gap-4 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                <img src="/verified-by-visa.png" alt="Visa" className="h-6 object-contain" />
                <img src="/mastercard-securecode.png" alt="Mastercard" className="h-6 object-contain" />
              </div>
            </div> */}
          </div>
        </div>

        {/* Legal & Copyright */}
        <div className="mt-20 border-t border-white/5 pt-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <p className="text-xs text-gray-500 font-medium">
              © {currentYear} AgroTemp Infrastructure Vietnam. All rights reserved.
            </p>
            <div className="flex gap-8 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              <Link href="/terms" className="hover:text-white transition-colors">Điều khoản</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Bảo mật</Link>
              <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
