import { cn } from "../../lib/cn";

export { cn };

export function clamp01(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

export function themeForLevel(level01) {
  const YELLOW_AT = 0.78;
  const RED_AT = 0.92;

  if (level01 >= RED_AT) {
    return {
      fill:
        "linear-gradient(180deg, rgba(255,120,120,0.92) 0%, rgba(255,60,60,0.96) 42%, rgba(200,18,18,0.98) 100%)",
      peak: "rgba(255,110,110,0.95)",
      glow: "rgba(255,80,80,0.35)",
      cap: "rgba(255,190,190,0.40)",
      clip: "rgba(255,70,70,0.95)",
    };
  }
  if (level01 >= YELLOW_AT) {
    return {
      fill:
        "linear-gradient(180deg, rgba(255,240,120,0.90) 0%, rgba(255,205,60,0.95) 50%, rgba(255,170,30,0.98) 100%)",
      peak: "rgba(255,235,120,0.95)",
      glow: "rgba(255,220,120,0.28)",
      cap: "rgba(255,245,190,0.38)",
      clip: "rgba(255,90,50,0.92)",
    };
  }
  return {
    fill:
      "linear-gradient(180deg, rgba(130,255,170,0.90) 0%, rgba(80,220,120,0.94) 45%, rgba(35,170,85,0.98) 100%)",
    peak: "rgba(120,255,170,0.95)",
    glow: "rgba(80,220,120,0.22)",
    cap: "rgba(190,255,215,0.35)",
    clip: "rgba(255,70,70,0.95)",
  };
}

export const styles = {
  wrapBase: "relative h-full overflow-hidden border border-white/10",
  wrapEnabled: "opacity-100",
  wrapDisabled: "opacity-35",

  glow: "absolute inset-0 pointer-events-none",
  fill: "absolute left-0 right-0 bottom-0",
  cap: "absolute left-0 right-0 pointer-events-none",
  peak: "absolute left-0 right-0 pointer-events-none",
  clip: "absolute top-1 left-1 right-1 h-3 rounded pointer-events-none",
};