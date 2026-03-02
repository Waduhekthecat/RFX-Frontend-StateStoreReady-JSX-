export const monoFont = "ui-monospace, SFMono-Regular, Menlo, monospace";

export const styles = {
    page: { padding: 16, height: "100%", overflow: "auto" },
    headerRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 10,
    },
    title: { fontSize: 18, fontWeight: 700 },
    subtle: { opacity: 0.6, fontSize: 12 },
    spacer: { flex: 1 },
    pauseLabel: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        opacity: 0.85,
        userSelect: "none",
    },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    card: {
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.25)",
        borderRadius: 12,
        padding: 12,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: 700,
        opacity: 0.9,
        marginBottom: 6,
    },
    monoLine: {
        fontFamily: monoFont,
        fontSize: 12,
        opacity: 0.9,
    },
    pre: {
        margin: 0,
        padding: 12,
        borderRadius: 10,
        background: "rgba(255,255,255,0.06)",
        overflow: "auto",
        fontSize: 12,
    },
    btn: {
        fontSize: 12,
        padding: "6px 10px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(255,255,255,0.06)",
        color: "white",
        cursor: "pointer",
    },
    eventCard: {
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
        padding: 10,
    },
    opCard: {
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.03)",
        padding: 10,
    },
};