import React from "react";

export function Badge({ tone = "neutral", className = "", children, ...rest }) {
  const tones = {
    neutral: "bg-white/10 text-white/80 border-white/15",
    active: "bg-green-400/15 text-green-200 border-green-400/30",
    warn: "bg-yellow-400/15 text-yellow-200 border-yellow-400/30",
    danger: "bg-red-400/15 text-red-200 border-red-400/30",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-1",
        "px-2 py-[2px] rounded-full",
        "text-[11px] leading-none",
        "border",
        tones[tone] || tones.neutral,
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}