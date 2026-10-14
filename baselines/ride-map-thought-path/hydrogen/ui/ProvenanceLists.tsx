import { useState } from "react"
import { hydrogenEdges, hydrogenNodes, rejectedResonance } from "../model/graph"
import type { Edge, Node, Register, Relation, Stratum } from "../model/types"
import { validateGraph } from "../model/validate"
import { EpistemicTag } from "./EpistemicTag"

const STRATA: { id: Stratum; label: string; note: string }[] = [
  { id: "root", label: "Roots", note: "Equations, experiments, constants, derivations." },
  { id: "trunk", label: "Trunk", note: "The hydrogen object and what is calculated or observed of it." },
  { id: "branch", label: "Branches", note: "Readings. None of these are allowed to change the curve." },
  { id: "seam", label: "Seam", note: "A hypothesized graft. No edges, so it cannot alter either model." },
]

const VERB: Record<Relation, string> = {
  derives_from: "derives from",
  measured_by: "measured by",
  corrects: "corrects",
  competes_with: "competes with",
  approximates: "approximates",
  interprets: "interprets",
  inspired_by: "inspired by",
  resonates_with: "resonates with",
}

const REGISTER: Record<Register, string> = {
  physical_correspondence: "Physical correspondence",
  historical_influence: "Historical influence",
  philosophical_resonance: "Philosophical resonance",
  spiritual_interpretation: "Spiritual interpretation",
}

function titleOf(id: string): string {
  return hydrogenNodes.find((node) => node.id === id)?.title ?? id
}

function NodeCard({
  node,
  selected,
  onSelect,
}: {
  node: Node
  selected: boolean
  onSelect: (id: string) => void
}) {
  const outgoing = hydrogenEdges.filter((edge) => edge.from === node.id)
  const incoming = hydrogenEdges.filter((edge) => edge.to === node.id)
  return (
    <article className={selected ? "mt-2 border border-fg bg-surface px-2 py-3" : "border-t border-line py-3"}>
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(node.id)}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-sm text-fg">
          {node.title}
          {node.year && !node.title.includes(String(node.year)) ? (
            <span className="text-muted"> {node.year}</span>
          ) : null}
        </span>
        <EpistemicTag kind={node.epistemic} />
      </button>
      <p className="mt-1 text-sm text-muted">{node.claim}</p>
      {node.source ? <p className="mt-1 text-xs text-muted">{node.source}</p> : null}
      {selected && node.register ? (
        <p className="mt-1 text-xs text-muted">{REGISTER[node.register]}</p>
      ) : null}
      <ul className="mt-2 space-y-1">
        {outgoing.length === 0 ? (
          <li className="text-xs text-muted">No outgoing edge. The object, not a result.</li>
        ) : (
          outgoing.map((edge) => <EdgeLine key={edge.id} edge={edge} direction="out" />)
        )}
        {selected
          ? incoming.map((edge) => <EdgeLine key={edge.id} edge={edge} direction="in" />)
          : null}
      </ul>
      {selected ? (
        <p className="mt-2 text-xs text-muted">Selecting this claim does not change the pictures above.</p>
      ) : null}
    </article>
  )
}

function EdgeLine({ edge, direction }: { edge: Edge; direction: "out" | "in" }) {
  const text =
    direction === "out"
      ? `${VERB[edge.relation]} ${titleOf(edge.to)}`
      : `${titleOf(edge.from)} ${VERB[edge.relation]} this`
  return (
    <li className="text-xs text-fg">
      {text}
      <span className="text-muted"> — {edge.note}</span>
    </li>
  )
}

function FixtureRow({ edge }: { edge: Edge }) {
  return (
    <p className="mt-2 text-sm text-fg">
      {titleOf(edge.from)} {VERB[edge.relation]} → {titleOf(edge.to)}
    </p>
  )
}

export function ProvenanceLists() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const accepted = validateGraph(hydrogenNodes, hydrogenEdges)
  const rejected = validateGraph(hydrogenNodes, [rejectedResonance])

  function select(id: string) {
    setSelectedId((current) => (current === id ? null : id))
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-muted">
        The ledger for the tree. Selecting a claim still does not change the pictures or the calculations.
      </p>
      <div className="mt-4 border border-copper bg-surface px-3 py-3">
        <p className="text-xs tracking-widest text-copper uppercase">Validator</p>
        <p className="mt-1 text-sm text-fg">
          Accepted graph — {hydrogenNodes.length} nodes, {hydrogenEdges.length} edges
          {accepted.length === 0 ? " — no violations." : ` — ${accepted.length} violations.`}
        </p>
        <FixtureRow edge={rejectedResonance} />
        {rejected.map((violation) => (
          <p key={violation.code} className="mt-1 text-sm text-copper">
            Rejected · {violation.code}. {violation.message}
          </p>
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {(["observed", "calculated", "interpreted", "hypothesized"] as const).map((kind) => (
          <li key={kind}>
            <EpistemicTag kind={kind} />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-muted">
        Hypothesized is worn by the seam. The seam has no edges and is not admitted onto the 1s curve.
      </p>
      {STRATA.map((stratum) => (
        <div key={stratum.id} className="mt-6">
          <h3 className="font-display text-xl text-fg">{stratum.label}</h3>
          <p className="text-sm text-muted">{stratum.note}</p>
          {hydrogenNodes
            .filter((node) => node.stratum === stratum.id)
            .map((node) => (
              <NodeCard key={node.id} node={node} selected={node.id === selectedId} onSelect={select} />
            ))}
        </div>
      ))}
    </div>
  )
}
