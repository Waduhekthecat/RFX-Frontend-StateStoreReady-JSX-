import React from "react";
import { RFX_W, RFX_H } from "../../app/Shell";
import rfxLogo from "../../assets/rfxLogo.png";
import { WaveformLoader } from "./WaveformLoader";

export function BootScreen({ mode = "logo", status, onRetry, onSkip }) {
  const [pct, setPct] = React.useState(0);
  const [logoOn, setLogoOn] = React.useState(false);
  const [fullOn, setFullOn] = React.useState(false);

  // Logo fades in immediately on mount
  React.useEffect(() => {
    const t = setTimeout(() => setLogoOn(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Full UI fades in when mode switches to "full"
  React.useEffect(() => {
    if (mode === "full") {
      const t = setTimeout(() => setFullOn(true), 40);
      return () => clearTimeout(t);
    }
    setFullOn(false);
  }, [mode]);

  // Start 5s progress only when full UI is shown
  React.useEffect(() => {
    if (mode !== "full") return;

    if (status.phase === "operational") {
      setPct(100);
      return;
    }
    if (status.phase === "error") return;

    setPct(0);
    const start = performance.now();
    const D = 5000;

    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / D);
      const eased = 1 - Math.pow(1 - p, 3);
      setPct(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, status.phase]);

  const centerLine =
    status.phase === "waitingForReady"
      ? "Cranking to 11…"
      : status.phase === "syncing"
        ? "Syncing signal architectures…"
        : status.phase === "error"
          ? "Boot failed."
          : "Initializing console environment…";

  const bottomRightLine =
    status.phase === "waitingForReady"
      ? "Cranking to 11…"
      : status.phase === "syncing"
        ? "Syncing signal architectures…"
        : status.phase === "error"
          ? "Error"
          : "Initializing…";

  return (
    <div
      style={{
        width: RFX_W,
        height: RFX_H,
        position: "relative",
        overflow: "hidden",
        background: "hsl(220 14% 8%)",
        color: "hsl(0 0% 96%)",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        userSelect: "none",
      }}
    >
      <style>{`
        @keyframes rfxScan { 0% { transform: translateY(0px); } 100% { transform: translateY(18px); } }
        @keyframes rfxNoise {
          0% { transform: translate3d(0,0,0); opacity: .06; }
          25% { transform: translate3d(-1px,1px,0); opacity: .05; }
          50% { transform: translate3d(1px,-1px,0); opacity: .065; }
          75% { transform: translate3d(1px,1px,0); opacity: .05; }
          100% { transform: translate3d(0,0,0); opacity: .06; }
        }
      `}</style>

      {/* Vignette */}
      <div
        aria-hidden
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 48%, rgba(0,0,0,0.62) 100%)",
        }}
      />

      {/* Scanlines */}
      <div
        aria-hidden
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: "-24px 0 0 0",
          background:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.040) 0px, rgba(255,255,255,0.040) 1px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)",
          opacity: 0.085,
          mixBlendMode: "overlay",
          animation: "rfxScan 2.6s linear infinite",
        }}
      />

      {/* Noise */}
      <div
        aria-hidden
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: "-40px",
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.07), rgba(255,255,255,0.07) 1px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 3px)",
          opacity: 0.06,
          mixBlendMode: "overlay",
          filter: "blur(0.35px)",
          animation: "rfxNoise 1.25s steps(2) infinite",
        }}
      />

      {/* Main layout */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
        }}
      >
        {/* ---------- LOGO (ANCHOR, NEVER MOVES) ---------- */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "46%", // anchor point for logo (tweak 45–48 if you want)
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          {/* VERY SUBTLE halo (barely visible) */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "50%",
              top: "48%",
              transform: "translate(-50%, -50%)",
              width: 520,
              height: 220,
              borderRadius: 999,
              background:
                "radial-gradient(closest-side, rgba(255,255,255,0.06), rgba(255,255,255,0) 72%)",
              filter: "blur(14px)",
              opacity: 0.28,
            }}
          />

          <img
            src={rfxLogo}
            alt="RFX"
            style={{
              width: 430,
              height: "auto",
              opacity: logoOn ? 0.995 : 0,
              transform: logoOn ? "translateY(0px)" : "translateY(6px)",
              transition: "opacity 700ms ease, transform 700ms ease",
              filter:
                "drop-shadow(0 14px 34px rgba(0,0,0,0.70)) " +
                "drop-shadow(0 0 18px rgba(255,255,255,0.12)) " +
                "drop-shadow(0 0 44px rgba(255,255,255,0.06))",
            }}
          />

          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              letterSpacing: 0.6,
              opacity: logoOn ? 0.66 : 0,
              transition: "opacity 700ms ease",
            }}
          >
            RFX Firmware v0.1.0
          </div>
        </div>

        {/* ---------- STATUS (APPEARS AT t=2s, DOES NOT AFFECT LOGO) ---------- */}
        {mode === "full" && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "62%", // places status below logo consistently
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
              opacity: fullOn ? 1 : 0,
              transformOrigin: "center",
              transition: "opacity 520ms ease",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 650, opacity: 0.92 }}>
              {centerLine}
            </div>

            {status.detail ? (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: "#ffb4b4",
                  opacity: 0.95,
                }}
              >
                {status.detail}
              </div>
            ) : null}
          </div>
        )}

        {/* ---------- BOTTOM (ONLY WHEN FULL) ---------- */}
        {mode === "full" && (
          <div
            style={{
              position: "absolute",
              left: 72,
              right: 72,
              bottom: 48,
              opacity: fullOn ? 1 : 0,
              transition: "opacity 520ms ease",
            }}
          >
            <WaveformLoader progress01={pct / 100} height={46} intensity={1.15} />

            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 12,
                opacity: 0.72,
              }}
            >
              <span>{pct}%</span>
              <span>{bottomRightLine}</span>
            </div>

            <div
              style={{
                marginTop: 18,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.55 }}>
                RFX Console — Boot Placeholder
              </div>

              <div style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
                {onSkip && status.phase !== "operational" && (
                  <button onClick={onSkip} style={buttonStyle}>
                    Skip boot
                  </button>
                )}

                {(status.phase === "error" || status.phase === "idle") && (
                  <button onClick={onRetry} style={buttonStyle}>
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "10px 16px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.10)",
  color: "white",
  fontSize: 12,
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
};