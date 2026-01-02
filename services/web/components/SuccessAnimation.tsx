"use client";

import { useState } from "react";

export default function SuccessAnimation() {
  const [show] = useState(true);

  return (
    <div
      className={`inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 transition-all duration-500 ${
        show ? "scale-100 opacity-100" : "scale-50 opacity-0"
      }`}
    >
      <svg
        className="h-8 w-8 text-green-600 dark:text-green-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
          className={`transition-all duration-700 ${
            show ? "opacity-100" : "opacity-0"
          }`}
          style={{
            strokeDasharray: 24,
            strokeDashoffset: show ? 0 : 24,
          }}
        />
      </svg>
    </div>
  );
}
