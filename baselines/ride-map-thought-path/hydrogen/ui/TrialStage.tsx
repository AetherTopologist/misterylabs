import { useState } from "react"
import {
  GAUSSIAN_MIN_WIDTH_OVER_A,
  gaussianExpectationEV,
  gaussianMinimumEV,
} from "../physics/gaussianTrial"
import { formatPm } from "../physics/format"
import { bindingEnergyEV, radialScale, type MassModel } from "../physics/schrodinger1s"
import { EpistemicTag } from "./EpistemicTag"

const SPREAD = 6.5
const SQUEEZE = 0.45
const Y_HI = 2
const Y_LO = -16

function signedEV(value: number, digits: number) {
  const body = Math.abs(value).toFixed(digits)
  if (value > 0) return `+${body} eV`
  if (value < 0) return `-${body} eV`
  return `${body} eV`
}

function yOf(value: number) {
  const clamped = Math.min(Y_HI, Math.max(Y_LO, value))
  const t = (Y_HI - clamped) / (Y_HI - Y_LO)
  return (12 + t * 68).toFixed(2)
}

function xOf(width: number) {
  const t = (SPREAD - width) / (SPREAD - SQUEEZE)
  const clipped = Math.min(1, Math.max(0, t))
  return (16 + clipped * 248).toFixed(2)
}

export function TrialStage({
  model,
  u,
  compared,
  onU,
  onCompare,
}: {
  model: MassModel
  u: number
  compared: boolean
  onU: (widthOverA: number) => void
  onCompare: () => void
}) {
  const [span, setSpan] = useState({ lo: u, hi: u })
  const [crossed, setCrossed] = useState(false)
  const energy = gaussianExpectationEV(u, model)
  const minimum = gaussianMinimumEV(model)
  const exact = bindingEnergyEV(model)
  const lambda = u * radialScale(model)
  const slider = (SPREAD - u) / (SPREAD - SQUEEZE)

  function change(next: number) {
    onU(next)
    setSpan((current) => ({
      lo: Math.min(current.lo, next),
      hi: Math.max(current.hi, next),
    }))
    if (next < GAUSSIAN_MIN_WIDTH_OVER_A) setCrossed(true)
  }

  const trace = tracePath(span, model)
  const bars = [
    { label: "Localization cost", value: energy.kinetic, tone: "fg" as const },
    { label: "Coulomb attraction", value: Math.abs(energy.potential), tone: "copper" as const },
  ]

  return (
    <section className="border border-line bg-surface" aria-label="Gaussian trial">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <h2 className="font-display text-lg leading-none text-fg">Gaussian trial</h2>
        <EpistemicTag kind="calculated" />
      </div>
      <TrialCloud u={u} />
      <p className="px-3 text-sm text-fg">Shape at this width. No bead. No path.</p>
      <p className="px-3 pb-3 text-sm text-muted">Not hydrogen, and not the exact 1s state.</p>

      <div className="border-t border-line px-3 py-3">
        <p className="font-display text-2xl leading-tight text-fg">Try to crush it</p>
        <div className="mt-3 flex justify-between text-sm text-muted">
          <span>Spread</span>
          <span>Squeeze</span>
        </div>
        <input
          className="mt-1 h-11 w-full accent-copper"
          type="range"
          min={0}
          max={1}
          step={0.002}
          value={slider}
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={Number(slider.toFixed(3))}
          aria-valuetext={`${formatPm(lambda)}, trial total ${signedEV(energy.total, 2)}. Gaussian trial width. This does not compress hydrogen.`}
          aria-label="Try to crush it. Spread to squeeze."
          onChange={(event) => change(SPREAD - Number(event.target.value) * (SPREAD - SQUEEZE))}
        />
        <p className="text-xs tracking-widest text-muted uppercase">
          Model control · Gaussian trial width λ
        </p>
        <p className="mt-2 text-sm text-fg tabular-nums">λ = {formatPm(lambda)}</p>
      </div>

      <div className="space-y-3 px-3 pb-3">
        {bars.map((bar) => (
          <Meter key={bar.label} label={bar.label} magnitude={bar.value} tone={bar.tone} />
        ))}
        <div>
          <p className="text-sm text-muted">
            Trial total <EpistemicTag kind="calculated" />
          </p>
          <p className="mt-1 font-display text-4xl leading-none text-fg tabular-nums">{signedEV(energy.total, 2)}</p>
          <p className="mt-1 text-sm text-muted">At this λ. For this family only.</p>
        </div>
        <svg viewBox="0 0 280 96" className="h-24 w-full text-fg" role="img" aria-label="Trial energy across the widths already visited">
          <line x1="16" y1={yOf(0)} x2="264" y2={yOf(0)} stroke="currentColor" className="text-line" />
          {compared ? (
            <line
              x1="16"
              y1={yOf(exact)}
              x2="264"
              y2={yOf(exact)}
              stroke="currentColor"
              strokeDasharray="2 3"
            />
          ) : null}
          {trace ? <path d={trace} fill="none" stroke="currentColor" strokeWidth="2.4" className="text-copper" /> : null}
          {crossed ? (
            <line
              x1={xOf(GAUSSIAN_MIN_WIDTH_OVER_A)}
              y1="12"
              x2={xOf(GAUSSIAN_MIN_WIDTH_OVER_A)}
              y2="80"
              stroke="currentColor"
              strokeDasharray="2 3"
              className="text-copper"
            />
          ) : null}
          <circle cx={xOf(u)} cy={yOf(energy.total)} r="4" className="fill-copper" />
          {compared ? (
            <text x="260" y={yOf(exact)} textAnchor="end" fill="currentColor" fontSize="12">
              E₁
            </text>
          ) : null}
        </svg>
        <p className="text-sm text-muted">The trace is only the widths you have already tried.</p>
        {energy.total > Y_HI ? (
          <p className="text-sm text-muted">Above the chart. The number is still the trial total.</p>
        ) : null}
        {crossed ? (
          <p className="text-sm text-fg">
            Lowest for this family: {signedEV(minimum, 3)}. Not the hydrogen eigenvalue.
          </p>
        ) : null}
        {crossed && !compared ? (
          <button
            type="button"
            className="min-h-11 w-full border border-fg px-3 py-3 text-center text-sm tracking-widest text-fg uppercase"
            onClick={onCompare}
          >
            Compare with exact 1s
          </button>
        ) : null}
        {compared ? (
          <p className="text-sm text-muted">Exact 1s is below. This control still moves only the trial.</p>
        ) : null}
      </div>
    </section>
  )
}

function Meter({
  label,
  magnitude,
  tone,
}: {
  label: string
  magnitude: number
  tone: "fg" | "copper"
}) {
  const fraction = Math.max(0.02, Math.min(1, magnitude / 30))
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted">{label}</span>
        <span className="text-fg tabular-nums">{signedEV(tone === "copper" ? -magnitude : magnitude, 2)}</span>
      </div>
      <div className="mt-1 h-2 bg-line">
        <div
          className={tone === "copper" ? "h-2 bg-copper" : "h-2 bg-fg"}
          style={{ width: `${(fraction * 100).toFixed(1)}%` }}
        />
      </div>
    </div>
  )
}

function TrialCloud({ u }: { u: number }) {
  const bands = 16
  const maxA = 3.4
  const maxR = 74
  return (
    <svg viewBox="0 0 200 168" className="mx-auto h-44 w-full text-copper" role="img" aria-label="Gaussian trial shape at the current width. No orbit.">
      {Array.from({ length: bands }, (_, index) => {
        const radiusOverA = ((index + 0.5) / bands) * maxA
        const radius = Number(((radiusOverA / maxA) * maxR).toFixed(2))
        const width = Number(((maxA / bands) * maxR * 1.15).toFixed(2))
        const opacity = Number(Math.exp(-((radiusOverA / u) ** 2)).toFixed(4))
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
  )
}

function tracePath(span: { lo: number; hi: number }, model: MassModel) {
  if (span.hi - span.lo < 0.01) return ""
  const count = 72
  let path = ""
  for (let i = 0; i <= count; i++) {
    const width = span.hi - (span.hi - span.lo) * (i / count)
    const total = gaussianExpectationEV(width, model).total
    const x = xOf(width)
    const y = yOf(total)
    path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
  }
  return path
}
