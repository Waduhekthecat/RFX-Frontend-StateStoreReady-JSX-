// src/core/rfx/RFXCore.jsx
import { create } from "zustand";

/**
 * RFXCore (single-file for now)
 * - Consumes structured snapshots (authoritative) built from rfx_view.json
 * - Maintains optimistic overlay
 * - Tracks pending operations
 * - Never performs I/O; Transport is injected via setTransport()
 */

// =====================================================
// Helpers
// =====================================================
function nowMs() {
  return Date.now();
}

function newOpId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function newLocalFxId(trackId) {
  return `fx_local_${trackId}_${Math.random().toString(16).slice(2)}`;
}

function isNum(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function norm(s) {
  return String(s ?? "").trim();
}

// =====================================================
// Naming / grouping helpers for your trackName conventions
// - Bus:     FX_1, FX_2, FX_3, FX_4 ...
// - Lanes:   FX_1A, FX_1B, FX_1C ...
// - INPUT:   INPUT
// =====================================================
const BUS_RE = /^FX_(\d+)$/i;
const LANE_RE = /^FX_(\d+)([ABC])$/i;

function parseBusIdFromName(trackName) {
  const m = norm(trackName).match(BUS_RE);
  if (!m) return null;
  return `FX_${m[1]}`;
}

function parseLaneFromName(trackName) {
  const m = norm(trackName).match(LANE_RE);
  if (!m) return null;
  return { busId: `FX_${m[1]}`, lane: m[2].toUpperCase() }; // A/B/C
}

function laneOrderKey(laneLetter) {
  // deterministic order A, B, C
  if (laneLetter === "A") return 0;
  if (laneLetter === "B") return 1;
  if (laneLetter === "C") return 2;
  return 9;
}

// =====================================================
// Constraints (business rules live here)
// =====================================================
const MAX_PLUGINS_PER_TRACK = 16;

function assertCanAddFx(chain) {
  const count = chain?.fxIds?.length ?? 0;
  if (count >= MAX_PLUGINS_PER_TRACK) {
    throw new Error(`Max plugins per track is ${MAX_PLUGINS_PER_TRACK}`);
  }
}

function assertCanReorder(chain, from, to) {
  const len = chain?.fxIds?.length ?? 0;
  if (!isNum(from) || !isNum(to)) throw new Error("from/to must be numbers");
  if (from < 0 || from >= len) throw new Error("Invalid 'from' index");
  if (to < 0 || to >= len) throw new Error("Invalid 'to' index");
}

// =====================================================
// Snapshot builder (View JSON -> Snapshot)
// This is the critical glue between your current rfx_view.json
// and the RFXCore domain snapshot.
// =====================================================
function emptyChain(trackId) {
  return { trackId, fxIds: [], fxById: {} };
}

/**
 * buildSnapshotFromView(view)
 * Input: your rfx_view.json object
 * Output snapshot shape:
 * {
 *   busesById: { FX_1:{...}, ... },
 *   tracksById: { [guid]:{...} },
 *   tracksByIndex: { [idx]: guid },
 *   busMembersByBusId: { FX_1:[trackGuidA, trackGuidB], ... },
 *   chainByTrackId: { [guid]: Chain },
 *   updatedAtMs,
 *   seq
 * }
 */
export function buildSnapshotFromView(view) {
  const tracks = Array.isArray(view?.tracks) ? view.tracks : [];

  const tracksById = {};
  const tracksByIndex = {};
  const chainByTrackId = {};

  const busesById = {};
  const busMembersByBusId = {}; // busId -> [{ lane, trackId, trackIndex }...]

  // 1) Normalize tracks
  for (const t of tracks) {
    const trackGuid = norm(t?.trackGuid);
    if (!trackGuid) continue;

    const trackIndex = Number(t?.trackIndex);
    const trackName = norm(t?.trackName) || "Unknown";
    const recArm = Boolean(t?.recArm);

    const track = {
      id: trackGuid, // TrackId = GUID
      guid: trackGuid,
      trackIndex,
      name: trackName,
      recArm,
    };

    tracksById[trackGuid] = track;
    if (Number.isFinite(trackIndex)) tracksByIndex[String(trackIndex)] = trackGuid;

    // initialize empty chain (until your schema includes FX list)
    chainByTrackId[trackGuid] = emptyChain(trackGuid);

    // 2) Identify buses and lanes by name
    const busId = parseBusIdFromName(trackName);
    if (busId) {
      busesById[busId] = {
        id: busId,
        name: busId,
        // optional: store the bus trackId for convenience
        busTrackId: trackGuid,
        busTrackIndex: trackIndex,
      };
      if (!busMembersByBusId[busId]) busMembersByBusId[busId] = [];
      continue;
    }

    const lane = parseLaneFromName(trackName);
    if (lane) {
      if (!busMembersByBusId[lane.busId]) busMembersByBusId[lane.busId] = [];
      busMembersByBusId[lane.busId].push({
        lane: lane.lane,
        trackId: trackGuid,
        trackIndex,
      });
      continue;
    }
  }

  // 3) Sort lane members A/B/C and reduce to just trackIds for UI
  const busMembersIdsByBusId = {};
  for (const busId of Object.keys(busMembersByBusId)) {
    const arr = busMembersByBusId[busId] || [];
    arr.sort((a, b) => laneOrderKey(a.lane) - laneOrderKey(b.lane));
    busMembersIdsByBusId[busId] = arr.map((x) => x.trackId);

    // ensure bus exists even if only lanes exist (defensive)
    if (!busesById[busId]) {
      busesById[busId] = { id: busId, name: busId };
    }
  }

  // 4) updatedAtMs / seq
  const seq = Number(view?.seq);
  const ts = Number(view?.ts); // seconds in your example
  const updatedAtMs =
    Number.isFinite(seq) ? seq : Number.isFinite(ts) ? ts * 1000 : nowMs();

  return {
    busesById,
    tracksById,
    tracksByIndex,
    busMembersByBusId: busMembersIdsByBusId,
    chainByTrackId,
    updatedAtMs,
    seq: Number.isFinite(seq) ? seq : undefined,
    schema: view?.schema,
    projectName: view?.projectName,
    projectPath: view?.projectPath,
  };
}

// =====================================================
// Overlay helpers
// =====================================================
function getBaseChain(snapshot, overlay, trackId) {
  const over = overlay?.chainByTrackId?.[trackId];
  if (over) return over;

  const snap = snapshot?.chainByTrackId?.[trackId];
  if (snap) return snap;

  return emptyChain(trackId);
}

function putOverlayChain(overlay, chain) {
  return {
    ...overlay,
    chainByTrackId: {
      ...(overlay?.chainByTrackId ?? {}),
      [chain.trackId]: chain,
    },
  };
}

// =====================================================
// Effective selectors (snapshot + overlay, overlay wins)
// =====================================================
function effectiveChainByTrackId(state) {
  const snap = state.snapshot?.chainByTrackId ?? {};
  const over = state.overlay?.chainByTrackId ?? {};
  return { ...snap, ...over };
}

function getChain(state, trackId) {
  const map = effectiveChainByTrackId(state);
  return map?.[trackId] ?? null;
}

function getFx(state, trackId, fxId) {
  const ch = getChain(state, trackId);
  return ch?.fxById?.[fxId] ?? null;
}

function getTrack(state, trackId) {
  return state.snapshot?.tracksById?.[trackId] ?? null;
}

function getTrackByIndex(state, trackIndex) {
  const id = state.snapshot?.tracksByIndex?.[String(trackIndex)];
  return id ? state.snapshot?.tracksById?.[id] ?? null : null;
}

function getAllBuses(state) {
  const buses = state.snapshot?.busesById ?? {};
  return Object.values(buses);
}

function getBusMembers(state, busId) {
  const ids = state.snapshot?.busMembersByBusId?.[busId] ?? [];
  return ids.map((id) => state.snapshot?.tracksById?.[id]).filter(Boolean);
}

// =====================================================
// Chain transforms (pure)
// =====================================================
function addFxToChain(chain, fx) {
  return {
    ...chain,
    fxIds: [...(chain.fxIds || []), fx.id],
    fxById: { ...(chain.fxById || {}), [fx.id]: fx },
  };
}

function removeFxFromChain(chain, fxId) {
  const { [fxId]: _, ...rest } = chain.fxById || {};
  return {
    ...chain,
    fxIds: (chain.fxIds || []).filter((id) => id !== fxId),
    fxById: rest,
  };
}

function toggleFxInChain(chain, fxId) {
  const fx = chain.fxById?.[fxId];
  if (!fx) return chain;
  return {
    ...chain,
    fxById: {
      ...chain.fxById,
      [fxId]: { ...fx, enabled: !fx.enabled },
    },
  };
}

function reorderFxInChain(chain, from, to) {
  const arr = [...(chain.fxIds || [])];
  const [moved] = arr.splice(from, 1);
  arr.splice(to, 0, moved);
  return { ...chain, fxIds: arr };
}

// =====================================================
// Reconciliation (v1 heuristic)
// Note: Once REAPER echoes opId or provides richer chain state,
// we’ll make this deterministic.
// =====================================================
function chainsEqual(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;

  const aIds = a.fxIds || [];
  const bIds = b.fxIds || [];
  if (aIds.length !== bIds.length) return false;

  for (let i = 0; i < aIds.length; i++) {
    const afx = a.fxById?.[aIds[i]];
    const bfx = b.fxById?.[bIds[i]];
    if (!afx || !bfx) return false;

    if (Boolean(afx.enabled) !== Boolean(bfx.enabled)) return false;
    if ((afx.plugin?.raw ?? "") !== (bfx.plugin?.raw ?? "")) return false;
  }
  return true;
}

function shouldAckOp(op, snap) {
  // Heuristic (safe default): if snapshot seq advanced, we *may* ack.
  // You can tighten this as soon as snapshot includes chain data.
  if (!snap) return false;
  if (typeof snap.seq === "number" && typeof op.createdAtMs === "number") {
    // if seq looks like ms timestamp, it will almost always be >= createdAtMs after updates
    if (snap.seq >= op.createdAtMs) return true;
  }
  return false;
}

function pendingForTrack(pendingOps, trackId) {
  return (pendingOps || []).filter(
    (p) => p.trackId === trackId && p.status === "pending"
  );
}

function reconcileCommit(prevState, snap) {
  const nextSnapshot = snap;

  const nextPendingOps = (prevState.pendingOps || []).map((op) => {
    if (op.status !== "pending") return op;
    return shouldAckOp(op, nextSnapshot) ? { ...op, status: "acked" } : op;
  });

  const over = prevState.overlay?.chainByTrackId ?? {};
  const nextOverlayChains = { ...over };

  const effective = effectiveChainByTrackId(prevState);

  Object.keys(nextOverlayChains).forEach((trackId) => {
    const snapChain = nextSnapshot?.chainByTrackId?.[trackId];
    const effChain = effective?.[trackId];
    const stillPending = pendingForTrack(nextPendingOps, trackId).length > 0;

    // If snapshot doesn't have chain data yet, we should NOT prune overlay based on equality.
    // Only prune when snapshot chain exists AND equals effective chain AND nothing pending.
    if (!stillPending && snapChain && chainsEqual(snapChain, effChain)) {
      delete nextOverlayChains[trackId];
    }
  });

  const nextOverlay =
    Object.keys(nextOverlayChains).length === 0
      ? {}
      : { ...prevState.overlay, chainByTrackId: nextOverlayChains };

  return {
    snapshot: nextSnapshot,
    pendingOps: nextPendingOps,
    overlay: nextOverlay,
  };
}

// =====================================================
// Pending op creation
// =====================================================
function makePendingOp(kind, trackId, payload) {
  return {
    opId: newOpId(),
    kind,
    trackId,
    payload,
    status: "pending",
    createdAtMs: nowMs(),
  };
}

// =====================================================
// Store (public API)
// =====================================================
export const useRFXCore = create((set, get) => ({
  snapshot: null,
  overlay: {},
  pendingOps: [],

  // injected adapter (no I/O here)
  transport: null,

  // ---------------------------
  // Wiring
  // ---------------------------
  setTransport: (transport) => set({ transport: transport || null }),

  // ---------------------------
  // Snapshot intake
  // ---------------------------
  commitSnapshot: (snapshot) => {
    set((prev) => reconcileCommit(prev, snapshot));
  },

  // Convenience: commit directly from raw rfx_view.json
  commitViewJson: (viewJson) => {
    const snapshot = buildSnapshotFromView(viewJson);
    set((prev) => reconcileCommit(prev, snapshot));
  },

  // ---------------------------
  // Selectors (effective)
  // ---------------------------
  selectors: {
    effectiveChainByTrackId: () => effectiveChainByTrackId(get()),
    getChain: (trackId) => getChain(get(), trackId),
    getFx: (trackId, fxId) => getFx(get(), trackId, fxId),

    getTrack: (trackId) => getTrack(get(), trackId),
    getTrackByIndex: (trackIndex) => getTrackByIndex(get(), trackIndex),

    getAllBuses: () => getAllBuses(get()),
    getBusMembers: (busId) => getBusMembers(get(), busId),
  },

  // ---------------------------
  // Actions (optimistic)
  // ---------------------------
  addFx: (trackId, plugin) => {
    const s = get();
    const base = getBaseChain(s.snapshot, s.overlay, trackId);

    assertCanAddFx(base);

    const localFxId = newLocalFxId(trackId);
    const fx = { id: localFxId, plugin, enabled: true };
    const nextChain = addFxToChain(base, fx);

    const op = makePendingOp("addFx", trackId, { plugin, localFxId });

    set({
      overlay: putOverlayChain(s.overlay, nextChain),
      pendingOps: [...s.pendingOps, op],
    });

    s.transport?.syscall?.("addFx", { trackId, plugin, opId: op.opId });

    return op.opId;
  },

  removeFx: (trackId, fxId) => {
    const s = get();
    const base = getBaseChain(s.snapshot, s.overlay, trackId);
    const nextChain = removeFxFromChain(base, fxId);

    const op = makePendingOp("removeFx", trackId, { fxId });

    set({
      overlay: putOverlayChain(s.overlay, nextChain),
      pendingOps: [...s.pendingOps, op],
    });

    s.transport?.syscall?.("removeFx", { trackId, fxId, opId: op.opId });

    return op.opId;
  },

  toggleFx: (trackId, fxId) => {
    const s = get();
    const base = getBaseChain(s.snapshot, s.overlay, trackId);
    const nextChain = toggleFxInChain(base, fxId);

    const op = makePendingOp("toggleFx", trackId, { fxId });

    set({
      overlay: putOverlayChain(s.overlay, nextChain),
      pendingOps: [...s.pendingOps, op],
    });

    s.transport?.syscall?.("toggleFx", { trackId, fxId, opId: op.opId });

    return op.opId;
  },

  reorderFx: (trackId, from, to) => {
    const s = get();
    const base = getBaseChain(s.snapshot, s.overlay, trackId);

    assertCanReorder(base, from, to);

    const nextChain = reorderFxInChain(base, from, to);

    const op = makePendingOp("reorderFx", trackId, { from, to });

    set({
      overlay: putOverlayChain(s.overlay, nextChain),
      pendingOps: [...s.pendingOps, op],
    });

    s.transport?.syscall?.("reorderFx", { trackId, from, to, opId: op.opId });

    return op.opId;
  },

  // ---------------------------
  // Pending ops
  // ---------------------------
  markOpFailed: (opId) => {
    set((prev) => ({
      pendingOps: (prev.pendingOps || []).map((op) =>
        op.opId === opId ? { ...op, status: "failed" } : op
      ),
    }));
  },

  clearAckedOps: () => {
    set((prev) => ({
      pendingOps: (prev.pendingOps || []).filter((op) => op.status !== "acked"),
    }));
  },
}));

// src/core/rfx/RFXCore.js
// Thin facade so the rest of the app imports from one place.
export { useRfxStore } from "./Store";