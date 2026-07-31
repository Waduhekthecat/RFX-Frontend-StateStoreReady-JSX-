import { BusCard } from "./BusCard";
import { styles } from "../_styles";

const DEFAULT_BUSES = [
  { id: "FX_1", label: "FX_1" },
  { id: "FX_2", label: "FX_2" },
  { id: "FX_3", label: "FX_3" },
  { id: "FX_4", label: "FX_4" },
];

export function BusCardArea({ vm, getRoutingMode, onDragMapBusVolume }) {
  const buses = (vm?.buses?.length ? vm.buses : DEFAULT_BUSES).slice(0, 4);
  const activeBus =
    buses.find((b) => b.id === vm?.activeBusId) ||
    buses[0] ||
    { id: "FX_1", label: "FX_1" };
  const activeBusId = activeBus.id;
  const activeRoutingMode =
    (vm?.busModes && vm.busModes[activeBusId]) ||
    (getRoutingMode ? getRoutingMode(activeBusId) : "linear");

  return (
    <div className={styles.BusCardAreaRoot}>
      <div className={styles.BusCardAreaMain}>
        <BusCard
          bus={activeBus}
          isActive
          showActiveRing={false}
          routingMode={activeRoutingMode}
          onDragMapBusVolume={onDragMapBusVolume}
        />
      </div>
    </div>
  );
}
