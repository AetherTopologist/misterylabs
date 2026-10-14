import { CODATA_2022 } from "../physics/constants"
import { collapseTimeSeconds } from "../physics/classicalCollapse"
import { formatPm, formatSeconds, formatTiny } from "../physics/format"
import {
  GAUSSIAN_BINDING_FRACTION,
  GAUSSIAN_MIN_WIDTH_OVER_A,
  gaussianMinimumEV,
} from "../physics/gaussianTrial"
import {
  bindingEnergyEV,
  meanRadius,
  probabilityInside,
  radialScale,
  type MassModel,
} from "../physics/schrodinger1s"
import { EpistemicTag } from "./EpistemicTag"

const NIST_IONIZATION_EV = 13.598_434_599_702

export function CalculationDrawer({
  model,
  onModel,
}: {
  model: MassModel
  onModel: (model: MassModel) => void
}) {
  const a = radialScale(model)
  const energy = bindingEnergyEV(model)
  const trialMinimum = gaussianMinimumEV(model)
  const inside = probabilityInside(CODATA_2022.protonRmsChargeRadius, model)
  const radiusRatio = a / CODATA_2022.protonRmsChargeRadius
  const gap = NIST_IONIZATION_EV - Math.abs(energy)

  return (
    <details className="mt-6 border border-line px-3 py-2">
      <summary className="min-h-11 cursor-pointer font-display text-xl text-fg">Why can I trust this?</summary>
      <div className="mt-3 flex gap-2" role="group" aria-label="Nuclear mass model">
        <button
          type="button"
          className={
            model === "reduced"
              ? "min-h-11 border border-fg px-3 text-sm text-fg"
              : "min-h-11 border border-line px-3 text-sm text-muted"
          }
          aria-pressed={model === "reduced"}
          onClick={() => onModel("reduced")}
        >
          Reduced mass
        </button>
        <button
          type="button"
          className={
            model === "infinite"
              ? "min-h-11 border border-fg px-3 text-sm text-fg"
              : "min-h-11 border border-line px-3 text-sm text-muted"
          }
          aria-pressed={model === "infinite"}
          onClick={() => onModel("infinite")}
        >
          Infinite mass
        </button>
      </div>
      <p className="mt-3 text-sm text-muted">
        The opening experiment uses reduced mass, the physical hydrogen convention. Infinite nuclear mass is the
        defined Bohr scale. The toggle does not retune the Gaussian coefficients, and it does not move the classical
        clock. That clock stays on the a₀ orbit: {formatSeconds(collapseTimeSeconds())}.
      </p>
      <dl className="mt-4 divide-y divide-line border-y border-line">
        <Row label={model === "reduced" ? "a_μ" : "a₀"} tag="calculated" value={formatPm(a)} />
        <Row label="⟨r⟩ = 1.5 a" tag="calculated" value={formatPm(meanRadius(a))} />
        <Row label="E₁" tag="calculated" value={`${energy.toFixed(6)} eV`} />
        <Row label="Gaussian family minimum" tag="calculated" value={`${trialMinimum.toFixed(3)} eV`} />
        <Row label="Proton ruler" tag="calculated" value={`${radiusRatio.toFixed(0)} × smaller`} />
        <Row label="P(r < r_p)" tag="calculated" value={formatTiny(inside)} />
      </dl>
      <p className="mt-3 text-sm text-muted">
        The proton rms radius is {formatPm(CODATA_2022.protonRmsChargeRadius)} and is not drawn on the a axis.
        Reduced mass scales the trial and E₁ by the same factor. The binding fraction stays{" "}
        {GAUSSIAN_BINDING_FRACTION.toFixed(4)}. It does not close the gap.
      </p>
      <p className="mt-3 text-sm text-fg">
        <EpistemicTag kind="calculated" /> Schrödinger–Coulomb ionization {Math.abs(energy).toFixed(6)} eV.
      </p>
      <p className="mt-2 text-sm text-muted">
        NIST ASD lists {NIST_IONIZATION_EV.toFixed(12)} eV in parentheses (reference HDEL). That is a cited
        compilation, so it is not tagged observed. The gap is {gap.toFixed(6)} eV and is not explained on this
        screen.
      </p>
      <div className="mt-4 space-y-2 pb-2 text-sm text-muted">
        <p>P(r) = 4 r² a⁻³ exp(−2r/a)</p>
        <p>E₁ = −(μ/mₑ) hc R∞</p>
        <p>τ = |E| / P = 3 a₀ / (4 α⁴ c). The drawn spiral is not an integrated r(t).</p>
        <p>ψ_λ = (π λ²)^(−3/4) exp(−r²/(2λ²))</p>
        <p>E(λ) / Ry_μ = 3 a² / (2 λ²) − 4 a / (λ √π)</p>
        <p>
          Family minimum: λ = {GAUSSIAN_MIN_WIDTH_OVER_A.toFixed(4)} a, E = −(8/(3π)) Ry_μ. Not fitted to E₁.
        </p>
        <p>∫₀ʳ P = 1 − e⁻ᵘ (1 + u + u²/2), u = 2r/a</p>
      </div>
    </details>
  )
}

function Row({
  label,
  value,
  tag,
}: {
  label: string
  value: string
  tag: "calculated" | "observed"
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <dt className="text-sm text-muted">
        <span className="mr-2 text-fg">{label}</span>
        <EpistemicTag kind={tag} />
      </dt>
      <dd className="text-right text-sm text-fg tabular-nums">{value}</dd>
    </div>
  )
}
