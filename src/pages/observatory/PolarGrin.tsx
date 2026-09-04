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
              Public observatory · Constrained GRIN demo
            </span>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <h1 className="max-w-3xl text-2xl font-bold tracking-tight md:text-3xl">
            Polar GRIN Apple
          </h1>
          <p className="mt-4 mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground/80 sm:text-base">
            Can a continuous refractive-index field redirect rays around a polar
            surface region without deleting the geometry itself? Watch the bundle.
            The fruit stays put.
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
      body: "A recognizable apple in a dark observatory bay. A fixed camera. A ray bundle aimed at one pole. The fruit is an opaque body — if a ray meets it, the ray stops.",
    },
    {
      k: "02",
      title: "The field",
      body: "A bounded polar halo around that pole. Strength 0 is vacuum — rays march straight. Strength 1 applies an incident-side angular kick proportional to field strength so some rays miss the cap. Occupancy never changes.",
    },
    {
      k: "03",
      title: "The sequence",
      body: "Field off → bend → shadow → wrap → reveal. Reveal means far-side witness beads become ray-accessible. It does not mean the apple vanished.",
    },
    {
      k: "04",
      title: "Key insight",
      body: "Same object. Same camera. Different transport. Accessibility is a property of the path, not of the surface's opacity.",
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
        This is a reduced illustrative ray model: straight march at zero field,
        then a polar-halo angular kick that scales with field strength. It is
        not xPRIMEray engine transport, not a laboratory GRIN metamaterial,
        and not an invisibility-cloak claim.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Inspired by gradient-index optics (Maxwell, Gordon metric, transformation-optics
        cloaks). The polar apple is a constrained public instrument: one control,
        visible paths, object remains.
      </p>
    </aside>
  );
}
