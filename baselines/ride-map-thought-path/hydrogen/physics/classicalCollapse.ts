import { CODATA_2022 } from "./constants.ts"

const { c, elementaryCharge, planck, bohrRadius, inverseFineStructure } =
  CODATA_2022

export function fineStructureAlpha(): number {
  return 1 / inverseFineStructure
}

export function hbar(): number {
  return planck / (2 * Math.PI)
}

/** ε₀ from α = e² / (4π ε₀ ℏ c). */
export function vacuumPermittivity(): number {
  const alpha = fineStructureAlpha()
  return (
    (elementaryCharge * elementaryCharge) /
    (4 * Math.PI * alpha * hbar() * c)
  )
}

/**
 * Larmor power on a circular Coulomb orbit.
 * At r = a₀ the speed is α c. P = e² a² / (6 π ε₀ c³), a = v²/r.
 * Energy-loss estimate only — not the Abraham–Lorentz force.
 */
export function larmorPowerWatts(radius = bohrRadius): number {
  const alpha = fineStructureAlpha()
  const vSquared = (alpha * alpha * c * c * bohrRadius) / radius
  const acceleration = vSquared / radius
  const eps0 = vacuumPermittivity()
  return (
    (elementaryCharge * elementaryCharge * acceleration * acceleration) /
    (6 * Math.PI * eps0 * c * c * c)
  )
}

/** Total mechanical energy of a circular Coulomb orbit, −α ℏ c / (2 r). */
export function orbitEnergyJoules(radius = bohrRadius): number {
  const alpha = fineStructureAlpha()
  return (-0.5 * alpha * hbar() * c) / radius
}

/** Closed form for the a₀ orbit: τ = |E| / P = 3 a₀ / (4 α⁴ c). */
export function collapseTimeSeconds(): number {
  const alpha = fineStructureAlpha()
  const alpha4 = alpha * alpha * alpha * alpha
  return (3 * bohrRadius) / (4 * alpha4 * c)
}

/** Same estimate from the explicit power, energy-loss approximation only. */
export function collapseTimeFromPower(): number {
  const energy = Math.abs(orbitEnergyJoules(bohrRadius))
  return energy / larmorPowerWatts(bohrRadius)
}
