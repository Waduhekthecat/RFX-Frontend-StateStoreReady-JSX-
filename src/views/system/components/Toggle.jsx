import { cn } from "../_styles";

export function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "w-14 h-8 rounded-full border border-white/10 transition",
        value ? "bg-white/20" : "bg-black/30"
      )}
      style={{ touchAction: "manipulation" }}
      aria-pressed={value}
    >
      <div
        className={cn(
          "h-7 w-7 rounded-full bg-white/70 transition-transform",
          value ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}