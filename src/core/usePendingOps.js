import { useRfxStore } from "./rfx/Store";

export function usePendingOps(predicate) {
  return useRfxStore((s) => {
    const ids = s.ops?.pendingOrder || [];
    const byId = s.ops?.pendingById || {};

    let sending = false;
    let queued = false;
    let failed = false;

    for (let i = ids.length - 1; i >= 0; i--) {
      const op = byId[ids[i]];
      if (!op) continue;
      if (!predicate(op)) continue;

      if (op.status === "sent") sending = true;
      if (op.status === "queued") queued = true;
      if (op.status === "failed") failed = true;
      if (sending) break;
    }

    return { sending, queued, failed, busy: sending || queued };
  });
}