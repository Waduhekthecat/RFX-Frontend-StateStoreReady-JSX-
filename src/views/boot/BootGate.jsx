// src/views/boot/BootGate.jsx
import React from "react";
import { BootScreen } from "./BootScreen";
import { useTransport } from "../../core/transport/TransportProvider";
import { RfxBridge } from "../../core/rfx/RfxBridge";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Timing:
 * - Total min: 7s
 * - t=0..2s: logo-only (logo fades in)
 * - t=2..7s: full boot contents (progress anim is 5s)
 */
export function BootGate({ children, allowSkip = true, autoStart = true }) {
  const transport = useTransport();

  const [uiMode, setUiMode] = React.useState("logo"); // "logo" | "full"
  const [status, setStatus] = React.useState({
    phase: "idle",
    message: "Initializing…",
    detail: null,
    seq: null,
  });

  // StrictMode/dev guard: prevent double-runBoot
  const didAutoStartRef = React.useRef(false);

  const runBoot = React.useCallback(async () => {
    // reset
    setUiMode("logo");
    setStatus({ phase: "idle", message: "Initializing…", detail: null, seq: null });

    const totalMin = sleep(7000);

    try {
      // 1) logo-only for 2 seconds
      await sleep(2000);

      // 2) reveal full UI (BootScreen will render the rest)
      setUiMode("full");

      // 3) run real boot work during the visible 5s window
      setStatus({ phase: "booting", message: "Starting…", detail: null, seq: null });

      let seq = null;

      setStatus({
        phase: "waitingForReady",
        message: "Waiting for REAPER handshake…",
        detail: null,
        seq: null,
      });

      if (typeof transport.boot === "function") {
        const res = await transport.boot();
        if (!res || res.ok === false) throw new Error(res?.error || "Boot failed.");
        seq = res.seq ?? null;
      } else {
        // frontend-only fallback
        await sleep(600);
        seq = 1;
      }

      setStatus({
        phase: "syncing",
        message: "Syncing view snapshot…",
        detail: null,
        seq,
      });

      if (typeof transport.syscall === "function") {
        await transport.syscall({ name: "syncView" });
      }

      // 4) enforce total 7s minimum
      await totalMin;

      setStatus({ phase: "operational", message: "Operational.", detail: null, seq });
    } catch (e) {
      // Keep UI visible (full mode) to show error
      setUiMode("full");
      await totalMin;

      setStatus({
        phase: "error",
        message: "Boot failed.",
        detail: String(e?.message || e),
        seq: null,
      });
    }
  }, [transport]);

  React.useEffect(() => {
    if (!autoStart) return;

    // StrictMode mounts effects twice in dev; prevent double boot
    if (didAutoStartRef.current) return;
    didAutoStartRef.current = true;

    runBoot();
  }, [autoStart, runBoot]);

  const retry = React.useCallback(() => runBoot(), [runBoot]);

  const skip = React.useCallback(() => {
    if (!allowSkip) return;
    setUiMode("full");
    setStatus({
      phase: "operational",
      message: "Demo mode (boot skipped).",
      detail: null,
      seq: null,
    });
  }, [allowSkip]);

  // ✅ Always mount RfxBridge (so RFX store stays synced during boot)
  if (status.phase !== "operational") {
    return (
      <>
        <RfxBridge />
        <BootScreen
          mode={uiMode}
          status={status}
          onRetry={retry}
          onSkip={allowSkip ? skip : undefined}
        />
      </>
    );
  }

  return (
    <>
      <RfxBridge />
      {children}
    </>
  );
}