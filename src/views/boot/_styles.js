import { RFX_W, RFX_H } from "../../app/shell/_styles";

export const bootCss = `
@keyframes rfxScan { 0% { transform: translateY(0px); } 100% { transform: translateY(18px); } }
@keyframes rfxNoise {
  0% { transform: translate3d(0,0,0); opacity: .06; }
  25% { transform: translate3d(-1px,1px,0); opacity: .05; }
  50% { transform: translate3d(1px,-1px,0); opacity: .065; }
  75% { transform: translate3d(1px,1px,0); opacity: .05; }
  100% { transform: translate3d(0,0,0); opacity: .06; }
}
`;

export const styles = {
  screen: {
    width: RFX_W,
    height: RFX_H,
    position: "relative",
    overflow: "hidden",
    background: "hsl(220 14% 8%)",
    color: "hsl(0 0% 96%)",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    userSelect: "none",
  },

  vignette: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(ellipse at center, rgba(0,0,0,0) 48%, rgba(0,0,0,0.62) 100%)",
  },

  scanlines: {
    pointerEvents: "none",
    position: "absolute",
    inset: "-24px 0 0 0",
    background:
      "repeating-linear-gradient(to bottom, rgba(255,255,255,0.040) 0px, rgba(255,255,255,0.040) 1px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)",
    opacity: 0.085,
    mixBlendMode: "overlay",
    animation: "rfxScan 2.6s linear infinite",
  },

  noise: {
    pointerEvents: "none",
    position: "absolute",
    inset: "-40px",
    background:
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.07), rgba(255,255,255,0.07) 1px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 3px)",
    opacity: 0.06,
    mixBlendMode: "overlay",
    filter: "blur(0.35px)",
    animation: "rfxNoise 1.25s steps(2) infinite",
  },

  main: { position: "relative", zIndex: 2, width: "100%", height: "100%" },

  logoAnchor: {
    position: "absolute",
    left: "50%",
    top: "46%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    pointerEvents: "none",
  },

  logoHalo: {
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
  },

  fwLine: (logoOn) => ({
    marginTop: 10,
    fontSize: 12,
    letterSpacing: 0.6,
    opacity: logoOn ? 0.66 : 0,
    transition: "opacity 700ms ease",
  }),

  status: (fullOn) => ({
    position: "absolute",
    left: "50%",
    top: "62%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    pointerEvents: "none",
    opacity: fullOn ? 1 : 0,
    transformOrigin: "center",
    transition: "opacity 520ms ease",
  }),

  bottom: (fullOn) => ({
    position: "absolute",
    left: 72,
    right: 72,
    bottom: 48,
    opacity: fullOn ? 1 : 0,
    transition: "opacity 520ms ease",
  }),

  bottomRow: {
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    opacity: 0.72,
  },

  bottomActions: {
    marginTop: 18,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bottomActionsRight: { display: "flex", gap: 10, pointerEvents: "auto" },

  button: {
    padding: "10px 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.10)",
    color: "white",
    fontSize: 12,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
  },
};