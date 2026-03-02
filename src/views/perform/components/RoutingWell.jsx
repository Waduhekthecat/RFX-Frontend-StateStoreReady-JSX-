import React from "react";
import { Inset } from "../../../components/ui/Panel";
import { styles } from "../_styles";

function lanesForMode(mode) {
  const m = String(mode || "linear").toLowerCase();
  if (m === "lcr") return { A: true, B: true, C: true };
  if (m === "parallel") return { A: true, B: true, C: false };
  return { A: true, B: false, C: false }; // linear default
}

function ModeBadge({ mode }) {
  const m = String(mode || "linear").toUpperCase();
  return <div className={styles.ModeBadge}>{m}</div>;
}

function LanePill({ name, on, active }) {
  return (
    <div
      className={[
        styles.LanePillBase,
        on ? styles.LanePillOn : styles.LanePillOff,
        active ? styles.LanePillActiveRing : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="text-[12px] font-semibold tracking-wide">{name}</div>
      <div
        className={[
          styles.LaneStatePillBase,
          on ? styles.LaneStateOn : styles.LaneStateOff,
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
    <Inset className={styles.RoutingWellRoot}>
      {/* Header */}
      <div className={styles.RoutingWellHeader}>
        <div className={styles.RoutingWellTitle}>ROUTING</div>
        <ModeBadge mode={mode} />
      </div>

      {/* Lane rows */}
      <div className="flex flex-col gap-2 min-h-0">
        <LanePill name={`${busId}A`} on={on.A} active={active && on.A} />
        <LanePill name={`${busId}B`} on={on.B} active={active && on.B} />
        <LanePill name={`${busId}C`} on={on.C} active={active && on.C} />
      </div>

      {/* Footer hint */}
      <div className={styles.RoutingWellFooter}>
        Linear: A • Parallel: A+B • LCR: A+B+C
      </div>
    </Inset>
  );
}