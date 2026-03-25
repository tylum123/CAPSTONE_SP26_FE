import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-agro-cream via-white to-agro-green/5 py-10 px-4">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-agro-green hover:text-agro-green-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay về trang chủ
        </Link>

        <header className="rounded-xl border border-agro-green/20 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-agro-green">Điều khoản và Chính sách</h1>
          <p className="mt-2 text-muted-foreground">
            Tài liệu này bao gồm Điều khoản sử dụng và Chính sách bảo mật của AgroTemp.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a href="#terms" className="rounded-full border border-agro-green/20 px-3 py-1 hover:bg-agro-cream">
              Điều khoản sử dụng
            </a>
            <a href="#privacy" className="rounded-full border border-agro-green/20 px-3 py-1 hover:bg-agro-cream">
              Chính sách bảo mật
            </a>
          </div>
        </header>

        <section id="terms" className="rounded-xl border border-agro-green/20 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-agro-green">
            <FileText className="h-5 w-5" />
            <h2 className="text-2xl font-semibold">Điều khoản sử dụng</h2>
          </div>

          <p className="text-muted-foreground">
            Khi sử dụng nền tảng AgroTemp, bạn đồng ý tuân thủ các điều khoản dưới đây.
          </p>

          <div className="space-y-3 text-sm leading-6 text-foreground/90">
            <p>
              1. Bạn cam kết cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký tài khoản.
            </p>
            <p>
              2. Bạn chịu trách nhiệm bảo mật tài khoản và mật khẩu của mình.
            </p>
            <p>
              3. Không sử dụng nền tảng vào mục đích gian lận, vi phạm pháp luật hoặc gây ảnh hưởng xấu đến người dùng khác.
            </p>
            <p>
              4. AgroTemp có quyền tạm khóa hoặc chấm dứt tài khoản nếu phát hiện hành vi vi phạm điều khoản.
            </p>
            <p>
              5. Nội dung đăng tải phải phù hợp với quy định pháp luật và chuẩn mực cộng đồng.
            </p>
          </div>
        </section>

        <section id="privacy" className="rounded-xl border border-agro-green/20 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-agro-green">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-2xl font-semibold">Chính sách bảo mật</h2>
          </div>

          <p className="text-muted-foreground">
            AgroTemp tôn trọng quyền riêng tư và cam kết bảo vệ dữ liệu cá nhân của bạn.
          </p>

          <div className="space-y-3 text-sm leading-6 text-foreground/90">
            <p>
              1. Chúng tôi thu thập thông tin cần thiết để cung cấp dịch vụ: email, số điện thoại, địa chỉ và thông tin hồ sơ liên quan.
            </p>
            <p>
              2. Dữ liệu được sử dụng để xác thực tài khoản, hỗ trợ kết nối lao động và nông dân, cũng như cải thiện trải nghiệm người dùng.
            </p>
            <p>
              3. Chúng tôi không chia sẻ dữ liệu cá nhân cho bên thứ ba khi chưa có sự đồng ý của bạn, trừ trường hợp pháp luật yêu cầu.
            </p>
            <p>
              4. Bạn có quyền yêu cầu cập nhật, chỉnh sửa hoặc xóa thông tin cá nhân theo chính sách của hệ thống.
            </p>
            <p>
              5. Chúng tôi áp dụng các biện pháp kỹ thuật hợp lý để bảo vệ dữ liệu khỏi truy cập trái phép.
            </p>
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          Cập nhật lần cuối: 22/03/2026
        </p>
      </div>
    </main>
  );
}
