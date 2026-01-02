"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface AutoRefreshProps {
  interval?: number;
  enabled?: boolean;
}

export default function AutoRefresh({ 
  interval = 5000, 
  enabled = true 
}: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      router.refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [interval, enabled, router]);

  return null;
}
