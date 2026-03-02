export function Btn({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm hover:bg-black/40"
      style={{ touchAction: "manipulation" }}
    >
      {children}
    </button>
  );
}