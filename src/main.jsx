// src/main.jsx (or src/index.jsx)
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TransportProvider } from "./core/transport/TransportProvider";
import { Shell } from "./app/Shell";
import { Nav } from "./app/components/nav/Nav";

import { PerformView } from "./views/perform/PerformView";
import { EditView } from "./views/edit/EditView";
import { PluginView } from "./views/edit/PluginView";

function Placeholder({ title }) {
  return (
    <div className="h-full w-full flex items-center justify-center text-white/40 text-xl">
      {title} View
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TransportProvider>
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

            <Route path="/routing" element={<Placeholder title="Routing" />} />
            <Route path="/system" element={<Placeholder title="System" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TransportProvider>
  </React.StrictMode>
);