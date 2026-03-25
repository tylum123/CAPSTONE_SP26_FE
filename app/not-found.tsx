import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>

          <h1 className="mb-4 text-5xl font-bold text-gray-900">404</h1>
          
          <h2 className="mb-2 text-2xl font-semibold text-gray-700">
            Trang không tìm thấy
          </h2>
          
          <p className="mb-8 max-w-md text-gray-600">
            Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
            Vui lòng kiểm tra lại URL hoặc quay lại trang chủ.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/">
              <Button className="h-11 px-6 text-base">
                Quay lại trang chủ
              </Button>
            </Link>
            
            <Link href="/farmer">
              <Button variant="outline" className="h-11 px-6 text-base">
                Vào bảng điều khiển
              </Button>
            </Link>
          </div>

          {/* Decorative element */}
          <div className="mt-12 opacity-10">
            <svg
              className="mx-auto h-48 w-48"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
