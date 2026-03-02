import { cn } from "../_styles";

export function Card({ children, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-black/25",
        "shadow-[0_12px_35px_rgba(0,0,0,0.45)]",
        "backdrop-blur-[2px]",
        className
      )}
    >
      {children}
    </div>
  );
}