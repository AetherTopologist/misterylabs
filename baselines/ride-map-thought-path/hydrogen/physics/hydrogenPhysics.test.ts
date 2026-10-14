import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { CODATA_2022 } from "./constants.ts"
import {
  collapseTimeFromPower,
  collapseTimeSeconds,
  orbitEnergyJoules,
} from "./classicalCollapse.ts"
import {
  bindingEnergyEV,
  cumulativeRadial,
  meanRadius,
  mostProbableRadius,
  probabilityInside,
  radialScale,
  radialShape,
  reducedMassFactor,
} from "./schrodinger1s.ts"
import {
  GAUSSIAN_BINDING_FRACTION,
  GAUSSIAN_MIN_WIDTH_OVER_A,
  gaussianEnergyOverRydberg,
  gaussianExpectationEV,
  gaussianMinimumEV,
  gaussianMinimumWidth,
  gaussianRadialShape,
} from "./gaussianTrial.ts"

const { bohrRadius, electronMass, protonMass, electronProtonMassRatio, rydbergEnergyEV, rydbergEnergyJ, elementaryCharge, protonRmsChargeRadius } =
  CODATA_2022

describe("schrödinger 1s", () => {
  it("uses the pinned electron-proton ratio for reduced mass", () => {
    const fromMasses = electronMass / protonMass
    assert.ok(Math.abs(fromMasses - electronProtonMassRatio) / electronProtonMassRatio < 1e-9)
    const factor = reducedMassFactor("reduced")
    assert.equal(factor, 1 / (1 + electronProtonMassRatio))
    assert.equal(reducedMassFactor("infinite"), 1)
  })

  it("sets infinite-mass E₁ to −hcR∞ and scales reduced mass", () => {
    assert.equal(bindingEnergyEV("infinite"), -rydbergEnergyEV)
    const expected = -rydbergEnergyEV / (1 + electronProtonMassRatio)
    assert.ok(Math.abs(bindingEnergyEV("reduced") - expected) < 1e-12)
    assert.ok(Math.abs(bindingEnergyEV("reduced") + 13.598_287_264) < 1e-9)
  })

  it("places the radial peak at a and the mean at 1.5 a", () => {
    const a = radialScale("reduced")
    assert.equal(mostProbableRadius(a), a)
    assert.equal(meanRadius(a) / a, 1.5)
    assert.ok(a > bohrRadius)
    assert.ok(Math.abs(radialShape(1) - 4 * Math.exp(-2)) < 1e-15)
  })

  it("normalizes P(r) and stays accurate inside the proton", () => {
    const a = radialScale("infinite")
    assert.ok(Math.abs(cumulativeRadial(a, a) - 0.323_323_583_816_9) < 1e-12)
    assert.ok(cumulativeRadial(6 * a, a) > 0.9994)
    assert.ok(cumulativeRadial(20 * a, a) > 0.999_999_999)
    assert.equal(cumulativeRadial(0, a), 0)
    const inside = probabilityInside(protonRmsChargeRadius, "infinite")
    assert.ok(inside > 5.2e-15 && inside < 5.5e-15)
    const u = (2 * protonRmsChargeRadius) / a
    const series = u ** 3 / 6
    assert.ok(Math.abs(inside - series) / series < 3e-5)
  })

  it("converts the Rydberg energy from eV to joules with the elementary charge", () => {
    const joules = rydbergEnergyEV * elementaryCharge
    assert.ok(Math.abs(joules - rydbergEnergyJ) / rydbergEnergyJ < 1e-12)
  })
})

describe("classical collapse", () => {
  it("matches the closed form to the explicit Larmor power", () => {
    const closed = collapseTimeSeconds()
    const fromPower = collapseTimeFromPower()
    assert.ok(Math.abs(closed - fromPower) / closed < 1e-12)
    assert.ok(closed > 4.66e-11 && closed < 4.68e-11)
  })

  it("binds the a₀ orbit at the Rydberg energy", () => {
    const energy = orbitEnergyJoules()
    assert.ok(energy < 0)
    assert.ok(Math.abs(Math.abs(energy) - rydbergEnergyJ) / rydbergEnergyJ < 1e-11)
  })
})

describe("gaussian trial", () => {
  it("keeps an untuned upper bound at −(8/(3π)) of the eigenvalue", () => {
    const shape = gaussianEnergyOverRydberg(GAUSSIAN_MIN_WIDTH_OVER_A)
    assert.ok(Math.abs(shape.total + GAUSSIAN_BINDING_FRACTION) < 1e-12)
    assert.ok(Math.abs(shape.kinetic - GAUSSIAN_BINDING_FRACTION) < 1e-12)
    assert.ok(Math.abs(shape.potential + 2 * GAUSSIAN_BINDING_FRACTION) < 1e-12)

    for (const model of ["reduced", "infinite"] as const) {
      const minimum = gaussianMinimumEV(model)
      const exact = bindingEnergyEV(model)
      assert.ok(Math.abs(minimum - GAUSSIAN_BINDING_FRACTION * exact) < 1e-12)
      assert.ok(minimum < 0)
      assert.ok(minimum > exact)
      assert.ok(Math.abs(minimum - exact) > 2)
      const nearbyWide = gaussianExpectationEV(GAUSSIAN_MIN_WIDTH_OVER_A * 1.02, model).total
      const nearbyTight = gaussianExpectationEV(GAUSSIAN_MIN_WIDTH_OVER_A * 0.98, model).total
      assert.ok(nearbyWide > minimum)
      assert.ok(nearbyTight > minimum)
    }
  })

  it("lands near −11.5 eV and not on the Schrödinger–Coulomb value", () => {
    const reduced = gaussianMinimumEV("reduced")
    const infinite = gaussianMinimumEV("infinite")
    assert.ok(reduced > -11.55 && reduced < -11.54)
    assert.ok(infinite > -11.55 && infinite < -11.54)
    assert.ok(Math.abs(reduced - bindingEnergyEV("reduced")) > 2)
    assert.equal(gaussianMinimumEV("reduced").toFixed(3), "-11.543")
    assert.equal(gaussianMinimumEV("infinite").toFixed(3), "-11.549")
  })

  it("places the trial width at 3√π/4 Bohr scales, not at a", () => {
    const a = radialScale("reduced")
    const width = gaussianMinimumWidth("reduced")
    assert.ok(Math.abs(width / a - GAUSSIAN_MIN_WIDTH_OVER_A) < 1e-12)
    assert.ok(width > a)
    assert.ok(Math.abs(GAUSSIAN_MIN_WIDTH_OVER_A - (3 * Math.sqrt(Math.PI)) / 4) < 1e-15)
  })

  it("peaks the Gaussian radial density at λ and normalizes it", () => {
    const width = 1.7
    const peak = gaussianRadialShape(width, width)
    const expected = ((4 / Math.sqrt(Math.PI)) * Math.exp(-1)) / width
    assert.ok(Math.abs(peak - expected) < 1e-12)
    assert.ok(gaussianRadialShape(width * 0.9, width) < peak)
    assert.ok(gaussianRadialShape(width * 1.1, width) < peak)
    let sum = 0
    const steps = 4000
    const uMax = 16
    const du = uMax / steps
    for (let i = 0; i < steps; i++) {
      sum += gaussianRadialShape((i + 0.5) * du, width) * du
    }
    assert.ok(Math.abs(sum - 1) < 1e-4)
  })
})
