import assert from "node:assert/strict";
import { evaluateSweep, cSweepTriad, geometricSweep, triadPitch } from "./sampling.ts";

const plane = {
  e1x: 1,
  e1y: 0,
  e1z: 0,
  e2x: 0,
  e2y: 1,
  e2z: 0,
  nx: 0,
  ny: 0,
  nz: 1,
};

describe("triad sample pitch", () => {
  it("defines Δz120 = Lrev/3 and Csweep = 6R/Lrev", () => {
    assert.equal(triadPitch(300), 100);
    assert.equal(geometricSweep(48, 100), 0.96);
    assert.equal(cSweepTriad(48, 300), (6 * 48) / 300);
    assert.equal(cSweepTriad(48, 300), geometricSweep(48, triadPitch(300)));
    assert.equal(Number.isFinite(triadPitch(0)), false);
    assert.equal(Number.isFinite(cSweepTriad(48, 0)), false);
  });
});

describe("Maxwell sweep versus geometric sampling", () => {
  const base = {
    origin: { x: 0, y: 0, z: 0 },
    plane,
    radius: 48,
    freqHz: 1e8,
    pAmp: 1e-12,
    orient: "vertical" as const,
    aimYawDeg: 0,
    aimPitchDeg: 90,
    lRev: 420,
  };

  it("does not feed Lrev or Csweep into the Hertzian face", () => {
    const sparse = evaluateSweep({ ...base, lRev: 2000 });
    const dense = evaluateSweep({ ...base, lRev: 80 });
    assert.ok(Math.abs(sparse.rows[2].cSweep - dense.rows[2].cSweep) > 1);
    for (let i = 0; i < 5; i++) {
      assert.equal(sparse.rows[i].eCenter, dense.rows[i].eCenter);
      assert.equal(sparse.rows[i].contrast, dense.rows[i].contrast);
      assert.equal(sparse.rows[i].sAxial, dense.rows[i].sAxial);
    }
  });

  it("scales a symmetric partner and does not treat phase lock as a pitch change", () => {
    const { rows, verdict } = evaluateSweep(base);
    const [one, two, three, scramble, locked] = rows;
    assert.ok(one.eCenter > 0);
    assert.ok(Math.abs(two.eCenter / one.eCenter - 2) < 1e-6);
    assert.ok(three.eCenter > 0);
    assert.notEqual(locked.eCenter, three.eCenter);
    assert.ok(Math.abs(locked.cSweep - three.cSweep) < 1e-12);
    assert.ok(Math.abs(scramble.pitch - three.pitch) < 1e-12);
    assert.match(verdict, /not a physical coherence threshold/i);
    assert.match(verdict, /does not move these field numbers/i);
  });

  it("cancels 120° phase lock when three dipoles are normal to the ring", () => {
    const { rows } = evaluateSweep({ ...base, orient: "aimed", aimPitchDeg: 0, aimYawDeg: 0 });
    const [one, two, three, , locked] = rows;
    assert.ok(Math.abs(two.eCenter / one.eCenter - 2) < 1e-6);
    assert.ok(Math.abs(three.eCenter / one.eCenter - 3) < 1e-6);
    assert.ok(locked.eCenter < three.eCenter * 1e-6);
  });
});
