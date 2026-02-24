import { Badge } from "../../../app/components/ui/Badge";
import { labelFor, subtitleFor, getPluginFormat, norm } from "./InstalledFxUtils";

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
        "flex items-center gap-4",
        "px-4 py-4",
        "rounded-xl border border-white/10 bg-white/5",
        onPick ? "cursor-pointer hover:bg-white/8 transition" : "",
      ].join(" ")}
      title={p?.raw || title}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[16px] font-semibold leading-tight truncate">
          {title}
        </div>

        {sub ? (
          <div className="text-[13px] text-white/55 mt-1 truncate">{sub}</div>
        ) : (
          <div className="text-[13px] text-white/35 mt-1 truncate">
            {norm(p?.raw)}
          </div>
        )}
      </div>

      {format ? (
        <Badge tone="neutral" className="text-[12px] px-3 py-1">
          {String(format).toUpperCase()}
        </Badge>
      ) : null}
    </div>
  );
}