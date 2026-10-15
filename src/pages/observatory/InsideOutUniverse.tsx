import { lazy, Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { InsideOutStage } from "@/components/higher-dimensional/InsideOutStage";
import { DemoNav } from "@/components/observatory/DemoNav";
import { HD_INDEX } from "@/instruments/higher-dimensional/rides";
import { useTheme } from "@/hooks/useTheme";

const CubeNetExplorer = lazy(() =>
  import("@/components/CubeNetExplorer").then((m) => ({ default: m.CubeNetExplorer })),
);
const TesseractExplorer = lazy(() =>
  import("@/components/TesseractExplorer").then((m) => ({ default: m.TesseractExplorer })),
);

export default function InsideOutUniversePage() {
  const { theme } = useTheme();
  const lm = theme === "light";
  return (
    <div className="min-h-screen">
      <AppHeader />
      <DemoNav next={{ label: "Collection index", to: HD_INDEX }} />
      <section className="border-t border-border/25 bg-atlas-hero">
        <div className="container py-10 md:py-14">
          <div className={`mb-2 font-mono text-[8px] uppercase tracking-[0.3em] ${lm ? "text-cyan-700/80" : "text-cyan-400/55"}`}>
            SYS // OBS-IO · Ride 03
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Inside-Out Universe</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground/70">
            One ride for the fold and the tesseract. The hypercube still uses the original vertices, edges, and the XW → YZ → XY rotation order. Surfaces are the 24 square faces of that same projection. Wireframe, hybrid, and translucent modes only change how those faces are drawn.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground/70">
            Perspective can place a far cell inside the drawing of a near cell. That nesting is a projection. It is not a topological eversion, and the surface has not been turned inside out. The worm tube is a separate drawing with its own warning.
          </p>
          <div className="spectral-bar my-8" aria-hidden />
          <InsideOutStage />

          <div className="mb-4 mt-12 flex items-center gap-3">
            <span className={`font-mono text-[9px] uppercase tracking-[0.3em] ${lm ? "text-cyan-700/80" : "text-cyan-400/55"}`}>
              Established net instrument
            </span>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <ErrorBoundary fallback={<p className="text-sm text-muted-foreground">Cube net explorer unavailable.</p>}>
            <Suspense fallback={<p className="font-mono text-xs text-muted-foreground/50">Loading…</p>}>
              <CubeNetExplorer />
            </Suspense>
          </ErrorBoundary>

          <div className="mb-4 mt-12 flex items-center gap-3">
            <span className={`font-mono text-[9px] uppercase tracking-[0.3em] ${lm ? "text-violet-700/80" : "text-violet-400/55"}`}>
              Established tesseract instrument
            </span>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <ErrorBoundary fallback={<p className="text-sm text-muted-foreground">Tesseract explorer unavailable.</p>}>
            <Suspense fallback={<p className="font-mono text-xs text-muted-foreground/50">Loading…</p>}>
              <TesseractExplorer />
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
