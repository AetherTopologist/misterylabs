import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DemoNav } from "@/components/observatory/DemoNav";
import { SaturnPolygonInstrument } from "@/components/saturn-polygon/instrument";

export default function SaturnPolygonPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <DemoNav next={{ label: "Dome Inversion", to: "/arcade/dome-inversion" }} />
      <section className="bg-atlas-hero border-t border-border/25">
        <div className="container py-14">
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/70">
              Public observatory · Wave-mode analogy
            </span>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <h1 className="max-w-3xl text-2xl font-bold tracking-tight md:text-3xl">
            Saturn Polygon Lab
          </h1>
          <p className="mt-4 mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground/80 sm:text-base">
            How can a continuous circular system organize into apparently discrete
            polygonal geometry? Drag the mode. Watch a circle grow corners.
          </p>
          <div className="spectral-bar mb-8" aria-hidden />

          <SaturnPolygonInstrument />

          <Teaching />
          <ScienceBoundary />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Teaching() {
  const items = [
    {
      k: "01",
      title: "What you are looking at",
      body: "A polar view of a rotating circular jet. The outline is not a drawn polygon. It is r(θ) = R + A cos(mθ + φ) — one integer azimuthal undulation on a continuous ring.",
    },
    {
      k: "02",
      title: "m = 6",
      body: "North-pole analog. Saturn's long-lived hexagon is an observed polar jet (Voyager, Cassini). This lab only shows how a mode-6 perturbation reads as six corners.",
    },
    {
      k: "03",
      title: "m = 10",
      body: "South-pole analog. Hubble observations reported in 2026 describe a 10-sided atmospheric wave around Saturn's south pole. Again: analogy, not a weather model.",
    },
    {
      k: "04",
      title: "Key insight",
      body: "Continuous fields can produce surprisingly discrete-looking geometry. The corners are organized wave maxima.",
    },
  ];

  return (
    <section className="mt-12 space-y-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
        When does a circle grow corners?
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.k} className="diagnostic-frame rounded-sm border border-border/35 bg-card/25 p-4 sm:p-5">
            <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-400">
              {item.k} · {item.title}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ScienceBoundary() {
  return (
    <aside className="mt-10 rounded-sm border border-amber-500/35 bg-amber-500/10 p-5 sm:p-6">
      <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-400">
        Science boundary
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/90">
        This is a reduced illustrative wave-mode analogy, not a Saturn atmospheric
        simulation, not a GRIN-optics explanation of Saturn, and not a claim that
        Saturn demonstrates exotic optics.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Observation (hexagon, reported south-polar decagon) is separate from this
        toy azimuthal perturbation. Provenance lives in the inspiration queue.
      </p>
    </aside>
  );
}
