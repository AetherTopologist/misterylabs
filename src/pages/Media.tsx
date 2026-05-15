import { useState } from "react";
import { Github, Film, Camera, Clapperboard, Radio, GitBranch, ExternalLink, Maximize2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";

// ── Gallery Data ──────────────────────────────────────────

type GalleryCategory = "All" | "Overview" | "Cathedral Probe" | "Transport Islands" | "Curved Field Validation";

interface GalleryItem {
  id: string;
  src: string;
  title: string;
  system: Exclude<GalleryCategory, "All">;
  desc: string;
  index: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "g01", index: "#01",
    src: "/assets/overview/wormhole_structure_contact_sheet.png",
    system: "Overview",
    title: "Wormhole Structure Contact Sheet",
    desc: "Multi-panel contact sheet tracing wormhole geometry and seam topology across traversal states.",
  },
  {
    id: "g02", index: "#02",
    src: "/assets/overview/atomic_orbital_contact_sheet.png",
    system: "Overview",
    title: "Atomic Orbital Contact Sheet",
    desc: "Curved transport paths rendered through orbital-like field structures across a series of probe steps.",
  },
  {
    id: "g03", index: "#03",
    src: "/assets/cathedral_probe/cathedral_probe_contact_sheet_row_0015.png",
    system: "Cathedral Probe",
    title: "Cathedral Probe Diagnostic Stack",
    desc: "Six-layer contact sheet: beauty, wireframe, transport ownership, risk markers, transport diagram, continuity vectors.",
  },
  {
    id: "g04", index: "#04",
    src: "/assets/cathedral_probe/traversal_contact_sheet_4mode_0015.png",
    system: "Cathedral Probe",
    title: "Four-Mode Traversal Comparison",
    desc: "Row, column, tile, and checkerboard traversal modes compared at step_length=0.015. Scheduler decorrelation effect visible.",
  },
  {
    id: "g05", index: "#05",
    src: "/assets/cathedral_probe/scheduler_resonance_stride_heatmap.png",
    system: "Cathedral Probe",
    title: "Scheduler Resonance Stride Heatmap",
    desc: "Band pixel count by row-modulo-stride class across a 56-cell DOE. Traversal cadence confirmed as primary artifact amplifier.",
  },
  {
    id: "g06", index: "#06",
    src: "/assets/cathedral_probe/doe_step_sensitivity_band_plot.png",
    system: "Cathedral Probe",
    title: "Step-Length Sensitivity DOE",
    desc: "Band percentage vs step length across a full overnight DOE. Finer steps expose more transport boundary structure.",
  },
  {
    id: "g07", index: "#07",
    src: "/assets/transport_islands/island_parent_trajectory_contact_sheet.png",
    system: "Transport Islands",
    title: "Transport Island Oracle Trajectories",
    desc: "Oracle parent trajectories for 289 island samples. Null-geodesic paths colored by termination and step count.",
  },
  {
    id: "g08", index: "#08",
    src: "/assets/transport_islands/island_diagnostic_contact_sheet.png",
    system: "Transport Islands",
    title: "Island Microscopy Diagnostic Sheet",
    desc: "Six-layer diagnostic overlay for the corner island patch. Bounded transport anomaly mapped at oracle precision.",
  },
  {
    id: "g09", index: "#09",
    src: "/assets/curved_field_validation_ladder/curved_vs_control_storyboard.png",
    system: "Curved Field Validation",
    title: "Curved vs Control Storyboard",
    desc: "Side-by-side comparison: control render, curved-transport render, hit normals, ownership seams, and graph lineage.",
  },
  {
    id: "g10", index: "#10",
    src: "/assets/curved_field_validation_ladder/curved_field_validation_quad_panel.png",
    system: "Curved Field Validation",
    title: "Curved Field Validation Quad Panel",
    desc: "Four-panel layout: rendered frame, hit-normal overlay, cross-section minimap, and transport/field overlay.",
  },
];

const GALLERY_CATEGORIES: GalleryCategory[] = [
  "All", "Overview", "Cathedral Probe", "Transport Islands", "Curved Field Validation",
];

// ── Planned Artifacts ─────────────────────────────────────

const PLANNED_ARTIFACTS = [
  {
    id: "render-gallery",
    title: "Extended Render Gallery",
    desc: "Curated visual outputs from curved-transport probes — convergence frames, caustic maps, and transport seam imagery.",
    icon: Camera,
    status: "Planned",
  },
  {
    id: "video-probes",
    title: "Video Probes",
    desc: "Animated field traversal sequences showing light path behavior through gradient media in real time.",
    icon: Clapperboard,
    status: "Planned",
  },
  {
    id: "open-signal",
    title: "Open Signal Feed",
    desc: "Live research updates, field notes, and experiment results from the active xPRIMEray observatory.",
    icon: Radio,
    status: "Planned",
  },
  {
    id: "acth-research",
    title: "ACT Research",
    desc: "Applied Curved Transport research artifacts — annotated datasets, diagnostic screenshots, and methodology documentation.",
    icon: Film,
    status: "Planned",
  },
];

// ── Page ──────────────────────────────────────────────────

export default function MediaPage() {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>("All");

  const visibleItems =
    activeCategory === "All"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.system === activeCategory);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent" aria-hidden />

      {/* ── HEADER ─────────────────────────────────────────── */}
      <section className="border-t border-border/35">
        <div className="container py-14">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
              SYS // 05
            </span>
            <div className="h-px w-12 bg-border/35" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary-glow/60">
              Visual Experiments
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Media Lab</h1>
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/45">
            Visual experiments · ACT research · Open signal
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            An open observatory for rendering researchers, visual artists, and curious engineers.
            Renders, probes, field notes, and code — the full visual record of the curved transport
            investigation.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <a href="https://github.com/AetherTopologist/GD_xPRIMEray" target="_blank" rel="noreferrer">
                <Github className="mr-2 h-4 w-4" />
                Join on GitHub
                <ExternalLink className="ml-2 h-3 w-3 opacity-60" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/mission">
                <GitBranch className="mr-2 h-4 w-4" />
                Mission Control
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── OBSERVATORY GALLERY ─────────────────────────────── */}
      <section id="observatory-gallery" className="border-t border-border/35">
        <div className="container py-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
              SYS // 05.A
            </span>
            <div className="h-px w-12 bg-border/35" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary-glow/60">
              Observatory Gallery
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">Visual Diagnostics</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Diagnostic imagery from four active observatory systems — contact sheets, heatmaps,
            storyboards, and comparative panels from the curved transport investigation.
          </p>

          {/* Category filter */}
          <div className="mt-6 flex flex-wrap gap-2">
            {GALLERY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-sm border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] transition-base ${
                  activeCategory === cat
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/40 text-muted-foreground/50 hover:border-border/70 hover:text-muted-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item) => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── COMING SIGNALS ─────────────────────────────────── */}
      <section className="border-t border-border/35">
        <div className="container py-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
              Queued
            </span>
            <div className="h-px flex-1 bg-border/35" />
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">Coming Signals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Content being prepared for publication as the observatory's research output matures.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {PLANNED_ARTIFACTS.map((item) => (
              <div
                key={item.id}
                className="diagnostic-frame flex items-start gap-4 rounded-sm border border-border/30 bg-card/20 p-5 opacity-70"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-secondary/50">
                  <item.icon className="h-4 w-4 text-muted-foreground/60" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground/70">{item.title}</span>
                    <span className="rounded-sm border border-border/40 bg-secondary/30 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function GalleryCard({ item }: { item: GalleryItem }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="group cursor-pointer overflow-hidden rounded-sm border border-border/35 bg-card/25 transition-base hover:border-primary/35 hover:bg-card/40"
        onClick={() => setOpen(true)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-secondary/30">
          <img
            src={item.src}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {/* Overlay badges */}
          <span className="absolute left-2 top-2 rounded-sm bg-background/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/60 backdrop-blur-sm">
            {item.index}
          </span>
          <span className="absolute right-2 top-2 rounded-sm bg-background/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-primary-glow/80 backdrop-blur-sm">
            {item.system}
          </span>
        </div>

        {/* Caption */}
        <div className="flex items-start justify-between gap-2 p-3">
          <div className="min-w-0">
            <div className="text-xs font-medium leading-snug text-foreground/85">{item.title}</div>
            <div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/60 line-clamp-2">
              {item.desc}
            </div>
          </div>
          <Maximize2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/30 transition-base group-hover:text-primary/60" />
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-sm">
          <DialogTitle className="sr-only">{item.title}</DialogTitle>
          <img
            src={item.src}
            alt={item.title}
            className="w-full object-contain"
          />
          <div className="p-4 border-t border-border/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
                    {item.index}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-primary-glow/70">
                    {item.system}
                  </span>
                </div>
                <div className="mt-0.5 text-sm font-medium">{item.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
