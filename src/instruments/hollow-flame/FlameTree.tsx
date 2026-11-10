import { useEffect, useState } from "react"
import { flameEdges, flameNodes, rejectedResonance } from "@/instruments/hollow-flame/tree/graph.ts"
import { subscribeTreeFocus } from "@/instruments/hollow-flame/tree/focus.ts"
import { placeFlameTree, TREE_HEIGHT, TREE_WIDTH, type PlacedNode } from "@/instruments/hollow-flame/tree/layout.ts"
import { sourceById } from "@/instruments/hollow-flame/tree/sources.ts"
import type { Epistemic, Node, Relation } from "@/instruments/hollow-flame/tree/types.ts"
import { validateGraph } from "@/instruments/hollow-flame/tree/validate.ts"

const STROKE: Record<Relation, { dash?: string; width: number; className: string; label: string }> = {
  derives_from: { width: 1.6, className: "text-paper", label: "derives from" },
  measured_by: { width: 1.6, dash: "8 2 1 2", className: "text-paper", label: "measured by" },
  corrects: { width: 1.7, className: "text-ember", label: "corrects" },
  competes_with: { width: 1.7, dash: "6 4", className: "text-ember", label: "competes with" },
  approximates: { width: 1.5, dash: "3 3", className: "text-frost", label: "approximates" },
  interprets: { width: 1.4, dash: "1 3.2", className: "text-dust", label: "interprets" },
  inspired_by: { width: 1.4, dash: "5 2 1 2", className: "text-dust", label: "inspired by" },
  resonates_with: { width: 1.5, dash: "2 2", className: "text-ember", label: "resonates with" },
}

const EPISTEMIC: Record<Epistemic, string> = {
  observed: "Observed",
  calculated: "Calculated",
  interpreted: "Interpreted",
  hypothesized: "Hypothesized",
}

const placed = placeFlameTree(flameNodes)
const byId = new Map(placed.map((node) => [node.id, node]))
const nodeById = new Map(flameNodes.map((node) => [node.id, node]))

const DIRECTIONS: { title: string; match: (edge: { from: string; to: string; relation: Relation }, id: string) => boolean }[] = [
  {
    title: "Inputs / ancestry",
    match: (edge, id) => edge.from === id && (edge.relation === "derives_from" || edge.relation === "inspired_by"),
  },
  {
    title: "Derives / results",
    match: (edge, id) => edge.to === id && edge.relation === "derives_from",
  },
  {
    title: "Measurements",
    match: (edge, id) => edge.relation === "measured_by" && (edge.from === id || edge.to === id),
  },
  {
    title: "Corrections / approximations",
    match: (edge, id) =>
      (edge.relation === "corrects" || edge.relation === "approximates") && (edge.from === id || edge.to === id),
  },
  {
    title: "Interpretations / resonances",
    match: (edge, id) =>
      ((edge.relation === "interprets" || edge.relation === "resonates_with") && (edge.from === id || edge.to === id)) ||
      (edge.relation === "inspired_by" && edge.to === id),
  },
]

export function FlameTree() {
  const [open, setOpen] = useState(false)
  const [path, setPath] = useState<string[]>([])
  const [showReject, setShowReject] = useState(false)
  const refused = validateGraph(flameNodes, [rejectedResonance])
  const selectedId = path[path.length - 1] ?? null
  const selected = selectedId ? (nodeById.get(selectedId) ?? null) : null

  useEffect(() => {
    return subscribeTreeFocus((id) => {
      setOpen(true)
      setPath((current) => {
        const index = current.indexOf(id)
        if (index >= 0) return current.slice(0, index + 1)
        return [id]
      })
    })
  }, [])

  function choose(id: string) {
    setPath((current) => {
      const index = current.indexOf(id)
      if (index >= 0) return current.slice(0, index + 1)
      return [...current, id]
    })
  }

  function toggle(id: string) {
    setPath((current) => (current.length === 1 && current[0] === id ? [] : [id]))
  }

  return (
    <section id="tree" className="scroll-mt-20 border-t border-line px-4 py-10" aria-label="Hollow Flame tree">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <header className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-ember uppercase">Map</p>
          <h2 className="pt-2 font-display text-3xl text-paper sm:text-4xl">What maintains the form</h2>
          <p className="pt-3 text-dust">
            Roots are the scientific record. The trunk is the hollow flame you can still perturb above. Branches are comparisons. A resonance is not a derivation.
          </p>
        </header>
        <div className="border border-line bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
            <h3 className="font-display text-lg text-paper">Hollow Flame tree</h3>
            <button
              type="button"
              className="min-h-11 px-2 text-sm text-paper underline decoration-line underline-offset-4"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? "Close the tree" : "Open the tree"}
            </button>
          </div>
          {open ? (
            <FullTree selectedId={selectedId} showReject={showReject} onToggle={toggle} />
          ) : (
            <MiniTree />
          )}
          {selected ? <Lineage path={path} origin={selected} onChoose={choose} onBack={() => setPath((current) => current.slice(0, -1))} /> : null}
          {open ? (
            <details className="border-t border-line px-3 py-2">
              <summary className="min-h-11 cursor-pointer text-sm text-paper">Audit / sources</summary>
              <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
                {(Object.keys(STROKE) as Relation[]).map((relation) => (
                  <li key={relation} className="flex items-center gap-2 text-xs text-dust">
                    <svg viewBox="0 0 36 8" className={`h-2 w-9 ${STROKE[relation].className}`} aria-hidden="true">
                      <line
                        x1="0"
                        y1="4"
                        x2="36"
                        y2="4"
                        stroke="currentColor"
                        strokeWidth={STROKE[relation].width}
                        strokeDasharray={STROKE[relation].dash}
                      />
                    </svg>
                    {STROKE[relation].label}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-3 min-h-11 w-full border border-ember px-3 text-left text-sm text-ember"
                aria-pressed={showReject}
                onClick={() => setShowReject((value) => !value)}
              >
                {showReject ? "Hide the rejected resonance" : "Try resonates_with → the Hollow Flame"}
              </button>
              {showReject ? (
                <p className="mt-2 text-sm text-ember">
                  Rejected · {refused[0]?.code}. {refused[0]?.message} The line stops short of the trunk.
                </p>
              ) : null}
              <ul className="mt-4 flex flex-col gap-3 border-t border-line pt-3">
                {flameNodes
                  .filter((node) => node.stratum === "root")
                  .map((node) => {
                    const record = sourceById(node.sourceId)
                    return (
                      <li key={node.id} className="text-sm">
                        <p className="text-paper">{node.title}</p>
                        <p className="text-dust">{node.source}</p>
                        {record ? (
                          <a className="text-paper underline decoration-ember/50 underline-offset-4" href={record.url} target="_blank" rel="noreferrer">
                            {record.authors}
                            {record.year ? `, ${record.year}` : ""}
                          </a>
                        ) : null}
                      </li>
                    )
                  })}
              </ul>
            </details>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function MiniTree() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <svg viewBox="0 0 88 96" className="h-24 w-20 shrink-0 text-dust" role="img" aria-label="Compact tree, branches above and roots below">
        <line x1="44" y1="8" x2="44" y2="88" stroke="currentColor" className="text-line" />
        {placed.map((node) => {
          const x = 8 + (node.x / TREE_WIDTH) * 72
          const y = 6 + (node.y / TREE_HEIGHT) * 84
          const trunk = node.id === "hollow-flame"
          return (
            <circle
              key={node.id}
              cx={x.toFixed(1)}
              cy={y.toFixed(1)}
              r={trunk ? 5 : 2.2}
              fill="currentColor"
              className={trunk ? "text-ember" : node.stratum === "root" ? "text-paper" : "text-line"}
            />
          )
        })}
      </svg>
      <div>
        <p className="font-display text-2xl leading-none text-paper">Prometheus</p>
        <p className="mt-1 text-sm text-ember">The Hollow Flame</p>
        <p className="mt-1 text-xs text-dust">1861 · 1928 · 1978 · 2001 · 2010 · 2023</p>
        <p className="mt-1 text-xs text-dust">Branches up. Roots down. Years sit on the sources.</p>
      </div>
    </div>
  )
}

function FullTree({
  selectedId,
  showReject,
  onToggle,
}: {
  selectedId: string | null
  showReject: boolean
  onToggle: (id: string) => void
}) {
  const from = byId.get(rejectedResonance.from)
  const to = byId.get(rejectedResonance.to)
  return (
    <div className="max-w-full min-w-0 overflow-x-auto" style={{ touchAction: "pan-x" }}>
      <svg viewBox={`0 0 ${TREE_WIDTH} ${TREE_HEIGHT}`} className="h-auto w-[720px] max-w-none text-paper" role="group" aria-label="Hollow Flame tree">
        <line x1={TREE_WIDTH / 2} y1="24" x2={TREE_WIDTH / 2} y2="780" stroke="currentColor" strokeWidth="2" className="text-line" />
        {flameEdges.map((edge) => {
          const start = byId.get(edge.from)
          const end = byId.get(edge.to)
          if (!start || !end) return null
          const style = STROKE[edge.relation]
          const hot = selectedId === null || selectedId === edge.from || selectedId === edge.to
          return (
            <path
              key={edge.id}
              d={curve(start, end)}
              fill="none"
              stroke="currentColor"
              strokeWidth={hot ? style.width + 0.5 : style.width}
              strokeDasharray={style.dash}
              className={style.className}
              opacity={hot ? 0.9 : 0.12}
            />
          )
        })}
        {showReject && from && to ? (
          <g className="text-ember">
            <path d={rejectedPath(from, to)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 3" />
            <circle cx={rejectStop(to).x} cy={rejectStop(to).y} r="8" fill="var(--color-surface)" stroke="currentColor" />
            <text x={rejectStop(to).x} y={rejectStop(to).y + 4} textAnchor="middle" fill="currentColor" fontSize="13">
              ×
            </text>
          </g>
        ) : null}
        {placed.map((node) => {
          const source = nodeById.get(node.id)
          if (!source) return null
          const radius = node.id === "hollow-flame" ? 16 : 8
          const label = wrap(source.title)
          const anchor = labelAnchor(node)
          return (
            <g
              key={node.id}
              role="button"
              tabIndex={0}
              aria-pressed={selectedId === node.id}
              aria-label={`${source.title}. ${EPISTEMIC[source.epistemic]}`}
              onClick={() => onToggle(node.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onToggle(node.id)
                }
              }}
            >
              <circle cx={node.x} cy={node.y} r="18" fill="transparent" />
              <circle
                cx={node.x}
                cy={node.y}
                r={radius}
                fill="var(--color-surface)"
                stroke="currentColor"
                strokeWidth={selectedId === node.id || node.id === "hollow-flame" ? 2.4 : 1.2}
                className={node.id === "hollow-flame" ? "text-ember" : selectedId === node.id ? "text-paper" : "text-dust"}
              />
              <text
                x={anchor.x}
                y={anchor.y}
                textAnchor={anchor.anchor}
                fill="currentColor"
                fontSize="11"
                className="text-dust"
                style={{ paintOrder: "stroke", stroke: "var(--color-surface)", strokeWidth: 4 }}
              >
                {label.map((line, index) => (
                  <tspan key={`${line}-${index}`} x={anchor.x} dy={index === 0 ? 0 : 12}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function Lineage({
  path,
  origin,
  onChoose,
  onBack,
}: {
  path: string[]
  origin: Node
  onChoose: (id: string) => void
  onBack: () => void
}) {
  const record = sourceById(origin.sourceId)
  return (
    <article className="border-t border-line px-3 py-3" aria-label="Thought path">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs tracking-widest text-ember uppercase">Thought path</p>
        <div className="flex gap-2">
          {path.length > 1 ? (
            <button type="button" className="min-h-11 px-2 font-mono text-xs tracking-widest text-dust uppercase" onClick={onBack}>
              Back
            </button>
          ) : null}
          <button
            type="button"
            className="min-h-11 border border-ember px-3 font-mono text-xs tracking-widest text-ember uppercase"
            onClick={() => document.getElementById("instrument")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Return to Prometheus
          </button>
        </div>
      </div>
      <ol className="mt-2 flex flex-wrap items-center gap-1">
        {path.map((id, index) => (
          <li key={`${id}-${index}`} className="flex items-center gap-1">
            {index > 0 ? <span className="text-dust">→</span> : null}
            <button type="button" className="min-h-11 text-sm text-paper underline decoration-line" onClick={() => onChoose(id)}>
              {nodeById.get(id)?.title ?? id}
            </button>
          </li>
        ))}
      </ol>
      <p className="text-xs text-dust">Navigation history. Not a derivation. The ride above is unchanged.</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-2xl leading-none text-paper">
          {origin.title}
          {origin.year ? <span className="text-ember"> {origin.year}</span> : null}
        </h3>
        <span className="border border-line px-2 py-1 font-mono text-xs tracking-widest text-dust uppercase">{EPISTEMIC[origin.epistemic]}</span>
      </div>
      {origin.register ? <p className="mt-1 font-mono text-xs tracking-widest text-dust uppercase">{origin.register.replaceAll("_", " ")}</p> : null}
      <p className="mt-2 text-sm text-dust">{origin.claim}</p>
      {origin.source ? <p className="mt-2 text-xs text-dust">{origin.source}</p> : null}
      {record ? (
        <a className="mt-1 inline-flex min-h-11 items-center text-sm text-paper underline decoration-ember/50 underline-offset-4" href={record.url} target="_blank" rel="noreferrer">
          {record.title}
        </a>
      ) : null}
      {origin.id === "hollow-flame" ? (
        <button
          type="button"
          className="mt-3 min-h-11 border border-ember px-3 font-mono text-xs tracking-widest text-ember uppercase"
          onClick={() => document.getElementById("instrument")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          Open the ride
        </button>
      ) : null}
      {origin.id === "vector-fields" ? <DirectionalStructure /> : null}
      {DIRECTIONS.map((group) => {
        const links = flameEdges.filter((edge) => group.match(edge, origin.id))
        if (links.length === 0) return null
        return (
          <div key={group.title} className="mt-3">
            <h4 className="font-mono text-xs tracking-widest text-dust uppercase">{group.title}</h4>
            <ul>
              {links.map((edge) => {
                const other = edge.from === origin.id ? edge.to : edge.from
                const outward = edge.from === origin.id
                return (
                  <li key={edge.id}>
                    <button type="button" className="min-h-11 w-full text-left text-sm text-paper" onClick={() => onChoose(other)}>
                      {outward ? `${STROKE[edge.relation].label} ${titleOf(other)}` : `${titleOf(other)} ${STROKE[edge.relation].label} this`}
                      <span className="block text-xs text-dust">{edge.note}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </article>
  )
}

function DirectionalStructure() {
  return (
    <div className="mt-4 border border-line bg-ink p-3">
      <p className="font-mono text-xs tracking-widest text-ember uppercase">Directional structure</p>
      <p className="pt-2 text-sm text-dust">
        A maintained boundary is a place where something is arriving and something is leaving. These relations are general. Prometheus does not integrate them.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
        <svg viewBox="0 0 120 120" className="h-28 w-28 text-ember" role="img" aria-label="A hollow boundary with outward flux and a circulating flow">
          <circle cx="60" cy="60" r="28" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="60" cy="60" r="10" fill="none" stroke="currentColor" strokeOpacity="0.35" />
          <path d="M60 22 V8 M48 18 60 8 72 18" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M98 60 H112 M104 48 112 60 104 72" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M22 60 H8 M16 48 8 60 16 72" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M78 86c14 6 18 18 8 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-frost" />
          <path d="M84 108 l6 -2 -2 -6" fill="none" stroke="currentColor" className="text-frost" />
        </svg>
        <div className="flex flex-col gap-3 font-mono text-sm text-paper">
          <p>
            Diffusion flux
            <span className="mt-1 block text-base text-ember">J = −D ∇c</span>
          </p>
          <p>
            Species conservation
            <span className="mt-1 block text-base text-ember">∂c/∂t + ∇·(c u) = −∇·J + R</span>
          </p>
        </div>
      </div>
      <p className="pt-3 text-sm text-dust">
        ∇c is the gradient, the direction concentration changes fastest. Divergence ∇· describes whether a region is a source or a sink. Curl describes circulation. A flame’s oxygen flux is inward. Its buoyant flow is upward. Those are different vectors.
      </p>
      <details className="mt-3 border-t border-line pt-2">
        <summary className="min-h-11 cursor-pointer text-sm text-paper">Lie brackets, as a separate mathematics lesson</summary>
        <p className="pt-2 text-sm text-dust">
          If X and Y are directional flows, their Lie bracket measures the failure of those flows to commute:
        </p>
        <p className="py-2 font-mono text-base text-ember">[X, Y] = XY − YX</p>
        <p className="text-sm text-dust">
          Moving along X and then Y does not always land where Y and then X would land. That is a fact about composing vector fields. It is not a derived law of this flame, and it is not a claim about cells, plasmoids, or hollow particles.
        </p>
      </details>
    </div>
  )
}

function titleOf(id: string) {
  return nodeById.get(id)?.title ?? id
}

function curve(start: PlacedNode, end: PlacedNode) {
  const midY = (start.y + end.y) / 2
  return `M ${start.x} ${start.y} Q ${((start.x + end.x) / 2).toFixed(1)} ${midY.toFixed(1)} ${end.x} ${end.y}`
}

function rejectStop(to: PlacedNode) {
  return { x: Math.round(to.x + 36), y: Math.round(to.y - 28) }
}

function rejectedPath(from: PlacedNode, to: PlacedNode) {
  const stop = rejectStop(to)
  const cpx = Math.max(from.x, stop.x) + 24
  const cpy = Math.round((from.y + stop.y) / 2)
  return `M ${from.x} ${from.y} Q ${cpx} ${cpy} ${stop.x} ${stop.y}`
}

function labelAnchor(node: PlacedNode): { x: number; y: number; anchor: "start" | "middle" | "end" } {
  if (node.id === "hollow-flame") return { x: node.x, y: node.y + 32, anchor: "middle" }
  if (node.x < TREE_WIDTH / 2 - 40 && node.stratum === "trunk") return { x: node.x - 14, y: node.y + 4, anchor: "end" }
  if (node.x > TREE_WIDTH / 2 + 40 && node.stratum === "trunk") return { x: node.x + 14, y: node.y + 4, anchor: "start" }
  return { x: node.x, y: node.y + 22, anchor: "middle" }
}

function wrap(title: string): string[] {
  if (title.length <= 18) return [title]
  const words = title.split(" ")
  if (words.length === 1) return [title]
  let pivot = 1
  let best = Number.POSITIVE_INFINITY
  for (let index = 1; index < words.length; index++) {
    const left = words.slice(0, index).join(" ")
    const right = words.slice(index).join(" ")
    const score = Math.abs(left.length - right.length)
    if (score < best) {
      best = score
      pivot = index
    }
  }
  return [words.slice(0, pivot).join(" "), words.slice(pivot).join(" ")]
}
