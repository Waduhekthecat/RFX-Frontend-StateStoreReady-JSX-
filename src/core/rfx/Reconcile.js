// src/core/rfx/Reconcile.js

const OP_TIMEOUT_MS = 8000;
const EPS = 1e-4;

function isMockVm(norm) {
  const schema = String(norm?.snapshot?.schema || "");
  return schema.startsWith("mock_vm");
}

// tiny helper: always return consistent verify objects
function v(ok, reason) {
  return {
    ok: !!ok,
    reason: String(reason || (ok ? "ok" : "failed")),
  };
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

    // collapse vol/pan bursts
    if (collapsed.has(opId)) {
      nextPendingById[opId] = {
        ...op,
        status: "superseded",
        verify: {
          ok: false,
          reason: "superseded by newer op (collapse)",
          checkedSeq: nextSeq || prevSeq || 0,
        },
      };
      overlay = clearOverlayForOp(overlay, op);
      continue;
    }

    if (op.status === "acked" || op.status === "failed" || op.status === "timeout") {
      continue;
    }

    // timeout only after "sent"
    if (op.status === "sent") {
      const sentAt = Number(op.sentAtMs || 0);
      if (sentAt && now - sentAt > OP_TIMEOUT_MS) {
        nextPendingById[opId] = {
          ...op,
          status: "timeout",
          error: `Timed out after ${OP_TIMEOUT_MS}ms`,
          verify: {
            ok: false,
            reason: `timeout after ${OP_TIMEOUT_MS}ms`,
            checkedSeq: nextSeq || prevSeq || 0,
          },
        };
        overlay = clearOverlayForOp(overlay, op);
        continue;
      }
    }

    // if snapshot hasn't advanced, don't re-check (avoid noisy verify churn)
    if (!seqAdvanced && prevSeq !== 0) {
      nextPendingOrder.push(opId);
      continue;
    }

    // ✅ verify with reasons
    const checkedSeq = nextSeq || prevSeq || 0;
    const res = opVerifySnapshot(op, norm);

    nextPendingById[opId] = {
      ...op,
      verify: {
        ok: !!res.ok,
        reason: res.reason || (res.ok ? "ok" : "unknown"),
        checkedSeq,
      },
    };

    if (res.ok) {
      nextPendingById[opId] = {
        ...nextPendingById[opId],
        status: "acked",
        ackSeq: nextSeq || prevSeq,
      };
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

/**
 * Returns { ok, reason } instead of boolean.
 * Reasons are intended for CoreInspector readability.
 */
function opVerifySnapshot(op, norm) {
  const intent = op?.intent || {};
  const kind = intent.kind || intent.name || op.kind;

  const tracksByGuid = norm?.entities?.tracksByGuid || {};
  const fxByGuid = norm?.entities?.fxByGuid || {};
  const fxOrderByTrackGuid = norm?.entities?.fxOrderByTrackGuid || {};
  const routesById = norm?.entities?.routesById || {};

  switch (kind) {
    case "toggleRecArm": {
      const { trackGuid, value } = intent;
      if (!trackGuid) return v(false, "missing trackGuid");
      const tr = tracksByGuid[trackGuid];
      if (!tr) return v(false, `track missing guid=${trackGuid}`);
      const got = !!tr.recArm;
      const want = !!value;
      return got === want ? v(true, "recArm matches") : v(false, `recArm=${got} expected=${want}`);
    }

    case "toggleMute": {
      const { trackGuid, value } = intent;
      if (!trackGuid) return v(false, "missing trackGuid");
      const tr = tracksByGuid[trackGuid];
      if (!tr) return v(false, `track missing guid=${trackGuid}`);
      const got = !!tr.mute;
      const want = !!value;
      return got === want ? v(true, "mute matches") : v(false, `mute=${got} expected=${want}`);
    }

    case "toggleSolo": {
      const { trackGuid, value } = intent;
      if (!trackGuid) return v(false, "missing trackGuid");
      const tr = tracksByGuid[trackGuid];
      if (!tr) return v(false, `track missing guid=${trackGuid}`);
      const got = Number(tr.solo || 0) !== 0;
      const want = !!value;
      return got === want ? v(true, "solo matches") : v(false, `solo=${got} expected=${want}`);
    }

    case "setVol": {
      const { trackGuid, value } = intent;
      if (!trackGuid) return v(false, "missing trackGuid");
      const tr = tracksByGuid[trackGuid];
      if (!tr) return v(false, `track missing guid=${trackGuid}`);
      const got = Number(tr.vol);
      const want = Number(value);
      if (!Number.isFinite(got) || !Number.isFinite(want)) {
        return v(false, `non-finite vol (got=${tr.vol} want=${value})`);
      }
      return nearlyEqual(got, want, EPS)
        ? v(true, "vol matches")
        : v(false, `vol=${got} expected≈${want}`);
    }

    case "setPan": {
      const { trackGuid, value } = intent;
      if (!trackGuid) return v(false, "missing trackGuid");
      const tr = tracksByGuid[trackGuid];
      if (!tr) return v(false, `track missing guid=${trackGuid}`);
      const got = Number(tr.pan);
      const want = Number(value);
      if (!Number.isFinite(got) || !Number.isFinite(want)) {
        return v(false, `non-finite pan (got=${tr.pan} want=${value})`);
      }
      return nearlyEqual(got, want, EPS)
        ? v(true, "pan matches")
        : v(false, `pan=${got} expected≈${want}`);
    }

    case "toggleFx": {
      const { fxGuid, value } = intent;
      if (!fxGuid) return v(false, "missing fxGuid");
      const fx = fxByGuid[fxGuid];
      if (!fx) return v(false, `fx missing guid=${fxGuid}`);
      const got = !!fx.enabled;
      const want = !!value;
      return got === want ? v(true, "fx enabled matches") : v(false, `fx.enabled=${got} expected=${want}`);
    }

    case "reorderFx": {
      const { trackGuid, fromIndex, toIndex } = intent;
      if (!trackGuid) return v(false, "missing trackGuid");

      const expected = expectedFxOrderFromIntentOrOptimistic(
        op,
        fxOrderByTrackGuid,
        trackGuid,
        fromIndex,
        toIndex
      );
      if (!expected) return v(false, "could not compute expected order (bad indices or missing base)");

      const actual = fxOrderByTrackGuid[trackGuid] || [];
      return arrayEqual(actual, expected)
        ? v(true, "fx order matches")
        : v(false, "fx order mismatch");
    }

    // ✅ setRoutingMode verified by lane recArm (real) or perf map (mock)
    case "setRoutingMode": {
      const { busId, mode } = intent || {};
      if (!busId) return v(false, "missing busId");
      const want = normalizeMode(mode);

      // MOCK VM verification: check perf busModesById
      if (isMockVm(norm)) {
        const actual = normalizeMode(
          norm?.perf?.busModesById?.[busId] ??
            norm?.perf?.routingModesById?.[busId] ??
            "linear"
        );
        return actual === want
          ? v(true, "mock: bus mode matches")
          : v(false, `mock: mode=${actual} expected=${want} for busId=${busId}`);
      }

      // REAL REAPER verification: lane recArm state
      const lanes = findLaneGuidsForBusByName(tracksByGuid, busId);

      const wantA = want === "linear" || want === "parallel" || want === "lcr";
      const wantB = want === "parallel" || want === "lcr";
      const wantC = want === "lcr";

      // helpful “missing lane track” errors
      if (!lanes.A) return v(false, `missing lane track ${busId}A`);
      // B/C may or may not exist physically; if they exist, they must match.
      // If they don't exist but mode wants them, that's also a failure.
      if (wantB && !lanes.B) return v(false, `missing lane track ${busId}B for mode=${want}`);
      if (wantC && !lanes.C) return v(false, `missing lane track ${busId}C for mode=${want}`);

      if (lanes.A) {
        const trA = tracksByGuid[lanes.A];
        if (!trA) return v(false, `lane A guid missing in snapshot (${busId}A)`);
        if (!!trA.recArm !== !!wantA) return v(false, `${busId}A recArm=${!!trA.recArm} expected=${!!wantA}`);
      }
      if (lanes.B) {
        const trB = tracksByGuid[lanes.B];
        if (!trB) return v(false, `lane B guid missing in snapshot (${busId}B)`);
        if (!!trB.recArm !== !!wantB) return v(false, `${busId}B recArm=${!!trB.recArm} expected=${!!wantB}`);
      }
      if (lanes.C) {
        const trC = tracksByGuid[lanes.C];
        if (!trC) return v(false, `lane C guid missing in snapshot (${busId}C)`);
        if (!!trC.recArm !== !!wantC) return v(false, `${busId}C recArm=${!!trC.recArm} expected=${!!wantC}`);
      }

      return v(true, "lane recArm matches routing mode");
    }

    // ✅ selectActiveBus verified by:
    //  1) session/perf activeBusId equals requested busId (mock)
    //  2) session.activeBusId equals requested busId AND INPUT sends match armed lanes (real)
    case "selectActiveBus": {
      const { busId } = intent || {};
      if (!busId) return v(false, "missing busId");

      // MOCK VM verification (no INPUT/routes)
      if (isMockVm(norm)) {
        const active = String(norm?.session?.activeBusId || norm?.perf?.activeBusId || "");
        return active === busId
          ? v(true, "mock: active bus matches")
          : v(false, `mock: activeBusId=${active} expected=${busId}`);
      }

      const activeBusId = String(norm?.session?.activeBusId || "");
      if (activeBusId !== busId) return v(false, `activeBusId=${activeBusId} expected=${busId}`);

      // REAL REAPER verification
      let inputGuid = null;
      try {
        inputGuid = mustFindInputTrackGuidByName(tracksByGuid);
      } catch (e) {
        return v(false, String(e?.message || e));
      }

      const armedLaneGuids = armedLaneGuidsForBus(tracksByGuid, busId);
      const actualDestGuids = collectInputSendDestGuids(routesById, inputGuid);

      if (armedLaneGuids.length === 0) return v(false, "no armed lanes for selected bus");
      return setEqual(actualDestGuids, armedLaneGuids)
        ? v(true, "INPUT sends match armed lanes")
        : v(false, `INPUT sends mismatch (got=${actualDestGuids.length} want=${armedLaneGuids.length})`);
    }

    case "syncView":
      // syncView doesn't assert state changes; it just requests the latest snapshot.
      return v(true, "syncView (no state assertion)");

    default:
      // conservative: keep pending but explain why
      return v(false, `no verifier implemented for op kind="${kind}"`);
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