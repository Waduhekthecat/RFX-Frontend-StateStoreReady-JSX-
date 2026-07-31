import React from "react";
import { FxModuleBlock } from "./FxModuleBlock";
import type { FxModuleChainItem } from "./fxModuleTypes";
import styles from "./FxModuleSignalChain.module.css";

export interface FxModuleSignalChainProps {
  modules: FxModuleChainItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onBypassToggle?: (id: string) => void;
  onContextMenu?: (id: string) => void;
  className?: string;
}

const SLOTS_PER_ROW = 10;
const MAX_MODULES = 20;

export function FxModuleSignalChain({
  modules,
  selectedId,
  onSelect,
  onBypassToggle,
  onContextMenu,
  className,
}: FxModuleSignalChainProps) {
  const visibleModules = modules.slice(0, MAX_MODULES);
  const rowCount = visibleModules.length >= SLOTS_PER_ROW ? 2 : 1;

  return (
    <div className={`${styles.chain}${className ? ` ${className}` : ""}`} aria-label="FX module signal chain">
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <div className={styles.row} key={rowIndex}>
          <span className={styles.ioLabel}>IN</span>
          <div className={styles.rail} aria-hidden="true" />
          <div className={styles.slots}>
            {Array.from({ length: SLOTS_PER_ROW }, (__, slotIndex) => {
              const moduleIndex = rowIndex * SLOTS_PER_ROW + slotIndex;
              const module = visibleModules[moduleIndex];

              return (
                <div className={styles.slot} data-occupied={Boolean(module) || undefined} key={slotIndex}>
                  {module ? (
                    <FxModuleBlock
                      {...module}
                      selected={module.selected ?? module.id === selectedId}
                      onSelect={module.onSelect ?? onSelect}
                      onBypassToggle={module.onBypassToggle ?? onBypassToggle}
                      onContextMenu={module.onContextMenu ?? onContextMenu}
                    />
                  ) : (
                    <span className={styles.node} aria-label={`Empty FX slot ${moduleIndex + 1}`} />
                  )}
                </div>
              );
            })}
          </div>
          <span className={styles.arrow} aria-hidden="true" />
          <span className={styles.ioLabel}>OUT</span>
        </div>
      ))}
      {modules.length > MAX_MODULES ? (
        <p className={styles.capacityNote}>20 module maximum reached</p>
      ) : null}
    </div>
  );
}

export { SLOTS_PER_ROW as FX_MODULE_SLOTS_PER_ROW, MAX_MODULES as FX_MODULE_CHAIN_CAPACITY };

