import { useRfxStore } from "./Store";

export function nowMs() {
  return Date.now();
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function useRfxActions() {
  const dispatchIntent = useRfxStore((s) => s.dispatchIntent);
  return { dispatchIntent };
}