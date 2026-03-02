export const styles = {
  badgeBase:
    "inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11px] leading-none border",
  badgeTones: {
    neutral: "bg-white/10 text-white/80 border-white/15",
    active: "bg-green-400/15 text-green-200 border-green-400/30",
    warn: "bg-yellow-400/15 text-yellow-200 border-yellow-400/30",
    danger: "bg-red-400/15 text-red-200 border-red-400/30",
  },
  panelBase:
    "rounded-2xl border border-white/10 " +
    "bg-gradient-to-b from-white/10 to-white/[0.03] " +
    "shadow-[0_0_18px_rgba(0,0,0,0.55)]",
  panelHover: "transition hover:from-white/[0.12] hover:to-white/[0.04]",
  panelAffordance: "cursor-pointer select-none active:scale-[0.995]",
  panelRing:
    "ring-2 ring-green-400/60 shadow-[0_0_22px_rgba(74,222,128,0.18)]",
  panelHeader:
    "flex items-center justify-between px-3 pt-2 text-[12px] tracking-wide text-white/80",
  panelBody: "px-3 pb-3 pt-2 min-h-0",
  panelFooter: "px-3 pb-3 pt-2 border-t border-white/10 text-white/70",
  inset: "rounded-xl border border-black/40 bg-black/35 " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-10px_24px_rgba(0,0,0,0.55)]",
};