import React from "react";
import { createMockTransport } from "./MockTransport";

const TransportCtx = React.createContext(null);

export function TransportProvider({ children }) {
  const transport = React.useMemo(() => createMockTransport(), []);
  return <TransportCtx.Provider value={transport}>{children}</TransportCtx.Provider>;
}

export function useTransport() {
  const t = React.useContext(TransportCtx);
  if (!t) throw new Error("useTransport must be used within TransportProvider");
  return t;
}