// src/core/transport/MockTransport.js
// Mock transport with canonical syscall contract + meters telemetry channel.
// ✅ Includes: selectActiveBus, setRoutingMode (alias setStateMode),
//    setBusVolume, setTrackVolume, setTrackPan,
//    toggleFx, reorderFx, syncView
// ✅ Meters are telemetry-only (no seq bump)

function clamp01(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function clampPan(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  if (v < -1) return -1;
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

function normBusId(x) {
  const s = String(x || "");
  return s;
}

function normTrackId(x) {
  const s = String(x || "");
  return s;
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
      },

      buses: [{ id: "FX_1", label: "FX_1", busNum: 1 }],
      activeBusId: "FX_1",

      // routing modes by bus id
      busModes: { FX_1: "linear" },

      // ✅ bus mix
      busMix: { FX_1: { vol: 0.8 } },

      // ✅ track list + mix
      tracks: [{ id: "FX_1A", label: "FX_1A", busId: "FX_1", lane: "A" }],
      trackMix: { FX_1A: { vol: 0.8, pan: 0 } },

      meters: { FX_1: { l: 0.1, r: 0.1 } },

      // FX mock fields (optional, for debug)
      fxEnabledByGuid: {},
      fxReorderLastByTrackGuid: {},
    },

    // ✅ Canonical syscalls (plus alias)
    Syscalls: [
      "selectActiveBus",
      "setRoutingMode",
      "setStateMode", // alias of setRoutingMode
      "setBusVolume",
      "setTrackVolume",
      "setTrackPan",
      "syncView",
      "toggleFx",
      "reorderFx",
    ],

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

    // routing mode per bus
    busModes: {
      FX_1: "linear",
      FX_2: "parallel",
      FX_3: "lcr",
      FX_4: "parallel",
    },

    // ✅ bus mix (0..1)
    busMix: {
      FX_1: { vol: 0.85 },
      FX_2: { vol: 0.75 },
      FX_3: { vol: 0.8 },
      FX_4: { vol: 0.78 },
    },

    // ✅ tracks (simple: lane tracks per bus; UI can ignore if not used yet)
    tracks: [
      { id: "FX_1A", label: "FX_1A", busId: "FX_1", lane: "A" },

      { id: "FX_2A", label: "FX_2A", busId: "FX_2", lane: "A" },
      { id: "FX_2B", label: "FX_2B", busId: "FX_2", lane: "B" },

      { id: "FX_3A", label: "FX_3A", busId: "FX_3", lane: "A" },
      { id: "FX_3B", label: "FX_3B", busId: "FX_3", lane: "B" },
      { id: "FX_3C", label: "FX_3C", busId: "FX_3", lane: "C" },

      { id: "FX_4A", label: "FX_4A", busId: "FX_4", lane: "A" },
      { id: "FX_4B", label: "FX_4B", busId: "FX_4", lane: "B" },
    ],

    // ✅ track mix (vol 0..1, pan -1..1)
    trackMix: {
      FX_1A: { vol: 0.85, pan: 0 },

      FX_2A: { vol: 0.75, pan: -0.2 },
      FX_2B: { vol: 0.75, pan: 0.2 },

      FX_3A: { vol: 0.8, pan: -0.4 },
      FX_3B: { vol: 0.8, pan: 0 },
      FX_3C: { vol: 0.8, pan: 0.4 },

      FX_4A: { vol: 0.78, pan: -0.25 },
      FX_4B: { vol: 0.78, pan: 0.25 },
    },

    meters: {
      FX_1: { l: 0.1, r: 0.12 },
      FX_2: { l: 0.02, r: 0.03 },
      FX_3: { l: 0.0, r: 0.0 },
      FX_4: { l: 0.05, r: 0.04 },
    },

    // FX syscall demo state (minimal)
    fxEnabledByGuid: {},
    fxReorderLastByTrackGuid: {},
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

  // start immediately
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

      // ---------------------------
      // Active bus
      // ---------------------------
      if (c.name === "selectActiveBus") {
        const id = normBusId(c.busId);
        bumpSeq();
        vm = { ...vm, activeBusId: id };
        emit();
        seedMetersForActiveBus();
        return { ok: true };
      }

      // ---------------------------
      // Routing mode (alias supported)
      // ---------------------------
      if (c.name === "setRoutingMode") {
        const id = normBusId(c.busId);
        if (!id) return { ok: false, error: "missing busId" };

        bumpSeq();
        const mode = normalizeMode(c.mode);
        vm = { ...vm, busModes: { ...vm.busModes, [id]: mode } };
        emit();
        return { ok: true };
      }

      // ---------------------------
      // ✅ Bus mix
      // supports:
      //  - { name:"setBusVolume", busId, value }  (preferred)
      //  - { name:"setBusVolume", busId, vol }    (compat)
      // ---------------------------
      if (c.name === "setBusVolume") {
        const id = normBusId(c.busId);
        if (!id) return { ok: false, error: "missing busId" };

        const v = clamp01(c.value ?? c.vol);
        bumpSeq();
        vm = {
          ...vm,
          busMix: {
            ...(vm.busMix || {}),
            [id]: { ...(vm.busMix?.[id] || {}), vol: v },
          },
        };
        emit();
        return { ok: true };
      }

      // ---------------------------
      // ✅ Track mix
      // supports:
      //  - { name:"setTrackVolume", trackId, value } (preferred)
      //  - { name:"setTrackVolume", trackGuid, value } (compat)
      //  - { name:"setTrackPan",    trackId, value } (preferred; -1..1)
      //  - { name:"setTrackPan",    trackGuid, pan } (compat)
      // ---------------------------
      if (c.name === "setTrackVolume") {
        const id = normTrackId(c.trackId ?? c.trackGuid);
        if (!id) return { ok: false, error: "missing trackId" };

        const v = clamp01(c.value ?? c.vol);
        bumpSeq();
        vm = {
          ...vm,
          trackMix: {
            ...(vm.trackMix || {}),
            [id]: { ...(vm.trackMix?.[id] || {}), vol: v },
          },
        };
        emit();
        return { ok: true };
      }

      if (c.name === "setTrackPan") {
        const id = normTrackId(c.trackId ?? c.trackGuid);
        if (!id) return { ok: false, error: "missing trackId" };

        const p = clampPan(c.value ?? c.pan);
        bumpSeq();
        vm = {
          ...vm,
          trackMix: {
            ...(vm.trackMix || {}),
            [id]: { ...(vm.trackMix?.[id] || {}), pan: p },
          },
        };
        emit();
        return { ok: true };
      }

      // ---------------------------
      // FX: toggle enable/disable (minimal mock support)
      // ---------------------------
      if (c.name === "toggleFx") {
        const fxGuid = String(c.fxGuid || "");
        const value = !!c.value;
        if (!fxGuid) return { ok: false, error: "missing fxGuid" };

        bumpSeq();
        vm = {
          ...vm,
          fxEnabledByGuid: {
            ...(vm.fxEnabledByGuid || {}),
            [fxGuid]: value,
          },
        };
        emit();
        return { ok: true };
      }

      // ---------------------------
      // FX: reorder request (minimal mock support)
      // ---------------------------
      if (c.name === "reorderFx") {
        const trackGuid = String(c.trackGuid || "");
        const fromIndex = Number(c.fromIndex);
        const toIndex = Number(c.toIndex);

        if (!trackGuid) return { ok: false, error: "missing trackGuid" };
        if (!Number.isFinite(fromIndex) || !Number.isFinite(toIndex)) {
          return { ok: false, error: "missing fromIndex/toIndex" };
        }

        bumpSeq();
        vm = {
          ...vm,
          fxReorderLastByTrackGuid: {
            ...(vm.fxReorderLastByTrackGuid || {}),
            [trackGuid]: { fromIndex, toIndex, at: Date.now() },
          },
        };
        emit();
        return { ok: true };
      }

      // ---------------------------
      // View sync
      // ---------------------------
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