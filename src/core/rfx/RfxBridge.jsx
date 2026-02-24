import React from "react";
import { useTransport } from "../transport/TransportProvider";
import { useRfxStore } from "./Store";

export function RfxBridge() {
  const transport = useTransport();

  // Guard against React StrictMode double-mount
  const didInitRef = React.useRef(false);
  const unsubscribeRef = React.useRef(null);

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
      }
    } catch (err) {
      console.warn("[RfxBridge] initial snapshot failed:", err);
    }

    // 3️⃣ Subscribe to transport updates
    unsubscribeRef.current = transport.subscribe?.((vm) => {
      useRfxStore.getState().ingestSnapshot(vm);
    });

    // Cleanup (only runs once in real unmount)
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      didInitRef.current = false;
    };
  }, [transport]);

  return null;
}