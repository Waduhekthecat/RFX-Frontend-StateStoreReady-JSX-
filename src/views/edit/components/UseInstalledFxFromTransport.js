import * as React from "react";
import { useTransport } from "../../../core/transport/TransportProvider";
import { normalizeInstalledFx } from "./InstalledFxUtils";

export function useInstalledFxFromTransport() {
  const t = useTransport();
  const [vm, setVm] = React.useState(() => t.getSnapshot());

  React.useEffect(() => t.subscribe(setVm), [t]);

  const candidate =
    vm?.installedFx ||
    vm?.pluginList ||
    vm?.installedPlugins ||
    vm?.rfx_plugin_list ||
    null;

  return normalizeInstalledFx(candidate);
}