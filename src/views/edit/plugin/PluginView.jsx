// src/views/edit/plugin/PluginView.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Panel } from "../../../components/ui/Panel";
import { styles } from "./_styles";
import { useIntent } from "../../../core/useIntent";
import { useRfxStore } from "../../../core/rfx/Store";
import { ParamCard } from "./components/ParamCard";
import { makeMockParamManifestForFx } from "../../../core/transport/MockParameterGenerator";
import { useIntentBuffered } from "../../../core/useIntentBuffered";

const EMPTY = Object.freeze({});
const EMPTY_ARR = Object.freeze([]);

function clamp01(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function canonicalTrackGuid(id) {
  return String(id || "").replace(/^([A-Za-z]+_\d+)_([ABC])$/, "$1$2");
}

export function PluginView() {
  const { trackId, fxId } = useParams();
  const nav = useNavigate();
  const intent = useIntent();
  const { send, flush } = useIntentBuffered({ intervalMs: 50 });

  const trackGuid = React.useMemo(() => canonicalTrackGuid(trackId), [trackId]);
  const fxGuid = String(fxId || "");

  // ---------------------------
  // Truth: FX meta
  // ---------------------------
  const fxByGuid = useRfxStore((s) => s.entities.fxByGuid || EMPTY);
  const fxOverlay = useRfxStore((s) => s.ops.overlay.fx || EMPTY);

  const baseFx = fxByGuid[fxGuid];
  const patchFx = fxOverlay[fxGuid];
  const fx = baseFx ? (patchFx ? { ...baseFx, ...patchFx } : baseFx) : null;

  // ---------------------------
  // Truth: params manifests (lazy-loaded)
  // ---------------------------
  const truthManifest = useRfxStore((s) => s.entities.fxParamsByGuid?.[fxGuid] || null);

  // Fallback manifest so UI can be built even if truth isn’t ready yet
  const [mockManifest, setMockManifest] = React.useState(null);

  // Kick the syscall when entering PluginView
  React.useEffect(() => {
    if (!trackGuid || !fxGuid) return;
    intent({ name: "getPluginParams", trackGuid, fxGuid });
  }, [intent, trackGuid, fxGuid]);

  // Build fallback mock manifest (only if no truth yet)
  React.useEffect(() => {
    if (truthManifest) {
      setMockManifest(null);
      return;
    }
    if (!fx) return;

    setMockManifest(
      makeMockParamManifestForFx({
        ...fx,
        id: fxGuid,
        guid: fxGuid,
        trackGuid,
      })
    );
  }, [truthManifest, fx, fxGuid, trackGuid]);

  const manifest = truthManifest || mockManifest;
  const params = Array.isArray(manifest?.params) ? manifest.params : EMPTY_ARR;

  // ---------------------------
  // Buffered continuous updates
  // ---------------------------
  const onParamScrub = React.useCallback(
    (p, next01) => {
      if (!p) return;
      const idx = Number(p.idx);
      if (!Number.isFinite(idx)) return;

      const key = `${fxGuid}:param:${idx}`;
      send(key, {
        name: "setParamValue",
        trackGuid,
        fxGuid,
        paramIdx: idx,
        value01: clamp01(next01),
      });
    },
    [send, fxGuid, trackGuid]
  );

  const onParamCommit = React.useCallback(() => {
    flush();
  }, [flush]);
  const knobMapByBusId = useRfxStore((s) => s.perf?.knobMapByBusId || {});
  const commitKnobMapping = useRfxStore((s) => s.commitKnobMapping);
  const [mapModalOpen, setMapModalOpen] = React.useState(false);
  const [mapParam, setMapParam] = React.useState(null);
  const activeBusId = useRfxStore(
    (s) => s.perf?.activeBusId || s.meters?.activeBusId || null
  );

  const onMap = React.useCallback((p) => {
    if (!p) return;
    setMapParam(p);
    setMapModalOpen(true);
  }, []);

  return (
    <div className={styles.Root}>
      <Panel className={styles.Panel}>
        <div className={styles.Header}>
          <div>
            <div className={styles.Title}>PLUGIN</div>
            <div className={styles.Subtitle}>
              {trackGuid} • {fxGuid}
            </div>
          </div>

          <button
            type="button"
            onClick={() => nav("/edit")}
            className={styles.BackButton}
          >
            BACK
          </button>
        </div>

        <div className="h-px bg-white/10" />

        <div className="p-4 min-h-0 flex-1 overflow-auto">
          {!manifest ? (
            <div className="text-white/45 text-[12px]">Loading parameters…</div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-white truncate">
                    {manifest?.plugin?.fxName || fx?.name || "Plugin"}
                  </div>
                  <div className="text-[11px] text-white/45 truncate">
                    {manifest?.scan?.filter ? `Source: ${manifest.scan.filter}` : "Source: mock"}
                    {" • "}
                    {params.length} params
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {params.map((p) => (
                  <ParamCard
                    key={p.idx}
                    trackGuid={trackGuid}
                    fxGuid={fxGuid}
                    p={p}
                    onChange01={onParamScrub}
                    onCommit01={onParamCommit}
                    onMap={onMap}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        {/* ✅ MAP MODAL */}
        {mapModalOpen ? (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center">
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => {
                setMapModalOpen(false);
                setMapParam(null);
              }}
            />

            {/* modal */}
            <div className="relative w-[560px] max-w-[92vw] rounded-2xl border border-white/10 bg-[#0b0f14] shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-white">
                    Map parameter to knob
                  </div>
                  <div className="text-[11px] text-white/45 truncate">
                    {String(manifest?.plugin?.fxName || fx?.name || "Plugin")}
                    {" • "}
                    {String(mapParam?.uiLabel || mapParam?.name || `Param ${mapParam?.idx ?? ""}`)}
                    {" • "}
                    Bus: {String(activeBusId || "NONE")}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMapModalOpen(false);
                    setMapParam(null);
                  }}
                  className="h-8 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-white/80"
                >
                  CLOSE
                </button>
              </div>

              <div className="h-px bg-white/10" />

              <div className="p-4">
                {(() => {
                  const busId = String(activeBusId || "");
                  const idx = Number(mapParam?.idx);
                  if (!busId || !Number.isFinite(idx)) {
                    return (
                      <div className="text-[12px] text-white/45">
                        Missing busId or param index.
                      </div>
                    );
                  }

                  const maps = knobMapByBusId?.[busId] || {};
                  const knobs = Array.from({ length: 7 }).map((_, i) => {
                    const knobId = `${busId}_k${i + 1}`;
                    const target = maps[knobId] || null;
                    const mappedText = target
                      ? `${target.fxName || "FX"} • ${target.paramName || `#${target.paramIdx}`}`
                      : "Unmapped";

                    return { knobId, label: `K${i + 1}`, mappedText, target };
                  });

                  return (
                    <div className="grid grid-cols-1 gap-2">
                      {knobs.map((k) => (
                        <button
                          key={k.knobId}
                          type="button"
                          className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2"
                          onClick={() => {
                            commitKnobMapping({
                              busId,
                              knobId: k.knobId,
                              trackGuid,
                              fxGuid,
                              paramIdx: idx,
                              paramName: String(mapParam?.uiLabel || mapParam?.name || `Param ${idx}`),
                              fxName: String(manifest?.plugin?.fxName || fx?.name || "Plugin"),
                              trackName: String(trackGuid),
                              label: String(mapParam?.uiLabel || mapParam?.name || `Param ${idx}`),
                            });

                            setMapModalOpen(false);
                            setMapParam(null);
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[12px] font-semibold text-white">
                              {k.label}
                            </div>
                            <div className="text-[11px] text-white/50 truncate">
                              {k.mappedText}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}