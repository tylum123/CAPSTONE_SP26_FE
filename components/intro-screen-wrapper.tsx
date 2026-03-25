"use client"

import dynamic from "next/dynamic"

const IntroScreen = dynamic(
  () => import("@/components/intro-screen").then((m) => m.IntroScreen),
  { ssr: false }
)

export function IntroScreenWrapper() {
  return <IntroScreen />
}
