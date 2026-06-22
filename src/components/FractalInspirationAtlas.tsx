import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { X, Sparkles, ExternalLink } from "lucide-react";
import { ResonanceSphere } from "./ResonanceSphere";

/* ============================================================================
   Fractal Inspiration Atlas
   A force-directed inspiration constellation feeding into xPRIMEray.
   - Canvas 2D rendering for performance
   - Custom lightweight physics (repulsion + spring + center pull)
   - Zoom (wheel + pinch), pan (drag), hover, click-to-expand, signal flow
============================================================================ */

type NodeKind = "core" | "primary" | "secondary";

interface AtlasNode {
  id: string;
  label: string;
  subtitle?: string;
  description?: string;
  influenced?: string;
  xprimeConcept?: string;
  href?: string;
  keywords?: string[];
  kind: NodeKind;
  parent?: string; // primary id this secondary belongs to
  // physics
  x: number;
  y: number;
  vx: number;
  vy: number;
  // visual
  hue: number; // 0-360
  radius: number;
  // Resonance media for "Resonance Spheres"
  media?: Array<{
    type: 'image' | 'video' | 'youtube';
    url: string;
    caption?: string;
    alt?: string;
    thumbnail?: string;
    resonanceNote?: string;
  }>;
}

interface AtlasEdge {
  source: string;
  target: string;
  weight?: number;
}

const PRIMARIES: Array<Omit<AtlasNode, "x" | "y" | "vx" | "vy" | "kind" | "radius"> & { keywords: string[] }> = [
  {
    id: "quake3",
    label: "Quake III Arena",
    subtitle: "Spatial Adrenaline",
    description: "The first real social engine of speed. Railguns, BSP traversal, prediction, and observer-relative space taught spatial intuition at inhuman velocity.",
    influenced: "Real-time spatial cognition, arena topology, and observer-relative prediction models in xPRIMEray's transport design.",
    xprimeConcept: "Transport island detection and observer-relative coordinate framing",
    keywords: ["railguns", "BSP traversal", "movement topology", "visibility", "prediction"],
    hue: 28,
  },
  {
    id: "bell",
    label: "Bell Labs",
    subtitle: "The Engineering Cathedral",
    description: "A cathedral of interdisciplinary instrumentation. Where signal theory, observability, and scientific visualization were treated as sacred craft.",
    influenced: "Instrumentation culture, signal-propagation thinking, diagnostic dashboards, and the observatory metaphor itself.",
    xprimeConcept: "Telemetry architecture, convergence diagnostics, and observatory naming",
    keywords: ["signal theory", "observability", "instrumentation", "scientific visualization"],
    hue: 195,
  },
  {
    id: "grant",
    label: "Grant Sanderson",
    subtitle: "Geometry Made Felt",
    description: "Stereographic projection, topology, and dimensional intuition rendered with such clarity that mathematics becomes a felt sense.",
    influenced: "Geometric intuition, projection visuals, and dimensional pedagogy throughout xPRIMEray's visualization layer.",
    xprimeConcept: "Curved field visualization and dimensional projection displays",
    href: "https://www.youtube.com/@3blue1brown",
    keywords: ["stereographic projection", "topology", "dimensional intuition", "mathematical beauty"],
    hue: 285,
  },
  {
    id: "nasa",
    label: "Apollo / NASA",
    subtitle: "Telemetry and the Unknown",
    description: "Mission control rituals, black-sky instrumentation, and the engineering courage to send signals into nothing and read what comes back.",
    influenced: "Dashboard aesthetic, telemetry culture, and the rigor of testing against physical ground truth.",
    xprimeConcept: "Field validation architecture and diagnostic instrumentation philosophy",
    keywords: ["mission control", "diagnostics", "engineering courage", "telemetry"],
    hue: 210,
  },
  {
    id: "interstellar",
    label: "Interstellar / Gargantua",
    subtitle: "Emotional Relativity",
    description: "Curved spacetime as cinema. Black hole lensing, temporal perception, and the cosmology of love rendered as physical phenomena.",
    influenced: "Null geodesic rendering, the visual language of curvature, and the emotional weight of transport distortion.",
    xprimeConcept: "Null geodesic path tracing and curved transport visualization",
    keywords: ["curved spacetime", "black hole lensing", "temporal perception"],
    hue: 320,
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800", // placeholder; replace with actual Gargantua render or public asset
        caption: "Gargantua black hole lensing",
        alt: "Dramatic curved spacetime visualization of a black hole with accretion disk and gravitational lensing",
        resonanceNote: "Direct visual ancestor for null-geodesic and GRIN ray deflection in xPRIMEray."
      }
    ]
  },
  {
    id: "digital-circus",
    label: "The Amazing Digital Circus — Trophy Room",
    subtitle: "Portal Nexus & Glitch Immersion",
    description: "Caine's curated portal nexus: a ringmaster's collection of worlds accessed through tactile, glitch-inflected portals. Spatial storytelling, observer disorientation, and high-fidelity immersive rendering of non-Euclidean thresholds.",
    influenced: "Portal topology, multi-realm traversal, the 'trophy room' as living resonance archive, glitch artifacts as transport signatures, and the theatrical framing of observer experience.",
    xprimeConcept: "Nested portals, bulk-boundary emergence, curated 'inspiration spheres' as observable diagnostic fields, ray-trapped 'audience' perspectives.",
    keywords: ["portals", "traversal", "glitch", "immersive rendering", "nexus", "curation"],
    hue: 280,
    media: [
      {
        type: "image",
        url: "https://picsum.photos/id/1015/800/600", // TODO: replace with actual high-res Trophy Room / portal screenshot from Glitch Productions
        caption: "Trophy Room portal nexus",
        alt: "Glitchy, ornate portal room with floating trophies, multiple doorways and curved thresholds to other digital worlds",
        resonanceNote: "Exceptional alignment with nested portals, event-horizon-like trapping at boundaries, and curated 'bulk' worlds. Strong xPRIMEray portal DNA."
      },
      {
        type: "youtube",
        url: "https://www.youtube.com/embed/dQw4w9wgccc", // placeholder — replace with actual relevant Digital Circus clip or trailer if available
        caption: "Portal traversal sequence",
        resonanceNote: "Observe the tactile portal 'hand-off' and spatial reorientation — mirrors GRIN field boundary crossing."
      }
    ]
  },
];

const SECONDARIES: Array<{ id: string; label: string; parent: string; description?: string; influenced?: string; xprimeConcept?: string; href?: string; keywords?: string[] }> = [
  // Quake / engine culture
  { id: "snes", label: "SNES ROM Hacking", parent: "quake3", description: "Memory maps, hex editors, tile graphics — archaeology by overwrite." },
  { id: "reverse", label: "Reverse Engineering", parent: "quake3", description: "Breaking systems on purpose to learn how they breathe." },
  { id: "doom-quake", label: "Doom / Quake Engine Culture", parent: "quake3", description: "Source ports, demos, and the open dissection of game engines." },
  { id: "lan", label: "LAN Multiplayer", parent: "quake3", description: "Cables on carpets. Latency is a physical constant." },
  { id: "retro-net", label: "Retro Game Networking", parent: "quake3", description: "Lockstep, delta encoding, prediction — civics of the wire." },
  { id: "hex", label: "Hex Editors", parent: "quake3", description: "The grain of the binary; structure under noise." },
  { id: "memory-maps", label: "Memory Maps", parent: "quake3", description: "Cartography of address space." },

  // Bell
  { id: "signal-prop", label: "Signal Propagation", parent: "bell", description: "Energy travelling as form across media." },
  { id: "telemetry-sys", label: "Telemetry Systems", parent: "bell", description: "Listening at scale; instruments that confess." },
  { id: "observer-theory", label: "Observer Theory", parent: "bell", description: "Frames of reference as first-class measurement." },
  { id: "diagnostic-quad", label: "Diagnostic Quad Panels", parent: "bell", description: "Four windows into one phenomenon." },
  { id: "interactive-vis", label: "Interactive Visualization", parent: "bell", description: "Plots you can interrogate, not just read." },
  { id: "oracle", label: "Oracle Diagnostics", parent: "bell", description: "Ground-truth fixtures that do not lie." },

  // Grant
  { id: "shader", label: "Shader Graphs", parent: "grant", description: "Math made visible per-pixel." },
  { id: "wireframe", label: "Wireframe Topology", parent: "grant", description: "Skeleton geometry; the bones of curvature." },
  { id: "procedural", label: "Procedural Geometry", parent: "grant", description: "Rules that grow form." },
  { id: "rune", label: "Rune Symbols", parent: "grant", description: "Dense glyphs that bind meaning to mark." },
  { id: "cathedral", label: "Cathedral Architecture", parent: "grant", description: "Stone reasoning about light, span, and silence." },
  { id: "gateway", label: "Gateway Arch — St. Louis", parent: "grant", description: "A catenary whispering structural truth.", influenced: "Portal geometry, threshold symbolism, and curved traversal imagery.", xprimeConcept: "Gateway topology and curved traversal thresholds" },

  // NASA
  { id: "spacex", label: "SpaceX", parent: "nasa", description: "Iterate hardware until the sky behaves." },
  { id: "einstein", label: "Einstein", parent: "nasa", description: "Geometry as gravity; coordinates as fate." },
  { id: "kaku", label: "Michio Kaku", parent: "nasa", description: "Popular cosmology as gateway drug to deep physics." },
  { id: "transport-own", label: "Transport Ownership", parent: "nasa", description: "Who owns the path determines what gets measured." },

  // Interstellar
  { id: "curved-rays", label: "Curved Rays", parent: "interstellar", description: "Photons that refuse straight lines." },
  { id: "null-geo", label: "Null Geodesics", parent: "interstellar", description: "Lightlike paths through warped manifolds." },
  { id: "particle-coll", label: "Particle Collider Visuals", parent: "interstellar", description: "Detector imagery as accidental art." },
  { id: "pixar", label: "Pixar", parent: "interstellar", description: "Emotional warmth rendered with mathematical patience." },
];

const CORE: Omit<AtlasNode, "x" | "y" | "vx" | "vy" | "radius"> = {
  id: "xprimeray",
  label: "xPRIMEray",
  subtitle: "Curved Transport Observatory",
  description:
    "A renderer research harness exploring transport topology, curved-field traversal, convergence behavior, and diagnostic observability.",
  keywords: ["curved transport", "GRIN", "diagnostics", "observability", "topology"],
  kind: "core",
  hue: 200,
};

function buildGraph(expanded: Set<string>) {
  const nodes: AtlasNode[] = [];
  const edges: AtlasEdge[] = [];

  // Core
  nodes.push({ ...CORE, x: 0, y: 0, vx: 0, vy: 0, radius: 56 });

  // Primaries on a ring
  PRIMARIES.forEach((p, i) => {
    const angle = (i / PRIMARIES.length) * Math.PI * 2 - Math.PI / 2;
    const r = 320;
    nodes.push({
      ...p,
      kind: "primary",
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      vx: 0,
      vy: 0,
      radius: 36,
    });
    edges.push({ source: "xprimeray", target: p.id, weight: 1 });
  });

  // Secondaries around expanded primaries
  SECONDARIES.forEach((s) => {
    if (!expanded.has(s.parent)) return;
    const parent = nodes.find((n) => n.id === s.parent);
    if (!parent) return;
    const siblings = SECONDARIES.filter((x) => x.parent === s.parent);
    const idx = siblings.findIndex((x) => x.id === s.id);
    const angle = (idx / siblings.length) * Math.PI * 2;
    const r = 140;
    nodes.push({
      id: s.id,
      label: s.label,
      description: s.description,
      keywords: s.keywords,
      parent: s.parent,
      kind: "secondary",
      hue: parent.hue,
      x: parent.x + Math.cos(angle) * r,
      y: parent.y + Math.sin(angle) * r,
      vx: 0,
      vy: 0,
      radius: 16,
    });
    edges.push({ source: s.parent, target: s.id, weight: 0.6 });
  });

  return { nodes, edges };
}

export function FractalInspirationAtlas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();

  // Persisted across renders without triggering re-renders
  const stateRef = useRef({
    nodes: [] as AtlasNode[],
    edges: [] as AtlasEdge[],
    transform: { x: 0, y: 0, k: 1 },
    pointer: { x: 0, y: 0, down: false, dragMoved: false, lastX: 0, lastY: 0 },
    pinch: { active: false, dist: 0, k: 1 },
    hoverId: null as string | null,
    selectedId: null as string | null,
    pulse: 0, // for animation phase
  });

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<AtlasNode | null>(null);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => buildGraph(expanded), [expanded]);

  // Sync nodes/edges into refs (preserve positions for unchanged ids)
  useEffect(() => {
    const prev = new Map(stateRef.current.nodes.map((n) => [n.id, n]));
    stateRef.current.nodes = nodes.map((n) => {
      const p = prev.get(n.id);
      return p ? { ...n, x: p.x, y: p.y, vx: p.vx, vy: p.vy } : n;
    });
    stateRef.current.edges = edges;
  }, [nodes, edges]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tick = () => {
      const s = stateRef.current;
      s.pulse += 0.016;
      simulate(s.nodes, s.edges);
      draw(ctx, canvas, s);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Pointer events
  const screenToWorld = useCallback((sx: number, sy: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const t = stateRef.current.transform;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    return {
      x: (sx - rect.left - cx) / t.k - t.x,
      y: (sy - rect.top - cy) / t.k - t.y,
    };
  }, []);

  const pickNode = useCallback((wx: number, wy: number) => {
    const ns = stateRef.current.nodes;
    for (let i = ns.length - 1; i >= 0; i--) {
      const n = ns[i];
      const dx = wx - n.x;
      const dy = wy - n.y;
      if (dx * dx + dy * dy <= n.radius * n.radius) return n;
    }
    return null;
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    const s = stateRef.current;
    s.pointer.down = true;
    s.pointer.dragMoved = false;
    s.pointer.lastX = e.clientX;
    s.pointer.lastY = e.clientY;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = stateRef.current;
    if (s.pointer.down) {
      const dx = e.clientX - s.pointer.lastX;
      const dy = e.clientY - s.pointer.lastY;
      if (Math.abs(dx) + Math.abs(dy) > 2) s.pointer.dragMoved = true;
      s.transform.x += dx / s.transform.k;
      s.transform.y += dy / s.transform.k;
      s.pointer.lastX = e.clientX;
      s.pointer.lastY = e.clientY;
    } else {
      const w = screenToWorld(e.clientX, e.clientY);
      const hit = pickNode(w.x, w.y);
      s.hoverId = hit?.id ?? null;
      setHoverLabel(hit?.label ?? null);
      const canvas = canvasRef.current!;
      canvas.style.cursor = hit ? "pointer" : s.pointer.down ? "grabbing" : "grab";
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const s = stateRef.current;
    s.pointer.down = false;
    if (!s.pointer.dragMoved) {
      const w = screenToWorld(e.clientX, e.clientY);
      const hit = pickNode(w.x, w.y);
      if (hit) {
        s.selectedId = hit.id;
        setSelectedNode(hit);
        if (hit.kind === "primary") {
          setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(hit.id)) next.delete(hit.id);
            else next.add(hit.id);
            return next;
          });
        }
      } else {
        s.selectedId = null;
        setSelectedNode(null);
      }
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    const factor = Math.exp(-e.deltaY * 0.0015);
    const newK = Math.max(0.2, Math.min(4, s.transform.k * factor));
    // zoom toward cursor
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const px = (e.clientX - rect.left - cx) / s.transform.k - s.transform.x;
    const py = (e.clientY - rect.top - cy) / s.transform.k - s.transform.y;
    s.transform.k = newK;
    const npx = (e.clientX - rect.left - cx) / s.transform.k - s.transform.x;
    const npy = (e.clientY - rect.top - cy) / s.transform.k - s.transform.y;
    s.transform.x += npx - px;
    s.transform.y += npy - py;
  };

  // Touch pinch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        stateRef.current.pinch.active = true;
        stateRef.current.pinch.dist = Math.hypot(dx, dy);
        stateRef.current.pinch.k = stateRef.current.transform.k;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && stateRef.current.pinch.active) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const d = Math.hypot(dx, dy);
        stateRef.current.transform.k = Math.max(
          0.2,
          Math.min(4, (stateRef.current.pinch.k * d) / stateRef.current.pinch.dist),
        );
      }
    };
    const onTouchEnd = () => (stateRef.current.pinch.active = false);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const resetView = () => {
    stateRef.current.transform = { x: 0, y: 0, k: 1 };
    stateRef.current.selectedId = null;
    setSelectedNode(null);
    setExpanded(new Set());
  };

  return (
    <section
      id="atlas"
      className="relative border-t border-border/60 bg-background"
      aria-label="Fractal Inspiration Atlas"
    >
      <div className="container py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary-glow">
              Fractal Inspiration Atlas
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              The recursive constellation that became <span className="text-gradient">xPRIMEray</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              The Atlas maps the inspirations, tools, games, films, physics ideas, and visual
              systems that converged into xPRIMEray. The topology is non-orientable: what begins
              as geometry ends as perception, and returns as geometry again.
            </p>
            <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/45">
              Drag to pan · scroll to zoom · click any node to explore
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary-glow" />
            <span>{nodes.length} nodes · {edges.length} signal paths</span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          {([
            { color: "hsl(245,90%,66%)", label: "Primary signal" },
            { color: "hsl(190,95%,60%)", label: "Technical lineage" },
            { color: "hsl(270,80%,68%)", label: "Visual inspiration" },
            { color: "hsl(38,95%,60%)",  label: "Mythic symbol" },
            { color: "hsl(145,65%,50%)", label: "Validation artifact" },
          ] as const).map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: color, boxShadow: `0 0 6px ${color}` }}
              />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/55">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div
          ref={containerRef}
          className="fractal-canvas relative mt-8 h-[640px] w-full overflow-hidden rounded-2xl border border-border/60 shadow-glow"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at center, rgba(99,170,255,0.06), transparent 70%), repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 48px), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 48px)",
          }}
        >
          {/* Resonance Sphere backdrop — central textured anchor for the constellation (nodes "orbit" conceptually) */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-60">
            <ResonanceSphere
              size={380}
              distortion={0.42}
              textureUrl={selectedNode?.media?.find(m => m.type === 'image')?.url}
              showRays={true}
            />
          </div>

          {/* vignette */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{ boxShadow: "inset 0 0 200px 40px rgba(0,0,0,0.85)" }}
            aria-hidden
          />

          <canvas
            ref={canvasRef}
            className="absolute inset-0 touch-none z-20"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
          />

          {/* HUD */}
          <div className="pointer-events-none absolute left-4 top-4 z-20 font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/70">
            <div className="rounded border border-border/40 bg-background/60 px-2 py-1 backdrop-blur">
              Atlas · Curved Transport Observatory
            </div>
            {hoverLabel && (
              <div className="mt-2 rounded border border-primary/40 bg-background/70 px-2 py-1 text-primary-glow backdrop-blur">
                ▸ {hoverLabel}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
            <button
              onClick={() => (stateRef.current.transform.k = Math.min(4, stateRef.current.transform.k * 1.25))}
              className="grid h-8 w-8 place-items-center rounded border border-border/60 bg-background/70 font-mono text-sm text-foreground/80 backdrop-blur transition hover:border-primary/60 hover:text-primary-glow"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => (stateRef.current.transform.k = Math.max(0.2, stateRef.current.transform.k / 1.25))}
              className="grid h-8 w-8 place-items-center rounded border border-border/60 bg-background/70 font-mono text-sm text-foreground/80 backdrop-blur transition hover:border-primary/60 hover:text-primary-glow"
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              onClick={resetView}
              className="grid h-8 w-8 place-items-center rounded border border-border/60 bg-background/70 font-mono text-[9px] uppercase tracking-widest text-foreground/80 backdrop-blur transition hover:border-primary/60 hover:text-primary-glow"
              aria-label="Reset view"
            >
              ◎
            </button>
          </div>

          {/* Legend */}
          <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded border border-border/40 bg-background/60 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            <div>drag · scroll · click</div>
            <div className="mt-1 text-foreground/60">all paths converge into xPRIMEray</div>
          </div>

          {/* Detail card */}
          {selectedNode && (
            <div className="absolute right-4 bottom-4 z-30 w-[340px] max-w-[calc(100%-2rem)] animate-in fade-in slide-in-from-bottom-4 rounded-xl border border-primary/40 bg-background/92 p-4 shadow-glow backdrop-blur-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div
                    className="font-mono text-[9px] uppercase tracking-[0.25em]"
                    style={{ color: `hsl(${selectedNode.hue} 80% 70%)` }}
                  >
                    {selectedNode.kind === "core" ? "Convergence Node" : selectedNode.kind === "primary" ? "Primary Signal" : "Fractal Branch"}
                  </div>
                  <div className="mt-1 text-base font-semibold text-foreground">{selectedNode.label}</div>
                  {selectedNode.subtitle && (
                    <div className="text-xs text-muted-foreground">{selectedNode.subtitle}</div>
                  )}
                </div>
                <button
                  onClick={() => {
                    stateRef.current.selectedId = null;
                    setSelectedNode(null);
                  }}
                  className="shrink-0 rounded p-1 text-muted-foreground transition hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {selectedNode.description && (
                  <div>
                    <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/50">
                      Why it matters
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/80">{selectedNode.description}</p>
                  </div>
                )}
                {selectedNode.influenced && (
                  <div>
                    <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/50">
                      What it influenced
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/75">{selectedNode.influenced}</p>
                  </div>
                )}
                {selectedNode.xprimeConcept && (
                  <div>
                    <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/50">
                      xPRIMEray concept
                    </div>
                    <p className="text-xs leading-relaxed text-primary-glow/85">{selectedNode.xprimeConcept}</p>
                  </div>
                )}
              </div>

              {selectedNode.keywords && selectedNode.keywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {selectedNode.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full border border-border/60 bg-secondary/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-foreground/70"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              )}

              {/* Resonance Spheres media attachments */}
              {selectedNode.media && selectedNode.media.length > 0 && (
                <div className="mt-4 border-t border-border/25 pt-3">
                  <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-cyan-400/70">
                    Resonance Media
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedNode.media.map((m, idx) => {
                      if (m.type === 'image') {
                        return (
                          <figure key={idx} className="overflow-hidden rounded border border-border/40 bg-card/30">
                            <img 
                              src={m.url} 
                              alt={m.alt || m.caption || selectedNode.label} 
                              className="w-full object-cover" 
                              style={{ maxHeight: '160px' }}
                              loading="lazy"
                            />
                            {m.caption && <figcaption className="px-2 py-1 text-[9px] text-muted-foreground/70 font-mono tracking-tight">{m.caption}</figcaption>}
                            {m.resonanceNote && <p className="px-2 pb-1 text-[9px] italic text-primary-glow/70">{m.resonanceNote}</p>}
                          </figure>
                        );
                      }
                      if (m.type === 'youtube') {
                        const vidId = m.url.includes('embed/') ? m.url.split('embed/')[1]?.split('?')[0] : m.url.split('v=')[1]?.split('&')[0];
                        return (
                          <div key={idx} className="overflow-hidden rounded border border-border/40 bg-card/30">
                            {vidId ? (
                              <iframe 
                                width="100%" 
                                height="160" 
                                src={`https://www.youtube.com/embed/${vidId}`} 
                                title={m.caption || "Resonance video"} 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                              />
                            ) : (
                              <a href={m.url} target="_blank" className="block p-3 text-xs text-primary/80 hover:underline">Watch: {m.caption || m.url}</a>
                            )}
                            {m.caption && <div className="px-2 py-1 text-[9px] text-muted-foreground/70 font-mono">{m.caption}</div>}
                            {m.resonanceNote && <p className="px-2 pb-2 text-[9px] italic text-primary-glow/70">{m.resonanceNote}</p>}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {selectedNode.href && (
                <a
                  href={selectedNode.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-primary/70 transition hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                  View resource
                </a>
              )}

              {selectedNode.kind === "primary" && (
                <div className="mt-3 border-t border-border/25 pt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-primary-glow/60">
                  click again to {expanded.has(selectedNode.id) ? "collapse" : "expand"} branch
                </div>
              )}

              {/* Curated resonance credit for high-fidelity nodes like Digital Circus */}
              {selectedNode.id === "digital-circus" && (
                <div className="mt-2 text-[8px] font-mono tracking-[0.15em] text-amber-400/60">
                  Resonance Echo — Glitch Productions, The Amazing Digital Circus. Portal nexus aesthetics as xPRIMEray transport kinship.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- physics simulation ---------------- */

function simulate(nodes: AtlasNode[], edges: AtlasEdge[]) {
  const ALPHA = 0.85;
  // Repulsion (limited pairs for perf — N is small ~30-60)
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d2 = dx * dx + dy * dy + 0.01;
      const d = Math.sqrt(d2);
      const minDist = a.radius + b.radius + 30;
      const strength = (a.kind === "core" || b.kind === "core" ? 8000 : 2400) / d2;
      const fx = (dx / d) * -strength;
      const fy = (dy / d) * -strength;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
      // collision soft
      if (d < minDist) {
        const push = (minDist - d) * 0.05;
        a.vx -= (dx / d) * push;
        a.vy -= (dy / d) * push;
        b.vx += (dx / d) * push;
        b.vy += (dy / d) * push;
      }
    }
  }
  // Spring edges
  const map = new Map(nodes.map((n) => [n.id, n]));
  for (const e of edges) {
    const s = map.get(e.source);
    const t = map.get(e.target);
    if (!s || !t) continue;
    const dx = t.x - s.x;
    const dy = t.y - s.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const targetLen = t.kind === "secondary" ? 130 : 280;
    const k = 0.012;
    const f = (d - targetLen) * k;
    const fx = (dx / d) * f;
    const fy = (dy / d) * f;
    if (s.kind !== "core") {
      s.vx += fx;
      s.vy += fy;
    }
    if (t.kind !== "core") {
      t.vx -= fx;
      t.vy -= fy;
    }
  }
  // Center pull + integrate
  for (const n of nodes) {
    if (n.kind === "core") {
      n.x = 0;
      n.y = 0;
      n.vx = 0;
      n.vy = 0;
      continue;
    }
    n.vx += -n.x * 0.0015;
    n.vy += -n.y * 0.0015;
    n.vx *= ALPHA;
    n.vy *= ALPHA;
    n.x += n.vx;
    n.y += n.vy;
  }
}

/* ---------------- rendering ---------------- */

function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  s: { nodes: AtlasNode[]; edges: AtlasEdge[]; transform: { x: number; y: number; k: number }; hoverId: string | null; selectedId: string | null; pulse: number },
) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  // background subtle stars
  drawStars(ctx, w, h, s.pulse);

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(s.transform.k, s.transform.k);
  ctx.translate(s.transform.x, s.transform.y);

  // determine highlighted set
  const focusId = s.selectedId ?? s.hoverId;
  const connected = new Set<string>();
  if (focusId) {
    connected.add(focusId);
    for (const e of s.edges) {
      if (e.source === focusId) connected.add(e.target);
      if (e.target === focusId) connected.add(e.source);
    }
  }

  // edges
  const map = new Map(s.nodes.map((n) => [n.id, n]));
  for (const e of s.edges) {
    const a = map.get(e.source);
    const b = map.get(e.target);
    if (!a || !b) continue;
    const isFocus = focusId && (e.source === focusId || e.target === focusId);
    const dim = focusId && !isFocus ? 0.12 : 1;

    // gradient line
    const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    grad.addColorStop(0, `hsla(${a.hue}, 80%, 65%, ${0.35 * dim})`);
    grad.addColorStop(1, `hsla(${b.hue}, 80%, 65%, ${0.35 * dim})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = isFocus ? 1.6 : 0.8;
    // gentle curve
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const nx = -(b.y - a.y);
    const ny = b.x - a.x;
    const len = Math.hypot(nx, ny) || 1;
    const curve = 18;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(mx + (nx / len) * curve, my + (ny / len) * curve, b.x, b.y);
    ctx.stroke();

    // signal pulse traveling toward core (xprimeray)
    if (isFocus || !focusId) {
      const t = ((s.pulse * 0.4 + (a.x + a.y) * 0.0005) % 1 + 1) % 1;
      // travel from outer toward core: identify which end is closer to (0,0)
      const aIsInner = Math.hypot(a.x, a.y) < Math.hypot(b.x, b.y);
      const from = aIsInner ? b : a;
      const to = aIsInner ? a : b;
      const px = from.x + (to.x - from.x) * t;
      const py = from.y + (to.y - from.y) * t;
      ctx.fillStyle = `hsla(${to.hue}, 100%, 75%, ${0.7 * dim})`;
      ctx.beginPath();
      ctx.arc(px, py, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // nodes
  for (const n of s.nodes) {
    const isFocus = !focusId || connected.has(n.id);
    const dim = isFocus ? 1 : 0.25;
    const pulse = n.kind === "core" ? 1 + Math.sin(s.pulse * 1.5) * 0.06 : 1;
    const r = n.radius * pulse;

    // outer glow
    const glow = ctx.createRadialGradient(n.x, n.y, r * 0.2, n.x, n.y, r * 3);
    glow.addColorStop(0, `hsla(${n.hue}, 90%, 70%, ${0.35 * dim})`);
    glow.addColorStop(1, `hsla(${n.hue}, 90%, 50%, 0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
    ctx.fill();

    // ring
    ctx.strokeStyle = `hsla(${n.hue}, 90%, 70%, ${0.9 * dim})`;
    ctx.lineWidth = n.kind === "core" ? 2 : n.kind === "primary" ? 1.4 : 1;
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.stroke();

    // inner fill
    const fill = ctx.createRadialGradient(n.x - r * 0.3, n.y - r * 0.3, 0, n.x, n.y, r);
    fill.addColorStop(0, `hsla(${n.hue}, 90%, 35%, ${0.85 * dim})`);
    fill.addColorStop(1, `hsla(${n.hue}, 90%, 12%, ${0.85 * dim})`);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(n.x, n.y, r - 1, 0, Math.PI * 2);
    ctx.fill();

    // core has crosshair
    if (n.kind === "core") {
      ctx.strokeStyle = `hsla(${n.hue}, 100%, 85%, ${0.6 * dim})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(n.x - r * 1.6, n.y);
      ctx.lineTo(n.x - r * 1.1, n.y);
      ctx.moveTo(n.x + r * 1.1, n.y);
      ctx.lineTo(n.x + r * 1.6, n.y);
      ctx.moveTo(n.x, n.y - r * 1.6);
      ctx.lineTo(n.x, n.y - r * 1.1);
      ctx.moveTo(n.x, n.y + r * 1.6);
      ctx.lineTo(n.x, n.y + r * 1.1);
      ctx.stroke();
    }

    // label
    const labelDim = isFocus ? 1 : 0.4;
    ctx.fillStyle = `rgba(230, 235, 250, ${labelDim})`;
    ctx.font = `${n.kind === "core" ? 600 : 500} ${n.kind === "core" ? 14 : n.kind === "primary" ? 12 : 10}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(n.label, n.x, n.y + r + 6);

    if (n.subtitle && n.kind !== "secondary") {
      ctx.fillStyle = `hsla(${n.hue}, 80%, 75%, ${0.85 * labelDim})`;
      ctx.font = `400 ${n.kind === "core" ? 11 : 10}px ui-monospace, monospace`;
      ctx.fillText(n.subtitle, n.x, n.y + r + 22);
    }

    // Media indicator (Resonance Sphere attachment)
    if (n.media && n.media.length > 0) {
      ctx.fillStyle = `hsla(186, 90%, 70%, ${0.9 * dim})`;
      ctx.beginPath();
      ctx.arc(n.x + r * 0.7, n.y - r * 0.7, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `hsla(186, 90%, 95%, ${dim})`;
      ctx.fillText("◉", n.x + r * 0.7, n.y - r * 0.75);
    }
  }

  ctx.restore();
}

let starCache: Array<{ x: number; y: number; b: number }> | null = null;
function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, pulse: number) {
  if (!starCache || starCache.length !== 120) {
    starCache = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random(),
      b: 0.2 + Math.random() * 0.6,
    }));
  }
  for (const s of starCache) {
    const tw = 0.5 + Math.sin(pulse * 2 + s.x * 50) * 0.5;
    ctx.fillStyle = `rgba(180, 200, 255, ${s.b * 0.25 * tw})`;
    ctx.fillRect(s.x * w, s.y * h, 1, 1);
  }
}
