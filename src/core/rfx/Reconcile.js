// src/core/rfx/Reconcile.js

const OP_TIMEOUT_MS = 8000;
const EPS = 1e-4;

function isMockVm(norm) {
    const schema = String(norm?.snapshot?.schema || "");
    return schema.startsWith("mock_vm");
}

export function reconcilePending(prevState, norm) {
    const now = Date.now();

    const pendingOrder = prevState?.ops?.pendingOrder || [];
    const pendingById = prevState?.ops?.pendingById || {};
    const prevOverlay = prevState?.ops?.overlay || {
        track: {},
        fx: {},
        fxOrderByTrackGuid: {},
    };

    const collapsed = computeCollapsedSet(pendingOrder, pendingById);

    const nextPendingById = { ...pendingById };
    const nextPendingOrder = [];
    let overlay = prevOverlay;

    const prevSeq = Number(prevState?.snapshot?.seq || 0);
    const nextSeq = Number(norm?.snapshot?.seq || 0);
    const seqAdvanced = nextSeq > prevSeq;

    for (const opId of pendingOrder) {
        const op = nextPendingById[opId];
        if (!op) continue;

        if (collapsed.has(opId)) {
            nextPendingById[opId] = { ...op, status: "superseded" };
            overlay = clearOverlayForOp(overlay, op);
            continue;
        }

        if (op.status === "acked" || op.status === "failed" || op.status === "timeout") {
            continue;
        }

        if (op.status === "sent") {
            const sentAt = Number(op.sentAtMs || 0);
            if (sentAt && now - sentAt > OP_TIMEOUT_MS) {
                nextPendingById[opId] = {
                    ...op,
                    status: "timeout",
                    error: `Timed out after ${OP_TIMEOUT_MS}ms`,
                };
                overlay = clearOverlayForOp(overlay, op);
                continue;
            }
        }

        if (!seqAdvanced && prevSeq !== 0) {
            nextPendingOrder.push(opId);
            continue;
        }

        const ok = opMatchesSnapshot(op, norm);

        if (ok) {
            nextPendingById[opId] = { ...op, status: "acked", ackSeq: nextSeq || prevSeq };
            overlay = clearOverlayForOp(overlay, op);
            continue;
        }

        nextPendingOrder.push(opId);
    }

    return {
        nextOps: {
            pendingById: nextPendingById,
            pendingOrder: nextPendingOrder,
            overlay,
            lastError: prevState?.ops?.lastError || null,
        },
    };
}

function opMatchesSnapshot(op, norm) {
    const intent = op?.intent || {};
    const kind = intent.kind || intent.name || op.kind;

    const tracksByGuid = norm?.entities?.tracksByGuid || {};
    const fxByGuid = norm?.entities?.fxByGuid || {};
    const fxOrderByTrackGuid = norm?.entities?.fxOrderByTrackGuid || {};
    const routesById = norm?.entities?.routesById || {};

    switch (kind) {
        case "toggleRecArm": {
            const { trackGuid, value } = intent;
            const tr = tracksByGuid[trackGuid];
            if (!tr) return false;
            return !!tr.recArm === !!value;
        }

        case "toggleMute": {
            const { trackGuid, value } = intent;
            const tr = tracksByGuid[trackGuid];
            if (!tr) return false;
            return !!tr.mute === !!value;
        }

        case "toggleSolo": {
            const { trackGuid, value } = intent;
            const tr = tracksByGuid[trackGuid];
            if (!tr) return false;
            const soloOn = Number(tr.solo || 0) !== 0;
            return soloOn === !!value;
        }

        case "setVol": {
            const { trackGuid, value } = intent;
            const tr = tracksByGuid[trackGuid];
            if (!tr) return false;
            return nearlyEqual(Number(tr.vol), Number(value), EPS);
        }

        case "setPan": {
            const { trackGuid, value } = intent;
            const tr = tracksByGuid[trackGuid];
            if (!tr) return false;
            return nearlyEqual(Number(tr.pan), Number(value), EPS);
        }

        case "toggleFx": {
            const { fxGuid, value } = intent;
            const fx = fxByGuid[fxGuid];
            if (!fx) return false;
            return !!fx.enabled === !!value;
        }

        case "reorderFx": {
            const { trackGuid, fromIndex, toIndex } = intent;
            if (!trackGuid) return false;

            const expected = expectedFxOrderFromIntentOrOptimistic(
                op,
                fxOrderByTrackGuid,
                trackGuid,
                fromIndex,
                toIndex
            );
            if (!expected) return false;

            const actual = fxOrderByTrackGuid[trackGuid] || [];
            return arrayEqual(actual, expected);
        }

        // ✅ setRoutingMode verified by lane recArm
        case "setRoutingMode": {
            const { busId, mode } = intent || {};
            if (!busId) return false;

            // ✅ MOCK VM verification: check perf busModesById
            if (isMockVm(norm)) {
                const want = normalizeMode(mode);
                const actual = normalizeMode(
                    norm?.perf?.busModesById?.[busId] ??
                    norm?.perf?.routingModesById?.[busId] ??
                    "linear"
                );
                return actual === want;
            }

            // ✅ REAL REAPER verification: lane recArm state
            const lanes = findLaneGuidsForBusByName(tracksByGuid, busId);
            const want = normalizeMode(mode);

            const wantA = want === "linear" || want === "parallel" || want === "lcr";
            const wantB = want === "parallel" || want === "lcr";
            const wantC = want === "lcr";

            if (lanes.A) {
                const trA = tracksByGuid[lanes.A];
                if (!trA || !!trA.recArm !== !!wantA) return false;
            }
            if (lanes.B) {
                const trB = tracksByGuid[lanes.B];
                if (!trB || !!trB.recArm !== !!wantB) return false;
            }
            if (lanes.C) {
                const trC = tracksByGuid[lanes.C];
                if (!trC || !!trC.recArm !== !!wantC) return false;
            }

            return true;
        }

        // ✅ selectActiveBus verified by:
        //  1) REAPER session.activeBusId equals requested busId
        //  2) INPUT sends (routes) target the ARMED lanes for that bus
        case "selectActiveBus": {
            const { busId } = intent || {};
            if (!busId) return false;

            // ✅ MOCK VM verification (no INPUT/routes)
            const schema = String(norm?.snapshot?.schema || "");
            if (schema.startsWith("mock_vm")) {
                const active = String(
                    norm?.session?.activeBusId || norm?.perf?.activeBusId || ""
                );
                return active === busId;
            }

            // ✅ REAL REAPER verification
            const activeBusId = String(norm?.session?.activeBusId || "");
            if (activeBusId !== busId) return false;

            const inputGuid = mustFindInputTrackGuidByName(tracksByGuid);
            const armedLaneGuids = armedLaneGuidsForBus(tracksByGuid, busId);
            const actualDestGuids = collectInputSendDestGuids(routesById, inputGuid);

            return setEqual(actualDestGuids, armedLaneGuids);
        }

        case "syncView":
        default:
            return true;
    }
}

function armedLaneGuidsForBus(tracksByGuid, busId) {
    const lanes = findLaneGuidsForBusByName(tracksByGuid, busId);
    const out = [];
    if (lanes.A && tracksByGuid[lanes.A]?.recArm) out.push(lanes.A);
    if (lanes.B && tracksByGuid[lanes.B]?.recArm) out.push(lanes.B);
    if (lanes.C && tracksByGuid[lanes.C]?.recArm) out.push(lanes.C);
    return out;
}

function collectInputSendDestGuids(routesById, inputGuid) {
    const out = [];
    for (const id of Object.keys(routesById || {})) {
        const e = routesById[id];
        if (!e) continue;
        if (e.category !== "send") continue;
        if (String(e.trackGuid || "") !== String(inputGuid)) continue;
        const dest = String(e.destTrackGuid || "");
        if (dest) out.push(dest);
    }
    return out;
}

function expectedFxOrderFromIntentOrOptimistic(op, fxOrderByTrackGuid, trackGuid, fromIndex, toIndex) {
    const optimistic = op?.optimistic;
    const maybe = optimistic?.fxOrderByTrackGuid?.[trackGuid];
    if (Array.isArray(maybe)) return maybe;

    const base = fxOrderByTrackGuid?.[trackGuid];
    if (!Array.isArray(base)) return null;

    const order = base.slice();
    if (
        fromIndex == null ||
        toIndex == null ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= order.length ||
        toIndex >= order.length
    ) {
        return null;
    }

    const [moved] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, moved);
    return order;
}

function computeCollapsedSet(pendingOrder, pendingById) {
    const collapsed = new Set();
    const lastVol = new Map();
    const lastPan = new Map();

    for (const opId of pendingOrder) {
        const op = pendingById[opId];
        if (!op) continue;

        const intent = op.intent || {};
        const kind = intent.kind || intent.name || op.kind;

        if (kind === "setVol") {
            const k = intent.trackGuid;
            if (!k) continue;
            if (lastVol.has(k)) collapsed.add(lastVol.get(k));
            lastVol.set(k, opId);
        }

        if (kind === "setPan") {
            const k = intent.trackGuid;
            if (!k) continue;
            if (lastPan.has(k)) collapsed.add(lastPan.get(k));
            lastPan.set(k, opId);
        }
    }

    return collapsed;
}

function clearOverlayForOp(overlay, op) {
    const optimistic = op?.optimistic;
    if (!optimistic) return overlay;

    const next = {
        track: { ...(overlay.track || {}) },
        fx: { ...(overlay.fx || {}) },
        fxOrderByTrackGuid: { ...(overlay.fxOrderByTrackGuid || {}) },
    };

    if (optimistic.track) {
        for (const guid of Object.keys(optimistic.track)) delete next.track[guid];
    }
    if (optimistic.fx) {
        for (const guid of Object.keys(optimistic.fx)) delete next.fx[guid];
    }
    if (optimistic.fxOrderByTrackGuid) {
        for (const trackGuid of Object.keys(optimistic.fxOrderByTrackGuid)) {
            delete next.fxOrderByTrackGuid[trackGuid];
        }
    }

    return next;
}

function nearlyEqual(a, b, eps) {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    return Math.abs(a - b) <= eps;
}

function arrayEqual(a, b) {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

function normalizeMode(m) {
    const x = String(m || "linear").toLowerCase();
    if (x === "lcr") return "lcr";
    if (x === "parallel") return "parallel";
    return "linear";
}

function mustFindInputTrackGuidByName(tracksByGuid) {
    for (const guid of Object.keys(tracksByGuid || {})) {
        const tr = tracksByGuid[guid];
        if (String(tr?.name || "") === "INPUT") return guid;
    }
    throw new Error('FATAL ERROR: INPUT track missing from rfx_view.json');
}

function findLaneGuidsForBusByName(tracksByGuid, busId) {
    const wantA = `${busId}A`;
    const wantB = `${busId}B`;
    const wantC = `${busId}C`;

    const out = { A: null, B: null, C: null };

    for (const guid of Object.keys(tracksByGuid || {})) {
        const tr = tracksByGuid[guid];
        const name = String(tr?.name || "");
        if (name === wantA) out.A = guid;
        else if (name === wantB) out.B = guid;
        else if (name === wantC) out.C = guid;
    }

    return out;
}

function setEqual(aList, bList) {
    const a = new Set((aList || []).filter(Boolean));
    const b = new Set((bList || []).filter(Boolean));
    if (a.size !== b.size) return false;
    for (const x of a) if (!b.has(x)) return false;
    return true;
}