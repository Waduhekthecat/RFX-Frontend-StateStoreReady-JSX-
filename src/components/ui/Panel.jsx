import { cn } from "../lib/cn";
import { styles } from "./_styles";

export function Panel({
  as: Tag = "div",
  active = false,
  interactive = false,
  className = "",
  style = {},
  children,
  ...rest
}) {
  const isClickable = interactive || typeof rest.onClick === "function";

  const lighting = {
    backgroundImage:
      "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 100%)",
    ...style,
  };

  return (
    <Tag
      className={cn(
        styles.panelBase,
        isClickable && styles.panelHover,
        isClickable && styles.panelAffordance,
        active && styles.panelRing,
        className
      )}
      style={lighting}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function PanelHeader({ className = "", children, ...rest }) {
  return (
    <div className={cn(styles.panelHeader, className)} {...rest}>
      {children}
    </div>
  );
}

export function PanelBody({ className = "", children, ...rest }) {
  return (
    <div className={cn(styles.panelBody, className)} {...rest}>
      {children}
    </div>
  );
}

export function PanelFooter({ className = "", children, ...rest }) {
  return (
    <div className={cn(styles.panelFooter, className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * Inset
 * For “sunken” wells inside a panel (meters, lists, parameter slots).
 */
export function Inset({ className = "", children, ...rest }) {
  return (
    <div className={cn(styles.inset, className)} {...rest}>
      {children}
    </div>
  );
}