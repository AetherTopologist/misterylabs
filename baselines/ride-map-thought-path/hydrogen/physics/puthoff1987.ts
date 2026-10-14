import { CODATA_2022 } from "./constants.ts"
import { hbar, vacuumPermittivity } from "./classicalCollapse.ts"

/**
 * Puthoff, Phys. Rev. D 35, 3266 (1987), Bohr-level circular orbit.
 *
 * (17) x = x₀ cos ω₀t, y = x₀ sin ω₀t. Two oscillators in quadrature.
 * (16) one-dimensional absorbed power. The paper says the circular result is twice (16).
 * (18) P_abs = e² ℏ ω₀³ / (6π ε₀ m c³)
 * (19) P_rad = e² r₀² ω₀⁴ / (6π ε₀ c³)   [Larmor, a = ω₀² r₀]
 * (20) (18) = (19) ⇒ m ω₀ r₀² = ℏ
 *
 * η is not in the paper. It is this instrument's model control:
 * P_net = η P_abs − P_rad. η = 0 is radiation only. η = 1 is (18).
 *
 * The Coulomb circle m ω² r³ = e²/(4π ε₀) is the circular-orbit assumption
 * already used to write (19). Combined with (20) it solves r. The paper
 * does not print r = a₀. That equality is an output.
 *
 * ledgerRadiusRate is the energy-ledger picture dE/dt = P_net on those
 * circles. Puthoff 1987 does not integrate r(t).
 */
const { c, elementaryCharge, electronMass, bohrRadius } = CODATA_2022

function coulombKappa(): number {
  return (elementaryCharge * elementaryCharge) / (4 * Math.PI * vacuumPermittivity())
}

/** ω from the circular Coulomb balance. Not taken from the Schrödinger eigenvalue. */
export function coulombAngularFrequency(radius: number): number {
  return Math.sqrt(coulombKappa() / (electronMass * radius * radius * radius))
}

/** Puthoff (19). */
export function radiatedPowerWatts(radius: number): number {
  const omega = coulombAngularFrequency(radius)
  const eps0 = vacuumPermittivity()
  return (
    (elementaryCharge * elementaryCharge * radius * radius * omega ** 4) /
    (6 * Math.PI * eps0 * c * c * c)
  )
}

/** Puthoff (18), the published circular absorption, before the model factor η. */
export function absorbedPowerWatts(radius: number): number {
  const omega = coulombAngularFrequency(radius)
  const eps0 = vacuumPermittivity()
  return (
    (elementaryCharge * elementaryCharge * hbar() * omega ** 3) /
    (6 * Math.PI * eps0 * electronMass * c * c * c)
  )
}

/** P_net = η P_abs − P_rad. */
export function netPowerWatts(eta: number, radius: number): number {
  return eta * absorbedPowerWatts(radius) - radiatedPowerWatts(radius)
}

/** Operative ratio η P_abs / P_rad. Equals 1 on the solved balance radius. */
export function absorptionRatio(eta: number, radius: number): number {
  const radiated = radiatedPowerWatts(radius)
  if (!(radiated > 0)) return 0
  return (eta * absorbedPowerWatts(radius)) / radiated
}

/**
 * Radius where η P_abs = P_rad, using Coulomb ω(r).
 * Algebra: m ω r² = η ℏ and m ω² r³ = e²/(4π ε₀) ⇒ r = (η ℏ)² / (m κ) = η² a₀.
 * a₀ is not an input.
 */
export function balanceRadiusMeters(eta: number): number {
  if (!(eta > 0)) return 0
  const angular = eta * hbar()
  return (angular * angular) / (electronMass * coulombKappa())
}

/** dr/dt from dE/dt = P_net and E = −κ/(2r). Ledger picture only. */
export function ledgerRadiusRate(eta: number, radius: number): number {
  if (!(radius > 0)) return 0
  const kappa = coulombKappa()
  return (netPowerWatts(eta, radius) * 2 * radius * radius) / kappa
}

export function bohrRadiusMeters(): number {
  return bohrRadius
}
