import assert from "node:assert/strict";
import { ES } from "./fields.ts";
import { compareCaptures, hardwareClass, invariantsOf, pairRate, regimeOf, sweepCommanded } from "./qed.ts";

describe("strong-field telemetry", () => {
  it("uses the Schwinger eigenvalues, not a geometry input", () => {
    const pureE = invariantsOf({ x: ES, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
    assert.ok(Math.abs(pureE.eps - ES) / ES < 1e-9);
    assert.ok(pureE.beta < 1e-6 * ES);
    const pureB = invariantsOf({ x: 0, y: 0, z: 0 }, { x: ES / 299792458, y: 0, z: 0 });
    assert.ok(pureB.eps < 1e-6 * ES);
    assert.ok(Math.abs(pureB.beta - ES) / ES < 1e-6);
    const low = regimeOf(1e-8, 0);
    const mid = regimeOf(1e-2, 0);
    const high = regimeOf(2, 0);
    assert.equal(low.regime, "CLASSICAL EM");
    assert.equal(mid.regime, "STRONG-FIELD QED BECOMING RELEVANT");
    assert.equal(high.regime, "SCHWINGER-SCALE FIELD");
    assert.match(high.regimeNote, /not a broken limit/i);
  });

  it("reports a rate only when the exponent fits in double precision", () => {
    const at = pairRate(ES, 0);
    assert.equal(at.applicable, true);
    assert.ok(at.rate > 1e40 && at.rate < 1e70);
    const quiet = pairRate(ES * 1e-4, 0);
    assert.equal(quiet.applicable, false);
    assert.equal(quiet.rate, 0);
    assert.ok(quiet.exponent > 680);
    const magnetic = pairRate(0, ES);
    assert.equal(magnetic.applicable, false);
    assert.equal(hardwareClass(1e16), "hypothetical");
    assert.equal(hardwareClass(1e6), "model");
  });

  it("calls the pair estimate nonlinear and leaves geometry out of the regime", () => {
    const side = {
      eRef: 1,
      ePeak: 1,
      bPeak: 0,
      eOverEs: 1e-6,
      cBOverEs: 0,
      F: -0.5,
      G: 0,
      exponent: 1e6,
      rate: 0,
      rateApplicable: false,
      regime: "CLASSICAL EM" as const,
      cSweep: 1.5,
      dz120: 40,
      radius: 48,
      omega: 1,
    };
    const text = compareCaptures(side, { ...side, ePeak: 10, eRef: 10, exponent: 1e5 });
    assert.match(text, /exponentially|nonlinear/i);
    assert.match(text, /did not set the regime/);
  });

  it("sweeps only amplitude and stays linear through E/Es = 1", () => {
    const sweep = sweepCommanded({ eOverEs: 1e-10, cBOverEs: 0, eps: ES * 1e-10, beta: 0 }, 100);
    assert.equal(sweep.points.length, 17);
    const at = (chi: number) => sweep.points.find((p) => Math.abs(Math.log10(p.eOverEs) - Math.log10(chi)) < 1e-9);
    const low = at(1e-6)!;
    const one = at(1)!;
    const ten = at(10)!;
    assert.ok(low && one && ten);
    assert.ok(Math.abs(one.e0 / low.e0 - 1e6) / 1e6 < 1e-9);
    assert.ok(Math.abs(ten.eOverEs / one.eOverEs - 10) < 1e-9);
    assert.equal(one.regime, "SCHWINGER-SCALE FIELD");
    assert.equal(low.applicable, false);
    assert.equal(one.applicable, true);
    assert.ok(Math.abs(one.exponent - Math.PI) / Math.PI < 1e-6);
    assert.ok(one.exponent * 10 < ten.exponent + 1e-6 || ten.exponent < one.exponent);
    assert.ok(ten.rate > one.rate);
    assert.equal(low.regime, "CLASSICAL EM");
    assert.ok(sweep.simulatedAboveE0 > low.e0 && sweep.simulatedAboveE0 < one.e0);
  });
});
