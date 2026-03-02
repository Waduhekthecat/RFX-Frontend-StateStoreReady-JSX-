import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TransportProvider } from "../core/transport/TransportProvider";
import { BootGate } from "../views/boot/BootGate";
import { Shell } from "./shell/Shell";
import { Nav } from "./nav/_index";
import { PerformView } from "../views/perform/PerformView";
import { EditView } from "../views/edit/EditView";
import { PluginView } from "../views/edit/PluginView";
import { RouteView } from "../views/route/RouteView";
import { SystemView } from "../views/system/SystemView";
import { CoreInspectorView } from "../views/dev/CoreInspectorView";

export function App() {
    return (
        <React.StrictMode>
            <TransportProvider>
                <BootGate allowSkip autoStart>
                    <BrowserRouter>
                        <Routes>
                            <Route element={<Shell nav={<Nav />} />}>
                                <Route path="/" element={<PerformView />} />
                                <Route path="/edit" element={<EditView />}>
                                    <Route path="plugin/:trackId/:fxId" element={<PluginView />} />
                                </Route>
                                <Route path="/routing" element={<RouteView />} />
                                <Route path="/system" element={<SystemView />} />
                                <Route path="/dev/core" element={<CoreInspectorView />} />
                            </Route>
                        </Routes>
                    </BrowserRouter>
                </BootGate>
            </TransportProvider>
        </React.StrictMode>
    );
}