import { useState } from "react"
import { requestTreeFocus } from "@/instruments/hollow-flame/tree/focus.ts"

type Card = {
  id: string
  title: string
  source: string
  topic: string
  status: string
  href: string
  nodeId: string
  note: string
  youtubeId?: string
  frontier?: boolean
}

const FILMS: Card[] = [
  {
    id: "vsauce",
    title: "What’s Inside a Flame?",
    source: "Vsauce",
    topic: "Flame structure",
    status: "Observed",
    href: "https://www.youtube.com/watch?v=4sG9FhwCBTo",
    youtubeId: "4sG9FhwCBTo",
    nodeId: "luminous-soot",
    note: "Introductory demonstration. The yellow body and the darker interior are not the same region.",
  },
  {
    id: "3b1b",
    title: "Divergence and Curl",
    source: "3Blue1Brown",
    topic: "Vector fields",
    status: "Calculated",
    href: "https://www.youtube.com/watch?v=rB83DpBJQsE",
    youtubeId: "rB83DpBJQsE",
    nodeId: "vector-fields",
    note: "The mathematical language of transport and circulation. A lesson, not a solution of this flame.",
  },
  {
    id: "nasa",
    title: "NASA Studies Fire in Microgravity",
    source: "NASA Scientific Visualization Studio",
    topic: "Gravity and flame shape",
    status: "Observed",
    href: "https://svs.gsfc.nasa.gov/31394/",
    nodeId: "microgravity",
    note: "A flame’s shape depends strongly on transport and on gravity-driven convection.",
  },
  {
    id: "action-lab",
    title: "The World’s Hottest Candle Can Actually Melt Steel",
    source: "The Action Lab",
    topic: "Flame versus electrical plasma",
    status: "Interpreted",
    href: "https://www.youtube.com/watch?v=3vtGktz8c1M",
    youtubeId: "3vtGktz8c1M",
    nodeId: "plasma-confinement",
    note: "A striking comparison. The hot “candle” in the film is not ordinary wax combustion. Electrical plasma and a diffusion flame are different mechanisms.",
  },
]

const FRONTIER: Card = {
  id: "greenyer",
  title: "The Power and Signature of the Topological Monopole",
  source: "Bob Greenyer",
  topic: "Unresolved claims",
  status: "Unresolved",
  href: "https://remoteview.substack.com/p/the-power-and-signature-of-the-topological",
  nodeId: "speculative-hollow",
  frontier: true,
  note: "A researcher-authored presentation of speculative claims about exotic structures, hollow microspheres, and transmutation. It is not independent validation.",
}

export function MediaLibrary() {
  const [active, setActive] = useState<string | null>(null)
  return (
    <section id="media" className="scroll-mt-20 border-t border-line px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-ember uppercase">Discovery</p>
          <h2 className="pt-2 font-display text-3xl text-paper sm:text-4xl">Other ways of looking</h2>
          <p className="pt-3 text-dust">
            The phenomenon comes first, then the structure, then the people explaining it. Nothing here is locked. Opening a film does not reset Prometheus.
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {FILMS.map((card) => (
            <MediaCard key={card.id} card={card} active={active === card.id} onOpen={() => setActive(card.id)} onClose={() => setActive(null)} />
          ))}
        </div>

        <div className="border border-ember/50 bg-surface p-4">
          <p className="font-mono text-xs tracking-widest text-ember uppercase">Unresolved claims / research frontier</p>
          <div className="mt-3">
            <MediaCard card={FRONTIER} active={active === FRONTIER.id} onOpen={() => setActive(FRONTIER.id)} onClose={() => setActive(null)} />
          </div>
          <p className="pt-4 text-sm text-dust">
            The short sometimes called “Copper In, Gold Out?”, associated with Adamenko’s hollow iron ball, could not be positively identified. It is omitted rather than linked to the wrong film.
          </p>
        </div>

        <div>
          <p className="font-mono text-xs tracking-widest text-paper uppercase">Grounded comparison</p>
          <p className="max-w-2xl pt-2 text-sm text-dust">
            Published hollow iron-oxide and flame-spray particles sit beside the frontier, not under it. A conventional hollow oxide is not evidence of a magnetic monopole or of nuclear transmutation.
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            <li className="border border-line bg-raised p-4">
              <p className="font-mono text-xs tracking-widest text-dust uppercase">Observed · 2005</p>
              <a className="mt-2 block font-display text-xl text-paper underline decoration-ember/40 underline-offset-4" href="https://doi.org/10.1111/j.1551-2916.2005.00249.x" target="_blank" rel="noreferrer">
                Criteria for flame-spray hollow oxides
              </a>
              <p className="pt-2 text-sm text-dust">Jossen and coauthors. When a flame-spray particle freezes as a shell.</p>
              <button type="button" className="mt-2 min-h-11 font-mono text-xs tracking-widest text-ember uppercase" onClick={() => requestTreeFocus("hollow-oxides")}>
                Related node
              </button>
            </li>
            <li className="border border-line bg-raised p-4">
              <p className="font-mono text-xs tracking-widest text-dust uppercase">Observed · 2010</p>
              <a className="mt-2 block font-display text-xl text-paper underline decoration-ember/40 underline-offset-4" href="https://doi.org/10.1016/j.jallcom.2009.11.186" target="_blank" rel="noreferrer">
                Hollow iron-oxide spheres
              </a>
              <p className="pt-2 text-sm text-dust">Gürmen and Ebin. An aerosol route to nanostructured hollow iron oxide.</p>
              <button type="button" className="mt-2 min-h-11 font-mono text-xs tracking-widest text-ember uppercase" onClick={() => requestTreeFocus("hollow-iron")}>
                Related node
              </button>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

function MediaCard({
  card,
  active,
  onOpen,
  onClose,
}: {
  card: Card
  active: boolean
  onOpen: () => void
  onClose: () => void
}) {
  return (
    <article className={card.frontier ? "border border-line bg-ink" : "portal-card border border-line bg-ink"}>
      {card.youtubeId && active ? (
        <div className="aspect-video bg-black">
          <iframe
            className="h-full w-full"
            title={card.title}
            src={`https://www.youtube-nocookie.com/embed/${card.youtubeId}?rel=0`}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <button type="button" className="block w-full text-left" onClick={card.youtubeId ? onOpen : undefined}>
          {card.youtubeId ? (
            <img
              src={`https://i.ytimg.com/vi/${card.youtubeId}/hqdefault.jpg`}
              alt=""
              className="aspect-video w-full object-cover"
              loading="lazy"
            />
          ) : (
            <PortalFace label={card.source} />
          )}
        </button>
      )}
      <div className="flex flex-col gap-2 p-3">
        <p className="font-mono text-xs tracking-widest text-dust uppercase">
          {card.source} · {card.status}
        </p>
        <h3 className="font-display text-xl leading-tight text-paper">{card.title}</h3>
        <p className="text-sm text-dust">{card.topic}</p>
        <p className="text-sm text-paper">{card.note}</p>
        <div className="flex flex-wrap gap-2">
          <a className="inline-flex min-h-11 items-center font-mono text-xs tracking-widest text-ember uppercase" href={card.href} target="_blank" rel="noreferrer">
            {card.youtubeId ? "Open on YouTube" : "Open the source"}
          </a>
          {card.youtubeId && !active ? (
            <button type="button" className="min-h-11 font-mono text-xs tracking-widest text-paper uppercase" onClick={onOpen}>
              Play here
            </button>
          ) : null}
          {active ? (
            <button type="button" className="min-h-11 font-mono text-xs tracking-widest text-dust uppercase" onClick={onClose}>
              Close player
            </button>
          ) : null}
          <button type="button" className="min-h-11 font-mono text-xs tracking-widest text-dust uppercase" onClick={() => requestTreeFocus(card.nodeId)}>
            Related node
          </button>
        </div>
      </div>
    </article>
  )
}

function PortalFace({ label }: { label: string }) {
  return (
    <div className="portal-face flex aspect-video items-end p-3" aria-hidden="true">
      <span className="font-mono text-xs tracking-widest text-paper uppercase">{label}</span>
    </div>
  )
}
