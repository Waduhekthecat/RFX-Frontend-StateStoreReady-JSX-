import React from "react";

export function Panel({
  as: Tag = "div",
  active = false,
  interactive = false, // optional explicit control
  className = "",
  style = {},
  children,
  ...rest
}) {
  const isClickable = interactive || typeof rest.onClick === "function";

  const base =
    "rounded-2xl border border-white/10 " +
    "bg-gradient-to-b from-white/10 to-white/[0.03] " +
    "shadow-[0_0_18px_rgba(0,0,0,0.55)]";

  const hover = isClickable
    ? "transition hover:from-white/[0.12] hover:to-white/[0.04]"
    : "";

  const affordance = isClickable
    ? "cursor-pointer select-none active:scale-[0.995]"
    : "";

  const ring = active
    ? "ring-2 ring-green-400/60 shadow-[0_0_22px_rgba(74,222,128,0.18)]"
    : "";

  const lighting = {
    backgroundImage:
      "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 100%)",
    ...style,
  };

  return (
    <Tag
      className={[base, hover, affordance, ring, className].filter(Boolean).join(" ")}
      style={lighting}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function PanelHeader({ className = "", children, ...rest }) {
  return (
    <div
      className={[
        "flex items-center justify-between",
        "px-3 pt-2",
        "text-[12px] tracking-wide text-white/80",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PanelBody({ className = "", children, ...rest }) {
  return (
    <div className={["px-3 pb-3 pt-2", "min-h-0", className].join(" ")} {...rest}>
      {children}
    </div>
  );
}

export function PanelFooter({ className = "", children, ...rest }) {
  return (
    <div
      className={[
        "px-3 pb-3 pt-2",
        "border-t border-white/10",
        "text-white/70",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Inset
 * For “sunken” wells inside a panel (meters, lists, parameter slots).
 */
export function Inset({ className = "", children, ...rest }) {
  return (
    <div
      className={[
        "rounded-xl border border-black/40",
        "bg-black/35",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-10px_24px_rgba(0,0,0,0.55)]",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}