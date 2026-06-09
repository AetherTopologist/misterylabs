import { lazy, Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { DemoNav } from "@/components/observatory/DemoNav";

const CubeNetExplorer = lazy(() =>
  import("@/components/CubeNetExplorer").then(m => ({ default: m.CubeNetExplorer }))
);
const TesseractExplorer = lazy(() =>
  import("@/components/TesseractExplorer").then(m => ({ default: m.TesseractExplorer }))
);
const HollowMaskIllusion = lazy(() =>
  import("@/components/HollowMaskIllusion").then(m => ({ default: m.HollowMaskIllusion }))
);
const SpinningDancer = lazy(() =>
  import("@/components/SpinningDancer").then(m => ({ default: m.SpinningDancer }))
);

function DemoFallback({ name }: { name: string }) {
  return (
    <div className="py-6 text-sm text-muted-foreground">
      {name} unavailable (see console for details).
    </div>
  );
}

function DemoLoading() {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground/50 font-mono tracking-widest">
      Loading…
    </div>
  );
}

export default function HigherDimensionalPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <DemoNav />
      <section id="higher-dimensional" className="bg-atlas-hero border-t border-border/25">
        <div className="container py-14">
          <div className="mb-3">
            <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.3em] text-violet-400/50">
              SYS // OBS-HD · Topology, Projection &amp; Perception
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Higher-Dimensional Transport &amp; Perception
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground/60">
              Curved transport operates in a field that connects to higher-dimensional geometry
              and to the limits of observer perception. These instruments explore how topology
              unfolds, how 4D structure projects, and how two observers can look at the same
              boundary and disagree on its curvature.
            </p>
          </div>
          <div className="spectral-bar mb-10" aria-hidden />

          {/* Cube Net Explorer */}
          <div className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-400/55">
                Instrument A · Net Topology
              </span>
              <div className="h-px flex-1 bg-border/20" />
            </div>
            <p className="mb-4 max-w-xl text-xs leading-relaxed text-muted-foreground/50">
              A cube has exactly 11 distinct 2D nets — flat unfoldings that fold back into a cube without
              overlap. Hover a colored cell to highlight the matching face in the 3D view.
            </p>
            <ErrorBoundary fallback={<DemoFallback name="Cube Net Explorer" />}>
              <Suspense fallback={<DemoLoading />}>
                <CubeNetExplorer />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Tesseract Explorer */}
          <div className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-violet-400/55">
                Instrument B · 4D Projection
              </span>
              <div className="h-px flex-1 bg-border/20" />
            </div>
            <p className="mb-4 max-w-xl text-xs leading-relaxed text-muted-foreground/50">
              A tesseract is the 4D analogue of a cube — 16 vertices, 32 edges, 8 cubic cells.
              Two successive perspective projections (4D→3D→2D) produce the nested-cube appearance.
              The XW rotation plane is the "extra" dimension beyond familiar 3D space.
            </p>
            <ErrorBoundary fallback={<DemoFallback name="Tesseract Explorer" />}>
              <Suspense fallback={<DemoLoading />}>
                <TesseractExplorer />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Hollow Mask Illusion */}
          <div className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/55">
                Instrument C · Depth Inversion
              </span>
              <div className="h-px flex-1 bg-border/20" />
            </div>
            <p className="mb-4 max-w-xl text-xs leading-relaxed text-muted-foreground/50">
              A concave hollow mask rotates. Despite correct physics, the brain overrides the
              concave depth cues and perceives a convex face — demonstrating that an observer's
              prior assumptions can override geometric evidence. Toggle between the brain's
              interpretation and the true concave geometry.
            </p>
            <ErrorBoundary fallback={<DemoFallback name="Hollow Mask Illusion" />}>
              <Suspense fallback={<DemoLoading />}>
                <HollowMaskIllusion />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Spinning Dancer */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-violet-400/55">
                Instrument D · Bistable Rotation
              </span>
              <div className="h-px flex-1 bg-border/20" />
            </div>
            <p className="mb-4 max-w-xl text-xs leading-relaxed text-muted-foreground/50">
              A silhouette has no stereo depth cue — both clockwise and counter-clockwise
              rotations project to an identical 2D path. Two observers assign opposite 3D
              interpretations and are equally correct. This mirrors how two transport rays
              entering a curved boundary from opposite sides can disagree on interior vs exterior.
            </p>
            <ErrorBoundary fallback={<DemoFallback name="Spinning Dancer" />}>
              <Suspense fallback={<DemoLoading />}>
                <SpinningDancer />
              </Suspense>
            </ErrorBoundary>
          </div>

        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
