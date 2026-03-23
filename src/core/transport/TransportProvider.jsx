import React from "react";
// import { createMockTransport } from "./MockTransport";
import { createElectronTransport } from "./ElectronTransport";
import { wrapTransportWithContract } from "./ContractEnforcer";

const TransportCtx = React.createContext(null);

function noopOff() {
  return () => {};
}

function createFallbackTransport() {
  return {
    boot: async () => ({ ok: true, bootState: "READY", reaperReady: true }),
    syscall: async () => ({ ok: false, error: "Transport unavailable" }),
    sendOsc: async () => ({ ok: false, error: "Transport unavailable" }),
    getSnapshot: async () => null,
    getInstalledFx: async () => [],
    getBootState: async () => ({
      ok: true,
      bootState: "READY",
      reaperReady: true,
    }),
    onViewModel: () => noopOff(),
    onMeters: () => noopOff(),
    onCmdResult: () => noopOff(),
    onInstalledFx: () => noopOff(),
    onBootState: () => noopOff(),
    onReaperReady: () => noopOff(),
  };
}

export function TransportProvider({
  children,
  transport: providedTransport = null,
}) {
  const transport = React.useMemo(() => {
    let electron = null;
    let raw = null;

    try {
      electron = !providedTransport ? createElectronTransport() : null;
      raw = providedTransport || electron || createFallbackTransport();
    } catch (err) {
      console.warn("[TransportProvider] Failed to create transport:", err);
      raw = createFallbackTransport();
    }

    return wrapTransportWithContract(raw, {
      name:
        raw?.constructor?.name ||
        (providedTransport
          ? "ProvidedTransport"
          : electron
          ? "ElectronTransport"
          : "FallbackTransport"),
      warn: true,
    });
  }, [providedTransport]);

  return <TransportCtx.Provider value={transport}>{children}</TransportCtx.Provider>;
}

export function useTransport() {
  const t = React.useContext(TransportCtx);
  if (!t) throw new Error("useTransport must be used within TransportProvider");
  return t;
}