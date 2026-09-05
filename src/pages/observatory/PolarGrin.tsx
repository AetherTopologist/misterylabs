import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DemoNav } from "@/components/observatory/DemoNav";
import { PolarGrinInstrument } from "@/components/polar-grin/instrument";

export default function PolarGrinPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <DemoNav next={{ label: "Saturn Polygon", to: "/observatory/saturn-polygon" }} />
      <section className="bg-atlas-hero border-t border-border/25">
        <div className="container py-14">
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-400/70">
              Experimental · Polar GRIN
            </span>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <h1 className="max-w-3xl text-2xl font-bold tracking-tight md:text-3xl">
            Apple of the Eye
          </h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Polar GRIN · Optical Accessibility
          </p>
          <p className="mt-4 mb-2 max-w-2xl text-sm leading-relaxed text-muted-foreground/80 sm:text-base">
            The object remains. What reaches the witness changes.
          </p>
          <p className="mb-8 font-mono text-[9px] uppercase tracking-[0.28em] text-cyan-400/80">
            One field · two readouts
          </p>
          <div className="spectral-bar mb-8" aria-hidden />

          <PolarGrinInstrument />

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
      body: "An opaque apple. Eleven probe rays. One bounded positive-index field. If a ray meets stem, leaf, divot, or red surface, it stops. The fruit is never faded.",
    },
    {
      k: "02",
      title: "The field",
      body: "n = 1 + A g(x,y; w) with A ≥ 0, so n stays at least 1. w scales the spatial support — Gaussian σ and ring thickness — not a painted halo. θ rotates the apple and the field as one rigid assembly. Feature scale resizes stem and leaf from the pole. Recess deepens the polar dent; 1× is the design silhouette. Recess and scale change the object. Field strength does not. The probe bundle stays in the lab. Rays bend toward increasing n.",
    },
    {
      k: "03",
      title: "Two readouts",
      body: "MIND draws the paths. HEART-EYE is the same records as a categorical scan. Tap a cell to inspect that ray. There is no second ray population.",
    },
    {
      k: "04",
      title: "Witness",
      body: "Witness = a modeled sampling/readout boundary. Accessibility is a property of the path, not of the surface’s opacity.",
    },
  ];

  return (
    <section className="mt-12 space-y-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
        Bend the path, not the object
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
        The model computes what reaches the witness. It does not compute what experience is.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Witness = a modeled sampling/readout boundary. Material colors are categorical
        classifications, not a biological or spectral simulation. This is a reduced 2D
        geometric-optics instrument, not xPRIMEray engine transport, not a laboratory
        metamaterial, and not an observer-effect claim.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Where does measurement end and experience begin?
      </p>
    </aside>
  );
}
