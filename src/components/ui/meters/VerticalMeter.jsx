import React from "react";
import { styles, cn, clamp01, themeForLevel } from "./_styles";

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function VerticalMeter({
  value = 0,
  enabled = true,
  width = 12,
  rounded = 8,
}) {
  // Keep the latest target in a ref so the RAF loop always reads fresh input
  const targetRef = React.useRef(0);
  targetRef.current = clamp01(value);

  const [level, setLevel] = React.useState(0);
  const [peak, setPeak] = React.useState(0);
  const [clip, setClip] = React.useState(false);

  const refs = React.useRef({
    level: 0,
    peak: 0,
    lastT: 0,
    peakHoldUntil: 0,
    clipUntil: 0,
    raf: 0,
  });

  // If disabled, park the meter at 0 and stop animating.
  React.useEffect(() => {
    if (!enabled) {
      const r = refs.current;
      r.level = 0;
      r.peak = 0;
      r.peakHoldUntil = 0;
      r.clipUntil = 0;

      setLevel(0);
      setPeak(0);
      setClip(false);

      if (r.raf) cancelAnimationFrame(r.raf);
      r.raf = 0;
    }
  }, [enabled]);

  // RAF loop ONLY when enabled
  React.useEffect(() => {
    if (!enabled) return;

    let alive = true;

    function tick(now) {
      if (!alive) return;

      const r = refs.current;
      const target = targetRef.current;

      if (!r.lastT) r.lastT = now;
      const dt = Math.min(0.05, Math.max(0.001, (now - r.lastT) / 1000));
      r.lastT = now;

      // Smooth level
      const attack = 18;
      const release = 6;
      const isRising = target > r.level;
      const k = 1 - Math.exp(-(isRising ? attack : release) * dt);
      r.level = lerp(r.level, target, k);

      // Peak hold + decay
      const PEAK_HOLD_S = 0.22;
      const PEAK_DECAY_PER_S = 0.9;

      if (target >= r.peak) {
        r.peak = target;
        r.peakHoldUntil = now + PEAK_HOLD_S * 1000;
      } else if (now > r.peakHoldUntil) {
        r.peak = Math.max(r.level, r.peak - PEAK_DECAY_PER_S * dt);
      }

      // Clip light
      const CLIP_AT = 0.985;
      if (target >= CLIP_AT) r.clipUntil = now + 140;
      const clipOn = now < r.clipUntil;

      setLevel(r.level);
      setPeak(r.peak);
      setClip(clipOn);

      r.raf = requestAnimationFrame(tick);
    }

    refs.current.lastT = 0;
    refs.current.raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(refs.current.raf);
      refs.current.raf = 0;
    };
  }, [enabled]);

  const theme = themeForLevel(peak);
  const fillPct = clamp01(level) * 100;
  const peakPct = clamp01(peak) * 100;

  return (
    <div
      className={cn(
        styles.wrapBase,
        enabled ? styles.wrapEnabled : styles.wrapDisabled
      )}
      style={{
        width,
        borderRadius: rounded,
        background: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Glow overlay (purely visual) */}
      {enabled && (
        <div
          className={styles.glow}
          style={{
            borderRadius: rounded,
            boxShadow: `0 0 12px ${theme.glow}`,
          }}
        />
      )}

      {/* fill */}
      <div
        className={styles.fill}
        style={{
          height: `${fillPct}%`,
          background: theme.fill,
          borderRadius: rounded,
          filter: enabled ? "saturate(1.05)" : "saturate(0.8)",
        }}
      />

      {/* cap highlight */}
      <div
        className={styles.cap}
        style={{
          bottom: `calc(${fillPct}% - 2px)`,
          height: 6,
          opacity: enabled ? 1 : 0.6,
          background: `linear-gradient(180deg, ${theme.cap} 0%, rgba(255,255,255,0) 100%)`,
        }}
      />

      {/* peak line */}
      <div
        className={styles.peak}
        style={{
          bottom: `calc(${peakPct}% - 1px)`,
          height: 2,
          background: theme.peak,
          opacity: enabled ? 0.95 : 0.7,
        }}
      />

      {/* clip light */}
      <div
        className={styles.clip}
        style={{
          background: clip ? theme.clip : "rgba(255,255,255,0.10)",
          boxShadow: clip ? "0 0 14px rgba(255,70,70,0.65)" : "none",
          transition: "background 80ms linear",
        }}
      />
    </div>
  );
}