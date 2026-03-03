// src/components/controls/knobs/KnobRow.jsx
import React from "react";
import { Knob } from "./Knob";
import { styles } from "./_styles";
import { useIntentBuffered } from "../../../core/useIntentBuffered";
import { useRfxStore } from "../../../core/rfx/Store";

function clamp01(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

export function KnobRow({ knobs, busId, mappingArmed }) {
  const { send, flush } = useIntentBuffered({ intervalMs: 50 });

  const setKnobValueLocal = useRfxStore((s) => s.setKnobValueLocal);
  const commitKnobMapping = useRfxStore((s) => s.commitKnobMapping);

  // For knob -> param routing
  const knobMapByBusId = useRfxStore((s) => s.perf?.knobMapByBusId || {});
  const busKey = String(busId || "NONE");
  const mapForBus = knobMapByBusId?.[busKey] || {};

  // ✅ limit to 7 knobs for touch-friendly sizing
  const visibleKnobs = React.useMemo(() => (knobs || []).slice(0, 7), [knobs]);

  // Local UI values for super smooth knob feel
  const [values, setValues] = React.useState({});

  React.useEffect(() => {
    const next = {};
    for (const k of visibleKnobs) next[k.id] = clamp01(k.value);
    setValues(next);
  }, [visibleKnobs]);

  const onKnobChange = React.useCallback(
    (knobId, next01) => {
      const v01 = clamp01(next01);

      // 1) immediate UI state
      setValues((prev) => ({ ...prev, [knobId]: v01 }));

      // 2) persist local knob value per bus in store (so switching buses keeps positions)
      setKnobValueLocal({ busId: busKey, knobId, value01: v01 });

      // 3) if mapped, send buffered setParamValue
      const target = mapForBus?.[knobId];
      if (target?.fxGuid && Number.isFinite(Number(target?.paramIdx))) {
        const key = `${target.fxGuid}:param:${Number(target.paramIdx)}:knob:${knobId}`;
        send(key, {
          name: "setParamValue",
          trackGuid: target.trackGuid, // ok to include; transport will ignore if it wants
          fxGuid: target.fxGuid,
          paramIdx: Number(target.paramIdx),
          value01: v01,
        });
      }
    },
    [busKey, mapForBus, send, setKnobValueLocal]
  );

  const onKnobCommit = React.useCallback(() => {
    flush();
  }, [flush]);

  const onKnobTap = React.useCallback(
    (knobId) => {
      // If mapping is armed, tapping a knob assigns it.
      if (!mappingArmed) return;
      commitKnobMapping({ busId: busKey, knobId });
    },
    [mappingArmed, commitKnobMapping, busKey]
  );

  return (
    <div style={styles.rowOuter}>
      <div style={styles.rowGrid(visibleKnobs.length)}>
        {visibleKnobs.map((k) => (
          <Knob
            key={k.id}
            id={k.id}
            label={k.label}
            mapped={!!k.mapped}
            mappedLabel={k.mappedLabel || (k.mapped ? "Mapped" : "")}
            value={values[k.id] ?? k.value}
            mappingArmed={!!mappingArmed}
            onTap={onKnobTap}
            onChange={(next) => onKnobChange(k.id, next)}
            onCommit={onKnobCommit}
          />
        ))}
      </div>
    </div>
  );
}