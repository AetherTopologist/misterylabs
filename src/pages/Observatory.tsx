import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { FixtureCard, type Fixture } from "@/components/observatory/FixtureCard";
import { ResonanceSpheresAtlas } from "@/components/ResonanceSpheresAtlas";
import { ResonanceSphere } from "@/components/ResonanceSphere";
import ErrorBoundary from "@/components/ErrorBoundary";

const BASE = import.meta.env.BASE_URL;

// Types
type FixtureStatus = "mature" | "public" | "research" | "experimental" | "placeholder";
type Layer = 1 | 2 | 3;

interface Fixture {
  id: string;
  title: string;
  slug?: string;
  layer: Layer;
  status: FixtureStatus;
  desc: string;
  tags: string[];
  image?: string;
  note?: string;
  isHero?: boolean;
}

// Canonical public data synthesized from existing research notes + assets (no taxonomy changes)
const FIXTURES: Fixture[] = [
  {
    id: "curved-minimal",
    title: "CurvedMinimal",
    layer: 1,
    status: "mature",
    desc: "Baseline GRIN curved transport. Systematic parameter sweeps and first hermetic reproducibility contract.",
    tags: ["GRIN", "Radial", "Hermetic"],
    image: `${BASE}assets/curved_field_validation_ladder/curved_field_validation_quad_panel.png`,
    isHero: true,
  },
  {
    id: "hermetic-curved-room",
    title: "Hermetic Curved Room",
    layer: 1,
    status: "mature",
    desc: "Fully contained curved transport environment. Foundational public demonstration of bounded geodesic fields.",
    tags: ["Hermetic", "Room", "Public Hero"],
    isHero: true,
  },
  {
    id: "object-island",
    title: "Object Island (Advanced)",
    layer: 2,
    status: "public",
    desc: "Seeded null-geodesic islands with advanced observer disagreement diagnostics. High-complexity transport topology.",
    tags: ["Island", "Observer Ladder", "Advanced"],
    isHero: true,
  },
  {
    id: "fixture-001",
    title: "Fixture 001 — Radial GRIN Baseline",
    layer: 1,
    status: "mature",
    desc: "First hermetic fixture. Coverage contract established. 60+ timestamped runs with step sweeps.",
    tags: ["Radial GRIN", "Baseline", "Hermetic"],
  },
  {
    id: "fixture-008-013",
    title: "Wormhole Observer Ladder (008–013)",
    layer: 1,
    status: "mature",
    desc: "Canonical observer ladder captures: mouth → throat → exit at multiple checkpoints. Used across Papers 001–004.",
    tags: ["Wormhole", "Observer Ladder", "Canonical"],
    image: `${BASE}assets/overview/wormhole_structure_contact_sheet.png`,
  },
  {
    id: "atomic-orbital-grin",
    title: "Atomic Orbital GRIN Room",
    layer: 2,
    status: "research",
    desc: "Eigenmode density fields and orbital radius parameterization. Direct tie to continuous GRIN transport fields.",
    tags: ["Eigenmode", "Atomic Orbital", "GRIN"],
  },
  {
    id: "cathedral-probe",
    title: "Cathedral Probe / Corner Reference",
    layer: 3,
    status: "placeholder",
    desc: "Exploratory probe architecture. Currently mapped as corner_probe_reference [PLACEHOLDER].",
    tags: ["Probe", "Exploratory"],
    note: "PLACEHOLDER — not for citation",
  },
  {
    id: "curved-minimal-backdrop",
    title: "CurvedMinimal Backdrop Fixture",
    layer: 1,
    status: "mature",
    desc: "Systematic backdrop reorder, persistent priors, and visual regression evaluations.",
    tags: ["Backdrop", "Regression", "Reorder"],
  },
];

// Simple status color mapping matching site aesthetic
const statusClass = (status: FixtureStatus) => {
  if (status === "mature") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (status === "public") return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
  if (status === "research") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (status === "experimental") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-secondary/40 text-muted-foreground border-border/40"; // placeholder
};

const layerLabel = (layer: Layer) => {
  if (layer === 1) return "Instrument Validation";
  if (layer === 2) return "Public Observatory";
  return "Performance (Gated)";
};

const Observatory = () => {
  const [filter, setFilter] = useState<"all" | FixtureStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = FIXTURES.filter((f) => {
    const matchesFilter = filter === "all" || f.status === filter;
    const matchesSearch = !search || 
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.desc.toLowerCase().includes(search.toLowerCase()) ||
      f.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const canonical = filtered.filter(f => f.layer <= 2 && (f.status === "mature" || f.status === "public"));
  const research = filtered.filter(f => f.status === "research");
  const experimental = filtered.filter(f => ["experimental", "placeholder"].includes(f.status));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Observatory</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* HERO LANDING */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-16 border-b border-border/40">
        <div className="max-w-4xl">
          <div className="inline-flex items-center rounded-full bg-secondary/50 px-3 py-1 text-[10px] font-mono tracking-[0.2em] text-[hsl(var(--annotation-amber))] mb-4 border border-border/40">
            LAYER 2 — PUBLIC OBSERVATORY • ACTIVATING
          </div>

          <h1 className="[font-size:clamp(1.875rem,8vw,4.5rem)] font-bold tracking-tighter leading-[0.95] mb-4">
            xPRIMEray<br />Observatory Gallery
          </h1>

          <p className="max-w-2xl text-xl text-muted-foreground mb-8">
            Museum of curved transport instrumentation. Mature validation, public intuition artifacts,
            and gated performance archives. "Enter the Bulk" navigation between layers.
          </p>

          <div className="flex flex-wrap gap-3">
            <a href="#canonical" className="inline-flex items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
              Enter the Museum Hall
            </a>
            <Link to="/atlas" className="inline-flex items-center gap-2 rounded-lg border border-border/40 px-5 py-2.5 text-sm hover:bg-secondary/50">
              View Instruments
            </Link>
            <Link to="/media" className="inline-flex items-center gap-2 rounded-lg border border-border/40 px-5 py-2.5 text-sm hover:bg-secondary/50">
              Diagnostic Gallery
            </Link>
          </div>
        </div>

        {/* Featured: Optical Transport Illusion + portal demo teaser */}
        <div id="optical-portal" className="mt-10">
          <Card className="border-cyan-500/20 bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">PUBLIC INTUITION LAYER • v0.1+</Badge>
                <Badge className="bg-amber-500/20 text-amber-400">LIVE GODOT</Badge>
              </div>
              <CardTitle className="text-2xl tracking-tight">Optical Transport Illusion</CardTitle>
              <CardDescription>
                Walkable nested portals, RK4-driven witness orbs, ray trapping (darkness/event horizon analog), GRIN curvature, and bulk reveal.
                Bee B/q sigil • Peacock queen iridescence • J&amp;B pillars. 20s cinematic dolly export ready.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 text-sm">
                <a 
                  href="https://github.com/AetherTopologist/misterylabs/tree/main/demos/portals_pocket/optical_transport_illusion" 
                  target="_blank" 
                  className="portal-link text-cyan-400 hover:text-cyan-300"
                >
                  Open Godot Demo Folder →
                </a>
                <span className="text-amber-400/70">+ Suno “enter the bulk” hyperpop/K-pop energy track teaser</span>
                <span className="text-xs self-center text-muted-foreground">Reference: optozorax.github.io/portal</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FILTERS + LEGEND */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400/70">INFORMATION ARCHITECTURE</div>
            <div className="text-2xl font-semibold tracking-tight">Browse by Layer &amp; Status</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All</Button>
            <Button variant={filter === "mature" ? "default" : "outline"} size="sm" onClick={() => setFilter("mature")}>Mature</Button>
            <Button variant={filter === "public" ? "default" : "outline"} size="sm" onClick={() => setFilter("public")}>Public</Button>
            <Button variant={filter === "research" ? "default" : "outline"} size="sm" onClick={() => setFilter("research")}>Research</Button>
            <Button variant={filter === "experimental" ? "default" : "outline"} size="sm" onClick={() => setFilter("experimental")}>Experimental / Placeholder</Button>
          </div>

          <Input
            placeholder="Search fixtures..."
            className="w-full md:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Layer Legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs mb-8 text-muted-foreground">
          <div><span className="text-emerald-400">●</span> Layer 1: Instrument Validation (mature)</div>
          <div><span className="text-cyan-400">●</span> Layer 2: Public Observatory (activating)</div>
          <div><span className="text-amber-400">●</span> Layer 3: Performance (gated)</div>
        </div>
      </div>

      {/* CANONICAL FIXTURES — PUBLIC MUSEUM HALL */}
      <section id="canonical" className="max-w-7xl mx-auto px-6 pb-16">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="section-header text-emerald-400">Layer 1 + Layer 2 • Public</div>
            <h2 className="text-3xl font-semibold tracking-tighter">Canonical Fixtures</h2>
          </div>
          <div className="text-xs font-mono text-emerald-400/70">HERMETIC • REPRODUCIBLE • 9×9 PANEL VISUALS</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {canonical.length > 0 ? canonical.map(f => (
            <FixtureCard key={f.id} fixture={f} />
          )) : <div className="text-sm text-muted-foreground col-span-full">No matches.</div>}
        </div>
      </section>

      {/* CURVATURE BENCHMARK + CLOSURE DIAGNOSTICS */}
      <section id="benchmark" className="max-w-7xl mx-auto px-6 py-10 border-t border-border/30">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <div className="section-header">Layer 1 • Validation</div>
            <h3 className="text-2xl font-semibold tracking-tight mb-3">Curvature Benchmark</h3>
            <p className="text-sm text-muted-foreground mb-4">Signature ladders, GRIN vs straight off-axis observe, delta classification, and observability cutsheets.</p>
            <div className="text-xs text-muted-foreground/70">Primary assets: offaxis_observe_delta/, curved_field_validation_ladder/, overview/wormhole_structure_contact_sheet.png</div>
          </div>
          <div>
            <div className="section-header">Layer 1</div>
            <h3 className="text-2xl font-semibold tracking-tight mb-3">Closure Diagnostics</h3>
            <p className="text-sm text-muted-foreground">Hermetic hit closure, domain resolver stress, observer disagreement, classification delta pipelines. Canonical wormhole observer ladder (Fixtures 008–013) is the reference sequence.</p>
          </div>
        </div>
      </section>

      {/* RESEARCH FIXTURES */}
      <section id="research" className="max-w-7xl mx-auto px-6 pb-16">
        <div className="mb-5">
          <div className="section-header">Layer 2 • Research</div>
          <h2 className="text-3xl font-semibold tracking-tighter">Research Fixtures</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {research.length > 0 ? research.map(f => <FixtureCard key={f.id} fixture={f} />) : <div className="text-sm text-muted-foreground">No current research fixtures match filter.</div>}
          {/* Difference Fixture Teaser */}
          <Card className="border-amber-500/30 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-amber-500/40 text-amber-400">TEASER</Badge>
                <span className="text-[10px] text-amber-400">DIFFERENCE FIXTURE</span>
              </div>
              <CardTitle className="text-lg">Difference / Delta Classification Fixture</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Classification delta pipeline and observer disagreement heatmaps. Straight vs curved terminal classification comparison. 
              See Atlas “offaxis_observe_delta” and CLASSIFICATION_DELTA_PIPELINE_V01 for current state.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* EXPERIMENTAL ARCHIVE */}
      <section id="experimental" className="max-w-7xl mx-auto px-6 pb-20 border-t border-border/30 pt-10">
        <div className="mb-5">
          <div className="section-header text-[hsl(var(--annotation-amber))]">Layer 3 • Gated / Experimental</div>
          <h2 className="text-3xl font-semibold tracking-tighter">Experimental Archive</h2>
          <p className="text-sm text-muted-foreground mt-1">Exploratory, internal, or carrying explicit PLACEHOLDER discipline. Not for public citation without context.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {experimental.length > 0 ? experimental.map(f => <FixtureCard key={f.id} fixture={f} compact />) : null}
          <div className="diagnostic-frame p-4 rounded text-xs border border-border/30">
            Cathedral Probe → corner_probe_reference <span className="text-[hsl(var(--annotation-amber))]">[PLACEHOLDER]</span>
          </div>
          <div className="diagnostic-frame p-4 rounded text-xs border border-border/30">Resonance Chamber Overlay Trial</div>
          <div className="diagnostic-frame p-4 rounded text-xs border border-border/30">Triclock DOE Sandbox Plan</div>
          <div className="diagnostic-frame p-4 rounded text-xs border border-border/30">Overspace Architecture Layer</div>
          <div className="diagnostic-frame p-4 rounded text-xs border border-border/30">Phase Coherence Field (early)</div>
        </div>
      </section>

      {/* RESONANCE SPHERES — Primary immersive exhibit (central textured sphere + orbiting nodes + rich modal media) */}
      <ErrorBoundary fallback={
        <div className="container py-8 text-sm text-muted-foreground border-t">
          Resonance Spheres feature encountered an issue. Classic Observatory fixtures and the Optical Transport Illusion demo above are still available. Check browser console.
        </div>
      }>
        <section className="border-t border-border/30 bg-background py-10">
          <div className="container">
            <div className="mb-6">
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-400/60 dark:text-cyan-400/60">LIVING CONSTELLATION</div>
              <h2 className="text-3xl font-bold tracking-tight">Resonance Spheres</h2>
              <p className="text-muted-foreground/80 max-w-2xl mt-1 text-sm">
                Central Transport Sphere textured with curated portal media (GRIN refraction + wormhole distortion). 
                Nodes orbit with geodesic springs. Click for media gallery, YT embeds, and deep xPRIMEray "signal resonance" alignment.
              </p>
            </div>
            <ResonanceSpheresAtlas />
          </div>
        </section>
      </ErrorBoundary>

      <SiteFooter />
    </div>
  );
};

export default Observatory;
