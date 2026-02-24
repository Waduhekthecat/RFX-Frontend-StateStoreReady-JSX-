// src/core/transport/TransportProvider.jsx
import React from "react";
import { createMockTransport } from "./MockTransport";

const TransportCtx = React.createContext(null);

/**
 * Goal:
 * - Default to MockTransport for now
 * - Allow caller to pass a transport later (ElectronTransport)
 *
 * Usage now:
 *   <TransportProvider>
 *     <App />
 *   </TransportProvider>
 *
 * Usage later:
 *   <TransportProvider transport={electronTransport}>
 *     <App />
 *   </TransportProvider>
 */
export function TransportProvider({ children, transport: providedTransport = null }) {
  const transport = React.useMemo(() => {
    return providedTransport || createMockTransport();
  }, [providedTransport]);

  return <TransportCtx.Provider value={transport}>{children}</TransportCtx.Provider>;
}

export function useTransport() {
  const t = React.useContext(TransportCtx);
  if (!t) throw new Error("useTransport must be used within TransportProvider");
  return t;
}