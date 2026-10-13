import { useEffect, useRef, useState } from "react";
import { schedule, stopScheduled, useBureau, wavelengthTurns, type CompareView } from "../sim/bureau";
import { setUserIntentListener, withoutUserIntent } from "../sim/intent";
import { MECHANISMS, researchFor, type MechanismId } from "../sim/research";
import { useTriad } from "../sim/store";
import type { Params } from "../sim/types";

function still(extra: Partial<Params>) {
  withoutUserIntent(() => {
    const api = useTriad.getState();
    api.patch({
      running: false,
      speed: 0,
      orbitRate: 0,
      perturb: 0,
      mode: "scripted",
      spacing: "equal",
      seatBendDeg: 0,
      activeCount: 3,
      simulateAmplitude: false,
      frame: "world",
      viewpoint: "overhead",
      showField: true,
      ...extra,
    });
    api.reset();
  });
}

function snowflake() {
  useBureau.getState().setProbe(null);
  still({
    orient: "vertical",
    phasePreset: "zero",
    phaseA: 0,
    phaseB: 0,
    phaseC: 0,
    freqHz: 1e6,
  });
  useBureau.getState().recompute();
}

function breakSymmetry() {
  snowflake();
  withoutUserIntent(() => {
    useTriad.getState().freeze("a");
    useTriad.getState().patch({ phasePreset: "manual", phaseB: 40 });
    useTriad.getState().freeze("b");
  });
  useBureau.getState().compareShots();
  useBureau.getState().recompute();
}

function strongPair() {
  snowflake();
  withoutUserIntent(() => {
    useTriad.getState().freeze("a");
    useTriad.getState().patch({ freqHz: 1e8 });
    useTriad.getState().freeze("b");
  });
  useBureau.getState().compareShots();
  useBureau.getState().recompute();
}

function limitWalk() {
  stopScheduled();
  withoutUserIntent(() => {
    useTriad.getState().patch({ running: false, speed: 0, orbitRate: 0, perturb: 0 });
  });
  const distances = [18, 8, 5, 2.5];
  distances.forEach((distance, i) => {
    schedule(i * 700, () => {
      useBureau.getState().setProbe(distance);
      useBureau.getState().setRide(i === distances.length - 1 ? null : `Limit walk · probe ${distance} m`);
      useBureau.getState().recompute();
    });
  });
  useBureau.getState().setRide("Limit walk · approaching the exclusion");
}

function startRide() {
  stopScheduled();
  useBureau.getState().setRide("0 s · three electric dipoles");
  schedule(0, () => {
    snowflake();
    useBureau.getState().setRide("0 s · equal vertical dipoles, 1 MHz");
  });
  schedule(10000, () => {
    useBureau.getState().setSettings({ obsDeg: 70 });
    useBureau.getState().recompute();
    useBureau.getState().setRide("10 s · same sources, later observation phase");
  });
  schedule(20000, () => {
    breakSymmetry();
    useBureau.getState().setRide("20 s · phase B moved. Symmetry is a measurement.");
  });
  schedule(30000, () => {
    useBureau.getState().recompute("refine");
    useBureau.getState().setRide("30 s · null search refined. A null is not reconnection.");
  });
  schedule(40000, () => {
    useBureau.getState().setSettings({ advanced: true });
    useBureau.getState().setRide("40 s · ε is not |E|. The series is constant-field.");
  });
  schedule(50000, () => {
    useBureau.getState().setRide("50 s · plasma, metric, and waveguide are not in this solver.");
  });
  schedule(60000, () => {
    useBureau.getState().setRide(null);
  });
}

export function FieldBureau() {
  const settings = useBureau((s) => s.settings);
  const result = useBureau((s) => s.result);
  const compare = useBureau((s) => s.compare);
  const ride = useBureau((s) => s.ride);
  const note = useBureau((s) => s.note);
  const shotA = useBureau((s) => s.shotA);
  const shotB = useBureau((s) => s.shotB);
  const setSettings = useBureau((s) => s.setSettings);
  const freq = useTriad((s) => s.params.freqHz);
  const radius = useTriad((s) => s.params.orbitRadius);
  const running = useTriad((s) => s.params.running);
  const [mech, setMech] = useState<MechanismId>("reconnection");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setUserIntentListener(() => stopScheduled());
    return () => setUserIntentListener(() => {});
  }, []);

  const probeM = useBureau((s) => s.probeM);
  useEffect(() => {
    if (!settings.auto) return;
    const id = window.setTimeout(() => useBureau.getState().recompute(), 420);
    return () => window.clearTimeout(id);
  }, [settings, probeM]);

  useEffect(() => {
    if (!settings.auto || !running) return;
    const id = window.setInterval(() => useBureau.getState().recompute(), 1100);
    return () => window.clearInterval(id);
  }, [settings.auto, running]);

  const turns = wavelengthTurns(freq, radius);
  const domain = result?.fieldDomain ?? "NOT EVALUATED";
  const nodes = researchFor({
    nulls: (result?.nulls.length ?? 0) > 0 || showAll,
    phase: Math.abs(useTriad.getState().params.phaseB - useTriad.getState().params.phaseA) > 1 || showAll,
    schwinger: settings.advanced || showAll,
    transport: mech === "metric" || showAll,
  });
  const mechanism = MECHANISMS.find((m) => m.id === mech) ?? MECHANISMS[0];

  return (
    <aside className="bureau" data-bureau-status={result ? "ready" : "pending"} data-field-domain={domain}>
      <header className="bureau-head">
        <p className="kicker">Field design bureau</p>
        <h2>Calculated B, not a drawn snowflake</h2>
        <p>
          Three Hertzian electric dipoles. Not plasma spheres. Curves are instantaneous B. A null is not reconnection.
        </p>
      </header>
      <p className={`bureau-chip`} data-state={domain}>
        Field domain · {domain}
      </p>
      {compare ? (
        <p className="bureau-chip">
          {compare.changed.join(" · ")} · {compare.ratioLine}
        </p>
      ) : null}
      <p className="bureau-note">{note}</p>
      {ride ? <p className="bureau-ride">{ride} · take any control to stop</p> : null}
      <div className="bureau-actions">
        <button className="btn" data-bureau="snowflake" onClick={() => { stopScheduled(); snowflake(); }}>
          Find the snowflake
        </button>
        <button className="btn" data-bureau="break" onClick={() => { stopScheduled(); breakSymmetry(); }}>
          Break one symmetry
        </button>
        <button className="btn" data-bureau="strong" onClick={() => { stopScheduled(); strongPair(); }}>
          ε versus |E|
        </button>
        <button className="btn" data-bureau="limit" onClick={limitWalk}>
          Limit walk
        </button>
        <button className="btn" data-bureau="ride" onClick={startRide}>
          {ride ? "Ride running" : "Ride 60 s"}
        </button>
        <button
          className="btn"
          onClick={() => {
            stopScheduled();
          }}
        >
          Take control
        </button>
      </div>
      {compare ? (
        <p className="bureau-note">
          Frozen A/B · {compare.changed.length ? compare.changed.join(" · ") : "no control key changed"} · mean |Δ log10 |B|| {compare.meanAbsLog.toFixed(2)}. {compare.invariants}
        </p>
      ) : null}
      <p className="bureau-note">
        {turns.turns > 3
          ? `This triangle is about ${turns.turns.toFixed(0)} wavelengths across (λ ${turns.lambda.toFixed(1)} m). B curls on that scale. Lower frequency is the near-field picture of the same kernel.`
          : `This triangle is ${turns.turns.toFixed(2)} wavelengths across (λ ${turns.lambda.toFixed(0)} m). Near-field geometry. Still not a plasma.`}
      </p>
      <label className="bureau-slider">
        Observation phase ωt
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={settings.obsDeg}
          onChange={(e) => {
            stopScheduled();
            setSettings({ obsDeg: Number(e.target.value) });
          }}
        />
        <span>{settings.obsDeg.toFixed(0)}°</span>
      </label>
      <p className="bureau-note">ωt only chooses the snapshot. It is not an emitter phase and it does not enter the integrator.</p>
      {result ? (
        <ul className="bureau-list">
          <li>{result.symmetry.text}</li>
          <li>{result.nulls.length ? result.nulls.map((n) => n.label).join(" · ") : "No null detected at current resolution."}</li>
          <li>
            QED series · {result.rows.find((r) => r.id === "schwinger")?.state}. Peak |E| {result.qed.ePeak.toExponential(2)} · ε{" "}
            {result.qed.eps.toExponential(2)} · centroid ε {result.qed.centroidEps.toExponential(2)}
          </li>
        </ul>
      ) : null}
      {settings.advanced ? (
        <div className="bureau-advanced">
        <div className="bureau-actions">
          <button className="btn" data-bureau="recompute" onClick={() => useBureau.getState().recompute("refine")}>
            Refine nulls
          </button>
          <button
            className="btn"
            data-bureau="compare"
            disabled={!shotA || !shotB}
            onClick={() => useBureau.getState().compareShots()}
          >
            Compare frozen fields
          </button>
          <button className="btn" data-on={settings.perp} onClick={() => setSettings({ perp: !settings.perp })}>
            Perp slice
          </button>
          <button className="btn" data-on={settings.auto} onClick={() => setSettings({ auto: !settings.auto })}>
            {settings.auto ? "Auto sample" : "Sample paused"}
          </button>
        </div>
        <label className="bureau-slider">
          Seeds
          <input
            type="range"
            min={4}
            max={16}
            step={1}
            value={settings.seeds}
            onChange={(e) => {
              stopScheduled();
              setSettings({ seeds: Number(e.target.value) });
            }}
          />
          <span>{settings.seeds}</span>
        </label>
        <label className="bureau-slider">
          Slice offset
          <input
            type="range"
            min={-40}
            max={40}
            step={1}
            value={settings.offsetM}
            onChange={(e) => {
              stopScheduled();
              setSettings({ offsetM: Number(e.target.value) });
            }}
          />
          <span>{settings.offsetM.toFixed(0)} m</span>
        </label>
        <div className="bureau-actions">
          {(["b", "e", "u"] as const).map((q) => (
            <button key={q} className="btn" data-on={settings.quantity === q} onClick={() => setSettings({ quantity: q })}>
              {q === "b" ? "|B|" : q === "e" ? "|E|" : "energy"}
            </button>
          ))}
          <button
            className="btn"
            data-on={settings.plane === "perp"}
            onClick={() => setSettings({ plane: settings.plane === "orbit" ? "perp" : "orbit" })}
          >
            {settings.plane === "orbit" ? "Orbit plane" : "Perp plane"}
          </button>
        </div>
        {result ? (
          <ul className="bureau-list">
            {result.rows.map((row) => (
              <li key={row.id} data-state={row.state}>
                <strong>{row.state}</strong> · {row.id}. {row.text}
              </li>
            ))}
          </ul>
        ) : null}
        {compare ? <CompareCard compare={compare} /> : <p className="bureau-note">Freeze A and Freeze B store the dipoles. Compare does not rerun the aircraft.</p>}
        <p className="kicker">What would have to be true?</p>
        <div className="bureau-actions">
          {MECHANISMS.map((m) => (
            <button key={m.id} className="btn" data-on={mech === m.id} onClick={() => setMech(m.id)}>
              {m.title}
            </button>
          ))}
        </div>
        <ol className="bureau-list">
          <li>{mechanism.need}</li>
          <li>{mechanism.modeled}</li>
          <li>{mechanism.observable}</li>
          <li>{mechanism.contradict}</li>
        </ol>
        <button className="btn" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Context only" : "All citations"}
        </button>
        <ul className="bureau-list">
          {(showAll ? researchFor({ nulls: true, phase: true, schwinger: true, transport: true }) : nodes).map((node) => (
            <li key={node.id}>
              <strong>{node.status}</strong> · {node.title}. {node.when}. {node.text}{" "}
              {node.href ? (
                <a href={node.href} target="_blank" rel="noreferrer">
                  source
                </a>
              ) : null}
            </li>
          ))}
        </ul>
        <button className="btn" onClick={() => setSettings({ advanced: false })}>
          Basic
        </button>
      </div>
      ) : (
        <button className="btn" onClick={() => setSettings({ advanced: true })}>
          Advanced
        </button>
      )}
    </aside>
  );
}

function CompareCard({ compare }: { compare: CompareView }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = compare.n;
    canvas.height = compare.n;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const copy = new Uint8ClampedArray(compare.rgba);
    ctx.putImageData(new ImageData(copy, compare.n, compare.n), 0, 0);
  }, [compare]);
  return (
    <div className="bureau-compare">
      <canvas ref={ref} className="bureau-diff" />
      <p>{compare.text}</p>
      <p>A · {compare.symmetryA}</p>
      <p>B · {compare.symmetryB}</p>
      <p>Nulls A · {compare.nullA}</p>
      <p>Nulls B · {compare.nullB}</p>
    </div>
  );
}
