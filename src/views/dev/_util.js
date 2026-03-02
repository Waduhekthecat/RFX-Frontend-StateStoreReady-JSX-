export function fmtTime(ms) {
  const d = new Date(ms);
  return d.toLocaleTimeString() + "." + String(d.getMilliseconds()).padStart(3, "0");
}

export function fmtAge(ms) {
  if (!ms) return "";
  const s = Math.max(0, Math.round(ms / 100) / 10); // 0.1s precision
  return `${s}s`;
}

export function toneColor(status) {
  if (status === "acked") return "rgba(120,255,160,0.9)";
  if (status === "failed" || status === "timeout") return "rgba(255,120,120,0.95)";
  if (status === "superseded") return "rgba(255,210,120,0.95)";
  return "rgba(200,200,255,0.9)";
}

export function boolBadge(ok) {
  if (ok === true) return "✅";
  if (ok === false) return "❌";
  return "…";
}

export function fmtMeta(meta) {
  if (!meta) return "";
  const parts = [];
  if (meta.seq != null) parts.push(`seq=${meta.seq}`);
  if (meta.opId) parts.push(`opId=${meta.opId}`);
  return parts.length ? parts.join(" • ") : "";
}

export async function copyTextToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  ta.style.top = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}