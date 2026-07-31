// src/components/controls/knobs/_styles.js

export const SPRITE_FRAMES = 200;
export const RENDER_SIZE = 140;
export const CENTER_FRAME = 96; // “straight up” frame index in the strip

export const styles = {
  // ---- Knob ----
  knobWrap: {
    width: "100%",
    height: "100%",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
    boxSizing: "border-box",
  },

  // knobFace: ({ dragging, mapDragActive, canAcceptMap, mapDragOver, longPressing }) => ({    
  // knobFace: ({ dragging, mapDragActive, canAcceptMap, mapDragOver, pressing }) => ({    
  knobFace: ({ dragging, mapDragActive, canAcceptMap, mapDragOver, pressing, interactive }) => ({
    width: RENDER_SIZE,
    height: RENDER_SIZE,
    borderRadius: 999,
    overflow: "hidden",
    position: "relative",
    touchAction: "none",
    // cursor: "ns-resize",
    cursor: interactive ? "ns-resize" : "default",
    background: "transparent",
    border: "none",
    transform: mapDragOver ? "scale(1.06)" : "scale(1)",
    transition: "transform 120ms ease, filter 120ms ease",
    filter: mapDragOver
      ? "drop-shadow(0px 0px 18px rgba(142,224,255,0.48)) drop-shadow(0px 16px 26px rgba(0,0,0,0.78))"
      // : longPressing
      : pressing
        ? "drop-shadow(0px 0px 14px rgba(142,224,255,0.34)) drop-shadow(0px 16px 26px rgba(0,0,0,0.80))"
        : mapDragActive && canAcceptMap
          ? "drop-shadow(0px 0px 10px rgba(142,224,255,0.30)) drop-shadow(0px 16px 26px rgba(0,0,0,0.82))"
          : dragging
            // ? "drop-shadow(0px 8px 14px rgba(0,0,0,0.60))"
            ? "drop-shadow(0px 0px 14px rgba(142,224,255,0.34)) drop-shadow(0px 16px 26px rgba(0,0,0,0.80))"
            : "drop-shadow(0px 16px 26px rgba(0,0,0,0.85))",
  }),

  knobImg: (stripW, stripH, y) => ({
    position: "absolute",
    left: "50%",
    top: 0,
    width: stripW,
    height: stripH,
    transform: `translateX(-50%) translateY(${y}px)`,
    userSelect: "none",
    WebkitUserSelect: "none",
    pointerEvents: "none",
  }),

  labelWrap: {
    textAlign: "center",
    width: "100%",
    marginTop: -10,
  },

  label: {
    fontSize: 11,
    fontWeight: 700,
    lineHeight: "12px",
  },

  mappedLabel: {
    marginTop: 2,
    fontSize: 10,
    opacity: 0.6,
    lineHeight: "11px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  // ---- KnobRow ----
  rowOuter: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
    borderRadius: 13,
  },

  rowGrid: (count) => ({
    width: "100%",
    height: "100%",
    display: "grid",
    gridTemplateColumns: `repeat(${count || 1}, minmax(0, 1fr))`,
    alignItems: "start",
    boxSizing: "border-box",
    paddingBlock: 20,
    paddingInline: 0,
    borderRadius: 13,
  }),

  expandToggleBtn: {
    // marginTop: 20,
    // width: "100%",
    // maxWidth: 100,
    // height: 100,
    // borderRadius: 30,
    // alignSelf: "start",
    width: 64,
    height: 40,
    borderRadius: 20,
    alignSelf: "center",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.35))",
    color: "rgba(255,255,255,0.9)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    // gap: 4,
    // cursor: "none",
    cursor: "pointer",
    boxShadow: "0 16px 26px rgba(0,0,0,0.75)",
    transition: "transform 120ms ease, filter 120ms ease",
  },

  expandToggleGlyph: {
    fontSize: 24,
    lineHeight: "24px",
    fontWeight: 700,
  },

  expandToggleText: {
    fontSize: 11,
    letterSpacing: "0.08em",
    fontWeight: 700,
  },
};
