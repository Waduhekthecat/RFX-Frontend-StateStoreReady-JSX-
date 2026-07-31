import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { clamp01, mapMacroTargetValue01 } from "../../core/DomainHelpers";
import { useRfxStore } from "../../core/rfx/Store";
import { Knob } from "../../components/controls/knobs/Knob";
import { VerticalKnobSlider } from "../../components/controls/knobs/VerticalKnobSlider";
import { MapCard } from "../../components/ui/MapCard";
import { Module } from "../../components/ui/Module";

const EMPTY_OBJ = Object.freeze({});
const MAX_TARGETS = 3;

function normalizeTargets(raw) {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function readFxParam01(sources, fxGuid, paramIdx, fallback01 = 0.5) {
  const patch = sources.overlay?.[fxGuid]?.[paramIdx];
  if (patch && Number.isFinite(Number(patch.value01))) return clamp01(patch.value01);

  const manifest = sources.entities?.[fxGuid] ?? sources.snapshot?.[fxGuid];
  const param = manifest?.params?.find?.((entry) => Number(entry?.idx) === Number(paramIdx));
  return Number.isFinite(Number(param?.value01)) ? clamp01(param.value01) : clamp01(fallback01);
}

export function MacroEditView() {
  const navigate = useNavigate();
  const { busId: routeBusId, knobNumber } = useParams();
  const busId = String(routeBusId || "");
  const parsedKnobNumber = Number(knobNumber);
  const selectedNumber = Number.isInteger(parsedKnobNumber)
    ? Math.max(1, Math.min(7, parsedKnobNumber))
    : 1;
  const knobId = busId ? `${busId}_k${selectedNumber}` : "";

  const knobMapByBusId = useRfxStore((s) => s.perf?.knobMapByBusId || EMPTY_OBJ);
  const knobValuesByBusId = useRfxStore((s) => s.perf?.knobValuesByBusId || EMPTY_OBJ);
  const fxParamsOverlay = useRfxStore((s) => s.ops?.overlay?.fxParamsByGuid || EMPTY_OBJ);
  const fxParamsEntities = useRfxStore((s) => s.entities?.fxParamsByGuid || EMPTY_OBJ);
  const fxParamsSnapshot = useRfxStore((s) => s.snapshot?.fxParamsByGuid || EMPTY_OBJ);
  const dispatchIntent = useRfxStore((s) => s.dispatchIntent);
  const setKnobValueLocal = useRfxStore((s) => s.setKnobValueLocal);
  const updateKnobMappingTarget = useRfxStore((s) => s.updateKnobMappingTarget);
  const removeKnobMappingTarget = useRfxStore((s) => s.removeKnobMappingTarget);
  const reorderKnobMappingTarget = useRfxStore((s) => s.reorderKnobMappingTarget);

  const busMap = knobMapByBusId?.[busId] || EMPTY_OBJ;
  const targets = React.useMemo(
    () => normalizeTargets(busMap?.[knobId]).slice(0, MAX_TARGETS),
    [busMap, knobId]
  );
  const sources = React.useMemo(
    () => ({ overlay: fxParamsOverlay, entities: fxParamsEntities, snapshot: fxParamsSnapshot }),
    [fxParamsOverlay, fxParamsEntities, fxParamsSnapshot]
  );
  const storedValue = clamp01(knobValuesByBusId?.[busId]?.[knobId] ?? 0.5);
  const [localValue, setLocalValue] = React.useState(storedValue);
  const [draggingIndex, setDraggingIndex] = React.useState(null);
  const [dropIndex, setDropIndex] = React.useState(null);
  const reorderRef = React.useRef({ source: -1, startY: 0, rowHeight: 1, timer: null, active: false });

  React.useEffect(() => setLocalValue(storedValue), [knobId, storedValue]);
  React.useEffect(() => () => {
    if (reorderRef.current.timer) clearTimeout(reorderRef.current.timer);
  }, []);

  const changeMacro = React.useCallback(
    (next01) => {
      const value01 = clamp01(next01);
      setLocalValue(value01);
      setKnobValueLocal?.({ busId, knobId, value01 });
      for (const target of targets) {
        if (!target?.fxGuid || !Number.isFinite(Number(target?.paramIdx))) continue;
        dispatchIntent({
          name: "setParamValue",
          phase: "preview",
          gestureId: `macroEdit:${busId}:${knobId}`,
          trackGuid: target.trackGuid,
          fxGuid: String(target.fxGuid),
          paramIdx: Number(target.paramIdx),
          value01: mapMacroTargetValue01(value01, target),
        });
      }
    },
    [busId, dispatchIntent, knobId, setKnobValueLocal, targets]
  );

  const commitMacro = React.useCallback(() => {
    for (const target of targets) {
      if (!target?.fxGuid || !Number.isFinite(Number(target?.paramIdx))) continue;
      dispatchIntent({
        name: "setParamValue",
        phase: "commit",
        gestureId: `macroEdit:${busId}:${knobId}`,
        trackGuid: target.trackGuid,
        fxGuid: String(target.fxGuid),
        paramIdx: Number(target.paramIdx),
        value01: mapMacroTargetValue01(localValue, target),
      });
    }
  }, [busId, dispatchIntent, knobId, localValue, targets]);

  const changeMappedParam = React.useCallback(
    (target, next01) => {
      const value01 = clamp01(next01);
      const gestureId = `macroMap:${busId}:${target.fxGuid}:${target.paramIdx}`;
      const call = {
        name: "setParamValue",
        gestureId,
        trackGuid: target.trackGuid,
        fxGuid: String(target.fxGuid),
        paramIdx: Number(target.paramIdx),
        value01,
      };
      dispatchIntent({ ...call, phase: "preview" });
      dispatchIntent({ ...call, phase: "commit" });
    },
    [busId, dispatchIntent]
  );

  const patchTarget = React.useCallback((target, patch) => {
    updateKnobMappingTarget?.({
      busId,
      knobId,
      fxGuid: target.fxGuid,
      paramIdx: target.paramIdx,
      patch,
    });
  }, [busId, knobId, updateKnobMappingTarget]);

  const startReorder = React.useCallback((event, index) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (reorderRef.current.timer) clearTimeout(reorderRef.current.timer);
    reorderRef.current = {
      source: index,
      startY: Number(event.clientY || 0),
      rowHeight: Number(event.currentTarget?.getBoundingClientRect?.().height) || 1,
      timer: null,
      active: false,
    };
    reorderRef.current.timer = setTimeout(() => {
      reorderRef.current.active = true;
      setDraggingIndex(index);
      setDropIndex(index);
    }, 300);
  }, []);

  const moveReorder = React.useCallback((event) => {
    const drag = reorderRef.current;
    if (!drag.active) return;
    const delta = Math.round((Number(event.clientY || 0) - drag.startY) / drag.rowHeight);
    setDropIndex(Math.max(0, Math.min(targets.length - 1, drag.source + delta)));
  }, [targets.length]);

  const endReorder = React.useCallback(() => {
    const drag = reorderRef.current;
    if (drag.timer) clearTimeout(drag.timer);
    if (drag.active && Number.isInteger(dropIndex) && drag.source !== dropIndex) {
      reorderKnobMappingTarget?.({ busId, knobId, fromIndex: drag.source, toIndex: dropIndex });
    }
    reorderRef.current = { source: -1, startY: 0, rowHeight: 1, timer: null, active: false };
    setDraggingIndex(null);
    setDropIndex(null);
  }, [busId, dropIndex, knobId, reorderKnobMappingTarget]);

  if (!busId || !knobId) {
    return <div className="h-full p-6 text-white/60">No macro bus was provided.</div>;
  }

  const selectedLabel = targets[0]?.paramName || `Macro K${selectedNumber}`;

  return (
    <div className="h-full min-h-0 w-full p-3 flex flex-col gap-3 overflow-hidden">
      <Module height={250} contentClassName="grid grid-cols-[1fr_260px_1fr] items-center gap-6 px-10">
        <div className="flex h-full flex-col justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-16 top-3 z-30 h-12 rounded-xl border border-white/15 bg-black/30 px-7 text-sm font-bold text-white/85 shadow-[0_4px_12px_rgba(0,0,0,0.45)] hover:bg-white/10"
          >
            ‹ BACK
          </button>
          <div className="text-4xl font-bold text-cyan-400">K{selectedNumber}</div>
          <div className="mt-2 text-xl font-semibold text-white">{selectedLabel}</div>
        </div>
        <div className="h-[190px] flex items-start justify-center">
          {selectedNumber === 7 ? (
            <VerticalKnobSlider
              id={knobId}
              label="K7"
              value={localValue}
              mapped={targets.length > 0}
              mappedLabel={selectedLabel}
              interactive={targets.length > 0}
              onChange={changeMacro}
              onCommit={commitMacro}
            />
          ) : (
            <Knob
              id={knobId}
              label={`K${selectedNumber}`}
              value={localValue}
              mapped={targets.length > 0}
              mappedLabel={selectedLabel}
              interactive={targets.length > 0}
              onChange={changeMacro}
              onCommit={commitMacro}
            />
          )}
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-5">
          <div className="text-xs font-bold tracking-widest text-white/55">MACRO POSITION</div>
          <div className="mt-3 text-5xl font-semibold tabular-nums text-cyan-400">{localValue.toFixed(2)}</div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-cyan-400" style={{ width: `${localValue * 100}%` }} />
          </div>
        </div>
      </Module>

      <Module height="auto" className="min-h-0 flex-1" contentClassName="min-h-0 flex flex-col p-3">
        <div className="flex items-center justify-between pl-10 pr-12 pb-3">
          <div className="text-sm font-bold tracking-[0.28em] text-cyan-300">MAPPED PARAMETERS</div>
          <div className="mr-2 text-xs font-semibold text-white/40">Maximum {MAX_TARGETS}</div>
        </div>
        <div className="grid min-h-0 flex-1 auto-rows-[156px] gap-3 overflow-y-auto px-1 pb-1">
          {Array.from({ length: MAX_TARGETS }).map((_, index) => {
            const target = targets[index];
            return (
              <div key={target ? `${target.fxGuid}:${target.paramIdx}` : `empty:${index}`} className="min-h-0">
                {target ? (
                  <MapCard
                    draggableActive={draggingIndex === index || dropIndex === index}
                    draggableGhost={draggingIndex !== null && draggingIndex !== index && dropIndex !== index}
                    onDragHoldStart={(event) => startReorder(event, index)}
                    onDragHoldMove={moveReorder}
                    onDragHoldEnd={endReorder}
                    orderNumber={index + 1}
                    paramName={target.paramName || `Param ${target.paramIdx}`}
                    pluginName={target.fxName || "Plugin"}
                    value01={readFxParam01(sources, target.fxGuid, target.paramIdx, 0.5)}
                    invert={target.invert === true}
                    rangeEnabled={target.rangeEnabled === true}
                    rangeMin01={target.targetMin01 ?? 0}
                    rangeMax01={target.targetMax01 ?? 1}
                    curve={target.curve || "linear"}
                    sensitivity={target.sensitivity ?? 1}
                    badgeLabel={index === 0 ? "Primary" : ""}
                    onChange01={(next) => changeMappedParam(target, next)}
                    onToggleInvert={() => patchTarget(target, { invert: target.invert !== true })}
                    onRangeEnabledChange={(rangeEnabled) => patchTarget(target, { rangeEnabled })}
                    onRangeChange={({ min01, max01 }) => patchTarget(target, { targetMin01: min01, targetMax01: max01 })}
                    onCurveChange={(curve) => patchTarget(target, { curve })}
                    onSensitivityChange={(sensitivity) => patchTarget(target, { sensitivity })}
                    onUnmap={() => removeKnobMappingTarget?.({ busId, knobId, fxGuid: target.fxGuid, paramIdx: target.paramIdx })}
                  />
                ) : (
                  <div className="h-full rounded-2xl border border-dashed border-white/10 bg-black/10 flex items-center justify-center text-xs font-semibold tracking-widest text-white/20">
                    EMPTY MAPPING SLOT
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {targets.length > 1 ? <div className="pt-2 text-center text-[11px] text-white/35">Hold and drag a parameter row to change its mapping order.</div> : null}
      </Module>
    </div>
  );
}
