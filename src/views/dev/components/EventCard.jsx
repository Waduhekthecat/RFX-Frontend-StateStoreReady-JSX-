import { styles, monoFont } from "../_styles";
import { fmtMeta, fmtTime } from "../_util";

export function EventCard({ e }) {
  return (
    <div style={styles.eventCard}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontFamily: monoFont, fontSize: 12, opacity: 0.85 }}>{fmtTime(e.t)}</div>
        <div style={{ fontFamily: monoFont, fontSize: 12, fontWeight: 700 }}>{e.kind}</div>

        {e.meta ? (
          <div style={{ fontFamily: monoFont, fontSize: 12, opacity: 0.65 }}>
            {fmtMeta(e.meta)}
          </div>
        ) : null}
      </div>

      {e.data != null ? (
        <pre style={{ ...styles.pre, marginTop: 8 }}>{JSON.stringify(e.data, null, 2)}</pre>
      ) : null}
    </div>
  );
}