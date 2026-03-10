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
  widthClass = "",
  valueWidthClass = "min-w-[50px]",
}) {
  const safeValue = clamp(value, min, max);

  return (
    <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5">
      <div className="text-[11px] text-white/60 font-semibold tracking-wide w-7 flex-shrink-0">
        {label}
      </div>

      <div className="flex-1 min-w-0">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={safeValue}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className={`block w-full min-w-0 ${widthClass}`}
        />
      </div>

      <div
        className={`text-[11px] text-white/45 tabular-nums whitespace-nowrap text-right flex-shrink-0 ${valueWidthClass}`}
      >
        {valueText ?? String(safeValue)}
      </div>
    </div>
  );
}