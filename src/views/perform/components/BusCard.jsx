import { Panel } from "../../../components/ui/Panel";
import { VerticalMeter } from "../../../components/ui/meters/VerticalMeter";
import { RoutingWell } from "./RoutingWell";
import { styles } from "../_styles";

export function BusCard({
  bus,
  isActive,
  meters = { l: 0, r: 0 },
  onSelect,
  routingMode = "linear", // "linear" | "parallel" | "lcr"
}) {
  const busId = bus?.id || "FX_?";
  const label = bus?.label ?? busId;

  return (
    <Panel
      as="button"
      active={isActive}
      onClick={onSelect}
      className={styles.BusCardButton}
    >
      <div className={styles.BusCardInnerRow}>
        {/* LEFT CONTENT */}
        <div className={styles.BusCardLeft}>
          <div className={styles.BusCardHeader}>
            <div className={styles.BusCardTitle}>{label}</div>

            {isActive && <div className={styles.BusCardActivePill}>Active</div>}
          </div>

          {/* Routing visualization */}
          <div className={styles.BusCardRoutingSlot}>
            <RoutingWell busId={busId} mode={routingMode} active={isActive} />
          </div>
        </div>

        {/* RIGHT METERS */}
        <div className={styles.BusCardMeters}>
          <VerticalMeter value={meters.l} enabled={isActive} width={12} rounded={8} />
          <VerticalMeter value={meters.r} enabled={isActive} width={12} rounded={8} />
        </div>
      </div>
    </Panel>
  );
}