import { styles } from "../_styles";

export function TouchPickerRow({ label, valueLabel, onOpen }) {
  return (
    <div className={styles.TouchPickerRowRoot}>
      <div className={styles.TouchPickerRowLabel}>{label}</div>

      <button onClick={onOpen} className={styles.TouchPickerRowButton}>
        <span className="truncate">{valueLabel}</span>
        <span className={styles.TouchPickerRowChevron}>▾</span>
      </button>
    </div>
  );
}