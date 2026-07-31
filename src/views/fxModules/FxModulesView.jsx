import { useRfxStore } from "../../core/rfx/Store";
import { useNavigate } from "react-router-dom";
import { FxModuleIcon } from "../modes/perform/fxModules/FxModuleIcon";
import { FX_MODULE_DEFINITIONS } from "../modes/perform/fxModules/fxModuleDefinitions";
import styles from "./FxModulesView.module.css";

const moduleCategory = (id, type, description, label) => ({
  id,
  type,
  label: label ?? FX_MODULE_DEFINITIONS[type].displayName,
  description,
  color: FX_MODULE_DEFINITIONS[type].color,
});

const fxCategories = [
  moduleCategory(
    "amplifier",
    "AMP",
    "Amplifier models, captures, gain structure, and tone.",
    "Amp"
  ),
  moduleCategory(
    "cabinet",
    "CAB",
    "Speaker cabinets, impulse responses, microphones, and resonance.",
    "Cab"
  ),
  moduleCategory(
    "combo",
    "COMBO",
    "Matched amplifier and cabinet captures in a single module."
  ),
  moduleCategory(
    "saturation",
    "SAT",
    "Overdrive, distortion, fuzz, and harmonic character."
  ),
  moduleCategory(
    "dynamics",
    "DYN",
    "Control level, compression, peaks, and dynamic range."
  ),
  moduleCategory(
    "modulation",
    "MOD",
    "Chorus, flanger, phaser, tremolo, and rhythmic movement."
  ),
  moduleCategory(
    "texture",
    "TXR",
    "Lo-fi processing, degradation, noise, and character."
  ),
  moduleCategory(
    "shape",
    "SHAPE",
    "Equalization, transient shaping, resonance, and presence."
  ),
  moduleCategory(
    "atmosphere",
    "ATMOS",
    "Delay and reverb for ambience, depth, and reflections."
  ),
  moduleCategory(
    "space",
    "SPACE",
    "Stereo width, placement, and spatial image control."
  ),
  moduleCategory(
    "pitch",
    "PITCH",
    "Drop tuning, pitch shifting, and harmonization."
  ),
  moduleCategory(
    "custom-fx",
    "CUSTOMFX",
    "Create your own FX module with RFXCore or 3rd party plugins",
    "Custom FX"
  ),
];

function ModuleCategoryIcon({ category }) {
  return <FxModuleIcon className="h-7 w-7" type={category.type} />;
}

function CategoryCard({ category, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={category.label}
      className={[
        "flex h-full min-h-0 items-center gap-4 rounded-xl border bg-white/[0.045] px-4 text-left shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition duration-150",
        styles.moduleCard,
      ].join(" ")}
      style={{ "--module-color": category.color }}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-black/25 transition ${styles.moduleIconWell}`}
      >
        <ModuleCategoryIcon category={category} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-semibold leading-5 tracking-wide text-white/90">
          {category.label}
        </span>
        <span className="mt-1 line-clamp-2 text-[12px] leading-[18px] text-white/45">
          {category.description}
        </span>
      </span>

      <span className={styles.moduleArrow} aria-hidden="true">›</span>

    </button>
  );
}

export function FxModulesView() {
  const navigate = useNavigate();
  const placeFxModuleAtSelectedNode = useRfxStore(
    (state) => state.placeFxModuleAtSelectedNode
  );

  const selectCategory = (category) => {
    placeFxModuleAtSelectedNode({ type: category.type });
    navigate(`/fx-modules/${category.id}`);
  };

  return (
    <div className="h-full w-full p-3 min-h-0">
      <div className="h-full min-h-0 flex flex-col gap-3">
        <div className="grid min-h-0 flex-1 auto-rows-[104px] grid-cols-1 content-start gap-3 overflow-y-auto md:grid-cols-2 xl:auto-rows-auto xl:grid-cols-4 xl:grid-rows-3">
          {fxCategories.map((category) => (
            <CategoryCard
              category={category}
              key={category.id}
              onSelect={() => selectCategory(category)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
