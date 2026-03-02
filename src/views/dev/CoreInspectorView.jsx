import React from "react";
import { useRfxStore } from "../../core/rfx/Store";
import { styles } from "./_styles";
import { copyTextToClipboard } from "./_util";
import { StatCard, PendingOpCard, EventCard } from "./components/_index";

export function CoreInspectorView() {
  const snapshot = useRfxStore((s) => s.snapshot);
  const session = useRfxStore((s) => s.session);
  const selection = useRfxStore((s) => s.selection);
  const entities = useRfxStore((s) => s.entities);
  const perf = useRfxStore((s) => s.perf);
  const ops = useRfxStore((s) => s.ops);

  const clearEventLog = useRfxStore((s) => s.clearEventLog);
  const transport = useRfxStore((s) => s.transport);

  const pendingOrder = ops?.pendingOrder || [];
  const pendingById = ops?.pendingById || {};
  const pendingOps = pendingOrder.map((id) => pendingById[id]).filter(Boolean);

  const counts = {
    tracks: Object.keys(entities?.tracksByGuid || {}).length,
    fx: Object.keys(entities?.fxByGuid || {}).length,
    routes: Object.keys(entities?.routesById || {}).length,
    pending: pendingOps.length,
  };

  const eventsNewestFirst = (ops?.eventLog || []).slice().reverse();

  const [copied, setCopied] = React.useState(false);
  const [copyErr, setCopyErr] = React.useState("");

  const [metersEnabled, setMetersEnabled] = React.useState(() => {
    if (transport && typeof transport.getMetersEnabled === "function") {
      try {
        return !!transport.getMetersEnabled();
      } catch {
        return true;
      }
    }
    return true;
  });

  React.useEffect(() => {
    if (!transport) return;
    if (typeof transport.getMetersEnabled !== "function") return;
    try {
      setMetersEnabled(!!transport.getMetersEnabled());
    } catch {
      // ignore
    }
  }, [transport]);

  function onTogglePauseMeters(e) {
    const pause = !!e.target.checked; // checked = paused
    const nextEnabled = !pause;

    setMetersEnabled(nextEnabled);

    if (transport && typeof transport.setMetersEnabled === "function") {
      try {
        transport.setMetersEnabled(nextEnabled);
      } catch {
        // ignore
      }
    }
  }

  async function onCopyLog() {
    setCopyErr("");
    try {
      const payload = {
        exportedAtMs: Date.now(),
        snapshot,
        session,
        selection,
        perf: perf
          ? {
              activeBusId: perf.activeBusId,
              busModesById: perf.busModesById ?? perf.routingModesById ?? null,
              buses: perf.buses ?? null,
            }
          : null,
        events: ops?.eventLog || [],
      };

      await copyTextToClipboard(JSON.stringify(payload, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch (e) {
      setCopyErr(String(e?.message || e));
    }
  }

  const paused = !metersEnabled;
  const nowMs = Date.now();

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div style={styles.title}>RFXCore Inspector</div>
        <div style={styles.subtle}>events={ops?.eventLog?.length || 0} / 300</div>

        <div style={styles.spacer} />

        <label
          style={styles.pauseLabel}
          title="Freeze meter updates (helps debug pending ops)"
        >
          <input
            type="checkbox"
            checked={paused}
            onChange={onTogglePauseMeters}
            style={{ transform: "translateY(1px)" }}
          />
          Pause meters
        </label>

        <button onClick={onCopyLog} style={styles.btn} title="Copy event log JSON to clipboard">
          {copied ? "Copied!" : "Copy log"}
        </button>

        <button onClick={clearEventLog} style={styles.btn}>
          Clear log
        </button>
      </div>

      {paused ? (
        <StatCard
          title="Meters paused"
          style={{
            borderColor: "rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.04)",
            marginBottom: 12,
          }}
        >
          <div style={{ ...styles.monoLine, opacity: 0.8 }}>
            Only snapshots caused by intents/syscalls should change now.
          </div>
        </StatCard>
      ) : null}

      {copyErr ? (
        <StatCard
          title="Copy failed"
          style={{ borderColor: "rgba(255,80,80,0.35)", marginBottom: 12 }}
        >
          <div style={{ ...styles.monoLine, opacity: 0.85 }}>{copyErr}</div>
        </StatCard>
      ) : null}

      <div style={styles.grid2}>
        <StatCard title="Snapshot">
          <div style={styles.monoLine}>
            seq={snapshot?.seq} schema={snapshot?.schema} ts={snapshot?.ts}
          </div>
          <div style={styles.monoLine}>receivedAtMs={snapshot?.receivedAtMs}</div>
        </StatCard>

        <StatCard title="Session">
          <div style={styles.monoLine}>activeTrackGuid={String(session?.activeTrackGuid)}</div>
          <div style={styles.monoLine}>selectedTrackGuid={String(session?.selectedTrackGuid)}</div>
          <div style={styles.monoLine}>selectedFxGuid={String(session?.selectedFxGuid)}</div>
        </StatCard>

        <StatCard title="Selection / Perf">
          <div style={styles.monoLine}>selectedTrackIndex={selection?.selectedTrackIndex}</div>
          <div style={styles.monoLine}>perf.activeBusId={String(perf?.activeBusId)}</div>
        </StatCard>

        <StatCard title="Counts">
          <div style={styles.monoLine}>
            tracks={counts.tracks} fx={counts.fx} routes={counts.routes}
          </div>
          <div style={styles.monoLine}>pendingOps={counts.pending}</div>
        </StatCard>
      </div>

      <section style={{ ...styles.card, marginTop: 12 }}>
        <div style={{ ...styles.cardTitle, display: "flex", justifyContent: "space-between" }}>
          <span>Pending Ops</span>
          <span style={{ opacity: 0.6, fontSize: 12 }}>
            {pendingOps.length ? "newest at bottom (queue order)" : "none"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pendingOps.length === 0 ? (
            <div style={{ ...styles.monoLine, opacity: 0.6 }}>No pending ops.</div>
          ) : (
            pendingOps.map((op) => <PendingOpCard key={op.id} op={op} nowMs={nowMs} />)
          )}
        </div>

        <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>Raw JSON:</div>
        <pre style={styles.pre}>{JSON.stringify(pendingOps, null, 2)}</pre>
      </section>

      <section style={{ ...styles.card, marginTop: 12 }}>
        <div style={styles.cardTitle}>Last Error</div>
        <pre style={styles.pre}>{JSON.stringify(ops?.lastError, null, 2)}</pre>
      </section>

      <section style={{ ...styles.card, marginTop: 12 }}>
        <div style={{ ...styles.cardTitle, display: "flex", justifyContent: "space-between" }}>
          <span>Event Log (newest first)</span>
          <span style={{ opacity: 0.6, fontSize: 12 }}>
            tip: trigger select bus / set routing and watch the sequence
          </span>
        </div>

        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          {eventsNewestFirst.map((e, i) => (
            <EventCard key={i} e={e} />
          ))}
        </div>
      </section>
    </div>
  );
}