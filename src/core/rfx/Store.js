// src/core/rfx/Store.js
import { create } from "zustand";
import { normalize } from "./Normalize";
import { buildOptimistic } from "./Optimistic";
import { reconcilePending } from "./Reconcile";
import { uid, nowMs } from "./Util";

const MAX_EVENT_LOG = 300;

// ---------------------------
// Event log helpers
// ---------------------------
function pushBounded(list, item, max = MAX_EVENT_LOG) {
    const next = [...(list || []), item];
    if (next.length <= max) return next;
    return next.slice(next.length - max);
}

function summarizeTransitions(prevPendingById, nextPendingById, idsInOrder) {
    const out = {
        acked: [],
        timeout: [],
        failed: [],
        superseded: [],
        stillPending: 0,
    };

    for (const id of idsInOrder || []) {
        const a = prevPendingById?.[id];
        const b = nextPendingById?.[id];
        if (!a || !b) continue;

        const from = String(a.status || "");
        const to = String(b.status || "");

        if (from === to) {
            if (to === "queued" || to === "sent") out.stillPending += 1;
            continue;
        }

        const row = {
            id,
            kind: b.kind,
            from,
            to,
            error: b.error || null,
            ackSeq: b.ackSeq || null,
        };

        if (to === "acked") out.acked.push(row);
        else if (to === "timeout") out.timeout.push(row);
        else if (to === "failed") out.failed.push(row);
        else if (to === "superseded") out.superseded.push(row);
    }

    return out;
}

// ---------------------------
// Overlay merge (unchanged)
// ---------------------------
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

function coerceToTransportCall(intent) {
    if (!intent) return null;
    if (intent.name) return intent;
    if (intent.kind) return { ...intent, name: intent.kind };
    return null;
}

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

    // Perf-ish / VM compatibility
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
        activeTrackGuid: null,
        selectedTrackGuid: null,
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

        // ✅ NEW: bounded timeline
        eventLog: [],
    },

    // ============================================================
    // Event log API
    // ============================================================
    logEvent: (kind, data) => {
        const entry = {
            t: nowMs(),
            kind: String(kind || "event"),
            data: data ?? null,
        };
        set((s) => ({
            ops: { ...s.ops, eventLog: pushBounded(s.ops.eventLog, entry) },
        }));
    },

    clearEventLog: () => {
        set((s) => ({ ops: { ...s.ops, eventLog: [] } }));
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

        // ✅ Gate logs: only log snapshot+reconcile when seq changes
        const prevSeq = Number(get().snapshot?.seq || 0);
        const nextSeq = Number(norm?.snapshot?.seq || 0);
        const seqChanged = nextSeq !== prevSeq && nextSeq !== 0;

        if (seqChanged) {
            get().logEvent("snapshot:received", {
                seq: norm?.snapshot?.seq,
                schema: norm?.snapshot?.schema,
                ts: norm?.snapshot?.ts,
            });
        }

        const prev = get();
        const prevPendingById = prev.ops.pendingById;
        const prevPendingOrder = prev.ops.pendingOrder;

        const { nextOps } = reconcilePending(prev, norm);

        // selection -> guid
        let selectedGuid = prev.session.selectedTrackGuid;
        const idx = Number(norm?.selection?.selectedTrackIndex ?? -1);
        if (idx >= 0) selectedGuid = norm.entities.trackOrder[idx] || null;
        else selectedGuid = null;

        // active track fallback logic
        let activeGuid = prev.session.activeTrackGuid;

        // If VM-style "active bus" exists, prefer it
        const vmActive = norm?.perf?.activeBusId;
        if (vmActive) activeGuid = vmActive;

        if (activeGuid && !norm.entities.tracksByGuid[activeGuid]) activeGuid = null;
        if (!activeGuid) activeGuid = selectedGuid || norm.entities.trackOrder[0] || null;

        // summarize transitions (only useful when seq changes)
        const transitions = summarizeTransitions(
            prevPendingById,
            nextOps.pendingById,
            prevPendingOrder
        );

        set(() => ({
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
                    busModesById: norm.perf.busModesById ?? norm.perf.routingModesById ?? null,
                    metersById: norm.perf.metersById,
                }
                : prev.perf,

            session: {
                ...prev.session,
                activeTrackGuid: activeGuid,
                selectedTrackGuid: selectedGuid,
            },

            ops: {
                ...nextOps,
                // preserve eventLog already stored
                eventLog: get().ops.eventLog,
            },
        }));

        // ✅ Only log transitions when seq changed AND something transitioned
        if (seqChanged) {
            const changed =
                transitions.acked.length +
                transitions.timeout.length +
                transitions.failed.length +
                transitions.superseded.length;

            if (changed > 0) {
                get().logEvent("reconcile:transitions", {
                    acked: transitions.acked,
                    timeout: transitions.timeout,
                    failed: transitions.failed,
                    superseded: transitions.superseded,
                    stillPending: transitions.stillPending,
                });
            }
        }
    },

    // ============================================================
    // Mutation pipeline entrypoint (UI -> Core)
    // ============================================================
    dispatchIntent: async (intent) => {
        const transport = get().transport;

        // ✅ log intent receipt
        get().logEvent("intent:received", intent);

        const call = coerceToTransportCall(intent);
        if (!call || !call.name) return;

        const opId = uid("op");
        const createdAtMs = nowMs();

        const optimistic = buildOptimistic(get(), intent);

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

        // ✅ log optimistic application
        get().logEvent("intent:optimistic_applied", {
            opId,
            kind: call.name,
            optimistic: optimistic || null,
        });

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

            get().logEvent("syscall:error", {
                opId,
                kind: call.name,
                error: "no transport",
            });
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

            // ✅ log syscall sent
            get().logEvent("syscall:sent", { opId, call });

            await transport.syscall(call);
            // ack happens only once snapshots come in and reconcilePending verifies fields
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

            get().logEvent("syscall:error", {
                opId,
                kind: call.name,
                error: msg,
            });
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