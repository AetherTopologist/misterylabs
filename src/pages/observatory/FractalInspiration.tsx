import { lazy, Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { DemoNav } from "@/components/observatory/DemoNav";

const FractalInspirationAtlas = lazy(() =>
  import("@/components/FractalInspirationAtlas").then(m => ({ default: m.FractalInspirationAtlas }))
);

const FALLBACK = (
  <div className="container py-8 text-sm text-muted-foreground border-t border-border/35">
    Fractal Inspiration Atlas unavailable (see console for details).
  </div>
);

const LOADING = (
  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground/50 font-mono tracking-widest">
    Loading…
  </div>
);

export default function FractalInspirationPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <DemoNav next={{ label: "Transport Sphere", to: "/observatory/transport-sphere" }} />
      <ErrorBoundary fallback={FALLBACK}>
        <Suspense fallback={LOADING}>
          <FractalInspirationAtlas />
        </Suspense>
      </ErrorBoundary>
      <SiteFooter />
    </div>
  );
}
