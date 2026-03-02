import { Badge } from "../../../components/ui/Badge";
import { labelFor, subtitleFor, getPluginFormat, norm } from "./InstalledFxUtils";
import { styles } from "../_styles";

export function InstalledFxCard({ p, onPick }) {
  const title = labelFor(p);
  const sub = subtitleFor(p);
  const format = getPluginFormat(p);

  return (
    <div
      role={onPick ? "button" : undefined}
      tabIndex={onPick ? 0 : undefined}
      onClick={onPick ? () => onPick(p) : undefined}
      onKeyDown={
        onPick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onPick(p);
            }
          : undefined
      }
      className={[
        styles.InstalledFxCardRootBase,
        onPick ? styles.InstalledFxCardInteractive : "",
      ].join(" ")}
      title={p?.raw || title}
    >
      <div className="flex-1 min-w-0">
        <div className={styles.InstalledFxCardTitle}>{title}</div>

        {sub ? (
          <div className={styles.InstalledFxCardSubStrong}>{sub}</div>
        ) : (
          <div className={styles.InstalledFxCardSubWeak}>{norm(p?.raw)}</div>
        )}
      </div>

      {format ? (
        <Badge tone="neutral" className={styles.InstalledFxCardFormatBadge}>
          {String(format).toUpperCase()}
        </Badge>
      ) : null}
    </div>
  );
}