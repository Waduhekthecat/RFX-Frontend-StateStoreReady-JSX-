import { styles } from "../_styles";

export function StatCard({ title, children, style = {} }) {
  return (
    <section style={{ ...styles.card, ...style }}>
      <div style={styles.cardTitle}>{title}</div>
      {children}
    </section>
  );
}