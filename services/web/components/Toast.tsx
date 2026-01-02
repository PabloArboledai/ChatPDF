"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
}

export default function Toast({ 
  message, 
  type = "info", 
  duration = 3000,
  onClose 
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) {
        setTimeout(onClose, 300);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColors = {
    success: "bg-green-500/90 border-green-600/50",
    error: "bg-red-500/90 border-red-600/50",
    info: "bg-black/90 dark:bg-white/90 border-black/50 dark:border-white/50"
  };

  const textColors = {
    success: "text-white",
    error: "text-white",
    info: "text-white dark:text-black"
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      } ${bgColors[type]} ${textColors[type]}`}
      role="alert"
    >
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
