import React from "react";
import {
  Panel,
  PanelHeader,
  PanelBody,
  Inset,
} from "../../../app/components/ui/Panel";
import { Badge } from "../../../app/components/ui/Badge";
import { useTransport } from "../../../core/transport/TransportProvider";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

// ---------------------------
// Helpers
// ---------------------------
function norm(s) {
  return String(s ?? "").trim();
}

function safeLower(s) {
  return norm(s).toLowerCase();
}

const KNOWN_FORMATS = new Set(["au", "vst", "vst2", "vst3", "jsfx", "clap", "aax"]);

function isFormatToken(x) {
  const t = safeLower(x);
  return KNOWN_FORMATS.has(t);
}

/**
 * Backwards-compatible field normalization:
 * - Format: p.format || p.pluginFormat || (p.type if looks like format)
 * - Type:   p.fxType || p.category || p.kind || (p.type if NOT format)
 */
function getPluginFormat(p) {
  const f =
    p?.format ??
    p?.pluginFormat ??
    p?.fmt ??
    (isFormatToken(p?.type) ? p?.type : "") ??
    "";
  return safeLower(f);
}

function getPluginType(p) {
  const t =
    p?.fxType ??
    p?.category ??
    p?.kind ??
    (!isFormatToken(p?.type) ? p?.type : "") ??
    "";
  return safeLower(t);
}

function getPluginVendor(p) {
  return norm(p?.vendor);
}

function labelFor(p) {
  return norm(p?.name) || norm(p?.raw) || "Unknown";
}

function subtitleFor(p) {
  const vendor = norm(p?.vendor);
  // Keep current visual: vendor • FORMAT (matches your screenshot)
  const format = getPluginFormat(p);
  if (vendor && format) return `${vendor} • ${format.toUpperCase()}`;
  if (vendor) return vendor;
  if (format) return format.toUpperCase();
  return "";
}

function normalizeInstalledFx(input) {
  if (!input) return { count: 0, plugins: [] };

  // already in shape
  if (Array.isArray(input.plugins)) return input;

  // allow passing an array
  if (Array.isArray(input)) return { count: input.length, plugins: input };

  // tolerate different keys
  const plugins =
    input.plugins ||
    input.items ||
    input.list ||
    input.fx ||
    input.installed ||
    [];

  const arr = Array.isArray(plugins) ? plugins : [];
  const count = Number.isFinite(input.count) ? input.count : arr.length;

  return { count, plugins: arr };
}

// ---------------------------
// Mock installed plugins (30 only)
// ---------------------------
function makeMockInstalledFx(count = 30) {
  const VENDORS = [
    "Neural DSP",
    "Valhalla",
    "FabFilter",
    "Soundtoys",
    "UAD",
    "Waves",
    "IK",
    "Tokyo Dawn",
    "Apple",
  ];

  const FORMATS = ["vst3", "au", "jsfx"];

  const NAMES = [
    "Gate",
    "Compressor",
    "EQ",
    "Delay",
    "Reverb",
    "Limiter",
    "Chorus",
    "Flanger",
    "Saturation",
    "Amp Sim",
    "Cab IR",
    "Pitch",
  ];

  return {
    count,
    plugins: Array.from({ length: count }).map((_, i) => {
      const vendor = VENDORS[i % VENDORS.length];
      const format = FORMATS[i % FORMATS.length];
      const name = NAMES[i % NAMES.length];

      return {
        id: `mock_${i}`,
        // NOTE: Keeping legacy field `type` as format to match your current data
        type: format,
        vendor,
        name,
        raw:
          format === "au"
            ? `AU: ${name} (${vendor})`
            : `${format.toUpperCase()}: ${name} (${vendor})`,
      };
    }),
  };
}

// ---------------------------
// Hook: read installed FX from transport snapshot (optional)
// ---------------------------
export function useInstalledFxFromTransport() {
  const t = useTransport();
  const [vm, setVm] = React.useState(() => t.getSnapshot());
  React.useEffect(() => t.subscribe(setVm), [t]);

  // tolerate multiple possible field names while you iterate
  const candidate =
    vm?.installedFx ||
    vm?.pluginList ||
    vm?.installedPlugins ||
    vm?.rfx_plugin_list ||
    null;

  return normalizeInstalledFx(candidate);
}

// ---------------------------
// Small UI helpers
// ---------------------------
function TouchPickerRow({ label, valueLabel, onOpen }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
      <div className="text-[16px] font-medium text-white/75 sm:w-[140px]">
        {label}
      </div>

      <button
        onClick={onOpen}
        className={[
          "w-full",
          "h-14", // ✅ big
          "rounded-2xl",
          "border border-white/12",
          "bg-black/35",
          "px-5",
          "text-left",
          "text-[17px]",
          "text-white/90",
          "hover:bg-white/6 transition",
          "active:translate-y-[1px]",
          "flex items-center justify-between gap-4",
        ].join(" ")}
      >
        <span className="truncate">{valueLabel}</span>
        <span className="text-white/40 text-[18px]">▾</span>
      </button>
    </div>
  );
}

function PickerSheet({
  open,
  title,
  options,
  value,
  onPick,
  onClose,
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={[
        "absolute inset-0 z-[10]",
        "rounded-3xl",
        "bg-[#0b0c0e]",
        "border border-white/10",
        "shadow-[0_20px_70px_rgba(0,0,0,0.65)]",
        "flex flex-col",
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rfx-picker-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-5 border-b border-white/10">
        <div className="min-w-0">
          <div
            id="rfx-picker-title"
            className="text-[20px] font-semibold text-white/90 truncate"
          >
            {title}
          </div>
          <div className="text-[13px] text-white/45 mt-1">
            Swipe to scroll, tap to select.
          </div>
        </div>

        <button
          onClick={onClose}
          className={[
            "h-12",
            "px-6",
            "text-[15px]",
            "rounded-2xl",
            "border border-white/12",
            "bg-white/8",
            "text-white/85",
            "hover:bg-white/12 transition",
            "active:translate-y-[1px]",
          ].join(" ")}
        >
          Back
        </button>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 p-5">
        <div
          className={[
            "relative h-full",
            "rounded-2xl",
            "border border-white/10",
            "bg-white/3",
            "overflow-hidden",
          ].join(" ")}
        >
          {/* Strong scroll affordance fades */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0b0c0e] to-transparent z-10" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0b0c0e] to-transparent z-10" />

          <SimpleBar className="h-full rfxSimpleBar rfxSimpleBar--picker">
            <div className="p-3 pr-4 flex flex-col gap-3">
              {options.map((o) => {
                const selected = o.value === value;
                return (
                  <button
                    key={o.value}
                    onClick={() => onPick(o.value)}
                    className={[
                      "w-full",
                      "h-16", // ✅ big tap target
                      "rounded-2xl",
                      "border",
                      selected
                        ? "border-white/25 bg-white/12"
                        : "border-white/10 bg-white/6",
                      "px-5",
                      "text-left",
                      "text-[17px]",
                      selected ? "text-white/95" : "text-white/85",
                      "hover:bg-white/10 transition",
                      "active:translate-y-[1px]",
                      "flex items-center justify-between gap-4",
                    ].join(" ")}
                  >
                    <span className="truncate">{o.label}</span>
                    {selected ? (
                      <span className="text-[16px] text-white/80">✓</span>
                    ) : (
                      <span className="text-[16px] text-white/25"> </span>
                    )}
                  </button>
                );
              })}
            </div>
          </SimpleBar>

          {/* Extra “Scroll” hint pinned at bottom (subtle but clear) */}
          <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center z-20">
            <div className="text-[12px] text-white/40 bg-black/40 border border-white/10 rounded-full px-3 py-1">
              Swipe to scroll
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterModal({
  open,
  onClose,

  typeValue,
  vendorValue,
  formatValue,

  typeOptions,
  vendorOptions,
  formatOptions,

  onTypeChange,
  onVendorChange,
  onFormatChange,

  onClear,
}) {
  const [picker, setPicker] = React.useState(null); // "type" | "vendor" | "format" | null

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // reset nested picker when closing modal
  React.useEffect(() => {
    if (!open) setPicker(null);
  }, [open]);

  if (!open) return null;

  const typeLabel =
    typeOptions?.find((o) => o.value === typeValue)?.label ?? "All Types";
  const vendorLabel =
    vendorOptions?.find((o) => o.value === vendorValue)?.label ?? "All Vendors";
  const formatLabel =
    formatOptions?.find((o) => o.value === formatValue)?.label ?? "All Formats";

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rfx-filter-title"
      onMouseDown={() => {
        // only allow click-outside close if not in nested picker
        if (!picker) onClose?.();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Main modal card */}
      <div
        className={[
          "relative",
          // ✅ BIG: tuned for 1280×800
          "w-[min(1100px,96vw)]",
          "h-[min(680px,88vh)]",
          "rounded-3xl",
          "border border-white/15",
          "bg-[#0b0c0e]",
          "shadow-[0_30px_90px_rgba(0,0,0,0.70)]",
          "p-7",
          "flex flex-col",
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div
              id="rfx-filter-title"
              className="text-[24px] font-semibold tracking-wide text-white/92"
            >
              Filter
            </div>
            <div className="text-[14px] text-white/45 mt-2">
              Narrow the list without typing.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClear}
              className={[
                "h-12",
                "px-6",
                "text-[15px]",
                "rounded-2xl",
                "border border-white/12",
                "bg-white/6",
                "text-white/85",
                "hover:bg-white/10 transition",
                "active:translate-y-[1px]",
              ].join(" ")}
            >
              Clear
            </button>

            <button
              onClick={onClose}
              className={[
                "h-12",
                "px-7",
                "text-[15px]",
                "rounded-2xl",
                "border border-white/12",
                "bg-white/12",
                "text-white/92",
                "hover:bg-white/16 transition",
                "active:translate-y-[1px]",
              ].join(" ")}
            >
              Done
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="mt-8 flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 rounded-3xl border border-white/10 bg-white/3 p-6">
            <div className="flex flex-col gap-6">
              <TouchPickerRow
                label="Type"
                valueLabel={typeLabel}
                onOpen={() => setPicker("type")}
              />
              <TouchPickerRow
                label="Vendor"
                valueLabel={vendorLabel}
                onOpen={() => setPicker("vendor")}
              />
              <TouchPickerRow
                label="Format"
                valueLabel={formatLabel}
                onOpen={() => setPicker("format")}
              />
            </div>

            <div className="mt-7 text-[13px] text-white/35">
              Tip: filters are touch-friendly—no keyboard needed.
            </div>
          </div>
        </div>

        {/* Nested pickers (cover the modal content area) */}
        <PickerSheet
          open={picker === "type"}
          title="Type"
          options={typeOptions || []}
          value={typeValue}
          onPick={(v) => {
            onTypeChange?.(v);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />

        <PickerSheet
          open={picker === "vendor"}
          title="Vendor"
          options={vendorOptions || []}
          value={vendorValue}
          onPick={(v) => {
            onVendorChange?.(v);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />

        <PickerSheet
          open={picker === "format"}
          title="Format"
          options={formatOptions || []}
          value={formatValue}
          onPick={(v) => {
            onFormatChange?.(v);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      </div>
    </div>
  );
}

// ---------------------------
// InstalledFxShell
// ---------------------------
export function InstalledFxShell({ installedFx, onPick, className = "" }) {
  const fallback = useInstalledFxFromTransport();
  const normalized = normalizeInstalledFx(installedFx ?? fallback);

  // If transport has nothing yet → use mock data
  const data =
    normalized.plugins?.length > 0 ? normalized : makeMockInstalledFx(30);

  const all = data.plugins ?? [];

  // Modal state
  const [filterOpen, setFilterOpen] = React.useState(false);

  // Filter state
  const [typeFilter, setTypeFilter] = React.useState("all"); // effect category (if available)
  const [vendorFilter, setVendorFilter] = React.useState("all");
  const [formatFilter, setFormatFilter] = React.useState("all"); // AU/VST/VST3/JSFX...

  // Build dropdown option lists
  const typeOptions = React.useMemo(() => {
    const s = new Set();
    for (const p of all) {
      const t = getPluginType(p);
      if (t) s.add(t);
    }
    const items = Array.from(s).sort();
    return [{ value: "all", label: "All Types" }].concat(
      items.map((t) => ({ value: t, label: t.toUpperCase() }))
    );
  }, [all]);

  const vendorOptions = React.useMemo(() => {
    const s = new Set();
    for (const p of all) {
      const v = norm(p?.vendor);
      if (v) s.add(v);
    }
    const items = Array.from(s).sort((a, b) => a.localeCompare(b));
    return [{ value: "all", label: "All Vendors" }].concat(
      items.map((v) => ({ value: v, label: v }))
    );
  }, [all]);

  const formatOptions = React.useMemo(() => {
    const s = new Set();
    for (const p of all) {
      const f = getPluginFormat(p);
      if (f) s.add(f);
    }
    const items = Array.from(s).sort();
    return [{ value: "all", label: "All Formats" }].concat(
      items.map((f) => ({ value: f, label: f.toUpperCase() }))
    );
  }, [all]);

  const filtered = React.useMemo(() => {
    let arr = all;

    if (typeFilter !== "all") {
      arr = arr.filter((p) => getPluginType(p) === typeFilter);
    }

    if (vendorFilter !== "all") {
      arr = arr.filter((p) => norm(p?.vendor) === vendorFilter);
    }

    if (formatFilter !== "all") {
      arr = arr.filter((p) => getPluginFormat(p) === formatFilter);
    }

    return arr;
  }, [all, typeFilter, vendorFilter, formatFilter]);

  const activeFilterCount =
    (typeFilter !== "all" ? 1 : 0) +
    (vendorFilter !== "all" ? 1 : 0) +
    (formatFilter !== "all" ? 1 : 0);

  function clearFilters() {
    setTypeFilter("all");
    setVendorFilter("all");
    setFormatFilter("all");
  }

  return (
    <Panel className={["h-full min-h-0 flex flex-col", className].join(" ")}>
      <PanelHeader>
        <div className="flex items-center gap-2 min-w-0">
          <div className="font-semibold tracking-wide text-white/85 truncate">
            INSTALLED
          </div>
          <Badge tone="neutral" className="text-[10px]">
            {filtered.length}/{all.length || data.count || 0}
          </Badge>

          {activeFilterCount > 0 ? (
            <Badge tone="neutral" className="text-[10px]">
              {activeFilterCount} FILTER
              {activeFilterCount > 1 ? "S" : ""}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen(true)}
            className={[
              "text-[11px]",
              "rounded-lg border border-white/10 bg-black/30",
              "px-3 py-1.5",
              "text-white/70",
              "hover:bg-white/6 transition",
              "active:translate-y-[1px]",
            ].join(" ")}
          >
            Filter
          </button>
        </div>
      </PanelHeader>

      <PanelBody className="flex-1 min-h-0">
        <Inset className="h-full min-h-0 p-3 flex flex-col gap-2">

          <SimpleBar className="flex-1 min-h-0 rfxSimpleBar">
            <div className="pr-2">
              <InstalledFxCardArea items={filtered} onPick={onPick} />
            </div>
          </SimpleBar>
        </Inset>
      </PanelBody>

      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        typeValue={typeFilter}
        vendorValue={vendorFilter}
        formatValue={formatFilter}
        typeOptions={typeOptions}
        vendorOptions={vendorOptions}
        formatOptions={formatOptions}
        onTypeChange={setTypeFilter}
        onVendorChange={setVendorFilter}
        onFormatChange={setFormatFilter}
        onClear={clearFilters}
      />
    </Panel>
  );
}

// ---------------------------
// Card Area
// ---------------------------
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

// ---------------------------
// Single card (BIGGER)
// ---------------------------
export function InstalledFxCard({ p, onPick }) {
  const title = labelFor(p);
  const sub = subtitleFor(p);

  // Prefer normalized format for the badge
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