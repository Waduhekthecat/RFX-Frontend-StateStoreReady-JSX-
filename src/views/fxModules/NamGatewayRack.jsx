import { Knob } from "../../components/controls/knobs/Knob";
import { Module } from "../../components/ui/Module";
import { VerticalMeter } from "../../components/ui/meters/VerticalMeter";

function PowerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      aria-hidden="true"
      className="h-8 w-8"
    >
      <path d="M12 2.8v8" />
      <path d="M7.2 5.8a8 8 0 1 0 9.6 0" />
    </svg>
  );
}

function StaticToggle({ label, compact = false }) {
  return (
    <div
      className={
        compact
          ? "flex items-center justify-center gap-3"
          : "flex flex-col items-center gap-3"
      }
    >
      <div className="text-[14px] font-semibold uppercase tracking-[0.12em] text-white/90">
        {label}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`${label} toggle`}
          aria-pressed="true"
          className={[
            "flex cursor-default items-center justify-center rounded-xl border border-black bg-[#181a1b] text-lime-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.13),inset_0_-5px_9px_rgba(0,0,0,0.7),0_4px_8px_rgba(0,0,0,0.55)]",
            compact ? "h-12 w-12" : "h-16 w-16",
          ].join(" ")}
        >
          <PowerIcon />
        </button>
        <span className="text-[15px] font-bold uppercase tracking-[0.12em] text-lime-400">
          On
        </span>
      </div>
    </div>
  );
}

function StaticKnob({ title, value, valueText, scale = 1 }) {
  const width = 106 * scale;
  const height = 168 * scale;

  return (
    <div className="flex min-w-0 flex-col items-center">
      <div className="mb-1 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/90">
        {title}
      </div>
      <div
        style={{
          width,
          height,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 106,
            height: 168,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          <Knob
            id={`gateway-${title.toLowerCase()}`}
            label={valueText}
            value={value}
            mapped={false}
            interactive={false}
          />
        </div>
      </div>
    </div>
  );
}

function StaticMeter({ value }) {
  return (
    <div className="h-28 w-4 shrink-0">
      <VerticalMeter value={value} enabled width={16} rounded={3} />
    </div>
  );
}

function LevelSection({ side }) {
  const isInput = side === "input";

  return (
    <div className="flex min-w-0 items-end justify-center gap-3">
      {isInput ? <StaticMeter value={0.68} /> : null}
      <StaticKnob
        title={isInput ? "Input" : "Output"}
        value={0.5}
        valueText="0.0 dB"
      />
      {!isInput ? <StaticMeter value={0.68} /> : null}
    </div>
  );
}

function Divider() {
  return <div className="h-[190px] w-px self-center bg-white/30" aria-hidden="true" />;
}

export function NamGatewayRack() {
  return (
    <Module
      height={248}
      contentClassName="grid grid-cols-[1.05fr_1px_0.8fr_1fr_1px_2.5fr_1px_1.05fr] items-center gap-4 px-12 py-5"
      aria-label="NAM Gateway controls"
    >
      <LevelSection side="input" />
      <Divider />

      <StaticToggle label="Gate" />

      <StaticKnob
        title="Threshold"
        value={0.31}
        valueText="-57.9 dB"
      />

      <Divider />

      <div className="flex min-w-0 flex-col items-center justify-center gap-1">
        <StaticToggle label="Tone Stack" compact />
        <div className="mt-1 grid w-full grid-cols-3 items-start justify-items-center gap-3 border-t border-white/35 pt-2">
          <StaticKnob title="Bass" value={0.5} valueText="5.0" scale={0.62} />
          <StaticKnob title="Middle" value={0.5} valueText="5.0" scale={0.62} />
          <StaticKnob title="Treble" value={0.5} valueText="5.0" scale={0.62} />
        </div>
      </div>

      <Divider />
      <LevelSection side="output" />
    </Module>
  );
}

