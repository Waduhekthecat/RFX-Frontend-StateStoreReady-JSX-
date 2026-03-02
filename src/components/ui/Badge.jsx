import { cn } from "../lib/cn";
import { styles } from "./_styles";

export function Badge({ tone = "neutral", className = "", children, ...rest }) {
  return (
    <span
      className={cn(
        styles.badgeBase,
        styles.badgeTones[tone] || styles.badgeTones.neutral,
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}