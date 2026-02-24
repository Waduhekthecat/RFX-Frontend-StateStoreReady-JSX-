import React from "react";
import {
  Panel,
  PanelHeader,
  PanelBody,
  Inset,
} from "../../../app/components/ui/Panel";
import { Badge } from "../../../app/components/ui/Badge";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

import { useInstalledFxFromTransport } from "./UseInstalledFxFromTransport";
import { FilterModal } from "./FilterModal";
import { InstalledFxCardArea } from "./InstalledFxCardArea";
import {
  norm,
  normalizeInstalledFx,
  makeMockInstalledFx,
  getPluginType,
  getPluginFormat,
} from "./InstalledFxUtils";

export function InstalledFxShell({ installedFx, onPick, className = "" }) {
  const fallback = useInstalledFxFromTransport();
  const normalized = normalizeInstalledFx(installedFx ?? fallback);

  // If transport has nothing yet → use mock data
  const data =
    normalized.plugins?.length > 0 ? normalized : makeMockInstalledFx(30);

  const all = data.plugins ?? [];

  const [filterOpen, setFilterOpen] = React.useState(false);

  const [typeFilter, setTypeFilter] = React.useState("all");
  const [vendorFilter, setVendorFilter] = React.useState("all");
  const [formatFilter, setFormatFilter] = React.useState("all");

  const typeOptions = React.useMemo(() => {
    const s = new Set();
    for (const p of all) {
      const t = getPluginType(p);
      if (t) s.add(t);
    }
    const items = Array.from(s).sort();
    return [{ value: "all", label: "All Types" }].concat(
      items.map((t) => ({ value: t, label: String(t).toUpperCase() }))
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
      items.map((f) => ({ value: f, label: String(f).toUpperCase() }))
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
              {activeFilterCount} FILTER{activeFilterCount > 1 ? "S" : ""}
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