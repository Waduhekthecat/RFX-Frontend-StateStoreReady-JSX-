import { cn } from "../../components/lib/cn";

export { cn };

export const styles = {
  wrap: "h-full w-full flex flex-col min-h-0",
  body: "flex-1 min-h-0 px-5 pb-5 pt-5",
  stageWrap: "absolute inset-0",
  stageSvg: "absolute inset-0 w-full h-full pointer-events-none",
  content: "relative h-full",
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