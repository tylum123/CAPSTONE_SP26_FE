"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLoading } from "@/contexts/loading-context";

export function LoadingOverlay() {
  const { isLoading, setIsLoading } = useLoading();
  const pathname = usePathname();
  const [displayLoading, setDisplayLoading] = useState(false);

  useEffect(() => {
    // Show loading overlay when route changes
    setIsLoading(true);
    setDisplayLoading(true);

    // Auto hide after a short delay (page transition completes)
    const timer = setTimeout(() => {
      setIsLoading(false);
      setDisplayLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, setIsLoading]);

  if (!displayLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Animated spinner */}
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-gray-300 border-t-agro-green"></div>
        </div>
        <p className="text-sm font-medium text-gray-700">Đang tải...</p>
      </div>
    </div>
  );
}
