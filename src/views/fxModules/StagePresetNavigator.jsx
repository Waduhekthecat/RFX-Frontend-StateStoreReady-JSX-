import { Module } from "../../components/ui/Module";

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-full w-full"
    >
      <path d="M3.5 6.5h6l2 2h9v9.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V6.5Z" />
      <path d="M3.5 10h17" />
    </svg>
  );
}

export function StagePresetNavigator() {
  const arrowButtonClass =
    "flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-black/80 bg-[#202326] text-[80px] font-light leading-none text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.13),inset_0_-4px_8px_rgba(0,0,0,0.65),0_4px_8px_rgba(0,0,0,0.55)] transition hover:text-white active:translate-y-px active:bg-[#101214]";

  return (
    <Module
      height={164}
      contentClassName="flex items-center justify-center px-16 py-6"
      aria-label="RFX Stage preset navigator"
    >
      <div className="grid w-full max-w-[980px] grid-cols-[96px_minmax(0,1fr)_96px] items-center gap-7">
        <button
          type="button"
          aria-label="Previous RFX Stage preset"
          className={arrowButtonClass}
        >
          <span aria-hidden="true" className="-translate-y-1">‹</span>
        </button>

        <div className="grid h-24 min-w-0 grid-cols-[minmax(0,1fr)_72px] items-center rounded-xl border border-black bg-black/90 px-5 text-white shadow-[inset_0_2px_12px_rgba(0,0,0,0.95),inset_0_0_20px_rgba(255,255,255,0.035),0_1px_0_rgba(255,255,255,0.12)]">
          <div className="min-w-0 text-center">
            <div className="truncate text-[24px] font-semibold tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.18)]">
              1. MESA Boogie Mark IV Lead
            </div>
            <div className="mt-2 text-[17px] font-semibold tracking-wide text-white/75">
              RFX Stage Preset
            </div>
          </div>

          <button
            type="button"
            aria-label="Browse RFX Stage presets"
            title="Browse presets"
            className="flex h-16 w-16 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-cyan-300/45 hover:bg-cyan-400/[0.12] hover:text-cyan-200 active:translate-y-px active:bg-cyan-400/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
          >
            <span className="h-12 w-12 drop-shadow-[0_0_8px_rgba(34,211,238,0.36)]">
              <FolderIcon />
            </span>
          </button>
        </div>

        <button
          type="button"
          aria-label="Next RFX Stage preset"
          className={arrowButtonClass}
        >
          <span aria-hidden="true" className="-translate-y-1">›</span>
        </button>
      </div>
    </Module>
  );
}

