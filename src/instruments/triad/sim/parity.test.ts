import assert from "node:assert/strict";
import { engine } from "./engine";
import { experimentHost } from "./experimentHost";

describe("pages port parity", () => {
  it("keeps commanded radius, clearance floor, and tracking as different numbers", () => {
    engine.reset();
    experimentHost.setControls({ orbitRadius: 8, mode: "scripted", vacuumBore: false });
    experimentHost.reset();
    engine.step(1 / 60);
    const c = engine.snapshot().clearance;
    assert.equal(c.commandedR, 8);
    assert.equal(c.clearanceRaised, true);
    assert.ok(c.clearR > c.commandedR + 0.4);
    assert.equal(c.tracking, false);
    assert.ok(Math.abs(c.actualR - c.clearR) <= 1.5);
  });

  it("flags control saturation from ω²R / amax and not from the airframe", () => {
    experimentHost.setControls({ orbitRate: 4, orbitRadius: 48, aMax: 80, mode: "tracking" });
    const hot = engine.snapshot();
    const ratio = (4 * 4 * 48) / 80;
    assert.ok(Math.abs(hot.demandRatio - ratio) < 1e-9);
    assert.equal(hot.saturated, true);
    assert.match(hot.saturationNote, /CONTROL SATURATED/);
    assert.match(hot.saturationNote, /not airframe clearance|not an airframe/i);
    experimentHost.setControls({ orbitRate: 0.2, orbitRadius: 48, aMax: 80 });
    const cool = engine.snapshot();
    assert.equal(cool.saturated, false);
    assert.ok(cool.demandRatio < 1);
  });

  it("lets the reservoir separate commanded amplitude from delivered field", () => {
    experimentHost.reset();
    experimentHost.setControls({
      simulateAmplitude: false,
      enforceBudget: true,
      eRef: 1e6,
      vacuumBore: false,
    });
    engine.step(1 / 60);
    const q = engine.snapshot().qed;
    assert.equal(q.simulated, false);
    assert.equal(engine.snapshot().limited, true);
    assert.ok(q.commandedE > q.ePeak);
  });

  it("does not open the vacuum bore when the sweep crosses E/Es = 1", () => {
    experimentHost.reset();
    experimentHost.setControls({ simulateAmplitude: true, eRef: 100, vacuumBore: false, showBore: true });
    engine.step(1 / 60);
    const sweep = engine.schwingerSweep();
    const one = sweep.points.find((p) => Math.abs(p.eOverEs - 1) < 1e-9);
    assert.ok(one);
    assert.equal(one.applicable, true);
    assert.ok(one.rate > 0);
    assert.match(sweep.note, /does not arm the vacuum bore/i);
    experimentHost.setControls({ eRef: one.e0, simulateAmplitude: true, vacuumBore: false });
    engine.step(1 / 60);
    const q = engine.snapshot().qed;
    assert.ok(q.eOverEs > 0.5, `delivered E/Es stayed at ${q.eOverEs}`);
    assert.equal(engine.params.vacuumBore, false);
    assert.equal(engine.display.vacuumBore, false);
    engine.schwingerSweep();
    assert.equal(engine.params.vacuumBore, false);
    assert.equal(engine.display.vacuumBore, false);
  });

  it("exposes one control path for a future macro without a second solver", () => {
    experimentHost.reset();
    const saved = experimentHost.checkpoint();
    experimentHost.setControls({ freqHz: 2.5e8, activeCount: 1, orient: "radial" });
    assert.equal(engine.params.freqHz, 2.5e8);
    assert.equal(engine.params.activeCount, 1);
    experimentHost.clearHistory();
    assert.equal(engine.snapshot().history.length, 0);
    experimentHost.freeze("a");
    experimentHost.stop();
    assert.equal(engine.params.running, false);
    experimentHost.restore(saved);
    assert.equal(engine.params.freqHz, saved.params.freqHz);
    assert.equal(engine.params.activeCount, saved.params.activeCount);
    assert.equal(engine.params.orient, saved.params.orient);
    assert.equal(engine.params.vacuumBore, false);
  });
});
