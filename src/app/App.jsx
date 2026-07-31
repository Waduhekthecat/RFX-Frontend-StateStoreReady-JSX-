import React from "react";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";

import { TransportProvider } from "../core/transport/TransportProvider";
import { BootGate } from "../views/boot/components/BootGate";
import { Shell } from "./shell/Shell";
import { Nav } from "./nav/_index";
import { PerformView } from "../views/modes/perform/PerformView";
import { EditView } from "../views/edit/EditView";
import { PluginView } from "../views/edit/plugin/PluginView";
import { RouteView } from "../views/route/RouteView";
import { SystemView } from "../views/system/SystemView";
import { CoreInspectorView } from "../views/dev/CoreInspectorView";
import { PluginManager } from "../views/system/pluginmanager/PluginManager";
import { ModeNavigationBridge } from "../core/modes/ModeNavigationBridge";
import { MidiRuntime } from "../core/midi/MidiRuntime";
import { LooperView } from "../views/modes/looper/LooperView"; 
import { AutomationView } from "../views/modes/automation/AutomationView";
import { TunerView } from "../views/modes/tuner/TunerView";
import { FxModulesView } from "../views/fxModules/FxModulesView";
import { FxModuleView } from "../views/fxModules/FxModuleView";
import { MacroEditView } from "../views/macro/MacroEditView";
import { FxModuleBlockDemo } from "../views/modes/perform/fxModules/FxModuleBlockDemo";
import { InstrumentView } from "../views/InstrumentView";
import { PresetView } from "../views/PresetView";

const Router =
    import.meta.env.MODE === "development" ? BrowserRouter : HashRouter;

export function App() {
    return (
        <React.StrictMode>
            <TransportProvider>
                <MidiRuntime />
                <BootGate allowSkip autoStart>
                    <Router>
                        <ModeNavigationBridge />
                        <Routes>
                            <Route element={<Shell nav={<Nav />} />}>
                                <Route path="/" element={<PerformView />} />
                                <Route path="/edit" element={<EditView />}>
                                    <Route
                                        path="plugin/:trackId/:fxId"
                                        element={<PluginView />}
                                    />
                                </Route>
                                <Route path="/looper" element={<LooperView />} />
                                <Route path="/automation" element={<AutomationView />} />
                                <Route path="/macro-edit/:busId/:knobNumber" element={<MacroEditView />} />
                                <Route path="/tuner" element={<TunerView />} />
                                <Route path="/fx-modules" element={<FxModulesView />} />
                                <Route path="/fx-modules/:moduleId" element={<FxModuleView />} />
                                <Route path="/presets" element={<PresetView />} />
                                <Route path="/instrument" element={<InstrumentView />} />
                                <Route path="/routing" element={<RouteView />} />
                                <Route path="/system" element={<SystemView />} />
                                <Route path="/system/plugins" element={<PluginManager />} />
                                <Route path="/dev/core" element={<CoreInspectorView />} />
                                {import.meta.env.DEV ? (
                                    <Route path="/dev/fx-modules" element={<FxModuleBlockDemo />} />
                                ) : null}
                            </Route>
                        </Routes>
                    </Router>
                </BootGate>
            </TransportProvider>
        </React.StrictMode>
    );
}
