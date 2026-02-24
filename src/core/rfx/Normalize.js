// src/core/rfx/Normalize.js
/**
 * normalize(view)
 *
 * Supports TWO input shapes:
 *  1) REAPER snapshot: { schema, seq, ts, reaper, project, selection, transport, tracks: [...] }
 *  2) Current MockTransport VM: { buses, activeBusId, busModes, meters }
 *
 * Always returns a normalized structure:
 * {
 *   snapshot, reaper, project, selection, transportState,
 *   entities: { tracksByGuid, trackOrder, fxByGuid, fxOrderByTrackGuid, routesById, routeIdsByTrackGuid },
 *   perf: { metersById, busModesById, activeBusId, buses }   // optional (present for VM shape)
 * }
 */
export function normalize(view) {
  // -----------------------------
  // Case A: MockTransport VM
  // -----------------------------
  if (view && Array.isArray(view.buses)) {
    const buses = view.buses || [];
    const tracksByGuid = {};
    const trackOrder = [];

    for (let i = 0; i < buses.length; i++) {
      const b = buses[i] || {};
      const guid = String(b.id || "");
      if (!guid) continue;

      tracksByGuid[guid] = {
        guid,
        trackIndex: i,
        trackNumber: i + 1,
        name: String(b.label || b.id || `Bus ${i + 1}`),

        parentGuid: "",
        folderDepth: 0,

        selected: guid === String(view.activeBusId || ""),

        // REAPER-ish defaults (not meaningful in VM mode)
        recArm: false,
        recMon: 0,
        recMode: 0,
        recInput: 0,

        mute: false,
        solo: 0,
        phaseInvert: false,

        vol: 1,
        pan: 0,
        width: 1,
        panLaw: 0,

        masterSend: true,

        color: 0,
        tcpHide: 0,
        mcpHide: 0,
      };

      trackOrder.push(guid);
    }

    return {
      snapshot: {
        seq: Number(view.seq || 0),
        schema: "mock_vm_v1",
        ts: 0,
      },
      reaper: { version: "mock", resourcePath: "" },
      project: { name: "Mock", path: "", templateVersion: "mock" },
      selection: {
        selectedTrackIndex: trackOrder.indexOf(String(view.activeBusId || "")),
      },
      transportState: null,
      entities: {
        tracksByGuid,
        trackOrder,
        fxByGuid: {},
        fxOrderByTrackGuid: {},
        routesById: {},
        routeIdsByTrackGuid: {},
      },
      perf: {
        buses,
        activeBusId: String(view.activeBusId || ""),
        busModesById: view.busModes || {},
        metersById: view.meters || {},
      },
    };
  }

  // -----------------------------
  // Case B: REAPER snapshot
  // -----------------------------
  const schema = String(view?.schema || "unknown");
  const seq = Number(view?.seq || 0);
  const ts = Number(view?.ts || 0);

  const reaper = {
    version: String(view?.reaper?.version || view?.reaperVersion || "unknown"),
    resourcePath: String(view?.reaper?.resourcePath || ""),
  };

  const project = {
    name: String(view?.project?.name || view?.projectName || ""),
    path: String(view?.project?.path || view?.projectPath || ""),
    templateVersion: String(
      view?.project?.templateVersion || view?.templateVersion || "unknown"
    ),
  };

  const selection = {
    selectedTrackIndex: Number(view?.selection?.selectedTrackIndex ?? -1),
  };

  const transportState = view?.transport || null;

  const tracks = Array.isArray(view?.tracks) ? view.tracks : [];

  const tracksByGuid = {};
  const trackOrder = [];
  const fxByGuid = {};
  const fxOrderByTrackGuid = {};
  const routesById = {};
  const routeIdsByTrackGuid = {};

  for (const tr of tracks) {
    const guid = String(tr?.trackGuid || "");
    if (!guid) continue;

    tracksByGuid[guid] = {
      guid,
      trackIndex: Number(tr?.trackIndex ?? 0),
      trackNumber: Number(tr?.trackNumber ?? 0),
      name: String(tr?.trackName || ""),

      parentGuid: String(tr?.parentGuid || ""),
      folderDepth: Number(tr?.folderDepth ?? 0),

      selected: !!tr?.selected,

      recArm: !!tr?.recArm,
      recMon: Number(tr?.recMon ?? 0),
      recMode: Number(tr?.recMode ?? 0),
      recInput: Number(tr?.recInput ?? 0),

      mute: !!tr?.mute,
      solo: Number(tr?.solo ?? 0),
      phaseInvert: !!tr?.phaseInvert,

      vol: Number(tr?.vol ?? 1),
      pan: Number(tr?.pan ?? 0),
      width: Number(tr?.width ?? 1),
      panLaw: Number(tr?.panLaw ?? 0),

      masterSend: !!tr?.masterSend,

      color: Number(tr?.color ?? 0),
      tcpHide: Number(tr?.tcpHide ?? 0),
      mcpHide: Number(tr?.mcpHide ?? 0),
    };

    trackOrder.push(guid);

    // FX
    const fxArr = Array.isArray(tr?.fx) ? tr.fx : [];
    const fxGuids = [];
    for (const fx of fxArr) {
      const fxGuid = String(fx?.fxGuid || "");
      if (!fxGuid) continue;
      fxByGuid[fxGuid] = {
        guid: fxGuid,
        trackGuid: guid,
        fxIndex: Number(fx?.fxIndex ?? 0),
        name: String(fx?.fxName || ""),
        enabled: fx?.enabled !== false,
        offline: !!fx?.offline,
      };
      fxGuids.push(fxGuid);
    }
    fxOrderByTrackGuid[guid] = fxGuids;

    // Routing edges
    const sends = Array.isArray(tr?.routing?.sends) ? tr.routing.sends : [];
    const receives = Array.isArray(tr?.routing?.receives) ? tr.routing.receives : [];

    const sendIds = [];
    const recvIds = [];

    for (const e of sends) {
      const id = `${guid}:send:${Number(e?.index ?? 0)}`;
      routesById[id] = normalizeEdge(id, guid, "send", e);
      sendIds.push(id);
    }
    for (const e of receives) {
      const id = `${guid}:receive:${Number(e?.index ?? 0)}`;
      routesById[id] = normalizeEdge(id, guid, "receive", e);
      recvIds.push(id);
    }

    routeIdsByTrackGuid[guid] = { sends: sendIds, receives: recvIds };
  }

  trackOrder.sort(
    (a, b) =>
      (tracksByGuid[a]?.trackIndex ?? 0) - (tracksByGuid[b]?.trackIndex ?? 0)
  );

  return {
    snapshot: { seq, schema, ts },
    reaper,
    project,
    selection,
    transportState,
    entities: {
      tracksByGuid,
      trackOrder,
      fxByGuid,
      fxOrderByTrackGuid,
      routesById,
      routeIdsByTrackGuid,
    },
    perf: null,
  };
}

function normalizeEdge(id, ownerGuid, category, e) {
  return {
    id,
    category,
    trackGuid: ownerGuid,
    srcTrackGuid: String(e?.srcTrackGuid || ""),
    destTrackGuid: String(e?.destTrackGuid || ""),
    sendMode: Number(e?.sendMode ?? 0),
    vol: Number(e?.vol ?? 1),
    pan: Number(e?.pan ?? 0),
    mute: !!e?.mute,
    phaseInvert: !!e?.phaseInvert,
    mono: !!e?.mono,
    srcChan: Number(e?.srcChan ?? 0),
    dstChan: Number(e?.dstChan ?? 0),
  };
}