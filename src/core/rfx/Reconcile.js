// src/core/rfx/Reconcile.js
/**
 * reconcilePending(prevState, norm)
 * - simplest ack model: if snapshot seq advanced, mark sent ops as acked and clear their overlay patches
 * - later: upgrade to per-op field verification (recommended once you start overlapping ops)
 */
export function reconcilePending(prevState, norm) {
  const prevSeq = Number(prevState?.snapshot?.seq || 0);
  const nextSeq = Number(norm?.snapshot?.seq || 0);
  const seqAdvanced = nextSeq > prevSeq;

  const pendingOrder = prevState?.ops?.pendingOrder || [];
  const pendingById = prevState?.ops?.pendingById || {};
  let overlay = prevState?.ops?.overlay || {
    track: {},
    fx: {},
    fxOrderByTrackGuid: {},
  };

  const nextPendingById = { ...pendingById };
  const nextPendingOrder = [];

  for (const opId of pendingOrder) {
    const op = nextPendingById[opId];
    if (!op) continue;

    if (!seqAdvanced) {
      nextPendingOrder.push(opId);
      continue;
    }

    nextPendingById[opId] = { ...op, status: "acked", ackSeq: nextSeq };
    overlay = clearOverlayForOp(overlay, op);
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