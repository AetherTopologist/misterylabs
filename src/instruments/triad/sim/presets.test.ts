import assert from "node:assert/strict";
import { compressedRadius } from "./anchorView";
import { engine } from "./engine";
import { experimentHost } from "./experimentHost";
import { driveExperiment, experimentOmegaSamples, experimentRun, useExperimentRun } from "./experimentRun";
import { cliffCrit, cliffOmega } from "./presets";
import { buildResult, type RunSample } from "./runResult";
import { useTriad } from "./store";

function quiet() {
  experimentRun.restore();
  experimentHost.setControls({
    running: false,
    vacuumBore: false,
    anchor: false,
    ashton: false,
    simulateAmplitude: false,
    seatBendDeg: 0,
    spacing: "equal",
    perturb: 0,
  });
  experimentHost.reset();
}

describe("experiment presets", () => {
  it("bends only node 2 and leaves emitter phase alone", () => {
    quiet();
    const read = (bend: number) => {
      experimentHost.setControls({
        seatBendDeg: bend,
        mode: "scripted",
        spacing: "equal",
        phasePreset: "triad",
        orbitRate: 0,
        speed: 0,
        running: false,
      });
      experimentHost.reset();
      engine.step(1 / 60);
      return engine.snapshot().nodes.map((n) => ({ orbit: n.orbitDeg, em: n.emDeg }));
    };
    const flat = read(0);
    const bent = read(30);
    assert.ok(Math.abs(flat[1].orbit - 120) < 0.05);
    assert.ok(Math.abs(bent[1].orbit - flat[1].orbit - 30) < 0.05);
    assert.ok(Math.abs(bent[0].orbit - flat[0].orbit) < 0.05);
    assert.ok(Math.abs(bent[2].orbit - flat[2].orbit) < 0.05);
    assert.ok(Math.abs(bent[0].em - flat[0].em) < 0.05);
    assert.ok(Math.abs(bent[1].em - flat[1].em) < 0.05);
    assert.ok(Math.abs(bent[2].em - flat[2].em) < 0.05);
  });

  it("does not let anchor range or bearing change the physical readouts", () => {
    quiet();
    experimentHost.setControls({
      mode: "scripted",
      speed: 0,
      orbitRate: 1.2,
      eRef: 100,
      simulateAmplitude: true,
      vacuumBore: false,
      anchor: false,
      anchorBearing: 40,
      anchorKm: 500,
      running: false,
    });
    experimentHost.reset();
    for (let i = 0; i < 20; i++) engine.step(1 / 60);
    const off = engine.snapshot();
    experimentHost.setControls({
      mode: "scripted",
      speed: 0,
      orbitRate: 1.2,
      eRef: 100,
      simulateAmplitude: true,
      vacuumBore: false,
      anchor: true,
      anchorBearing: 140,
      anchorKm: 1800,
      running: false,
    });
    experimentHost.reset();
    for (let i = 0; i < 20; i++) engine.step(1 / 60);
    const on = engine.snapshot();
    assert.equal(on.qed.ePeak, off.qed.ePeak);
    assert.equal(on.qed.bPeak, off.qed.bPeak);
    assert.equal(on.qed.F, off.qed.F);
    assert.equal(on.qed.G, off.qed.G);
    assert.equal(on.qed.rate, off.qed.rate);
    assert.equal(on.eChem, off.eChem);
    assert.equal(on.demandRatio, off.demandRatio);
    assert.equal(on.trackErr, off.trackErr);
    assert.equal(on.qed.eOverEs, off.qed.eOverEs);
    assert.ok(Math.abs(on.axes.boreDestDeg - off.axes.boreDestDeg) > 1);
    assert.equal(engine.params.vacuumBore, false);
    const mid = engine.snapshot();
    experimentHost.setControls({ anchorBearing: 10, anchorKm: 12 });
    const nudged = engine.snapshot();
    assert.equal(nudged.qed.ePeak, mid.qed.ePeak);
    assert.equal(nudged.qed.F, mid.qed.F);
    assert.equal(nudged.eChem, mid.eChem);
    assert.equal(nudged.demandRatio, mid.demandRatio);
    assert.notEqual(nudged.axes.bodyDestDeg, mid.axes.bodyDestDeg);
  });

  it("replays the control cliff as the same ω sequence and crosses saturation without arming the bore", () => {
    quiet();
    experimentRun.select("cliff");
    experimentRun.begin(1);
    const first = experimentOmegaSamples(800);
    const speed = engine.params.speed;
    const bore = engine.params.vacuumBore;
    const sat = useExperimentRun.getState();
    experimentRun.begin(1);
    const second = experimentOmegaSamples(800);
    assert.equal(first.length, second.length);
    assert.ok(first.length > 60);
    for (let i = 0; i < first.length; i++) assert.equal(first[i], second[i]);
    assert.ok(Math.abs(first[0] - cliffOmega(0)) < 1e-9);
    assert.ok(first.some((w) => w * w * 48 / 80 >= 1));
    assert.ok(first.some((w) => w < cliffCrit()));
    assert.ok(first[first.length - 1] > cliffCrit());
    assert.equal(speed, 85);
    assert.equal(bore, false);
    assert.equal(engine.params.vacuumBore, false);
    assert.equal(engine.params.anchor, false);
    assert.ok(sat.marks.some((m) => m.label === "CONTROL SATURATION") || useExperimentRun.getState().marks.some((m) => m.label === "CONTROL SATURATION"));
    const end = engine.snapshot();
    assert.equal(end.saturated, true);
    assert.ok(end.trackErr > 1);
  });

  it("moves emitter phase without moving R or the seat", () => {
    quiet();
    experimentRun.select("breakPhase");
    experimentRun.begin(1);
    driveExperiment(60 * 5);
    const p = engine.params;
    assert.equal(p.orbitRadius, 48);
    assert.equal(p.seatBendDeg, 0);
    assert.equal(p.orbitRate, 1.2);
    assert.equal(p.activeCount, 3);
    assert.equal(p.eRef, 100);
    assert.equal(p.vacuumBore, false);
    assert.ok(Math.abs(p.phaseA - 17) < 0.01);
    assert.ok(Math.abs(p.phaseB - 203) < 0.01);
    assert.ok(Math.abs(p.phaseC - 291) < 0.01);
    const snap = engine.snapshot();
    const gaps = [0, 1, 2].map((i) => {
      let d = snap.nodes[(i + 1) % 3].orbitDeg - snap.nodes[i].orbitDeg;
      d = ((d % 360) + 360) % 360;
      return d;
    });
    for (const g of gaps) assert.ok(Math.abs(g - 120) < 1.5, `gap ${g}`);
    experimentRun.restore();
  });

  it("sweeps amplitude through E/Es = 1 without arming the vacuum bore or the anchor", () => {
    quiet();
    experimentRun.select("schwinger");
    experimentRun.begin(1);
    assert.equal(engine.params.vacuumBore, false);
    driveExperiment(60 * 13);
    const state = useExperimentRun.getState();
    assert.equal(engine.params.vacuumBore, false);
    assert.equal(engine.params.anchor, false);
    assert.equal(engine.display.vacuumBore, false);
    assert.ok(state.marks.some((m) => m.label === "E/Es = 1"));
    assert.ok(state.samples.some((s) => s.chi < 0.05));
    assert.ok(state.samples.some((s) => s.chi > 2));
    const low = state.samples.find((s) => s.chi < 0.05);
    const high = state.samples.find((s) => s.chi > 2);
    assert.ok(low && high);
    assert.ok(high.ePeak > low.ePeak * 10);
    experimentRun.restore();
  });

  it("compares null A/B on amplitude only and flags a geometry mismatch if one appears", () => {
    quiet();
    experimentRun.select("null");
    experimentRun.setNullVar("amplitude");
    experimentRun.begin(1);
    driveExperiment(60 * 7);
    const state = useExperimentRun.getState();
    assert.match(state.geometryFlag, /Only the selected source variable differs/);
    assert.match(state.comparison, /amplitude/);
    const { captureA, captureB } = useTriad.getState();
    assert.ok(captureA && captureB);
    assert.ok(Math.abs(captureA.eRef - 1000) < 1);
    assert.ok(captureB.eRef > 9000);
    assert.equal(captureA.phaseB, captureB.phaseB);
    assert.equal(captureA.activeCount, captureB.activeCount);
    assert.equal(engine.params.vacuumBore, false);
    assert.equal(engine.params.anchor, false);
    experimentRun.restore();
  });
});

describe("compressed range inset", () => {
  it("moves the marker with range and stays off the metric scale", () => {
    const near = compressedRadius(0.5);
    const mid = compressedRadius(500);
    const far = compressedRadius(2000);
    assert.ok(near < mid && mid < far);
    assert.equal(compressedRadius(0.5), 10);
    assert.ok(Math.abs(compressedRadius(2000) - 58) < 1e-9);
    assert.ok(far < 100);
  });
});

function fakeSample(over: Partial<RunSample> = {}): RunSample {
  return {
    t: 0,
    omega: 0.45,
    radius: 48,
    aMax: 80,
    demand: 0.12,
    saturated: false,
    track: 0.05,
    actualR: 48,
    commandedR: 48,
    gap: 0,
    phaseSlip: 0,
    seat: 0,
    phaseA: 0,
    phaseB: 120,
    phaseC: 240,
    emA: 0,
    emB: 120,
    emC: 240,
    eRef: 100,
    ePeak: 1,
    bPeak: 1e-9,
    chi: 1e-16,
    F: 1e-20,
    G: 0,
    exponent: Number.NaN,
    rate: 0,
    rateOn: false,
    eChem: 10,
    eChem0: 10,
    vacuumBore: false,
    anchor: false,
    mode: "tracking",
    frame: "bore",
    speed: 85,
    tas: 85,
    activeCount: 3,
    freq: 1e8,
    latency: 0,
    acquisition: "TRACK",
    orient: "vertical",
    simulate: false,
    ...over,
  };
}

function runCard(id: "cliff" | "break120" | "breakPhase" | "schwinger" | "null", speed: 1 | 0.25 = 1) {
  quiet();
  experimentRun.select(id);
  experimentRun.begin(speed);
  driveExperiment(60 * 14);
  const result = useExperimentRun.getState().result;
  assert.ok(result, `${id} did not produce a result card`);
  return result;
}

describe("experiment result cards", () => {
  it("builds the cliff card only from the recorded trace", () => {
    const samples = [
      fakeSample({ t: 0.017, omega: 0.45, demand: 0.1215, track: 0.02, actualR: 48.1 }),
      fakeSample({ t: 4, omega: 1.3, demand: 1.014, track: 0.4, actualR: 49, saturated: true }),
      fakeSample({ t: 10, omega: 2.6, demand: 4.056, track: 12, actualR: 70, saturated: true }),
    ];
    const input = {
      id: "cliff" as const,
      speed: 1 as const,
      nullVar: null,
      samples,
      marks: [{ t: 3.9, label: "CONTROL SATURATION" }],
      geometryFlag: "",
      captureA: null,
      captureB: null,
    };
    const card = buildResult(input);
    assert.equal(card.plain, buildResult(input).plain);
    assert.match(card.observed, /1\.291 rad\/s/);
    assert.match(card.observed, /first ω with ω²R\/a_max > 1: ω 1\.300/);
    assert.match(card.observed, /demand\/cap max 4\.056/);
    assert.match(card.observed, /tracking error before/);
    assert.match(card.observed, /node-radius departure/);
    assert.match(card.interpretation, /controller saturation/i);
    assert.match(card.interpretation, /not a field, QED, or aircraft interaction/i);
    assert.match(card.notImplied, /Pais, Ponder, Puthoff, transport, metric engineering/);
    assert.match(card.notImplied, /MH370/);
    assert.match(card.plain, /OBSERVED IN MODEL/);
    assert.match(card.plain, /NOT IMPLIED/);
    assert.match(card.plain, /wall clock is not used/);
    assert.doesNotMatch(card.interpretation, /supports Pais|validates MH370|metric engineering is shown/i);
  });

  it("replays the cliff card identically, including at 0.25×", () => {
    const a = runCard("cliff", 1);
    const b = runCard("cliff", 1);
    const slow = runCard("cliff", 0.25);
    assert.equal(a.plain, b.plain);
    assert.equal(a.observed, slow.observed);
    assert.equal(a.interpretation, slow.interpretation);
    assert.equal(a.notImplied, slow.notImplied);
    assert.match(slow.plain, /time scale: 0\.25×/);
    assert.match(a.observed, /controller saturation/i);
    assert.equal(a.flag, "");
    assert.ok(a.observed.includes("first ω with ω²R/a_max > 1: ω"));
    experimentRun.restore();
  });

  it("keeps phase fixed on the seat bend and seats fixed on the phase break", () => {
    const seat = runCard("break120");
    assert.equal(seat.flag, "");
    assert.match(seat.observed, /commanded seat/);
    assert.match(seat.observed, /pairwise gap error/);
    assert.match(seat.observed, /Emitter phase stayed/);
    assert.match(seat.notImplied, /not a field law/);
    const phase = runCard("breakPhase");
    assert.equal(phase.flag, "");
    assert.match(phase.observed, /commanded phase/);
    assert.match(phase.observed, /phase slip/);
    assert.match(phase.observed, /Commanded seat and R stayed/);
    assert.match(phase.interpretation, /Maxwell solution/);
    experimentRun.restore();
  });

  it("reports Schwinger crossings without a transport transition", () => {
    const card = runCard("schwinger");
    assert.equal(card.flag, "");
    for (const level of ["0.01", "0.1", "1", "10"]) {
      assert.match(card.observed, new RegExp(`E/Es ≥ ${level}`));
    }
    assert.match(card.observed, /No transport, displacement, or vacuum-bore transition is implemented/);
    assert.match(card.observed, /Vacuum bore stayed off/);
    assert.match(card.interpretation, /No transport, displacement, or vacuum-bore transition is implemented/);
    assert.match(card.notImplied, /not a switch/);
    experimentRun.restore();
  });

  it("flags only the selected null variable and copies a citation record", () => {
    const card = runCard("null");
    assert.equal(card.flag, "");
    assert.match(card.observed, /single changed variable: amplitude E0/);
    assert.match(card.observed, /Δ peak \|E\|/);
    assert.match(card.observed, /pair estimate/);
    assert.match(card.observed, /reservoir/);
    assert.doesNotMatch(card.observed, /^FLAG/m);
    assert.match(card.plain, /experiment: 05 Null A\/B/);
    assert.match(card.plain, /CONTROL STATE/);
    assert.match(card.plain, /build: /);
    experimentRun.restore();
  });
});
