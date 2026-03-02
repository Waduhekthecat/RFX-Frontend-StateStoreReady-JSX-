export function centerLeft(rect) {
  return { x: rect.left, y: rect.top + rect.height / 2 };
}

export function centerRight(rect) {
  return { x: rect.left + rect.width, y: rect.top + rect.height / 2 };
}

export function toLocal(pt, originRect) {
  return { x: pt.x - originRect.left, y: pt.y - originRect.top };
}

export function cablePath(a, b, tension = 0.5) {
  const dx = Math.max(40, (b.x - a.x) * tension);
  const c1 = { x: a.x + dx, y: a.y };
  const c2 = { x: b.x - dx, y: b.y };
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}

export function strokeFor(active) {
  return active ? "rgba(34,197,94,0.95)" : "rgba(255,255,255,0.18)";
}

export function strokeW(active) {
  return active ? 2.8 : 1.4;
}