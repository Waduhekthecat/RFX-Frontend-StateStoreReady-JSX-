import React from "react";
import rfxLogo from "../../assets/rfxLogo.png";
import { WaveformLoader } from "./WaveformLoader";
import { styles, bootCss } from "./_styles";

export function BootScreen({ mode = "logo", status, onRetry, onSkip }) {
  const [pct, setPct] = React.useState(0);
  const [logoOn, setLogoOn] = React.useState(false);
  const [fullOn, setFullOn] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setLogoOn(true), 30);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (mode === "full") {
      const t = setTimeout(() => setFullOn(true), 40);
      return () => clearTimeout(t);
    }
    setFullOn(false);
  }, [mode]);

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
    <div style={styles.screen}>
      <style>{bootCss}</style>

      <div aria-hidden style={styles.vignette} />
      <div aria-hidden style={styles.scanlines} />
      <div aria-hidden style={styles.noise} />

      <div style={styles.main}>
        {/* LOGO (ANCHOR) */}
        <div style={styles.logoAnchor}>
          <div aria-hidden style={styles.logoHalo} />

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

          <div style={styles.fwLine(logoOn)}>RFX Firmware v0.1.0</div>
        </div>

        {/* STATUS */}
        {mode === "full" && (
          <div style={styles.status(fullOn)}>
            <div style={{ fontSize: 18, fontWeight: 650, opacity: 0.92 }}>
              {centerLine}
            </div>

            {status.detail ? (
              <div style={{ marginTop: 10, fontSize: 13, color: "#ffb4b4", opacity: 0.95 }}>
                {status.detail}
              </div>
            ) : null}
          </div>
        )}

        {/* BOTTOM */}
        {mode === "full" && (
          <div style={styles.bottom(fullOn)}>
            <WaveformLoader progress01={pct / 100} height={46} intensity={1.15} />

            <div style={styles.bottomRow}>
              <span>{pct}%</span>
              <span>{bottomRightLine}</span>
            </div>

            <div style={styles.bottomActions}>
              <div style={{ fontSize: 12, opacity: 0.55 }}>RFX Console — Boot Placeholder</div>

              <div style={styles.bottomActionsRight}>
                {onSkip && status.phase !== "operational" && (
                  <button onClick={onSkip} style={styles.button}>
                    Skip boot
                  </button>
                )}

                {(status.phase === "error" || status.phase === "idle") && (
                  <button onClick={onRetry} style={styles.button}>
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