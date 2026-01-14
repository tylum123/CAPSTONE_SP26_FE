import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer id="contact" className="bg-gray-900 py-16 text-white">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Column 1: About */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-agro-green">
                <svg
                  className="h-6 w-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L4 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-8-5zm0 15.5l-5-3v-6l5-3 5 3v6l-5 3z" />
                </svg>
              </div>
              <span className="text-xl font-bold">AgroTemp</span>
            </div>
            <p className="mb-4 text-sm text-gray-400 leading-relaxed">
              Nền tảng tiên phong kết nối nông dân và lao động thời vụ tại Việt
              Nam.
            </p>
            <p className="text-sm font-semibold text-agro-green">
              Sứ mệnh: Số hóa nông nghiệp Việt Nam
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-bold">Liên kết nhanh</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link
                  href="/farmer/register"
                  className="hover:text-agro-green transition-colors"
                >
                  Đăng ký Farmer
                </Link>
              </li>
              <li>
                <Link
                  href="/download"
                  className="hover:text-agro-green transition-colors"
                >
                  Tải App Worker
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-agro-green transition-colors"
                >
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-agro-green transition-colors"
                >
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="mb-4 text-lg font-bold">Liên hệ</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-agro-green" />
                <span>Hotline: 1900 xxxx xx</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-agro-green" />
                <span>support@agrotemp.vn</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-agro-green" />
                <span>123 Đường ABC, Quận 1, TP. Hồ Chí Minh</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Download App */}
          <div>
            <h3 className="mb-4 text-lg font-bold">Tải ứng dụng</h3>
            <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-xl bg-white p-2">
              <img
                src="/qr-code-download-app.jpg"
                alt="QR Code Download App"
                className="h-full w-full object-contain"
              />
            </div>
            <p className="mb-4 text-sm text-gray-400">Quét mã để tải app</p>
            <div className="flex gap-2">
              <img
                src="/google-play-store-badge.png"
                alt="Google Play"
                className="h-10 rounded"
              />
              <img
                src="/apple-app-store-badge.png"
                alt="App Store"
                className="h-10 rounded"
              />
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          <p>© 2026 AgroTemp. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
