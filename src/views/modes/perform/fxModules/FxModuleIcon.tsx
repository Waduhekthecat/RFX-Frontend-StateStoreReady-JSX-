import React from "react";
import rfxLogo from "../../../../assets/rfxLogo.png";
import type { FxModuleType } from "./fxModuleTypes";

type IconProps = React.SVGProps<SVGSVGElement>;

const sharedProps: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function AmpIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M8 6.5V5.4c0-.8.6-1.4 1.4-1.4h5.2c.8 0 1.4.6 1.4 1.4v1.1" />
      <rect x="3" y="6.5" width="18" height="12" rx="1.6" />
      <path d="M3 11h18M5.2 18.5v1.8M18.8 18.5v1.8" />
      <circle cx="6" cy="14.7" r=".75" />
      <circle cx="9" cy="14.7" r=".75" />
      <circle cx="12" cy="14.7" r=".75" />
      <circle cx="15" cy="14.7" r=".75" />
      <circle cx="18" cy="14.7" r=".75" />
    </svg>
  );
}

export function CabIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="6.25" opacity=".62" />
      <circle cx="12" cy="12" r="2.35" />
    </svg>
  );
}

export function ComboIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="1.8" />
      <path d="M3 8.2h18" />
      <circle cx="6" cy="5.6" r=".65" />
      <circle cx="9" cy="5.6" r=".65" />
      <circle cx="12" cy="5.6" r=".65" />
      <circle cx="15" cy="5.6" r=".65" />
      <circle cx="18" cy="5.6" r=".65" />
      <path d="m5 10 14 9M9 9l10 6.5M5 14l8.2 5M19 10 5 19M15 9 5 15.5M19 14l-8.2 5" opacity=".62" />
    </svg>
  );
}

export function SatIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="m2.5 13 3-1.1 1.8-4.2 2.2 8.4 2.1-10.8 2.2 12.8 2-7.4 1.8 3.2 3.9-1.4" />
      <path d="m7 3.5.4 2.1 1.4-1M15.2 3l-.8 2.2 1.7-.5M4 18.7l2-1-.2 1.8M17.2 18.5l.5-2 1.3 1.3" />
      <path d="m3.5 7.2 1.8.3-.8-1.5M20 7l-1.8.4.9-1.5" />
    </svg>
  );
}

export function DynIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M2.5 12h3l1.8-4 2.4 8.2 2.4-12.4 2.2 16.4 2.3-10 1.8 4.1 2.1-2.3h2" />
    </svg>
  );
}

export function ModIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M2.5 13c2.4-5.7 5-5.7 7.5 0s5.1 5.7 7.6 0 3.5-4.6 4.4-2.2" />
      <path d="M2.5 9.2c2.5 0 3.7 5.7 6.2 5.7s3.8-7 6.4-7 3.5 4.7 6.9 4.7" strokeDasharray="2.3 2.3" opacity=".7" />
    </svg>
  );
}

export function TxrIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M2.5 7.5c2.2-3 4.3-3 6.5 0s4.3 3 6.5 0 4.2-3 6 0M2.5 12c2.2-3 4.3-3 6.5 0s4.3 3 6.5 0 4.2-3 6 0M2.5 16.5c2.2-3 4.3-3 6.5 0s4.3 3 6.5 0 4.2-3 6 0" />
      <circle cx="5" cy="3.4" r=".6" fill="currentColor" stroke="none" />
      <circle cx="10" cy="4.2" r=".45" fill="currentColor" stroke="none" />
      <circle cx="16.8" cy="3.5" r=".55" fill="currentColor" stroke="none" />
      <circle cx="7" cy="20.5" r=".5" fill="currentColor" stroke="none" />
      <circle cx="14" cy="20" r=".65" fill="currentColor" stroke="none" />
      <circle cx="20" cy="19.5" r=".4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ShapeIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M3 18V13M7.5 19V8M12 19V4M16.5 19V8M21 18v-5" opacity=".55" />
      <path d="M2.5 16.5c3.8 0 5.2-1.5 7-5.2C10.4 9.5 11 8 12 8s1.6 1.5 2.5 3.3c1.8 3.7 3.2 5.2 7 5.2" />
    </svg>
  );
}

export function AtmosIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <circle cx="12" cy="12" r="2.1" />
      <path d="M7.8 8.3a5.6 5.6 0 0 0 0 7.4M16.2 8.3a5.6 5.6 0 0 1 0 7.4" />
      <path d="M5.1 5.6a9.3 9.3 0 0 0 0 12.8M18.9 5.6a9.3 9.3 0 0 1 0 12.8" opacity=".72" />
      <path d="M2.8 8.5a11.4 11.4 0 0 0 0 7M21.2 8.5a11.4 11.4 0 0 1 0 7" opacity=".45" />
    </svg>
  );
}

export function SpaceIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="12" r="5.3" opacity=".78" />
      <circle cx="12" cy="12" r="8.6" opacity=".55" />
    </svg>
  );
}

export function PitchIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M4 8v9M8 5v14M12 3v18M16 5v14M20 8v9" />
      <circle cx="4" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="20" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="5.5" r=".45" fill="currentColor" stroke="none" />
      <circle cx="8" cy="3" r=".45" fill="currentColor" stroke="none" />
      <circle cx="16" cy="3.5" r=".45" fill="currentColor" stroke="none" />
      <circle cx="20" cy="5.5" r=".45" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CustomFxIcon(props: IconProps) {
  const maskId = React.useId().replace(/:/g, "");

  return (
    <svg {...sharedProps} {...props}>
      <mask
        id={maskId}
        maskUnits="userSpaceOnUse"
        x="1"
        y="6"
        width="22"
        height="12"
        style={{ maskType: "alpha" }}
      >
        <image
          href={rfxLogo}
          x="1"
          y="6"
          width="22"
          height="12"
          preserveAspectRatio="xMidYMid meet"
        />
      </mask>
      <rect
        x="1"
        y="6"
        width="22"
        height="12"
        fill="currentColor"
        stroke="none"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

export const FX_MODULE_ICONS: Record<FxModuleType, React.ComponentType<IconProps>> = {
  AMP: AmpIcon,
  CAB: CabIcon,
  COMBO: ComboIcon,
  SAT: SatIcon,
  DYN: DynIcon,
  MOD: ModIcon,
  TXR: TxrIcon,
  SHAPE: ShapeIcon,
  ATMOS: AtmosIcon,
  SPACE: SpaceIcon,
  PITCH: PitchIcon,
  CUSTOMFX: CustomFxIcon,
};

export interface FxModuleIconProps extends IconProps {
  type: FxModuleType;
}

export function FxModuleIcon({ type, ...props }: FxModuleIconProps) {
  const Icon = FX_MODULE_ICONS[type];
  return <Icon {...props} />;
}
