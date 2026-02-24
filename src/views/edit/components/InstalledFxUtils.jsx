export function norm(s) {
  return String(s ?? "").trim();
}

export function safeLower(s) {
  return norm(s).toLowerCase();
}

const KNOWN_FORMATS = new Set([
  "au",
  "vst",
  "vst2",
  "vst3",
  "jsfx",
  "clap",
  "aax",
]);

export function isFormatToken(x) {
  const t = safeLower(x);
  return KNOWN_FORMATS.has(t);
}

/**
 * Backwards-compatible field normalization:
 * - Format: p.format || p.pluginFormat || (p.type if looks like format)
 * - Type:   p.fxType || p.category || p.kind || (p.type if NOT format)
 */
export function getPluginFormat(p) {
  const f =
    p?.format ??
    p?.pluginFormat ??
    p?.fmt ??
    (isFormatToken(p?.type) ? p?.type : "") ??
    "";
  return safeLower(f);
}

export function getPluginType(p) {
  const t =
    p?.fxType ??
    p?.category ??
    p?.kind ??
    (!isFormatToken(p?.type) ? p?.type : "") ??
    "";
  return safeLower(t);
}

export function getPluginVendor(p) {
  return norm(p?.vendor);
}

export function labelFor(p) {
  return norm(p?.name) || norm(p?.raw) || "Unknown";
}

export function subtitleFor(p) {
  const vendor = norm(p?.vendor);
  const format = getPluginFormat(p);
  if (vendor && format) return `${vendor} • ${format.toUpperCase()}`;
  if (vendor) return vendor;
  if (format) return format.toUpperCase();
  return "";
}

export function normalizeInstalledFx(input) {
  if (!input) return { count: 0, plugins: [] };

  // already in shape
  if (Array.isArray(input.plugins)) return input;

  // allow passing an array
  if (Array.isArray(input)) return { count: input.length, plugins: input };

  // tolerate different keys
  const plugins =
    input.plugins || input.items || input.list || input.fx || input.installed || [];

  const arr = Array.isArray(plugins) ? plugins : [];
  const count = Number.isFinite(input.count) ? input.count : arr.length;

  return { count, plugins: arr };
}

// ---------------------------
// Mock installed plugins (30 only)
// ---------------------------
export function makeMockInstalledFx(count = 30) {
  const VENDORS = [
    "Neural DSP",
    "Valhalla",
    "FabFilter",
    "Soundtoys",
    "UAD",
    "Waves",
    "IK",
    "Tokyo Dawn",
    "Apple",
  ];

  const FORMATS = ["vst3", "au", "jsfx"];

  const NAMES = [
    "Gate",
    "Compressor",
    "EQ",
    "Delay",
    "Reverb",
    "Limiter",
    "Chorus",
    "Flanger",
    "Saturation",
    "Amp Sim",
    "Cab IR",
    "Pitch",
  ];

  return {
    count,
    plugins: Array.from({ length: count }).map((_, i) => {
      const vendor = VENDORS[i % VENDORS.length];
      const format = FORMATS[i % FORMATS.length];
      const name = NAMES[i % NAMES.length];

      return {
        id: `mock_${i}`,
        // NOTE: Keeping legacy field `type` as format to match your current data
        type: format,
        vendor,
        name,
        raw:
          format === "au"
            ? `AU: ${name} (${vendor})`
            : `${format.toUpperCase()}: ${name} (${vendor})`,
      };
    }),
  };
}