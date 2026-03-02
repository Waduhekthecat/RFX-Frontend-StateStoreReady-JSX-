import React from "react";
import { BootScreen } from "../BootScreen";
import { useTransport } from "../../../core/transport/TransportProvider";
import { RfxBridge } from "../../../core/rfx/RfxBridge";
import { useRfxActions } from "../../../core/rfx/Util";

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
  const { dispatchIntent } = useRfxActions();

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
    setUiMode("logo");
    setStatus({ phase: "idle", message: "Initializing…", detail: null, seq: null });

    const totalMin = sleep(7000);

    try {
      await sleep(2000);
      setUiMode("full");

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
        await sleep(600);
        seq = 1;
      }

      setStatus({ phase: "syncing", message: "Syncing view snapshot…", detail: null, seq });

      await dispatchIntent({ name: "syncView" });

      await totalMin;

      setStatus({ phase: "operational", message: "Operational.", detail: null, seq });
    } catch (e) {
      setUiMode("full");
      await totalMin;

      setStatus({
        phase: "error",
        message: "Boot failed.",
        detail: String(e?.message || e),
        seq: null,
      });
    }
  }, [transport, dispatchIntent]);

  React.useEffect(() => {
    if (!autoStart) return;
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