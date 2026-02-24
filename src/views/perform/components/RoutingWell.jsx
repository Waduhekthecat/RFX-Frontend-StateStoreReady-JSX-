import React from "react";
import { Inset } from "../../../app/components/ui/Panel";

function lanesForMode(mode) {
  const m = String(mode || "linear").toLowerCase();
  if (m === "lcr") return { A: true, B: true, C: true };
  if (m === "parallel") return { A: true, B: true, C: false };
  return { A: true, B: false, C: false }; // linear default
}

function ModeBadge({ mode }) {
  const m = String(mode || "linear").toUpperCase();
  return (
    <div className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/70">
      {m}
    </div>
  );
}

function LanePill({ name, on, active }) {
  return (
    <div
      className={[
        "flex items-center justify-between",
        "px-2 py-1 rounded-lg border",
        "min-w-0",
        on
          ? "bg-white/10 border-white/15"
          : "bg-black/20 border-white/5 opacity-45",
        active ? "ring-1 ring-green-400/40" : "",
      ].join(" ")}
    >
      <div className="text-[12px] font-semibold tracking-wide">{name}</div>
      <div
        className={[
          "text-[10px] px-2 py-0.5 rounded-full border",
          on
            ? "bg-green-400/10 text-green-200 border-green-400/20"
            : "bg-white/5 text-white/40 border-white/10",
        ].join(" ")}
      >
        {on ? "ON" : "OFF"}
      </div>
    </div>
  );
}

/**
 * RoutingWell
 * Visualizes A/B/C lane participation for the bus routing mode.
 *
 * Props:
 * - busId: "FX_1"
 * - mode: "linear" | "parallel" | "lcr"
 * - active: highlight (if bus card is selected)
 */
export function RoutingWell({ busId = "FX_1", mode = "linear", active = false }) {
  const on = lanesForMode(mode);

  return (
    <Inset className="h-full min-h-0 p-3 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold tracking-wide text-white/70">
          ROUTING
        </div>
        <ModeBadge mode={mode} />
      </div>

      {/* Lane rows */}
      <div className="flex flex-col gap-2 min-h-0">
        <LanePill name={`${busId}A`} on={on.A} active={active && on.A} />
        <LanePill name={`${busId}B`} on={on.B} active={active && on.B} />
        <LanePill name={`${busId}C`} on={on.C} active={active && on.C} />
      </div>

      {/* Footer hint (optional) */}
      <div className="pt-1 text-[10px] text-white/35">
        Linear: A • Parallel: A+B • LCR: A+B+C
      </div>
    </Inset>
  );
}