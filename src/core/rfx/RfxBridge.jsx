import React from "react";
import { useTransport } from "../transport/TransportProvider";
import { useRfxStore } from "./Store";

export function RfxBridge() {
  const transport = useTransport();

  // Guard against React StrictMode double-mount
  const didInitRef = React.useRef(false);

  const unsubscribeRef = React.useRef(null);
  const unsubscribeMetersRef = React.useRef(null);

  React.useEffect(() => {
    // If already initialized (StrictMode second mount), do nothing
    if (didInitRef.current) return;

    didInitRef.current = true;

    // 1️⃣ Wire transport into RFX store
    useRfxStore.getState().setTransport(transport);

    // 2️⃣ Seed initial snapshot
    try {
      const snap = transport.getSnapshot?.();
      if (snap) {
        useRfxStore.getState().ingestSnapshot(snap);

        // ✅ Seed meters slice too (if meters exist in the snapshot)
        // Mock VM has meters at top-level: snap.meters
        // Some implementations might have them nested: snap.perf.metersById
        const meters =
          snap?.meters ||
          snap?.perf?.metersById ||
          snap?.perf?.metersById ||
          null;

        if (meters && typeof meters === "object") {
          useRfxStore.getState().ingestMeters({
            t: Date.now(),
            metersById: meters, // store uses metersById naming
            // Optional: active bus hint
            activeBusId: snap?.activeBusId || snap?.perf?.activeBusId || null,
          });
        }
      }
    } catch (err) {
      console.warn("[RfxBridge] initial snapshot failed:", err);
    }

    // 3️⃣ Subscribe to truth snapshots (seq-bearing changes)
    unsubscribeRef.current = transport.subscribe?.((vm) => {
      useRfxStore.getState().ingestSnapshot(vm);
    });

    // ✅ 4️⃣ Subscribe to meters telemetry stream (fast path)
    if (typeof transport.subscribeMeters === "function") {
      unsubscribeMetersRef.current = transport.subscribeMeters((frame) => {
        useRfxStore.getState().ingestMeters(frame);
      });
    }

    // Cleanup (only runs once in real unmount)
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (unsubscribeMetersRef.current) {
        unsubscribeMetersRef.current();
        unsubscribeMetersRef.current = null;
      }
      didInitRef.current = false;
    };
  }, [transport]);

  return null;
}