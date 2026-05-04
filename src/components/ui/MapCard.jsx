import React from "react";
import { Slider } from "../controls/sliders/_index";

export function MapCard({
  paramName,
  pluginName,
  value01 = 0.5,
  onChange01,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 flex flex-col gap-3">
      <div className="min-w-0">
        <div className="text-[12px] font-semibold tracking-wide text-white truncate">
          {String(paramName || "Parameter")}
        </div>
        <div className="text-[11px] text-white/45 truncate">
          {String(pluginName || "Plugin")}
        </div>
      </div>

      <Slider
        label=""
        min={0}
        max={1}
        step={0.001}
        value={value01}
        valueText={value01.toFixed(2)}
        widthClass="w-full"
        onChange={(next) => onChange01?.(next)}
      />
    </div>
  );
}