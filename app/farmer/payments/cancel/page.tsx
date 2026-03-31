import { XCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PaymentCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-4">
      <div className="p-6 rounded-full bg-destructive/10">
        <XCircle className="h-24 w-24 text-destructive" />
      </div>
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Thanh toán đã bị hủy</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Giao dịch nạp tiền của bạn đã bị hủy hoặc không thành công. 
          Vui lòng thử lại sau nếu bạn vẫn muốn nạp tiền.
        </p>
      </div>
      <div className="flex gap-4 mt-8">
        <Button asChild variant="outline" className="px-6">
          <Link href="/farmer/payments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Quản lý thanh toán
          </Link>
        </Button>
      </div>
    </div>
  )
}
