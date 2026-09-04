import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DemoNav } from "@/components/observatory/DemoNav";
import { DomeInversionInstrument } from "@/components/dome-inversion/instrument";

export default function DomeInversionPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <DemoNav next={{ label: "Observatory", to: "/observatory" }} />
      <section className="bg-atlas-hero border-t border-border/25">
        <div className="container py-14">
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/80">
              MisterY Labs Arcade · Optical thought experiment
            </span>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <h1 className="max-w-3xl text-2xl font-bold tracking-tight md:text-3xl">
            White House Arcade: Dome Inversion
          </h1>
          <p className="mt-4 mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground/80 sm:text-base">
            Can light make inside read as outside? Stand under a coffered dome.
            The ceiling does not morph. Transport does.
          </p>
          <div className="spectral-bar mb-8" aria-hidden />

          <DomeInversionInstrument />

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
      title: "The joke",
      body: "A classical white interior dome, viewed from below. Concave coffers. A small central lantern. Then a bounded GRIN-inspired field between your eye and the ceiling.",
    },
    {
      k: "02",
      title: "Inversion",
      body: "The image-plane map interpolates toward circle inversion. Coffers that sat in a bowl begin to read as a convex cup or lens. Geometry is untouched.",
    },
    {
      k: "03",
      title: "Cloak center",
      body: "At the far end of the control, illustrated rays route around the lantern's angular region. The lantern remains in the side elevation. It is omitted from the image only when it is no longer sampled.",
    },
    {
      k: "04",
      title: "Arcade, not thesis",
      body: "Museum + observatory + slightly surreal cabinet. This does not explain any real building, atmosphere, or propulsion.",
    },
  ];

  return (
    <section className="mt-12 space-y-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
        Can inside look outside?
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
        Arcade boundary
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/90">
        Artistic optics experiment. Not an explanation of architecture, atmospheric
        physics, exotic propulsion, or any real White House phenomenon.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        The looking-up image uses interpolated circle inversion as a stand-in for
        a strong radial GRIN. Side-view rays are a reduced 2D eikonal through a
        bounded index blob. The dome mesh never deforms.
      </p>
    </aside>
  );
}
