import React from "react";
import { Slider } from "../controls/sliders/_index";

const CURVES = ["linear", "logarithmic", "exponential"];

function cleanPluginName(name) {
  return String(name || "Plugin")
    .replace(/^\s*(VST3?|AU|JS|CLAP|LV2|AAX)\s*:\s*/i, "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .trim() || "Plugin";
}

function CurveThumbnail({ curve }) {
  const path = curve === "logarithmic"
    ? "M4 42 C20 20 42 8 76 5"
    : curve === "exponential"
      ? "M4 43 C38 41 62 25 76 5"
      : "M4 43 L76 5";
  return (
    <svg viewBox="0 0 80 48" className="h-12 w-full rounded-md bg-black/30" aria-hidden="true">
      <path d="M4 43 H76 M4 43 V5" fill="none" stroke="rgba(255,255,255,0.08)" />
      <path d={path} fill="none" stroke="#1da1ff" strokeWidth="2" />
      <circle cx="40" cy={curve === "logarithmic" ? 14 : curve === "exponential" ? 34 : 24} r="2" fill="#1da1ff" />
    </svg>
  );
}

function RangeEditor({ enabled, min01, max01, onToggle, onChange }) {
  const trackRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const min = Math.max(0, Math.min(1, Number(min01 ?? 0)));
  const max = Math.max(min, Math.min(1, Number(max01 ?? 1)));

  const update = React.useCallback((event) => {
    if (!enabled || !dragRef.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const next = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
    if (dragRef.current === "min") onChange?.({ min01: Math.min(next, max - 0.01), max01: max });
    else onChange?.({ min01: min, max01: Math.max(next, min + 0.01) });
  }, [enabled, max, min, onChange]);

  const start = (event, handle) => {
    if (!enabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = handle;
  };

  return (
    <div data-no-mapcard-drag="true">
      <button type="button" onClick={() => onToggle?.(!enabled)} className="mb-1 flex items-center gap-2 text-[10px] font-bold tracking-wider text-white/45">
        <span>RANGE</span>
        <span className={`relative h-4 w-8 rounded-full border transition ${enabled ? "border-cyan-400/60 bg-cyan-500/25" : "border-white/15 bg-black/30"}`}>
          <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full transition-all ${enabled ? "left-[17px] bg-cyan-300" : "left-0.5 bg-white/35"}`} />
        </span>
        <span className={enabled ? "text-cyan-300" : "text-white/30"}>{enabled ? "ON" : "OFF"}</span>
      </button>
      <div
        ref={trackRef}
        className={`relative h-5 ${enabled ? "opacity-100" : "opacity-35"}`}
        onPointerMove={update}
        onPointerUp={() => { dragRef.current = null; }}
        onPointerCancel={() => { dragRef.current = null; }}
      >
        <div className="absolute left-0 right-0 top-2 h-1 rounded-full bg-white/10" />
        <div className="absolute top-2 h-1 rounded-full bg-cyan-500" style={{ left: `${min * 100}%`, right: `${(1 - max) * 100}%` }} />
        {[["min", min], ["max", max]].map(([handle, value]) => (
          <button
            key={handle}
            type="button"
            aria-label={`${handle}imum range`}
            onPointerDown={(event) => start(event, handle)}
            className="absolute top-0 h-5 w-5 -translate-x-1/2 rounded-full border border-cyan-200/60 bg-cyan-500 shadow-[0_0_10px_rgba(14,165,233,0.45)] disabled:cursor-default"
            style={{ left: `${value * 100}%` }}
            disabled={!enabled}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] tabular-nums text-white/40"><span>{min.toFixed(2)}</span><span>{max.toFixed(2)}</span></div>
    </div>
  );
}

function SensitivityKnob({ value = 1, onChange }) {
  const startRef = React.useRef(null);
  const safe = Math.max(0, Math.min(2, Number(value)));
  const angle = -135 + (safe / 2) * 270;

  const onPointerDown = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    startRef.current = { y: event.clientY, value: safe };
  };
  const onPointerMove = (event) => {
    if (!startRef.current) return;
    onChange?.(Math.max(0, Math.min(2, startRef.current.value + (startRef.current.y - event.clientY) / 80)));
  };
  const end = () => { startRef.current = null; };

  return (
    <div data-no-mapcard-drag="true" className="flex h-full flex-col items-center justify-center">
      <div className="mb-1 text-[10px] font-bold tracking-wider text-white/45">SENSITIVITY</div>
      <button
        type="button"
        aria-label="Mapping sensitivity"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onDoubleClick={() => onChange?.(1)}
        className="relative h-14 w-14 rounded-full border border-white/15 bg-gradient-to-br from-[#333a40] to-[#090b0d] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.7)] touch-none"
      >
        <span className="absolute left-1/2 top-1/2 h-5 w-0.5 origin-bottom -translate-x-1/2 -translate-y-full bg-white" style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }} />
      </button>
      <div className="mt-1 text-[11px] tabular-nums text-white/65">{Math.round(safe * 100)}%</div>
    </div>
  );
}

export function MapCard({
  paramName,
  pluginName,
  value01 = 0.5,
  invert = false,
  rangeEnabled = false,
  rangeMin01 = 0,
  rangeMax01 = 1,
  curve = "linear",
  sensitivity = 1,
  onChange01,
  onToggleInvert,
  onRangeEnabledChange,
  onRangeChange,
  onCurveChange,
  onSensitivityChange,
  onUnmap,
  orderNumber,
  badgeLabel = "",
  draggableActive = false,
  draggableGhost = false,
  onDragHoldStart,
  onDragHoldMove,
  onDragHoldEnd,
}) {
  const normalizedCurve = CURVES.includes(curve) ? curve : "linear";
  const nextCurve = () => onCurveChange?.(CURVES[(CURVES.indexOf(normalizedCurve) + 1) % CURVES.length]);
  const changeValueWithSensitivity = (nextValue) => {
    const scale = Math.max(0, Math.min(2, Number(sensitivity ?? 1)));
    const adjusted = Math.max(0, Math.min(1, value01 + (Number(nextValue) - value01) * scale));
    onChange01?.(adjusted);
  };
  const handlePointerDown = React.useCallback((event) => {
    if (event.target?.closest?.("button,input,[role='slider'],[data-no-mapcard-drag='true']")) return;
    onDragHoldStart?.(event);
  }, [onDragHoldStart]);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={onDragHoldMove}
      onPointerUp={onDragHoldEnd}
      onPointerCancel={onDragHoldEnd}
      className={`h-full min-h-[150px] rounded-2xl border grid grid-cols-[44px_48px_minmax(190px,1fr)_minmax(240px,1.35fr)_150px_86px_112px_58px] items-stretch overflow-hidden select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.42)] backdrop-blur-md transition ${
        draggableActive ? "border-cyan-300/80 bg-gradient-to-br from-[#24404a] to-[#0c1519]" : draggableGhost ? "border-white/10 bg-[#151719] opacity-65" : "border-white/20 bg-gradient-to-br from-[#24282b]/95 to-[#0c0e0f]/95"
      }`}
    >
      <div className="relative -top-1 flex h-full items-center justify-center text-xl text-white/40">≡</div>
      <div className="flex h-full items-center justify-center border-l border-white/5">
        <span className="rounded-lg border border-cyan-400/60 px-2.5 py-1.5 text-xs font-bold text-cyan-300">{orderNumber}</span>
      </div>
      <div className="relative -top-1 min-w-0 border-l border-white/5 px-4 flex h-full flex-col justify-center">
        <div className="flex min-w-0 items-center gap-2">
          <div className="truncate text-[18px] font-semibold text-white">{String(paramName || "Parameter")}</div>
          {badgeLabel ? <span className="shrink-0 rounded-lg border border-cyan-400/60 px-2 py-1 text-[10px] font-bold text-cyan-300">{badgeLabel}</span> : null}
        </div>
        <div className="truncate text-[13px] text-white/50">{cleanPluginName(pluginName)}</div>
      </div>
      <div className="border-l border-white/5 px-4 py-2 flex h-full flex-col justify-center">
        <div className="mb-1 text-[10px] font-bold tracking-wider text-white/45">CURRENT VALUE <span className="ml-2 text-base text-cyan-400">{value01.toFixed(2)}</span></div>
        <Slider label="" min={0} max={1} step={0.001} value={value01} valueText="" widthClass="w-full" valueWidthClass="w-0 min-w-0 overflow-hidden" onChange={changeValueWithSensitivity} />
        <RangeEditor enabled={rangeEnabled} min01={rangeMin01} max01={rangeMax01} onToggle={onRangeEnabledChange} onChange={onRangeChange} />
      </div>
      <button type="button" onClick={nextCurve} data-no-mapcard-drag="true" className="border-l border-white/5 px-3 py-2 text-left flex h-full flex-col justify-center hover:bg-white/5">
        <div className="text-[10px] font-bold tracking-wider text-white/45">CURVE</div>
        <div className="mb-1 flex items-center justify-between rounded-md border border-white/10 bg-black/25 px-2 py-1 text-xs capitalize text-white/75"><span>{normalizedCurve}</span><span>⌄</span></div>
        <CurveThumbnail curve={normalizedCurve} />
      </button>
      <div className="border-l border-white/5 flex h-full flex-col items-center justify-center">
        <div className="mb-2 text-[10px] font-bold tracking-wider text-white/45">INVERT</div>
        <button type="button" onClick={onToggleInvert} data-no-mapcard-drag="true" className={`rounded-lg border px-3 py-2 text-xs font-bold ${invert ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300" : "border-white/15 bg-black/20 text-white/45"}`}>{invert ? "ON" : "OFF"}</button>
      </div>
      <div className="h-full border-l border-white/5"><SensitivityKnob value={sensitivity} onChange={onSensitivityChange} /></div>
      <div className="border-l border-white/5 flex h-full items-center justify-center">
        <button type="button" onClick={onUnmap} data-no-mapcard-drag="true" aria-label="Unmap parameter" className="relative -top-1 h-11 w-11 rounded-xl border border-red-400/30 bg-red-500/5 text-red-400 hover:bg-red-500/15">
          <svg viewBox="0 0 24 24" className="mx-auto h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M7 6l1 14h8l1-14M10 10v6M14 10v6" /></svg>
        </button>
      </div>
    </div>
  );
}
