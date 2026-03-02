# RFXCore

## Architectural Role

RFXCore sits between the UI and REAPER. It is the domain engine of the frontend.

```
UI Components
      ↓
   RFXCore
      ↓
   Transport
      ↓
    REAPER
```

RFXCore is responsible for modeling, enforcing, and reconciling the signal architecture of the session.

---

# Responsibilities by Layer

## UI (Views & Components)

Responsible for presentation and user interaction.

- Render state  
- Dispatch user intent  
- Maintain ephemeral UI-only state (scroll, search, hover, etc.)  
- **Must never implement business rules**

---

## RFXCore

Responsible for domain logic and session modeling.

- Owns the signal/routing domain model  
- Enforces business constraints (e.g. max plugins)  
- Maintains optimistic overlay state  
- Tracks pending operations  
- Reconciles snapshot updates from REAPER  
- Provides selectors for UI consumption  

---

## Transport

Responsible for I/O and communication.

- Reads and writes files  
- Sends syscalls to REAPER  
- Parses `view.json`  
- Emits snapshot updates  
- Contains **no business logic**

---

# Core Principles

## 1. RFXCore Is the Shadow Model of REAPER

RFXCore mirrors REAPER’s project structure in memory.

It maintains two layers of state:

- **`snapshot`** — last authoritative state received from REAPER  
- **`overlay`** — optimistic frontend changes not yet confirmed  

The UI renders the **effective state**, defined as:

```js
effectiveState = snapshot + overlay
```

Overlay overrides snapshot when present.

---

## 2. UI Is Optimistic

User actions must update immediately in the UI.

Supported actions include:

- `addFx`
- `removeFx`
- `reorderFx`
- `toggleFx`

When a user action occurs:

1. RFXCore updates the overlay immediately  
2. RFXCore records a pending operation  
3. RFXCore triggers a Transport syscall  

REAPER later confirms changes via updated `view.json`.

---

## 3. Business Logic Lives Here

The following rules belong inside RFXCore:

- Maximum plugin count per track  
- Valid reorder constraints  
- Lane validation  
- Chain normalization  
- Snapshot reconciliation  

These rules must **not** exist inside UI components.

---

## 4. RFXCore Does Not Perform I/O

RFXCore does **not**:

- Read or write files  
- Parse raw JSON files  
- Send OSC  
- Know filesystem paths  

Transport owns all I/O responsibilities.

RFXCore consumes structured snapshots only.

---

# State Model (Conceptual)

## Snapshot (Authoritative)

Represents the last known REAPER state.

Example shape:

```js
snapshot: {
  busesById: {},
  tracksById: {},
  chainByTrackId: {},
  updatedAtMs: number
}
```

Snapshot state must be treated as immutable input from REAPER.

---

## Overlay (Optimistic)

Represents frontend modifications not yet confirmed.

```js
overlay: {
  chainByTrackId: {}
}
```

Overlay overrides snapshot when present.

---

## Pending Operations

Tracks in-flight user actions.

```js
pendingOps: [
  {
    opId,
    kind,
    trackId,
    payload,
    status: "pending" | "acked" | "failed"
  }
]
```

Used for deterministic reconciliation.

---

# How State Flows

## Example: Adding a Plugin

1. UI calls:

   ```
   RFXCore.addFx(trackId, plugin)
   ```

2. RFXCore:
   - Validates constraints  
   - Updates overlay immediately  
   - Pushes a pending operation  
   - Calls `Transport.syscall(...)`  

3. REAPER updates `view.json`

4. Transport parses snapshot

5. Transport calls:

   ```
   RFXCore.commitSnapshot(snapshot)
   ```

6. RFXCore reconciles:
   - Matches operation to snapshot  
   - Marks operation as acknowledged  
   - Removes optimistic placeholder if necessary  

---

# What Must Never Happen

- Components modifying snapshot directly  
- Transport mutating domain logic  
- Business rules duplicated in UI  
- Component-local state holding authoritative chain data  
- UI waiting for REAPER before rendering intent  

---

# RFXCore Public API (Conceptual)

## Selectors

- `getChain(trackId)`  
- `getFx(trackId, fxId)`  
- `getBus(busId)`  
- `getTrack(trackId)`  

Selectors must return **effective (snapshot + overlay) state**.

---

## Actions

- `addFx(trackId, plugin)`  
- `removeFx(trackId, fxId)`  
- `toggleFx(trackId, fxId)`  
- `reorderFx(trackId, from, to)`  
- `commitSnapshot(snapshot)`  
- `markOpFailed(opId)`  

All business rules are enforced inside these actions.

---

# What Does NOT Belong in RFXCore

The following belong in components:

- Scroll position  
- Search filters  
- Which card is expanded  
- Temporary form values  
- UI layout state  
- Styling decisions  

---

# Long-Term Vision

RFXCore should eventually:

- Handle advanced routing state  
- Support multi-bus relationships  
- Support parameter automation overlay  
- Support multi-axis expression routing  
- Provide deterministic reconciliation between UI and REAPER  

It is intended to scale with the full RFX architecture.

---

# Mental Model

Think of RFXCore as:

> The frontend DSP console brain.

Transport is the wire.  
UI is the face.



src/core/rfx/
  _index.js                 // barrel exports (public API)
  RfxBridge.jsx             // wires TransportProvider -> store ingest
  Store.js                  // tiny: creates zustand store from slices

  store/
    createRfxStore.js       // assemble slices + actions
    initialState.js         // optional: keeps state shape explicit

  slices/
    wiringSlice.js          // transport + setTransport
    snapshotSlice.js        // snapshot meta + reaper/project/selection/transportState
    entitiesSlice.js        // entities truth
    metersSlice.js          // telemetry meters (fast path)
    perfSlice.js            // VM compat mirror
    sessionSlice.js         // RFX UI session state
    opsSlice.js             // pending ops + overlay + error + eventLog

  ingest/
    ingestSnapshot.js       // normalize + reconcile + session mapping + logging
    ingestMeters.js         // meters frame coercion + merge

  actions/
    dispatchIntent.js       // UI -> optimistic -> syscall -> pending state updates
    sessionActions.js       // setActiveTrackGuid, setSelectedFxGuid

  selectors/
    effective.js            // selectTrackEffective / selectFxEffective / selectFxOrderEffective

  utils/
    ids.js                  // uid, nowMs
    eventLog.js             // pushBounded
    overlay.js              // mergeOverlay
    coercions.js            // coerceToTransportCall, coerceMetersFrame, mergeMetersById
    transitions.js          // summarizeTransitions