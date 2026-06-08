import { lazy, Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import ErrorBoundary from "@/components/ErrorBoundary";

const TransportSphereViz = lazy(() =>
  import("@/components/TransportSphereViz").then(m => ({ default: m.TransportSphereViz }))
);

const FALLBACK = (
  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
    Transport Sphere visualization unavailable (see console for details).
  </div>
);

const LOADING = (
  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground/50 font-mono tracking-widest">
    Loading…
  </div>
);

export default function TransportSpherePage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <section className="bg-atlas-hero border-t border-border/60">
        <div className="pointer-events-none flex items-center justify-between px-5 md:px-10 py-3">
          <div>
            <div className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/25">n(x) = 1</div>
            <div className="mt-1 text-base font-semibold tracking-tight text-foreground/55">Straight Transport</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[8px] uppercase tracking-[0.3em] text-cyan-400/35">n(x) = gradient</div>
            <div className="mt-1 text-base font-semibold tracking-tight text-cyan-300/65">Curved Transport</div>
          </div>
        </div>
        <ErrorBoundary fallback={FALLBACK}>
          <Suspense fallback={LOADING}>
            <TransportSphereViz className="h-[55vh] min-h-[320px] w-full" />
          </Suspense>
        </ErrorBoundary>
        <div className="container pb-10 pt-6">
          <div className="font-mono text-[8px] uppercase tracking-[0.45em] text-muted-foreground/30 mb-2">
            Transport Sphere Visualization
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground/60">
            Real-time ray transport field rendered as a geodesic sphere. Left hemisphere: straight
            transport (n(x) = 1). Right hemisphere: GRIN curved transport with radial index gradient.
            Rays bend through the field according to ∂ṗ = ∇n(x).
          </p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
