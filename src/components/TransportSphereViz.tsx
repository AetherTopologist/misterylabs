import { useMemo } from "react";

// Sphere geometry constants (SVG user-space, viewBox 0 0 1200 700)
const CX = 600;
const CY = 328;
const R  = 280;
const TOP = CY - R; // 48
const BOT = CY + R; // 608

// Left semicircle clip (sweep=0 traces leftward arc)
const LEFT_CLIP  = `M ${CX},${TOP} A ${R},${R} 0 0,0 ${CX},${BOT} L ${CX},${TOP} Z`;
// Right semicircle clip (sweep=1 traces rightward arc)
const RIGHT_CLIP = `M ${CX},${TOP} A ${R},${R} 0 0,1 ${CX},${BOT} L ${CX},${TOP} Z`;

const MONO = "ui-monospace,SFMono-Regular,Menlo,monospace";

type LeftRay  = { d: string; op: number };
type RightRay = { d: string; op: number; col: string };

function buildPaths(step: number): { left: LeftRay[]; right: RightRay[] } {
  const left:  LeftRay[]  = [];
  const right: RightRay[] = [];

  for (let y = TOP + 14; y < BOT - 10; y += step) {
    const dy   = y - CY;
    const disc = R * R - dy * dy;
    if (disc <= 1) continue;

    const sq    = Math.sqrt(disc);
    const lx    = CX - sq;
    const rx    = CX + sq;
    const normY = dy / R;            // –1 … +1
    const absN  = Math.abs(normY);
    const op    = 0.28 + absN * 0.42; // stronger near poles, more readable

    // ── Left: straight horizontal ray ──────────────────────
    left.push({ d: `M ${lx.toFixed(1)},${y} L ${CX},${y}`, op });

    // ── Right: cubic bezier (GRIN deflection) ──────────────
    // Ray deflects away from optical axis proportional to normY
    const def  = normY * R * 0.52;     // max ~145 px
    const span = rx - CX;
    const cp1x = (CX + span * 0.3 ).toFixed(1);
    const cp1y = (y + def * 0.1   ).toFixed(1);
    const cp2x = (CX + span * 0.68).toFixed(1);
    const cp2y = (y + def * 0.62  ).toFixed(1);
    const endY = (y + def          ).toFixed(1);
    const col  = absN > 0.52 ? "hsl(292,58%,66%)" : "hsl(186,88%,58%)";

    right.push({
      d: `M ${CX},${y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${rx.toFixed(1)},${endY}`,
      op,
      col,
    });
  }
  return { left, right };
}

export function TransportSphereViz({ className }: { className?: string }) {
  const { left, right } = useMemo(() => buildPaths(11), []);

  return (
    <svg
      viewBox="0 0 1200 700"
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Clip paths */}
        <clipPath id="tsv-left" ><path d={LEFT_CLIP}  /></clipPath>
        <clipPath id="tsv-right"><path d={RIGHT_CLIP} /></clipPath>
        <clipPath id="tsv-full" ><circle cx={CX} cy={CY} r={R} /></clipPath>

        {/* Subtle grid tile */}
        <pattern id="tsv-grid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.018)" strokeWidth="0.5" />
        </pattern>

        {/* Amber GRIN-field glow — positioned lower-right of sphere */}
        <radialGradient id="tsv-amber" cx={CX + 72} cy={CY + 98} r="215" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="hsl(35,88%,58%)"  stopOpacity="0.65" />
          <stop offset="45%"  stopColor="hsl(26,76%,38%)"  stopOpacity="0.20" />
          <stop offset="100%" stopColor="transparent"       stopOpacity="0"    />
        </radialGradient>

        {/* Cyan focal convergence zone — right half center */}
        <radialGradient id="tsv-focal" cx={CX + 30} cy={CY} r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="hsl(186,90%,58%)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent"       stopOpacity="0"    />
        </radialGradient>

        {/* Edge vignette (darkens sphere perimeter) */}
        <radialGradient id="tsv-vig" cx={CX} cy={CY} r={R} gradientUnits="userSpaceOnUse">
          <stop offset="68%"  stopColor="transparent"         stopOpacity="0" />
          <stop offset="100%" stopColor="rgba(4,5,11,0.55)"   stopOpacity="1" />
        </radialGradient>
      </defs>

      {/* ── Background grid ──────────────────────────────── */}
      <rect width="1200" height="700" fill="url(#tsv-grid)" />

      {/* ── Left half: straight (reference) transport ─────── */}
      <g clipPath="url(#tsv-left)">
        {left.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill="none"
            stroke="hsl(210,72%,62%)"
            strokeWidth="0.9"
            strokeOpacity={p.op}
          />
        ))}
      </g>

      {/* ── Right half: curved GRIN transport ───────────── */}
      <g clipPath="url(#tsv-right)">
        {right.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill="none"
            stroke={p.col}
            strokeWidth="0.9"
            strokeOpacity={p.op}
          />
        ))}
      </g>

      {/* ── Amber GRIN-field glow (inside sphere) ─────────── */}
      <circle cx={CX} cy={CY} r={R} fill="url(#tsv-amber)" clipPath="url(#tsv-full)" />

      {/* ── Cyan focal zone glow (convergence point) ──────── */}
      <circle cx={CX + 30} cy={CY} r="110" fill="url(#tsv-focal)" clipPath="url(#tsv-right)" />

      {/* ── Wireframe latitude ellipses (very faint) ─────── */}
      <g clipPath="url(#tsv-full)" fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="0.4">
        {([-0.64, -0.38, -0.13, 0.13, 0.38, 0.64] as const).map((t) => {
          const latR = Math.sqrt(1 - t * t) * R;
          return (
            <ellipse
              key={t}
              cx={CX}
              cy={CY + t * R}
              rx={latR}
              ry={latR * 0.21}
            />
          );
        })}
      </g>

      {/* ── Edge vignette ─────────────────────────────────── */}
      <circle cx={CX} cy={CY} r={R} fill="url(#tsv-vig)" clipPath="url(#tsv-full)" />

      {/* ── Sphere boundary circle ────────────────────────── */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.1" />

      {/* ── Center divider (straight vs curved boundary) ─── */}
      <line
        x1={CX} y1={TOP}
        x2={CX} y2={BOT}
        stroke="rgba(255,255,255,0.32)"
        strokeWidth="0.7"
        strokeDasharray="4 5"
      />

      {/* ── Crosshair at optical axis ─────────────────────── */}
      <g stroke="rgba(255,255,255,0.22)" strokeWidth="0.85" fill="none">
        <line x1={CX - 14} y1={CY} x2={CX + 14} y2={CY} />
        <line x1={CX}      y1={CY - 14} x2={CX} y2={CY + 14} />
        <circle cx={CX} cy={CY} r={4} />
      </g>

      {/* ── Quadrant labels ───────────────────────────────── */}
      <text x={CX - 132} y={TOP + 26} textAnchor="middle" fontFamily={MONO} fontSize="9"  fill="rgba(255,255,255,0.28)" letterSpacing={2.5}>STRAIGHT TRANSPORT</text>
      <text x={CX - 132} y={TOP + 39} textAnchor="middle" fontFamily={MONO} fontSize="8"  fill="rgba(148,163,184,0.22)" letterSpacing={1.5}>Reference Reality</text>
      <text x={CX + 132} y={TOP + 26} textAnchor="middle" fontFamily={MONO} fontSize="9"  fill="rgba(34,211,238,0.38)" letterSpacing={2.5}>CURVED TRANSPORT</text>
      <text x={CX + 132} y={TOP + 39} textAnchor="middle" fontFamily={MONO} fontSize="8"  fill="rgba(148,163,184,0.22)" letterSpacing={1.5}>GRIN Field Reality</text>

      {/* ── Axis annotations ──────────────────────────────── */}
      <text x={CX - R - 14} y={CY + 4} textAnchor="end"    fontFamily={MONO} fontSize="9"  fill="rgba(255,255,255,0.24)" letterSpacing={1.5}>n(x)</text>
      <text x={CX + R + 14} y={CY + 4} textAnchor="start"  fontFamily={MONO} fontSize="9"  fill="rgba(34,211,238,0.38)" letterSpacing={1.5}>n(0)</text>
      <text x={CX}          y={TOP - 14} textAnchor="middle" fontFamily={MONO} fontSize="8"  fill="rgba(255,255,255,0.18)" letterSpacing={2}>xPRIMEray · 1.0</text>
      <text x={CX}          y={BOT + 22} textAnchor="middle" fontFamily={MONO} fontSize="8"  fill="rgba(251,191,36,0.35)" letterSpacing={1.5}>Δε / transport boundary</text>
    </svg>
  );
}
