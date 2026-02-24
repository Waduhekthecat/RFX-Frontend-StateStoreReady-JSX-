import React from "react";
import { BusCard } from "./BusCard";

export function BusCardArea({ vm, onSelectBus, getRoutingMode }) {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full min-h-0">
      {vm.buses.map((b) => {
        const isActive = vm.activeBusId === b.id;
        const m = vm.meters[b.id] || { l: 0, r: 0 };

        // ✅ routing mode priority:
        // 1) vm.busModes (new)
        // 2) getRoutingMode fallback (older PerformView helper)
        const routingMode =
          (vm.busModes && vm.busModes[b.id]) ||
          (getRoutingMode ? getRoutingMode(b.id) : "linear");

        return (
          <BusCard
            key={b.id}
            bus={b}
            isActive={isActive}
            meters={m}
            routingMode={routingMode}
            onSelect={() => onSelectBus?.(b.id)}
          />
        );
      })}
    </div>
  );
}