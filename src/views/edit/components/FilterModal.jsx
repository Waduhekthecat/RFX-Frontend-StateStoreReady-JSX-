import React from "react";
import { TouchPickerRow } from "./TouchPickerRow";
import { PickerSheet } from "./PickerSheet";
import { styles } from "../_styles";

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
      className={styles.FilterModalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rfx-filter-title"
      onMouseDown={() => {
        if (!picker) onClose?.();
      }}
    >
      <div className={styles.FilterModalBackdrop} />

      <div
        className={styles.FilterModalCard}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.FilterModalHeader}>
          <div className={styles.FilterModalTitleWrap}>
            <div id="rfx-filter-title" className={styles.FilterModalTitle}>
              Filter
            </div>
            <div className={styles.FilterModalSubtitle}>
              Narrow the list without typing.
            </div>
          </div>

          <div className={styles.FilterModalHeaderButtons}>
            <button
              onClick={onClear}
              className={[styles.FilterModalBtnBase, styles.FilterModalBtnClear].join(" ")}
            >
              Clear
            </button>

            <button
              onClick={onClose}
              className={[styles.FilterModalBtnBase, styles.FilterModalBtnDone].join(" ")}
            >
              Done
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.FilterModalBody}>
          <div className={styles.FilterModalBodyCard}>
            <div className={styles.FilterModalRows}>
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

            <div className={styles.FilterModalTip}>
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