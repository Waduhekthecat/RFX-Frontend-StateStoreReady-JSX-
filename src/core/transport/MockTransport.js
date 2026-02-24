function clamp01(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

export function createMockTransportContractDocs() {
  return {
    ViewModel: {
      buses: [{ id: "FX_1", label: "FX_1", busNum: 1 }],
      activeBusId: "FX_1",
      // ✅ routing modes by bus id
      busModes: { FX_1: "linear" },
      meters: { FX_1: { l: 0.1, r: 0.1 } },
    },
    Syscalls: ["selectActiveBus", "setStateMode", "syncView"],
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function createMockTransport() {
  let seq = 0;

  let vm = {
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

  // Fake meter updates: animate ONLY active bus (matches your real perf goal)
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

  function normalizeMode(m) {
    const x = String(m || "linear").toLowerCase();
    if (x === "lcr") return "lcr";
    if (x === "parallel") return "parallel";
    return "linear";
  }

  return {
    // ✅ NEW: placeholder boot handshake
    async boot() {
      // simulate “launch”
      await sleep(600);
      // simulate “await /rfx/ready”
      await sleep(900);
      seq += 1;
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
        vm = { ...vm, activeBusId: call.busId };
        emit();
        return;
      }

      // ✅ supports your EditView routing selector
      // Accepts { name:"setStateMode", busId } OR { stateId }
      if (call.name === "setStateMode") {
        const id = call.busId || call.stateId;
        if (!id) return;

        const mode = normalizeMode(call.mode);
        vm = { ...vm, busModes: { ...vm.busModes, [id]: mode } };
        emit();
        return;
      }

      if (call.name === "syncView") {
        emit();
        return;
      }
    },
  };
}