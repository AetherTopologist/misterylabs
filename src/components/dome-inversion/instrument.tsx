import { useMemo, useState, type ReactNode } from "react";
import {
  DOME_CX,
  DOME_CY,
  DOME_R,
  LANTERN,
  OBS,
  bundle,
  lanternVisibleInImage,
  mapRadius,
  stageOf,
  type DomeRay,
} from "@/lib/dome-inversion/optics";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const MUTED = "hsl(var(--muted-foreground))";
const CYAN = "hsl(var(--annotation-cyan))";
const AMBER = "hsl(var(--annotation-amber))";
const DIAGRAM = "hsl(var(--layer-diagram))";

const STAGES = ["REAL", "BEND", "INVERT", "CLOAK CENTER"] as const;
const LOOK_R = 150;

export function DomeInversionInstrument() {
  const [s, setS] = useState(0);
  const rays = useMemo(() => bundle(s), [s]);
  const stage = stageOf(s, rays);
  const lanternInImage = lanternVisibleInImage(s, rays);
  const lanternHits = rays.filter((r) => r.fate === "lantern").length;
  const pct = Math.round(s * 100);

  return (
    <div className="instrument-demo cavendish-demo space-y-5">
      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-4 py-2.5 sm:px-5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/80">
              MisterY Labs Arcade · Optical thought experiment
            </div>
            <div className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
              Geometry fixed · transport altered
            </div>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400">
            {stage}
          </div>
        </div>
        <svg
          viewBox="0 0 720 420"
          className="h-auto w-full"
          role="img"
          aria-label="Looking up into a coffered dome beside a meridional ray diagram"
        >
          <rect width="720" height="420" fill={DIAGRAM} />
          <text x="28" y="28" fill={MUTED} fontFamily={MONO} fontSize="9" letterSpacing="3">
            LOOKING UP
          </text>
          <text x="692" y="28" textAnchor="end" fill={MUTED} fontFamily={MONO} fontSize="9" letterSpacing="3">
            MERIDIONAL RAYS
          </text>
          <LookingUp s={s} lanternInImage={lanternInImage} />
          <SideDiagram s={s} rays={rays} />
        </svg>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="panel p-4 sm:p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            Real ↔ invert
          </div>
          <label className="mt-4 block">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Concave interior</span>
              <span className="tabular-nums text-cyan-400">{pct}%</span>
              <span>Convex reading</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={pct}
              onChange={(e) => setS(Number(e.target.value) / 100)}
              className="mt-2 w-full"
              aria-label="Real to invert"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {STAGES.map((st) => (
              <span
                key={st}
                className={
                  "rounded-sm border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] " +
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
            The coffers do not morph. A bounded index field between observer and
            ceiling rewrites which parts of the fixed dome are reachable.
          </p>
        </div>

        <div className="panel p-4 sm:p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            Sampling
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[11px]">
            <dt className="text-muted-foreground">Lantern ray hits</dt>
            <dd className="text-right tabular-nums text-amber-400">{lanternHits}</dd>
            <dt className="text-muted-foreground">In image plane</dt>
            <dd className="text-right tabular-nums">
              {lanternInImage ? "present" : "not sampled"}
            </dd>
            <dt className="text-muted-foreground">Mapping</dt>
            <dd className="text-right tabular-nums">ρ → mix(ρ, R²/ρ)</dd>
          </dl>
          <p className="mt-4 rounded-lg bg-background/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-400">
            Arcade · not a building explanation
          </p>
        </div>
      </div>
    </div>
  );
}

function LookingUp({ s, lanternInImage }: { s: number; lanternInImage: boolean }) {
  const cx = 168;
  const cy = 220;
  const rings = [28, 52, 76, 100, 124, LOOK_R];
  const ribs = 16;
  const coffers: ReactNode[] = [];
  for (let i = 0; i < rings.length; i++) {
    const r = mapRadius(rings[i], s, LOOK_R);
    coffers.push(
      <circle
        key={"r" + i}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="hsl(42 45% 88%)"
        strokeOpacity={0.8}
        strokeWidth={i === rings.length - 1 ? 2.4 : 1.35}
      />,
    );
  }
  for (let k = 0; k < ribs; k++) {
    const th = (k / ribs) * Math.PI * 2;
    const r0 = mapRadius(22, s, LOOK_R);
    const r1 = mapRadius(LOOK_R, s, LOOK_R);
    coffers.push(
      <line
        key={"b" + k}
        x1={cx + r0 * Math.cos(th)}
        y1={cy + r0 * Math.sin(th)}
        x2={cx + r1 * Math.cos(th)}
        y2={cy + r1 * Math.sin(th)}
        stroke="hsl(42 40% 82%)"
        strokeOpacity="0.7"
        strokeWidth="1.15"
      />,
    );
  }
  const lanternR = mapRadius(16, s, LOOK_R);
  return (
    <g>
      <circle cx={cx} cy={cy} r={LOOK_R + 8} fill="hsl(40 18% 22%)" stroke="hsl(42 40% 78%)" strokeWidth="2" />
      {coffers}
      {lanternInImage ? (
        <g>
          <circle cx={cx} cy={cy} r={Math.max(6, Math.min(lanternR, 36))} fill="none" stroke={AMBER} />
          <circle cx={cx} cy={cy} r="3" fill={AMBER} />
        </g>
      ) : (
        <circle cx={cx} cy={cy} r="18" fill="none" stroke={CYAN} strokeDasharray="3 4" strokeOpacity="0.7" />
      )}
    </g>
  );
}

function SideDiagram({ s, rays }: { s: number; rays: DomeRay[] }) {
  const arch = describeArch();
  return (
    <g>
      <path d={arch} fill="hsl(40 16% 28%)" stroke="hsl(42 40% 86%)" strokeWidth="2.4" />
      {/* coffer ticks on the arch */}
      {Array.from({ length: 9 }).map((_, i) => {
        const th = Math.PI + (i / 8) * Math.PI;
        const x = DOME_CX + DOME_R * Math.cos(th);
        const y = DOME_CY + DOME_R * Math.sin(th);
        const x2 = DOME_CX + (DOME_R - 10) * Math.cos(th);
        const y2 = DOME_CY + (DOME_R - 10) * Math.sin(th);
        return <line key={i} x1={x} y1={y} x2={x2} y2={y2} stroke="hsl(42 30% 70%)" strokeOpacity="0.5" />;
      })}
      {/* lantern — always drawn in geometry */}
      <circle cx={LANTERN.x} cy={LANTERN.y} r={LANTERN.r} fill="hsl(40 25% 28%)" stroke={AMBER} />
      <line x1={LANTERN.x} y1={LANTERN.y + LANTERN.r} x2={LANTERN.x} y2={LANTERN.y + 28} stroke={AMBER} />
      <rect x={LANTERN.x - 6} y={LANTERN.y + 26} width="12" height="10" fill={AMBER} opacity="0.85" />

      {/* GRIN blob */}
      <ellipse
        cx={360}
        cy={300}
        rx={70 + s * 10}
        ry={48}
        fill={CYAN}
        fillOpacity={0.04 + s * 0.12}
        stroke={CYAN}
        strokeOpacity={0.25 + s * 0.4}
        strokeDasharray="4 5"
      />

      {rays.map((ray, i) => {
        if (ray.points.length < 2) return null;
        const d = ray.points
          .map((p, j) => `${j === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
          .join(" ");
        const hitLantern = ray.fate === "lantern";
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={hitLantern ? AMBER : CYAN}
            strokeOpacity={hitLantern ? 0.9 : 0.7}
            strokeWidth="1.25"
          />
        );
      })}
      <circle cx={OBS.x} cy={OBS.y} r="5" fill={CYAN} />
    </g>
  );
}

function describeArch(): string {
  const steps = 36;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const th = Math.PI + (i / steps) * Math.PI;
    const x = DOME_CX + DOME_R * Math.cos(th);
    const y = DOME_CY + DOME_R * Math.sin(th);
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(" ");
}
