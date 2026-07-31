import { cn } from "../../components/lib/cn";

export { cn };

export const styles = {
  wrap: "h-full w-full flex flex-col min-h-0",
  body: "flex-1 min-h-0 px-5 pb-5 pt-5",
  stageWrap: "absolute inset-0",
  stageSvg: "absolute inset-0 w-full h-full pointer-events-none",
  content: "relative h-full pb-20",
  busSelector: "absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center gap-3",
  busSelectButton: "h-14 w-28 shrink-0 rounded-2xl border text-[14px] font-semibold tracking-wide transition shadow-[0_0_18px_rgba(0,0,0,0.45)]",
  busSelectButtonActive: "border-green-400/70 bg-green-400/10 text-green-100 ring-2 ring-green-400/55 shadow-[0_0_22px_rgba(74,222,128,0.18)]",
  busSelectButtonIdle: "border-white/10 bg-white/[0.06] text-white/70 hover:border-white/20 hover:bg-white/[0.10]",
  lanesCol: "flex flex-col justify-center gap-6",
  laneGroup: "rounded-3xl border border-white/5 bg-black/10 px-3 py-3",
  laneHeader: "flex items-center justify-between mb-2",
  laneList: "flex flex-col gap-2",
  busesCol: "flex flex-col justify-center gap-[64px]",
  portCell: "flex items-center justify-center",
  grid: {
    gridTemplateColumns: "170px 1fr 220px 170px",
    columnGap: 28,
    alignItems: "center",
  },
  glowFilterId: "rfxGlow",
};
