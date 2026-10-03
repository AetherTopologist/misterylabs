import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";

const SOURCE =
  "https://github.com/AetherTopologist/misterylabs/tree/main/baselines/ride-map-thought-path";

export default function HydrogenBaseline() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="container max-w-3xl px-6 py-10">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Feature-frozen baseline
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          MisterY Labs Ride → Map → Thought Path
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Hydrogen is the first baseline implementation of this architecture.
          This page records the freeze. It does not start the next scientific
          layer, and it does not change TRIAD.
        </p>

        <dl className="mt-8 grid gap-4">
          <div className="border border-border/40 px-4 py-3">
            <dt className="font-mono text-xs uppercase tracking-[0.18em] text-amber-400/80">Ride</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
              The living atom and its model control. Classical collapse, the
              Puthoff 1987 counterfactual, and the stationary quantum 1s stay
              separate pictures.
            </dd>
          </div>
          <div className="border border-border/40 px-4 py-3">
            <dt className="font-mono text-xs uppercase tracking-[0.18em] text-amber-400/80">Map</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
              The typed Hydrogen tree. Branches up, roots down, hydrogen on the
              trunk. An invalid edge does not attach.
            </dd>
          </div>
          <div className="border border-border/40 px-4 py-3">
            <dt className="font-mono text-xs uppercase tracking-[0.18em] text-amber-400/80">Thought path</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Selecting a node makes it the local origin. Following an edge is
              navigation history, not a derivation.
            </dd>
          </div>
        </dl>

        <section className="mt-8 border border-border/40 px-4 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Epistemic status</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            On the side-by-side comparison, the Puthoff card is marked SED model.
            Quantum 1s stays Calculated. Those badges are not the same empirical
            status. The graph is still 18 nodes and 21 edges. η is a MisterY Labs
            counterfactual, not a measured zero-point-field strength, and it is
            not a parameter from Puthoff 1987.
          </p>
        </section>

        <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
          The frozen implementation is kept beside the observatory runtime so
          publishing this baseline cannot retune another instrument.
        </p>
        <p className="mt-4 flex flex-wrap gap-4 text-sm">
          <a className="text-amber-400/90 underline-offset-4 hover:underline" href={SOURCE}>
            Frozen source
          </a>
          <Link className="text-muted-foreground underline-offset-4 hover:underline" to="/atlas">
            Back to Atlas
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
