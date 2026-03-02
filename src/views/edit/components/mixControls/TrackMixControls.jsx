// src/views/edit/components/mixControls/TrackMixControls.jsx
import React from "react";
import { Slider } from "../../../../components/controls/sliders/_index";
import { useIntentBuffered } from "../../../../core/useIntentBuffered";

function clamp01(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function panTextFrom01(pan01) {
  const p = pan01 * 2 - 1; // -1..+1
  if (Math.abs(p) < 0.01) return "C";
  return p < 0 ? `L${Math.round(Math.abs(p) * 100)}` : `R${Math.round(p * 100)}`;
}

export function TrackMixControls({ trackGuid }) {
  const { send, flush } = useIntentBuffered({ intervalMs: 50 });

  const [vol01, setVol01] = React.useState(0.8);
  const [pan01, setPan01] = React.useState(0.5);

  React.useEffect(() => {
    setVol01(0.8);
    setPan01(0.5);
  }, [trackGuid]);

  const keyVol = `${trackGuid}:trackVol`;
  const keyPan = `${trackGuid}:trackPan`;

  return (
    // ✅ Flush when user releases pointer anywhere in this control row
    <div className="flex items-center gap-2" onPointerUp={flush} onPointerCancel={flush}>
      <Slider
        label="VOL"
        min={0}
        max={1}
        step={0.01}
        value={vol01}
        valueText={`${Math.round(vol01 * 100)}%`}
        widthClass="w-[160px]"
        onChange={(v) => {
          const next = clamp01(v);
          setVol01(next);
          send(keyVol, { name: "setTrackVolume", trackGuid, value: next });
        }}
      />

      <Slider
        label="PAN"
        min={0}
        max={1}
        step={0.01}
        value={pan01}
        valueText={panTextFrom01(pan01)}
        widthClass="w-[160px]"
        onChange={(v) => {
          const next = clamp01(v);
          setPan01(next);
          send(keyPan, { name: "setTrackPan", trackGuid, value: next * 2 - 1 });
        }}
      />
    </div>
  );
}