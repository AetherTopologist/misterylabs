/**
 * Preset runner. It does not step the integrator except for one Schwinger
 * calibration step inside begin(). The page clock remains the only loop.
 * Before each of those steps, controls are written through experimentHost.
 */
import { create } from "zustand";
import { engine } from "./engine";
import { experimentHost, type ControlCheckpoint } from "./experimentHost";
import { compareCaptures, type CaptureSide } from "./qed";
import { nullCopy, presetById, type NullVar, type PresetId, type ScriptCtx } from "./presets";
import { buildResult, sampleOf, type ResultCard, type RunSample } from "./runResult";
import { useTriad } from "./store";
import type { FrozenState, Params, Snapshot } from "./types";

export type RunStatus = "idle" | "running" | "paused" | "done";

export type Mark = { t: number; label: string };

export type SweepSample = { t: number; ePeak: number; chi: number; exponent: number };

type Stamp = {
  radius: number;
  omega: number;
  seat: number;
  speed: number;
  tas: number;
  mode: string;
  frame: string;
  aMax: number;
  latency: number;
  phaseA: number;
  phaseB: number;
  phaseC: number;
  activeCount: number;
  eRef: number;
  gaps: number[];
  vacuumBore: boolean;
  anchor: boolean;
};

type RunFields = {
  status: RunStatus;
  presetId: PresetId | null;
  armedId: PresetId | null;
  speed: 1 | 0.25;
  changing: string;
  held: string;
  prediction: string;
  watch: string;
  observed: string;
  event: string;
  marks: Mark[];
  hot: string[];
  nullVar: NullVar;
  geometryFlag: string;
  comparison: string;
  samples: SweepSample[];
  result: ResultCard | null;
};

type RunActions = {
  select: (id: PresetId) => void;
  setNullVar: (v: NullVar) => void;
  begin: (speed?: 1 | 0.25) => void;
  pause: () => void;
  resume: () => void;
  restore: () => void;
};

const empty: RunFields = {
  status: "idle",
  presetId: null,
  armedId: null,
  speed: 1,
  changing: "",
  held: "",
  prediction: "",
  watch: "",
  observed: "",
  event: "",
  marks: [],
  hot: [],
  nullVar: "amplitude",
  geometryFlag: "",
  comparison: "",
  samples: [],
  result: null,
};

export const useExperimentRun = create<RunFields & RunActions>(() => ({
  ...empty,
  select,
  setNullVar,
  begin,
  pause,
  resume,
  restore,
}));

let status: RunStatus = "idle";
let presetId: PresetId | null = null;
let armedId: PresetId | null = null;
let speed: 1 | 0.25 = 1;
let changing = "";
let held = "";
let prediction = "";
let watch = "";
let observed = "";
let event = "";
let marks: Mark[] = [];
let hot: string[] = [];
let nullVar: NullVar = "amplitude";
let geometryFlag = "";
let comparison = "";
let samples: SweepSample[] = [];
let result: ResultCard | null = null;
let trace: RunSample[] = [];
let checkpoint: ControlCheckpoint | null = null;
let origin = 0;
let didA = false;
let didB = false;
let pendingB = false;
let stampA: Stamp | null = null;
let sampleAcc = 0;
let uiAcc = 0;
let ctx: ScriptCtx = { eAtUnity: 0, nullVar: "amplitude" };

function sync(force = false) {
  uiAcc += 1;
  if (!force && uiAcc < 6) return;
  uiAcc = 0;
  useExperimentRun.setState({
    status,
    presetId,
    armedId,
    speed,
    changing,
    held,
    prediction,
    watch,
    observed,
    event,
    marks: marks.slice(),
    hot: hot.slice(),
    nullVar,
    geometryFlag,
    comparison,
    samples: samples.slice(),
    result,
  });
}

function describe(id: PresetId) {
  const def = presetById(id);
  const copy = id === "null" ? nullCopy(nullVar) : { changing: def.changing, prediction: def.prediction };
  changing = copy.changing;
  prediction = copy.prediction;
  held = def.held;
  watch = def.watch;
  hot = def.hot({ ...ctx, nullVar });
}

function select(id: PresetId) {
  if (status === "running" || status === "paused") return;
  if (status === "done" && id !== presetId) {
    status = "idle";
    event = "";
    observed = "";
    marks = [];
    comparison = "";
    geometryFlag = "";
    samples = [];
    result = null;
    presetId = null;
  }
  armedId = id;
  describe(id);
  sync(true);
}

function setNullVar(v: NullVar) {
  nullVar = v;
  ctx = { ...ctx, nullVar: v };
  if (status === "running" || status === "paused") return;
  if (armedId === "null" || presetId === "null") describe("null");
  sync(true);
}

function begin(nextSpeed: 1 | 0.25 = 1) {
  const id = armedId ?? presetId;
  if (!id) return;
  if (status === "running") return;
  const def = presetById(id);
  if (!checkpoint) checkpoint = experimentHost.checkpoint();
  speed = nextSpeed;
  presetId = id;
  armedId = id;
  result = null;
  trace = [];
  ctx = { eAtUnity: 0, nullVar };
  const base = def.baseline(ctx);
  experimentHost.setControls({ ...base, running: true, timeScale: speed });
  experimentHost.reset();
  if (def.id === "schwinger") {
    experimentHost.step(1 / 60);
    const one = engine.schwingerSweep().points.find((p) => Math.abs(p.eOverEs - 1) < 1e-6);
    ctx = { ...ctx, eAtUnity: one?.e0 ?? 0 };
    experimentHost.clearHistory();
    if (!(ctx.eAtUnity > 0)) {
      status = "done";
      observed = "Could not calibrate E/Es = 1 from the current sources. Vacuum bore and anchor were not armed.";
      event = "";
      experimentHost.stop();
      describe(id);
      sync(true);
      return;
    }
  } else {
    experimentHost.clearHistory();
  }
  origin = experimentHost.now();
  didA = false;
  didB = false;
  pendingB = false;
  stampA = null;
  marks = [];
  samples = [];
  trace = [];
  result = null;
  sampleAcc = 0;
  event = "";
  comparison = "";
  geometryFlag = "";
  status = "running";
  describe(id);
  const opening = def.at(0, ctx);
  experimentHost.setControls({ ...def.baseline(ctx), ...opening.controls, running: true, timeScale: speed });
  noteMark(opening.mark);
  observed = "Sequence armed. The sliders below are the controls being driven.";
  sync(true);
}

function pause() {
  if (status !== "running") return;
  status = "paused";
  experimentHost.stop();
  sync(true);
}

function resume() {
  if (status !== "paused" || !presetId) return;
  status = "running";
  experimentHost.setControls({ running: true, timeScale: speed });
  sync(true);
}

function restore() {
  const saved = checkpoint;
  checkpoint = null;
  status = "idle";
  presetId = null;
  event = "";
  observed = "";
  marks = [];
  comparison = "";
  geometryFlag = "";
  samples = [];
  trace = [];
  result = null;
  hot = [];
  didA = false;
  didB = false;
  pendingB = false;
  stampA = null;
  if (saved) {
    experimentHost.restore(saved);
    experimentHost.reset();
  }
  if (armedId) describe(armedId);
  sync(true);
}

function noteMark(label: string | undefined) {
  if (!label) return;
  if (marks.some((m) => m.label === label)) return;
  marks.push({ t: experimentHost.now(), label });
  event = label;
}

function finish() {
  status = "done";
  experimentHost.stop();
  const read = experimentHost.read();
  if (presetId) observed = presetById(presetId).observe(read.params, read.snap);
  if (!event) event = "COMPLETE";
  result = presetId
    ? buildResult({
        id: presetId,
        speed,
        nullVar: presetId === "null" ? nullVar : null,
        samples: trace,
        marks,
        geometryFlag,
        captureA: useTriad.getState().captureA,
        captureB: useTriad.getState().captureB,
      })
    : null;
  sync(true);
}

function beforeStep() {
  if (status === "paused" || status === "done") {
    if (engine.params.running) experimentHost.stop();
    return;
  }
  if (status !== "running" || !presetId) return;
  const def = presetById(presetId);
  const elapsed = experimentHost.now() - origin;
  if (elapsed >= def.duration - 1e-9) {
    const frame = def.at(def.duration, ctx);
    experimentHost.setControls({ ...def.baseline(ctx), ...frame.controls, running: false, timeScale: speed });
    noteMark(frame.mark);
    finish();
    return;
  }
  const frame = def.at(elapsed, ctx);
  if (frame.freeze === "a" && !didA) {
    stampA = geometryStamp();
    experimentHost.freeze("a");
    didA = true;
  }
  experimentHost.setControls({
    ...def.baseline(ctx),
    ...frame.controls,
    running: true,
    timeScale: speed,
  });
  noteMark(frame.mark);
  if (frame.freeze === "b" && !didB) pendingB = true;
}

function afterStep() {
  if (status !== "running" || !presetId) return;
  const read = experimentHost.read();
  trace.push(sampleOf(read.params, read.snap));
  if (pendingB && !didB) {
    const stampB = geometryStamp();
    experimentHost.freeze("b");
    didB = true;
    pendingB = false;
    geometryFlag = stampA ? geomFlag(stampA, stampB, nullVar) : "Freeze A was missed. Comparison is not valid.";
    comparison = pairSentence();
  }
  if (presetId === "schwinger") {
    sampleAcc += 1 / 60;
    if (sampleAcc >= 0.1) {
      sampleAcc = 0;
      samples.push({
        t: read.snap.t,
        ePeak: read.snap.qed.ePeak,
        chi: read.snap.qed.eOverEs,
        exponent: read.snap.qed.exponent,
      });
      if (samples.length > 180) samples.shift();
    }
  }
  observed = presetById(presetId).observe(read.params, read.snap);
  sync(false);
}

function geometryStamp(): Stamp {
  const { params, snap } = experimentHost.read();
  return {
    radius: params.orbitRadius,
    omega: params.orbitRate,
    seat: params.seatBendDeg,
    speed: params.speed,
    tas: snap.tas,
    mode: params.mode,
    frame: params.frame,
    aMax: params.aMax,
    latency: params.latencyMs,
    phaseA: params.phaseA,
    phaseB: params.phaseB,
    phaseC: params.phaseC,
    activeCount: params.activeCount,
    eRef: params.eRef,
    gaps: gapsOf(snap),
    vacuumBore: params.vacuumBore,
    anchor: params.anchor,
  };
}

function gapsOf(snap: Snapshot) {
  return [0, 1, 2].map((i) => {
    let d = snap.nodes[(i + 1) % 3].orbitDeg - snap.nodes[i].orbitDeg;
    d = ((d % 360) + 360) % 360;
    return d;
  });
}

function geomFlag(a: Stamp, b: Stamp, which: NullVar) {
  const issues: string[] = [];
  if (Math.abs(a.radius - b.radius) > 1e-6) issues.push("R");
  if (Math.abs(a.omega - b.omega) > 1e-6) issues.push("ω");
  if (Math.abs(a.seat - b.seat) > 1e-6) issues.push("seat");
  if (a.mode !== b.mode) issues.push("mode");
  if (a.frame !== b.frame) issues.push("frame");
  if (Math.abs(a.aMax - b.aMax) > 1e-6) issues.push("a_max");
  if (Math.abs(a.latency - b.latency) > 1e-6) issues.push("latency");
  if (Math.abs(a.speed - b.speed) > 1e-6) issues.push("speed command");
  if (Math.abs(a.tas - b.tas) > 0.25) issues.push("airspeed");
  if (a.vacuumBore !== b.vacuumBore || a.vacuumBore || b.vacuumBore) issues.push("vacuum bore");
  if (a.anchor !== b.anchor || a.anchor || b.anchor) issues.push("anchor");
  a.gaps.forEach((g, i) => {
    const d = Math.abs(g - b.gaps[i]);
    const wrap = Math.min(d, 360 - d);
    if (wrap > 1.5) issues.push(`spacing ${i + 1}`);
  });
  if (which !== "phase") {
    if (Math.abs(a.phaseA - b.phaseA) > 0.51) issues.push("phase A");
    if (Math.abs(a.phaseB - b.phaseB) > 0.51) issues.push("phase B");
    if (Math.abs(a.phaseC - b.phaseC) > 0.51) issues.push("phase C");
  }
  if (which !== "count" && a.activeCount !== b.activeCount) issues.push("active count");
  if (which !== "amplitude" && Math.abs(a.eRef - b.eRef) / Math.max(a.eRef, 1) > 1e-6) issues.push("E0");
  if (issues.length) return `FLAG — geometry or controller changed: ${issues.join(", ")}.`;
  return "Geometry and controller match. Only the selected source variable differs.";
}

function sideOf(f: FrozenState): CaptureSide {
  return {
    eRef: f.eRef,
    ePeak: f.qed.ePeak,
    bPeak: f.qed.bPeak,
    eOverEs: f.qed.eOverEs,
    cBOverEs: f.qed.cBOverEs,
    F: f.qed.F,
    G: f.qed.G,
    exponent: f.qed.exponent,
    rate: f.qed.rate,
    rateApplicable: f.qed.rateApplicable,
    regime: f.qed.regime,
    cSweep: f.cSweep,
    dz120: f.dz120,
    radius: f.radius,
    omega: f.omega,
  };
}

function pairSentence() {
  const { captureA, captureB } = useTriad.getState();
  if (!captureA || !captureB) return "Freeze A/B did not both land.";
  const a = sideOf(captureA);
  const b = sideOf(captureB);
  const eRatio = a.ePeak > 0 && b.ePeak > 0 ? b.ePeak / a.ePeak : Number.NaN;
  const pairRatio = a.rateApplicable && b.rateApplicable && a.rate > 0 && b.rate > 0 ? b.rate / a.rate : Number.NaN;
  const changed = nullVar === "phase" ? "phase B" : nullVar === "count" ? "active count" : "amplitude";
  const field = Number.isFinite(eRatio) ? `field ×${eRatio.toExponential(2)}` : "field ratio n/a";
  const pair = Number.isFinite(pairRatio) ? `pair ×${pairRatio.toExponential(2)}` : "pair ratio underflow or n/a";
  return `Changed: ${changed}. A |E| ${a.ePeak.toExponential(2)} V/m → B |E| ${b.ePeak.toExponential(2)} V/m. ${field}. ${pair}. ${compareCaptures(a, b)}`;
}

export const experimentRun = {
  beforeStep,
  afterStep,
  begin,
  pause,
  resume,
  restore,
  select,
  setNullVar,
};

/** Test helper. Drives the same beforeStep → engine.step → afterStep order as the page clock. */
export function driveExperiment(maxSteps: number) {
  let n = 0;
  for (; n < maxSteps; n++) {
    beforeStep();
    if (!engine.params.running) break;
    engine.step(1 / 60);
    afterStep();
  }
  return n;
}

export function experimentOmegaSamples(maxSteps: number) {
  const out: number[] = [];
  for (let n = 0; n < maxSteps; n++) {
    beforeStep();
    if (!engine.params.running) break;
    out.push(engine.params.orbitRate);
    engine.step(1 / 60);
    afterStep();
  }
  return out;
}
