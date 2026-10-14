import { useEffect, useRef, useState } from "react"
import { collapseTimeSeconds } from "../physics/classicalCollapse"
import { CODATA_2022 } from "../physics/constants"
import { formatPm, formatSeconds, formatTiny } from "../physics/format"
import {
  absorbedPowerWatts,
  absorptionRatio,
  balanceRadiusMeters,
  ledgerRadiusRate,
  netPowerWatts,
  radiatedPowerWatts,
} from "../physics/puthoff1987"
import { EpistemicTag } from "./EpistemicTag"
import { StationaryScene } from "./StationaryScene"

export type AtomMode = "classical" | "sed" | "quantum"

const A0 = CODATA_2022.bohrRadius
const LOOP_MS = 6400
const CX = 180
const CY = 132

type Frame = { s: number; angle: number; time: number }

function loopScale(t: number): number {
  if (t < 0.14) return 1
  if (t < 0.72) {
    const u = (t - 0.14) / 0.58
    return 1 - 0.94 * u * u
  }
  if (t < 0.84) return 0.06
  return 0.06 + 0.94 * ((t - 0.84) / 0.16)
}

function regime(ratio: number): "loss" | "balance" | "surplus" {
  if (ratio < 0.97) return "loss"
  if (ratio <= 1.03) return "balance"
  return "surplus"
}

export function LivingAtom({
  mode,
  eta,
  reduced,
  compact = false,
  showLedger = true,
  onBalanced,
}: {
  mode: AtomMode
  eta: number
  reduced: boolean
  compact?: boolean
  showLedger?: boolean
  onBalanced?: () => void
}) {
  const [frame, setFrame] = useState<Frame>({ s: 1, angle: 0.4, time: 0 })
  const radiusRef = useRef<number>(A0)
  const angleRef = useRef(0.4)
  const etaRef = useRef(eta)
  const modeRef = useRef(mode)
  const balancedRef = useRef(onBalanced)
  etaRef.current = eta
  modeRef.current = mode
  balancedRef.current = onBalanced

  useEffect(() => {
    if (reduced) return
    let last = performance.now()
    let loopStart = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const currentMode = modeRef.current
      const currentEta = currentMode === "classical" ? 0 : etaRef.current
      const looping = currentMode !== "sed" || currentEta <= 0.01
      if (currentMode !== "quantum") {
        if (looping) {
          const t = ((now - loopStart) % LOOP_MS) / LOOP_MS
          radiusRef.current = loopScale(t) * A0
        } else {
          loopStart = now
          const ref = Math.abs(ledgerRadiusRate(0, A0)) || 1
          // Playback only. The sign and the fixed point are the ledger. τ_visual ≈ 1.6 s.
          const step = (ledgerRadiusRate(currentEta, radiusRef.current) / ref) * (A0 / 0.8) * dt
          const capped = Math.max(-A0 * 0.035, Math.min(A0 * 0.035, step))
          radiusRef.current = Math.min(1.8 * A0, Math.max(0.05 * A0, radiusRef.current + capped))
        }
        const spin = 1.6 * Math.sqrt(A0 / Math.max(radiusRef.current, 0.08 * A0))
        angleRef.current += spin * dt
        const ratio = absorptionRatio(currentEta, radiusRef.current)
        if (currentMode === "sed" && currentEta > 0.98 && ratio > 0.97 && ratio < 1.03) {
          balancedRef.current?.()
        }
      }
      setFrame({
        s: radiusRef.current / A0,
        angle: angleRef.current,
        time: now / 1000,
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  useEffect(() => {
    if (!reduced || mode !== "sed" || eta <= 0.98) return
    onBalanced?.()
  }, [reduced, mode, eta, onBalanced])

  if (mode === "quantum") {
    return (
      <div>
        {compact ? null : (
          <>
            <p className="mb-2 text-sm text-fg">
              <EpistemicTag kind="interpreted" /> No bead. A state, not a trajectory.
            </p>
            <p className="mb-2 font-display text-2xl leading-tight text-fg">This is not a repaired orbit.</p>
          </>
        )}
        <StationaryScene reduced={reduced} />
      </div>
    )
  }

  const visualEta = mode === "classical" ? 0 : eta
  const s = reduced ? (visualEta > 0.01 ? balanceRadiusMeters(visualEta) / A0 : 1) : frame.s
  const radius = Math.max(s, 0.05) * A0
  const angle = reduced ? 0.4 : frame.angle
  const time = reduced ? 0 : frame.time
  const radiated = radiatedPowerWatts(radius)
  const absorbed = visualEta * absorbedPowerWatts(radius)
  const net = netPowerWatts(visualEta, radius)
  const ratio = absorptionRatio(visualEta, radius)
  const kind = regime(ratio)
  const orbit = 18 + Math.min(s, 1.7) * 78
  const beadX = CX + orbit * Math.cos(angle)
  const beadY = CY + orbit * Math.sin(angle)
  const glow = Math.max(0.25, Math.min(1, radiated / radiatedPowerWatts(A0)))
  const solved = balanceRadiusMeters(visualEta)
  const solvedOverA = solved / A0

  return (
    <figure className="border border-line bg-surface">
      <figcaption className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <span className="font-display text-lg leading-none text-fg">
          {mode === "sed" ? "Puthoff SED" : "Classical model"}
        </span>
        <span className="text-xs tracking-widest text-muted uppercase">
          {mode === "sed" ? (compact ? "SED model" : "Calculated") : "Time scaled"}
        </span>
      </figcaption>
      <svg
        viewBox="0 0 360 250"
        className={compact ? "h-36 w-full" : "h-56 w-full"}
        role="img"
        aria-label={
          mode === "sed"
            ? "Classical orbit with a stochastic zero-point field. The dashed copper ring is the calculated η²a₀ guide, not a proposal of Puthoff. The bead is not the Schrödinger density."
            : "Classical model, time scaled. A bead on an orbit that radiates and collapses, then repeats."
        }
      >
        {mode === "sed" && visualEta > 0.02
          ? Array.from({ length: 28 }, (_, index) => {
              const ang = (index / 28) * Math.PI * 2 + time * (0.25 + (index % 3) * 0.08)
              const rad = 112 + (index % 5) * 7 + Math.sin(time * 1.8 + index) * 5 * visualEta
              return (
                <circle
                  key={index}
                  cx={(CX + Math.cos(ang) * rad).toFixed(2)}
                  cy={(CY + Math.sin(ang) * rad * 0.72).toFixed(2)}
                  r={(1.3 + (index % 3) * 0.4).toFixed(1)}
                  fill="currentColor"
                  className="text-muted"
                  opacity={(0.18 + 0.55 * visualEta).toFixed(2)}
                />
              )
            })
          : null}
        <circle cx={CX} cy={CY} r={orbit.toFixed(2)} fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 4" className="text-line" />
        {mode === "sed" && visualEta > 0.01 ? (
          <g className="text-copper">
            <circle
              cx={CX}
              cy={CY}
              r={(18 + Math.min(solvedOverA, 1.7) * 78).toFixed(2)}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="1 3"
            />
            <text
              x={CX}
              y={(CY - (18 + Math.min(solvedOverA, 1.7) * 78) - 4).toFixed(1)}
              textAnchor="middle"
              fill="currentColor"
              fontSize="10"
            >
              η²a₀ guide
            </text>
          </g>
        ) : null}
        <circle cx={CX} cy={CY} r="4.2" className="fill-fg" />
        {Array.from({ length: 8 }, (_, index) => {
          const ray = angle + (index * Math.PI) / 4
          const inner = orbit + 6
          const outer = inner + 8 + 16 * glow
          return (
            <line
              key={index}
              x1={(CX + Math.cos(ray) * inner).toFixed(2)}
              y1={(CY + Math.sin(ray) * inner).toFixed(2)}
              x2={(CX + Math.cos(ray) * outer).toFixed(2)}
              y2={(CY + Math.sin(ray) * outer).toFixed(2)}
              stroke="currentColor"
              strokeWidth="1.4"
              className="text-copper"
              opacity={(0.35 + 0.5 * glow).toFixed(2)}
            />
          )
        })}
        {visualEta > 0.02
          ? Array.from({ length: 8 }, (_, index) => {
              const ray = -angle + (index * Math.PI) / 4
              const outer = orbit + 34
              const inner = orbit + 14
              return (
                <line
                  key={index}
                  x1={(CX + Math.cos(ray) * outer).toFixed(2)}
                  y1={(CY + Math.sin(ray) * outer).toFixed(2)}
                  x2={(CX + Math.cos(ray) * inner).toFixed(2)}
                  y2={(CY + Math.sin(ray) * inner).toFixed(2)}
                  stroke="currentColor"
                  strokeWidth="1.4"
                  className="text-fg"
                  opacity={Math.max(0.15, Math.min(0.9, ratio)).toFixed(2)}
                />
              )
            })
          : null}
        <circle cx={beadX.toFixed(2)} cy={beadY.toFixed(2)} r="5" className="fill-copper" />
      </svg>
      <div className="px-3 pb-2">
        {mode === "sed" && visualEta > 0.01 ? (
          <p className="text-xs tracking-widest text-fg uppercase">SED classical zero-point field</p>
        ) : null}
        {showLedger ? (
          <>
            <p className="mt-1 text-sm text-muted tabular-nums">
              Radius {formatPm(radius)}
              {mode === "sed" && visualEta > 0.01
                ? ` · η²a₀ guide ${formatPm(solved)}${Math.abs(solvedOverA - 1) < 0.02 ? " · equals a₀" : ""}`
                : ""}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Meter label="Radiated" value={radiated} />
              <Meter label="Absorbed" value={absorbed} />
              <Meter label="Net" value={net} signed />
            </div>
            <p className="mt-3 font-display text-3xl leading-none text-fg tabular-nums">
              {ratio.toFixed(2)}
            </p>
            <p className="text-xs tracking-widest text-muted uppercase">η P_abs / P_rad</p>
            <p className={kind === "balance" ? "mt-2 text-sm text-copper" : "mt-2 text-sm text-fg"}>
              {kind === "loss" ? "Loss dominates." : null}
              {kind === "balance" ? "Absorption ↔ radiation. Dynamic balance." : null}
              {kind === "surplus"
                ? "Absorption exceeds radiation. No separate surplus orbit in the 1987 paper."
                : null}
            </p>
            {mode === "sed" && visualEta > 0.01 ? null : (
              <p className="mt-2 text-sm text-muted">Time scaled. Not a literal 10⁻¹¹ s playback.</p>
            )}
            {compact ? null : (
              <details className="mt-2 border-t border-line pt-1">
                <summary className="cursor-pointer py-2 text-sm text-fg">Where the powers come from</summary>
                <p className="mt-2 text-sm text-muted">(17) Circular orbit, two oscillators in quadrature.</p>
                <p className="mt-1 text-sm text-fg">(18) P_abs = e² ℏ ω₀³ / (6π ε₀ m c³)</p>
                <p className="mt-1 text-sm text-fg">(19) P_rad = e² r₀² ω₀⁴ / (6π ε₀ c³)</p>
                <p className="mt-1 text-sm text-fg">(20) m ω₀ r₀² = ℏ when (18) equals (19).</p>
                <p className="mt-2 text-sm text-muted">
                  η is not in Puthoff 1987. η = 1 uses the published absorption (18). Values between are MisterY Labs
                  counterfactual sensitivity tests, not a measured ZPF strength. With the Coulomb circle, η P_abs = P_rad
                  solves r_eq = η²a₀. That guide is calculated here. Puthoff did not propose η. The moving radius is the
                  energy ledger, slowed. The 1987 paper does not integrate r(t). Model clock {formatSeconds(collapseTimeSeconds())}.
                </p>
              </details>
            )}
          </>
        ) : null}
      </div>
    </figure>
  )
}

function Meter({ label, value, signed }: { label: string; value: number; signed?: boolean }) {
  const text = signed ? `${value < 0 ? "−" : "+"}${formatTiny(Math.abs(value))} W` : `${formatTiny(value)} W`
  return (
    <div>
      <p className="text-xs tracking-widest text-muted uppercase">{label}</p>
      <p className="mt-1 text-sm text-fg tabular-nums">{text}</p>
    </div>
  )
}
