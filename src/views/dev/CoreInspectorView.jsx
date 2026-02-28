// src/views/dev/CoreInspectorView.jsx
import React from "react";
import { useRfxStore } from "../../core/rfx/Store";

function fmtTime(ms) {
  const d = new Date(ms);
  return (
    d.toLocaleTimeString() +
    "." +
    String(d.getMilliseconds()).padStart(3, "0")
  );
}

function fmtAge(ms) {
  if (!ms) return "";
  const s = Math.max(0, Math.round(ms / 100) / 10); // 0.1s precision
  return `${s}s`;
}

function toneColor(status) {
  if (status === "acked") return "rgba(120,255,160,0.9)";
  if (status === "failed" || status === "timeout")
    return "rgba(255,120,120,0.95)";
  if (status === "superseded") return "rgba(255,210,120,0.95)";
  return "rgba(200,200,255,0.9)";
}

function boolBadge(ok) {
  if (ok === true) return "✅";
  if (ok === false) return "❌";
  return "…";
}

function fmtMeta(meta) {
  if (!meta) return "";
  const parts = [];
  if (meta.seq != null) parts.push(`seq=${meta.seq}`);
  if (meta.opId) parts.push(`opId=${meta.opId}`);
  return parts.length ? parts.join(" • ") : "";
}

async function copyTextToClipboard(text) {
  // Prefer modern clipboard API
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback for older contexts
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  ta.style.top = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

export function CoreInspectorView() {
  const snapshot = useRfxStore((s) => s.snapshot);
  const session = useRfxStore((s) => s.session);
  const selection = useRfxStore((s) => s.selection);
  const entities = useRfxStore((s) => s.entities);
  const perf = useRfxStore((s) => s.perf);
  const ops = useRfxStore((s) => s.ops);

  const clearEventLog = useRfxStore((s) => s.clearEventLog);

  const pendingOrder = ops?.pendingOrder || [];
  const pendingById = ops?.pendingById || {};
  const pendingOps = pendingOrder.map((id) => pendingById[id]).filter(Boolean);

  const counts = {
    tracks: Object.keys(entities?.tracksByGuid || {}).length,
    fx: Object.keys(entities?.fxByGuid || {}).length,
    routes: Object.keys(entities?.routesById || {}).length,
    pending: pendingOps.length,
  };

  // newest first for display
  const eventsNewestFirst = (ops?.eventLog || []).slice().reverse();

  const [copied, setCopied] = React.useState(false);
  const [copyErr, setCopyErr] = React.useState("");

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
        events: ops?.eventLog || [], // keep chronological order in export (oldest->newest)
      };

      await copyTextToClipboard(JSON.stringify(payload, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch (e) {
      setCopyErr(String(e?.message || e));
    }
  }

  return (
    <div style={{ padding: 16, height: "100%", overflow: "auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>RFXCore Inspector</div>
        <div style={{ opacity: 0.6, fontSize: 12 }}>
          events={ops?.eventLog?.length || 0} / 300
        </div>
        <div style={{ flex: 1 }} />

        <button
          onClick={onCopyLog}
          style={btnStyle}
          title="Copy event log JSON to clipboard"
        >
          {copied ? "Copied!" : "Copy log"}
        </button>

        <button onClick={clearEventLog} style={btnStyle}>
          Clear log
        </button>
      </div>

      {copyErr ? (
        <div
          style={{
            ...cardStyle,
            borderColor: "rgba(255,80,80,0.35)",
            marginBottom: 12,
          }}
        >
          <div style={{ ...cardTitle, marginBottom: 4 }}>Copy failed</div>
          <div style={{ ...monoLine, opacity: 0.85 }}>{copyErr}</div>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <section style={cardStyle}>
          <div style={cardTitle}>Snapshot</div>
          <div style={monoLine}>
            seq={snapshot?.seq} schema={snapshot?.schema} ts={snapshot?.ts}
          </div>
          <div style={monoLine}>receivedAtMs={snapshot?.receivedAtMs}</div>
        </section>

        <section style={cardStyle}>
          <div style={cardTitle}>Session</div>
          <div style={monoLine}>activeTrackGuid={String(session?.activeTrackGuid)}</div>
          <div style={monoLine}>
            selectedTrackGuid={String(session?.selectedTrackGuid)}
          </div>
          <div style={monoLine}>selectedFxGuid={String(session?.selectedFxGuid)}</div>
        </section>

        <section style={cardStyle}>
          <div style={cardTitle}>Selection / Perf</div>
          <div style={monoLine}>selectedTrackIndex={selection?.selectedTrackIndex}</div>
          <div style={monoLine}>perf.activeBusId={String(perf?.activeBusId)}</div>
        </section>

        <section style={cardStyle}>
          <div style={cardTitle}>Counts</div>
          <div style={monoLine}>
            tracks={counts.tracks} fx={counts.fx} routes={counts.routes}
          </div>
          <div style={monoLine}>pendingOps={counts.pending}</div>
        </section>
      </div>

      {/* =========================
          Pending Ops (compact + raw)
         ========================= */}
      <section style={{ ...cardStyle, marginTop: 12 }}>
        <div
          style={{
            ...cardTitle,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Pending Ops</span>
          <span style={{ opacity: 0.6, fontSize: 12 }}>
            {pendingOps.length ? "newest at bottom (queue order)" : "none"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pendingOps.length === 0 ? (
            <div style={{ ...monoLine, opacity: 0.6 }}>No pending ops.</div>
          ) : (
            pendingOps.map((op) => {
              const createdAt = Number(op?.createdAtMs || 0);
              const sentAt = Number(op?.sentAtMs || 0);
              const ageMs = createdAt ? Date.now() - createdAt : 0;

              const kind = String(
                op?.kind || op?.intent?.name || op?.intent?.kind || "unknown"
              );
              const status = String(op?.status || "unknown");

              const verify = op?.verify || null;
              const vOk = verify?.ok;
              const vReason = verify?.reason;
              const vSeq = verify?.checkedSeq;

              return (
                <div
                  key={op.id}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.03)",
                    padding: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ fontFamily: monoFont, fontSize: 12, fontWeight: 800 }}>
                      {kind}
                    </div>

                    <div
                      style={{
                        fontFamily: monoFont,
                        fontSize: 11,
                        padding: "2px 6px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: toneColor(status),
                      }}
                    >
                      {status}
                    </div>

                    <div style={{ fontFamily: monoFont, fontSize: 12, opacity: 0.8 }}>
                      opId={String(op.id)}
                    </div>

                    <div style={{ flex: 1 }} />

                    <div style={{ fontFamily: monoFont, fontSize: 12, opacity: 0.75 }}>
                      age={fmtAge(ageMs)}
                    </div>

                    {sentAt ? (
                      <div style={{ fontFamily: monoFont, fontSize: 12, opacity: 0.75 }}>
                        sent={fmtAge(Date.now() - sentAt)}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ marginTop: 6, ...monoLine, opacity: 0.95 }}>
                    verify {boolBadge(vOk)}{" "}
                    <span style={{ opacity: 0.85 }}>
                      {vReason ? vReason : "(not checked yet)"}
                    </span>
                    {vSeq != null ? (
                      <span style={{ opacity: 0.65 }}> • checkedSeq={vSeq}</span>
                    ) : null}
                    {op?.ackSeq != null ? (
                      <span style={{ opacity: 0.65 }}> • ackSeq={op.ackSeq}</span>
                    ) : null}
                  </div>

                  {op?.error ? (
                    <div
                      style={{
                        marginTop: 6,
                        ...monoLine,
                        opacity: 0.9,
                        color: "rgba(255,140,140,0.95)",
                      }}
                    >
                      error={String(op.error)}
                    </div>
                  ) : null}

                  {op?.intent ? (
                    <div style={{ marginTop: 6, ...monoLine, opacity: 0.75 }}>
                      intent={String(op.intent?.name || op.intent?.kind || kind)}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>Raw JSON:</div>
        <pre style={preStyle}>{JSON.stringify(pendingOps, null, 2)}</pre>
      </section>

      <section style={{ ...cardStyle, marginTop: 12 }}>
        <div style={cardTitle}>Last Error</div>
        <pre style={preStyle}>{JSON.stringify(ops?.lastError, null, 2)}</pre>
      </section>

      <section style={{ ...cardStyle, marginTop: 12 }}>
        <div style={{ ...cardTitle, display: "flex", justifyContent: "space-between" }}>
          <span>Event Log (newest first)</span>
          <span style={{ opacity: 0.6, fontSize: 12 }}>
            tip: trigger select bus / set routing and watch the sequence
          </span>
        </div>

        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          {eventsNewestFirst.map((e, i) => (
            <div key={i} style={eventCardStyle}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontFamily: monoFont, fontSize: 12, opacity: 0.85 }}>
                  {fmtTime(e.t)}
                </div>
                <div style={{ fontFamily: monoFont, fontSize: 12, fontWeight: 700 }}>
                  {e.kind}
                </div>

                {/* ✅ meta line (seq/opId correlation) */}
                {e.meta ? (
                  <div style={{ fontFamily: monoFont, fontSize: 12, opacity: 0.65 }}>
                    {fmtMeta(e.meta)}
                  </div>
                ) : null}
              </div>

              {e.data != null ? (
                <pre style={{ ...preStyle, marginTop: 8 }}>
                  {JSON.stringify(e.data, null, 2)}
                </pre>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const monoFont = "ui-monospace, SFMono-Regular, Menlo, monospace";

const cardStyle = {
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.25)",
  borderRadius: 12,
  padding: 12,
};

const cardTitle = {
  fontSize: 13,
  fontWeight: 700,
  opacity: 0.9,
  marginBottom: 6,
};

const monoLine = {
  fontFamily: monoFont,
  fontSize: 12,
  opacity: 0.9,
};

const preStyle = {
  margin: 0,
  padding: 12,
  borderRadius: 10,
  background: "rgba(255,255,255,0.06)",
  overflow: "auto",
  fontSize: 12,
};

const btnStyle = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  cursor: "pointer",
};

const eventCardStyle = {
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  padding: 10,
};