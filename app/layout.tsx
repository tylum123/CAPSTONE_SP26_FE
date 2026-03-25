import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/stores/auth.store"
import { GoogleAuthProvider } from "@/components/auth/google-auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { IntroScreenWrapper } from "@/components/intro-screen-wrapper"
import { LoadingProvider } from "@/contexts/loading-context"
import { LoadingOverlay } from "@/components/loading-overlay"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AgroTemp",
  description:
    "Nền tảng kết nối nông dân và lao động thời vụ tại Việt Nam. Minh bạch, An toàn, Thanh toán nhanh.",
  generator: "v0.app",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <LoadingProvider>
          <IntroScreenWrapper />
          <GoogleAuthProvider>
            <AuthProvider>
              <LoadingOverlay />
              {children}
            </AuthProvider>
          </GoogleAuthProvider>
          <Toaster />
          <Analytics />
        </LoadingProvider>
      </body>
    </html>
  )
}
