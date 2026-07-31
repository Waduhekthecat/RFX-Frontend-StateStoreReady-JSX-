import { cn } from "../lib/cn";
import brushedMetalUrl from "../../assets/designs/BrushedMetal.png";

const DEFAULT_HEIGHT = 180;

const FACE_STYLE = {
  backgroundColor: "#121415",
  backgroundImage: [
    "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 14%, rgba(0,0,0,0.08) 58%, rgba(0,0,0,0.35) 100%)",
    "linear-gradient(90deg, rgba(255,255,255,0.02) 0%, transparent 12%, transparent 88%, rgba(0,0,0,0.16) 100%)",
    `url(${brushedMetalUrl})`,
  ].join(", "),
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%, 100% 100%, cover",
};

const MOUNT_POSITIONS = [
  "left-4 top-3",
  "right-4 top-3",
  "bottom-3 left-4",
  "bottom-3 right-4",
];

/**
 * Blank, full-width rack faceplate for composing controls and displays.
 * Pass a number (pixels) or any CSS height string to `height`.
 */
export function Module({
  height = DEFAULT_HEIGHT,
  className = "",
  contentClassName = "",
  children,
  style = {},
  ...rest
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-black/90",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.20),inset_0_-2px_5px_rgba(0,0,0,0.75),0_10px_22px_rgba(0,0,0,0.48)]",
        className
      )}
      style={{
        ...FACE_STYLE,
        ...style,
        width: "100%",
        height,
      }}
      {...rest}
    >
      <div
        className="pointer-events-none absolute inset-[2px] rounded-[10px] border border-white/[0.045]"
        aria-hidden="true"
      />

      {MOUNT_POSITIONS.map((position) => (
        <div
          key={position}
          className={cn(
            "pointer-events-none absolute z-20 h-5 w-8 rounded-full border border-black",
            "bg-gradient-to-b from-black via-[#090b0c] to-[#202325]",
            "shadow-[inset_0_1px_3px_rgba(0,0,0,0.95),0_1px_0_rgba(255,255,255,0.13)]",
            position
          )}
          aria-hidden="true"
        >
          <div className="absolute inset-[2px] rounded-full border border-white/[0.06]" />
        </div>
      ))}

      <div className={cn("relative z-10 h-full w-full", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
