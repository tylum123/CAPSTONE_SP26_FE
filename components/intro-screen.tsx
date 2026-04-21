"use client"

import { useEffect, useState } from "react"

export function IntroScreen() {
  const [phase, setPhase] = useState<"visible" | "fadeout" | "hidden">("visible")

  useEffect(() => {
    // Bắt đầu fade out sau 2.8 giây
    const fadeTimer = setTimeout(() => setPhase("fadeout"), 1600)
    // Ẩn hoàn toàn sau khi fade xong (~3.6s)
    const hideTimer = setTimeout(() => setPhase("hidden"), 2800)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (phase === "hidden") return null

  return (
    <div
      className="intro-overlay"
      style={{
        opacity: phase === "fadeout" ? 0 : 1,
        pointerEvents: phase === "fadeout" ? "none" : "all",
      }}
    >
      {/* Animated background blobs */}
      <div className="intro-blob intro-blob-1" />
      <div className="intro-blob intro-blob-2" />
      <div className="intro-blob intro-blob-3" />

      {/* Floating particles */}
      <div className="intro-particles" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={`intro-particle intro-particle-${i + 1}`} />
        ))}
      </div>

      {/* Center content */}
      <div className="intro-center">
        {/* Logo ring */}
        <div className="intro-logo-ring">
          <div className="intro-logo-inner">
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="AgroTemp logo"
            >
              {/* Leaf shape */}
              <path
                d="M28 8C28 8 12 16 12 30C12 39.941 19.059 48 28 48C36.941 48 44 39.941 44 30C44 16 28 8 28 8Z"
                fill="white"
                fillOpacity="0.95"
              />
              <path
                d="M28 8C28 8 12 16 12 30C12 39.941 19.059 48 28 48"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.3"
              />
              {/* Stem */}
              <line x1="28" y1="48" x2="28" y2="56" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
              {/* Vein */}
              <path
                d="M28 22 Q22 30 20 38"
                stroke="oklch(0.55 0.15 145)"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.6"
              />
              <path
                d="M28 22 Q34 30 36 38"
                stroke="oklch(0.55 0.15 145)"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.6"
              />
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <div className="intro-brand">
          <span className="intro-brand-agro">Agro</span>
          <span className="intro-brand-temp">Temp</span>
        </div>

        {/* Tagline */}
        <p className="intro-tagline">
          Kết nối nông dân &amp; lao động thời vụ
        </p>

        {/* Loading bar */}
        <div className="intro-loadbar-track">
          <div className="intro-loadbar-fill" />
        </div>
      </div>

      {/* Bottom watermark */}
      <p className="intro-watermark">Minh bạch · An toàn · Thanh toán nhanh</p>
    </div>
  )
}
