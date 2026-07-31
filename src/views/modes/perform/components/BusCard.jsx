import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Panel } from "../../../../components/ui/Panel";
import { canonicalTrackGuid, normalizeMode } from "../../../../core/DomainHelpers";
import {
  FX_MODULE_NODES_PER_LANE,
  fxModuleNodeKey,
  projectFxModuleBlockMove,
  useRfxStore,
} from "../../../../core/rfx/Store";
import { FxModuleBlock } from "../fxModules/FxModuleBlock";
import { FX_MODULE_ROUTE_BY_TYPE } from "../fxModules/fxModuleDefinitions";
import { FxNodeActionDialog } from "./FxNodeActionDialog";
import { styles } from "../_styles";

const LANE_IDS = ["A", "B", "C"];
const NODE_LONG_PRESS_MS = 500;
const NODE_DIALOG_CLOSE_MS = 220;
const NODE_GESTURE_THRESHOLD_PX = 8;
const SOURCE_ROW_HITBOX_SHRINK_DISTANCE_PX = 80;
const SOURCE_ROW_MIN_HITBOX_SCALE = 0.22;

function isInsideContractedSourceNode(event, element, drag) {
  if (
    element?.dataset?.fxNodeBus !== drag.busId ||
    element?.dataset?.fxNodeLane !== drag.lane
  ) {
    return true;
  }

  const rect = element.getBoundingClientRect();
  const verticalTravel = Math.abs(event.clientY - drag.startY);
  const shrinkProgress = Math.min(
    1,
    verticalTravel / SOURCE_ROW_HITBOX_SHRINK_DISTANCE_PX
  );
  const heightScale =
    1 - shrinkProgress * (1 - SOURCE_ROW_MIN_HITBOX_SCALE);
  const effectiveHalfHeight = (rect.height * heightScale) / 2;
  const nodeCenterY = rect.top + rect.height / 2;

  return Math.abs(event.clientY - nodeCenterY) <= effectiveHalfHeight;
}

function nodeDialogActionAtPoint(clientX, clientY) {
  const actionElement = document
    .elementFromPoint(clientX, clientY)
    ?.closest?.("[data-fx-node-action]");
  if (!actionElement || actionElement.disabled) return null;
  return actionElement.dataset.fxNodeAction || null;
}

function RoutingModeBadge({ mode }) {
  const m = normalizeMode(mode);
  const label =
    m === "linear" ? "LINEAR" : m === "parallel" ? "PARALLEL" : "LCR";
  const tone =
    m === "lcr"
      ? styles.BusCardModeBadgeLcr
      : m === "parallel"
        ? styles.BusCardModeBadgeParallel
        : styles.BusCardModeBadgeLinear;

  return (
    <span
      className={[styles.BusCardModeBadgeBase, tone].join(" ")}
      title={`Routing mode: ${label}`}
    >
      {label}
    </span>
  );
}

function lanesForMode(mode) {
  const m = normalizeMode(mode);
  return {
    A: true,
    B: m === "parallel" || m === "lcr",
    C: m === "lcr",
  };
}

function SignalLine({
  trackName,
  busId,
  lane,
  blocksByNode,
  onSelectNode,
  onOpenBlock,
  dragTargetNodeKey,
  onBlockPointerDown,
  onEmptyNodeClick,
  onEmptyNodePointerCancel,
  onEmptyNodePointerDown,
  onEmptyNodePointerMove,
  onEmptyNodePointerUp,
}) {
  return (
    <div
      className={styles.BusCardSignalRow}
      aria-label={`${trackName} signal flow, left to right`}
    >
      <div className={styles.BusCardSignalLine} aria-hidden="true">
        <span className={styles.BusCardSignalStart} />
        <span className={styles.BusCardSignalArrow} />
      </div>
      <div className={styles.BusCardSignalSlots}>
        {Array.from({ length: FX_MODULE_NODES_PER_LANE }, (_, index) => {
          const nodeKey = fxModuleNodeKey(busId, lane, index);
          const block = blocksByNode[nodeKey];
          const dragTarget = dragTargetNodeKey === nodeKey;

          return (
            <div
              className={[
                styles.BusCardSignalSlot,
                dragTarget ? styles.BusCardSignalSlotDragTarget : "",
              ].filter(Boolean).join(" ")}
              data-signal-node-index={index}
              data-fx-node-key={nodeKey}
              data-fx-node-bus={busId}
              data-fx-node-lane={lane}
              data-fx-node-index={index}
              key={index}
              role={block ? undefined : "button"}
              tabIndex={block ? -1 : 0}
              aria-label={block ? undefined : `Add FX module at node ${index + 1}`}
              onClick={
                block
                  ? undefined
                  : (event) => onEmptyNodeClick(event, {
                      busId,
                      lane,
                      nodeIndex: index,
                      nodeKey,
                    })
              }
              onPointerDown={
                block
                  ? undefined
                  : (event) => onEmptyNodePointerDown(event, {
                      busId,
                      lane,
                      nodeIndex: index,
                      nodeKey,
                    })
              }
              onPointerMove={block ? undefined : onEmptyNodePointerMove}
              onPointerUp={block ? undefined : onEmptyNodePointerUp}
              onPointerCancel={block ? undefined : onEmptyNodePointerCancel}
              onContextMenu={
                block
                  ? undefined
                  : (event) => event.preventDefault()
              }
              onKeyDown={block ? undefined : (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                onSelectNode(lane, index);
              }}
            >
              {block ? (
                <div
                  className={styles.BusCardPlacedModule}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${block.type} module`}
                  onPointerDown={(event) => onBlockPointerDown(event, {
                    block,
                    busId,
                    lane,
                    nodeIndex: index,
                    nodeKey,
                  })}
                  onContextMenu={(event) => event.preventDefault()}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    event.stopPropagation();
                    onOpenBlock(block.type);
                  }}
                >
                  <div
                    className={styles.BusCardPlacedModuleScale}
                    data-fx-preview-block-id={block.id}
                  >
                    <FxModuleBlock
                      bypassed={block.bypassed}
                      fillContainer
                      id={block.id}
                      type={block.type}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className={styles.BusCardSignalLabel}>{trackName}</div>
    </div>
  );
}

export function BusCard({
  bus,
  isActive,
  showActiveRing = true,
  routingMode = "linear",
  onDragMapBusVolume,
}) {
  const navigate = useNavigate();
  const busId = bus?.id || "FX_?";
  const label = bus?.label ?? busId;
  const activeLanes = lanesForMode(routingMode);
  const blocksByNode = useRfxStore(
    (state) => state.perf?.fxModuleBlocksByNode || {}
  );
  const selectFxModuleNode = useRfxStore((state) => state.selectFxModuleNode);
  const moveFxModuleBlock = useRfxStore((state) => state.moveFxModuleBlock);
  const removeFxModuleBlock = useRfxStore((state) => state.removeFxModuleBlock);
  const toggleFxModuleBlockBypass = useRfxStore(
    (state) => state.toggleFxModuleBlockBypass
  );
  const copyFxModuleBlock = useRfxStore((state) => state.copyFxModuleBlock);
  const pasteFxModuleBlock = useRfxStore((state) => state.pasteFxModuleBlock);
  const copiedFxModuleBlock = useRfxStore(
    (state) => state.perf?.copiedFxModuleBlock ?? null
  );
  const signalSurfaceRef = React.useRef(null);
  const previewBlockRectsRef = React.useRef(new Map());
  const dragRef = React.useRef(null);
  const nodeLongPressTimerRef = React.useRef(null);
  const nodeDialogCloseTimerRef = React.useRef(null);
  const highlightedNodeActionRef = React.useRef(null);
  const visibleHighlightedNodeActionRef = React.useRef(null);
  const emptyPressRef = React.useRef(null);
  const suppressedEmptyClickRef = React.useRef(null);
  const [dragUi, setDragUi] = React.useState(null);
  const [nodeDialog, setNodeDialog] = React.useState(null);
  const [highlightedNodeAction, setHighlightedNodeAction] =
    React.useState(null);
  const displayedBlocksByNode = React.useMemo(() => {
    if (!dragUi?.dragging) return blocksByNode;

    const projected = dragUi.target
      ? projectFxModuleBlockMove(
          blocksByNode,
          {
            busId: dragUi.busId,
            lane: dragUi.lane,
            nodeIndex: dragUi.nodeIndex,
          },
          dragUi.target
        )
      : blocksByNode;
    const draggedBlockId = dragUi.block?.id;
    const withoutDraggedBlock = {};

    for (const [nodeKey, block] of Object.entries(projected)) {
      if (block?.id !== draggedBlockId) {
        withoutDraggedBlock[nodeKey] = block;
      }
    }

    return withoutDraggedBlock;
  }, [blocksByNode, dragUi]);
  const previewLayoutKey = dragUi?.dragging
    ? `${dragUi.block?.id || "unknown"}:${dragUi.targetKey || "outside"}`
    : "idle";

  React.useEffect(() => {
    visibleHighlightedNodeActionRef.current = highlightedNodeAction;
  }, [highlightedNodeAction]);

  React.useLayoutEffect(() => {
    const surface = signalSurfaceRef.current;
    if (!surface) return;

    const elements = Array.from(
      surface.querySelectorAll("[data-fx-preview-block-id]")
    );
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    for (const element of elements) {
      for (const animation of element.getAnimations?.() || []) {
        try {
          animation.finish();
          animation.cancel();
        } catch {
          // The animation may already have completed.
        }
      }
    }

    const nextRects = new Map();
    for (const element of elements) {
      const blockId = element.dataset.fxPreviewBlockId;
      if (!blockId) continue;
      nextRects.set(blockId, {
        element,
        rect: element.getBoundingClientRect(),
      });
    }

    if (!prefersReducedMotion) {
      for (const [blockId, current] of nextRects) {
        const previous = previewBlockRectsRef.current.get(blockId);
        if (!previous) continue;

        const deltaX = previous.rect.left - current.rect.left;
        const deltaY = previous.rect.top - current.rect.top;
        if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) continue;

        current.element.animate(
          [
            { transform: `translate(${deltaX}px, ${deltaY}px)` },
            { transform: "translate(0, 0)" },
          ],
          {
            duration: 190,
            easing: "cubic-bezier(0.2, 0.78, 0.24, 1)",
          }
        );
      }
    }

    previewBlockRectsRef.current = nextRects;
  }, [blocksByNode, previewLayoutKey]);

  const selectNode = React.useCallback((lane, nodeIndex) => {
    selectFxModuleNode({ busId, lane, nodeIndex });
    navigate("/fx-modules");
  }, [busId, navigate, selectFxModuleNode]);

  const openBlock = React.useCallback((type) => {
    const route = FX_MODULE_ROUTE_BY_TYPE[type];
    if (route) navigate(`/fx-modules/${route}`);
  }, [navigate]);

  const clearNodeLongPress = React.useCallback(() => {
    if (nodeLongPressTimerRef.current) {
      clearTimeout(nodeLongPressTimerRef.current);
      nodeLongPressTimerRef.current = null;
    }
  }, []);

  const updateHighlightedNodeAction = React.useCallback((clientX, clientY) => {
    const nextAction = nodeDialogActionAtPoint(clientX, clientY);
    if (highlightedNodeActionRef.current === nextAction) return;
    highlightedNodeActionRef.current = nextAction;
    setHighlightedNodeAction(nextAction);
  }, []);

  const openNodeDialog = React.useCallback((dialog) => {
    if (nodeDialogCloseTimerRef.current) {
      clearTimeout(nodeDialogCloseTimerRef.current);
      nodeDialogCloseTimerRef.current = null;
    }
    highlightedNodeActionRef.current = null;
    visibleHighlightedNodeActionRef.current = null;
    setHighlightedNodeAction(null);
    setNodeDialog({ ...dialog, closing: false });
  }, []);

  const closeNodeDialog = React.useCallback(() => {
    highlightedNodeActionRef.current = null;
    visibleHighlightedNodeActionRef.current = null;
    setHighlightedNodeAction(null);
    setNodeDialog((current) =>
      current ? { ...current, closing: true } : null
    );
    if (nodeDialogCloseTimerRef.current) {
      clearTimeout(nodeDialogCloseTimerRef.current);
    }
    nodeDialogCloseTimerRef.current = setTimeout(() => {
      nodeDialogCloseTimerRef.current = null;
      setNodeDialog(null);
    }, NODE_DIALOG_CLOSE_MS);
  }, []);

  const selectedVisibleNodeActionAtPoint = React.useCallback(
    (clientX, clientY) => {
      const actionAtPoint = nodeDialogActionAtPoint(clientX, clientY);
      return actionAtPoint &&
        actionAtPoint === visibleHighlightedNodeActionRef.current
        ? actionAtPoint
        : null;
    },
    []
  );

  const executeNodeDialogAction = React.useCallback((action, node) => {
    if (!action || !node) {
      closeNodeDialog();
      return;
    }

    if (action === "toggle-bypass" && node.block) {
      toggleFxModuleBlockBypass(node);
    } else if (action === "copy" && node.block) {
      copyFxModuleBlock(node);
    } else if (action === "remove" && node.block) {
      removeFxModuleBlock(node);
    } else if (action === "paste" && !node.block && copiedFxModuleBlock) {
      pasteFxModuleBlock(node);
    } else if (action === "add" && !node.block) {
      closeNodeDialog();
      selectNode(node.lane, node.nodeIndex);
      return;
    }

    closeNodeDialog();
  }, [
    closeNodeDialog,
    copiedFxModuleBlock,
    copyFxModuleBlock,
    pasteFxModuleBlock,
    removeFxModuleBlock,
    selectNode,
    toggleFxModuleBlockBypass,
  ]);

  const resetBlockDrag = React.useCallback(() => {
    clearNodeLongPress();
    dragRef.current = null;
    setDragUi(null);
  }, [clearNodeLongPress]);

  const onBlockPointerDown = React.useCallback((event, payload) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    clearNodeLongPress();
    closeNodeDialog();
    const captureTarget =
      event.currentTarget.closest?.("[data-fx-drag-surface]") ??
      event.currentTarget;
    captureTarget.setPointerCapture?.(event.pointerId);
    const drag = {
      ...payload,
      anchorRect: event.currentTarget
        .closest?.("[data-fx-node-key]")
        ?.getBoundingClientRect(),
      captureTarget,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      dragging: false,
      longPressed: false,
      target: null,
      targetKey: null,
    };
    dragRef.current = drag;
    nodeLongPressTimerRef.current = setTimeout(() => {
      const current = dragRef.current;
      if (!current || current !== drag || current.dragging) return;
      current.longPressed = true;
      openNodeDialog({
        anchorRect: current.anchorRect,
        block: current.block,
        busId: current.busId,
        lane: current.lane,
        nodeIndex: current.nodeIndex,
        nodeKey: current.nodeKey,
      });
    }, NODE_LONG_PRESS_MS);
  }, [clearNodeLongPress, closeNodeDialog, openNodeDialog]);

  const onBlockPointerMove = React.useCallback((event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.longPressed) {
      event.preventDefault();
      event.stopPropagation();
      updateHighlightedNodeAction(event.clientX, event.clientY);
      return;
    }

    const distance = Math.hypot(
      event.clientX - drag.startX,
      event.clientY - drag.startY
    );
    if (!drag.dragging && distance < NODE_GESTURE_THRESHOLD_PX) return;

    event.preventDefault();
    event.stopPropagation();
    clearNodeLongPress();
    drag.dragging = true;
    drag.x = event.clientX;
    drag.y = event.clientY;

    let targetElement = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest?.("[data-fx-node-key]");
    if (
      targetElement &&
      !isInsideContractedSourceNode(event, targetElement, drag)
    ) {
      targetElement = null;
    }
    const targetIndex = Number(targetElement?.dataset?.fxNodeIndex);
    const target =
      targetElement && Number.isInteger(targetIndex)
        ? {
            busId: targetElement.dataset.fxNodeBus,
            lane: targetElement.dataset.fxNodeLane,
            nodeIndex: targetIndex,
          }
        : null;

    drag.target = target;
    drag.targetKey = targetElement?.dataset?.fxNodeKey || null;
    setDragUi({ ...drag });
  }, [clearNodeLongPress, updateHighlightedNodeAction]);

  const onBlockPointerUp = React.useCallback((event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();
    clearNodeLongPress();
    try {
      drag.captureTarget?.releasePointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }

    if (drag.longPressed) {
      executeNodeDialogAction(
        selectedVisibleNodeActionAtPoint(event.clientX, event.clientY),
        drag
      );
      resetBlockDrag();
      return;
    }

    if (drag.dragging) {
      if (drag.target) {
        moveFxModuleBlock({
          from: {
            busId: drag.busId,
            lane: drag.lane,
            nodeIndex: drag.nodeIndex,
          },
          to: drag.target,
        });
      } else {
        removeFxModuleBlock({
          busId: drag.busId,
          lane: drag.lane,
          nodeIndex: drag.nodeIndex,
        });
      }
    } else {
      openBlock(drag.block.type);
    }

    resetBlockDrag();
  }, [
    clearNodeLongPress,
    executeNodeDialogAction,
    moveFxModuleBlock,
    openBlock,
    removeFxModuleBlock,
    resetBlockDrag,
    selectedVisibleNodeActionAtPoint,
  ]);

  const onBlockPointerCancel = React.useCallback((event) => {
    event.stopPropagation();
    if (dragRef.current?.longPressed) closeNodeDialog();
    resetBlockDrag();
  }, [closeNodeDialog, resetBlockDrag]);

  const onEmptyNodePointerDown = React.useCallback((event, payload) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.stopPropagation();
    clearNodeLongPress();
    closeNodeDialog();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const press = {
      ...payload,
      anchorRect: event.currentTarget.getBoundingClientRect(),
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      fired: false,
    };
    emptyPressRef.current = press;
    nodeLongPressTimerRef.current = setTimeout(() => {
      if (emptyPressRef.current !== press) return;
      press.fired = true;
      suppressedEmptyClickRef.current = {
        nodeKey: press.nodeKey,
        at: Date.now(),
      };
      openNodeDialog({
        anchorRect: press.anchorRect,
        block: null,
        busId: press.busId,
        lane: press.lane,
        nodeIndex: press.nodeIndex,
        nodeKey: press.nodeKey,
      });
    }, NODE_LONG_PRESS_MS);
  }, [clearNodeLongPress, closeNodeDialog, openNodeDialog]);

  const onEmptyNodePointerMove = React.useCallback((event) => {
    const press = emptyPressRef.current;
    if (!press || press.pointerId !== event.pointerId) return;
    if (press.fired) {
      event.preventDefault();
      event.stopPropagation();
      updateHighlightedNodeAction(event.clientX, event.clientY);
      return;
    }
    const distance = Math.hypot(
      event.clientX - press.startX,
      event.clientY - press.startY
    );
    if (distance < NODE_GESTURE_THRESHOLD_PX) return;
    clearNodeLongPress();
    suppressedEmptyClickRef.current = {
      nodeKey: press.nodeKey,
      at: Date.now(),
    };
    emptyPressRef.current = null;
  }, [clearNodeLongPress, updateHighlightedNodeAction]);

  const onEmptyNodePointerUp = React.useCallback((event) => {
    const press = emptyPressRef.current;
    if (!press || press.pointerId !== event.pointerId) return;
    clearNodeLongPress();
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture may already have been released.
    }
    if (press.fired) {
      event.preventDefault();
      event.stopPropagation();
      executeNodeDialogAction(
        selectedVisibleNodeActionAtPoint(event.clientX, event.clientY),
        press
      );
    }
    emptyPressRef.current = null;
  }, [
    clearNodeLongPress,
    executeNodeDialogAction,
    selectedVisibleNodeActionAtPoint,
  ]);

  const onEmptyNodePointerCancel = React.useCallback(() => {
    clearNodeLongPress();
    if (emptyPressRef.current?.fired) closeNodeDialog();
    emptyPressRef.current = null;
  }, [clearNodeLongPress, closeNodeDialog]);

  const onEmptyNodeClick = React.useCallback((event, payload) => {
    const suppressed = suppressedEmptyClickRef.current;
    if (
      suppressed?.nodeKey === payload.nodeKey &&
      Date.now() - suppressed.at < 1000
    ) {
      event.preventDefault();
      event.stopPropagation();
      suppressedEmptyClickRef.current = null;
      return;
    }
    selectNode(payload.lane, payload.nodeIndex);
  }, [selectNode]);

  React.useEffect(() => {
    return () => {
      clearNodeLongPress();
      if (nodeDialogCloseTimerRef.current) {
        clearTimeout(nodeDialogCloseTimerRef.current);
      }
    };
  }, [clearNodeLongPress]);

  React.useEffect(() => {
    closeNodeDialog();
  }, [busId, closeNodeDialog, routingMode]);

  React.useEffect(() => {
    // Live projection can unmount the source block, so its React handlers
    // cannot own the rest of the gesture. Pointer capture stays on the stable
    // bus panel and these listeners carry the drag through pointerup/cancel.
    window.addEventListener("pointermove", onBlockPointerMove);
    window.addEventListener("pointerup", onBlockPointerUp);
    window.addEventListener("pointercancel", onBlockPointerCancel);

    return () => {
      window.removeEventListener("pointermove", onBlockPointerMove);
      window.removeEventListener("pointerup", onBlockPointerUp);
      window.removeEventListener("pointercancel", onBlockPointerCancel);
    };
  }, [onBlockPointerCancel, onBlockPointerMove, onBlockPointerUp]);

  function onDragStartMap(e) {
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.setData("text/plain", `busvol:${busId}`);
      e.dataTransfer.effectAllowed = "copy";
    }

    onDragMapBusVolume?.(busId);
  }

  return (
    <>
    <Panel
      as="div"
      data-fx-drag-surface={busId}
      interactive={false}
      active={isActive && showActiveRing}
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.012) 100%)",
        backgroundColor: "rgba(8,9,11,0.72)",
      }}
      className={styles.BusCardButton}
    >
      <div className={styles.BusCardHeader}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={styles.BusCardTitle}>{label}</div>
          <RoutingModeBadge mode={routingMode} />
        </div>

        <button
          type="button"
          draggable
          onDragStart={onDragStartMap}
          onClick={(e) => e.stopPropagation()}
          title="Drag to vertical knob slider to map BUS volume"
          className={[styles.BusCardMapButton, "justify-self-end"].join(" ")}
        >
          <span aria-hidden="true" style={{ fontSize: 13, lineHeight: 1 }}>
            🎚️
          </span>
        </button>
      </div>

      <div className={styles.BusCardInnerRow}>
        <div ref={signalSurfaceRef} className={styles.BusCardLeft}>
          <div className={styles.BusCardRoutingSlot}>
            <div className={styles.BusCardTrackGrid}>
              {LANE_IDS.filter((lane) => isActive && activeLanes[lane]).map(
                (lane) => (
                  <SignalLine
                    blocksByNode={displayedBlocksByNode}
                    busId={busId}
                    dragTargetNodeKey={dragUi?.targetKey ?? null}
                    key={lane}
                    lane={lane}
                    onBlockPointerDown={onBlockPointerDown}
                    onEmptyNodeClick={onEmptyNodeClick}
                    onEmptyNodePointerCancel={onEmptyNodePointerCancel}
                    onEmptyNodePointerDown={onEmptyNodePointerDown}
                    onEmptyNodePointerMove={onEmptyNodePointerMove}
                    onEmptyNodePointerUp={onEmptyNodePointerUp}
                    onOpenBlock={openBlock}
                    onSelectNode={selectNode}
                    trackName={canonicalTrackGuid(`${busId}${lane}`)}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </Panel>
    {dragUi?.dragging && typeof document !== "undefined"
      ? createPortal(
          <div
            className={styles.BusCardDragGhost}
            style={{ left: dragUi.x - 42, top: dragUi.y - 37 }}
            aria-hidden="true"
          >
            <FxModuleBlock
              bypassed={dragUi.block.bypassed}
              dragging
              id={`${dragUi.block.id}:drag-preview`}
              type={dragUi.block.type}
            />
          </div>,
          document.body
        )
      : null}
    {nodeDialog ? (
      <FxNodeActionDialog
        anchorRect={nodeDialog.anchorRect}
        block={nodeDialog.block}
        closing={nodeDialog.closing}
        hasCopiedBlock={Boolean(copiedFxModuleBlock)}
        highlightedAction={highlightedNodeAction}
        onAdd={() => executeNodeDialogAction("add", nodeDialog)}
        onBypassToggle={() =>
          executeNodeDialogAction("toggle-bypass", nodeDialog)
        }
        onClose={closeNodeDialog}
        onCopy={() => executeNodeDialogAction("copy", nodeDialog)}
        onPaste={() => executeNodeDialogAction("paste", nodeDialog)}
        onRemove={() => executeNodeDialogAction("remove", nodeDialog)}
      />
    ) : null}
    </>
  );
}
