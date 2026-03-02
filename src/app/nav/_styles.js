export const cx = (...xs) => xs.filter(Boolean).join(" ");

export const styles = {
    wrap: "h-14 px-4 flex items-center border-b border-white/10 bg-black/30",
    left: "flex items-center gap-3 min-w-[260px]",
    brand: "font-bold tracking-wide",
    env: "text-xs opacity-60",
    divider: "h-6 w-px bg-white/10",
    activeRow: "flex items-center gap-2",
    activeLabel: "text-xs opacity-60",
    activeBus: "text-[12px] font-semibold tracking-wide",
    centerOuter: "flex-1 flex justify-center",
    tabsWrap: "flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10",
    tabBase: "px-4 py-1.5 text-sm rounded-lg transition",
    tabActive: "bg-white/15 text-white",
    tabIdle: "text-white/60 hover:text-white hover:bg-white/10",
    right: "flex items-center gap-3 min-w-[260px] justify-end",
    badgeBase: "inline-flex items-center px-2 py-[2px] rounded-full border text-[11px] leading-none",
    statusWrap: "flex items-center gap-1 text-xs",
    statusDotBase: "w-2.5 h-2.5 rounded-full",
    statusLabel: "opacity-70",
};