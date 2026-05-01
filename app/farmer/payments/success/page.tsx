"use client"

import { useEffect, useState, Suspense } from "react"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { PaymentService } from "@/libs/api/services/payment.service"
import type { PaymentCallbackRequestParams } from "@/libs/types/payment.types"

const TOP_UP_RETURN_INTENT_KEY = "wallet.topup.return.intent"

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const urlParams = {
          code: searchParams.get('code') || undefined,
          id: searchParams.get('id') || undefined,
          cancel: searchParams.get('cancel') === 'true',
          status: searchParams.get('status') || undefined,
          orderCode: Number(searchParams.get('orderCode') || 0)
        }
        
        // Pass the parameters back to the backend for verification
        const response = await PaymentService.callback(urlParams as PaymentCallbackRequestParams)
        
        setIsSuccess(response.data?.success ?? true)
      } catch (error) {
        console.error("Payment verification failed:", error)
        setIsSuccess(false)
      } finally {
        setIsVerifying(false)
      }
    }

    if (Array.from(searchParams.entries()).length > 0) {
      verifyPayment()
    } else {
      setIsVerifying(false)
      setIsSuccess(true) // Default to success if no params to verify
    }
  }, [searchParams])

  useEffect(() => {
    if (isVerifying || !isSuccess) {
      return
    }

    if (typeof window === "undefined") {
      return
    }

    const rawIntent = window.sessionStorage.getItem(TOP_UP_RETURN_INTENT_KEY)

    if (!rawIntent) {
      return
    }

    try {
      const parsedIntent = JSON.parse(rawIntent) as {
        returnTo?: string
        returnStep?: string
        draftId?: string
      }

      if (!parsedIntent.returnTo || !parsedIntent.returnTo.startsWith("/")) {
        return
      }

      const params = new URLSearchParams()
      params.set("resumeFromTopUp", "1")
      params.set("step", parsedIntent.returnStep || "confirm")

      if (parsedIntent.draftId) {
        params.set("draftId", parsedIntent.draftId)
      }

      window.sessionStorage.removeItem(TOP_UP_RETURN_INTENT_KEY)
      router.replace(`${parsedIntent.returnTo}?${params.toString()}`)
    } catch {
      window.sessionStorage.removeItem(TOP_UP_RETURN_INTENT_KEY)
    }
  }, [isSuccess, isVerifying, router])

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-4">
        <Loader2 className="h-16 w-16 text-agro-green animate-spin" />
        <h1 className="text-xl font-medium text-muted-foreground">Đang xác thực giao dịch...</h1>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-4">
      <div className={`p-6 rounded-full ${isSuccess ? "bg-agro-green/10" : "bg-destructive/10"}`}>
        {isSuccess ? (
          <CheckCircle className="h-24 w-24 text-agro-green" />
        ) : (
          <XCircle className="h-24 w-24 text-destructive" />
        )}
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">
          {isSuccess ? "Thanh toán thành công!" : "Xác thực không thành công"}
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          {isSuccess 
            ? "Giao dịch nạp tiền của bạn đã được xử lý thành công. Số dư ví của bạn sẽ được cập nhật trong giây lát."
            : "Có lỗi xảy ra trong quá trình xác nhận trạng thái giao dịch. Tuy nhiên, nếu bạn đã bị trừ tiền, hãy liên hệ hỗ trợ."}
        </p>
      </div>
      <Button asChild className="bg-agro-green hover:bg-agro-green-dark text-white mt-8 px-8">
        <Link href="/farmer/payments">
          Quay lại Quản lý thanh toán
        </Link>
      </Button>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-4">
        <Loader2 className="h-16 w-16 text-agro-green animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
