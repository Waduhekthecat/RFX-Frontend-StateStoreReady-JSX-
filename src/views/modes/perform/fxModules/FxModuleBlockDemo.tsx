import React from "react";
import { FX_MODULE_TYPES } from "./fxModuleDefinitions";
import { FxModuleBlock } from "./FxModuleBlock";
import { FxModuleSignalChain } from "./FxModuleSignalChain";
import type { FxModuleChainItem } from "./fxModuleTypes";
import styles from "./FxModuleBlockDemo.module.css";

const PRESET_NAMES = [
  "Brit Lead", "4×12 Green", "Matched Stack", "Hot Clip", "Studio Comp",
  "Liquid Chorus", "Tape Dust", "Air Sculpt", "Deep Hall", "Wide Focus", "Drop D",
  "Core Custom",
];

export function FxModuleBlockDemo() {
  const [selectedId, setSelectedId] = React.useState("demo-0");
  const [bypassed, setBypassed] = React.useState<Record<string, boolean>>({ "demo-2": true });

  const modules: FxModuleChainItem[] = FX_MODULE_TYPES.map((type, index) => ({
    id: `demo-${index}`,
    type,
    presetName: PRESET_NAMES[index],
    bypassed: bypassed[`demo-${index}`],
    inputLevel: 0.3 + (index % 5) * 0.12,
    outputLevel: 0.24 + (index % 4) * 0.15,
  }));

  modules.push(
    { id: "demo-12", type: "ATMOS", presetName: "Ghost Echo" },
    { id: "demo-13", type: "SPACE", presetName: "Rear Stage", warning: true },
  );

  const toggleBypass = (id: string) => {
    setBypassed((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>PERFORM VIEW / COMPONENT LAB</p>
          <h1>FX Modules</h1>
        </div>
        <p>Composite processors · plugin internals hidden</p>
      </header>

      <section>
        <h2>Signal chain · 14 of 20 slots</h2>
        <FxModuleSignalChain
          modules={modules}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onBypassToggle={toggleBypass}
        />
      </section>

      <section>
        <h2>Interaction states</h2>
        <div className={styles.stateGrid}>
          <StateExample label="Active" type="AMP" />
          <StateExample label="Selected" type="CAB" selected />
          <StateExample label="Bypassed" type="SAT" bypassed />
          <StateExample label="Disabled" type="DYN" disabled />
          <StateExample label="Dragging" type="MOD" dragging />
          <StateExample label="Warning" type="TXR" warning />
        </div>
      </section>
    </main>
  );
}

function StateExample({ label, ...props }: { label: string } & Omit<FxModuleChainItem, "id">) {
  return (
    <div className={styles.stateExample}>
      <FxModuleBlock id={`state-${label}`} presetName={label} {...props} />
      <span>{label}</span>
    </div>
  );
}
