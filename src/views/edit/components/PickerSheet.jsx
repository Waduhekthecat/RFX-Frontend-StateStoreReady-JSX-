import React from "react";
import SimpleBar from "simplebar-react";

export function PickerSheet({ open, title, options, value, onPick, onClose }) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={[
        "absolute inset-0 z-[10]",
        "rounded-3xl",
        "bg-[#0b0c0e]",
        "border border-white/10",
        "shadow-[0_20px_70px_rgba(0,0,0,0.65)]",
        "flex flex-col",
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rfx-picker-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-5 border-b border-white/10">
        <div className="min-w-0">
          <div
            id="rfx-picker-title"
            className="text-[20px] font-semibold text-white/90 truncate"
          >
            {title}
          </div>
          <div className="text-[13px] text-white/45 mt-1">
            Swipe to scroll, tap to select.
          </div>
        </div>

        <button
          onClick={onClose}
          className={[
            "h-12",
            "px-6",
            "text-[15px]",
            "rounded-2xl",
            "border border-white/12",
            "bg-white/8",
            "text-white/85",
            "hover:bg-white/12 transition",
            "active:translate-y-[1px]",
          ].join(" ")}
        >
          Back
        </button>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 p-5">
        <div
          className={[
            "relative h-full",
            "rounded-2xl",
            "border border-white/10",
            "bg-white/3",
            "overflow-hidden",
          ].join(" ")}
        >
          {/* fades */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0b0c0e] to-transparent z-10" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0b0c0e] to-transparent z-10" />

          <SimpleBar className="h-full rfxSimpleBar rfxSimpleBar--picker">
            <div className="p-3 pr-4 flex flex-col gap-3">
              {options.map((o) => {
                const selected = o.value === value;
                return (
                  <button
                    key={o.value}
                    onClick={() => onPick?.(o.value)}
                    className={[
                      "w-full",
                      "h-16",
                      "rounded-2xl",
                      "border",
                      selected
                        ? "border-white/25 bg-white/12"
                        : "border-white/10 bg-white/6",
                      "px-5",
                      "text-left",
                      "text-[17px]",
                      selected ? "text-white/95" : "text-white/85",
                      "hover:bg-white/10 transition",
                      "active:translate-y-[1px]",
                      "flex items-center justify-between gap-4",
                    ].join(" ")}
                  >
                    <span className="truncate">{o.label}</span>
                    {selected ? (
                      <span className="text-[16px] text-white/80">✓</span>
                    ) : (
                      <span className="text-[16px] text-white/25"> </span>
                    )}
                  </button>
                );
              })}
            </div>
          </SimpleBar>

          <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center z-20">
            <div className="text-[12px] text-white/40 bg-black/40 border border-white/10 rounded-full px-3 py-1">
              Swipe to scroll
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}