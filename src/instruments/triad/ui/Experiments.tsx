import { useState } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { compressedRadius } from "../sim/anchorView";
import { experimentRun, useExperimentRun } from "../sim/experimentRun";
import { PAL } from "../sim/palette";
import { PRESETS, type PresetId } from "../sim/presets";
import { useTriad } from "../sim/store";
import { setDisplayFocus, useDisplayFocus, type DisplayFocus } from "./displayFocus";

const STATE_LABEL = {
  idle: "idle",
  running: "running",
  paused: "paused",
  done: "held",
} as const;

export function ExperimentDeck() {
  const run = useExperimentRun();
  const shown: PresetId | null = run.status === "idle" ? run.armedId : (run.presetId ?? run.armedId);
  const def = shown ? PRESETS.find((p) => p.id === shown) : undefined;
  return (
    <section className="experiment-deck" aria-label="Experiments">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="kicker text-triad-obs">Experiments</p>
        <p className="text-triad-muted">Pick experiment → Run → Observe → Read Result → Copy Run</p>
      </div>
      <div className="experiment-picks">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            className="btn"
            data-on={shown === p.id}
            onClick={() => experimentRun.select(p.id)}
          >
            {p.index} · {p.title}
          </button>
        ))}
      </div>
      {def && shown && (
        <div className="experiment-card">
          <span className="kicker">Experiment</span>
          <span>
            {def.index} · {def.title}
          </span>
          <span className="kicker">State</span>
          <span className="text-triad-model">{STATE_LABEL[run.status]}</span>
          <span className="kicker">Changing</span>
          <span>{run.changing}</span>
          <span className="kicker">Held</span>
          <span>{run.held}</span>
          <span className="kicker">Watch</span>
          <span>{run.watch}</span>
          <span className="kicker">Prediction</span>
          <span>{run.prediction}</span>
          <span className="kicker">Observed</span>
          <span className="text-triad-obs">{run.observed || "—"}</span>
          {run.comparison && (
            <>
              <span className="kicker">A / B</span>
              <span>{run.comparison}</span>
            </>
          )}
          {run.geometryFlag && (
            <>
              <span className="kicker">Check</span>
              <span className={run.geometryFlag.startsWith("FLAG") ? "text-triad-hyp" : "text-triad-model"}>{run.geometryFlag}</span>
            </>
          )}
        </div>
      )}
      {shown === "null" && run.status !== "running" && run.status !== "paused" && (
        <div className="flex flex-wrap gap-2">
          <span className="kicker self-center">State B changes</span>
          {(
            [
              ["amplitude", "Amplitude"],
              ["phase", "Phase"],
              ["count", "Active count"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} className="btn" data-on={run.nullVar === id} onClick={() => experimentRun.setNullVar(id)}>
              {label}
            </button>
          ))}
        </div>
      )}
      {def && run.event && <p className="event-mark">{run.event}</p>}
      {run.status === "done" && run.result && <ResultCardView />}
      {shown === "schwinger" && run.samples.length > 2 && <SchwingerChart />}
      {def && (
        <div className="experiment-actions">
          {run.status === "running" ? (
            <button className="btn" onClick={() => experimentRun.pause()}>
              Pause
            </button>
          ) : run.status === "paused" ? (
            <button className="btn" data-on onClick={() => experimentRun.resume()}>
              Resume
            </button>
          ) : (
            <button className="btn" data-on onClick={() => experimentRun.begin(1)}>
              Run
            </button>
          )}
          <button className="btn" onClick={() => experimentRun.begin(0.25)} disabled={!shown}>
            Replay 0.25×
          </button>
          <button className="btn" onClick={() => experimentRun.restore()}>
            Restore
          </button>
        </div>
      )}
      {!def && <p className="text-triad-muted">Pick an experiment. Run drives the real integrator. Replay repeats that same sequence. 0.25× changes wall speed only.</p>}
    </section>
  );
}

export function TriadNotes() {
  const focus = useDisplayFocus();
  return (
    <section className="triad-notes" aria-label="Scope">
      <p className="max-w-4xl text-triad-muted">
        239 lives remain at the center of this mystery. TRIAD explores physical claims surrounding MH370 without
        treating speculation as evidence. Red, white, and blue here are epistemic labels — observation, model,
        hypothesis — not a national claim and not an attribution of responsibility.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="kicker">Display focus</span>
        {(
          [
            ["balanced", "Balanced"],
            ["aircraft", "Aircraft"],
            ["field", "Field"],
            ["sources", "Sources"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} className="btn" data-on={focus === id} onClick={() => setDisplayFocus(id as DisplayFocus)}>
            {label}
          </button>
        ))}
        <span className="text-triad-muted">Opacity only. Does not change the run.</span>
      </div>
      <details className="triad-about">
        <summary>What TRIAD is / is not</summary>
        <div className="triad-about-grid">
          <div>
            <p className="kicker text-triad-model">What TRIAD is</p>
            <p>
              An interactive research instrument separating source geometry and control, classical Maxwell field
              calculation, strong-field QED diagnostics, and explicitly labeled hypothesis overlays.
            </p>
          </div>
          <div>
            <p className="kicker text-triad-hyp">What TRIAD is not</p>
            <ul>
              <li>a reconstruction of MH370</li>
              <li>evidence for a specific explanation of MH370</li>
              <li>a flight dynamics simulator</li>
              <li>a derived propulsion or transport model</li>
              <li>evidence that Schwinger-scale fields create a metric, bore, portal, or displacement</li>
            </ul>
          </div>
        </div>
      </details>
    </section>
  );
}

function ResultCardView() {
  const result = useExperimentRun((s) => s.result);
  const [copied, setCopied] = useState(false);
  if (!result) return null;
  return (
    <article className="result-card" aria-label="Experiment result">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="kicker text-triad-obs">
          Result · {result.index} {result.title}
        </p>
        <button
          className="btn"
          type="button"
          onClick={() => {
            void copyRun(result.plain).then((ok) => {
              if (!ok) return;
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            });
          }}
        >
          {copied ? "Copied" : "Copy run"}
        </button>
      </div>
      {result.flag && <p className="result-flag">{result.flag}</p>}
      <p className="kicker">Observed in model</p>
      <pre>{result.observed}</pre>
      <p className="kicker">Interpretation</p>
      <p>{result.interpretation}</p>
      <p className="kicker">Not implied</p>
      <p className="text-triad-muted">{result.notImplied}</p>
    </article>
  );
}

function copyRun(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => copyRunFallback(text),
    );
  }
  return Promise.resolve(copyRunFallback(text));
}

function copyRunFallback(text: string) {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  el.remove();
  return ok;
}

function SchwingerChart() {
  const samples = useExperimentRun((s) => s.samples);
  const marks = useExperimentRun((s) => s.marks);
  const data = samples.map((s) => ({ t: s.t, logChi: Math.log10(Math.max(s.chi, 1e-30)) }));
  return (
    <div>
      <p className="kicker">log10(E/Es) · Maxwell scale is linear in this log · pair exponent is in Observed</p>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="t" type="number" hide domain={["dataMin", "dataMax"]} />
            <YAxis hide domain={["auto", "auto"]} />
            <Line type="monotone" dataKey="logChi" stroke={PAL.model} dot={false} strokeWidth={1.6} isAnimationActive={false} />
            {marks.map((m) => (
              <ReferenceLine key={m.label} x={m.t} stroke={PAL.hyp} strokeDasharray="3 2" />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Plan inset. Radius is logarithmic screen space, not meters. */
export function RangeInset() {
  const anchor = useTriad((s) => s.params.anchor);
  const km = useTriad((s) => s.params.anchorKm);
  const bearing = useTriad((s) => s.params.anchorBearing);
  if (!anchor) return null;
  const r = compressedRadius(km);
  const rad = (bearing * Math.PI) / 180;
  const cx = 78;
  const cy = 78;
  const x = cx + Math.sin(rad) * r;
  const y = cy - Math.cos(rad) * r;
  const rangeText = km >= 10 ? `${km.toFixed(0)} km` : `${km.toFixed(1)} km`;
  return (
    <div className="range-inset" aria-label="Compressed range inset">
      <p className="kicker text-triad-hyp">Range compressed / not to scale</p>
      <svg viewBox="0 0 156 156" width="148" height="148" role="img">
        <circle cx={cx} cy={cy} r="54" fill="none" stroke="#2c3c50" strokeDasharray="2 3" />
        <circle cx={cx} cy={cy} r="3" fill="#f4f7fb" />
        <line x1={cx} y1={cy} x2={x} y2={y} stroke="#d7263d" strokeDasharray="3 2" />
        <circle cx={x} cy={y} r="4.5" fill="none" stroke="#d7263d" />
      </svg>
      <p className="text-triad-hyp">
        {rangeText} · {bearing.toFixed(0)}°
      </p>
      <p className="text-triad-muted">log10(range / 0.5 km). Not meters.</p>
    </div>
  );
}
