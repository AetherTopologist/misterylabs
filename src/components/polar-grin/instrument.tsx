import { useMemo, useState } from "react";
import {
  APPLE,
  WITNESS,
  appleSamples,
  bundle,
  polePos,
  stageOf,
  type RayPath,
  type Stage,
} from "@/lib/polar-grin/rays";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const FG = "hsl(var(--foreground))";
const MUTED = "hsl(var(--muted-foreground))";
const CYAN = "hsl(var(--annotation-cyan))";
const AMBER = "hsl(var(--annotation-amber))";
const DIAGRAM = "hsl(var(--layer-diagram))";

const STAGES: Stage[] = ["FIELD OFF", "BEND", "SHADOW", "WRAP", "REVEAL"];

export function PolarGrinInstrument() {
  const [s, setS] = useState(0);
  const rays = useMemo(() => bundle(s), [s]);
  const stage = stageOf(s, rays);
  const hits = rays.filter((r) => r.fate === "surface").length;
  const wrapped = rays.filter((r) => r.fate === "escaped" || r.fate === "witness").length;
  const witness = rays.filter((r) => r.fate === "witness").length;
  const pct = Math.round(s * 100);

  return (
    <div className="instrument-demo cavendish-demo space-y-5">
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2.5 sm:px-5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/80">
              Instrument · Polar GRIN
            </div>
            <div className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
              Apple · same object, different transport
            </div>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400">
            {stage}
          </div>
        </div>
        <AppleScene s={s} rays={rays} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="panel p-4 sm:p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            Same object · same camera · different transport
          </div>
          <label className="mt-4 block">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Field strength</span>
              <span className="tabular-nums text-cyan-400">{pct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={pct}
              onChange={(e) => setS(Number(e.target.value) / 100)}
              className="mt-2 w-full"
              aria-label="Field strength"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {STAGES.map((st) => (
              <span
                key={st}
                className={
                  "rounded-sm border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] " +
                  (stage === st
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                    : "border-border/40 text-muted-foreground/50")
                }
              >
                {st}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            The apple is never faded. An incident-side polar-halo kick scales
            with field strength. Rays that meet the fruit still stop.
          </p>
        </div>

        <div className="panel p-4 sm:p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            Ray accessibility
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[11px]">
            <dt className="text-muted-foreground">Surface hits</dt>
            <dd className="text-right tabular-nums text-amber-400">{hits}</dd>
            <dt className="text-muted-foreground">Wrapped / escaped</dt>
            <dd className="text-right tabular-nums text-cyan-400">{wrapped}</dd>
            <dt className="text-muted-foreground">Witness beads</dt>
            <dd className="text-right tabular-nums">{witness}</dd>
            <dt className="text-muted-foreground">Kick strength</dt>
            <dd className="text-right tabular-nums">{s.toFixed(2)}</dd>
          </dl>
          <p className="mt-4 rounded-lg bg-background/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-400">
            Reduced illustrative rays · not xPRIMEray
          </p>
        </div>
      </div>
    </div>
  );
}

function AppleScene({ s, rays }: { s: number; rays: RayPath[] }) {
  const body = appleSamples();
  const d = body
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ") + " Z";
  const pole = polePos();
  const haloR = 40 + s * 8;

  const stem = `M ${pole.x} ${pole.y + 6} C ${pole.x - 2} ${pole.y - 18}, ${pole.x + 6} ${pole.y - 36}, ${pole.x + 10} ${pole.y - 48}`;
  const leaf = `M ${pole.x + 8} ${pole.y - 36} C ${pole.x + 28} ${pole.y - 48}, ${pole.x + 36} ${pole.y - 28}, ${pole.x + 14} ${pole.y - 24} Z`;

  return (
    <svg
      viewBox="0 0 720 420"
      className="h-auto w-full"
      role="img"
      aria-label="Polar GRIN apple with a ray bundle aimed at the north pole"
    >
      <rect width="720" height="420" fill={DIAGRAM} />
      <Grid />
      <defs>
        <mask id="polar-ray-mask">
          <rect width="720" height="420" fill="white" />
          <path d={d} fill="black" />
        </mask>
      </defs>

      <text x="28" y="32" fill={MUTED} fontFamily={MONO} fontSize="9" letterSpacing="3.2">
        POLAR GRIN · AXISYMMETRIC CUSHION
      </text>
      <text x="692" y="32" textAnchor="end" fill={MUTED} fontFamily={MONO} fontSize="9" letterSpacing="2">
        OBJECT REMAINS
      </text>

      {/* GRIN halo — field, not a hide */}
      <circle
        cx={pole.x}
        cy={pole.y}
        r={haloR}
        fill="none"
        stroke={CYAN}
        strokeOpacity={0.12 + s * 0.35}
        strokeWidth={18}
      />
      <circle
        cx={pole.x}
        cy={pole.y}
        r={haloR}
        fill="none"
        stroke={CYAN}
        strokeOpacity={0.25 + s * 0.45}
        strokeDasharray="4 6"
        strokeWidth="1.2"
      />

      {/* Apple body — always opaque */}
      <path d={d} fill="hsl(6 48% 26%)" stroke="hsl(8 62% 44%)" strokeWidth="1.6" />
      <ellipse
        cx={APPLE.cx - 22}
        cy={APPLE.cy - 18}
        rx="28"
        ry="36"
        fill="hsl(12 70% 62%)"
        opacity="0.18"
      />
      <path
        d={d}
        fill="none"
        stroke="hsl(18 70% 62%)"
        strokeOpacity="0.35"
        strokeWidth="6"
        transform={`translate(${APPLE.cx} ${APPLE.cy}) scale(0.78) translate(${-APPLE.cx} ${-APPLE.cy})`}
      />
      <path d={stem} fill="none" stroke="hsl(28 30% 42%)" strokeWidth="4" strokeLinecap="round" />
      <path d={leaf} fill="hsl(150 28% 28%)" stroke="hsl(150 40% 44%)" strokeWidth="1" />

      {/* Witness beads */}
      {WITNESS.map((w, i) => (
        <g key={i}>
          <circle cx={w.x} cy={w.y} r="5.5" fill="none" stroke={AMBER} strokeOpacity="0.85" />
          <circle cx={w.x} cy={w.y} r="2" fill={AMBER} />
        </g>
      ))}

      <g mask="url(#polar-ray-mask)">
        {rays.map((ray, i) => (
          <RayStroke key={i} ray={ray} />
        ))}
      </g>

      <text x="28" y="400" fill={MUTED} fontFamily={MONO} fontSize="9" letterSpacing="2.4">
        OBSERVER FIXED · RAYS FROM LEFT
      </text>
      <text x="692" y="400" textAnchor="end" fill={FG} fontFamily={MONO} fontSize="9" letterSpacing="2" opacity="0.7">
        FAR-SIDE WITNESS
      </text>
    </svg>
  );
}

function RayStroke({ ray }: { ray: RayPath }) {
  if (ray.points.length < 2) return null;
  const d = ray.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const last = ray.points[ray.points.length - 1];
  const hit = ray.fate === "surface";
  const reveal = ray.fate === "witness";
  const color = hit ? AMBER : CYAN;
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeOpacity={hit ? 0.55 : 0.85} strokeWidth="1.35" />
      <circle cx={last.x} cy={last.y} r={reveal ? 3.2 : 2.1} fill={color} />
    </g>
  );
}

function Grid() {
  const lines = [];
  for (let x = 40; x < 720; x += 40) {
    lines.push(<line key={"v" + x} x1={x} y1={0} x2={x} y2={420} stroke="hsl(var(--border))" strokeOpacity="0.18" />);
  }
  for (let y = 40; y < 420; y += 40) {
    lines.push(<line key={"h" + y} x1={0} y1={y} x2={720} y2={y} stroke="hsl(var(--border))" strokeOpacity="0.18" />);
  }
  return <g>{lines}</g>;
}
