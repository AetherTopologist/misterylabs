import { useState } from "react"
import { hydrogenEdges, hydrogenNodes, rejectedResonance } from "../model/graph"
import {
  placeHydrogenTree,
  TREE_HEIGHT,
  TREE_WIDTH,
  type PlacedNode,
} from "../model/treeLayout"
import type { Node, Relation } from "../model/types"
import { validateGraph } from "../model/validate"
import { EpistemicTag } from "./EpistemicTag"
import { ProvenanceLists } from "./ProvenanceLists"

const STROKE: Record<Relation, { dash?: string; width: number; className: string; label: string }> = {
  derives_from: { width: 1.6, className: "text-fg", label: "derives from" },
  measured_by: { width: 1.6, dash: "8 2 1 2", className: "text-fg", label: "measured by" },
  corrects: { width: 1.7, className: "text-copper", label: "corrects" },
  competes_with: { width: 1.7, dash: "6 4", className: "text-copper", label: "competes with" },
  approximates: { width: 1.6, dash: "3 3", className: "text-fg", label: "approximates" },
  interprets: { width: 1.4, dash: "1 3.2", className: "text-muted", label: "interprets" },
  inspired_by: { width: 1.4, dash: "5 2 1 2", className: "text-muted", label: "inspired by" },
  resonates_with: { width: 1.5, dash: "2 2", className: "text-copper", label: "resonates with" },
}

const placed = placeHydrogenTree(hydrogenNodes)
const byId = new Map(placed.map((node) => [node.id, node]))

export function HydrogenTree({
  modelName,
  focusId,
  visited,
  onOpenTrial,
}: {
  modelName: string
  focusId: string
  visited: readonly string[]
  onOpenTrial: () => void
}) {
  const [open, setOpen] = useState(false)
  const [path, setPath] = useState<string[]>([])
  const [showReject, setShowReject] = useState(false)
  const refused = validateGraph(hydrogenNodes, [rejectedResonance])
  const selectedId = path[path.length - 1] ?? null
  const selected = hydrogenNodes.find((node) => node.id === selectedId) ?? null

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
    <section className="border border-line bg-surface" aria-label="Hydrogen tree">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <h2 className="font-display text-lg leading-none text-fg">Hydrogen tree</h2>
        <button
          type="button"
          className="min-h-11 px-2 text-sm text-fg underline decoration-line underline-offset-4"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close the tree" : "Open the tree"}
        </button>
      </div>
      {open ? (
        <FullTree
          modelName={modelName}
          focusId={focusId}
          visited={visited}
          selectedId={selectedId}
          showReject={showReject}
          onToggle={toggle}
        />
      ) : (
        <MiniTree modelName={modelName} focusId={focusId} visited={visited} />
      )}
      {selected ? (
        <Lineage path={path} origin={selected} onChoose={choose} onOpenTrial={onOpenTrial} />
      ) : null}
      {open ? (
        <details className="border-t border-line px-3 py-2">
          <summary className="min-h-11 cursor-pointer text-sm text-fg">Audit / Sources</summary>
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
            {(Object.keys(STROKE) as Relation[]).map((relation) => (
              <li key={relation} className="flex items-center gap-2 text-xs text-muted">
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
            className="mt-3 min-h-11 w-full border border-copper px-3 text-left text-sm text-copper"
            aria-pressed={showReject}
            onClick={() => setShowReject((value) => !value)}
          >
            {showReject ? "Hide the rejected resonance" : "Try resonates_with → E₁"}
          </button>
          {showReject ? (
            <p className="mt-2 text-sm text-copper">
              Rejected · {refused[0]?.code}. {refused[0]?.message} The line stops short of E₁.
            </p>
          ) : null}
          <ProvenanceLists />
        </details>
      ) : null}
    </section>
  )
}

function MiniTree({
  modelName,
  focusId,
  visited,
}: {
  modelName: string
  focusId: string
  visited: readonly string[]
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <svg viewBox="0 0 88 96" className="h-24 w-20 shrink-0 text-muted" role="img" aria-hidden="true">
        <line x1="44" y1="10" x2="44" y2="86" stroke="currentColor" className="text-line" />
        {placed.map((node) => {
          const x = 8 + (node.x / TREE_WIDTH) * 72
          const y = 6 + (node.y / TREE_HEIGHT) * 84
          return (
            <circle
              key={node.id}
              cx={x.toFixed(1)}
              cy={y.toFixed(1)}
              r={node.id === "hydrogen" ? 5 : 2.4}
              fill="currentColor"
              className={dotClass(node.id, focusId, visited)}
            />
          )
        })}
      </svg>
      <div>
        <p className="font-display text-2xl leading-none text-fg">Hydrogen</p>
        <p className="mt-1 text-sm text-copper">{modelName}</p>
        <p className="mt-1 text-xs text-muted">1911 · 1913 · 1926 · 1987 · 2022</p>
        <p className="mt-1 text-xs text-muted">Branches up. Roots down. Years sit on the sources.</p>
      </div>
    </div>
  )
}

function FullTree({
  modelName,
  focusId,
  visited,
  selectedId,
  showReject,
  onToggle,
}: {
  modelName: string
  focusId: string
  visited: readonly string[]
  selectedId: string | null
  showReject: boolean
  onToggle: (id: string) => void
}) {
  const from = byId.get(rejectedResonance.from)
  const to = byId.get(rejectedResonance.to)

  return (
    <svg viewBox={`0 0 ${TREE_WIDTH} ${TREE_HEIGHT}`} className="h-auto w-full text-fg" role="group" aria-label="Hydrogen tree of the accepted graph">
      <line x1="170" y1="46" x2="170" y2="286" stroke="currentColor" strokeWidth="2" className="text-line" />
      {hydrogenEdges.map((edge) => {
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
            strokeWidth={hot ? style.width + 0.6 : style.width}
            strokeDasharray={style.dash}
            className={style.className}
            opacity={hot ? 0.95 : 0.12}
          />
        )
      })}
      {showReject && from && to ? (
        <g className="text-copper">
          <path
            d={rejectedPath(from, to)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeDasharray="3 3"
          />
          <circle cx={rejectStop(to).x} cy={rejectStop(to).y} r="7.5" fill="var(--color-surface)" stroke="currentColor" strokeWidth="1.3" />
          <text x={rejectStop(to).x} y={rejectStop(to).y + 4} textAnchor="middle" fill="currentColor" fontSize="13">
            ×
          </text>
        </g>
      ) : null}
      {placed.map((node) => {
        const source = hydrogenNodes.find((item) => item.id === node.id)
        if (!source) return null
        const radius = node.id === "hydrogen" ? 22 : node.seam ? 12 : 12
        const label = wrap(source.title)
        return (
          <g
            key={node.id}
            role="button"
            tabIndex={0}
            aria-pressed={selectedId === node.id}
            aria-label={source.title}
            onClick={() => onToggle(node.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onToggle(node.id)
              }
            }}
          >
            <circle cx={node.x} cy={node.y} r="16" fill="transparent" />
            <circle
              cx={node.x}
              cy={node.y}
              r={radius}
              fill="var(--color-surface)"
              stroke="currentColor"
              strokeWidth={node.id === focusId || node.id === selectedId ? 2.6 : 1.2}
              strokeDasharray={node.seam ? "2 2" : undefined}
              className={nodeClass(node.id, focusId, visited)}
            />
            {node.seam ? (
              <text x={node.x} y={node.y + 4} textAnchor="middle" fill="currentColor" fontSize="12">
                ?
              </text>
            ) : null}
            {node.id === "hydrogen" ? (
              <>
                <text x={node.x} y={node.y + 4} textAnchor="middle" fill="currentColor" fontSize="12" className="text-fg">
                  H
                </text>
                <text
                  x={node.x + radius + 6}
                  y={node.y - 6}
                  textAnchor="start"
                  fill="currentColor"
                  fontSize="11"
                  className="text-fg"
                  style={HALO}
                >
                  Hydrogen
                </text>
                <text
                  x={node.x + radius + 6}
                  y={node.y + 10}
                  textAnchor="start"
                  fill="currentColor"
                  fontSize="10"
                  className="text-copper"
                  style={HALO}
                >
                  {modelName}
                </text>
              </>
            ) : (
              <text
                x={node.stratum === "trunk" ? node.x - radius - 8 : node.x}
                y={labelY(node, radius, label.length)}
                textAnchor={node.stratum === "trunk" ? "end" : "middle"}
                fill="currentColor"
                fontSize="10"
                className="text-muted"
                style={HALO}
              >
                {label.map((line, index) => (
                  <tspan key={`${line}-${index}`} x={node.stratum === "trunk" ? node.x - radius - 8 : node.x} dy={index === 0 ? 0 : 11}>
                    {line}
                  </tspan>
                ))}
                {source.year && !source.title.includes(String(source.year)) ? (
                  <tspan x={node.stratum === "trunk" ? node.x - radius - 8 : node.x} dy={11}>
                    {source.year}
                  </tspan>
                ) : null}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

const HALO = { paintOrder: "stroke", stroke: "var(--color-surface)", strokeWidth: 4 } as const

function labelY(node: PlacedNode, radius: number, lines: number) {
  if (node.stratum !== "trunk") return node.y + radius + 12
  return node.y + (lines === 1 ? 3 : -2)
}

function rejectStop(to: PlacedNode) {
  return { x: Math.round(to.x + 40), y: Math.round(to.y - 30) }
}

function rejectedPath(from: PlacedNode, to: PlacedNode) {
  const stop = rejectStop(to)
  const cpx = Math.max(from.x, stop.x) + 28
  const cpy = Math.round((from.y + stop.y) / 2)
  return `M ${from.x} ${from.y} Q ${cpx} ${cpy} ${stop.x} ${stop.y}`
}

function curve(start: PlacedNode, end: PlacedNode) {
  const midY = (start.y + end.y) / 2
  return `M ${start.x} ${start.y} Q ${((start.x + end.x) / 2).toFixed(1)} ${midY.toFixed(1)} ${end.x} ${end.y}`
}

function nodeClass(id: string, focusId: string, visited: readonly string[]) {
  if (id === focusId) return "text-copper"
  if (visited.includes(id)) return "text-fg"
  return "text-muted"
}

function dotClass(id: string, focusId: string, visited: readonly string[]) {
  if (id === focusId) return "text-copper"
  if (id === "hydrogen" || visited.includes(id)) return "text-fg"
  return "text-line"
}

function titleOf(id: string) {
  return hydrogenNodes.find((node) => node.id === id)?.title ?? id
}

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
    title: "Competitors",
    match: (edge, id) => edge.relation === "competes_with" && (edge.from === id || edge.to === id),
  },
  {
    title: "Interpretations / resonances",
    match: (edge, id) =>
      ((edge.relation === "interprets" || edge.relation === "resonates_with") && (edge.from === id || edge.to === id)) ||
      (edge.relation === "inspired_by" && edge.to === id),
  },
]

function Lineage({
  path,
  origin,
  onChoose,
  onOpenTrial,
}: {
  path: string[]
  origin: Node
  onChoose: (id: string) => void
  onOpenTrial: () => void
}) {
  return (
    <article className="border-t border-line px-3 py-3">
      <ol className="flex flex-wrap items-center gap-1">
        {path.map((id, index) => (
          <li key={`${id}-${index}`} className="flex items-center gap-1">
            {index > 0 ? <span className="text-muted">→</span> : null}
            <button type="button" className="min-h-11 text-sm text-fg underline decoration-line" onClick={() => onChoose(id)}>
              {titleOf(id)}
            </button>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">Navigation history. Not a derivation.</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-2xl leading-none text-fg">
          {origin.title}
          {origin.year && !origin.title.includes(String(origin.year)) ? (
            <span className="text-copper"> {origin.year}</span>
          ) : null}
        </h3>
        <EpistemicTag kind={origin.epistemic} />
      </div>
      <p className="mt-2 text-sm text-muted">{origin.claim}</p>
      {origin.source ? <p className="mt-1 text-xs text-muted">{origin.source}</p> : null}
      {DIRECTIONS.map((group) => {
        const links = hydrogenEdges.filter((edge) => group.match(edge, origin.id))
        if (links.length === 0) return null
        return (
          <div key={group.title} className="mt-3">
            <h4 className="text-xs tracking-widest text-muted uppercase">{group.title}</h4>
            <ul>
              {links.map((edge) => {
                const other = edge.from === origin.id ? edge.to : edge.from
                const outward = edge.from === origin.id
                return (
                  <li key={edge.id}>
                    <button
                      type="button"
                      className="min-h-11 w-full text-left text-sm text-fg"
                      onClick={() => onChoose(other)}
                    >
                      {outward
                        ? `${STROKE[edge.relation].label} ${titleOf(other)}`
                        : `${titleOf(other)} ${STROKE[edge.relation].label} this`}
                      <span className="block text-xs text-muted">{edge.note}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
      {origin.id === "gaussian-trial" ? (
        <button
          type="button"
          className="mt-3 min-h-11 w-full border border-fg px-3 text-sm text-fg"
          onClick={onOpenTrial}
        >
          Open the Gaussian trial
        </button>
      ) : null}
      <p className="mt-2 text-xs text-muted">Selecting a claim does not change the calculations.</p>
    </article>
  )
}

function wrap(title: string): string[] {
  if (title.length <= 14) return [title]
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
