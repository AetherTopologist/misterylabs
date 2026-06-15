import React, { useState, useEffect } from "react";
import { Github, Film, Camera, Clapperboard, Radio, GitBranch, ExternalLink, Maximize2, ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";

// ── Gallery Data ──────────────────────────────────────────

const BASE = import.meta.env.BASE_URL;

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
    src: `${BASE}assets/overview/wormhole_structure_contact_sheet.png`,
    system: "Overview",
    title: "Wormhole Structure Contact Sheet",
    desc: "Multi-panel contact sheet tracing wormhole geometry and seam topology across traversal states.",
  },
  {
    id: "g02", index: "#02",
    src: `${BASE}assets/overview/atomic_orbital_contact_sheet.png`,
    system: "Overview",
    title: "Atomic Orbital Contact Sheet",
    desc: "Curved transport paths rendered through orbital-like field structures across a series of probe steps.",
  },
  {
    id: "g03", index: "#03",
    src: `${BASE}assets/cathedral_probe/cathedral_probe_contact_sheet_row_0015.png`,
    system: "Cathedral Probe",
    title: "Cathedral Probe Diagnostic Stack",
    desc: "Six-layer contact sheet: beauty, wireframe, transport ownership, risk markers, transport diagram, continuity vectors.",
  },
  {
    id: "g04", index: "#04",
    src: `${BASE}assets/cathedral_probe/traversal_contact_sheet_4mode_0015.png`,
    system: "Cathedral Probe",
    title: "Four-Mode Traversal Comparison",
    desc: "Row, column, tile, and checkerboard traversal modes compared at step_length=0.015. Scheduler decorrelation effect visible.",
  },
  {
    id: "g05", index: "#05",
    src: `${BASE}assets/cathedral_probe/scheduler_resonance_stride_heatmap.png`,
    system: "Cathedral Probe",
    title: "Scheduler Resonance Stride Heatmap",
    desc: "Band pixel count by row-modulo-stride class across a 56-cell DOE. Traversal cadence confirmed as primary artifact amplifier.",
  },
  {
    id: "g06", index: "#06",
    src: `${BASE}assets/cathedral_probe/doe_step_sensitivity_band_plot.png`,
    system: "Cathedral Probe",
    title: "Step-Length Sensitivity DOE",
    desc: "Band percentage vs step length across a full overnight DOE. Finer steps expose more transport boundary structure.",
  },
  {
    id: "g07", index: "#07",
    src: `${BASE}assets/transport_islands/island_parent_trajectory_contact_sheet.png`,
    system: "Transport Islands",
    title: "Transport Island Oracle Trajectories",
    desc: "Oracle parent trajectories for 289 island samples. Null-geodesic paths colored by termination and step count.",
  },
  {
    id: "g08", index: "#08",
    src: `${BASE}assets/transport_islands/island_diagnostic_contact_sheet.png`,
    system: "Transport Islands",
    title: "Island Microscopy Diagnostic Sheet",
    desc: "Six-layer diagnostic overlay for the corner island patch. Bounded transport anomaly mapped at oracle precision.",
  },
  {
    id: "g09", index: "#09",
    src: `${BASE}assets/curved_field_validation_ladder/curved_vs_control_storyboard.png`,
    system: "Curved Field Validation",
    title: "Curved vs Control Storyboard",
    desc: "Side-by-side comparison: control render, curved-transport render, hit normals, ownership seams, and graph lineage.",
  },
  {
    id: "g10", index: "#10",
    src: `${BASE}assets/curved_field_validation_ladder/curved_field_validation_quad_panel.png`,
    system: "Curved Field Validation",
    title: "Curved Field Validation Quad Panel",
    desc: "Four-panel layout: rendered frame, hit-normal overlay, cross-section minimap, and transport/field overlay.",
  },
];

const GALLERY_CATEGORIES: GalleryCategory[] = [
  "All", "Overview", "Cathedral Probe", "Transport Islands", "Curved Field Validation",
];

const PROVENANCE_LABEL: Record<Exclude<GalleryCategory, "All">, string> = {
  "Overview":                "observatory capture",
  "Cathedral Probe":         "transport probe",
  "Transport Islands":       "transport island",
  "Curved Field Validation": "field validation",
};

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
  const [lightboxId, setLightboxId] = useState<string | null>(null);

  const visibleItems =
    activeCategory === "All"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.system === activeCategory);

  const openLightbox = (id: string) => setLightboxId(id);
  const closeLightbox = () => setLightboxId(null);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent" aria-hidden />

      {/* ── HEADER ─────────────────────────────────────────── */}
      <section className="border-t border-border/55">
        <div className="container py-14">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/70">
              SYS // 05
            </span>
            <div className="h-px w-12 bg-border/55" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary-glow/60">
              Visual Experiments
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Media Lab</h1>
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/70">
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
              <Link to="/atlas">
                Explore Instruments
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── OBSERVATORY GALLERY ─────────────────────────────── */}
      <section id="observatory-gallery" className="relative border-t border-border/55">
        {/* Section watermark */}
        <img
          src={`${BASE}assets/xPRIMEray_Logo_Research_256.png`}
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-6 top-8 h-16 w-auto opacity-[0.055] select-none"
        />
        <div className="container py-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/70">
              SYS // 05.A
            </span>
            <div className="h-px w-12 bg-border/55" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary-glow/60">
              Observatory Gallery
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">Visual Diagnostics</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Diagnostic imagery from four active observatory systems — contact sheets, heatmaps,
            storyboards, and comparative panels from the curved transport investigation.
          </p>

          {/* Category filter — observatory archive controls */}
          <div className="mt-6 flex flex-wrap gap-2">
            {GALLERY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  closeLightbox();
                }}
                className={`rounded-sm border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] transition-base ${
                  activeCategory === cat
                    ? "border-primary/60 bg-primary/10 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]"
                    : "border-border/40 text-muted-foreground/50 hover:border-border/70 hover:text-muted-foreground active:bg-secondary/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Result count — observatory archive feel */}
          <div className="mt-4 flex flex-col gap-y-1 sm:flex-row sm:items-center sm:justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/40">
            <span>
              {visibleItems.length} {visibleItems.length === 1 ? "frame" : "frames"} · {activeCategory === "All" ? "full archive" : activeCategory.toLowerCase()}
            </span>
            <span>curated observatory signals</span>
          </div>

          {/* Gallery grid — cinematic archive presentation */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-sm border border-border/25 bg-muted/20 p-3 sm:p-4">
            {visibleItems.map((item) => (
              <GalleryCard
                key={item.id}
                item={item}
                provenanceLabel={PROVENANCE_LABEL[item.system]}
                onOpen={() => openLightbox(item.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── COMING SIGNALS ─────────────────────────────────── */}
      <section className="border-t border-border/55">
        <div className="container py-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/70">
              Queued
            </span>
            <div className="h-px flex-1 bg-border/55" />
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

      {/* Shared lightbox — lives at page root for clean portal behavior */}
      <ObservatoryLightbox
        items={visibleItems}
        currentId={lightboxId}
        onClose={closeLightbox}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function GalleryCard({
  item,
  provenanceLabel,
  onOpen,
}: {
  item: GalleryItem;
  provenanceLabel: string;
  onOpen: () => void;
}) {
  return (
    <div
      className="group diagnostic-frame cursor-pointer overflow-hidden rounded-sm border border-border/30 bg-card/20 transition-base hover:border-primary/40 hover:bg-card/35"
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-secondary/30">
        <img
          src={item.src}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {/* Overlay badges — observatory archive language */}
        <span className="absolute left-2 top-2 rounded-sm bg-background/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/60 backdrop-blur-sm">
          {item.index}
        </span>
        <span className="absolute right-2 top-2 rounded-sm bg-background/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-primary-glow/80 backdrop-blur-sm">
          {item.system}
        </span>
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-sm bg-background/60 px-1.5 py-0.5 backdrop-blur-sm">
          <img src={`${BASE}assets/xprimeray-icon.svg`} alt="" aria-hidden className="h-2.5 w-2.5 opacity-40" />
          <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-foreground/30">
            {provenanceLabel}
          </span>
        </span>
      </div>

      {/* Caption */}
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <div className="text-sm font-medium leading-snug text-foreground/90 sm:text-xs">{item.title}</div>
          <div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/65 line-clamp-2 sm:text-[10px]">
            {item.desc}
          </div>
        </div>
        <Maximize2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/30 transition-base group-hover:text-primary/60" />
      </div>
    </div>
  );
}

// ── Proper Observatory Lightbox (reusable, filter-aware navigation) ──
function ObservatoryLightbox({
  items,
  currentId,
  onClose,
}: {
  items: GalleryItem[];
  currentId: string | null;
  onClose: () => void;
}) {
  // Robust internal navigation state (arrows + prev/next work smoothly inside the current filtered view)
  const [localId, setLocalId] = useState<string | null>(currentId);

  // Sync when parent opens a different card or the category filter changes
  useEffect(() => {
    setLocalId(currentId);
  }, [currentId]);

  const localIndex = items.findIndex((i) => i.id === localId);
  const localItem = localIndex >= 0 ? items[localIndex] : null;

  const hasPrev = localIndex > 0;
  const hasNext = localIndex >= 0 && localIndex < items.length - 1;

  const navigate = (direction: -1 | 1) => {
    const nextIndex = localIndex + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    setLocalId(items[nextIndex].id);
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") navigate(-1);
    if (e.key === "ArrowRight") navigate(1);
    if (e.key === "Escape") onClose();
  };

  useEffect(() => {
    if (!currentId) return;
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentId, localIndex, items]);

  if (!currentId || !localItem) return null;

  const provenance = PROVENANCE_LABEL[localItem.system];

  return (
    <Dialog open={!!currentId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[96vw] md:max-w-5xl p-0 gap-0 overflow-hidden border-border/40 bg-background shadow-2xl [&_button[aria-label='Close']]:hidden">
        <DialogTitle className="sr-only">{localItem.title}</DialogTitle>

        {/* Observatory header bar */}
        <div className="flex items-center justify-between border-b border-border/30 bg-card/40 px-4 py-2.5">
          <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em]">
            <span className="text-muted-foreground/50">xPRIMEray</span>
            <span className="text-primary-glow/70">Observatory Archive</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-amber-400/70">{localItem.system}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-muted-foreground/50 tabular-nums">
              {String(localIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </span>
            <button
              onClick={onClose}
              className="rounded-sm p-1 text-muted-foreground/60 hover:text-foreground transition-base"
              aria-label="Close lightbox"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Image stage — elegant containment for contact sheets & diagnostic panels */}
        <div className="relative flex max-h-[72vh] md:max-h-[78vh] items-center justify-center bg-card p-4 md:p-6">
          {/* Very faint technical grid for cinematic observatory atmosphere */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 28px), repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 28px)",
            }}
            aria-hidden
          />

          <img
            src={localItem.src}
            alt={localItem.title}
            className="max-h-[66vh] md:max-h-[72vh] w-full object-contain relative z-10"
          />

          {/* Subtle diagnostic corner marks inside the image well */}
          <div className="pointer-events-none absolute inset-4 border border-white/5 z-20" aria-hidden />
        </div>

        {/* Diagnostic metadata footer */}
        <div className="border-t border-border/30 bg-card/30 p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/50">
                  {localItem.index}
                </span>
                <span className="h-3 w-px bg-border/30" />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary-glow/70">
                  {localItem.system}
                </span>
                <span className="h-3 w-px bg-border/30" />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400/60">
                  {provenance}
                </span>
              </div>

              <div className="mt-2 text-base font-medium tracking-tight text-foreground/90">
                {localItem.title}
              </div>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground/75">
                {localItem.desc}
              </p>
            </div>

            {/* Navigation + actions — observatory instrument panel */}
            <div className="flex shrink-0 flex-col items-stretch gap-2 pt-1 md:items-end md:pt-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(-1)}
                  disabled={!hasPrev}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border/40 bg-secondary/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-base hover:border-primary/40 hover:text-primary active:bg-secondary/50 disabled:opacity-30 disabled:hover:border-border/40 disabled:hover:text-muted-foreground"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  onClick={() => navigate(1)}
                  disabled={!hasNext}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border/40 bg-secondary/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-base hover:border-primary/40 hover:text-primary active:bg-secondary/50 disabled:opacity-30 disabled:hover:border-border/40 disabled:hover:text-muted-foreground"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <a
                href={localItem.src}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-border/30 bg-secondary/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 transition-base hover:border-border/60 hover:text-foreground active:bg-secondary/40"
              >
                <Download className="h-3 w-3" /> Open full frame
              </a>
            </div>
          </div>

          {/* Fine print — language guardrail */}
          <p className="mt-4 border-t border-border/15 pt-3 text-[10px] italic text-muted-foreground/35">
            Diagnostic capture from the xPRIMEray curved-transport observatory. Presented as observable
            signature and research instrumentation, not as validated physical result.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
