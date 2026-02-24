export function TouchPickerRow({ label, valueLabel, onOpen }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
      <div className="text-[16px] font-medium text-white/75 sm:w-[140px]">
        {label}
      </div>

      <button
        onClick={onOpen}
        className={[
          "w-full",
          "h-14",
          "rounded-2xl",
          "border border-white/12",
          "bg-black/35",
          "px-5",
          "text-left",
          "text-[17px]",
          "text-white/90",
          "hover:bg-white/6 transition",
          "active:translate-y-[1px]",
          "flex items-center justify-between gap-4",
        ].join(" ")}
      >
        <span className="truncate">{valueLabel}</span>
        <span className="text-white/40 text-[18px]">▾</span>
      </button>
    </div>
  );
}