import type React from "react";

export type FxModuleType =
  | "AMP"
  | "CAB"
  | "COMBO"
  | "SAT"
  | "DYN"
  | "MOD"
  | "TXR"
  | "SHAPE"
  | "ATMOS"
  | "SPACE"
  | "PITCH"
  | "CUSTOMFX";

export type FxModuleBlockState =
  | "default"
  | "selected"
  | "bypassed"
  | "disabled"
  | "dragging"
  | "warning";

export interface FxModuleDefinition {
  type: FxModuleType;
  displayName: string;
  shortLabel: string;
  description: string;
  color: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  recommendedOrder: number;
}

export interface FxModuleBlockProps {
  id: string;
  type: FxModuleType;
  presetName?: string;
  selected?: boolean;
  bypassed?: boolean;
  disabled?: boolean;
  dragging?: boolean;
  fillContainer?: boolean;
  warning?: boolean;
  inputLevel?: number;
  outputLevel?: number;
  onSelect?: (id: string) => void;
  onBypassToggle?: (id: string) => void;
  onContextMenu?: (id: string) => void;
}

export interface FxModuleChainItem extends FxModuleBlockProps {
  id: string;
}
