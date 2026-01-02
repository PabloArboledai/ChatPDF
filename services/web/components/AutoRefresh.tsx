"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AutoRefreshProps {
  enabled: boolean;
  intervalMs?: number;
}

export function AutoRefresh({ enabled, intervalMs = 5000 }: AutoRefreshProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(intervalMs / 1000);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      router.refresh();
      setCountdown(intervalMs / 1000);
    }, intervalMs);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return intervalMs / 1000;
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [enabled, intervalMs, router]);

  if (!enabled) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
      <span className="animate-pulse">🔄</span>
      <span>Auto-actualizando en {countdown}s</span>
    </div>
  );
}
