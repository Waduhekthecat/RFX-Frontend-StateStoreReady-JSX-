import type React from "react";
import type { FxModuleBlockState, FxModuleType } from "./fxModuleTypes";

export const FX_MODULE_COLORS: Record<FxModuleType, string> = {
  AMP: "#D89A45",
  CAB: "#A96F45",
  COMBO: "#C78545",
  SAT: "#E35D45",
  DYN: "#48B978",
  MOD: "#38B9CC",
  TXR: "#A96BAA",
  SHAPE: "#D8C548",
  ATMOS: "#557BE3",
  SPACE: "#8669D7",
  PITCH: "#D866A2",
  CUSTOMFX: "#FFFFFF",
};

export function resolveFxModuleState({
  disabled,
  dragging,
  warning,
  bypassed,
  selected,
}: {
  disabled?: boolean;
  dragging?: boolean;
  warning?: boolean;
  bypassed?: boolean;
  selected?: boolean;
}): FxModuleBlockState {
  if (disabled) return "disabled";
  if (dragging) return "dragging";
  if (warning) return "warning";
  if (bypassed) return "bypassed";
  if (selected) return "selected";
  return "default";
}

export type FxModuleCssProperties = React.CSSProperties & {
  "--fx-color": string;
  "--fx-input-level": string;
  "--fx-output-level": string;
};

export function getFxModuleCssProperties(
  color: string,
  inputLevel = 0,
  outputLevel = 0,
): FxModuleCssProperties {
  const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

  return {
    "--fx-color": color,
    "--fx-input-level": `${clamp(inputLevel) * 100}%`,
    "--fx-output-level": `${clamp(outputLevel) * 100}%`,
  };
}
