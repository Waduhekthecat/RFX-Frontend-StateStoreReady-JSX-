import { styles, monoFont } from "../_styles";
import { boolBadge, fmtAge, toneColor } from "../_util";

export function PendingOpCard({ op, nowMs }) {
  const createdAt = Number(op?.createdAtMs || 0);
  const sentAt = Number(op?.sentAtMs || 0);
  const ageMs = createdAt ? nowMs - createdAt : 0;

  const kind = String(op?.kind || op?.intent?.name || op?.intent?.kind || "unknown");
  const status = String(op?.status || "unknown");

  const verify = op?.verify || null;
  const vOk = verify?.ok;
  const vReason = verify?.reason;
  const vSeq = verify?.checkedSeq;

  return (
    <div style={styles.opCard}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontFamily: monoFont, fontSize: 12, fontWeight: 800 }}>{kind}</div>

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
            sent={fmtAge(nowMs - sentAt)}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 6, ...styles.monoLine, opacity: 0.95 }}>
        verify {boolBadge(vOk)}{" "}
        <span style={{ opacity: 0.85 }}>{vReason ? vReason : "(not checked yet)"}</span>
        {vSeq != null ? <span style={{ opacity: 0.65 }}> • checkedSeq={vSeq}</span> : null}
        {op?.ackSeq != null ? <span style={{ opacity: 0.65 }}> • ackSeq={op.ackSeq}</span> : null}
      </div>

      {op?.error ? (
        <div
          style={{
            marginTop: 6,
            ...styles.monoLine,
            opacity: 0.9,
            color: "rgba(255,140,140,0.95)",
          }}
        >
          error={String(op.error)}
        </div>
      ) : null}

      {op?.intent ? (
        <div style={{ marginTop: 6, ...styles.monoLine, opacity: 0.75 }}>
          intent={String(op.intent?.name || op.intent?.kind || kind)}
        </div>
      ) : null}
    </div>
  );
}