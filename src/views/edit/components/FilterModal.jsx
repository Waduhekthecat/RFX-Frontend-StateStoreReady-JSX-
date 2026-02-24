import React from "react";
import { TouchPickerRow } from "./TouchPickerRow";
import { PickerSheet } from "./PickerSheet";

export function FilterModal({
  open,
  onClose,

  typeValue,
  vendorValue,
  formatValue,

  typeOptions,
  vendorOptions,
  formatOptions,

  onTypeChange,
  onVendorChange,
  onFormatChange,

  onClear,
}) {
  const [picker, setPicker] = React.useState(null); // "type" | "vendor" | "format" | null

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) setPicker(null);
  }, [open]);

  if (!open) return null;

  const typeLabel = typeOptions?.find((o) => o.value === typeValue)?.label ?? "All Types";
  const vendorLabel =
    vendorOptions?.find((o) => o.value === vendorValue)?.label ?? "All Vendors";
  const formatLabel =
    formatOptions?.find((o) => o.value === formatValue)?.label ?? "All Formats";

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rfx-filter-title"
      onMouseDown={() => {
        if (!picker) onClose?.();
      }}
    >
      <div className="absolute inset-0 bg-black/80" />

      <div
        className={[
          "relative",
          "w-[min(1100px,96vw)]",
          "h-[min(680px,88vh)]",
          "rounded-3xl",
          "border border-white/15",
          "bg-[#0b0c0e]",
          "shadow-[0_30px_90px_rgba(0,0,0,0.70)]",
          "p-7",
          "flex flex-col",
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div
              id="rfx-filter-title"
              className="text-[24px] font-semibold tracking-wide text-white/92"
            >
              Filter
            </div>
            <div className="text-[14px] text-white/45 mt-2">
              Narrow the list without typing.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClear}
              className={[
                "h-12",
                "px-6",
                "text-[15px]",
                "rounded-2xl",
                "border border-white/12",
                "bg-white/6",
                "text-white/85",
                "hover:bg-white/10 transition",
                "active:translate-y-[1px]",
              ].join(" ")}
            >
              Clear
            </button>

            <button
              onClick={onClose}
              className={[
                "h-12",
                "px-7",
                "text-[15px]",
                "rounded-2xl",
                "border border-white/12",
                "bg-white/12",
                "text-white/92",
                "hover:bg-white/16 transition",
                "active:translate-y-[1px]",
              ].join(" ")}
            >
              Done
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="mt-8 flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 rounded-3xl border border-white/10 bg-white/3 p-6">
            <div className="flex flex-col gap-6">
              <TouchPickerRow
                label="Type"
                valueLabel={typeLabel}
                onOpen={() => setPicker("type")}
              />
              <TouchPickerRow
                label="Vendor"
                valueLabel={vendorLabel}
                onOpen={() => setPicker("vendor")}
              />
              <TouchPickerRow
                label="Format"
                valueLabel={formatLabel}
                onOpen={() => setPicker("format")}
              />
            </div>

            <div className="mt-7 text-[13px] text-white/35">
              Tip: filters are touch-friendly—no keyboard needed.
            </div>
          </div>
        </div>

        <PickerSheet
          open={picker === "type"}
          title="Type"
          options={typeOptions || []}
          value={typeValue}
          onPick={(v) => {
            onTypeChange?.(v);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />

        <PickerSheet
          open={picker === "vendor"}
          title="Vendor"
          options={vendorOptions || []}
          value={vendorValue}
          onPick={(v) => {
            onVendorChange?.(v);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />

        <PickerSheet
          open={picker === "format"}
          title="Format"
          options={formatOptions || []}
          value={formatValue}
          onPick={(v) => {
            onFormatChange?.(v);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      </div>
    </div>
  );
}