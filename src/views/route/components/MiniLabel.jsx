import { cn } from "../_styles";

export function MiniLabel({ children, dim }) {
  return <div className={cn("text-xs opacity-70", dim && "opacity-30")}>{children}</div>;
}