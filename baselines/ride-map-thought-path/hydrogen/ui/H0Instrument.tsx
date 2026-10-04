import { useEffect, useRef, useState } from "react"
import { GAUSSIAN_BINDING_FRACTION, gaussianExpectationEV, gaussianMinimumEV } from "../physics/gaussianTrial"
import { bindingEnergyEV, radialScale, type MassModel } from "../physics/schrodinger1s"
import { formatPm } from "../physics/format"
import { CalculationDrawer } from "./CalculationDrawer"
import { usePrefersReducedMotion } from "./ClassicalStage"
import { EpistemicTag } from "./EpistemicTag"
import { HydrogenTree } from "./HydrogenTree"
import { LivingAtom, type AtomMode } from "./LivingAtom"
import { QuantumStage } from "./QuantumStage"
import { TrialStage } from "./TrialStage"

export function H0Instrument() {
  const reducedMotion = usePrefersReducedMotion()
  const [mode, setMode] = useState<AtomMode>("classical")
  const [eta, setEta] = useState(0)
  const [balanced, setBalanced] = useState(false)
  const [compare, setCompare] = useState(false)
  const [trialOpen, setTrialOpen] = useState(false)
  const [model, setModel] = useState<MassModel>("reduced")
  const [trialU, setTrialU] = useState(6.5)
  const [trialCompared, setTrialCompared] = useState(false)
  const trialRef = useRef<HTMLDivElement>(null)
  const visualEta = mode === "classical" ? 0 : eta

  useEffect(() => {
    if (!trialOpen) return
    trialRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" })
  }, [trialOpen, reducedMotion])

  function chooseMode(next: AtomMode) {
    setMode(next)
    setCompare(false)
    if (next === "classical") setEta(0)
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-bg px-4 pb-20 text-fg">
      <header className="pt-4 pb-3">
        <p className="text-xs tracking-widest text-muted uppercase">MisterY Labs · Hydrogen</p>
        <h1 className="mt-1 font-display text-3xl leading-none text-fg">Hydrogen</h1>
        <p className="mt-1 text-base text-fg">Why doesn't hydrogen collapse?</p>
      </header>

      {compare ? (
        <div>
          <div className="grid grid-cols-2 gap-2">
            <LivingAtom mode="quantum" eta={0} reduced={reducedMotion} compact showLedger={false} />
            <LivingAtom mode="sed" eta={eta} reduced={reducedMotion} compact showLedger={false} />
          </div>
          <p className="mt-2 text-center font-display text-xl leading-tight text-fg">
            Same observed stability · different model ontology
          </p>
          <button
            type="button"
            className="mt-2 min-h-11 w-full border border-line px-3 text-sm text-fg"
            onClick={() => setCompare(false)}
          >
            Leave the comparison
          </button>
        </div>
      ) : (
        <LivingAtom
          mode={mode}
          eta={visualEta}
          reduced={reducedMotion}
          onBalanced={() => setBalanced(true)}
        />
      )}

      <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Model ontology">
        {(
          [
            ["classical", "Classical"],
            ["sed", "Puthoff SED"],
            ["quantum", "Quantum 1s"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id && !compare}
            className={
              mode === id && !compare
                ? "min-h-11 border border-fg px-1 text-sm text-fg"
                : "min-h-11 border border-line px-1 text-sm text-muted"
            }
            onClick={() => chooseMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {balanced && !compare && mode !== "classical" ? (
        <button
          type="button"
          className="mt-3 min-h-11 w-full border border-fg px-3 py-3 text-sm tracking-widest text-fg uppercase"
          onClick={() => setCompare(true)}
        >
          Compare descriptions
        </button>
      ) : null}

      {mode !== "quantum" ? (
        <div className="mt-3 border border-line bg-surface px-3 py-3">
          <div className="flex justify-between text-sm text-muted">
            <span>Radiation only</span>
            <span>η = 1 published</span>
          </div>
          <input
            className="mt-1 h-11 w-full accent-copper"
            type="range"
            min={0}
            max={1}
            step={0.002}
            value={visualEta}
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={Number(visualEta.toFixed(3))}
            aria-valuetext={etaCaption(visualEta)}
            aria-label="Counterfactual eta. Not a measured ZPF strength."
            onChange={(event) => {
              const next = Number(event.target.value)
              setEta(next)
              if (next > 0.001) setMode("sed")
              else setMode("classical")
            }}
          />
          <p className="text-xs leading-snug text-muted">{etaCaption(visualEta)}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">The 1s density does not take this counterfactual. The field stays off this picture.</p>
      )}

      <div className="mt-4">
        <HydrogenTree
          modelName={modelName(mode, compare)}
          focusId={focusId(mode, compare)}
          visited={litIds(mode, compare)}
          onOpenTrial={() => setTrialOpen(true)}
        />
      </div>

      {trialOpen ? (
        <div ref={trialRef} className="mt-4">
          <TrialStage
            model={model}
            u={trialU}
            compared={trialCompared}
            onU={(value) => {
              setTrialU(value)
            }}
            onCompare={() => setTrialCompared(true)}
          />
          {trialCompared ? <Comparison model={model} trialU={trialU} /> : null}
        </div>
      ) : null}

      <CalculationDrawer model={model} onModel={setModel} />
    </main>
  )
}

function etaCaption(eta: number) {
  const value = eta.toFixed(2)
  if (eta <= 0.001) return `η = ${value} · radiation only. Not a measured ZPF strength.`
  if (eta >= 0.995) return `η = ${value} · published Puthoff absorption. Not a measured ZPF strength.`
  return `η = ${value} · MisterY Labs sensitivity test. Not a measured ZPF strength.`
}

function modelName(mode: AtomMode, compare: boolean) {
  if (compare) return "Both descriptions"
  if (mode === "quantum") return "Schrödinger 1s"
  if (mode === "sed") return "Puthoff 1987"
  return "Classical collapse"
}

function focusId(mode: AtomMode, compare: boolean) {
  if (compare) return "hydrogen"
  if (mode === "quantum") return "psi"
  if (mode === "sed") return "puthoff-1987"
  return "collapse-tau"
}

function litIds(mode: AtomMode, compare: boolean) {
  const classical = ["hydrogen", "planetary-picture", "classical-orbit", "larmor", "collapse-tau", "obs-stable", "rutherford"]
  const quantum = ["hydrogen", "schrodinger", "psi", "e1", "pr", "born-rule", "codata"]
  const sed = ["hydrogen", "puthoff-1987", "larmor", "classical-orbit", "obs-stable", "h-seam-1"]
  if (compare) return [...new Set([...quantum, ...sed])]
  if (mode === "quantum") return quantum
  if (mode === "sed") return sed
  return classical
}

function Comparison({ model, trialU }: { model: MassModel; trialU: number }) {
  const current = gaussianExpectationEV(trialU, model).total
  const minimum = gaussianMinimumEV(model)
  const exact = bindingEnergyEV(model)
  const gap = minimum - exact
  const a = radialScale(model)

  return (
    <div className="mt-3 space-y-3">
      <QuantumStage model={model} trialU={trialU} />
      <div className="border border-line px-3 py-3">
        <p className="text-sm text-fg">
          <EpistemicTag kind="calculated" /> At this λ the trial total is {current.toFixed(3)} eV. The lowest this
          family can reach is {minimum.toFixed(3)} eV. The exact eigenvalue is {exact.toFixed(6)} eV.
        </p>
        <p className="mt-2 text-sm text-fg">
          The exact result is more tightly bound by {gap.toFixed(3)} eV. Binding fraction{" "}
          {GAUSSIAN_BINDING_FRACTION.toFixed(4)}, not fitted.
        </p>
        <p className="mt-2 text-sm text-muted">
          <EpistemicTag kind="interpreted" /> The miss is the restricted shape. Squeezing this family further does
          not close it, and the slider does not move the exact curve.
        </p>
        <p className="mt-2 text-sm text-muted tabular-nums">
          λ = {formatPm(trialU * a)}. Exact most probable radius {formatPm(a)}. Exact mean {formatPm(1.5 * a)}.
        </p>
      </div>
    </div>
  )
}
