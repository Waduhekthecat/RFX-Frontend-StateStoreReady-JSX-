import { useNavigate, useParams } from "react-router-dom";
import { FxModuleIcon } from "../modes/perform/fxModules/FxModuleIcon";
import { FX_MODULE_DEFINITIONS } from "../modes/perform/fxModules/fxModuleDefinitions";
import styles from "./FxModuleView.module.css";

const moduleView = (type, title, description) => ({
  type,
  title: title ?? FX_MODULE_DEFINITIONS[type].displayName,
  description: description ?? FX_MODULE_DEFINITIONS[type].description,
  color: FX_MODULE_DEFINITIONS[type].color,
});

const MODULE_VIEWS = Object.freeze({
  amplifier: moduleView(
    "AMP",
    "Amp",
    "Amplifier models, captures, gain structure, and tone."
  ),
  cabinet: moduleView(
    "CAB",
    "Cab",
    "Speaker cabinets, impulse responses, microphones, and resonance."
  ),
  combo: moduleView(
    "COMBO",
    "Combo",
    "Matched amplifier and cabinet captures in a single module."
  ),
  saturation: moduleView(
    "SAT",
    undefined,
    "Overdrive, distortion, fuzz, and harmonic character."
  ),
  dynamics: moduleView(
    "DYN",
    undefined,
    "Control level, compression, peaks, and dynamic range."
  ),
  modulation: moduleView(
    "MOD",
    undefined,
    "Chorus, flanger, phaser, tremolo, and rhythmic movement."
  ),
  texture: moduleView(
    "TXR",
    undefined,
    "Lo-fi processing, degradation, noise, and character."
  ),
  shape: moduleView(
    "SHAPE",
    undefined,
    "Equalization, transient shaping, resonance, and presence."
  ),
  atmosphere: moduleView(
    "ATMOS",
    undefined,
    "Delay and reverb for ambience, depth, and reflections."
  ),
  space: moduleView(
    "SPACE",
    undefined,
    "Stereo width, placement, and spatial image control."
  ),
  pitch: moduleView(
    "PITCH",
    undefined,
    "Drop tuning, pitch shifting, and harmonization."
  ),
  "custom-fx": moduleView("CUSTOMFX", "Custom FX"),
});

function ViewIcon({ definition }) {
  return <FxModuleIcon className="h-9 w-9" type={definition.type} />;
}

export function FxModuleView() {
  const navigate = useNavigate();
  const { moduleId = "" } = useParams();
  const definition = MODULE_VIEWS[moduleId];

  if (!definition) {
    return (
      <main className="h-full w-full p-3">
        <section className="flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/[0.035]">
          <h1 className="text-xl font-semibold text-white">FX module not found</h1>
          <button
            type="button"
            onClick={() => navigate("/fx-modules")}
            className="rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            Back to FX Modules
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      className={styles.root}
      style={{ "--module-color": definition.color }}
    >
      <section className={styles.view}>
        <header className={styles.header}>
          <button
            type="button"
            onClick={() => navigate("/")}
            className={styles.backButton}
            aria-label="Back to Perform View"
            title="Back to Perform View"
          >
            <span aria-hidden="true">◀</span>
          </button>

          <div className={styles.iconWell}>
            <ViewIcon definition={definition} />
          </div>

          <div className="min-w-0">
            <div className={styles.kicker}>FX MODULE</div>
            <h1 className={styles.title}>{definition.title}</h1>
            <p className={styles.subtitle}>{definition.description}</p>
          </div>
        </header>

        <div className={styles.contentArea}>
          <div className={styles.contentLabel}>CONTENT</div>
          <div className={styles.emptyContent}>
            {definition.title} controls will appear here.
          </div>
        </div>
      </section>
    </main>
  );
}
