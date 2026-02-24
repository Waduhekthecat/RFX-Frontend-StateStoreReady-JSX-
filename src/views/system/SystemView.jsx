// src/views/system/SystemView.jsx
import React, { useMemo, useState } from "react";

/**
 * SystemView
 * - Settings that are NOT simply “command REAPER”
 * - Placeholder UI now; wire into native modules / OS services later
 * - Touch-friendly, simple cards
 */

function ItemRow({ title, desc, right }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{title}</div>
        {desc ? <div className="text-xs opacity-70 truncate">{desc}</div> : null}
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-sm font-semibold tracking-wide">{title}</div>
      <div className="mt-3 divide-y divide-white/10">{children}</div>
    </div>
  );
}

function Pill({ children }) {
  return (
    <div className="text-[11px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5">
      {children}
    </div>
  );
}

function Btn({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm hover:bg-black/40"
      style={{ touchAction: "manipulation" }}
    >
      {children}
    </button>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={[
        "w-14 h-8 rounded-full border border-white/10 transition",
        value ? "bg-white/20" : "bg-black/30",
      ].join(" ")}
      style={{ touchAction: "manipulation" }}
      aria-pressed={value}
    >
      <div
        className={[
          "h-7 w-7 rounded-full bg-white/70 transition-transform",
          value ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

export function SystemView() {
  // Local-only state for now (wire later)
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [btEnabled, setBtEnabled] = useState(false);
  const [midiEnabled, setMidiEnabled] = useState(true);
  const [devMode, setDevMode] = useState(false);

  const deviceStatus = useMemo(() => {
    // Placeholder: later you can derive from a real transport connection to a companion app
    return "Not connected";
  }, []);

  const buildInfo = useMemo(() => {
    return {
      version: "RFX (dev)",
      channel: "local",
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col min-h-0">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="text-xl font-semibold tracking-wide">System</div>
        <div className="text-sm opacity-70">
          Device settings, connectivity, updates, and debug tools.
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 px-5 pb-5 overflow-auto">
        <div className="grid grid-cols-2 gap-4">
          {/* Connectivity */}
          <Section title="Connectivity">
            <ItemRow
              title="Wi-Fi"
              desc={wifiEnabled ? "Enabled" : "Disabled"}
              right={<Toggle value={wifiEnabled} onChange={setWifiEnabled} />}
            />
            <ItemRow
              title="Bluetooth"
              desc={btEnabled ? "Enabled" : "Disabled"}
              right={<Toggle value={btEnabled} onChange={setBtEnabled} />}
            />
            <ItemRow
              title="MIDI"
              desc={midiEnabled ? "Enabled" : "Disabled"}
              right={<Toggle value={midiEnabled} onChange={setMidiEnabled} />}
            />
          </Section>

          {/* Companion / Device */}
          <Section title="Connect to device">
            <ItemRow
              title="User PC"
              desc={deviceStatus}
              right={<Pill>{deviceStatus}</Pill>}
            />
            <ItemRow
              title="Pair / Connect"
              desc="Connect RFX to a companion app or desktop controller"
              right={<Btn onClick={() => console.log("[System] connect device")}>Connect</Btn>}
            />
            <ItemRow
              title="Forget device"
              desc="Clear saved pairing and connection info"
              right={<Btn onClick={() => console.log("[System] forget device")}>Forget</Btn>}
            />
          </Section>

          {/* Updates */}
          <Section title="Update">
            <ItemRow
              title="Current build"
              desc={`${buildInfo.version} • ${buildInfo.channel}`}
              right={<Pill>{buildInfo.channel}</Pill>}
            />
            <ItemRow
              title="Check for updates"
              desc="Downloads and installs RFX updates (not REAPER)"
              right={<Btn onClick={() => console.log("[System] check updates")}>Check</Btn>}
            />
            <ItemRow
              title="Install from USB"
              desc="Offline update flow for touring rigs"
              right={<Btn onClick={() => console.log("[System] install usb")}>Install</Btn>}
            />
          </Section>

          {/* Debug */}
          <Section title="Debug">
            <ItemRow
              title="Developer mode"
              desc={devMode ? "Enabled (extra logs/tools visible)" : "Disabled"}
              right={<Toggle value={devMode} onChange={setDevMode} />}
            />
            <ItemRow
              title="Open logs"
              desc="View system / transport logs"
              right={<Btn onClick={() => console.log("[System] open logs")}>Open</Btn>}
            />
            <ItemRow
              title="Diagnostics"
              desc="Export a debug bundle for support"
              right={<Btn onClick={() => console.log("[System] export diagnostics")}>Export</Btn>}
            />
            <ItemRow
              title="Restart UI"
              desc="Soft restart (frontend only)"
              right={<Btn onClick={() => window.location.reload()}>Restart</Btn>}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}