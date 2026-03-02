import { cn } from "../_styles";

export function NodePill({ label, active }) {
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-2xl border bg-black/20",
        active
          ? "border-green-400/40 ring-1 ring-green-400/30"
          : "border-white/10"
      )}
    >
      <div className="text-sm font-semibold tracking-wide">{label}</div>
    </div>
  );
}