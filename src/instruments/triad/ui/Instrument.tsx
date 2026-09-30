import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { engine, nominalFixture } from "../sim/engine";
import { useExperimentRun } from "../sim/experimentRun";
import { PAL } from "../sim/palette";
import { compareCaptures } from "../sim/qed";
import { useTriad } from "../sim/store";
import type { Constitutive, Experiment, FrozenState, GeoFrame, HistoryWindow, Mode, Orient, Params, PhasePreset, SchwingerSweep, Viewpoint } from "../sim/types";
import { setDisplayFocus } from "./displayFocus";
import { joules, sci, seconds, watts } from "./format";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "scripted", label: "Scripted", hint: "Predetermined track. Ignores the aircraft." },
  { id: "tracking", label: "Tracking", hint: "Each node chases the aircraft alone." },
  { id: "networked", label: "Networked", hint: "Aircraft plus neighbor spacing." },
  { id: "phase-locked", label: "Phase locked", hint: "Geometry and emitter phase together." },
];

const PRESETS: { id: PhasePreset; label: string }[] = [
  { id: "zero", label: "0 / 0 / 0" },
  { id: "triad", label: "0 / 120 / 240" },
  { id: "random", label: "Random" },
  { id: "drift", label: "Phase drift" },
  { id: "one-off", label: "One dark" },
  { id: "two-only", label: "Two only" },
];

function presetPatch(id: PhasePreset): Partial<Params> {
  if (id === "zero") return { phasePreset: id, phaseA: 0, phaseB: 0, phaseC: 0 };
  if (id === "triad") return { phasePreset: id, phaseA: 0, phaseB: 120, phaseC: 240, activeCount: 3 };
  if (id === "one-off" || id === "two-only") return { phasePreset: id, phaseA: 0, phaseB: 120, phaseC: 240, activeCount: 2 };
  if (id === "random") {
    return { phasePreset: id, phaseA: Math.random() * 360, phaseB: Math.random() * 360, phaseC: Math.random() * 360 };
  }
  return { phasePreset: id };
}

const VIEWS: { id: Viewpoint; label: string }[] = [
  { id: "chase", label: "Chase" },
  { id: "overhead", label: "Overhead" },
  { id: "starboard", label: "Starboard" },
  { id: "nose", label: "Nose" },
  { id: "node", label: "Node 1" },
  { id: "ground", label: "Ground" },
];

type Tab = "control" | "field" | "energy" | "hypothesis" | "seam" | "observe" | "nodes";

export function Header() {
  const params = useTriad((s) => s.params);
  const snap = useTriad((s) => s.snap);
  const patch = useTriad((s) => s.patch);
  const reset = useTriad((s) => s.reset);
  const maneuver = useTriad((s) => s.maneuver);
  const runStatus = useExperimentRun((s) => s.status);
  const held = runStatus === "done";
  const driving = runStatus === "running" || runStatus === "paused";
  return (
    <header className="flex flex-col gap-2 px-3 pt-3 pb-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker text-triad-obs">MisterY Labs · range instrument</p>
          <h1 className="font-sans text-3xl leading-none tracking-wide text-triad-model">TRIAD</h1>
          <p className="kicker text-triad-obs">TRIAD v0.1 · RESEARCH INSTRUMENT PREVIEW</p>
          <p className="text-triad-muted">Source locus ≠ Maxwell structure · not a tunnel</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn"
            data-on={params.running}
            onClick={() => {
              const run = useExperimentRun.getState();
              if (run.status === "running") {
                run.pause();
                return;
              }
              if (run.status === "paused") {
                run.resume();
                return;
              }
              if (run.status === "done") return;
              patch({ running: !params.running });
            }}
          >
            {held ? "Held" : params.running ? "Hold" : "Run"}
          </button>
          <button className="btn" onClick={() => maneuver()}>
            Test maneuver
          </button>
          <button className="btn" onClick={() => { setDisplayFocus("balanced"); reset(); }}>
            Reset
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="kicker">Time scale</span>
        {[0.25, 1, 2, 4].map((r) => (
          <button
            key={r}
            className="btn"
            data-on={params.timeScale === r}
            onClick={() => {
              if (driving) return;
              patch({ timeScale: r });
            }}
          >
            {r}×
          </button>
        ))}
        <span className="ml-auto font-sans text-lg tracking-widest text-triad-model">T+ {snap.t.toFixed(1)} s</span>
      </div>
    </header>
  );
}

export function Overlay() {
  const snap = useTriad((s) => s.snap);
  const params = useTriad((s) => s.params);
  const hypo =
    params.vacuumBore ||
    (params.ashton && params.vacuumGain > 1) ||
    (params.rayMode && params.constitutive !== "vacuum") ||
    (params.anchor && params.ashton) ||
    params.anchor;
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
      <div className="flex flex-wrap gap-2">
        <Chip k="Mode" v={snap.mode} tone="model" />
        <Chip k="120°" v={`${snap.gapErrDeg.toFixed(1)}°`} tone="obs" />
        <Chip k="Track" v={`${snap.trackErr.toFixed(1)} m`} tone="model" />
        <Chip k="E/Es" v={snap.qed.ePeak > 0 ? `10^${Math.log10(snap.qed.eOverEs).toFixed(1)}` : "0"} tone="model" />
        <Chip k="Δz120" v={Number.isFinite(snap.dz120) ? `${snap.dz120.toFixed(0)} m` : "∞"} tone="model" />
        <Chip k="Csweep" v={Number.isFinite(snap.cSweep) ? snap.cSweep.toFixed(2) : "—"} tone="obs" />
      </div>
      {snap.saturated && (
        <p className="banner mt-2 max-w-xl border border-triad-model bg-triad-surface/95 px-2 py-2 text-triad-model">
          Control saturated · ω²R / a_max = {snap.demandRatio.toFixed(2)}
        </p>
      )}
      <div className="flex max-w-md flex-col gap-1">
        {snap.maneuverLeft > 0 && (
          <p className="banner bg-triad-surface/80 px-2 py-1 text-triad-model">Test maneuver · commands overridden · {snap.maneuverLeft.toFixed(0)} s</p>
        )}
        {snap.limited && !params.simulateAmplitude && (
          <p className="banner bg-triad-surface/80 px-2 py-1 text-triad-model">
            Reservoir limit · delivered field {sci(snap.scale * 100, 0)}% of command
          </p>
        )}
        {params.simulateAmplitude && (
          <p className="banner bg-triad-hyp-dim/90 px-2 py-1 text-triad-hyp">
            SIMULATED / HYPOTHETICAL amplitude is in the Maxwell solution. The reservoir is not debited.
          </p>
        )}
        {hypo && (
          <p className="banner bg-triad-hyp-dim/90 px-2 py-1 text-triad-model">
            Hypothesis inserted — not derived from the Maxwell solution. Aircraft state is unchanged.
          </p>
        )}
        <p className="banner text-triad-model">B777-200ER schematic · 63.7 × 60.9 × 18.5 m · kinematic, not a flight model</p>
        <p className="banner text-triad-model">
          Helices = source locus (emitter history), not field lines and not a tunnel. Face and arrows = Maxwell structure.
        </p>
        <p className="banner text-triad-model">{snap.qed.regime}</p>
      </div>
    </div>
  );
}

function Chip({ k, v, tone }: { k: string; v: string; tone: "obs" | "model" }) {
  return (
    <span className="bg-triad-surface/80 border border-triad-line rounded-sm px-2 py-1">
      <span className="kicker mr-2">{k}</span>
      <span className={tone === "obs" ? "text-triad-obs" : "text-triad-model"}>{v}</span>
    </span>
  );
}

export function PlotDock() {
  const history = useTriad((s) => s.snap.history);
  const marks = useExperimentRun((s) => s.marks);
  return (
    <section className="plot-dock plate grid gap-2 p-2 sm:grid-cols-2">
      <Plot title="Tracking error (m) · model" data={history} dataKey="track" color={PAL.model} marks={marks} />
      <Plot title="Gap & phase error (deg)" data={history} dataKey="gap" color={PAL.obs} extra="phase" marks={marks} />
    </section>
  );
}

function Plot({
  title,
  data,
  dataKey,
  color,
  extra,
  marks,
}: {
  title: string;
  data: { t: number; track: number; gap: number; phase: number }[];
  dataKey: "track" | "gap";
  color: string;
  extra?: "phase";
  marks: { t: number; label: string }[];
}) {
  return (
    <div className="min-w-0">
      <p className="kicker px-1">{title}</p>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke={PAL.line} strokeDasharray="3 3" />
            <XAxis dataKey="t" type="number" hide domain={["dataMin", "dataMax"]} />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ background: PAL.surface, border: `1px solid ${PAL.line}`, fontSize: 12 }}
              labelFormatter={(t) => `t ${Number(t).toFixed(1)} s`}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} strokeWidth={1.6} isAnimationActive={false} />
            {extra && (
              <Line
                type="monotone"
                dataKey="phase"
                stroke={PAL.model}
                strokeDasharray="4 3"
                dot={false}
                strokeWidth={1.2}
                isAnimationActive={false}
              />
            )}
            {data.length > 1 &&
              marks.map((m) => (
                <ReferenceLine
                  key={`${m.label}-${m.t}`}
                  x={m.t}
                  stroke={PAL.hyp}
                  strokeDasharray="3 2"
                  label={{ value: m.label, fill: PAL.hyp, fontSize: 10, position: "insideTopRight" }}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Inspector() {
  const [tab, setTab] = useState<Tab>("control");
  const tabs: { id: Tab; label: string }[] = [
    { id: "control", label: "Control" },
    { id: "field", label: "Field" },
    { id: "energy", label: "Energy" },
    { id: "hypothesis", label: "Hypothesis" },
    { id: "seam", label: "Seam" },
    { id: "observe", label: "Observe" },
    { id: "nodes", label: "Nodes" },
  ];
  return (
    <aside className="inspector flex flex-col gap-3">
      <SeamStrip />
      <div className="flex gap-1 overflow-x-auto border-b border-triad-line">
        {tabs.map((t) => (
          <button key={t.id} className="tab" data-on={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "control" && <ControlTab />}
      {tab === "field" && <FieldTab />}
      {tab === "energy" && <EnergyTab />}
      {tab === "hypothesis" && <HypothesisTab />}
      {tab === "seam" && <SeamTab />}
      {tab === "observe" && <ObserveTab />}
      {tab === "nodes" && <NodesTab />}
    </aside>
  );
}

function SeamStrip() {
  const snap = useTriad((s) => s.snap);
  const p = useTriad((s) => s.params);
  const hypOn =
    p.vacuumBore ||
    (p.rayMode && p.constitutive !== "vacuum") ||
    (p.ashton && p.vacuumGain > 1) ||
    (p.anchor && p.ashton) ||
    p.anchor;
  const pairs = snap.qed.rateApplicable ? "estimated" : snap.qed.eps <= 0 ? "n/a" : "underflow";
  const cells = [
    ["MAXWELL", "white", "linear"],
    ["QED", "white", snap.qed.regime === "CLASSICAL EM" ? "classical" : snap.qed.regime === "SCHWINGER-SCALE FIELD" ? "Es scale" : "approaching"],
    ["PAIRS", "white", pairs],
    ["????", "gap", "no derivation"],
    ["HYPOTHESIS", hypOn ? "red" : "off", hypOn ? "armed" : "off"],
  ];
  return (
    <div className="seam-flow" aria-label="Epistemic seam">
      {cells.map(([k, tone, v]) => (
        <div key={k} className={`seam-cell ${tone === "gap" ? "gap gap-pulse" : ""} ${tone === "red" ? "plate-hyp" : ""}`}>
          <div className={`kicker ${tone === "red" || tone === "gap" ? "text-triad-hyp" : ""}`}>{k}</div>
          <div className="text-triad-model">{v}</div>
        </div>
      ))}
    </div>
  );
}

function ControlTab() {
  const p = useTriad((s) => s.params);
  const snap = useTriad((s) => s.snap);
  const patch = useTriad((s) => s.patch);
  const experiment = useTriad((s) => s.experiment);
  const hot = useExperimentRun((s) => s.hot);
  const lit = (name: string) => hot.includes(name);
  return (
    <div className="flex flex-col gap-3 pb-6">
      <p className="text-triad-muted">
        Default geometry is a forward bore: three nodes at 0° / 120° / 240° in a disk whose normal is the aircraft
        nose. From the nose, the aircraft sits in the triangle. The dotted helices are where those emitters have been.
        That source locus is not a Maxwell field line and not a tunnel. The field structure is the face slice and the
        Poynting arrows, from the sources where they are now.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {MODES.map((m) => (
          <button key={m.id} className="btn" data-on={p.mode === m.id} onClick={() => patch({ mode: m.id })}>
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-triad-muted">{MODES.find((m) => m.id === p.mode)?.hint}</p>
      <div className="grid grid-cols-2 gap-2">
        <Stat k="Gap error" v={`${snap.gapErrDeg.toFixed(2)}°`} tone="obs" />
        <Stat k="Track error" v={`${snap.trackErr.toFixed(2)} m`} />
        <Stat k="Phase slip" v={`${snap.phaseErrDeg.toFixed(2)}°`} />
        <Stat k="Acquisition" v={snap.acquisition} tone={p.drew ? "hyp" : "model"} />
      </div>
      <p className="text-triad-muted">{snap.gapMetric}</p>
      <p className="text-triad-muted">
        Can three nodes hold about 120° around a maneuvering aircraft? Scripted paths do not look at the aircraft.
        The others are delayed proportional controllers. Acceleration is hard-capped. This is not a flight computer.
      </p>
      <Slider label="Latency" value={p.latencyMs} min={0} max={500} step={5} unit="ms" onChange={(latencyMs) => patch({ latencyMs })} />
      <Slider label="Accel cap" value={p.aMax} min={8} max={400} step={1} unit="m/s²" onChange={(aMax) => patch({ aMax })} />
      <div className="plate plate-model p-3">
        <p className="kicker">Triad sample pitch · geometry only</p>
        <p className="font-sans text-2xl leading-none text-triad-model">
          Δz120 {Number.isFinite(snap.dz120) ? `${snap.dz120.toFixed(0)} m` : "∞"}
        </p>
        <p className="mt-2 font-sans text-xl text-triad-obs">
          Csweep {Number.isFinite(snap.cSweep) ? snap.cSweep.toFixed(2) : "—"}
        </p>
        <p className="mt-2">Δz120 = Lrev / 3</p>
        <p>Csweep = 2R / Δz120 = 6R / Lrev</p>
        <p className="mt-1 text-triad-muted">
          Csweep is a geometric sampling/overlap metric. It is not a physical coherence threshold. It does not enter
          the Hertzian solver. Bins at 1 and 3 only mark “pitch equals the diameter” and “one turn per diameter.”
        </p>
        <p className="mt-2">{snap.boreRegime}</p>
        <p className="mt-1 text-triad-muted">{snap.boreNote}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Stat k="Lrev" v={Number.isFinite(snap.lRev) ? `${snap.lRev.toFixed(0)} m` : "∞"} />
          <Stat k="2R" v={`${snap.boreDiam.toFixed(0)} m`} tone="obs" />
          <Stat k="Lrev/2R" v={Number.isFinite(snap.boreRatio) ? snap.boreRatio.toFixed(2) : "∞"} />
          <Stat k="ω²R" v={`${snap.aOrbit.toFixed(0)} m/s²`} />
        </div>
      </div>
      <Slider label="Orbit radius" value={p.orbitRadius} min={8} max={240} step={1} unit="m" tone="obs" onChange={(orbitRadius) => patch({ orbitRadius })} />
      <Slider name="orbitRate" hot={lit("orbitRate")} label="Orbit rate ω" value={p.orbitRate} min={-16} max={16} step={0.05} unit="rad/s" onChange={(orbitRate) => patch({ orbitRate })} />
      <Slider name="seatBend" hot={lit("seatBend")} label="Seat bend · node 2" value={p.seatBendDeg} min={-60} max={60} step={1} unit="°" onChange={(seatBendDeg) => patch({ seatBendDeg })} />
      <p className="text-triad-muted">Seat bend moves node 2 on the ring. It is not an emitter phase. Zero is the equal 120° triad. Free spacing ignores it.</p>
      <div className="plate plate-model p-3">
        <p className="kicker">{snap.saturated ? "Control saturated" : "Centripetal demand"}</p>
        <p className="font-sans text-2xl leading-tight text-triad-model">{snap.saturated ? "CONTROL SATURATED" : "Within cap"}</p>
        <p className="mt-1">ω²R / a_max = {snap.demandRatio.toFixed(2)}</p>
        <p className="text-triad-muted">
          ω²R = {snap.aOrbit.toFixed(0)} m/s² · a_max = {p.aMax.toFixed(0)} m/s²
        </p>
        <p className="mt-1 text-triad-muted">{snap.saturationNote}</p>
      </div>
      <Slider label="Aircraft speed" value={p.speed} min={0} max={340} step={1} unit="m/s" onChange={(speed) => patch({ speed })} />
      <Select
        label="Geometry frame"
        value={p.frame}
        options={[
          ["bore", "Forward bore — disk faces the nose"],
          ["body", "Body normal — ring banks with attitude"],
          ["velocity", "Velocity normal — perpendicular to flight path"],
          ["world", "World horizontal — ring stays level"],
        ]}
        onChange={(frame) => patch({ frame: frame as GeoFrame })}
      />
      <p className="text-triad-muted">{snap.frameNote} Angle of attack and sideslip split the nose from the velocity. Bank rolls body-normal and the bore disk; world horizontal does not.</p>
      <div className="plate plate-model p-3">
        <p className="kicker">Airframe clearance · 777-200ER</p>
        <p>63.7 m length · 60.9 m span · 18.5 m height. Swept wing kept. Schematic solid, not a loft.</p>
        <p className="mt-1">{snap.clearance.note}</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Stat k="Commanded R" v={`${snap.clearance.commandedR.toFixed(0)} m`} />
          <Stat k="Clearance floor" v={`${snap.clearance.clearR.toFixed(1)} m`} tone="obs" />
          <Stat k="Actual R" v={`${snap.clearance.actualR.toFixed(1)} m`} />
        </div>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="kicker">
                <th />
                <th>N1</th>
                <th>N2</th>
                <th>N3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="kicker">Clearance</td>
                {snap.clearance.clear.map((r, i) => (
                  <td key={i} className="text-triad-obs">{r.toFixed(1)}</td>
                ))}
              </tr>
              <tr>
                <td className="kicker">Actual</td>
                {snap.clearance.actual.map((r, i) => (
                  <td key={i}>{r.toFixed(1)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Stat k="Skin gap" v={`${snap.clearance.minGap.toFixed(1)} m`} tone="obs" />
          <Stat k="Nearest" v={snap.clearance.nearest} />
        </div>
      </div>
      <p className="kicker">Source locus · emitter history</p>
      <div className="grid grid-cols-4 gap-2">
        {([1, 2, 5, 10] as HistoryWindow[]).map((s) => (
          <button key={s} className="btn" data-on={p.historyS === s} onClick={() => patch({ historyS: s })}>
            {s}s
          </button>
        ))}
      </div>
      <Toggle label="Source locus" on={p.showBore} onClick={() => patch({ showBore: !p.showBore })} />
      <p className="text-triad-muted">
        Dotted trails are stored emitter positions — three world-lines, one per node. Faint rings sit on that path at
        multiples of Δz120. Ring color is not |E|. |E| is only the orbital face. ⟨S⟩ is only the arrows. Chase view
        shows the wake. Nose view shows the face.
      </p>
      <Toggle label="Vacuum bore · hypothesis" on={p.vacuumBore} hyp onClick={() => patch({ vacuumBore: !p.vacuumBore })} />
      <p className="text-triad-muted">
        Red shell is an optional picture of a swept cylinder, including a short lead ahead of the nose. Not computed
        from Maxwell. Not a portal. A Schwinger-scale field or a pair estimate does not turn it on.
      </p>
      <p className="kicker">Control experiment · clear the history, then compare</p>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["spin", "Spin only"],
            ["translate", "Translate only"],
            ["both", "Both"],
            ["reverse", "Reverse spin"],
            ["scramble-phase", "Scramble phase"],
            ["scramble-space", "Scramble 120°"],
            ["drop-node", "Darken N3"],
            ["restore", "Restore triad"],
          ] as [Experiment, string][]
        ).map(([id, label]) => (
          <button key={id} className="btn" onClick={() => experiment(id)}>
            {label}
          </button>
        ))}
      </div>
      <p className="text-triad-muted">
        Spin freezes the aircraft. Translate freezes the orbit. Scramble phase keeps the triangle and randomizes
        emitter phase. Scramble 120° breaks the geometric spacing. Darken N3 removes one radiator. Compare the Maxwell
        face, not the helix. The helix does not get a new law when you add spin.
      </p>
      <p className="kicker">Aircraft disturbances · kinematic, not aerodynamic</p>
      <Slider label="Bank" value={p.bankDeg} min={-45} max={45} step={1} unit="°" onChange={(bankDeg) => patch({ bankDeg })} />
      <Slider label="Flight-path pitch" value={p.pitchDeg} min={-20} max={20} step={0.5} unit="°" onChange={(pitchDeg) => patch({ pitchDeg })} />
      <Slider label="Angle of attack" value={p.alphaDeg} min={-8} max={16} step={0.5} unit="°" onChange={(alphaDeg) => patch({ alphaDeg })} />
      <Slider label="Sideslip" value={p.betaDeg} min={-15} max={15} step={0.5} unit="°" onChange={(betaDeg) => patch({ betaDeg })} />
      <Slider label="Extra yaw rate" value={p.yawRateDeg} min={-25} max={25} step={0.5} unit="°/s" onChange={(yawRateDeg) => patch({ yawRateDeg })} />
      <Slider label="Jitter" value={p.perturb} min={0} max={40} step={0.5} unit="m/s" onChange={(perturb) => patch({ perturb })} />
      <div className="grid grid-cols-3 gap-2">
        <Stat k="Bank now" v={`${snap.bankDeg.toFixed(1)}°`} />
        <Stat k="Body pitch" v={`${snap.pitchDeg.toFixed(1)}°`} />
        <Stat k="Heading" v={`${snap.yawDeg.toFixed(1)}°`} />
        <Stat k="α" v={`${snap.alphaDeg.toFixed(1)}°`} tone="obs" />
        <Stat k="β" v={`${snap.betaDeg.toFixed(1)}°`} tone="obs" />
        <Stat k="TAS" v={`${snap.tas.toFixed(0)} m/s`} />
        <Stat k="Ground" v={`${snap.groundSpeed.toFixed(0)} m/s`} />
        <Stat k="Alt" v={`${snap.altitude.toFixed(0)} m`} tone="obs" />
      </div>
    </div>
  );
}

function meters(n: number) {
  return Number.isFinite(n) ? `${n.toFixed(0)} m` : "∞";
}

function SweepPlate() {
  const snap = useTriad((s) => s.snap);
  const geo = snap.sweep.filter((r) => r.id === "one" || r.id === "two" || r.id === "three");
  const base = geo[0]?.eCenter ?? 0;
  const data = geo.map((r) => ({
    n: String(r.n),
    e: base > 0 ? r.eCenter / base : 0,
  }));
  return (
    <div className="plate plate-model p-3">
      <p className="kicker">Source-count sweep · same Hertzian solver</p>
      <p className="mt-1">
        Does any feature of the calculated Maxwell field change sharply, or only continuously, as geometric sampling
        gets denser?
      </p>
      <p className="mt-1 text-triad-muted">
        Ideal ring, one delivered |p| per active source, mutual impedance omitted. One, two, and three use a common
        phase so only the seat count changes. Scramble and 120° lock keep the three seats and change phase only. The
        helix is not in this sum.
      </p>
      <div className="mt-2 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke={PAL.line} strokeDasharray="3 3" />
            <YAxis hide domain={[0, "auto"]} />
            <Tooltip
              contentStyle={{ background: PAL.surface, border: `1px solid ${PAL.line}`, fontSize: 12 }}
              formatter={(v) => [`${Number(v).toFixed(2)}×`, "center |E| / one source"]}
              labelFormatter={(n) => `${n} sources, common phase`}
            />
            <Line type="linear" dataKey="e" stroke={PAL.model} dot strokeWidth={1.6} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="kicker">Center |E| relative to one source · common phase only</p>
      <div className="mt-2 flex flex-col gap-2">
        {snap.sweep.map((r) => (
          <div key={r.id} className="border-t border-triad-line pt-2">
            <p className="text-triad-model">{r.label}</p>
            <p className="text-triad-muted">{r.phaseNote}</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Stat k="Δz" v={meters(r.pitch)} />
              <Stat k="2R/Δz" v={Number.isFinite(r.cSweep) ? r.cSweep.toFixed(2) : "—"} tone="obs" />
              <Stat k="|E| center" v={`${sci(r.eCenter)} V/m`} />
              <Stat k="contrast" v={r.contrast.toFixed(2)} />
              <Stat k="⟨S⟩·n" v={`${sci(r.sAxial)} W/m²`} />
              <Stat k="|E| rms" v={`${sci(r.eRms)} V/m`} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2">{snap.sweepVerdict}</p>
    </div>
  );
}

function FieldTab() {
  const p = useTriad((s) => s.params);
  const snap = useTriad((s) => s.snap);
  const patch = useTriad((s) => s.patch);
  const hot = useExperimentRun((s) => s.hot);
  const lit = (name: string) => hot.includes(name);
  return (
    <div className="flex flex-col gap-3 pb-6">
      <p className="text-triad-muted">{snap.fieldNote}</p>
      <CausalChain />
      <p className="kicker">Source controls</p>
      <LogSlider
        name="eRef"
        hot={lit("eRef")}
        label="Source amplitude E0"
        value={p.eRef}
        min={1}
        max={1e22}
        unit="V/m"
        tone={snap.qed.commandedHardware === "hypothetical" ? "hyp" : "model"}
        onChange={(eRef) => patch({ eRef })}
      />
      <p className="text-triad-muted">
        Logarithmic equatorial amplitude at the reference range. The slider reaches past E/Es = 1 only as a command.
        The delivered needle crosses that mark only while Simulate is on. Above 10¹⁵ V/m at the exclusion surface the
        command is SIMULATED.
      </p>
      {snap.qed.commandedHardware === "hypothetical" && (
        <p className="banner text-triad-hyp">SIMULATED — past a plausible source. Not a new equation.</p>
      )}
      {snap.qed.commandedHardware === "laboratory" && (
        <p className="text-triad-muted">Laboratory-class peak. Not an aircraft aperture rating.</p>
      )}
      <Toggle
        label="Simulate this amplitude"
        on={p.simulateAmplitude}
        hyp
        onClick={() => patch({ simulateAmplitude: !p.simulateAmplitude })}
      />
      <p className="text-triad-muted">
        Off: the reservoir clamp scales the Maxwell solution, and the ladder follows that delivered field. On: E0 enters
        the solver and the reservoir is not debited. Joules are not invented. Geometry is not this switch.
      </p>
      <LogSlider label="Frequency" value={p.freqHz} min={1e6} max={3e9} unit="Hz" onChange={(freqHz) => patch({ freqHz })} />
      <p className="kicker">Relative phase A / B / C</p>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((pr) => (
          <button key={pr.id} className="btn" data-on={p.phasePreset === pr.id} onClick={() => patch(presetPatch(pr.id))}>
            {pr.label}
          </button>
        ))}
      </div>
      <Slider name="phaseA" hot={lit("phaseA")} label="Phase A" value={p.phaseA} min={0} max={360} step={1} unit="°" onChange={(phaseA) => patch({ phaseA, phasePreset: "manual" })} />
      <Slider name="phaseB" hot={lit("phaseB")} label="Phase B" value={p.phaseB} min={0} max={360} step={1} unit="°" onChange={(phaseB) => patch({ phaseB, phasePreset: "manual" })} />
      <Slider name="phaseC" hot={lit("phaseC")} label="Phase C" value={p.phaseC} min={0} max={360} step={1} unit="°" onChange={(phaseC) => patch({ phaseC, phasePreset: "manual" })} />
      {p.phasePreset === "drift" && (
        <Slider label="Drift rate" value={p.driftRate} min={0} max={1.5} step={0.01} unit="rad/s" onChange={(driftRate) => patch({ driftRate })} />
      )}
      <p className="text-triad-muted">Degrees at the three emitters. Presets write them. Dragging a slider leaves the preset and keeps the geometry.</p>
      <Select
        label="Polarization"
        value={p.orient}
        options={[
          ["vertical", "Vertical"],
          ["radial", "Radial"],
          ["tangential", "Tangential"],
          ["aimed", "Aimed"],
        ]}
        onChange={(orient) => patch({ orient: orient as Orient })}
      />
      {p.orient === "aimed" && (
        <>
          <Slider label="Aim azimuth" value={p.aimYawDeg} min={-180} max={180} step={1} unit="°" onChange={(aimYawDeg) => patch({ aimYawDeg })} />
          <Slider label="Aim elevation" value={p.aimPitchDeg} min={-10} max={90} step={1} unit="°" onChange={(aimPitchDeg) => patch({ aimPitchDeg })} />
        </>
      )}
      <div className="grid grid-cols-3 gap-2">
        {([1, 2, 3] as const).map((n) => (
          <button key={n} className={`btn ${lit("activeCount") ? "control-hot" : ""}`} data-control="activeCount" data-on={p.activeCount === n} onClick={() => patch({ activeCount: n })}>
            {n} active
          </button>
        ))}
      </div>
      <p className="text-triad-muted">Active count changes the Maxwell sum. It does not by itself choose a QED regime.</p>
      <div className="grid grid-cols-2 gap-2">
        <Stat k="Delivered / command" v={p.simulateAmplitude ? "1 · simulated" : sci(snap.scale)} />
        <Stat
          k="Reservoir"
          v={p.simulateAmplitude ? "not debited" : snap.empty ? "empty" : snap.limited ? "limiting" : "not limiting"}
          tone={!p.simulateAmplitude && snap.limited ? "obs" : "model"}
        />
        <Stat k="Delivered |E|" v={`${sci(snap.qed.ePeak)} V/m`} />
        <Stat k="Commanded |E|" v={`${sci(snap.qed.commandedE)} V/m`} tone={snap.qed.commandedHardware === "hypothetical" ? "hyp" : "model"} />
      </div>
      <Slider label="Reference range" value={p.rRef} min={8} max={80} step={1} unit="m" onChange={(rRef) => patch({ rRef })} />
      <p className="text-triad-muted">
        |p| delivered {sci(snap.pAmp)} C·m. E0 is the amplitude at that range, not the exclusion peak. The face is |Ẽ|.
        Arrows are ⟨S⟩. Helices are not part of the solution.
      </p>
      <Toggle label="Field slice" on={p.showField} onClick={() => patch({ showField: !p.showField })} />
      <Toggle label="Poynting arrows" on={p.showPoynting} onClick={() => patch({ showPoynting: !p.showPoynting })} />
      <QedPlate />
      <StrongFieldLadder />
      <CapturePlate />
      <SchwingerSweepPlate />
      <SweepPlate />
      <div className="plate plate-model p-3">
        <p className="kicker">Cage check · model</p>
        <p>{snap.cage}</p>
        <p className="mt-1 text-triad-muted">{snap.centerNote}</p>
      </div>
      <div className="plate plate-hyp p-3">
        <p className="kicker text-triad-hyp">xPRIMEray-style rays · hypothetical</p>
        <p className="text-triad-muted">
          Conceptual cousin only. First-order march, not the lab RK4 GRIN solver. The law is assumed. Vacuum n = 1 is the
          null control and stays white.
        </p>
        <Toggle label="Ray march" on={p.rayMode} hyp onClick={() => patch({ rayMode: !p.rayMode })} />
        <Select
          label="Constitutive law"
          value={p.constitutive}
          options={[
            ["vacuum", "n = 1 vacuum null"],
            ["e2", "n = 1 + α (|E|/Eref)²"],
            ["energy", "n = 1 + α ⟨u⟩/u(Eref)"],
          ]}
          onChange={(constitutive) => patch({ constitutive: constitutive as Constitutive })}
        />
        <Slider label="α" value={p.dnAlpha} min={0} max={2} step={0.01} unit="" tone="hyp" onChange={(dnAlpha) => patch({ dnAlpha })} />
        <p className="text-triad-hyp">
          Raw n peak {sci(snap.nPeakRaw)} · march clamp {sci(snap.nPeakMarch)} (numerical, not physics)
        </p>
      </div>
    </div>
  );
}

function CausalChain() {
  const q = useTriad((s) => s.snap.qed);
  const cells = [
    ["SOURCE", "amplitude, phase, count"],
    ["MAXWELL", "linear sum"],
    ["INVARIANTS", "ℱ  𝒢"],
    ["QED", q.regime === "CLASSICAL EM" ? "classical" : q.regime === "SCHWINGER-SCALE FIELD" ? "Es scale" : "approaching"],
    ["PAIRS", q.rateApplicable ? "estimated" : "underflow"],
  ];
  return (
    <div>
      <div className="seam-flow" aria-label="Causal chain">
        {cells.map(([k, v]) => (
          <div key={k} className="seam-cell">
            <div className="kicker">{k}</div>
            <div className="text-triad-model">{v}</div>
          </div>
        ))}
      </div>
      <p className="mt-1 text-triad-muted">
        Source controls feed the Maxwell solution. Invariants and the regime are read from that field. Δz120 and Csweep
        are not in this chain.
      </p>
    </div>
  );
}

function QedPlate() {
  const q = useTriad((s) => s.snap.qed);
  const exp = Number.isFinite(q.exponent) ? q.exponent.toExponential(2) : "—";
  return (
    <div className="plate plate-model p-3">
      <p className="kicker">Strong-field QED telemetry · from the delivered field</p>
      <p className="font-sans text-2xl leading-tight text-triad-model">{q.regime}</p>
      <p className="mt-1 text-triad-muted">{q.regimeNote}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Stat k="Peak |E|" v={`${sci(q.ePeak)} V/m`} />
        <Stat k="Peak |B|" v={`${sci(q.bPeak)} T`} />
        <Stat k="|E| / Es" v={q.ePeak > 0 ? q.eOverEs.toExponential(2) : "0"} />
        <Stat k="c|B| / Es" v={q.bPeak > 0 ? q.cBOverEs.toExponential(2) : "0"} />
        <Stat k="ℱ" v={sci(q.F)} />
        <Stat k="𝒢" v={sci(q.G)} />
        <Stat k="ε" v={`${sci(q.eps)} V/m`} />
        <Stat k="β" v={`${sci(q.beta)} V/m`} />
      </div>
      <p className="mt-2 text-triad-muted">
        Es = 1.32×10¹⁸ V/m. ℱ = (c²B² − E²) / 2. 𝒢 = c (E·B). ε and β are the invariant eigenvalues. Es is a
        characteristic scale, not a switch.
      </p>
      <p className="mt-2">{q.where}</p>
      <p className="mt-2">
        Pair approximation: {q.rateApplicable ? `${sci(q.rate)} m⁻³ s⁻¹` : "not numerically applicable"}. Exponent −π Es/ε = −
        {exp}. Constant-field series, not an RF integral and not a switch.
      </p>
      <p className="text-triad-muted">{q.pairNote}</p>
      {q.simulated && <p className="mt-2 text-triad-hyp">SIMULATED / HYPOTHETICAL. This amplitude is in the solver and not in the energy ledger.</p>}
      {!q.simulated && q.commandedHardware === "hypothetical" && (
        <p className="mt-2 text-triad-muted">
          Commanded peak is about {sci(q.commandedE)} V/m and would be simulated. The delivered telemetry above is still
          the reservoir-limited field.
        </p>
      )}
    </div>
  );
}

function StrongFieldLadder() {
  const q = useTriad((s) => s.snap.qed);
  const p = useTriad((s) => s.params);
  const lo = -8;
  const hi = 2;
  const log = q.ePeak > 0 ? Math.log10(Math.max(q.eOverEs, 1e-30)) : lo;
  const pos = (x: number) => `${Math.min(100, Math.max(0, ((x - lo) / (hi - lo)) * 100))}%`;
  const bracket = log < -4 ? "CLASSICAL EM" : log < 0 ? "STRONG-FIELD QED" : "E/Es = 1";
  const rungs = ["CLASSICAL EM", "STRONG-FIELD QED", "E/Es = 1", "PAIR PRODUCTION"];
  return (
    <div className="plate plate-model p-3">
      <p className="kicker">Strong-field ladder · log10 of delivered |E| / Es</p>
      <div className="relative mt-3 h-10">
        <div className="absolute inset-x-0 top-3 h-2 rounded-sm border border-triad-line bg-triad-bg" />
        <div className="absolute top-2 h-4 w-px bg-triad-obs" style={{ left: pos(-4) }} />
        <div className="absolute top-1 h-6 w-px bg-triad-model" style={{ left: pos(0) }} />
        <div className="absolute top-0 h-8 w-0.5 bg-triad-model" style={{ left: pos(log) }} />
      </div>
      <div className="mt-1 grid grid-cols-4 gap-1">
        {rungs.map((name) => (
          <p key={name} className={`kicker ${name === bracket ? "text-triad-model" : ""}`}>
            {name}
          </p>
        ))}
      </div>
      <div className="mt-2 flex items-stretch gap-2">
        <p className="flex-1 text-triad-muted">
          Needle at {q.ePeak > 0 ? `10^${Math.min(log, 99).toFixed(1)}` : "no field"}. {bracket}. Pair production here is
          the constant-field approximation beside the mark. It is not a mode the solver enters.
        </p>
        <div className="seam-cell gap shrink-0">
          <div className="kicker text-triad-hyp">?????</div>
          <div className="text-triad-model">no derivation</div>
        </div>
      </div>
      <p className="mt-2 text-triad-muted">
        Crossing E/Es = 1 does not arm the vacuum bore, a metric response, a displacement, or a portal.
        {q.simulated && q.hardware === "hypothetical" ? " This delivered field is SIMULATED." : ""}
        {!p.simulateAmplitude && q.commandedHardware === "hypothetical"
          ? " The command would cross the mark only with Simulate on. The needle is the clamped delivery."
          : ""}
      </p>
    </div>
  );
}

function CapturePlate() {
  const a = useTriad((s) => s.captureA);
  const b = useTriad((s) => s.captureB);
  const freeze = useTriad((s) => s.freeze);
  const clearCaptures = useTriad((s) => s.clearCaptures);
  const same = a && b ? holdsMatch(a, b) : false;
  const cmp =
    a && b
      ? compareCaptures(
          {
            eRef: a.eRef,
            ePeak: a.qed.ePeak,
            bPeak: a.qed.bPeak,
            eOverEs: a.qed.eOverEs,
            cBOverEs: a.qed.cBOverEs,
            F: a.qed.F,
            G: a.qed.G,
            exponent: a.qed.exponent,
            rate: a.qed.rate,
            rateApplicable: a.qed.rateApplicable,
            regime: a.qed.regime,
            cSweep: a.cSweep,
            dz120: a.dz120,
            radius: a.radius,
            omega: a.omega,
          },
          {
            eRef: b.eRef,
            ePeak: b.qed.ePeak,
            bPeak: b.qed.bPeak,
            eOverEs: b.qed.eOverEs,
            cBOverEs: b.qed.cBOverEs,
            F: b.qed.F,
            G: b.qed.G,
            exponent: b.qed.exponent,
            rate: b.qed.rate,
            rateApplicable: b.qed.rateApplicable,
            regime: b.qed.regime,
            cSweep: b.cSweep,
            dz120: b.dz120,
            radius: b.radius,
            omega: b.omega,
          },
        )
      : "Freeze A, change only E0, freeze B. Geometry and the controller should match so the table is an amplitude sweep.";
  const rows =
    a && b
      ? [
          row("E0", sci(a.eRef), sci(b.eRef), false),
          row("|E|", sci(a.qed.ePeak), sci(b.qed.ePeak), false),
          row("|B|", sci(a.qed.bPeak), sci(b.qed.bPeak), false),
          row("E/Es", a.qed.eOverEs.toExponential(2), b.qed.eOverEs.toExponential(2), false),
          row("cB/Es", a.qed.cBOverEs.toExponential(2), b.qed.cBOverEs.toExponential(2), false),
          row("ℱ", sci(a.qed.F), sci(b.qed.F), false),
          row("𝒢", sci(a.qed.G), sci(b.qed.G), false),
          row("exponent", fmtExp(a.qed.exponent), fmtExp(b.qed.exponent), false),
          row("pair approx", a.qed.rateApplicable ? sci(a.qed.rate) : "underflow", b.qed.rateApplicable ? sci(b.qed.rate) : "underflow", false),
          row("R", a.radius.toFixed(0), b.radius.toFixed(0), true),
          row("ω", a.omega.toFixed(2), b.omega.toFixed(2), true),
          row("speed", a.speed.toFixed(0), b.speed.toFixed(0), true),
          row("f", sci(a.freqHz), sci(b.freqHz), true),
          row("pol", a.orient, b.orient, true),
          row("count", String(a.activeCount), String(b.activeCount), true),
          row("phase", `${a.phaseA.toFixed(0)}/${a.phaseB.toFixed(0)}/${a.phaseC.toFixed(0)}`, `${b.phaseA.toFixed(0)}/${b.phaseB.toFixed(0)}/${b.phaseC.toFixed(0)}`, true),
          row("frame", a.frame, b.frame, true),
          row("mode", a.mode, b.mode, true),
        ]
      : [];
  return (
    <div className="plate plate-model p-3">
      <p className="kicker">Freeze A / Freeze B</p>
      <p className="text-triad-muted">
        {a && b
          ? same
            ? "Geometry and control match. Read the field rows as an amplitude comparison."
            : "Geometry or control does not match. Do not read this pair as an amplitude-only sweep."
          : "Change only the source amplitude between the two freezes."}
      </p>
      <p className="mt-1 text-triad-muted">{cmp}</p>
      {rows.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="kicker">
                <th />
                <th>A</th>
                <th>B</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.k} className="border-t border-triad-line">
                  <td className="kicker py-1 pr-2">{r.k}</td>
                  <td className={`py-1 pr-2 ${r.hold && r.a !== r.b ? "text-triad-hyp" : ""}`}>{r.a}</td>
                  <td className={`py-1 ${r.hold && r.a !== r.b ? "text-triad-hyp" : ""}`}>{r.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-2 grid grid-cols-3 gap-2">
        <button className="btn" onClick={() => freeze("a")}>
          Freeze A
        </button>
        <button className="btn" onClick={() => freeze("b")}>
          Freeze B
        </button>
        <button className="btn" onClick={() => clearCaptures()}>
          Clear
        </button>
      </div>
    </div>
  );
}

function row(k: string, a: string, b: string, hold: boolean) {
  return { k, a, b, hold };
}

function fmtExp(n: number) {
  return Number.isFinite(n) ? n.toExponential(2) : "—";
}

function holdsMatch(a: FrozenState, b: FrozenState) {
  const n = (x: number, y: number, tol: number) => Math.abs(x - y) <= tol;
  return (
    n(a.radius, b.radius, 1e-6) &&
    n(a.omega, b.omega, 1e-9) &&
    n(a.speed, b.speed, 1e-6) &&
    n(a.freqHz, b.freqHz, 1) &&
    a.orient === b.orient &&
    a.activeCount === b.activeCount &&
    n(a.phaseA, b.phaseA, 0.51) &&
    n(a.phaseB, b.phaseB, 0.51) &&
    n(a.phaseC, b.phaseC, 0.51) &&
    a.frame === b.frame &&
    a.mode === b.mode &&
    n(a.latencyMs, b.latencyMs, 1e-6) &&
    n(a.aMax, b.aMax, 1e-6)
  );
}

function SchwingerSweepPlate() {
  const sweep = useTriad((s) => s.sweep);
  const runSweep = useTriad((s) => s.runSweep);
  const clearSweep = useTriad((s) => s.clearSweep);
  const bore = useTriad((s) => s.params.vacuumBore);
  const keys = [-4, -2, 0, 1];
  const picked = sweep ? keys.map((log) => sweep.points.find((p) => Math.abs(Math.log10(p.eOverEs) - log) < 1e-6)).filter((p) => p != null) : [];
  return (
    <div className="plate plate-model p-3">
      <p className="kicker">Schwinger sweep · amplitude only</p>
      <p className="text-triad-muted">
        Freezes aircraft, controller, and geometry at the click, then scales only commanded E0 through several decades
        around E/Es = 1. The live aircraft is not moved. Vacuum bore stays {bore ? "on, because you turned it on" : "off"}.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button className="btn" onClick={() => runSweep()}>
          Run sweep
        </button>
        <button className="btn" onClick={() => clearSweep()}>
          Clear
        </button>
      </div>
      {sweep && <SweepChart sweep={sweep} picked={picked} />}
    </div>
  );
}

function SweepChart({
  sweep,
  picked,
}: {
  sweep: SchwingerSweep;
  picked: SchwingerSweep["points"];
}) {
  const data = sweep.points.map((p) => ({
    e0: p.e0,
    chi: p.eOverEs,
    rate: p.applicable && p.rate > 0 ? p.rate : null,
  }));
  return (
    <div className="mt-3">
      <p className="text-triad-muted">{sweep.note}</p>
      <p className="mt-1 text-triad-muted">
        Frozen t {sweep.t.toFixed(1)} s · R {sweep.radius.toFixed(0)} m · ω {sweep.omega.toFixed(2)} · {sweep.speed.toFixed(0)} m/s · phases {sweep.phaseA.toFixed(0)}/{sweep.phaseB.toFixed(0)}/{sweep.phaseC.toFixed(0)} · {sweep.activeCount} active · {sweep.orient}
      </p>
      {data.length > 0 && (
        <div className="mt-2 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke={PAL.line} strokeDasharray="3 3" />
              <XAxis
                dataKey="e0"
                type="number"
                scale="log"
                domain={["auto", "auto"]}
                tickFormatter={(v) => Number(v).toExponential(0)}
                stroke={PAL.line}
                tick={{ fill: PAL.model, fontSize: 10 }}
              />
              <YAxis
                yAxisId="chi"
                scale="log"
                domain={["auto", "auto"]}
                tickFormatter={(v) => Number(v).toExponential(0)}
                stroke={PAL.model}
                tick={{ fill: PAL.model, fontSize: 10 }}
                width={46}
              />
              <YAxis
                yAxisId="rate"
                orientation="right"
                scale="log"
                domain={["auto", "auto"]}
                tickFormatter={(v) => Number(v).toExponential(0)}
                stroke={PAL.obs}
                tick={{ fill: PAL.obs, fontSize: 10 }}
                width={46}
              />
              <Tooltip
                contentStyle={{ background: PAL.surface, border: `1px solid ${PAL.line}`, fontSize: 12 }}
                formatter={(v, name) => [Number(v).toExponential(2), name === "chi" ? "E/Es" : "pair approx"]}
                labelFormatter={(e0) => `E0 ${Number(e0).toExponential(2)} V/m`}
              />
              <ReferenceLine yAxisId="chi" y={1} stroke={PAL.obs} />
              {Number.isFinite(sweep.simulatedAboveE0) && (
                <ReferenceLine x={sweep.simulatedAboveE0} yAxisId="chi" stroke={PAL.hyp} />
              )}
              <Line yAxisId="chi" type="linear" dataKey="chi" stroke={PAL.model} dot={false} strokeWidth={1.6} isAnimationActive={false} />
              <Line yAxisId="rate" type="linear" dataKey="rate" stroke={PAL.obs} dot={false} strokeWidth={1.4} connectNulls={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="kicker">White: E/Es, straight on a log-log plot. Blue: pair approximation, only where it fits in double range. Blue tick at E/Es = 1. Red tick: exclusion |E| = 10¹⁵ V/m, SIMULATED past that command.</p>
      {picked.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="kicker">
                <th>E/Es</th>
                <th>E0</th>
                <th>pair approximation</th>
              </tr>
            </thead>
            <tbody>
              {picked.map((p) => (
                <tr key={p.eOverEs} className="border-t border-triad-line">
                  <td className="py-1">{p.eOverEs.toExponential(0)}</td>
                  <td className="py-1">{p.e0.toExponential(2)}</td>
                  <td className="py-1">{p.applicable ? sci(p.rate) : "underflow"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EnergyTab() {
  const p = useTriad((s) => s.params);
  const snap = useTriad((s) => s.snap);
  const patch = useTriad((s) => s.patch);
  const frac = snap.eChem0 > 0 ? snap.eChem / snap.eChem0 : 0;
  return (
    <div className="flex flex-col gap-3 pb-6">
      <p className="text-triad-muted">
        Optional historical preset: 221 kg at an illustrative 200 Wh/kg lithium-ion class figure. This is not a claim
        that those batteries existed for this purpose, powered a radiator, or had anything to do with a disappearance.
        Mean power if the whole reservoir is emptied in Δt is not a pulse rating.
      </p>
      <button
        className="btn"
        onClick={() => patch({ massKg: 221, specificWh: 200, durationS: 600, efficiency: 0.3 })}
      >
        Load 221 kg preset
      </button>
      <Slider label="Mass" value={p.massKg} min={1} max={2000} step={1} unit="kg" onChange={(massKg) => patch({ massKg })} />
      <Slider label="Specific energy" value={p.specificWh} min={20} max={400} step={1} unit="Wh/kg" onChange={(specificWh) => patch({ specificWh })} />
      <Slider label="Discharge window Δt" value={p.durationS} min={1} max={7200} step={1} unit="s" onChange={(durationS) => patch({ durationS })} />
      <Slider label="Conversion η" value={p.efficiency} min={0.05} max={1} step={0.01} unit="" onChange={(efficiency) => patch({ efficiency })} />
      <Toggle label="Enforce power ceiling" on={p.enforceBudget} onClick={() => patch({ enforceBudget: !p.enforceBudget })} />
      <div className="grid grid-cols-2 gap-2">
        <Stat k="E available" v={joules(snap.eChem0)} />
        <Stat k="E remaining" v={joules(snap.eChem)} />
        <Stat k="P budget" v={watts(snap.pBudget)} />
        <Stat k="P draw now" v={watts(snap.pDraw)} />
        <Stat k="P radiated" v={watts(snap.pRad)} tone="obs" />
        <Stat k="Empty at command" v={seconds(snap.timeToEmptyCmd)} />
      </div>
      <div className="gauge" aria-label="Reservoir remaining">
        <i style={{ left: `${frac * 100}%` }} />
      </div>
      <p className="text-triad-muted">
        E = mass × specific energy. P budget = E / Δt. Electrical draw = P_rad / η. Poynting power is the sum of three
        independent Hertzian radiators — mutual impedance omitted, reactive near-field energy not an extra source. The
        model does not manufacture joules. Delivered / commanded field = {sci(snap.scale)}.
        {p.simulateAmplitude ? " Simulate is on: P draw is the command, not a debit, and it does not set the regime by itself." : ""}
      </p>
      {snap.empty && p.simulateAmplitude && (
        <p className="text-triad-hyp">Reservoir empty. The simulated amplitude is still in the Maxwell solution. The ledger did not pay for it.</p>
      )}
      {snap.empty && !p.simulateAmplitude && <p className="text-triad-model">Reservoir empty. Delivered field is zero.</p>}
    </div>
  );
}

function HypothesisTab() {
  const p = useTriad((s) => s.params);
  const snap = useTriad((s) => s.snap);
  const patch = useTriad((s) => s.patch);
  return (
    <div className="flex flex-col gap-3 pb-6">
      <div className="plate plate-hyp p-3">
        <p className="kicker text-triad-hyp">Vacuum bore · hypothesis</p>
        <p className="text-triad-muted">
          A swept cylindrical volume around and just ahead of the aircraft. It is not the emitter helix, not a field
          line, and not an output of the Maxwell solver. It is not an instantaneous portal. Reaching Es, or a nonzero
          pair estimate, does not enable this layer and does not make it a metric.
        </p>
        <Toggle label="Vacuum bore" on={p.vacuumBore} hyp onClick={() => patch({ vacuumBore: !p.vacuumBore })} />
      </div>
      <div className="plate plate-hyp p-3">
        <p className="kicker text-triad-hyp">Forbes-associated architecture · hypothesis</p>
        <p className="text-triad-muted">
          Three-node rotation, a plasma / FRC / DPF-style picture, a possible scanning reading of the orbit, an optional
          destination marker, and an optional vacuum gain. None of this is established, and none of it moves the aircraft.
        </p>
        <Toggle label="Arm Forbes module" on={p.ashton} hyp onClick={() => patch({ ashton: !p.ashton })} />
        <Toggle label="Plasma cosmetic shell" on={p.plasmaCosmetic} hyp onClick={() => patch({ plasmaCosmetic: !p.plasmaCosmetic })} />
        <p className="text-triad-muted">The shell is paint. It is not in the field solver and not in the energy budget.</p>
        <LogSlider
          label="Assumed gain"
          value={p.vacuumGain}
          min={1}
          max={1e18}
          unit="×"
          tone="hyp"
          onChange={(vacuumGain) => patch({ vacuumGain })}
        />
        <p className="text-triad-hyp">
          Assumed gain {sci(p.vacuumGain, 0)}× is recorded on this plate only. It is not multiplied into peak |E|, the
          invariants, the pair estimate, or the energy ledger.
        </p>
        <Toggle label="Destination anchor" on={p.anchor} hyp onClick={() => patch({ anchor: !p.anchor })} />
        <Slider label="Anchor range" value={p.anchorKm} min={0.5} max={2000} step={0.5} unit="km" tone="hyp" onChange={(anchorKm) => patch({ anchorKm })} />
        <Slider label="Anchor bearing" value={p.anchorBearing} min={0} max={360} step={1} unit="°" tone="hyp" onChange={(anchorBearing) => patch({ anchorBearing })} />
        <p className="text-triad-muted">
          Bearing draws a short red dashed aim axis on the aircraft, a few fuselage lengths long, labeled hypothesis /
          not a transport path. Range is not drawn at world scale. It moves a marker in the compressed plan inset.
          Neither number enters Maxwell, the pair estimate, the energy ledger, or the controller.
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Stat k="Bore ↔ dest" v={angleText(snap.axes.boreDestDeg)} tone="hyp" />
          <Stat k="Body ↔ dest" v={angleText(snap.axes.bodyDestDeg)} tone="hyp" />
          <Stat k="Velocity ↔ dest" v={angleText(snap.axes.velDestDeg)} tone="hyp" />
        </div>
        <p className="mt-2 text-triad-muted">{snap.axes.note}</p>
      </div>
      <div className="plate plate-hyp p-3">
        <p className="kicker text-triad-hyp">Ponder-associated control questions · hypothesis</p>
        <p className="text-triad-muted">
          Acquisition, phase lock, feedback, delay, and whether a predetermined track can be told apart from active
          tracking. The classifier below is interpretive. It is not an onboard computer.
        </p>
        <Toggle label="Arm Ponder module" on={p.drew} hyp onClick={() => patch({ drew: !p.drew })} />
        <Slider
          label="Coherence threshold"
          value={p.coherenceDeg}
          min={1}
          max={40}
          step={0.5}
          unit="°"
          tone="hyp"
          onChange={(coherenceDeg) => patch({ coherenceDeg })}
        />
        <Stat k="Classifier" v={snap.acquisition} tone="hyp" />
        <p className="mt-2 text-triad-muted">{snap.lockNote}</p>
      </div>
      <div className="plate p-3">
        <p className="kicker">Where the two pictures meet</p>
        <p>{overlap(p, snap.gapErrDeg, snap.phaseErrDeg)}</p>
      </div>
    </div>
  );
}

function angleText(deg: number) {
  return Number.isFinite(deg) ? `${deg.toFixed(1)}°` : "—";
}

function overlap(p: Params, gap: number, phase: number): string {
  const scan = Math.abs(p.orbitRate) / (2 * Math.PI);
  const delay = Math.max(0.05, p.latencyMs / 1000);
  if (!p.ashton && !p.drew) {
    return "Neither hypothesis module is in the circuit. You are looking at kinematics plus an illustrative Hertzian model.";
  }
  if (p.ashton && p.drew) {
    const tension =
      scan > 0.25 / delay
        ? "Tension: the orbital rate is fast relative to the delayed loop. A scanning story and a phase lock compete."
        : "At this rate the loop can hold geometry. That still does not create a vacuum coupling.";
    return `Overlap: both pictures want a phase-stable ~120° triad. ${tension} Gain does not improve lock (${gap.toFixed(1)}° gap, ${phase.toFixed(1)}° slip). Lock does not create a field, and neither number validates the vacuum bore.`;
  }
  if (p.ashton) {
    return "Forbes module is armed: rotation, optional cosmetic shell, an assumed gain that is not in the solver, optional anchor. Maxwell and the strong-field telemetry ignore that gain.";
  }
  return "Ponder module is armed. It scores search, acquire, track, and phase-lock from errors and latency. It adds no field mechanism.";
}

function SeamTab() {
  const snap = useTriad((s) => s.snap);
  const p = useTriad((s) => s.params);
  const q = snap.qed;
  const ratio = (n: number, on: boolean) => (on ? n.toExponential(2) : "0");
  const pair = q.rateApplicable
    ? `Constant-field series, n = 1…4: ${sci(q.rate)} m⁻³ s⁻¹. Illustrative. No vacuum back-reaction. Not an RF-cycle integral.`
    : q.pairNote;
  return (
    <div className="flex flex-col gap-2 pb-8">
      <Plate
        tone="model"
        k="Maxwell"
        v={`Linear Hertzian superposition of the sources that are on. Peak |E| ${sci(q.ePeak)} V/m · peak |B| ${sci(q.bPeak)} T. Mutual impedance omitted. This is not a tunnel.`}
      />
      <Arrow />
      <Plate
        tone="model"
        k="Strong-field QED"
        v={`${q.regime}. |E|/Es = ${ratio(q.eOverEs, q.ePeak > 0)}. c|B|/Es = ${ratio(q.cBOverEs, q.bPeak > 0)}. ℱ = ${sci(q.F)}. 𝒢 = ${sci(q.G)}. Read only from the delivered field. Es = 1.32×10¹⁸ V/m is a characteristic scale, not a broken limit and not a switch. Δz120 and Csweep do not set this label.`}
      />
      <Arrow />
      <Plate tone="model" k="Pair production" v={pair} />
      <Arrow />
      <div className="plate-gap gap-pulse rounded-sm p-3">
        <p className="kicker text-triad-hyp">?????????????????</p>
        <p className="font-sans text-2xl leading-tight text-triad-model">No known derivation crosses this seam.</p>
        <p className="mt-1 text-triad-muted">Not implemented. The instrument will not invent a constitutive law, a metric response, or a displacement rule that starts from pairs.</p>
      </div>
      <Arrow />
      <Plate
        tone="hyp"
        k="Hypothetical vacuum conditioning"
        v={
          p.vacuumBore
            ? "On only because the vacuum-bore toggle is on. Swept cylinder plus a short lead. Reaching Es or a nonzero pair estimate does not enable it and does not validate it."
            : "Off unless the vacuum-bore toggle is on. Reaching Es or a nonzero pair estimate does not enable it."
        }
      />
    </div>
  );
}

function Plate({ tone, k, v }: { tone: "obs" | "model" | "hyp"; k: string; v: string }) {
  const cls = tone === "obs" ? "plate-obs" : tone === "hyp" ? "plate-hyp" : "plate-model";
  return (
    <div className={`plate ${cls} p-3`}>
      <p className={`kicker ${tone === "obs" ? "text-triad-obs" : tone === "hyp" ? "text-triad-hyp" : ""}`}>{k}</p>
      <p>{v}</p>
    </div>
  );
}

function Arrow() {
  return <div className="kicker pl-3 text-triad-muted">↓</div>;
}

function ObserveTab() {
  const p = useTriad((s) => s.params);
  const snap = useTriad((s) => s.snap);
  const patch = useTriad((s) => s.patch);
  const publish = useTriad((s) => s.publish);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  return (
    <div className="flex flex-col gap-3 pb-6">
      <p className="text-triad-muted">
        Architectural room for trajectories reconstructed from video. Nothing here assumes the pictures are genuine.
        Blue marks are observation: the predetermined ring, a ground camera, or an imported sample. White marks are the
        model.
      </p>
      <p className="kicker">Viewpoint</p>
      <div className="grid grid-cols-3 gap-2">
        {VIEWS.map((v) => (
          <button key={v.id} className="btn" data-on={p.viewpoint === v.id} onClick={() => patch({ viewpoint: v.id })}>
            {v.label}
          </button>
        ))}
      </div>
      <p className="text-triad-muted">Drag to orbit. Picking a viewpoint locks the camera again.</p>
      <Slider label="Sampling cadence" value={p.cadenceHz} min={1} max={120} step={1} unit="Hz" tone="obs" onChange={(cadenceHz) => patch({ cadenceHz })} />
      <Slider label="Time offset" value={p.timeOffsetS} min={0} max={2} step={0.01} unit="s" tone="obs" onChange={(timeOffsetS) => patch({ timeOffsetS })} />
      <p className="text-triad-obs">{snap.cadenceNote}</p>
      <div className="grid grid-cols-3 gap-2">
        <Stat k="N1–N2" v={`${snap.sepDeg[0].toFixed(1)}°`} tone="obs" />
        <Stat k="N2–N3" v={`${snap.sepDeg[1].toFixed(1)}°`} tone="obs" />
        <Stat k="N3–N1" v={`${snap.sepDeg[2].toFixed(1)}°`} tone="obs" />
      </div>
      <p className="text-triad-muted">Apparent angular separations from the current camera. A 120° formation does not subtend 120° on a sensor.</p>
      <Toggle
        label="Show predetermined track"
        on={p.showPredetermined}
        onClick={() => patch({ showPredetermined: !p.showPredetermined })}
      />
      <p className="kicker">Import</p>
      <textarea className="instrument" value={text} onChange={(e) => setText(e.target.value)} placeholder='{"provenance":"...","samples":[{"t":0,"ax":0,"ay":10668,"az":0}]}' />
      <div className="flex flex-wrap gap-2">
        <button
          className="btn"
          onClick={() => {
            const fixture = nominalFixture();
            setText(JSON.stringify(fixture, null, 2));
            engine.loadImport(fixture);
            setErr("");
            publish();
          }}
        >
          Synthetic fixture
        </button>
        <button
          className="btn"
          onClick={() => {
            try {
              const parsed = JSON.parse(text) as { provenance?: string; samples?: unknown[] };
              if (!parsed || !Array.isArray(parsed.samples)) throw new Error("Need a samples array.");
              engine.loadImport({
                provenance: parsed.provenance || "User import — not authenticated footage.",
                samples: parsed.samples as { t: number; ax: number; ay: number; az: number; n?: number[][] }[],
              });
              setErr("");
              publish();
            } catch (e) {
              setErr(e instanceof Error ? e.message : "Could not parse.");
            }
          }}
        >
          Overlay import
        </button>
        <button
          className="btn"
          onClick={() => {
            engine.loadImport(null);
            setErr("");
            publish();
          }}
        >
          Clear
        </button>
      </div>
      {err && <p className="text-triad-hyp">{err}</p>}
      {snap.importCount > 0 && (
        <p className="text-triad-obs">
          {snap.importCount} samples. Residual vs model aircraft {snap.importResidual.toFixed(1)} m. {snap.importProvenance}
        </p>
      )}
    </div>
  );
}

function NodesTab() {
  const nodes = useTriad((s) => s.snap.nodes);
  return (
    <div className="pb-6">
      <p className="mb-2 text-triad-muted">
        Live model state. Amplitude is delivered E ref, not the local peak. Latency is the controller delay, zero in
        scripted mode. Two-only parks N3 and drops it from the 120° score.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left">
          <thead>
            <tr className="kicker">
              {["N", "Range", "Brg", "Speed", "Accel", "Orbit", "EM", "E ref", "Err", "Lat"].map((h) => (
                <th key={h} className="px-1 py-2 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nodes.map((n) => (
              <tr key={n.id} className="border-t border-triad-line">
                <td className="px-1 py-2 text-triad-model">N{n.id}</td>
                <td className="px-1 py-2">{n.range.toFixed(1)}</td>
                <td className="px-1 py-2 text-triad-obs">{n.bearingDeg.toFixed(0)}°</td>
                <td className="px-1 py-2">{n.speed.toFixed(0)}</td>
                <td className="px-1 py-2">{n.accel.toFixed(0)}</td>
                <td className="px-1 py-2">{n.orbitDeg.toFixed(0)}°</td>
                <td className="px-1 py-2">{n.emDeg.toFixed(0)}°</td>
                <td className="px-1 py-2">{sci(n.ampVm, 1)}</td>
                <td className="px-1 py-2">{n.trackErr.toFixed(1)}</td>
                <td className="px-1 py-2">{n.latencyMs.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ k, v, tone = "model" }: { k: string; v: string; tone?: "model" | "obs" | "hyp" }) {
  const c = tone === "obs" ? "text-triad-obs" : tone === "hyp" ? "text-triad-hyp" : "text-triad-model";
  return (
    <div className="plate px-2 py-2">
      <div className="kicker">{k}</div>
      <div className={c}>{v}</div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  tone = "model",
  onChange,
  hot = false,
  name,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  tone?: "model" | "obs" | "hyp";
  onChange: (v: number) => void;
  hot?: boolean;
  name?: string;
}) {
  return (
    <label className={`field ${hot ? "control-hot" : ""}`} data-control={name}>
      <span className="field-row">
        <span className="kicker">{label}</span>
        <span className={tone === "hyp" ? "text-triad-hyp" : tone === "obs" ? "text-triad-obs" : "text-triad-model"}>
          {value.toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)} {unit}
        </span>
      </span>
      <input
        className={tone === "hyp" ? "range-hyp" : tone === "obs" ? "range-obs" : ""}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function LogSlider({
  label,
  value,
  min,
  max,
  unit,
  tone = "model",
  onChange,
  hot = false,
  name,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  tone?: "model" | "obs" | "hyp";
  onChange: (v: number) => void;
  hot?: boolean;
  name?: string;
}) {
  const safe = Math.min(max, Math.max(min, value));
  return (
    <label className={`field ${hot ? "control-hot" : ""}`} data-control={name}>
      <span className="field-row">
        <span className="kicker">{label}</span>
        <span className={tone === "hyp" ? "text-triad-hyp" : "text-triad-model"}>
          {sci(safe)} {unit}
        </span>
      </span>
      <input
        className={tone === "hyp" ? "range-hyp" : "range-obs"}
        type="range"
        min={Math.log10(min)}
        max={Math.log10(max)}
        step={0.01}
        value={Math.log10(safe)}
        onChange={(e) => onChange(10 ** Number(e.target.value))}
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span className="kicker">{label}</span>
      <select className="instrument" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, on, onClick, hyp = false }: { label: string; on: boolean; onClick: () => void; hyp?: boolean }) {
  return (
    <button className={`btn ${hyp ? "btn-hyp" : ""} mt-1 w-full text-left`} data-on={on} onClick={onClick}>
      {on ? "On" : "Off"} · {label}
    </button>
  );
}
