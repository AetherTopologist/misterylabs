import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Atlas from "./pages/Atlas.tsx";
import Archive from "./pages/Archive.tsx";
import Research from "./pages/Research.tsx";
import Media from "./pages/Media.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import BrochSphere from "./pages/BrochSphere.tsx";
import NotFound from "./pages/NotFound.tsx";
import Observatory from "./pages/Observatory.tsx";
import ErrorBoundary from "@/components/ErrorBoundary";

// Heavy observatory demo pages — lazy-loaded so they don't bloat the main bundle
const ForceGraphPage        = lazy(() => import("./pages/observatory/ForceGraph.tsx"));
const ResonanceSpheresPage  = lazy(() => import("./pages/observatory/ResonanceSpheres.tsx"));
const FractalInspirationPage = lazy(() => import("./pages/observatory/FractalInspiration.tsx"));
const TransportSpherePage   = lazy(() => import("./pages/observatory/TransportSphere.tsx"));
const PoissonDotPage        = lazy(() => import("./pages/observatory/PoissonDot.tsx"));
const QuaternionPage        = lazy(() => import("./pages/observatory/Quaternion.tsx"));
const HigherDimensionalPage = lazy(() => import("./pages/observatory/HigherDimensional.tsx"));
const CavendishPaisPage     = lazy(() => import("./pages/observatory/CavendishPais.tsx"));
const PolarGrinPage         = lazy(() => import("./pages/observatory/PolarGrin.tsx"));
const SaturnPolygonPage     = lazy(() => import("./pages/observatory/SaturnPolygon.tsx"));

function DemoLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center font-mono text-sm tracking-widest text-muted-foreground/50">
      Loading…
    </div>
  );
}

function DemoError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm text-muted-foreground">This instrument failed to initialize.</p>
      <Link
        to="/atlas"
        className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary/60 transition-colors hover:text-primary"
      >
        ← Back to Atlas
      </Link>
    </div>
  );
}

function DemoWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<DemoLoading />}>
      <ErrorBoundary fallback={<DemoError />}>
        {children}
      </ErrorBoundary>
    </Suspense>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/atlas" element={<Atlas />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/research" element={<Research />} />
          <Route path="/media" element={<Media />} />
          <Route path="/observatory" element={<Observatory />} />
          <Route path="/broch-sphere" element={<BrochSphere />} />
          {/* Heavy demo routes — lazy-loaded */}
          <Route path="/observatory/force-graph"         element={<DemoWrapper><ForceGraphPage /></DemoWrapper>} />
          <Route path="/observatory/resonance-spheres"   element={<DemoWrapper><ResonanceSpheresPage /></DemoWrapper>} />
          <Route path="/observatory/fractal-inspiration" element={<DemoWrapper><FractalInspirationPage /></DemoWrapper>} />
          <Route path="/observatory/transport-sphere"    element={<DemoWrapper><TransportSpherePage /></DemoWrapper>} />
          <Route path="/observatory/poisson-dot"         element={<DemoWrapper><PoissonDotPage /></DemoWrapper>} />
          <Route path="/observatory/quaternion"          element={<DemoWrapper><QuaternionPage /></DemoWrapper>} />
          <Route path="/observatory/higher-dimensional"  element={<DemoWrapper><HigherDimensionalPage /></DemoWrapper>} />
          <Route path="/observatory/cavendish-pais"      element={<DemoWrapper><CavendishPaisPage /></DemoWrapper>} />
          <Route path="/observatory/polar-grin"          element={<DemoWrapper><PolarGrinPage /></DemoWrapper>} />
          <Route path="/observatory/saturn-polygon"      element={<DemoWrapper><SaturnPolygonPage /></DemoWrapper>} />
          {/* Unadvertised maintainer surface — no auth gate, not in public nav */}
          <Route path="/mission" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
