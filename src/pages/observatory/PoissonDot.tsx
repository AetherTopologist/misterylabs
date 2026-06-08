import { lazy, Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import ErrorBoundary from "@/components/ErrorBoundary";

const PoissonDotAndNegativeIOR = lazy(() =>
  import("@/components/PoissonDotAndNegativeIOR").then(m => ({ default: m.PoissonDotAndNegativeIOR }))
);

const FALLBACK = (
  <div className="container py-8 text-sm text-muted-foreground border-t border-border/35">
    Poisson Dot &amp; Negative IOR simulation unavailable (see console for details).
  </div>
);

const LOADING = (
  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground/50 font-mono tracking-widest">
    Loading…
  </div>
);

export default function PoissonDotPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <section className="bg-atlas-hero border-t border-border/25">
        <div className="container py-14">
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-rose-400/55">
              Instrument E · Optical Transport
            </span>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl mb-4">
            Poisson Dot &amp; Negative Index of Refraction
          </h1>
          <p className="mb-8 max-w-xl text-sm leading-relaxed text-muted-foreground/60">
            A point source emits circular waves into a layered medium. Drag the index of
            refraction into negative territory — phase velocity reverses, transmitted waves
            bend backward, and a flat-lens focal point reconstructs the source below the
            membrane. This models the boundary conditions xPRIMEray's GRIN field traversal
            encounters near wormhole seam and curved-transport inversion zones.
          </p>
          <div className="spectral-bar mb-8" aria-hidden />
          <ErrorBoundary fallback={FALLBACK}>
            <Suspense fallback={LOADING}>
              <PoissonDotAndNegativeIOR />
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
