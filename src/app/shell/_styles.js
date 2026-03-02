export const RFX_W = 1280;
export const RFX_H = 800;
export const NAV_H = 56;

export const styles = {
  frame: {
    width: RFX_W,
    height: RFX_H,
    overflow: "hidden",
    background: "hsl(220 14% 8%)",
    color: "hsl(0 0% 96%)",
    fontFamily:
      "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    userSelect: "none",
  },
  nav: {
    height: NAV_H,
    overflow: "hidden",
  },
  content: {
    height: RFX_H - NAV_H,
    overflow: "hidden",
  },
};