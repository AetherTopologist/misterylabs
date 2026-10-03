import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { collapseTimeSeconds, larmorPowerWatts } from "./classicalCollapse.ts"
import { CODATA_2022 } from "./constants.ts"
import { gaussianMinimumEV } from "./gaussianTrial.ts"
import {
  absorbedPowerWatts,
  absorptionRatio,
  balanceRadiusMeters,
  netPowerWatts,
  radiatedPowerWatts,
} from "./puthoff1987.ts"
import { bindingEnergyEV } from "./schrodinger1s.ts"

describe("Puthoff 1987 circular balance", () => {
  it("matches the existing Larmor power at a₀ without replacing it", () => {
    const radius = CODATA_2022.bohrRadius
    const ratio = radiatedPowerWatts(radius) / larmorPowerWatts(radius)
    // CODATA a₀ and ℏ/(mₑ c α) differ by ~1 part in 10¹². Same Larmor formula.
    assert.ok(Math.abs(ratio - 1) < 1e-11)
  })

  it("solves the Bohr radius from Coulomb plus (20), and does not assign a₀", () => {
    const solved = balanceRadiusMeters(1)
    const a0 = CODATA_2022.bohrRadius
    assert.ok(Math.abs(solved / a0 - 1) < 1e-9)
    assert.ok(Math.abs(absorptionRatio(1, solved) - 1) < 1e-9)
    assert.ok(Math.abs(netPowerWatts(1, solved)) / radiatedPowerWatts(solved) < 1e-9)
  })

  it("moves the ledger fixed point as η² and leaves the quantum numbers alone", () => {
    const a0 = CODATA_2022.bohrRadius
    const half = balanceRadiusMeters(0.5)
    assert.ok(Math.abs(half / a0 - 0.25) < 1e-9)
    assert.ok(Math.abs(balanceRadiusMeters(0.8) / a0 - 0.64) < 1e-9)
    assert.ok(Math.abs(absorptionRatio(0.5, half) - 1) < 1e-9)
    assert.ok(absorptionRatio(0.5, a0) < 0.51)
    assert.ok(absorptionRatio(0.5, a0) > 0.49)
    const beforeEnergy = bindingEnergyEV("reduced")
    const beforeTrial = gaussianMinimumEV("reduced")
    const beforeCollapse = collapseTimeSeconds()
    balanceRadiusMeters(0.2)
    netPowerWatts(0.2, a0)
    assert.equal(bindingEnergyEV("reduced"), beforeEnergy)
    assert.equal(gaussianMinimumEV("reduced"), beforeTrial)
    assert.equal(collapseTimeSeconds(), beforeCollapse)
  })

  it("is loss at η = 0 on the Bohr orbit", () => {
    const radius = CODATA_2022.bohrRadius
    assert.equal(absorptionRatio(0, radius), 0)
    assert.ok(netPowerWatts(0, radius) < 0)
    assert.equal(balanceRadiusMeters(0), 0)
  })
})
