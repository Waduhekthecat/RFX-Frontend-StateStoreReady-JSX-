import React from "react";
import { useTransport } from "../../core/transport/TransportProvider";
import { useRfxActions } from "../../core/rfx/Util";
import { KnobRow } from "../../components/controls/knobs/KnobRow";
import { Panel } from "../../components/ui/Panel";
import { BusCardArea } from "./components/_index";
import { styles, KNOB_STRIP_H } from "./_styles";

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

  // ✅ Core mutation entrypoint (via your helper hook)
  const { dispatchIntent } = useRfxActions();

  const activeId = vm.activeBusId || "NONE";
  const knobs = React.useMemo(() => knobsForContext(activeId), [activeId]);

  return (
    <div className={styles.Root}>
      <div className={styles.Column}>
        {/* TOP: BUS GRID */}
        <div className={styles.Top}>
          <BusCardArea
            vm={vm}
            getRoutingMode={(busId) => normalizeMode(vm?.busModes?.[busId] || "linear")}
            onSelectBus={(busId) => dispatchIntent({ name: "selectActiveBus", busId })}
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