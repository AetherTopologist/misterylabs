import { bindingEnergyEV, radialScale, type MassModel } from "./schrodinger1s.ts"

/**
 * Normalized Gaussian trial. Not the 1s eigenfunction.
 *
 * ψ_λ(r) = (π λ²)^{−3/4} exp(−r² / (2 λ²))
 * α = 1/(2 λ²), so this is the standard (2α/π)^{3/4} exp(−α r²) family.
 *
 * Expectation values on the Schrödinger–Coulomb Hamiltonian, reduced mass μ:
 *   ⟨T⟩ = 3 ℏ² / (4 μ λ²)
 *   ⟨V⟩ = − (2 / √π) e² / (4 π ε₀ λ)
 *
 * In units of the mass-corrected Rydberg, u = λ / a:
 *   T / Ry_μ = 3 / (2 u²)
 *   V / Ry_μ = −4 / (u √π)
 *
 * The minimum is analytic: u = 3 √π / 4, E = −(8/(3π)) Ry_μ.
 * That fraction is not fitted. An exponential trial is refused here on purpose:
 * that family contains ψ₁₀₀, so its minimum would be E₁ and would hide the gap.
 */
export const GAUSSIAN_MIN_WIDTH_OVER_A = (3 * Math.sqrt(Math.PI)) / 4

/** |E_min| / |E₁| for this family. */
export const GAUSSIAN_BINDING_FRACTION = 8 / (3 * Math.PI)

export function gaussianEnergyOverRydberg(widthOverA: number): {
  kinetic: number
  potential: number
  total: number
} {
  const u = widthOverA
  if (!(u > 0) || !Number.isFinite(u)) {
    return { kinetic: Number.POSITIVE_INFINITY, potential: 0, total: Number.POSITIVE_INFINITY }
  }
  const kinetic = 3 / (2 * u * u)
  const potential = -4 / (u * Math.sqrt(Math.PI))
  return { kinetic, potential, total: kinetic + potential }
}

/** Ry_μ = (μ/mₑ) × the CODATA infinite-mass Rydberg energy. */
export function rydbergEV(model: MassModel): number {
  return -bindingEnergyEV(model)
}

export function gaussianExpectationEV(
  widthOverA: number,
  model: MassModel,
): { kinetic: number; potential: number; total: number } {
  const ry = rydbergEV(model)
  const shape = gaussianEnergyOverRydberg(widthOverA)
  return {
    kinetic: shape.kinetic * ry,
    potential: shape.potential * ry,
    total: shape.total * ry,
  }
}

export function gaussianMinimumEV(model: MassModel): number {
  return GAUSSIAN_BINDING_FRACTION * bindingEnergyEV(model)
}

export function gaussianMinimumWidth(model: MassModel): number {
  return GAUSSIAN_MIN_WIDTH_OVER_A * radialScale(model)
}

/**
 * a P(r) for the trial, u = r/a.
 * Peaks at r = λ, not at a. Integrates to 1 over u.
 */
export function gaussianRadialShape(u: number, widthOverA: number): number {
  if (u <= 0 || !(widthOverA > 0)) return 0
  const s = u / widthOverA
  return ((4 / Math.sqrt(Math.PI)) * s * s * Math.exp(-s * s)) / widthOverA
}
