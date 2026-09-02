import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DemoNav } from "@/components/observatory/DemoNav";
import { ObservatoryDemo } from "@/components/cavendish/observatory-demo";

export default function CavendishPaisPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <DemoNav next={{ label: "Observatory", to: "/observatory" }} />
      <section className="bg-atlas-hero border-t border-border/25">
        <div className="container py-14">
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-400/70">
              Public observatory · Hypothesis comparison
            </span>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <h1 className="max-w-3xl text-2xl font-bold tracking-tight md:text-3xl">
            Cavendish × Pais Effect
          </h1>
          <p className="mt-4 mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground/80 sm:text-base">
            What observable signatures would distinguish altered inertia from
            altered gravitational coupling in a Cavendish-type apparatus? Watch
            the balance first. The equations only name what you already saw.
          </p>
          <div className="spectral-bar mb-8" aria-hidden />

          <ObservatoryDemo />

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
      body: "A Cavendish balance measures an extremely small gravitational torque using a suspended rod. Two large source masses tug on two small test masses. The fiber twists until restoring torque equals gravitational torque.",
    },
    {
      k: "02",
      title: "Change the object",
      body: "Now imagine changing how one test object responds to force. Pais-inspired modes here are hypothetical models for visualization and experiment design — not a claim that the patent implies a particular gravitational result.",
    },
    {
      k: "03",
      title: "Watch two different questions",
      body: "How does it move? versus Where does it finally settle? Inertia shapes the journey (acceleration, frequency, overshoot). Gravitational coupling shapes the destination (θeq = τg / k).",
    },
    {
      k: "04",
      title: "Key insight",
      body: "Changing inertia does not automatically mean changing gravity. An object can follow a different trajectory while approaching the same equilibrium. A change in gravitational coupling would instead move the equilibrium itself.",
    },
  ];

  return (
    <section className="mt-12 space-y-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
        What Cavendish would actually tell us
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
        Pais-inspired modes in this demo are hypothetical models used for
        visualization and experiment design. There is no established experimental
        evidence that electromagnetic excitation produces gravitational-mass
        reduction or altered Newtonian gravitational coupling.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        The environment separates{" "}
        <span className="text-cyan-400">established physics</span> (ordinary Cavendish
        torsion) from a{" "}
        <span className="text-cyan-400">hypothetical inertial reduction</span> and a{" "}
        <span className="text-amber-400">speculative gravitational-coupling change</span>
        . The third mode exists so the discriminator can show what a genuine
        Cavendish anomaly would look like.
      </p>
    </aside>
  );
}
