export function ItemRow({ title, desc, right }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{title}</div>
        {desc ? <div className="text-xs opacity-70 truncate">{desc}</div> : null}
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}