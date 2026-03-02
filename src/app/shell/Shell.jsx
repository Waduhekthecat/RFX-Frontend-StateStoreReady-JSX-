import { Outlet } from "react-router-dom";
import { styles } from "./_styles";

export function Shell({ nav }) {
  return (
    <div style={styles.frame}>
      <div style={styles.nav}>{nav}</div>
      <div style={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}