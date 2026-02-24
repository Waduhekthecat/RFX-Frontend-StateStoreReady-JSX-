import React from "react";
import { useTransport } from "../../core/transport/TransportProvider";
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

// ✅ temporary helper until routingMode comes from vm.buses / view.json
function mockRoutingModeForBus(busId) {
  if (busId === "FX_1") return "linear";
  if (busId === "FX_2") return "parallel";
  if (busId === "FX_3") return "lcr";
  if (busId === "FX_4") return "parallel";
  return "linear";
}

export function PerformView() {
  const t = useTransport();
  const vm = useVM();

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
            getRoutingMode={(busId) => mockRoutingModeForBus(busId)}
            onSelectBus={(busId) =>
              t.syscall({ name: "selectActiveBus", busId })
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