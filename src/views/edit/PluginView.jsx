// src/views/edit/PluginView.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Panel } from "../../app/components/ui/Panel";

export function PluginView() {
  const { trackId, fxId } = useParams();
  const nav = useNavigate();

  return (
    <div className="h-full w-full p-3 min-h-0">
      <Panel className="h-full min-h-0">
        <div className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[18px] font-semibold">PLUGIN</div>
            <div className="text-[12px] text-white/50">
              {trackId} • {fxId}
            </div>
          </div>

          <button
            type="button"
            onClick={() => nav("/edit")}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[12px] font-semibold"
          >
            BACK
          </button>
        </div>
      </Panel>
    </div>
  );
}