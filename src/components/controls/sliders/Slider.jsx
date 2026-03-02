function clamp(n, a, b) {
  const v = Number(n);
  if (!Number.isFinite(v)) return a;
  return Math.max(a, Math.min(b, v));
}

/**
 * Slider
 * - touch-friendly labeled slider
 *
 * Props:
 *  - label: string
 *  - value: number
 *  - min/max/step: numbers
 *  - onChange: (value:number) => void
 *  - valueText: string (optional)
 *  - widthClass: tailwind width for the input (optional)
 */
export function Slider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  valueText,
  widthClass = "w-[160px]",
}) {
  const safeValue = clamp(value, min, max);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5">
      <div className="text-[11px] text-white/60 font-semibold tracking-wide w-10">
        {label}
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className={widthClass}
      />

      <div className="text-[11px] text-white/45 tabular-nums w-14 text-right">
        {valueText ?? String(safeValue)}
      </div>
    </div>
  );
}