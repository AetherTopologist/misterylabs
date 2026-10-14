import { CODATA_2022 } from "./constants.ts"

export type MassModel = "reduced" | "infinite"

/** μ / m_e. Infinite nuclear mass is exactly 1. */
export function reducedMassFactor(model: MassModel): number {
  if (model === "infinite") return 1
  return 1 / (1 + CODATA_2022.electronProtonMassRatio)
}

/**
 * Radial scale in the 1s solution.
 * Infinite mass: the defined Bohr radius a₀.
 * Reduced mass: a_μ = a₀ · m_e / μ.
 */
export function radialScale(model: MassModel): number {
  return CODATA_2022.bohrRadius / reducedMassFactor(model)
}

/** Schrödinger–Coulomb eigenvalue. Negative. Not the NIST ionization compilation. */
export function bindingEnergyEV(model: MassModel): number {
  return -CODATA_2022.rydbergEnergyEV * reducedMassFactor(model)
}

/** Dimensionless a P(r) at u = r/a: 4 u² exp(−2u). */
export function radialShape(u: number): number {
  if (u <= 0) return 0
  return 4 * u * u * Math.exp(-2 * u)
}

/** P(r) = 4 r² a⁻³ exp(−2r/a), per meter. */
export function radialProbability(r: number, a: number): number {
  if (r <= 0 || a <= 0) return 0
  return radialShape(r / a) / a
}

export function meanRadius(a: number): number {
  return 1.5 * a
}

export function mostProbableRadius(a: number): number {
  return a
}

/**
 * ∫₀ʳ P(r′) dr′ = 1 − e^{−u}(1 + u + u²/2), u = 2r/a.
 * Small u uses the series so 1 − (1 − ε) does not wipe the proton-scale probability.
 */
export function cumulativeRadial(r: number, a: number): number {
  if (r <= 0 || a <= 0) return 0
  const u = (2 * r) / a
  if (u >= 40) return 1
  if (u < 0.05) {
    const u2 = u * u
    const u3 = u2 * u
    const u4 = u3 * u
    const u5 = u4 * u
    const u6 = u5 * u
    const u7 = u6 * u
    const u8 = u7 * u
    return (
      u3 / 6 -
      u4 / 8 +
      u5 / 20 -
      u6 / 72 +
      u7 / 336 -
      u8 / 1920
    )
  }
  return 1 - Math.exp(-u) * (1 + u + (u * u) / 2)
}

export function probabilityInside(
  radius: number,
  model: MassModel,
): number {
  return cumulativeRadial(radius, radialScale(model))
}

export function volumeDensityShape(u: number): number {
  return Math.exp(-2 * Math.max(0, u))
}
