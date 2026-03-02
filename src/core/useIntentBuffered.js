// src/hooks/useIntentBuffered.js
// (or wherever your hook lives — keep the same path/name you already use)

import React from "react";
import { useIntent } from "./useIntent";

function clamp(n, a, b) {
  const v = Number(n);
  if (!Number.isFinite(v)) return a;
  return Math.max(a, Math.min(b, v));
}

function normalizeLaneId(id) {
  const s = String(id || "");
  // FX_1_A -> FX_1A  (also FX_12_B -> FX_12B)
  return s.replace(/^([A-Za-z]+_\d+)_([ABC])$/, "$1$2");
}

/**
 * Buffered intent sender for continuous controls (vol/pan knobs).
 * - call send(intent) frequently during drag
 * - it coalesces per key and flushes on an interval
 * - call flush() on pointer up to commit immediately
 */
export function useIntentBuffered({ intervalMs = 50 } = {}) {
  const intent = useIntent();
  const pendingRef = React.useRef(new Map());
  const timerRef = React.useRef(null);

  const flush = React.useCallback(() => {
    const pending = pendingRef.current;
    if (!pending.size) return;
    const items = Array.from(pending.values());
    pending.clear();
    for (const it of items) intent(it);
  }, [intent]);

  const ensureTimer = React.useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = window.setInterval(flush, intervalMs);
  }, [flush, intervalMs]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      pendingRef.current.clear();
    };
  }, []);

  const send = React.useCallback(
    (key, it) => {
      // allow simple usage: send(intent) -> key derived from name
      if (typeof it === "undefined") {
        it = key;
        const tg = normalizeLaneId(it?.trackGuid);
        key = `${it?.name || "intent"}:${tg || it?.fxGuid || it?.busId || ""}`;
        it = tg ? { ...it, trackGuid: tg } : it;
      }

      // Normalize lane ids to canonical format (FX_1A, FX_2B, FX_3C)
      if (it?.trackGuid) it = { ...it, trackGuid: normalizeLaneId(it.trackGuid) };
      if (it?.trackId) it = { ...it, trackId: normalizeLaneId(it.trackId) };

      pendingRef.current.set(String(key), it);
      ensureTimer();
    },
    [ensureTimer]
  );

  return { send, flush };
}