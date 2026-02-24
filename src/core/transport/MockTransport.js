// src/core/transport/MockTransport.js

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
    Syscalls: ["selectActiveBus", "setStateMode", "syncView"],
  };
}

/**
 * Mock transport contract:
 *  - boot(): async handshake
 *  - getSnapshot(): returns current VM
 *  - subscribe(cb): pushes VM updates
 *  - syscall(call): mutates VM and emits
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

  const subs = new Set();
  const emit = () => subs.forEach((cb) => cb(vm));

  // Fake meter updates: animate ONLY active bus (does NOT bump seq)
  window.setInterval(() => {
    const id = vm.activeBusId;
    if (!id) return;

    const prev = vm.meters[id] || { l: 0, r: 0 };
    const next = {
      l: clamp01(prev.l * 0.85 + Math.random() * 0.35),
      r: clamp01(prev.r * 0.85 + Math.random() * 0.35),
    };

    vm = { ...vm, meters: { ...vm.meters, [id]: next } };
    emit();
  }, 60);

  function bumpSeq() {
    seq += 1;
    vm = { ...vm, seq, ts: nowSec() };
  }

  return {
    async boot() {
      await sleep(600);
      await sleep(900);
      bumpSeq();
      emit();
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

    async syscall(call) {
      if (!call || !call.name) return;

      if (call.name === "selectActiveBus") {
        bumpSeq();
        vm = { ...vm, activeBusId: call.busId };
        emit();
        return;
      }

      // supports your EditView routing selector
      // Accepts { name:"setStateMode", busId } OR { stateId }
      if (call.name === "setRoutingMode") {
        const id = call.busId;
        if (!id) return;

        bumpSeq();
        const mode = normalizeMode(call.mode);
        vm = { ...vm, busModes: { ...vm.busModes, [id]: mode } };
        emit();
        return;
      }

      if (call.name === "syncView") {
        bumpSeq();
        emit();
        return;
      }
    },
  };
}