import React from "react";
import { useRfxStore } from "../../core/rfx/Store";
import { useRfxActions } from "../../core/rfx/Util";
import { KnobRow } from "../../components/controls/knobs/KnobRow";
import { Panel } from "../../components/ui/Panel";
import { BusCardArea } from "./components/_index";
import { styles, KNOB_STRIP_H } from "./_styles";

function knobsForContext(ctx) {
  return Array.from({ length: 8 }).map((_, i) => ({
    id: `${ctx || "NONE"}_k${i + 1}`,
    label: `K${i + 1}`,
    value: 0.5,
    mapped: false,
  }));
}

function normalizeMode(m) {
  const x = String(m || "linear").toLowerCase();
  if (x === "lcr") return "lcr";
  if (x === "parallel") return "parallel";
  return "linear";
}

export function PerformView() {
  const { dispatchIntent } = useRfxActions();

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
  const knobs = React.useMemo(() => knobsForContext(activeId), [activeId]);

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
              dispatchIntent({ name: "selectActiveBus", busId })
            }
          />
        </div>

        {/* BOTTOM: KNOB STRIP */}
        <Panel
          className={styles.KnobPanel}
          style={{ height: KNOB_STRIP_H, flex: `0 0 ${KNOB_STRIP_H}px` }}
        >
          <KnobRow knobs={knobs} />
        </Panel>
      </div>
    </div>
  );
}