function clamp01(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function normalizeMode(m) {
  const x = String(m || "linear").toLowerCase();
  if (x === "lcr") return "lcr";
  if (x === "parallel") return "parallel";
  return "linear";
}

export function createMockTransportContractDocs() {
  return {
    ViewModel: {
      schemaVersion: 1,
      schema: "mock_vm_v2",
      seq: 1,
      ts: 1234567890,
      capabilities: {
        routingModes: ["linear", "parallel", "lcr"],
        // Optional: let UI know some busses might not support B/C
        // laneSupportByBusId: { FX_1: ["A","B","C"], FX_2: ["A","B"], ... }
      },

      buses: [{ id: "FX_1", label: "FX_1", busNum: 1 }],
      activeBusId: "FX_1",

      // ✅ routing modes by bus id
      busModes: { FX_1: "linear" },

      meters: { FX_1: { l: 0.1, r: 0.1 } },
    },

    // ✅ Step 2b: canonical is setRoutingMode, but we accept setStateMode alias
    Syscalls: ["selectActiveBus", "setRoutingMode", "setStateMode", "syncView"],

    // ✅ Optional telemetry channel (fast path)
    Telemetry: ["subscribeMeters"],
  };
}

/**
 * Mock transport contract:
 *  - boot(): async handshake
 *  - getSnapshot(): returns current VM
 *  - subscribe(cb): pushes VM updates (truth-ish, seq-bearing changes)
 *  - syscall(call): mutates VM and emits (seq-bearing)
 *
 * Telemetry (optional):
 *  - subscribeMeters(cb): pushes meter frames only (NO seq)
 *
 * Dev helper (optional):
 *  - setMetersEnabled(on): pauses/resumes meter updates (does NOT affect syscalls)
 *  - getMetersEnabled(): returns boolean
 */
export function createMockTransport() {
  let seq = 1;

  let vm = {
    schemaVersion: 1,
    schema: "mock_vm_v2",
    seq,
    ts: nowSec(),
    capabilities: {
      routingModes: ["linear", "parallel", "lcr"],
    },

    buses: [
      { id: "FX_1", label: "FX_1", busNum: 1 },
      { id: "FX_2", label: "FX_2", busNum: 2 },
      { id: "FX_3", label: "FX_3", busNum: 3 },
      { id: "FX_4", label: "FX_4", busNum: 4 },
    ],
    activeBusId: "FX_1",

    // ✅ routing mode per bus
    busModes: {
      FX_1: "linear",
      FX_2: "parallel",
      FX_3: "lcr",
      FX_4: "parallel",
    },

    meters: {
      FX_1: { l: 0.1, r: 0.12 },
      FX_2: { l: 0.02, r: 0.03 },
      FX_3: { l: 0.0, r: 0.0 },
      FX_4: { l: 0.05, r: 0.04 },
    },
  };

  // Truth subscribers (snapshots)
  const subs = new Set();
  const emit = () => subs.forEach((cb) => cb(vm));

  // Telemetry subscribers (meters)
  const meterSubs = new Set();
  const emitMeters = (frame) => meterSubs.forEach((cb) => cb(frame));

  function bumpSeq() {
    seq += 1;
    vm = { ...vm, seq, ts: nowSec() };
  }

  function canonicalizeCall(call) {
    if (!call) return null;
    const name = call.name === "setStateMode" ? "setRoutingMode" : call.name;
    return { ...call, name };
  }

  // ============================
  // ✅ Dev toggle: pause meters
  // ============================
  let metersEnabled = true;
  let metersTimer = null;

  function seedMetersForActiveBus() {
    const id = vm.activeBusId;
    if (!id) return;
    const m = vm.meters?.[id];
    if (!m) return;

    emitMeters({
      t: Date.now(),
      activeBusId: id,
      // Support both naming conventions downstream
      metersByBusId: { [id]: m },
      metersById: { [id]: m },
    });
  }

  function tickMeters() {
    const id = vm.activeBusId;
    if (!id) return;

    const prev = vm.meters[id] || { l: 0, r: 0 };
    const next = {
      l: clamp01(prev.l * 0.85 + Math.random() * 0.35),
      r: clamp01(prev.r * 0.85 + Math.random() * 0.35),
    };

    // IMPORTANT: meters do NOT bump seq
    // ALSO IMPORTANT: do NOT emit() truth snapshots anymore (prevents churn)
    vm = { ...vm, meters: { ...vm.meters, [id]: next } };

    // Telemetry-only push
    emitMeters({
      t: Date.now(),
      activeBusId: id,
      metersByBusId: { [id]: next },
      metersById: { [id]: next },
    });
  }

  function startMeters() {
    if (metersTimer) return;
    if (typeof window === "undefined" || typeof window.setInterval !== "function")
      return;

    metersTimer = window.setInterval(() => {
      if (!metersEnabled) return;
      tickMeters();
    }, 60);
  }

  // start immediately (as before)
  startMeters();

  return {
    // ---------------------------
    // Contract
    // ---------------------------
    async boot() {
      await sleep(600);
      await sleep(900);
      bumpSeq();
      emit();
      // seed telemetry once after boot so UI draws instantly
      seedMetersForActiveBus();
      return { ok: true, seq };
    },

    getSnapshot() {
      return vm;
    },

    subscribe(cb) {
      subs.add(cb);
      cb(vm);
      return () => subs.delete(cb);
    },

    // ✅ Telemetry channel for meters
    subscribeMeters(cb) {
      meterSubs.add(cb);

      // Seed immediate frame so UI doesn't wait for the next interval tick
      try {
        const id = vm.activeBusId;
        if (id && vm.meters?.[id]) {
          cb({
            t: Date.now(),
            activeBusId: id,
            metersByBusId: { [id]: vm.meters[id] },
            metersById: { [id]: vm.meters[id] },
          });
        }
      } catch {
        // ignore
      }

      return () => meterSubs.delete(cb);
    },

    async syscall(call) {
      const c = canonicalizeCall(call);
      if (!c || !c.name) return { ok: false, error: "invalid syscall" };

      if (c.name === "selectActiveBus") {
        bumpSeq();
        vm = { ...vm, activeBusId: c.busId };
        emit();
        // seed telemetry immediately for the new active bus
        seedMetersForActiveBus();
        return { ok: true };
      }

      // ✅ Step 2b: supports both:
      //  - { name:"setRoutingMode", busId, mode }
      //  - { name:"setStateMode",  busId, mode }  (alias)
      if (c.name === "setRoutingMode") {
        const id = c.busId;
        if (!id) return { ok: false, error: "missing busId" };

        bumpSeq();
        const mode = normalizeMode(c.mode);
        vm = { ...vm, busModes: { ...vm.busModes, [id]: mode } };
        emit();
        return { ok: true };
      }

      if (c.name === "syncView") {
        bumpSeq();
        emit();
        return { ok: true };
      }

      return { ok: false, error: `unknown syscall: ${String(c.name)}` };
    },

    // ---------------------------
    // ✅ Optional dev helper API
    // ---------------------------
    setMetersEnabled(on) {
      metersEnabled = !!on;
      return { ok: true };
    },

    getMetersEnabled() {
      return metersEnabled;
    },
  };
}