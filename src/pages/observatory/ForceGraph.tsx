import { lazy, Suspense, useState } from "react";
import { ExternalLink } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { DemoNav } from "@/components/observatory/DemoNav";
import { ATLAS_GRAPH_TIERS, type AtlasGraphNode } from "@/lib/atlasGraph";

const ObservatoryGraph = lazy(() =>
  import("@/components/ObservatoryGraph").then(m => ({ default: m.ObservatoryGraph }))
);

const GRAPH_FALLBACK = (
  <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-8">
    <p className="text-sm text-muted-foreground">
      3D graph could not initialize (WebGL may be unavailable in this browser).
    </p>
  </div>
);

const LOADING = (
  <div className="flex h-full items-center justify-center text-sm text-muted-foreground/50 font-mono tracking-widest">
    Loading graph…
  </div>
);

export default function ForceGraphPage() {
  const [selectedNode, setSelectedNode] = useState<AtlasGraphNode | null>(null);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <DemoNav next={{ label: "Resonance Spheres", to: "/observatory/resonance-spheres" }} />
      <section id="atlas-graph" className="border-t border-border/35 bg-background">
        <div className="container py-8">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">SYS // 04</span>
              <div className="h-px w-12 bg-border/35" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary-glow/60">The Seed</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Observatory Atlas</h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              The living convergence of personal wonder, optical transport mysteries, engineering cathedrals, and conceptual lineage.
            </p>
          </div>

          <div className="relative">
            <div className="h-[72vh] min-h-[520px] w-full rounded-sm overflow-hidden border border-border/30">
              <ErrorBoundary fallback={GRAPH_FALLBACK}>
                <Suspense fallback={LOADING}>
                  <ObservatoryGraph onNodeClick={setSelectedNode} />
                </Suspense>
              </ErrorBoundary>
            </div>

            {selectedNode && (
              <div
                className="fixed inset-x-0 bottom-0 md:right-0 md:top-0 md:bottom-0 md:left-auto w-full md:w-[420px] lg:w-[460px] z-[60]
                           bg-background/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-border/40
                           overflow-auto p-5 md:p-7 shadow-2xl"
                style={{ maxHeight: '85vh' }}
              >
                <div className="flex justify-between items-start mb-5 md:mb-6">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400/60">
                      {ATLAS_GRAPH_TIERS[selectedNode.tier]?.label || selectedNode.tier}
                    </div>
                    <h2 className="text-[21px] md:text-2xl font-semibold tracking-[-0.015em] mt-1 pr-8 leading-tight text-foreground">
                      {selectedNode.name}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-muted-foreground/70 hover:text-foreground text-3xl leading-none mt-[-4px] transition-colors"
                    aria-label="Close panel"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6 text-[13.5px] leading-[1.65] text-muted-foreground/90">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary/70 mb-1.5">The Signal</div>
                    <p>{selectedNode.description}</p>
                  </div>

                  {selectedNode.whyItMatters && (
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-amber-400/70 mb-1.5">Why it matters</div>
                      <p className="text-foreground/90">{selectedNode.whyItMatters}</p>
                    </div>
                  )}

                  {selectedNode.influencedXPRIME && (
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-cyan-400/70 mb-1.5">What it influenced in the observatory</div>
                      <p>{selectedNode.influencedXPRIME}</p>
                    </div>
                  )}

                  {selectedNode.tags?.length > 0 && (
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/60 mb-2">Resonance tags</div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedNode.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 text-[10px] font-mono border border-border/40 bg-card/30 rounded-sm text-muted-foreground/80 tracking-[0.02em]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedNode.href && (
                    <div className="pt-2">
                      <a
                        href={selectedNode.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/90 underline underline-offset-4 transition-colors"
                      >
                        Continue the lineage <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-4 border-t border-border/30 text-[10px] text-muted-foreground/40 font-mono tracking-[0.2em]">
                  Resonance, not derivation. — MisterY Labs Atlas
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
