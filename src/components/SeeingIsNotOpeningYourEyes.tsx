import { Link } from "react-router-dom";
import { Eye, Compass, Telescope, Orbit, ArrowRight, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * "Seeing Is Not Opening Your Eyes"
 * A cinematic landing-page section bridging Euclidean optics
 * and xPRIMEray's curved-light simulation.
 *
 * All visuals are pure SVG + Tailwind semantic tokens — no external assets.
 */
export function SeeingIsNotOpeningYourEyes() {
  return (
    <section
      id="vision-is-geometry"
      className="relative overflow-hidden border-t border-border/40 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.08),_transparent_60%)]"
      aria-labelledby="vision-geometry-title"
    >
      {/* Parchment grid + vignette atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary-glow)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-glow)) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-background/85 to-background"
        aria-hidden
      />

      <div className="container py-20 md:py-28">
        {/* ── 1. HERO: VISION IS GEOMETRY ───────────────────── */}
        <header className="mx-auto max-w-4xl text-center">
          <div className="mb-5 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground/60">
            <span className="h-px w-10 bg-border/60" />
            <span>MisterY Labs · Nerjacker's Vault</span>
            <span className="h-px w-10 bg-border/60" />
          </div>

          <h2
            id="vision-geometry-title"
            className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl"
            style={{ fontFamily: "'Cormorant Garamond', 'Iowan Old Style', Georgia, serif" }}
          >
            Seeing Is Not
            <br />
            <span className="text-gradient italic">Opening Your Eyes</span>
          </h2>

          <p className="mt-5 font-mono text-xs uppercase tracking-[0.4em] text-primary-glow/80">
            Vision is Geometry
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            From Euclid's <em>Optics</em> to modern ray tracing, the world you see is not the world
            itself — but a reconstruction shaped by position, angle, and the limits of sight.
          </p>
        </header>

        {/* ── 2. EUCLID'S VISUAL CONE ───────────────────────── */}
        <div className="mt-20 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <SectionLabel icon={Eye} kind="Book I" title="Euclid's Visual Cone" />
            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              The eye sits at the apex. Rays of sight stretch outward, fanning into a cone of the
              visible. What falls within is known. What falls outside remains — quietly — unseen.
            </p>
            <ul className="mt-6 space-y-3 text-xs text-muted-foreground">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary-glow" />
                Distant objects appear smaller — angular subtension shrinks with distance.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary-glow" />
                Parallel lines seem to converge — a property of projection, not the world.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary-glow" />
                Nearby objects resolve sharper — finer detail subtends a wider angle.
              </li>
            </ul>
          </div>

          <VisualCone />
        </div>

        {/* ── 3. PERSPECTIVE ILLUSIONS ──────────────────────── */}
        <div className="mt-24">
          <SectionLabel icon={Compass} kind="The world through geometric eyes" title="Perspective Illusions" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <IllusionCard title="Roads Narrow" subtitle="Parallels Converge">
              <RoadDiagram />
            </IllusionCard>
            <IllusionCard title="Distant Shrinks" subtitle="Equal ≠ Equal">
              <ShrinkDiagram />
            </IllusionCard>
            <IllusionCard title="Shadows Measure" subtitle="Towers from Light">
              <TowerDiagram />
            </IllusionCard>
          </div>
        </div>

        {/* ── 4. REALITY FILTERED THROUGH POSITION ──────────── */}
        <figure className="mx-auto mt-24 max-w-3xl rounded-sm border border-border/40 bg-card/30 p-8 text-center backdrop-blur-sm md:p-12">
          <ScrollText className="mx-auto h-5 w-5 text-primary-glow/60" aria-hidden />
          <blockquote
            className="mt-5 font-serif text-2xl italic leading-snug text-foreground md:text-3xl"
            style={{ fontFamily: "'Cormorant Garamond', 'Iowan Old Style', Georgia, serif" }}
          >
            “What we see is not reality itself.
            <br />
            It is reality filtered through position.”
          </blockquote>
          <figcaption className="mt-5 font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60">
            — After Euclid
          </figcaption>
        </figure>

        {/* ── 5. BRIDGE TO xPRIMEray ────────────────────────── */}
        <div className="mt-24 grid gap-8 overflow-hidden rounded-sm border border-primary/25 bg-gradient-to-br from-card/40 via-card/20 to-primary/5 p-8 md:p-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <SectionLabel icon={Orbit} kind="From Straight Rays to Curved Reality" title="xPRIMEray" />
            <p className="mt-4 text-sm leading-relaxed text-foreground/80 md:text-base">
              Euclid drew sight as straight lines. Modern optics knows better: in gradient media and
              warped fields, light bends. <span className="text-primary-glow">xPRIMEray</span>{" "}
              simulates curved light transport in dynamic fields — the next chapter of optics, told
              in pixels and probes.
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground/60">
              Optical Simulation Engine · Curved Transport Research
            </p>
          </div>

          <CurvedRayDiagram />
        </div>

        {/* ── 6. CTA ────────────────────────────────────────── */}
        <div className="mt-20 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.45em] text-primary-glow">
            Enter the Vault · Expand Your Sight
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <a href="#evidence-vault">
                Explore the Vault
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/dashboard">
                <Telescope className="mr-2 h-4 w-4" />
                Enter MisterY Labs
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Helpers ───────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  kind,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  kind: string;
  title: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground/60">
        <Icon className="h-3.5 w-3.5 text-primary-glow" />
        <span>{kind}</span>
      </div>
      <h3
        className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
        style={{ fontFamily: "'Cormorant Garamond', 'Iowan Old Style', Georgia, serif" }}
      >
        {title}
      </h3>
    </div>
  );
}

function IllusionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="diagnostic-frame group rounded-sm border border-border/40 bg-card/30 p-5 transition-base hover:border-primary/40 hover:bg-card/50">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-sm bg-background/40">
        {children}
      </div>
      <figcaption className="mt-3">
        <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary-glow/80">
          {subtitle}
        </div>
        <div className="mt-1 text-sm font-semibold tracking-tight">{title}</div>
      </figcaption>
    </figure>
  );
}

// ── SVG diagrams (semantic-token strokes via currentColor) ──

function VisualCone() {
  return (
    <svg
      viewBox="0 0 600 360"
      className="h-auto w-full text-primary-glow"
      role="img"
      aria-label="Euclid's visual cone diagram with the eye at the apex"
    >
      <defs>
        <radialGradient id="vc-eye" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vc-ray" x1="0" x2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Eye glow */}
      <circle cx="60" cy="180" r="40" fill="url(#vc-eye)" />
      <circle cx="60" cy="180" r="9" fill="currentColor" opacity="0.85" />
      <circle cx="60" cy="180" r="3" fill="hsl(var(--background))" />

      {/* Cone rays (animated dash flow) */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
        const t = i / 8;
        const y = 60 + t * 240;
        return (
          <line
            key={i}
            x1="65"
            y1="180"
            x2="560"
            y2={y}
            stroke="url(#vc-ray)"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity={0.55}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-40"
              dur={`${4 + i * 0.2}s`}
              repeatCount="indefinite"
            />
          </line>
        );
      })}

      {/* Cone outline */}
      <line x1="65" y1="180" x2="560" y2="60" stroke="currentColor" strokeWidth="1.2" opacity="0.9" />
      <line x1="65" y1="180" x2="560" y2="300" stroke="currentColor" strokeWidth="1.2" opacity="0.9" />

      {/* Far image plane */}
      <ellipse cx="560" cy="180" rx="14" ry="120" stroke="currentColor" fill="none" strokeWidth="1" opacity="0.6" />

      {/* Labels */}
      <text x="35" y="235" fontSize="10" fill="currentColor" opacity="0.7" fontFamily="ui-monospace, monospace">
        EYE
      </text>
      <text x="290" y="55" fontSize="10" fill="currentColor" opacity="0.6" fontFamily="ui-monospace, monospace">
        VISUAL CONE
      </text>
      <text x="500" y="335" fontSize="9" fill="currentColor" opacity="0.5" fontFamily="ui-monospace, monospace">
        IMAGE PLANE
      </text>
    </svg>
  );
}

function RoadDiagram() {
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full text-primary-glow" aria-hidden>
      {/* Horizon */}
      <line x1="0" y1="70" x2="200" y2="70" stroke="currentColor" strokeWidth="0.6" opacity="0.4" strokeDasharray="2 3" />
      {/* Vanishing point */}
      <circle cx="100" cy="70" r="2" fill="currentColor" opacity="0.9" />
      {/* Road edges */}
      <line x1="20" y1="140" x2="100" y2="70" stroke="currentColor" strokeWidth="1" />
      <line x1="180" y1="140" x2="100" y2="70" stroke="currentColor" strokeWidth="1" />
      {/* Lane markers */}
      {[0, 1, 2, 3].map((i) => {
        const y = 140 - i * 18;
        const inset = (140 - y) * 0.55;
        return <line key={i} x1={100 - 2 + inset * 0.04} y1={y} x2={100 + 2 - inset * 0.04} y2={y} stroke="currentColor" strokeWidth="1" opacity={0.8 - i * 0.15} />;
      })}
    </svg>
  );
}

function ShrinkDiagram() {
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full text-primary-glow" aria-hidden>
      <line x1="10" y1="120" x2="190" y2="120" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      {/* Three equal-real, unequal-apparent disks */}
      {[
        { x: 35, r: 22 },
        { x: 100, r: 13 },
        { x: 165, r: 7 },
      ].map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy="80" r={d.r} stroke="currentColor" fill="none" strokeWidth="1" opacity="0.85" />
          <circle cx={d.x} cy="80" r="1.2" fill="currentColor" opacity="0.7" />
          <line x1={d.x} y1="120" x2={d.x} y2={80 + d.r} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
        </g>
      ))}
      {/* Eye on left */}
      <circle cx="6" cy="100" r="3" fill="currentColor" opacity="0.8" />
      <line x1="6" y1="100" x2="190" y2="60" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      <line x1="6" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

function TowerDiagram() {
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full text-primary-glow" aria-hidden>
      {/* Ground */}
      <line x1="0" y1="125" x2="200" y2="125" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      {/* Tower */}
      <rect x="50" y="40" width="14" height="85" stroke="currentColor" fill="none" strokeWidth="1" />
      <polygon points="50,40 64,40 57,28" stroke="currentColor" fill="none" strokeWidth="1" />
      {/* Sun ray */}
      <line x1="20" y1="20" x2="57" y2="40" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
      {/* Shadow */}
      <line x1="64" y1="125" x2="160" y2="125" stroke="currentColor" strokeWidth="2" opacity="0.85" />
      <line x1="57" y1="40" x2="160" y2="125" stroke="currentColor" strokeWidth="0.6" opacity="0.5" strokeDasharray="2 3" />
      {/* Angle arc */}
      <path d="M 75 125 A 15 15 0 0 0 70 113" stroke="currentColor" fill="none" strokeWidth="0.6" opacity="0.7" />
      <text x="78" y="120" fontSize="7" fill="currentColor" opacity="0.7" fontFamily="ui-monospace, monospace">
        θ
      </text>
    </svg>
  );
}

function CurvedRayDiagram() {
  return (
    <svg
      viewBox="0 0 600 280"
      className="h-auto w-full text-primary-glow"
      role="img"
      aria-label="Curved light transport around a gravitating mass"
    >
      <defs>
        <radialGradient id="cr-mass" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.7" />
          <stop offset="60%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Field lattice */}
      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse
          key={i}
          cx="380"
          cy="140"
          rx={30 + i * 22}
          ry={18 + i * 14}
          stroke="currentColor"
          fill="none"
          strokeWidth="0.4"
          opacity={0.35 - i * 0.03}
        />
      ))}

      {/* Mass */}
      <circle cx="380" cy="140" r="55" fill="url(#cr-mass)" />
      <circle cx="380" cy="140" r="14" fill="currentColor" opacity="0.85" />

      {/* Source on left */}
      <circle cx="30" cy="140" r="4" fill="currentColor" />
      <text x="14" y="165" fontSize="9" fill="currentColor" opacity="0.65" fontFamily="ui-monospace, monospace">
        SOURCE
      </text>

      {/* Curved rays passing the mass */}
      {[
        "M 30 100 Q 240 70 380 100 T 580 60",
        "M 30 140 Q 240 130 380 140 T 580 130",
        "M 30 180 Q 240 210 380 180 T 580 220",
      ].map((d, i) => (
        <g key={i}>
          <path d={d} stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.85" />
          <path d={d} stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="3 5" opacity="0.5">
            <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="3s" repeatCount="indefinite" />
          </path>
        </g>
      ))}

      <text x="500" y="265" fontSize="9" fill="currentColor" opacity="0.6" fontFamily="ui-monospace, monospace">
        CURVED TRANSPORT
      </text>
    </svg>
  );
}
