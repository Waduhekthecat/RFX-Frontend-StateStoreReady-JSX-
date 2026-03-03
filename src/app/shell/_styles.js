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

  // ✅ Column layout so content naturally becomes (RFX_H - nav)
  shellCol: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  // ✅ Fixed-height nav (no shrink)
  nav: {
    height: NAV_H,
    flex: "0 0 auto",
    overflow: "hidden",
  },

  // ✅ Remaining space, MUST allow shrink (minHeight: 0)
  content: {
    flex: "1 1 auto",
    minHeight: 0,
    overflow: "hidden",
  },
};