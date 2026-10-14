import { useEffect, useState } from "react";
import { experimentRun, useExperimentRun } from "../sim/experimentRun";
import { setUserIntentListener } from "../sim/intent";
import { PRESETS, type PresetId } from "../sim/presets";
import { stopScheduled } from "../sim/bureau";
import { useTriad } from "../sim/store";
import { handoffManual, ridePause, rideRestart, rideStart, shouldLoop } from "./rideControl";

const HANDOFF =
  "Manual. The script is paused so it will not overwrite that change. Resume continues the script and drives the controls again. Restart starts over. Restore returns the setup from before Ride.";

export function RideDock() {
  const run = useExperimentRun();
  const t = useTriad((s) => s.snap.t);
  const [loop, setLoop] = useState(false);
  const [note, setNote] = useState("");
  const [full, setFull] = useState(false);
  const shown: PresetId | "" = (run.status === "idle" ? run.armedId : run.presetId ?? run.armedId) ?? "";
  const locked = run.status === "running" || run.status === "paused";

  useEffect(() => {
    setUserIntentListener(() => {
      stopScheduled();
      const why = handoffManual();
      if (why) setNote(HANDOFF);
    });
    return () => setUserIntentListener(() => {});
  }, []);

  useEffect(() => {
    const frame = document.querySelector("[data-viewport-frame]");
    frame?.classList.toggle("is-full", full);
    return () => frame?.classList.remove("is-full");
  }, [full]);

  useEffect(() => {
    if (!shouldLoop(loop, run.status)) return;
    const id = window.setTimeout(() => rideStart(), 400);
    return () => window.clearTimeout(id);
  }, [loop, run.status]);

  return (
    <section className="ride-dock" aria-label="Ride">
      <div className="ride-top">
        <p className="kicker">TRIAD · Field Design Bureau</p>
        <span className="kicker">v0.2</span>
      </div>
      <label className="ride-select">
        <span className="sr-only">Experiment</span>
        <select
          data-ride="experiment"
          value={shown}
          disabled={locked}
          onChange={(e) => {
            const id = e.target.value as PresetId;
            if (id) experimentRun.select(id);
          }}
        >
          <option value="">Choose an experiment</option>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.index} · {p.title}
            </option>
          ))}
        </select>
      </label>
      <div className="ride-actions">
        <button
          className="ride-btn"
          data-ride="start"
          disabled={run.status === "running"}
          onClick={() => {
            setNote("");
            rideStart();
          }}
        >
          <span>{run.status === "paused" ? "Resume" : "Ride"}</span>
        </button>
        <button className="ride-btn" data-ride="pause" disabled={run.status !== "running"} onClick={() => ridePause()}>
          <span>Pause</span>
        </button>
        <button
          className="ride-btn"
          data-ride="restart"
          onClick={() => {
            setNote("");
            rideRestart();
          }}
        >
          <span>Restart</span>
        </button>
      </div>
      <div className="ride-meta">
        <span>{run.status === "idle" ? "Free run until Ride" : run.status === "done" ? "Held" : run.status}</span>
        <span>T+ {t.toFixed(1)} s</span>
        {run.event ? <span className="event-mark">{run.event}</span> : <span>Default ride is 01 Control cliff</span>}
        <button className="btn" data-ride="expand" onClick={() => setFull((v) => !v)}>
          {full ? "Close" : "Expand"}
        </button>
        <label className="ride-loop">
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
          Loop {loop ? "on" : "off"}
        </label>
        <button className="btn" data-ride="restore" onClick={() => experimentRun.restore()}>
          Restore
        </button>
      </div>
      {note ? <p className="ride-note">{note}</p> : null}
    </section>
  );
}
