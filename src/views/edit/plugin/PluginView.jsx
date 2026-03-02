import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Panel } from "../../../components/ui/Panel";
import { styles } from "./_styles";

export function PluginView() {
  const { trackId, fxId } = useParams();
  const nav = useNavigate();

  return (
    <div className={styles.Root}>
      <Panel className={styles.Panel}>
        <div className={styles.Header}>
          <div>
            <div className={styles.Title}>PLUGIN</div>
            <div className={styles.Subtitle}>
              {trackId} • {fxId}
            </div>
          </div>

          <button
            type="button"
            onClick={() => nav("/edit")}
            className={styles.BackButton}
          >
            BACK
          </button>
        </div>
      </Panel>
    </div>
  );
}