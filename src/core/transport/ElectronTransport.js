// Renderer-side transport that talks to Electron main via preload (window.rfx.transport).
// Contract shape matches MockTransport: boot/getSnapshot/subscribe/syscall + subscribeMeters (optional).

function isAvailable() {
  return typeof window !== "undefined" && !!window.rfx?.transport;
}

export function createElectronTransport() {
  if (!isAvailable()) return null;

  const api = window.rfx.transport;

  // Cached snapshot so getSnapshot() is synchronous like MockTransport
  let vm = null;

  // Truth subscribers (snapshots)
  const subs = new Set();

  // Telemetry subscribers (meters)
  const meterSubs = new Set();

  // Main -> renderer: truth snapshots
  const offVm = api.onViewModel((next) => {
    vm = next;
    subs.forEach((cb) => cb(vm));
  });

  // Main -> renderer: meter frames (no seq)
  const offMeters = api.onMeters((frame) => {
    meterSubs.forEach((cb) => cb(frame));
  });

  const transport = {
    async boot() {
      // 1) Ask main to boot
      const res = await api.boot();

      // 2) Option B: Pull snapshot once to guarantee vm is primed immediately
      //    (even if the first rfx:vm event arrives slightly later).
      try {
        const snap = await api.getSnapshot();
        if (snap) {
          vm = snap;
          subs.forEach((cb) => cb(vm));
        }
      } catch {
        // ignore — we still rely on rfx:vm push updates
      }

      return res;
    },

    getSnapshot() {
      return vm;
    },

    subscribe(cb) {
      subs.add(cb);
      if (vm) cb(vm);
      return () => subs.delete(cb);
    },

    // Optional telemetry channel (meters-only)
    subscribeMeters(cb) {
      meterSubs.add(cb);
      return () => meterSubs.delete(cb);
    },

    async syscall(call) {
      return api.syscall(call);
    },

    // Optional cleanup hook if you ever need it (not required by contract)
    destroy() {
      try {
        offVm?.();
        offMeters?.();
      } catch {}
      subs.clear();
      meterSubs.clear();
    },
  };

  return transport;
}