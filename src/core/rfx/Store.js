// src/core/rfx/Store.js
import { create } from "zustand";
import { normalize } from "./Normalize";
import { buildOptimistic } from "./Optimistic";
import { reconcilePending } from "./Reconcile";
import { uid, nowMs } from "./Util";

export const useRfxStore = create((set, get) => ({
  // ---------------------------
  // Wiring: we will call transport.syscall(call)
  // ---------------------------
  transport: null,
  setTransport: (transport) => set({ transport }),

  // ---------------------------
  // Snapshot meta
  // ---------------------------
  snapshot: {
    seq: 0,
    schema: "none",
    ts: 0,
    receivedAtMs: 0,
  },

  reaper: { version: "unknown", resourcePath: "" },
  project: { name: "", path: "", templateVersion: "unknown" },
  transportState: null,
  selection: { selectedTrackIndex: -1 },

  // ---------------------------
  // Normalized entities
  // ---------------------------
  entities: {
    tracksByGuid: {},
    trackOrder: [],

    fxByGuid: {},
    fxOrderByTrackGuid: {},

    routesById: {},
    routeIdsByTrackGuid: {},
  },

  // Perf-ish / VM compatibility (so current PerformView can keep working)
  perf: {
    buses: null,
    activeBusId: null,
    busModesById: null,
    metersById: null,
  },

  // ---------------------------
  // RFX-owned session state
  // ---------------------------
  session: {
    activeTrackGuid: null,   // “active bus” concept
    selectedTrackGuid: null, // selection mirror
    selectedFxGuid: null,
  },

  // ---------------------------
  // Pending operations + overlay
  // ---------------------------
  ops: {
    pendingById: {},
    pendingOrder: [],
    overlay: {
      track: {},
      fx: {},
      fxOrderByTrackGuid: {},
    },
    lastError: null,
  },

  // ============================================================
  // Selectors (helpers)
  // ============================================================
  selectTrackEffective: (trackGuid) => {
    const st = get();
    const base = st.entities.tracksByGuid[trackGuid];
    if (!base) return null;
    const patch = st.ops.overlay.track[trackGuid];
    return patch ? { ...base, ...patch } : base;
  },

  selectFxOrderEffective: (trackGuid) => {
    const st = get();
    return (
      st.ops.overlay.fxOrderByTrackGuid[trackGuid] ||
      st.entities.fxOrderByTrackGuid[trackGuid] ||
      []
    );
  },

  selectFxEffective: (fxGuid) => {
    const st = get();
    const base = st.entities.fxByGuid[fxGuid];
    if (!base) return null;
    const patch = st.ops.overlay.fx[fxGuid];
    return patch ? { ...base, ...patch } : base;
  },

  // ============================================================
  // Ingest snapshot (Transport -> Core)
  // ============================================================
  ingestSnapshot: (viewJsonOrVm) => {
    const receivedAtMs = nowMs();
    const norm = normalize(viewJsonOrVm);

    set((s) => {
      const { nextOps } = reconcilePending(s, norm);

      // selection -> guid
      let selectedGuid = s.session.selectedTrackGuid;
      const idx = Number(norm?.selection?.selectedTrackIndex ?? -1);
      if (idx >= 0) selectedGuid = norm.entities.trackOrder[idx] || null;
      else selectedGuid = null;

      // active track fallback logic
      let activeGuid = s.session.activeTrackGuid;

      // If VM-style "active bus" exists, prefer it
      const vmActive = norm?.perf?.activeBusId;
      if (vmActive) activeGuid = vmActive;

      if (activeGuid && !norm.entities.tracksByGuid[activeGuid]) activeGuid = null;
      if (!activeGuid) activeGuid = selectedGuid || norm.entities.trackOrder[0] || null;

      return {
        snapshot: {
          seq: norm.snapshot.seq,
          schema: norm.snapshot.schema,
          ts: norm.snapshot.ts,
          receivedAtMs,
        },
        reaper: norm.reaper,
        project: norm.project,
        transportState: norm.transportState,
        selection: norm.selection,
        entities: norm.entities,

        perf: norm.perf
          ? {
              buses: norm.perf.buses,
              activeBusId: norm.perf.activeBusId,
              busModesById: norm.perf.busModesById,
              metersById: norm.perf.metersById,
            }
          : s.perf,

        session: {
          ...s.session,
          activeTrackGuid: activeGuid,
          selectedTrackGuid: selectedGuid,
        },
        ops: nextOps,
      };
    });
  },

  // ============================================================
  // Mutation pipeline entrypoint (UI -> Core)
  // ============================================================
  dispatchIntent: async (intent) => {
    const st = get();
    const transport = st.transport;

    // Allow either:
    //  - { name: "selectActiveBus", busId: "FX_2" }  (current transport)
    //  - { kind: "selectActiveBus", busId: "FX_2" }  (older style)
    const call = coerceToTransportCall(intent);
    if (!call || !call.name) return;

    const opId = uid("op");
    const createdAtMs = nowMs();

    const optimistic = buildOptimistic(st, intent);

    // register pending + apply overlay
    set((s) => ({
      ops: {
        ...s.ops,
        pendingById: {
          ...s.ops.pendingById,
          [opId]: {
            id: opId,
            kind: call.name,
            status: "queued",
            intent,
            optimistic,
            createdAtMs,
          },
        },
        pendingOrder: [...s.ops.pendingOrder, opId],
        overlay: mergeOverlay(s.ops.overlay, optimistic),
      },
    }));

    if (!transport || typeof transport.syscall !== "function") {
      set((s) => ({
        ops: {
          ...s.ops,
          lastError: { opId, message: "No transport wired into RFX store", atMs: nowMs() },
          pendingById: {
            ...s.ops.pendingById,
            [opId]: { ...s.ops.pendingById[opId], status: "failed", error: "no transport" },
          },
        },
      }));
      return;
    }

    try {
      set((s) => ({
        ops: {
          ...s.ops,
          pendingById: {
            ...s.ops.pendingById,
            [opId]: { ...s.ops.pendingById[opId], status: "sent", sentAtMs: nowMs() },
          },
        },
      }));

      await transport.syscall(call);
      // Ack happens only on ingestSnapshot(seq advance) once you’re on real snapshots.
      // With current MockTransport VM, there is no seq advance guarantee — that’s fine for now.
    } catch (err) {
      const msg = String(err?.message || err);
      set((s) => ({
        ops: {
          ...s.ops,
          lastError: { opId, message: msg, atMs: nowMs() },
          pendingById: {
            ...s.ops.pendingById,
            [opId]: { ...s.ops.pendingById[opId], status: "failed", error: msg },
          },
        },
      }));
    }
  },

  // ------------------------------------------------------------
  // Session helpers
  // ------------------------------------------------------------
  setActiveTrackGuid: (trackGuid) =>
    set((s) => ({ session: { ...s.session, activeTrackGuid: trackGuid } })),

  setSelectedFxGuid: (fxGuid) =>
    set((s) => ({ session: { ...s.session, selectedFxGuid: fxGuid } })),
}));

function coerceToTransportCall(intent) {
  if (!intent) return null;

  // already a transport call
  if (intent.name) return intent;

  // convert kind -> name
  if (intent.kind) return { ...intent, name: intent.kind };

  return null;
}

function mergeOverlay(base, patch) {
  if (!patch) return base;
  return {
    track: { ...(base.track || {}), ...(patch.track || {}) },
    fx: { ...(base.fx || {}), ...(patch.fx || {}) },
    fxOrderByTrackGuid: {
      ...(base.fxOrderByTrackGuid || {}),
      ...(patch.fxOrderByTrackGuid || {}),
    },
  };
}