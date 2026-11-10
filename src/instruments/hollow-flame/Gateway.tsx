import { useState } from "react"
import { ARCH_GLB_URL, ARCH_PIERS, CEN_BLOCK, FOOT, PROMETHEUS_PLACE } from "@/instruments/hollow-flame/tree/placement.ts"

const ATLAS = "https://aethertopologist.github.io/misterylabs/atlas/interactive"
const OBSERVATORY = "https://aethertopologist.github.io/misterylabs/observatory"
const HYDROGEN = "https://aethertopologist.github.io/misterylabs/observatory/hydrogen"

/**
 * The public court is the flame, not an arch.
 * ARCH_GLB_URL stays empty: the socket is reserved, and nothing procedural stands in for it.
 */
export function Gateway() {
  const [approach, setApproach] = useState(false)
  return (
    <section id="gateway" className="scroll-mt-20 border-t border-line px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-ember uppercase">Cenotaph front court</p>
          <h2 className="pt-2 font-display text-3xl text-paper sm:text-4xl">Prometheus, beside the path</h2>
          <p className="pt-3 text-dust">
            A hollow flame stands east of the walk, in front of Newton’s Cenotaph. It is a monument to a maintained boundary, not a second fire and not a gate. The arch model is not installed.
          </p>
        </header>

        <div className="gateway-court relative overflow-hidden border border-line bg-ink">
          <svg viewBox="0 0 360 280" className="h-auto w-full" role="img" aria-label="A hollow flame on a dark plinth, east of the walk to the cenotaph">
            <defs>
              <radialGradient id="flame-glow" cx="50%" cy="42%" r="46%">
                <stop offset="0%" stopColor="#ffd7a1" stopOpacity="0.95" />
                <stop offset="42%" stopColor="#e8893a" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#e8893a" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="360" height="280" fill="#090807" />
            <path d="M28 214 H332" stroke="#2a211c" strokeWidth="18" />
            <path d="M180 214 V48" stroke="#e8893a" strokeOpacity="0.18" strokeDasharray="2 7" />
            <g className={approach ? "gateway-walk" : undefined}>
              <circle cx="180" cy="198" r="4" fill="#f3eadc" />
            </g>
            <rect x="168" y="186" width="88" height="10" fill="#1a1612" />
            <rect x="176" y="176" width="72" height="12" fill="#3a2c22" />
            <ellipse cx="212" cy="132" rx="46" ry="28" fill="url(#flame-glow)" />
            <path
              className="gateway-flame"
              d="M212 176 C198 148 188 124 212 78 C236 124 226 148 212 176"
              fill="#ffb15a"
              opacity="0.88"
            />
            <path d="M212 168 C204 146 200 126 212 96 C224 126 220 146 212 168" fill="#120c09" />
            <circle cx="198" cy="150" r="1.4" fill="#ffd7a1" />
            <circle cx="226" cy="158" r="1.1" fill="#ffd7a1" />
            <circle cx="180" cy="36" r="16" fill="none" stroke="#a89884" strokeWidth="1.5" />
            <text x="180" y="40" textAnchor="middle" fill="#a89884" fontSize="8" fontFamily="IBM Plex Mono, monospace">
              CENOTAPH
            </text>
            <text x="180" y="248" textAnchor="middle" fill="#a89884" fontSize="9" fontFamily="IBM Plex Mono, monospace">
              PATH CLEAR · FLAME TO THE EAST
            </text>
          </svg>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
            <p className="font-mono text-xs text-dust">GLB socket reserved{ARCH_GLB_URL ? "" : " · not drawn"}</p>
            <button
              type="button"
              className="min-h-11 border border-ember px-3 font-mono text-xs tracking-widest text-ember uppercase"
              onClick={() => setApproach((value) => !value)}
            >
              {approach ? "Hold" : "Approach"}
            </button>
          </div>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="border border-line p-3">
            <dt className="font-mono text-xs tracking-widest text-dust uppercase">Front court</dt>
            <dd className="pt-1 text-paper">
              x {FOOT.x}, z {FOOT.z}
            </dd>
            <p className="pt-1 text-dust">The existing standing place. Prometheus does not occupy it.</p>
          </div>
          <div className="border border-line p-3">
            <dt className="font-mono text-xs tracking-widest text-dust uppercase">Arch socket</dt>
            <dd className="pt-1 text-paper">
              x {ARCH_PIERS.map((pier) => pier.x).join(" and ")}, z {ARCH_PIERS[0].z}
            </dd>
            <p className="pt-1 text-dust">Reserved for a later GLB. Nothing is drawn there, and the opening on x = 0 stays walkable.</p>
          </div>
          <div className="border border-line p-3">
            <dt className="font-mono text-xs tracking-widest text-dust uppercase">Flame</dt>
            <dd className="pt-1 text-paper">
              x {PROMETHEUS_PLACE.x}, z {PROMETHEUS_PLACE.z}
            </dd>
            <p className="pt-1 text-dust">East of the path, outside the Cenotaph cylinder of radius {CEN_BLOCK}.</p>
          </div>
        </dl>

        <div className="flex flex-col gap-3 border border-line bg-surface p-4">
          <p className="font-mono text-xs tracking-widest text-dust uppercase">Return</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <a className="inline-flex min-h-11 items-center border border-ember px-3 font-mono text-xs tracking-widest text-ember uppercase" href={ATLAS} target="_blank" rel="noreferrer">
              Atlas entrance
            </a>
            <a className="inline-flex min-h-11 items-center border border-line px-3 font-mono text-xs tracking-widest text-paper uppercase" href={OBSERVATORY} target="_blank" rel="noreferrer">
              Observatory
            </a>
            <a className="inline-flex min-h-11 items-center border border-line px-3 font-mono text-xs tracking-widest text-paper uppercase" href={HYDROGEN} target="_blank" rel="noreferrer">
              Hydrogen
            </a>
            <button
              type="button"
              className="min-h-11 border border-line px-3 font-mono text-xs tracking-widest text-paper uppercase"
              onClick={() => document.getElementById("instrument")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              Return to Prometheus
            </button>
          </div>
          <p className="text-sm text-dust">
            Hydrogen remains the frozen Ride → Map → Thought Path baseline. This instrument does not edit it. The arch GLB socket stays empty until a later release.
          </p>
        </div>
      </div>
    </section>
  )
}
