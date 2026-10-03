import type { Epistemic } from "../model/types"

const LABEL: Record<Epistemic, string> = {
  observed: "Observed",
  calculated: "Calculated",
  interpreted: "Interpreted",
  hypothesized: "Hypothesized",
}

export function EpistemicTag({ kind }: { kind: Epistemic }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-line px-1.5 py-0.5 text-xs tracking-wide text-muted uppercase">
      {LABEL[kind]}
    </span>
  )
}
