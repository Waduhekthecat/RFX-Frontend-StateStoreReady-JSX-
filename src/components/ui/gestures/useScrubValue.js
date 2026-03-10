// src/components/ui/gestures/useScrubValue.js
import * as React from "react";
import { gestureParams } from "./params";

function clamp(n, a, b) {
  const v = Number(n);
  if (!Number.isFinite(v)) return a;
  return Math.max(a, Math.min(b, v));
}

// Smooth accelerating curve:
// - near 0: ~linear (fine control)
// - far away: ramps up
// d is pixels (>=0). Returns "effective pixels".
function accelCurve(d, { exponent = 1.6, accel = 0.015 } = {}) {
  // effectivePx = d + accel * d^exponent
  return d + accel * Math.pow(d, exponent);
}

/**
 * useScrubValue
 * Anchor + relative scrub with optional acceleration (nonlinear).
 */
export function useScrubValue({
  value,
  min = 0,
  max = 1,

  // Base value-per-pixel scaling for the linear part
  sensitivity = 0.005,

  // Acceleration tuning (nonlinear ramp)
  // exponent > 1 increases ramping with distance
  // accel scales how strong the ramp is
  accel = {
    enabled: true,
    exponent: 1.6,
    accel: 0.015,
  },

  onChange,
  onEnd,

  thresholdPx = gestureParams?.drag?.thresholdPx ?? 6,
  capturePointer = gestureParams?.drag?.capturePointer ?? true,
  preventDefaultOnDrag = gestureParams?.drag?.preventDefaultOnDrag ?? true,
} = {}) {
  const stRef = React.useRef({
    pointerId: null,
    startX: 0,
    startValue: 0,
    currentValue: 0,
    moved: false,
  });

  const threshold2 = thresholdPx * thresholdPx;

  const onPointerDown = React.useCallback(
    (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;

      const start = Number(value) || 0;

      stRef.current.pointerId = e.pointerId;
      stRef.current.startX = e.clientX;
      stRef.current.startValue = start;
      stRef.current.currentValue = start;
      stRef.current.moved = false;

      if (capturePointer && e.currentTarget?.setPointerCapture) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch { }
      }
    },
    [capturePointer, value]
  );

  const onPointerMove = React.useCallback(
    (e) => {
      const st = stRef.current;
      if (st.pointerId == null || e.pointerId !== st.pointerId) return;

      const rawDx = e.clientX - st.startX;

      if (!st.moved) {
        const d2 = rawDx * rawDx;
        if (d2 < threshold2) return;
        st.moved = true;
      }

      if (preventDefaultOnDrag) e.preventDefault?.();

      const sign = rawDx < 0 ? -1 : 1;
      const d = Math.abs(rawDx);

      // Nonlinear effective pixels
      const effPx =
        accel?.enabled === false
          ? d
          : accelCurve(d, {
            exponent: accel?.exponent ?? 1.6,
            accel: accel?.accel ?? 0.015,
          });

      const delta = sign * effPx * sensitivity;
      const next = clamp(st.startValue + delta, min, max);

      st.currentValue = next;
      onChange?.(next, { dx: rawDx, event: e });
    },
    [accel, max, min, onChange, preventDefaultOnDrag, sensitivity, threshold2]
  );

  const finish = React.useCallback(
    (e) => {
      const st = stRef.current;
      if (st.pointerId == null) return;

      const didMove = st.moved;
      const finalValue = st.currentValue;

      st.pointerId = null;
      st.moved = false;

      if (didMove) {
        onEnd?.({ event: e, value: finalValue });
      }
    },
    [onEnd]
  );

  const onPointerUp = React.useCallback((e) => finish(e), [finish]);
  const onPointerCancel = React.useCallback((e) => finish(e), [finish]);

  const bind = React.useMemo(
    () => ({ onPointerDown, onPointerMove, onPointerUp, onPointerCancel }),
    [onPointerCancel, onPointerDown, onPointerMove, onPointerUp]
  );

  const style = React.useMemo(
    () => ({ touchAction: "none", userSelect: "none" }),
    []
  );

  return { bind, style };
}