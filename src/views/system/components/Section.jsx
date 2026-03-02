export function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-sm font-semibold tracking-wide">{title}</div>
      <div className="mt-3 divide-y divide-white/10">{children}</div>
    </div>
  );
}