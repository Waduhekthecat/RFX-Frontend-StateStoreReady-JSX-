import { Outlet } from "react-router-dom";

export const RFX_W = 1280;
export const RFX_H = 800;
export const NAV_H = 56;

export function Shell({ nav }) {
  return (
    <div
      style={{
        width: RFX_W,
        height: RFX_H,
        overflow: "hidden",
        background: "hsl(220 14% 8%)",
        color: "hsl(0 0% 96%)",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        userSelect: "none",
      }}
    >
      {/* NAV (fixed height) */}
      <div style={{ height: NAV_H, overflow: "hidden" }}>{nav}</div>

      {/* CONTENT (fixed remainder) */}
      <div style={{ height: RFX_H - NAV_H, overflow: "hidden" }}>
        <Outlet />
      </div>
    </div>
  );
}