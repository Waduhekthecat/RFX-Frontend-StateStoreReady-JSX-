// src/components/controls/knobs/KnobRow.jsx
import React from "react";
import { Knob } from "./Knob";
import { styles } from "./_styles";

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
    <div style={styles.rowOuter}>
      <div style={styles.rowGrid(visibleKnobs.length)}>
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