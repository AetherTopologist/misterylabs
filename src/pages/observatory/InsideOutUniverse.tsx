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
    <div className="overflow-x-clip">
      <div className="flex h-dvh max-h-dvh flex-col overflow-x-clip overflow-y-hidden">
        <AppHeader />
        <DemoNav next={{ label: "Collection index", to: HD_INDEX }} />
        <div className="container flex min-h-0 w-full max-w-full flex-1 flex-col pb-2 pt-3">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h1 className="text-lg font-bold tracking-tight md:text-2xl">Inside-Out Universe</h1>
            <span className={`shrink-0 font-mono text-[8px] uppercase tracking-[0.22em] ${lm ? "text-cyan-700/80" : "text-cyan-400/55"}`}>
              SYS // OBS-IO · Ride 03
            </span>
          </div>
          <p className="mb-2 max-w-3xl text-xs leading-snug text-muted-foreground/70 md:text-sm">
            The projection is a 4D hypercube. The other pane is six squares folding into a 3D cube. They do not share a slider. Nesting is not eversion, and the worm tube is an artistic drawing.
          </p>
          <div className="min-h-0 flex-1">
            <InsideOutStage />
          </div>
        </div>
      </div>

      <section className="border-t border-border/25 bg-atlas-hero">
        <div className="container py-8">
          <div className="mb-4 flex items-center gap-3">
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
