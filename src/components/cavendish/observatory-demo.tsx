import { useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TorsionBalance } from "@/components/cavendish/torsion-balance";
import { ThetaChart } from "@/components/cavendish/theta-chart";
import { useTorsionSim } from "@/lib/cavendish/use-torsion-sim";
import {
  MODE_META,
  radToDeg,
  type PaisMode,
} from "@/lib/cavendish/physics";

const MODES: PaisMode[] = ["ordinary", "inertia", "gravity"];

export function ObservatoryDemo() {
  const [mode, setMode] = useState<PaisMode>("inertia");
  const [strength, setStrength] = useState(0.8);
  const [damping, setDamping] = useState(0.35);
  const { state, derived, paused, setPaused, reset } = useTorsionSim(
    mode,
    strength,
    damping,
  );

  const meta = MODE_META[mode];
  const strengthPct = Math.round(strength * 100);

  return (
    <div className="cavendish-demo space-y-5">
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2.5 sm:px-5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/80">
              Instrument · Cavendish discriminator
            </div>
            <div className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
              Torsion balance
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaused((p) => !p)}
              className="h-11 min-w-11 px-3 text-xs"
            >
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{paused ? "Play" : "Pause"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              className="h-11 min-w-11 px-3 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </div>
        </div>
        <TorsionBalance
          theta={state.active.theta}
          ghostTheta={state.baseline.theta}
          mode={mode}
          strength={strength}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="panel p-4 sm:p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            Object model
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-background p-1 ring-1 ring-border/80">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={
                  "min-h-11 rounded-lg px-2 py-2 text-center text-[11px] font-medium leading-tight transition-colors sm:text-xs " +
                  (mode === m
                    ? "bg-card text-foreground shadow-[0_0_0_1px_hsl(var(--annotation-cyan))]"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {MODE_META[m].short}
              </button>
            ))}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{meta.insight}</p>

          <label className="mt-5 block">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Effect strength</span>
              <span className="tabular-nums text-cyan-400">{strengthPct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={strengthPct}
              onChange={(e) => setStrength(Number(e.target.value) / 100)}
              className="mt-2 w-full"
              disabled={mode === "ordinary"}
              aria-label="Effect strength"
            />
            <div className="mt-1 font-mono text-[10px] text-muted-foreground/80">
              {mode === "inertia" && (
                <>
                  α = {derived.alpha.toFixed(2)} · I = α I₀
                </>
              )}
              {mode === "gravity" && (
                <>
                  β = {derived.beta.toFixed(2)} · τg = β τ₀
                </>
              )}
              {mode === "ordinary" && <>α = 1 · β = 1 · ordinary mass</>}
            </div>
          </label>

          <label className="mt-4 block">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Damping</span>
              <span className="tabular-nums text-foreground">{derived.c.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={4}
              max={160}
              value={Math.round(damping * 100)}
              onChange={(e) => setDamping(Number(e.target.value) / 100)}
              className="mt-2 w-full"
              aria-label="Damping"
            />
          </label>
        </div>

        <div className="panel p-4 sm:p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            Predicted static deflection
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
            {derived.deflectionRatio.toFixed(2)}
            <span className="ml-1 text-base font-normal text-muted-foreground">× baseline</span>
          </div>
          <div className="mt-4 font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            Oscillation response
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-cyan-400">
            {derived.frequencyRatio.toFixed(2)}
            <span className="ml-1 text-base font-normal text-muted-foreground">× natural frequency</span>
          </div>
          <div className="mt-4 h-px bg-border/60" />
          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[11px]">
            <dt className="text-muted-foreground">θ now</dt>
            <dd className="text-right tabular-nums text-amber-400">{radToDeg(state.active.theta).toFixed(2)}°</dd>
            <dt className="text-muted-foreground">θeq active</dt>
            <dd className="text-right tabular-nums">{radToDeg(derived.thetaEq).toFixed(2)}°</dd>
            <dt className="text-muted-foreground">θeq ordinary</dt>
            <dd className="text-right tabular-nums">{radToDeg(derived.thetaEqBaseline).toFixed(2)}°</dd>
            <dt className="text-muted-foreground">I / I₀</dt>
            <dd className="text-right tabular-nums">{derived.alpha.toFixed(2)}</dd>
            <dt className="text-muted-foreground">τg / τ₀</dt>
            <dd className="text-right tabular-nums">{derived.beta.toFixed(2)}</dd>
          </dl>
          <p className="mt-4 rounded-lg bg-background/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-400">
            {meta.journey}
          </p>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <ThetaChart
          history={state.history}
          t={state.t}
          thetaEq={derived.thetaEq}
          thetaEqBaseline={derived.thetaEqBaseline}
          mode={mode}
        />
      </div>

      <p className="text-center font-mono text-[11px] text-muted-foreground">
        I θ̈ + c θ̇ + kθ = τg
        <span className="mx-2 text-border">·</span>
        θeq = τg / k
        <span className="mx-2 text-border">·</span>
        ωn = √(k / I)
      </p>
    </div>
  );
}
