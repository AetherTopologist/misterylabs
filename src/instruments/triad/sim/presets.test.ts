import assert from "node:assert/strict";
import { compressedRadius } from "./anchorView";
import { engine } from "./engine";
import { experimentHost } from "./experimentHost";
import { driveExperiment, experimentOmegaSamples, experimentRun, useExperimentRun } from "./experimentRun";
import { cliffCrit, cliffOmega } from "./presets";
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
