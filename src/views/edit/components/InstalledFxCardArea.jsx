import { InstalledFxCard } from "./InstalledFxCard";
import { styles } from "../_styles";

export function InstalledFxCardArea({ items, onPick }) {
  if (!items?.length) {
    return <div className={styles.InstalledFxEmpty}>No plugins found.</div>;
  }

  return (
    <div className={styles.InstalledFxList}>
      {items.map((p) => (
        <InstalledFxCard
          key={p?.id || p?.raw || `${p?.name}-${Math.random()}`}
          p={p}
          onPick={onPick}
        />
      ))}
    </div>
  );
}