import React from "react";
import { BootScreen } from "../BootScreen";
import { useTransport } from "../../../core/transport/TransportProvider";
import { RfxBridge } from "../../../core/rfx/RfxBridge";
import { useIntent } from "../../../core/useIntent";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mapBootStateToUi(bootState, ready) {
  if (ready || bootState === "READY") {
    return {
      phase: "operational",
      message: "Operational.",
      detail: null,
    };
  }

  switch (bootState) {
    case "STARTING":
      return {
        phase: "booting",
        message: "Initializing console environment…",
        detail: null,
      };

    case "IPC_READY":
      return {
        phase: "syncing",
        message: "Syncing view snapshot…",
        detail: null,
      };

    case "REAPER_LAUNCHING":
      return {
        phase: "waitingForReady",
        message: "Launching REAPER…",
        detail: null,
      };

    case "WAITING_FOR_REAPER":
      return {
        phase: "waitingForReady",
        message: "Waiting for REAPER handshake…",
        detail: null,
      };

    default:
      return {
        phase: "booting",
        message: "Initializing…",
        detail: null,
      };
  }
}

export function BootGate({ children, allowSkip = true, autoStart = true }) {
  const transport = useTransport();
  const intent = useIntent();

  const [uiMode, setUiMode] = React.useState("logo");
  const [status, setStatus] = React.useState({
    phase: "idle",
    message: "Initializing…",
    detail: null,
    seq: null,
  });

  const didAutoStartRef = React.useRef(false);
  const bootRunIdRef = React.useRef(0);

  const runBoot = React.useCallback(async () => {
    const runId = ++bootRunIdRef.current;

    setUiMode("logo");
    setStatus({
      phase: "idle",
      message: "Initializing…",
      detail: null,
      seq: null,
    });

    try {
      await sleep(800);

      if (bootRunIdRef.current !== runId) return;
      setUiMode("full");

      setStatus({
        phase: "booting",
        message: "Starting…",
        detail: null,
        seq: null,
      });

      if (typeof transport?.boot === "function") {
        const res = await transport.boot();
        if (!res || res.ok === false) {
          throw new Error(res?.error || "Boot failed.");
        }
      }

      let seeded = { bootState: "STARTING", reaperReady: false };
      if (typeof transport?.getBootState === "function") {
        const snap = await transport.getBootState();
        seeded = {
          bootState: snap?.bootState || "STARTING",
          reaperReady: !!snap?.reaperReady,
        };
      }

      if (bootRunIdRef.current !== runId) return;

      const nextUi = mapBootStateToUi(seeded.bootState, seeded.reaperReady);

      setStatus({
        phase: nextUi.phase,
        message: nextUi.message,
        detail: nextUi.detail,
        seq: null,
      });

      if (seeded.reaperReady || seeded.bootState === "READY") {
        try {
          await intent({ name: "syncView" });
        } catch {}
        if (bootRunIdRef.current !== runId) return;
        setStatus({
          phase: "operational",
          message: "Operational.",
          detail: null,
          seq: null,
        });
      }
    } catch (e) {
      if (bootRunIdRef.current !== runId) return;

      setUiMode("full");
      setStatus({
        phase: "error",
        message: "Boot failed.",
        detail: String(e?.message || e),
        seq: null,
      });
    }
  }, [transport, intent]);

  React.useEffect(() => {
    if (!autoStart) return;
    if (didAutoStartRef.current) return;
    didAutoStartRef.current = true;
    runBoot();
  }, [autoStart, runBoot]);

  React.useEffect(() => {
    if (!transport) return;

    const offBootState =
      typeof transport.onBootState === "function"
        ? transport.onBootState((nextBootState) => {
            setStatus((prev) => {
              if (prev.phase === "error" || prev.phase === "operational") {
                return prev;
              }

              const nextUi = mapBootStateToUi(nextBootState, false);
              return {
                ...prev,
                phase: nextUi.phase,
                message: nextUi.message,
                detail: nextUi.detail,
              };
            });
          })
        : null;

    const offReaperReady =
      typeof transport.onReaperReady === "function"
        ? transport.onReaperReady(async (ready) => {
            if (!ready) return;

            try {
              await intent({ name: "syncView" });
            } catch {}

            setStatus({
              phase: "operational",
              message: "Operational.",
              detail: null,
              seq: null,
            });
          })
        : null;

    return () => {
      try {
        offBootState?.();
      } catch {}

      try {
        offReaperReady?.();
      } catch {}
    };
  }, [transport, intent]);

  const retry = React.useCallback(() => {
    runBoot();
  }, [runBoot]);

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