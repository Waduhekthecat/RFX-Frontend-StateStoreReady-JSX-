import { InstalledFxCard } from "./InstalledFxCard";

export function InstalledFxCardArea({ items, onPick }) {
  if (!items?.length) {
    return (
      <div className="text-[12px] text-white/35 px-1 py-2">
        No plugins found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
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