import React from "react";
import { Inset } from "../../../app/components/ui/Panel";

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(arr, idx) {
  return arr[idx % arr.length];
}

const VENDORS = ["Neural DSP", "Valhalla", "FabFilter", "Soundtoys", "Tokyo Dawn", "IK", "Waves", "UAD"];
const FX = [
  "Compressor", "Limiter", "EQ", "Tape", "Chorus", "Flanger", "Phaser",
  "Plate Reverb", "Hall Reverb", "Delay", "Ping Pong Delay", "Saturation",
  "Amp Sim", "Cab IR", "Gate", "Multiband", "Stereo Widener",
];

export function makeMockPlugins(busId, count = 6) {
  const seed = hashStr(busId || "BUS");
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = seed + i * 1013;
    const vendor = pick(VENDORS, a);
    const name = pick(FX, a >>> 3);
    const enabled = ((a >>> 7) % 6) !== 0; // mostly enabled
    out.push({
      id: `${busId}_fx_${i}`,
      index: i + 1,
      vendor,
      name,
      enabled,
    });
  }
  return out;
}

function Row({ fx, active }) {
  return (
    <div
      className={[
        "flex items-center gap-2",
        "px-2 py-1.5 rounded-lg",
        active ? "bg-white/10 border border-white/10" : "bg-white/0",
      ].join(" ")}
    >
      <div className="w-5 text-[11px] opacity-60 tabular-nums">{fx.index}</div>

      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold leading-tight truncate">
          {fx.name}
        </div>
        <div className="text-[11px] opacity-55 leading-tight truncate">
          {fx.vendor}
        </div>
      </div>

      <div
        className={[
          "text-[10px] px-2 py-0.5 rounded-full border",
          fx.enabled
            ? "bg-green-400/10 text-green-200 border-green-400/20"
            : "bg-white/5 text-white/40 border-white/10",
        ].join(" ")}
      >
        {fx.enabled ? "ON" : "OFF"}
      </div>
    </div>
  );
}

export function PluginList({
  title = "FX Chain",
  plugins = [],
  activeIndex = 0,
  className = "",
}) {
  return (
    <Inset className={["h-full min-h-0 p-2", className].join(" ")}>
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="text-[11px] font-semibold tracking-wide text-white/70">
          {title}
        </div>
        <div className="text-[10px] text-white/35">
          {plugins.length} plugins
        </div>
      </div>

      <div className="flex flex-col gap-1 min-h-0">
        {plugins.map((fx, i) => (
          <Row key={fx.id} fx={fx} active={i === activeIndex} />
        ))}
      </div>
    </Inset>
  );
}