// src/views/perform/PerformView.jsx
import React from "react";
import { useTransport } from "../../core/transport/TransportProvider";
import { useRfxStore } from "../../core/rfx/Store";
import { KnobRow } from "../../app/components/knobs/KnobRow";
import { Panel } from "../../app/components/ui/Panel";
import { BusCardArea } from "./components/BusCardArea";

function useVM() {
  const t = useTransport();
  const [vm, setVm] = React.useState(() => t.getSnapshot());
  React.useEffect(() => t.subscribe(setVm), [t]);
  return vm;
}

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
  const vm = useVM();

  // ✅ Core mutation entrypoint
  const dispatchIntent = useRfxStore((s) => s.dispatchIntent);

  const activeId = vm.activeBusId || "NONE";
  const knobs = React.useMemo(() => knobsForContext(activeId), [activeId]);

  const KNOB_STRIP_H = 185;

  return (
    <div className="h-full w-full p-3 min-h-0">
      <div className="h-full min-h-0 flex flex-col gap-3">
        {/* TOP: BUS GRID */}
        <div className="flex-1 min-h-0">
          <BusCardArea
            vm={vm}
            // ✅ routing mode now comes from VM (mock) instead of hardcoded helper
            getRoutingMode={(busId) => normalizeMode(vm?.busModes?.[busId] || "linear")}
            // ✅ was transport.syscall → now dispatchIntent
            onSelectBus={(busId) =>
              dispatchIntent({ name: "selectActiveBus", busId })
            }
          />
        </div>

        {/* BOTTOM: KNOB STRIP */}
        <Panel
          className="min-h-0"
          style={{ height: KNOB_STRIP_H, flex: `0 0 ${KNOB_STRIP_H}px` }}
        >
          <KnobRow knobs={knobs} />
        </Panel>
      </div>
    </div>
  );
}