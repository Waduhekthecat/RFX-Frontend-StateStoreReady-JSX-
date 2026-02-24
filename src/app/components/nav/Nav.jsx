// src/app/components/nav/Nav.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useTransport } from "../../../core/transport/TransportProvider";

const BASE_TABS = [
  { label: "Perform", to: "/" },
  { label: "Edit", to: "/edit" },
  { label: "Routing", to: "/routing" },
  { label: "System", to: "/system" },
];

function useVM() {
  const t = useTransport();
  const [vm, setVm] = React.useState(() => t.getSnapshot());
  React.useEffect(() => t.subscribe(setVm), [t]);
  return vm;
}

function normalizeMode(m) {
  const x = String(m || "linear").toLowerCase();
  if (x === "lcr") return "lcr";
  if (x === "parallel") return "parallel";
  return "linear";
}

function ModeBadge({ mode }) {
  const m = normalizeMode(mode);
  const label = m === "linear" ? "LINEAR" : m === "parallel" ? "PAR" : "LCR";

  const tone =
    m === "lcr"
      ? "bg-blue-400/15 text-blue-200 border-blue-400/25"
      : m === "parallel"
      ? "bg-yellow-400/15 text-yellow-200 border-yellow-400/25"
      : "bg-white/10 text-white/75 border-white/15";

  return (
    <span
      className={[
        "inline-flex items-center",
        "px-2 py-[2px] rounded-full border",
        "text-[11px] leading-none",
        tone,
      ].join(" ")}
      title={`Routing mode: ${label}`}
    >
      {label}
    </span>
  );
}

export function Nav() {
  const vm = useVM();

  // ✅ dev-only tab
  const tabs = React.useMemo(() => {
    const devTab = import.meta.env.DEV ? [{ label: "Core", to: "/dev/core" }] : [];
    return [...BASE_TABS, ...devTab];
  }, []);

  const activeBusId = vm.activeBusId || "FX_1";
  const mode = normalizeMode(vm.busModes?.[activeBusId] || "linear");

  return (
    <div className="h-14 px-4 flex items-center border-b border-white/10 bg-black/30">
      {/* LEFT */}
      <div className="flex items-center gap-3 min-w-[260px]">
        <div className="font-bold tracking-wide">RFX</div>
        <div className="text-xs opacity-60">Mock</div>

        <div className="h-6 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <span className="text-xs opacity-60">Active</span>
          <span className="text-[12px] font-semibold tracking-wide">{activeBusId}</span>
          <ModeBadge mode={mode} />
        </div>
      </div>

      {/* CENTER */}
      <div className="flex-1 flex justify-center">
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                [
                  "px-4 py-1.5 text-sm rounded-lg transition",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10",
                ].join(" ")
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 min-w-[260px] justify-end">
        <StatusDot label="OSC" active />
        <StatusDot label="REAPER" active />
        <StatusDot label="AUDIO" active />
      </div>
    </div>
  );
}

function StatusDot({ label, active }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <div
        className={[
          "w-2.5 h-2.5 rounded-full",
          active ? "bg-green-400" : "bg-red-500",
        ].join(" ")}
      />
      <span className="opacity-70">{label}</span>
    </div>
  );
}