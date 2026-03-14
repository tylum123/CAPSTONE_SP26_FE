import Link from "next/link"
import { Leaf } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">AgroTemp</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Nền tảng kết nối việc làm thời vụ trong nông nghiệp hàng đầu Việt Nam.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Nền tảng</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/farmer" className="hover:text-foreground">
                  Farmer Portal
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-foreground">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/help" className="hover:text-foreground">
                  Trung tâm hỗ trợ
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Pháp lý</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 AgroTemp. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  )
}
