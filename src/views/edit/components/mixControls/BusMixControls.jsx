import React from "react";
import { Slider } from "../../../../components/controls/sliders/_index";

function clamp01(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/**
 * BusMixControls
 * - Shows only BUS volume (0..1)
 * - Sends: { name:"setBusVolume", busId, value }
 *
 * NOTE: This is a new intent name (bus-specific) so it won't clash with track volume.
 */
export function BusMixControls({ busId, intent }) {
  const [vol01, setVol01] = React.useState(0.8);

  React.useEffect(() => {
    setVol01(0.8);
  }, [busId]);

  return (
    <div className="flex items-center gap-2">
      <Slider
        label="BUS"
        min={0}
        max={1}
        step={0.01}
        value={vol01}
        valueText={`${Math.round(vol01 * 100)}%`}
        widthClass="w-[160px]"
        onChange={(v) => {
          const next = clamp01(v);
          setVol01(next);
          intent?.({ name: "setBusVolume", busId, value: next });
        }}
      />
    </div>
  );
}