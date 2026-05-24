import React from "react";
import { Link } from "react-router-dom";
import {
  Github,
  FolderOpen,
  Sparkles,
  Orbit,
  Activity,
  CircleDot,
  ExternalLink,
  Microscope,
} from "lucide-react";
import { KleinBottleSVG } from "@/components/KleinBottleSVG";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { SeeingIsNotOpeningYourEyes } from "@/components/SeeingIsNotOpeningYourEyes";
import { SiteFooter } from "@/components/SiteFooter";
import { TransportSphereViz } from "@/components/TransportSphereViz";

const BASE = import.meta.env.BASE_URL;

// ── Data ──────────────────────────────────────────────────

const FLAGSHIP_CARDS: {
  title: string;
  desc: string;
  icon: React.ElementType;
  tag: string;
  lineage: string | null;
}[] = [
  {
    title: "Transport Engine",
    desc: "Real-time curved ray path simulation and render harness.",
    icon: Orbit,
    tag: "CORE",
    lineage: null,
  },
  {
    title: "LuxCoreGRIN",
    desc: "Production-grade GRIN-field rendering research.",
    icon: Sparkles,
    tag: "RESEARCH",
    lineage: "Precursor renderer — directly informed xPRIMEray architecture",
  },
  {
    title: "Validation Cockpit",
    desc: "Instrumentation, probes, metrics, and visual regression.",
    icon: Activity,
    tag: "DIAGNOSTICS",
    lineage: null,
  },
  {
    title: "Island Classifier",
    desc: "Detecting and classifying bounded transport anomalies.",
    icon: CircleDot,
    tag: "ANALYSIS",
    lineage: null,
  },
];

// ── Page ──────────────────────────────────────────────────

const Index = () => {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent" aria-hidden />

      {/* ── HERO ──────────────────────────────────────────── */}
      {/*
        Full-viewport sphere visualization. The TransportSphereViz SVG fills the
        section absolutely; a bottom gradient fades it into the text overlay.
        Matches the reference: dark graphite, split straight/curved transport,
        headline bottom-left, amber CTA.
      */}
      <section className="hero-sphere-section relative flex flex-col overflow-hidden">
        {/* Sphere — fills the entire hero */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <TransportSphereViz className="h-full w-full" />
        </div>

        {/* Bottom gradient — fades sphere into text area */}
        <div
          className="hero-sphere-fade pointer-events-none absolute bottom-0 left-0 right-0"
          aria-hidden
        />

        {/* Text overlay — anchored to bottom */}
        <div className="container relative mt-auto pb-14 pt-56">
          {/* Observatory status badge */}
          <div className="mb-5 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-signal-pulse" />
            <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-success/70">
              MYL-OBS-001 · Active
            </span>
            <div className="h-px w-5 bg-border/30" />
            <span className="font-mono text-[8px] uppercase tracking-[0.35em] text-muted-foreground/30">
              offaxis_observe_delta
            </span>
          </div>

          <h1 className="max-w-2xl text-5xl font-bold leading-[1.06] tracking-tight text-foreground md:text-6xl lg:text-[4.75rem]">
            Light doesn't always<br className="hidden sm:block" /> travel straight.
          </h1>

          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400/65">
            Measured observability cutsheets for native geodesic ray tracing.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              variant="outline"
              asChild
              className="border-border/55 text-foreground/80 backdrop-blur-sm hover:border-border hover:text-foreground"
            >
              <Link to="/atlas">Explore Observatories</Link>
            </Button>
            <Button
              asChild
              className="border-amber-600/70 bg-amber-600/85 text-white hover:bg-amber-500 hover:border-amber-500"
            >
              <a
                href="https://github.com/AetherTopologist/GD_xPRIMEray"
                target="_blank"
                rel="noopener noreferrer"
              >
                Try Godot Demo
                <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-70" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FEATURED ARTIFACT ─────────────────────────────── */}
      {/*
        Showcases the offaxis_observe_delta as the flagship measurement.
        Lighter background creates contrast break from the dark hero.
        4-panel grid mirrors the reference's diagnostic panel layout.
      */}
      <section className="bg-featured-artifact border-t border-border/20">
        <div className="container py-16">
          <div className="mb-10 text-center">
            <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.45em] text-muted-foreground/30">
              Featured Artifact
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground/80">
              Off-Axis Observer Disagreement
            </h2>
            <p className="mt-2 text-sm text-muted-foreground/45">
              23.8% classification redistribution · 27,619 px · 480×270
            </p>
          </div>

          {/* 4 diagnostic panels — 2×2 on mobile, 4-wide on sm+ */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                src: `${BASE}assets/offaxis_observe_delta/straight_offaxis_observe_beauty.png`,
                label: "Beauty frame",
                sub: "Straight transport",
                accent: "text-muted-foreground/45",
              },
              {
                src: `${BASE}assets/offaxis_observe_delta/grin_offaxis_observe_beauty.png`,
                label: "Beauty frame",
                sub: "GRIN transport",
                accent: "text-cyan-400/55",
              },
              {
                src: `${BASE}assets/offaxis_observe_delta/classification_delta.png`,
                label: "Delta mask",
                sub: "23.8% redistributed",
                accent: "text-amber-400/55",
              },
              {
                src: `${BASE}assets/offaxis_observe_delta/classification_delta_contours.png`,
                label: "Contour overlay",
                sub: "Boundary structure",
                accent: "text-amber-400/55",
              },
            ].map((panel) => (
              <div
                key={panel.src}
                className="overflow-hidden rounded-sm border border-border/20 bg-card/15"
              >
                <div className="aspect-[4/3] overflow-hidden bg-black/50">
                  <img
                    src={panel.src}
                    alt={panel.label}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-xs font-medium text-foreground/60">{panel.label}</div>
                  <div className={`mt-0.5 font-mono text-[8px] uppercase tracking-[0.15em] ${panel.accent}`}>
                    {panel.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-6">
            <Link
              to="/atlas"
              className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/40 transition-base hover:text-cyan-400/65"
            >
              Full 7-panel cutsheet →
            </Link>
            <span className="h-3 w-px bg-border/25" />
            <Link
              to="/media"
              className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/40 transition-base hover:text-muted-foreground/70"
            >
              Observatory gallery →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SEEING IS NOT OPENING YOUR EYES ───────────────── */}
      <SeeingIsNotOpeningYourEyes />

      {/* ── PRIMARY SYSTEM: xPRIMEray ─────────────────────── */}
      <section id="xprimeray" className="relative overflow-hidden border-t border-primary/15">
        {/* Subtle observatory atmosphere */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.045] via-transparent to-transparent"
          aria-hidden
        />
        {/* Faint transport arc accent */}
        <svg
          className="pointer-events-none absolute right-0 top-0 h-64 w-96 opacity-[0.07]"
          viewBox="0 0 400 260"
          preserveAspectRatio="xMaxYMin slice"
          aria-hidden
        >
          <path
            d="M 400 0 Q 200 80 100 200 T -20 260"
            fill="none"
            stroke="hsl(245, 90%, 72%)"
            strokeWidth="1.2"
          />
          <path
            d="M 400 40 Q 240 100 160 220"
            fill="none"
            stroke="hsl(190, 95%, 65%)"
            strokeWidth="0.7"
          />
          <circle cx="200" cy="130" r="3" fill="none" stroke="hsl(190, 95%, 65%)" strokeWidth="1" />
          <circle cx="100" cy="200" r="2" fill="hsl(245, 90%, 72%)" />
        </svg>

        <div className="container relative py-16 lg:py-20">
          {/* Status header row */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
              SYS // 02
            </span>
            <div className="h-px w-12 bg-border/35" />
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-signal-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-success">
                Active Observatory
              </span>
            </div>
          </div>

          {/* Title block */}
          <div className="mt-4">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              xPRIMEray
            </h2>
            <p className="mt-2 text-base font-light text-primary-glow/80 md:text-lg">
              Curved Transport Observatory
            </p>
            <div className="mt-3 h-px w-32 bg-gradient-to-r from-primary/45 to-transparent" />
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A renderer research harness exploring curved-field traversal, transport topology,
            convergence diagnostics, validation systems, and visual observability.
          </p>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground/55">
            Guided by Klein topology: the observer and the field share one continuous manifold.
            Where the signal goes, the geometry follows.
          </p>

          {/* Primary CTAs */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-none"
            >
              <a
                href="https://aethertopologist.github.io/GD_xPRIMEray/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Explore xPRIMEray Docs
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href="https://github.com/AetherTopologist/GD_xPRIMEray"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub Repository
              </a>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/research">
                <Microscope className="mr-2 h-4 w-4" />
                Research Systems
              </Link>
            </Button>
          </div>

          {/* Component cards */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FLAGSHIP_CARDS.map((c) => (
              <div
                key={c.title}
                className="diagnostic-frame group relative rounded-sm border border-border/40 bg-card/35 p-4 transition-base hover:border-primary/35 hover:bg-card/55"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-sm bg-secondary/70 ring-1 ring-inset ring-border/50">
                    <c.icon className="h-4 w-4 text-primary-glow" />
                  </div>
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/40">
                    {c.tag}
                  </span>
                </div>
                <h3 className="text-sm font-semibold tracking-tight">{c.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
                {c.lineage && (
                  <p className="mt-2.5 border-t border-border/25 pt-2 font-mono text-[10px] leading-snug text-muted-foreground/45">
                    ↳ {c.lineage}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Latest measurement strip */}
          <div className="mt-8 rounded-sm border border-border/25 bg-card/15 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.35em] text-muted-foreground/35">
                  Latest measurement · offaxis_observe_delta
                </div>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-mono text-2xl font-bold text-cyan-400/75">23.8%</span>
                  <span className="text-sm text-muted-foreground/60">classification redistribution</span>
                </div>
                <div className="mt-1.5 font-mono text-[9px] text-muted-foreground/30">
                  <span className="text-cyan-400/50">geom_hit</span>
                  <span className="mx-1.5 text-muted-foreground/20">→</span>
                  <span className="text-amber-400/40">escaped_no_hit</span>
                  <span className="ml-2">· 27,619 px · 480×270</span>
                </div>
              </div>
              <Link
                to="/atlas"
                className="inline-flex items-center gap-1.5 self-start rounded-sm border border-border/35 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 transition-base hover:border-cyan-500/30 hover:text-cyan-400/70"
              >
                View cutsheet →
              </Link>
            </div>
          </div>

          {/* Release status row */}
          <div className="mt-6 border-t border-border/25 pt-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground/45">
                Release Status
              </span>
              <div className="h-px flex-1 bg-border/25" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ObsMetric
                value={16}
                label="Ship-Ready Features"
                sublabel="Core transport, GRIN fields, validation, overlays"
                variant="success"
                href="https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/"
              />
              <ObsMetric
                value={4}
                label="In Progress"
                sublabel="TestBench recipe, wormhole rig, atomic orbital fixtures"
                variant="warning"
                href="https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/"
              />
              <ObsMetric
                value={13}
                label="Proposed Overlays"
                sublabel="Celestial Boundary, Curvature Domain Map, Transport Memory..."
                variant="info"
                href="https://AetherTopologist.github.io/GD_xPRIMEray/Observatory/OVERLAY_MASTER_LIST/"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION AXIOM ─────────────────────────────────── */}
      <section className="border-t border-border/35">
        <div className="container py-16">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground/50">
                Mission Axiom
              </div>
              <blockquote className="mt-5 text-xl font-light leading-relaxed text-foreground md:text-2xl">
                "Science updates when tests fail.
                <br />
                Pseudoscience doubles down after repeated failure."
              </blockquote>
              <p className="mt-4 font-mono text-[10px] text-muted-foreground/50">— MisterY Labs</p>
            </div>
            <div className="diagnostic-frame rounded-sm border border-border/35 bg-card/25 p-6">
              <div className="font-mono text-[8px] uppercase tracking-[0.35em] text-muted-foreground/40 mb-3">
                Operating Principle
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Speculative ideas explored only through measurable tests and reproducible visual
                evidence. No claims. No conclusions. Just better instruments for seeing more clearly.
              </p>
              <p className="mt-3 text-xs text-muted-foreground/50">
                We do not claim proof of UAPs, missing aircraft, or hidden technology — we treat
                such topics as motivation for why optical-anomaly simulation tools matter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MANIFESTO ─────────────────────────────────────── */}
      <section className="border-t border-border/25">
        <div className="container py-16">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-start gap-10">
              <div className="border-l border-primary/20 pl-7 flex-1">
                <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                  Gateway to the Unknown Known
                </h2>
                <blockquote className="mt-4 text-sm leading-relaxed text-foreground/70 italic">
                  "We build instruments for seeing what is usually hidden: transport seams,
                  convergence behavior, observer pathways, and the strange coherence between
                  technical systems and human imagination."
                </blockquote>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground/50">
                  The Klein bottle is our compass — a surface where inside and outside share
                  one continuous manifold. Topology before ontology.
                </p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40">
                  All paths are signals. All signals become structure.
                </p>
              </div>
              <div className="hidden md:block shrink-0 text-primary/20 mt-1">
                <KleinBottleSVG size={84} animated />
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;

// ── Sub-components ────────────────────────────────────────


function ObsMetric({
  value,
  label,
  sublabel,
  variant,
  href,
}: {
  value: number;
  label: string;
  sublabel: string;
  variant: "success" | "warning" | "info";
  href: string;
}) {
  const variantCls = {
    success: { num: "text-success", dot: "bg-success", border: "hover:border-success/40" },
    warning: { num: "text-warning", dot: "bg-warning", border: "hover:border-warning/40" },
    info:    { num: "text-info",    dot: "bg-info",    border: "hover:border-info/40" },
  }[variant];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative rounded-sm border border-border/35 bg-card/25 p-4 transition-base hover:bg-card/45 ${variantCls.border}`}
    >
      <span className={`absolute right-3 top-3 h-1.5 w-1.5 rounded-full ${variantCls.dot}`} />
      <div className={`text-3xl font-bold tabular-nums ${variantCls.num}`}>{value}</div>
      <div className="mt-1 text-xs font-medium text-foreground/80">{label}</div>
      <div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/60">{sublabel}</div>
      <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/30 transition-base group-hover:text-muted-foreground/60">
        Feature Index →
      </div>
    </a>
  );
}

