// src/components/ui/gestures/Surface.jsx
import React from "react";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function composeHandlers(...fns) {
  const list = fns.filter(Boolean);
  if (!list.length) return undefined;
  return (e) => {
    for (const fn of list) fn(e);
  };
}

function mergeGestureBinds(gestureList) {
  const binds = gestureList.map((g) => g?.bind || {});
  const keys = new Set();
  for (const b of binds) Object.keys(b).forEach((k) => keys.add(k));

  const out = {};
  for (const k of keys) {
    out[k] = composeHandlers(...binds.map((b) => b[k]));
  }
  return out;
}

/**
 * Surface
 * Reusable interaction wrapper.
 *
 * Props:
 * - gesture: { bind, style }
 * - gestures: array of { bind, style } (composed)
 * - as: element type (default "div")
 * - className, style
 */
export function Surface({
  gesture,
  gestures,
  as: As = "div",
  className,
  style,
  children,
  ...rest
}) {
  const list = React.useMemo(() => {
    const xs = [];
    if (gesture) xs.push(gesture);
    if (Array.isArray(gestures)) xs.push(...gestures.filter(Boolean));
    return xs;
  }, [gesture, gestures]);

  const bind = React.useMemo(() => mergeGestureBinds(list), [list]);

  const mergedStyle = React.useMemo(() => {
    const base = { touchAction: "none", userSelect: "none" };
    const gestureStyle = Object.assign({}, ...list.map((g) => g?.style || {}));
    return { ...base, ...gestureStyle, ...(style || {}) };
  }, [list, style]);

  return (
    <As {...bind} {...rest} className={cx(className)} style={mergedStyle}>
      {children}
    </As>
  );
}