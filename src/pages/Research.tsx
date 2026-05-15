import React from "react";
import {
  Waves,
  Compass,
  Microscope,
  Eye,
  Film,
  Telescope,
  Layers,
  Orbit,
  Activity,
  Github,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";

// ── Data ──────────────────────────────────────────────────

type SystemStatus = "active" | "researching" | "building";

interface ResearchSystem {
  id: string;
  name: string;
  desc: string;
  status: SystemStatus;
  label: string;
  href: string | null;
}

const STATUS_DOT: Record<SystemStatus, string> = {
  active: "bg-success animate-signal-pulse",
  researching: "bg-info",
  building: "bg-primary",
};

const STATUS_LABEL_CLS: Record<SystemStatus, string> = {
  active: "text-success",
  researching: "text-info",
  building: "text-primary-glow",
};

const ACTIVE_SYSTEMS: ResearchSystem[] = [
  {
    id: "xprimeray",
    name: "xPRIMEray",
    desc: "Curved transport renderer — Godot engine research harness",
    status: "active",
    label: "ACTIVE",
    href: "https://aethertopologist.github.io/GD_xPRIMEray/",
  },
  {
    id: "cathedral",
    name: "Cathedral Probe",
    desc: "Wormhole fixture and traversal topology experiments",
    status: "active",
    label: "ACTIVE",
    href: null,
  },
  {
    id: "islands",
    name: "Transport Islands",
    desc: "Bounded optical anomaly detection and classification",
    status: "researching",
    label: "RESEARCHING",
    href: null,
  },
  {
    id: "validation",
    name: "Curved Field Validation Ladder",
    desc: "Convergence diagnostics and renderer correctness suite",
    status: "building",
    label: "BUILDING",
    href: null,
  },
];

type PortalStatus = "live" | "research" | "archive" | "coming-soon";

interface ResearchPortal {
  id: string;
  title: string;
  desc: string;
  href: string;
  status: PortalStatus;
  icon: React.ElementType;
}

const PORTAL_STATUS: Record<PortalStatus, { label: string; cls: string }> = {
  live: { label: "Live", cls: "text-success border-success/25 bg-success/10" },
  research: { label: "Research", cls: "text-info border-info/25 bg-info/10" },
  archive: { label: "Archive", cls: "text-muted-foreground border-border/40 bg-secondary/30" },
  "coming-soon": { label: "Coming Soon", cls: "text-warning border-warning/25 bg-warning/10" },
};

const PORTALS: ResearchPortal[] = [
  {
    id: "xprimeray-docs",
    title: "xPRIMEray Docs",
    desc: "Full documentation for the curved transport observatory.",
    href: "https://aethertopologist.github.io/GD_xPRIMEray/",
    status: "live",
    icon: Orbit,
  },
  {
    id: "github-repo",
    title: "GitHub Repository",
    desc: "Source code, commit history, and open development.",
    href: "https://github.com/AetherTopologist/GD_xPRIMEray",
    status: "live",
    icon: Github,
  },
  {
    id: "cathedral-probe",
    title: "Cathedral Probe Architecture",
    desc: "Wormhole fixture topology and traversal geometry design notes.",
    href: "https://aethertopologist.github.io/GD_xPRIMEray/Research/cathedral_probe_architecture/",
    status: "research",
    icon: Telescope,
  },
  {
    id: "transport-island",
    title: "Transport Island Microscopy",
    desc: "Resolving transport instability in curved null-geodesic rendering.",
    href: "https://aethertopologist.github.io/GD_xPRIMEray/Research/transport_island_microscopy/",
    status: "research",
    icon: Microscope,
  },
  {
    id: "validation-ladder",
    title: "Curved Field Validation Ladder",
    desc: "Latest visual validation packet — convergence and correctness milestones.",
    href: "https://aethertopologist.github.io/GD_xPRIMEray/#current-milestone-curved-field-validation-ladder",
    status: "research",
    icon: Activity,
  },
];

const TECH_DOCS: ResearchPortal[] = [
  {
    id: "feature-index",
    title: "Feature Index",
    desc: "Full index of all xPRIMEray features — ship-ready, in-progress, and proposed.",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/",
    status: "live",
    icon: Layers,
  },
  {
    id: "overlay-master",
    title: "Overlay Master List",
    desc: "All 13+ proposed visual overlays with design status and feature links.",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/Observatory/OVERLAY_MASTER_LIST/",
    status: "research",
    icon: Eye,
  },
  {
    id: "inspiration-cards",
    title: "Inspiration Cards",
    desc: "XenoCitation feature links — conceptual lineage between mathematical physics and observatory instruments.",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/MisterYLabs/INSPIRATION_CARD_FEATURE_LINKS/",
    status: "research",
    icon: Sparkles,
  },
  {
    id: "release-audit",
    title: "Release Readiness Audit",
    desc: "Current readiness audit: 16 ship-ready, 4 in-progress, 13 proposed overlays.",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/Release/FEATURE_READINESS_AUDIT/",
    status: "live",
    icon: Activity,
  },
  {
    id: "transport-map",
    title: "Optical Transport Feature Map",
    desc: "Visual map of transport research features across curved-field, GRIN, and boundary systems.",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/Research/OPTICAL_TRANSPORT_FEATURE_MAP/",
    status: "research",
    icon: Compass,
  },
];

const RESEARCH_DOMAINS = [
  { title: "Curved Transport", desc: "Core field of study", icon: Waves },
  { title: "GRIN Optics", desc: "Gradient index fields", icon: Compass },
  { title: "Rendering Diagnostics", desc: "Instrumentation & metrics", icon: Microscope },
  { title: "Pareidolia Lab", desc: "Perception & pattern", icon: Eye },
  { title: "Media Lab", desc: "Visual experiments & ACT research", icon: Film },
  { title: "Field Methods", desc: "Philosophy of measurement", icon: Telescope },
  { title: "Klein Topology", desc: "Non-orientable manifolds, recursive geometry", icon: Layers },
];

// ── Page ──────────────────────────────────────────────────

export default function ResearchPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent" aria-hidden />

      {/* ── ACTIVE SYSTEMS ─────────────────────────────────── */}
      <section className="border-t border-border/35">
        <div className="container py-14">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
              SYS // 01
            </span>
            <div className="h-px w-12 bg-border/35" />
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-signal-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-success">
                Observatory Active
              </span>
            </div>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Research</h1>
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/45">
            Active systems · Field portals · Research domains
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The observatory's active research systems, direct access portals, and the theoretical
            domains that frame the curved transport investigation.
          </p>

          <div className="mt-8 overflow-hidden rounded-sm border border-border/40">
            <div className="grid grid-cols-[20px_1fr_auto] items-center gap-6 border-b border-border/30 bg-card/20 px-5 py-2">
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/40">
                SIG
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/40">
                System · Descriptor
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/40">
                State
              </span>
            </div>
            {ACTIVE_SYSTEMS.map((sys, i) => (
              <SystemRow key={sys.id} sys={sys} isLast={i === ACTIVE_SYSTEMS.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── RESEARCH PORTALS ───────────────────────────────── */}
      <section className="border-t border-border/35">
        <div className="container py-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
              SYS // 02.A
            </span>
            <div className="h-px w-12 bg-border/35" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary-glow/60">
              Direct Access
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">Research Portals</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Direct entry points into the xPRIMEray observatory — docs, source, and active research
            notes.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PORTALS.map((portal) => (
              <PortalCard key={portal.id} portal={portal} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TECHNICAL DOCS ─────────────────────────────────── */}
      <section className="border-t border-border/35">
        <div className="container py-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
              SYS // 02.B
            </span>
            <div className="h-px w-12 bg-border/35" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary-glow/60">
              Technical Docs
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">Technical Observatory Docs</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Feature indexes, overlay catalogs, and readiness audits — the working documents of the
            xPRIMEray observatory's build and research record.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TECH_DOCS.map((portal) => (
              <PortalCard key={portal.id} portal={portal} />
            ))}
          </div>
        </div>
      </section>

      {/* ── RESEARCH DOMAINS ───────────────────────────────── */}
      <section className="border-t border-border/35">
        <div className="container py-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
              SYS // 04
            </span>
            <div className="h-px w-12 bg-border/35" />
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">Research Domains</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The theoretical and applied domains shaping the observatory's instruments and methods.
          </p>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {RESEARCH_DOMAINS.map((l) => (
              <div
                key={l.title}
                className="flex items-center gap-3 rounded-sm border border-border/35 bg-card/25 px-4 py-3 transition-base hover:border-primary/30 hover:bg-card/45"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-secondary/50">
                  <l.icon className="h-4 w-4 text-primary-glow" />
                </span>
                <div>
                  <div className="text-sm font-medium">{l.title}</div>
                  <div className="text-xs text-muted-foreground">{l.desc}</div>
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

function SystemRow({ sys, isLast }: { sys: ResearchSystem; isLast: boolean }) {
  const rowCls = [
    "group grid grid-cols-[20px_1fr_auto] items-center gap-6 px-5 py-3.5 transition-base",
    !isLast ? "border-b border-border/25" : "",
    sys.href ? "hover:bg-card/40 cursor-pointer" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      <div className="flex justify-center">
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[sys.status]}`} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="font-mono text-sm font-medium">{sys.name}</span>
          <span className="text-xs text-muted-foreground">{sys.desc}</span>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span className={`font-mono text-[9px] uppercase tracking-[0.25em] ${STATUS_LABEL_CLS[sys.status]}`}>
          {sys.label}
        </span>
        {sys.href && (
          <ExternalLink className="h-3 w-3 text-muted-foreground/30 transition-base group-hover:text-primary" />
        )}
      </div>
    </>
  );

  if (sys.href) {
    return (
      <a href={sys.href} target="_blank" rel="noreferrer" className={rowCls}>
        {inner}
      </a>
    );
  }
  return <div className={rowCls}>{inner}</div>;
}

function PortalCard({ portal }: { portal: ResearchPortal }) {
  const badge = PORTAL_STATUS[portal.status];
  return (
    <a
      href={portal.href}
      target="_blank"
      rel="noreferrer"
      className="group diagnostic-frame flex flex-col rounded-sm border border-border/40 bg-card/25 p-4 transition-base hover:border-primary/40 hover:bg-card/45 hover:shadow-[0_0_16px_-4px_hsl(var(--primary)/0.2)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-secondary/60 ring-1 ring-inset ring-border/40">
          <portal.icon className="h-3.5 w-3.5 text-primary-glow" />
        </div>
        <span
          className={`rounded-sm border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${badge.cls}`}
        >
          {badge.label}
        </span>
      </div>
      <div className="mt-3 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold tracking-tight">{portal.title}</span>
          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/30 transition-base group-hover:text-primary/60" />
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{portal.desc}</p>
      </div>
    </a>
  );
}
