import React from "react";
import { getFxModuleDefinition } from "./fxModuleDefinitions";
import { getFxModuleCssProperties, resolveFxModuleState } from "./fxModuleTheme";
import type { FxModuleBlockProps } from "./fxModuleTypes";
import styles from "./FxModuleBlock.module.css";

export function FxModuleBlock({
  id,
  type,
  presetName,
  selected = false,
  bypassed = false,
  disabled = false,
  dragging = false,
  fillContainer = false,
  warning = false,
  inputLevel = 0,
  outputLevel = 0,
  onSelect,
  onContextMenu,
}: FxModuleBlockProps) {
  const definition = getFxModuleDefinition(type);
  const Icon = definition.icon;
  const state = resolveFxModuleState({ disabled, dragging, warning, bypassed, selected });
  const moduleLabel = presetName?.trim() || definition.displayName;

  const select = () => {
    if (!disabled) onSelect?.(id);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select();
    }
  };

  const openContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onContextMenu || disabled) return;
    event.preventDefault();
    onContextMenu(id);
  };

  return (
    <div
      className={`${styles.block}${fillContainer ? ` ${styles.fillContainer}` : ""}`}
      style={getFxModuleCssProperties(definition.color, inputLevel, outputLevel)}
      data-state={state}
      data-selected={selected || undefined}
      data-bypassed={bypassed || undefined}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${definition.displayName}: ${moduleLabel}${bypassed ? ", bypassed" : ""}${warning ? ", warning" : ""}`}
      aria-pressed={selected}
      aria-disabled={disabled}
      title={`${definition.displayName} — ${definition.description}`}
      onClick={select}
      onKeyDown={onKeyDown}
      onContextMenu={openContextMenu}
    >
      <span className={styles.inputMeter} aria-hidden="true" />
      <span className={styles.outputMeter} aria-hidden="true" />

      <span className={styles.iconWell}>
        <Icon className={styles.icon} />
      </span>

      {warning ? (
        <span className={styles.warningBadge} aria-label="Module warning" title="Module warning">
          !
        </span>
      ) : null}
    </div>
  );
}
