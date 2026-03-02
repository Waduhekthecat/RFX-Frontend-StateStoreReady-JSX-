import React from "react";
import SimpleBar from "simplebar-react";
import { styles } from "../_styles";

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
      className={styles.PickerSheetOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rfx-picker-title"
    >
      {/* Header */}
      <div className={styles.PickerSheetHeader}>
        <div className={styles.PickerSheetHeaderText}>
          <div id="rfx-picker-title" className={styles.PickerSheetTitle}>
            {title}
          </div>
          <div className={styles.PickerSheetSubtitle}>
            Swipe to scroll, tap to select.
          </div>
        </div>

        <button onClick={onClose} className={styles.PickerSheetBackBtn}>
          Back
        </button>
      </div>

      {/* List */}
      <div className={styles.PickerSheetListWrap}>
        <div className={styles.PickerSheetListCard}>
          {/* fades */}
          <div className={styles.PickerSheetFadeTop} />
          <div className={styles.PickerSheetFadeBottom} />

          <SimpleBar className={styles.PickerSheetScroll}>
            <div className={styles.PickerSheetItems}>
              {options.map((o) => {
                const selected = o.value === value;
                return (
                  <button
                    key={o.value}
                    onClick={() => onPick?.(o.value)}
                    className={[
                      styles.PickerSheetItemBase,
                      selected ? styles.PickerSheetItemSelected : styles.PickerSheetItemIdle,
                    ].join(" ")}
                  >
                    <span className="truncate">{o.label}</span>
                    {selected ? (
                      <span className={styles.PickerSheetItemCheckOn}>✓</span>
                    ) : (
                      <span className={styles.PickerSheetItemCheckOff}> </span>
                    )}
                  </button>
                );
              })}
            </div>
          </SimpleBar>

          <div className={styles.PickerSheetHintWrap}>
            <div className={styles.PickerSheetHint}>Swipe to scroll</div>
          </div>
        </div>
      </div>
    </div>
  );
}