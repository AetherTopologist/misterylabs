import { lazy, Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import ErrorBoundary from "@/components/ErrorBoundary";

const ResonanceSpheresAtlas = lazy(() =>
  import("@/components/ResonanceSpheresAtlas")
);

const FALLBACK = (
  <div className="container py-8 text-sm text-muted-foreground border-t border-border/35">
    Resonance Spheres unavailable (see console for details).
  </div>
);

const LOADING = (
  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground/50 font-mono tracking-widest">
    Loading…
  </div>
);

export default function ResonanceSpheresPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <section id="resonance-spheres" className="border-t border-border/35 bg-background">
        <div className="container py-10">
          <div className="mb-6">
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-400/60 mb-1">Living Constellation</div>
            <h1 className="text-3xl font-bold tracking-tight">Resonance Spheres</h1>
            <p className="text-muted-foreground/80 max-w-2xl mt-1 text-sm">
              Central Transport Sphere textured with curated portal media. Nodes orbit with geodesic
              springs. Click any node for media gallery, YT embeds, and deep xPRIMEray signal resonance alignment.
            </p>
          </div>
          <ErrorBoundary fallback={FALLBACK}>
            <Suspense fallback={LOADING}>
              <ResonanceSpheresAtlas />
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
