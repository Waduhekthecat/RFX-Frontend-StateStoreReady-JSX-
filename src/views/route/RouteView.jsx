// src/views/route/RouteView.jsx
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTransport } from "../../core/transport/TransportProvider";

// ----------------------------
// VM
// ----------------------------
function useVM() {
  const t = useTransport();
  const [vm, setVm] = React.useState(() => t.getSnapshot());
  React.useEffect(() => t.subscribe(setVm), [t]);
  return vm;
}

function asArray(x) {
  return Array.isArray(x) ? x : [];
}
function norm(s) {
  return String(s ?? "").trim();
}

function normalizeMode(m) {
  const x = String(m || "linear").toLowerCase();
  if (x === "parallel") return "parallel";
  if (x === "lcr") return "lcr";
  return "linear";
}
function lanesForMode(mode) {
  const m = normalizeMode(mode);
  if (m === "parallel") return ["A", "B"];
  if (m === "lcr") return ["A", "B", "C"];
  return ["A"];
}

function extractBuses(vm) {
  const buses =
    asArray(vm?.buses) ||
    asArray(vm?.busList) ||
    asArray(vm?.states) ||
    asArray(vm?.session?.buses);

  if (buses.length) {
    if (typeof buses[0] === "string") return buses.map((id) => ({ id }));
    return buses;
  }
  return [{ id: "FX_1" }, { id: "FX_2" }, { id: "FX_3" }, { id: "FX_4" }];
}

function busIdOf(bus, i) {
  return norm(bus?.id) || norm(bus?.busId) || norm(bus?.name) || `FX_${i + 1}`;
}

// ----------------------------
// Armed detection (best-effort)
// ----------------------------
function isLaneArmed(vm, busId, laneLetter) {
  const laneId = `${busId}${laneLetter}`;

  const armedList =
    asArray(vm?.armedTracks) || asArray(vm?.armed) || asArray(vm?.recordArmed);
  if (armedList.includes(laneId)) return true;

  if (vm?.recArmed && typeof vm.recArmed === "object") {
    if (vm.recArmed[laneId]) return true;
  }

  const tracks = asArray(vm?.tracks) || asArray(vm?.session?.tracks) || [];
  const tr = tracks.find(
    (t) => norm(t?.id) === laneId || norm(t?.name) === laneId
  );
  if (!tr) return false;

  return Boolean(
    tr?.recArm ??
      tr?.rec_armed ??
      tr?.armed ??
      tr?.isArmed ??
      tr?.recordArmed ??
      tr?.record_arm
  );
}

// ----------------------------
// Diagram geometry helpers
// ----------------------------
function centerLeft(rect) {
  return { x: rect.left, y: rect.top + rect.height / 2 };
}
function centerRight(rect) {
  return { x: rect.left + rect.width, y: rect.top + rect.height / 2 };
}
function toLocal(pt, originRect) {
  return { x: pt.x - originRect.left, y: pt.y - originRect.top };
}

function cablePath(a, b, tension = 0.5) {
  const dx = Math.max(40, (b.x - a.x) * tension);
  const c1 = { x: a.x + dx, y: a.y };
  const c2 = { x: b.x - dx, y: b.y };
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}

function strokeFor(active) {
  return active ? "rgba(34,197,94,0.95)" : "rgba(255,255,255,0.18)";
}
function strokeW(active) {
  return active ? 2.8 : 1.4;
}

// ----------------------------
// Small UI pieces
// ----------------------------
function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-black/25",
        "shadow-[0_12px_35px_rgba(0,0,0,0.45)]",
        "backdrop-blur-[2px]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function NodePill({ label, active }) {
  return (
    <div
      className={[
        "px-4 py-3 rounded-2xl border bg-black/20",
        active
          ? "border-green-400/40 ring-1 ring-green-400/30"
          : "border-white/10",
      ].join(" ")}
    >
      <div className="text-sm font-semibold tracking-wide">{label}</div>
    </div>
  );
}

function MiniLabel({ children, dim }) {
  return (
    <div className={["text-xs opacity-70", dim ? "opacity-30" : ""].join(" ")}>
      {children}
    </div>
  );
}

// ----------------------------
// RouteView
// ----------------------------
export function RouteView() {
  const vm = useVM();

  const buses = useMemo(() => extractBuses(vm), [vm]);
  const activeBusId = norm(vm?.activeBusId || "");
  const busModes = vm?.busModes || {};

  const rows = useMemo(() => {
    return buses.slice(0, 4).map((b, i) => {
      const id = busIdOf(b, i);
      const mode = normalizeMode(busModes?.[id] || b?.mode || "linear");
      const enabledLetters = lanesForMode(mode); // ["A"] | ["A","B"] | ["A","B","C"]
      return { id, mode, enabledLetters };
    });
  }, [buses, busModes]);

  // Lane ids to render:
  // - If we detect ANY armed lane in this bus, show only armed lanes
  // - Otherwise show all enabled lanes (mode-derived) so PAR shows A+B, LCR shows A+B+C
  const laneIdsByBus = useMemo(() => {
    const out = {};
    for (const r of rows) {
      const enabled = r.enabledLetters;

      const armedLetters = enabled.filter((L) => isLaneArmed(vm, r.id, L));
      const hasAnyArmed = armedLetters.length > 0;

      const lettersToRender = hasAnyArmed ? armedLetters : enabled;

      out[r.id] = lettersToRender.map((L) => `${r.id}${L}`);
    }
    return out;
  }, [rows, vm]);

  // Refs for measuring ports
  const stageRef = useRef(null);
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  const laneRefs = useRef({});
  const busRefs = useRef({});

  const [layout, setLayout] = useState(null);

  useLayoutEffect(() => {
    if (!stageRef.current) return;

    const measure = () => {
      const stageRect = stageRef.current.getBoundingClientRect();

      const inputEl = inputRef.current;
      const outputEl = outputRef.current;
      if (!inputEl || !outputEl) return;

      const inputRect = inputEl.getBoundingClientRect();
      const outputRect = outputEl.getBoundingClientRect();

      const laneRects = {};
      const busRects = {};

      for (const r of rows) {
        const busEl = busRefs.current[r.id];
        if (busEl) busRects[r.id] = busEl.getBoundingClientRect();

        const laneIds = laneIdsByBus[r.id] || [];
        for (const laneId of laneIds) {
          const el = laneRefs.current[laneId];
          if (el) laneRects[laneId] = el.getBoundingClientRect();
        }
      }

      setLayout({ stageRect, inputRect, outputRect, laneRects, busRects });
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(stageRef.current);

    const t = setTimeout(measure, 0);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [rows, laneIdsByBus]);

  const cables = useMemo(() => {
    if (!layout) return [];

    const { stageRect, inputRect, outputRect, laneRects, busRects } = layout;

    const inPort = toLocal(centerRight(inputRect), stageRect);
    const outPort = toLocal(centerLeft(outputRect), stageRect);

    const result = [];

    for (const r of rows) {
      const isActiveBus = r.id === activeBusId;
      const laneIds = laneIdsByBus[r.id] || [];

      // Input → lane(s)
      for (const laneId of laneIds) {
        const laneRect = laneRects[laneId];
        if (!laneRect) continue;

        const a = inPort;
        const b = toLocal(centerLeft(laneRect), stageRect);

        result.push({
          key: `in-${laneId}`,
          d: cablePath(a, b, 0.55),
          active: isActiveBus,
        });
      }

      const busRect = busRects[r.id];
      if (busRect) {
        const busIn = toLocal(centerLeft(busRect), stageRect);

        // lane(s) → bus
        for (const laneId of laneIds) {
          const laneRect = laneRects[laneId];
          if (!laneRect) continue;

          const laneOut = toLocal(centerRight(laneRect), stageRect);

          result.push({
            key: `lane-${laneId}-to-bus-${r.id}`,
            d: cablePath(laneOut, busIn, 0.5),
            active: isActiveBus,
          });
        }

        // bus → output
        const busOut = toLocal(centerRight(busRect), stageRect);
        result.push({
          key: `bus-${r.id}-to-out`,
          d: cablePath(busOut, outPort, 0.35),
          active: isActiveBus,
        });
      }
    }

    return result;
  }, [layout, rows, activeBusId, laneIdsByBus]);

  return (
    <div className="h-full w-full flex flex-col min-h-0">
      {/* Header removed */}

      <div className="flex-1 min-h-0 px-5 pb-5 pt-5">
        <Card className="h-full p-6 relative overflow-hidden">
          {/* Stage */}
          <div ref={stageRef} className="absolute inset-0">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <filter id="rfxGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {cables.map((c) => (
                <path
                  key={c.key}
                  d={c.d}
                  fill="none"
                  stroke={c.active ? strokeFor(true) : strokeFor(false)}
                  strokeWidth={strokeW(c.active)}
                  strokeLinecap="round"
                  filter={c.active ? "url(#rfxGlow)" : "none"}
                />
              ))}
            </svg>
          </div>

          {/* Content */}
          <div className="relative h-full">
            <div
              className="grid h-full"
              style={{
                gridTemplateColumns: "170px 1fr 220px 170px",
                columnGap: 28,
                alignItems: "center",
              }}
            >
              {/* INPUT */}
              <div className="flex items-center justify-center">
                <div ref={inputRef}>
                  <NodePill label="INPUT" />
                </div>
              </div>

              {/* LANES */}
              <div className="flex flex-col justify-center gap-6">
                {rows.map((r) => {
                  const isActive = r.id === activeBusId;
                  const laneIds = laneIdsByBus[r.id] || [];

                  return (
                    <div
                      key={r.id}
                      className="rounded-3xl border border-white/5 bg-black/10 px-3 py-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <MiniLabel>{r.id}</MiniLabel>
                        <MiniLabel>
                          {r.mode === "linear"
                            ? "Linear"
                            : r.mode === "parallel"
                            ? "Parallel"
                            : "LCR"}
                        </MiniLabel>
                      </div>

                      <div className="flex flex-col gap-2">
                        {laneIds.map((laneId) => (
                          <div
                            key={laneId}
                            ref={(el) => {
                              if (el) laneRefs.current[laneId] = el;
                            }}
                          >
                            <NodePill label={laneId} active={isActive} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* BUSES */}
              <div className="flex flex-col justify-center gap-[64px]">
                {rows.map((r) => {
                  const isActive = r.id === activeBusId;
                  return (
                    <div key={r.id} className="flex items-center justify-center">
                      <div
                        ref={(el) => {
                          if (el) busRefs.current[r.id] = el;
                        }}
                      >
                        <NodePill label={r.id} active={isActive} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* OUTPUT */}
              <div className="flex items-center justify-center">
                <div ref={outputRef}>
                  <NodePill label="OUTPUT" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}