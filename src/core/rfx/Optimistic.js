// src/core/rfx/Optimistic.js
/**
 * Optimistic overlay builder.
 * Accepts either { kind: "setVol", ... } OR { name: "setVol", ... }.
 */
export function buildOptimistic(state, intent) {
  const kind = intent?.kind || intent?.name;

  switch (kind) {
    case "toggleRecArm": {
      const { trackGuid, value } = intent || {};
      if (!trackGuid) return null;
      return { track: { [trackGuid]: { recArm: !!value } } };
    }

    case "toggleMute": {
      const { trackGuid, value } = intent || {};
      if (!trackGuid) return null;
      return { track: { [trackGuid]: { mute: !!value } } };
    }

    case "toggleSolo": {
      const { trackGuid, value } = intent || {};
      if (!trackGuid) return null;
      return { track: { [trackGuid]: { solo: value ? 1 : 0 } } };
    }

    case "setVol": {
      const { trackGuid, value } = intent || {};
      if (!trackGuid) return null;
      return { track: { [trackGuid]: { vol: Number(value ?? 1) } } };
    }

    case "setPan": {
      const { trackGuid, value } = intent || {};
      if (!trackGuid) return null;
      return { track: { [trackGuid]: { pan: Number(value ?? 0) } } };
    }

    case "toggleFx": {
      const { fxGuid, value } = intent || {};
      if (!fxGuid) return null;
      return { fx: { [fxGuid]: { enabled: !!value } } };
    }

    case "reorderFx": {
      const { trackGuid, fromIndex, toIndex } = intent || {};
      if (!trackGuid) return null;

      const order = state.entities.fxOrderByTrackGuid[trackGuid] || [];
      if (
        fromIndex == null ||
        toIndex == null ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= order.length ||
        toIndex >= order.length
      ) {
        return null;
      }

      const next = order.slice();
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { fxOrderByTrackGuid: { [trackGuid]: next } };
    }

    default:
      return null;
  }
}