import React from "react";
import { Knob } from "./Knob";

export function KnobRow({ knobs }) {
  const [values, setValues] = React.useState({});

  // ✅ limit to 7 knobs for touch-friendly sizing
  const visibleKnobs = React.useMemo(() => (knobs || []).slice(0, 7), [knobs]);

  React.useEffect(() => {
    const next = {};
    for (const k of visibleKnobs) next[k.id] = k.value;
    setValues(next);
  }, [visibleKnobs]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: `repeat(${visibleKnobs.length || 1}, 1fr)`,
          justifyItems: "center",
          alignItems: "end",
          padding: "10px 36px",
          borderRadius: 13,
          background: `
            linear-gradient(
              180deg,
              rgba(255,255,255,0.08),
              rgba(255,255,255,0.02) 0%,
              rgba(0,0,0,0.45)
            ),
            repeating-linear-gradient(
              90deg,
              rgba(255,255,255,0.03) 0px,
              rgba(255,255,255,0.03) 1px,
              transparent 1px,
              transparent 3px
            ),
            #1a1a1a
          `,
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.20),
            inset 0 -8px 18px rgba(0,0,0,0.7),
            0 20px 40px rgba(0,0,0,0.6)
          `,
        }}
      >
        {visibleKnobs.map((k) => (
          <Knob
            key={k.id}
            label={k.label}
            mapped={!!k.mapped}
            mappedLabel={k.mapped ? "Mapped" : ""}
            value={values[k.id] ?? k.value}
            onChange={(next) =>
              setValues((prev) => ({ ...prev, [k.id]: next }))
            }
          />
        ))}
      </div>
    </div>
  );
}