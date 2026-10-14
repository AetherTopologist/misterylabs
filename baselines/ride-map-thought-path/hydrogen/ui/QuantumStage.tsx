import { gaussianRadialShape } from "../physics/gaussianTrial"
import { radialShape, volumeDensityShape, type MassModel } from "../physics/schrodinger1s"
import { EpistemicTag } from "./EpistemicTag"

const SAMPLES = 120
const X_MAX = 8

export function QuantumStage({ model, trialU }: { model: MassModel; trialU: number }) {
  const exactPeak = radialShape(1)
  let exact = ""
  let trial = ""
  for (let i = 0; i <= SAMPLES; i++) {
    const u = (i / SAMPLES) * X_MAX
    const x = marker(u)
    const exactY = yOf(radialShape(u) / exactPeak)
    exact += i === 0 ? `M ${x} ${exactY}` : ` L ${x} ${exactY}`
    const trialPeak = gaussianRadialShape(trialU, trialU)
    const trialY = yOf(trialPeak > 0 ? gaussianRadialShape(u, trialU) / exactPeak : 0)
    trial += i === 0 ? `M ${x} ${trialY}` : ` L ${x} ${trialY}`
  }
  const area = `${exact} L ${marker(X_MAX)} 78 L ${marker(0)} 78 Z`

  return (
    <figure className="border border-line bg-surface">
      <figcaption className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <span className="font-display text-lg leading-none text-fg">Exact 1s</span>
        <EpistemicTag kind="calculated" />
      </figcaption>
      <svg
        viewBox="0 0 200 168"
        className="mx-auto h-44 w-full text-fg"
        role="img"
        aria-label="Stationary 1s density, brightest at the center, with no orbit. It does not follow the trial width."
      >
        {Array.from({ length: 16 }, (_, index) => {
          const maxU = 3.4
          const maxR = 74
          const u = ((index + 0.5) / 16) * maxU
          const radius = Number(((u / maxU) * maxR).toFixed(2))
          const width = Number(((maxU / 16) * maxR * 1.2).toFixed(2))
          const opacity = Number(volumeDensityShape(u).toFixed(4))
          return (
            <circle
              key={index}
              cx="100"
              cy="84"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={width}
              strokeOpacity={opacity}
            />
          )
        })}
      </svg>
      <p className="px-3 text-sm text-fg">Stationary. No trajectory. Does not follow λ.</p>
      <p className="px-3 pb-2 text-sm text-muted">
        The glow is the exact |ψ|² shape. Peak of P(r) at {model === "reduced" ? "a_μ" : "a₀"}. Proton not drawn
        to scale.
      </p>
      <svg
        viewBox="0 0 280 96"
        className="h-24 w-full px-1 text-fg"
        role="img"
        aria-label="Exact radial probability, still, with the Gaussian trial overlaid in copper"
      >
        <line x1="16" y1="78" x2="264" y2="78" stroke="currentColor" className="text-line" />
        <line x1={marker(1)} y1="18" x2={marker(1)} y2="78" stroke="currentColor" strokeDasharray="2 3" className="text-muted" />
        <line x1={marker(1.5)} y1="28" x2={marker(1.5)} y2="78" stroke="currentColor" className="text-line" />
        <line
          x1={marker(Math.min(trialU, X_MAX))}
          y1="16"
          x2={marker(Math.min(trialU, X_MAX))}
          y2="78"
          stroke="currentColor"
          className="text-copper"
        />
        <path d={area} fill="currentColor" fillOpacity="0.12" />
        <path d={exact} fill="none" stroke="currentColor" strokeWidth="2.4" />
        <path d={trial} fill="none" stroke="currentColor" strokeWidth="2.2" className="text-copper" />
        <text x={marker(1)} y="92" textAnchor="middle" fill="currentColor" fontSize="12" className="text-muted">
          a
        </text>
        <text x={marker(1.5)} y="92" textAnchor="middle" fill="currentColor" fontSize="12">
          ⟨r⟩
        </text>
        <text x={marker(Math.min(trialU, X_MAX))} y="12" textAnchor="middle" fill="currentColor" fontSize="12" className="text-copper">
          λ
        </text>
      </svg>
      <p className="px-3 pb-3 text-sm text-muted">
        Ink is the exact r² shell. Copper is this Gaussian trial. The axis r/a is fixed, so the ink does not move
        when λ does. The copper peak is not a path.
      </p>
    </figure>
  )
}

function marker(u: number) {
  return (16 + (u / X_MAX) * 248).toFixed(2)
}

function yOf(shapeOverExactPeak: number) {
  const y = 78 - shapeOverExactPeak * 64
  return Math.max(8, y).toFixed(2)
}
