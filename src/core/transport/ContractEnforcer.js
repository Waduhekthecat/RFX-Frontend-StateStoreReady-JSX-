// src/core/transport/ContractEnforcer.js
//
// Vite-safe / browser-safe transport contract wrapper.
// - No `process` usage
// - Uses import.meta.env.DEV
// - Warns once per method (boot/syscall) instead of per call

function okSyscall() {
  return { ok: true };
}
function errSyscall(error) {
  return { ok: false, error: String(error || "unknown error") };
}
function okBoot(seq) {
  return { ok: true, seq: typeof seq === "number" ? seq : null };
}
function errBoot(error) {
  return { ok: false, error: String(error || "unknown error") };
}

function isObj(x) {
  return x != null && typeof x === "object";
}

function isDev() {
  try {
    return !!import.meta.env?.DEV;
  } catch {
    return false;
  }
}

function normalizeSyscallResult(res) {
  if (!isObj(res)) return okSyscall(); // allow undefined -> success (legacy)
  if (res.ok === true) return okSyscall();
  if (res.ok === false) return errSyscall(res.error);
  return okSyscall();
}

function normalizeBootResult(res) {
  if (!isObj(res)) return okBoot(null);
  if (res.ok === true) return okBoot(res.seq ?? null);
  if (res.ok === false) return errBoot(res.error);
  return okBoot(null);
}

export function wrapTransportWithContract(
  raw,
  { name = "transport", warn = true } = {}
) {
  if (!raw) return raw;

  const has = (k) => typeof raw?.[k] === "function";
  const shouldWarn = () => !!warn && isDev();

  // ✅ Track warnings per method
  const warned = new Set();

  function warnOnce(method, message, payload) {
    if (!shouldWarn()) return;
    const key = `${name}:${method}`;
    if (warned.has(key)) return;
    warned.add(key);
    console.warn(message, payload);
  }

  const wrapped = {
    ...raw,

    async boot() {
      if (!has("boot")) return errBoot(`${name}.boot missing`);
      try {
        const res = await raw.boot();
        const norm = normalizeBootResult(res);

        if (!isObj(res) || (res.ok !== true && res.ok !== false)) {
          warnOnce(
            "boot",
            `[${name}] boot() returned non-contract value; normalized`,
            { res, norm }
          );
        }

        return norm;
      } catch (e) {
        return errBoot(e?.message || e);
      }
    },

    async syscall(req) {
      if (!has("syscall")) return errSyscall(`${name}.syscall missing`);
      try {
        const res = await raw.syscall(req);
        const norm = normalizeSyscallResult(res);

        if (!isObj(res) || (res.ok !== true && res.ok !== false)) {
          warnOnce(
            "syscall",
            `[${name}] syscall() returned non-contract value; normalized`,
            { req, res, norm }
          );
        }

        return norm;
      } catch (e) {
        return errSyscall(e?.message || e);
      }
    },
  };

  // Pass through optional dev helpers if present
  if (has("setMetersEnabled"))
    wrapped.setMetersEnabled = raw.setMetersEnabled.bind(raw);
  if (has("getMetersEnabled"))
    wrapped.getMetersEnabled = raw.getMetersEnabled.bind(raw);
  if (has("subscribeMeters"))
    wrapped.subscribeMeters = raw.subscribeMeters.bind(raw);

  return wrapped;
}