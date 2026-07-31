import stageBackground from "../assets/stageBG.png";
import { FxModuleIcon } from "./modes/perform/fxModules/FxModuleIcon";
import { FX_MODULE_DEFINITIONS } from "./modes/perform/fxModules/fxModuleDefinitions";
import { NamGatewayRack } from "./fxModules/NamGatewayRack";
import { StagePresetNavigator } from "./fxModules/StagePresetNavigator";
import styles from "./PresetView.module.css";

const presetFxModules = ["SAT", "SHAPE", "TXR", "ATMOS"].map(
  (type) => FX_MODULE_DEFINITIONS[type]
);

export function PresetView() {
  return (
    <main className="h-full w-full p-3 min-h-0">
      <section
        className="relative flex h-full min-h-0 flex-col gap-3 overflow-hidden rounded-xl border border-white/10 bg-cover bg-bottom bg-no-repeat p-3 shadow-[inset_0_0_45px_rgba(0,0,0,0.2),0_8px_20px_rgba(0,0,0,0.18)]"
        style={{ backgroundImage: `url(${stageBackground})` }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-black/20"
          aria-hidden="true"
        />

        <header className="relative z-10 flex min-h-[64px] shrink-0 items-center rounded-xl border border-white/10 bg-black/30 px-5 py-3 backdrop-blur-sm">
          <div>
            <h1 className="text-[18px] font-semibold tracking-wide text-white">
              RFX - Stage
            </h1>
            <p className="text-[12px] text-white/50">
              Curated performance-ready rigs.
            </p>
          </div>
        </header>

        <div className="relative z-10 shrink-0">
          <StagePresetNavigator />
        </div>

        <div className="relative z-10 shrink-0">
          <NamGatewayRack />
        </div>

        <div className="relative z-10 grid min-h-0 flex-1 grid-cols-4 gap-3">
          {presetFxModules.map((definition) => (
            <div
              key={definition.type}
              className="flex min-w-0 items-center gap-4 rounded-xl border border-white/20 bg-gradient-to-br from-[#24282b]/95 to-[#0c0e0f]/95 px-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_28px_rgba(0,0,0,0.55)] backdrop-blur-md"
            >
              <div
                className={styles.moduleIcon}
                style={{ "--module-color": definition.color }}
              >
                <FxModuleIcon className="h-7 w-7" type={definition.type} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[16px] font-semibold leading-5 tracking-wide text-white">
                  {definition.displayName}
                </h2>
                <p className="mt-1 line-clamp-2 text-[12px] leading-[18px] text-white/65">
                  {definition.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

