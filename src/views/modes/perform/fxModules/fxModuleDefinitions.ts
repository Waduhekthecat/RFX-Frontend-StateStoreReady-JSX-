import { FX_MODULE_ICONS } from "./FxModuleIcon";
import { FX_MODULE_COLORS } from "./fxModuleTheme";
import type { FxModuleDefinition, FxModuleType } from "./fxModuleTypes";

export const FX_MODULE_DEFINITIONS: Record<FxModuleType, FxModuleDefinition> = {
  AMP: { type: "AMP", displayName: "Amplifier", shortLabel: "AMP", description: "Amplifiers", color: FX_MODULE_COLORS.AMP, icon: FX_MODULE_ICONS.AMP, recommendedOrder: 40 },
  CAB: { type: "CAB", displayName: "Cabinet", shortLabel: "CAB", description: "Speaker cabinet IRs", color: FX_MODULE_COLORS.CAB, icon: FX_MODULE_ICONS.CAB, recommendedOrder: 50 },
  COMBO: { type: "COMBO", displayName: "Combo", shortLabel: "COMBO", description: "Matched amplifier and cabinet captures", color: FX_MODULE_COLORS.COMBO, icon: FX_MODULE_ICONS.COMBO, recommendedOrder: 45 },
  SAT: { type: "SAT", displayName: "Saturation", shortLabel: "SAT", description: "Drive, distortion, and fuzz", color: FX_MODULE_COLORS.SAT, icon: FX_MODULE_ICONS.SAT, recommendedOrder: 20 },
  DYN: { type: "DYN", displayName: "Dynamics", shortLabel: "DYN", description: "Volume, compressor, and limiter", color: FX_MODULE_COLORS.DYN, icon: FX_MODULE_ICONS.DYN, recommendedOrder: 10 },
  MOD: { type: "MOD", displayName: "Modulation", shortLabel: "MOD", description: "Chorus, flanger, phaser, and tremolo", color: FX_MODULE_COLORS.MOD, icon: FX_MODULE_ICONS.MOD, recommendedOrder: 60 },
  TXR: { type: "TXR", displayName: "Texture", shortLabel: "TXR", description: "Lo-fi, noise, and texture", color: FX_MODULE_COLORS.TXR, icon: FX_MODULE_ICONS.TXR, recommendedOrder: 30 },
  SHAPE: { type: "SHAPE", displayName: "Shape", shortLabel: "SHAPE", description: "Equalizer, transients, resonance, and presence", color: FX_MODULE_COLORS.SHAPE, icon: FX_MODULE_ICONS.SHAPE, recommendedOrder: 35 },
  ATMOS: { type: "ATMOS", displayName: "Atmosphere", shortLabel: "ATMOS", description: "Delay, reverb, depth, and reflections", color: FX_MODULE_COLORS.ATMOS, icon: FX_MODULE_ICONS.ATMOS, recommendedOrder: 70 },
  SPACE: { type: "SPACE", displayName: "Space", shortLabel: "SPACE", description: "Stereo width, placement, and spatial image", color: FX_MODULE_COLORS.SPACE, icon: FX_MODULE_ICONS.SPACE, recommendedOrder: 80 },
  PITCH: { type: "PITCH", displayName: "Pitch", shortLabel: "PITCH", description: "Drop tuning, pitch shifting, and harmonization", color: FX_MODULE_COLORS.PITCH, icon: FX_MODULE_ICONS.PITCH, recommendedOrder: 25 },
  CUSTOMFX: { type: "CUSTOMFX", displayName: "Custom FX", shortLabel: "CUSTOM", description: "Create your own FX module with RFXCore or 3rd party plugins", color: FX_MODULE_COLORS.CUSTOMFX, icon: FX_MODULE_ICONS.CUSTOMFX, recommendedOrder: 90 },
};

export const FX_MODULE_TYPES = Object.keys(FX_MODULE_DEFINITIONS) as FxModuleType[];

export const FX_MODULE_ROUTE_BY_TYPE: Record<FxModuleType, string> = {
  AMP: "amplifier",
  CAB: "cabinet",
  COMBO: "combo",
  SAT: "saturation",
  DYN: "dynamics",
  MOD: "modulation",
  TXR: "texture",
  SHAPE: "shape",
  ATMOS: "atmosphere",
  SPACE: "space",
  PITCH: "pitch",
  CUSTOMFX: "custom-fx",
};

export function getFxModuleDefinition(type: FxModuleType): FxModuleDefinition {
  return FX_MODULE_DEFINITIONS[type];
}
