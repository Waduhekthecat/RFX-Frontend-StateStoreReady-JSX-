import React from "react";
import {
  BUS_INSTRUMENTS,
  DEFAULT_BUS_INSTRUMENT,
  useRfxStore,
} from "../core/rfx/Store";
import guitarImage from "../assets/instruments/guitar.jpg";
import bassImage from "../assets/instruments/bass.jpg";
import voxImage from "../assets/instruments/vox.jpg";
import drumsImage from "../assets/instruments/drums.jpg";
import synthImage from "../assets/instruments/synth.jpg";
import styles from "./InstrumentView.module.css";

const INSTRUMENT_IMAGES = Object.freeze({
  Guitar: guitarImage,
  Bass: bassImage,
  Vox: voxImage,
  Drums: drumsImage,
  Synth: synthImage,
});

const INSTRUMENT_DESCRIPTIONS = Object.freeze({
  Guitar: "Electric guitar signal path",
  Bass: "Electric bass signal path",
  Vox: "Voice and microphone signal path",
  Drums: "Acoustic and electronic drums",
  Synth: "Synthesizers and keys",
});

export function InstrumentView() {
  const activeBusId = useRfxStore(
    (state) => state.perf?.activeBusId ?? state.meters?.activeBusId ?? "FX_1"
  );
  const selectedInstrument = useRfxStore(
    (state) =>
      state.perf?.instrumentByBusId?.[activeBusId] ?? DEFAULT_BUS_INSTRUMENT
  );
  const setBusInstrument = useRfxStore((state) => state.setBusInstrument);

  const selectInstrument = React.useCallback(
    (instrument) => {
      setBusInstrument({ busId: activeBusId, instrument });
    },
    [activeBusId, setBusInstrument]
  );

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <div>
          <div className={styles.kicker}>INSTRUMENT PROFILE · {activeBusId}</div>
          <h1 className={styles.title}>Instrument</h1>
        </div>

        <div className={styles.selectionBadge} aria-live="polite">
          <span className={styles.badgeDot} aria-hidden="true" />
          <span className={styles.badgeCaption}>Selected</span>
          <strong>{selectedInstrument}</strong>
        </div>
      </header>

      <section className={styles.cardGrid} aria-label="Select an instrument">
        {BUS_INSTRUMENTS.map((instrument) => {
          const selected = selectedInstrument === instrument;

          return (
            <button
              className={styles.card}
              data-selected={selected || undefined}
              key={instrument}
              type="button"
              aria-pressed={selected}
              aria-label={`Select ${instrument}`}
              onClick={() => selectInstrument(instrument)}
            >
              <span className={styles.imageFrame}>
                <img
                  className={styles.image}
                  src={INSTRUMENT_IMAGES[instrument]}
                  alt=""
                  draggable="false"
                />
                <span className={styles.imageShade} aria-hidden="true" />
                {selected ? (
                  <span className={styles.activeBadge}>
                    <span aria-hidden="true">✓</span> Active
                  </span>
                ) : null}
              </span>

              <span className={styles.cardCopy}>
                <strong>{instrument}</strong>
                <span>{INSTRUMENT_DESCRIPTIONS[instrument]}</span>
              </span>
            </button>
          );
        })}
      </section>
    </main>
  );
}

