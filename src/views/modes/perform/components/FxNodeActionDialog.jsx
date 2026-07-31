import React from "react";
import { createPortal } from "react-dom";
import { getFxModuleDefinition } from "../fxModules/fxModuleDefinitions";
import styles from "./FxNodeActionDialog.module.css";

function ActionGlyph({ kind }) {
  if (kind === "bypass") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="m7 17 10-10" />
      </svg>
    );
  }
  if (kind === "copy" || kind === "paste") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="8" y="7" width="10" height="12" rx="1.5" />
        <path d="M15 7V5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v10A1.5 1.5 0 0 0 5.5 17H8" />
      </svg>
    );
  }
  if (kind === "remove") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M9 4h6l1 3H8l1-3Z" />
        <path d="m7 7 1 13h8l1-13M10 10v7M14 10v7" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v16M4 12h16" />
    </svg>
  );
}

function ActionButton({
  actionId,
  highlighted,
  kind,
  label,
  disabled = false,
  destructive = false,
  onClick,
}) {
  return (
    <button
      type="button"
      className={[
        styles.action,
        highlighted ? styles.highlighted : "",
        destructive ? styles.destructive : "",
      ].filter(Boolean).join(" ")}
      data-fx-node-action={actionId}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={styles.actionIcon}>
        <ActionGlyph kind={kind} />
      </span>
      <span>{label}</span>
    </button>
  );
}

export function FxNodeActionDialog({
  anchorRect,
  block,
  closing,
  hasCopiedBlock,
  highlightedAction,
  onAdd,
  onBypassToggle,
  onClose,
  onCopy,
  onPaste,
  onRemove,
}) {
  const dialogRef = React.useRef(null);
  const definition = block ? getFxModuleDefinition(block.type) : null;
  const Icon = definition?.icon;
  const width = 228;
  const estimatedHeight = block ? 218 : 166;
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
  const anchorCenter = (anchorRect?.left ?? 0) + (anchorRect?.width ?? width) / 2;
  const left = Math.max(12, Math.min(viewportWidth - width - 12, anchorCenter - width / 2));
  const top = Math.max(
    12,
    Math.min(viewportHeight - estimatedHeight - 12, (anchorRect?.bottom ?? 0) + 10)
  );

  React.useEffect(() => {
    dialogRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const title = block?.presetName?.trim() || definition?.displayName || "Empty Node";
  const accent = definition?.color || "#4ade80";

  return createPortal(
    <div
      className={styles.backdrop}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onPointerCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onPointerMove={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <section
        ref={dialogRef}
        className={`${styles.dialog}${closing ? ` ${styles.closing}` : ""}`}
        style={{ "--dialog-accent": accent, left, top, width }}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} node actions`}
        tabIndex={-1}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <span className={styles.headerIcon}>
            {Icon ? <Icon /> : <ActionGlyph kind="add" />}
          </span>
          <span className={styles.title}>{title}</span>
        </header>

        <div className={styles.actions}>
          {block ? (
            <>
              <ActionButton
                actionId="toggle-bypass"
                highlighted={highlightedAction === "toggle-bypass"}
                kind="bypass"
                label={block.bypassed ? "Activate" : "Bypass"}
                onClick={onBypassToggle}
              />
              <ActionButton
                actionId="copy"
                highlighted={highlightedAction === "copy"}
                kind="copy"
                label="Copy"
                onClick={onCopy}
              />
              <ActionButton
                actionId="remove"
                destructive
                highlighted={highlightedAction === "remove"}
                kind="remove"
                label="Remove"
                onClick={onRemove}
              />
            </>
          ) : (
            <>
              <ActionButton
                actionId="paste"
                disabled={!hasCopiedBlock}
                highlighted={highlightedAction === "paste"}
                kind="paste"
                label="Paste"
                onClick={onPaste}
              />
              <ActionButton
                actionId="add"
                highlighted={highlightedAction === "add"}
                kind="add"
                label="Add"
                onClick={onAdd}
              />
            </>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}
