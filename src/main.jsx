// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TransportProvider } from "./core/transport/TransportProvider";
import { BootGate } from "./views/boot/BootGate";

import { Shell } from "./app/Shell";
import { Nav } from "./app/components/nav/Nav";

import { PerformView } from "./views/perform/PerformView";
import { EditView } from "./views/edit/EditView";
import { PluginView } from "./views/edit/PluginView";

import { RouteView } from "./views/route/RouteView";
import { SystemView } from "./views/system/SystemView";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TransportProvider>
      <BootGate allowSkip autoStart>
        <BrowserRouter>
          <Routes>
            {/* Shell wraps everything so Nav stays visible */}
            <Route
              element={
                <Shell nav={<Nav />}>
                  {/* Shell expects "children" to render route content */}
                </Shell>
              }
            >
              <Route path="/" element={<PerformView />} />

              {/* Edit subtree */}
              <Route path="/edit" element={<EditView />}>
                {/* Sub-view (NOT in nav) */}
                <Route path="plugin/:trackId/:fxId" element={<PluginView />} />
              </Route>

              {/* ✅ swap placeholders to real views */}
              <Route path="/routing" element={<RouteView />} />
              <Route path="/system" element={<SystemView />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </BootGate>
    </TransportProvider>
  </React.StrictMode>
);