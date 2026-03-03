import React from "react";
import { useRfxStore } from "../../core/rfx/Store";
import { useIntent } from "../../core/useIntent";
import { KnobRow } from "../../components/controls/knobs/KnobRow";
import { Panel } from "../../components/ui/Panel";
import { BusCardArea } from "./components/_index";
import { styles, KNOB_STRIP_H } from "./_styles";

function normalizeMode(m) {
  const x = String(m || "linear").toLowerCase();
  if (x === "lcr") return "lcr";
  if (x === "parallel") return "parallel";
  return "linear";
}

export function PerformView() {
  const intent = useIntent();
  const knobValuesByBusId = useRfxStore((s) => s.perf?.knobValuesByBusId || {});
  const knobMapByBusId = useRfxStore((s) => s.perf?.knobMapByBusId || {});
  const mappingArmed = useRfxStore((s) => s.perf?.mappingArmed || null);

  // Pull normalized bus/perf state from the store
  const buses = useRfxStore((s) => s.perf?.buses || []);
  const activeBusId = useRfxStore(
    (s) => s.perf?.activeBusId || s.meters?.activeBusId || null
  );
  const busModesById = useRfxStore((s) => s.perf?.busModesById || {});
  const metersById = useRfxStore((s) => s.meters?.byId || {});

  // Provide a VM-like object for BusCardArea so you don't have to refactor it yet
  const vm = React.useMemo(() => {
    return {
      buses,
      activeBusId: activeBusId || (buses[0]?.id ?? "NONE"),
      busModes: busModesById, // keep the old key name BusCardArea expects
      meters: metersById,     // if BusCardArea reads meters[busId]
    };
  }, [buses, activeBusId, busModesById, metersById]);

  const activeId = vm.activeBusId || "NONE";

  const knobs = React.useMemo(() => {
    const busId = String(activeId || "NONE");
    const values = knobValuesByBusId?.[busId] || {};
    const maps = knobMapByBusId?.[busId] || {};

    // 8 defined, KnobRow will show first 7
    return Array.from({ length: 8 }).map((_, i) => {
      const knobId = `${busId}_k${i + 1}`;
      const target = maps[knobId] || null;

      const mappedLabel = target
        ? `${target.fxName || "FX"} • ${target.paramName || `#${target.paramIdx}`}`
        : "";

      return {
        id: knobId,
        label: `K${i + 1}`,
        value: Number.isFinite(values[knobId]) ? values[knobId] : 0.5,
        mapped: !!target,
        mappedLabel,
      };
    });
  }, [activeId, knobValuesByBusId, knobMapByBusId]);

  return (
    <div className={styles.Root}>
      <div className={styles.Column}>
        {/* TOP: BUS GRID */}
        <div className={styles.Top}>
          <BusCardArea
            vm={vm}
            getRoutingMode={(busId) =>
              normalizeMode(vm?.busModes?.[busId] || "linear")
            }
            onSelectBus={(busId) =>
              intent({ name: "selectActiveBus", busId })
            }
          />
        </div>

        {/* BOTTOM: KNOB STRIP */}
        <Panel
          className={styles.KnobPanel}
          style={{ height: KNOB_STRIP_H, flex: `0 0 ${KNOB_STRIP_H}px` }}
        >
          <KnobRow knobs={knobs} busId={activeId} mappingArmed={mappingArmed} />
        </Panel>
      </div>
    </div>
  );
}