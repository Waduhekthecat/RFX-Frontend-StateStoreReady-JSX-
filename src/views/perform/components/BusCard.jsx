import React from "react";
import { Panel } from "../../../app/components/ui/Panel";
import { VerticalMeter } from "../../../app/components/meters/VerticalMeter";
import { RoutingWell } from "./RoutingWell";

export function BusCard({
  bus,
  isActive,
  meters = { l: 0, r: 0 },
  onSelect,

  // NEW: pass in routing mode per bus
  routingMode = "linear", // "linear" | "parallel" | "lcr"
}) {
  const busId = bus?.id || "FX_?";
  const label = bus?.label ?? busId;

  return (
    <Panel
      as="button"
      active={isActive}
      onClick={onSelect}
      className="h-full min-h-0 text-left"
    >
      <div className="h-full min-h-0 flex">
        {/* LEFT CONTENT */}
        <div className="flex-1 p-4 min-w-0 min-h-0 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold tracking-wide">{label}</div>

            {isActive && (
              <div className="text-[11px] px-2 py-0.5 rounded-full bg-white/15 border border-white/10">
                Active
              </div>
            )}
          </div>

          {/* Routing visualization */}
          <div className="flex-1 min-h-0">
            <RoutingWell busId={busId} mode={routingMode} active={isActive} />
          </div>
        </div>

        {/* RIGHT METERS */}
        <div className="px-3 py-2 flex items-stretch gap-2 min-h-0">
          <VerticalMeter value={meters.l} enabled={isActive} width={12} rounded={8} />
          <VerticalMeter value={meters.r} enabled={isActive} width={12} rounded={8} />
        </div>
      </div>
    </Panel>
  );
}