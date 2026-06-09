import { lazy, Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { DemoNav } from "@/components/observatory/DemoNav";

const QuaternionExplorer = lazy(() =>
  import("@/components/QuaternionExplorer").then(m => ({ default: m.QuaternionExplorer }))
);

const FALLBACK = (
  <div className="container py-8 text-sm text-muted-foreground border-t border-border/35">
    Quaternion Explorer unavailable (see console for details).
  </div>
);

const LOADING = (
  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground/50 font-mono tracking-widest">
    Loading…
  </div>
);

export default function QuaternionPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <DemoNav next={{ label: "Higher Dimensional", to: "/observatory/higher-dimensional" }} />
      <section id="quaternion-explorer" className="bg-atlas-hero border-t border-border/25">
        <div className="container py-14">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.3em] text-cyan-400/45">
                SYS // OBS-QX · Higher-Dimensional Transport
              </div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Quaternion Field Explorer
              </h1>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground/50 sm:text-right">
              Drag sliders to define axis + angle.
              The amber arrow is the rotation axis.
              The ghost sphere is the orientation reference frame.
            </p>
          </div>
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground/60">
            Every 3D rotation in xPRIMEray's curved-transport field is encoded as a unit quaternion —
            four numbers (x, y, z, w) that compress a rotation axis and angle into a single algebraic
            object. This is the same mathematical structure that tracks ray orientations across the
            GRIN field boundary.
          </p>
          <div className="spectral-bar mb-6" aria-hidden />
          <ErrorBoundary fallback={FALLBACK}>
            <Suspense fallback={LOADING}>
              <QuaternionExplorer />
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
