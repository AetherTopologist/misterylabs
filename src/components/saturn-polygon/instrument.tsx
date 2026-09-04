import { useEffect, useMemo, useRef, useState } from "react";
import {
  analogLabel,
  MODE_MAX,
  MODE_MIN,
  organization,
  sampleJet,
  vertexAngles,
} from "@/lib/saturn-polygon/wave";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const MUTED = "hsl(var(--muted-foreground))";
const AMBER = "hsl(var(--annotation-amber))";
const CYAN = "hsl(var(--annotation-cyan))";
const DIAGRAM = "hsl(var(--layer-diagram))";

const CX = 360;
const CY = 210;
const PLANET_R = 168;
const JET_R = 108;
const AMP_MAX = 22;

export function SaturnPolygonInstrument() {
  const [m, setM] = useState(6);
  const [amp, setAmp] = useState(16);
  const [phase, setPhase] = useState(0);
  const reduced = usePrefersReducedMotion();
  const ampRef = useRef(amp);
  ampRef.current = amp;

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const speed = 0.22 + (ampRef.current / AMP_MAX) * 0.15;
      setPhase((p) => p + speed * dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const samples = useMemo(
    () => sampleJet(m, amp, phase, JET_R, CX, CY, 280),
    [m, amp, phase],
  );
  const verts = useMemo(() => vertexAngles(m, phase), [m, phase]);
  const analog = analogLabel(m);
  const org = organization(amp, AMP_MAX);

  return (
    <div className="instrument-demo cavendish-demo space-y-5">
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2.5 sm:px-5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/80">
              Instrument · Polar wave mode
            </div>
            <div className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
              Circular jet → organized polygon-like structure
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400">
              m = {m}
            </div>
            {analog && (
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-amber-400/90">
                {analog.name}
              </div>
            )}
          </div>
        </div>
        <SaturnScene samples={samples} verts={verts} m={m} amp={amp} analog={analog} org={org} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="panel p-4 sm:p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            Azimuthal mode m
          </div>
          <label className="mt-4 block">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Mode m</span>
              <span className="tabular-nums text-cyan-400">{m}</span>
            </div>
            <input
              type="range"
              min={MODE_MIN}
              max={MODE_MAX}
              step={1}
              value={m}
              onChange={(e) => setM(Number(e.target.value))}
              className="mt-2 w-full"
              aria-label="Azimuthal mode m"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setM(6)}
              className={
                "min-h-11 rounded-lg px-2 text-[11px] font-medium " +
                (m === 6
                  ? "bg-card text-foreground shadow-[0_0_0_1px_hsl(var(--annotation-cyan))]"
                  : "bg-background text-muted-foreground ring-1 ring-border/80")
              }
            >
              m = 6 · Hexagon
            </button>
            <button
              type="button"
              onClick={() => setM(10)}
              className={
                "min-h-11 rounded-lg px-2 text-[11px] font-medium " +
                (m === 10
                  ? "bg-card text-foreground shadow-[0_0_0_1px_hsl(var(--annotation-cyan))]"
                  : "bg-background text-muted-foreground ring-1 ring-border/80")
              }
            >
              m = 10 · Decagon
            </button>
          </div>
          <label className="mt-5 block">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Perturbation amplitude</span>
              <span className="tabular-nums text-foreground">{amp.toFixed(0)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={AMP_MAX}
              value={amp}
              onChange={(e) => setAmp(Number(e.target.value))}
              className="mt-2 w-full"
              aria-label="Perturbation amplitude"
            />
          </label>
        </div>

        <div className="panel p-4 sm:p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            Apparent organization
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {org}
          </div>
          {analog ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {analog.kicker}. A continuous circular jet with integer mode{" "}
              <span className="text-cyan-400">m = {m}</span> can be read as a{" "}
              {analog.name.toLowerCase()}.
            </p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Integer m sets how many undulations fit around the ring. Corners are
              an organized wave, not a drawn polygon.
            </p>
          )}
          <p className="mt-4 rounded-lg bg-background/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-400">
            r(θ) = R + A cos(mθ + φ)
          </p>
        </div>
      </div>
    </div>
  );
}

function SaturnScene({
  samples,
  verts,
  m,
  amp,
  analog,
  org,
}: {
  samples: { x: number; y: number }[];
  verts: number[];
  m: number;
  amp: number;
  analog: { kicker: string; name: string } | null;
  org: string;
}) {
  const d = samples
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ") + " Z";
  const inner = samples
    .map((p, i) => {
      const dx = p.x - CX;
      const dy = p.y - CY;
      const r = Math.hypot(dx, dy);
      const ir = r - 14;
      return `${i === 0 ? "M" : "L"} ${(CX + (dx / r) * ir).toFixed(1)} ${(CY + (dy / r) * ir).toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 720 420"
      className="h-auto w-full"
      role="img"
      aria-label={`Polar atmospheric jet in azimuthal mode ${m}`}
    >
      <rect width="720" height="420" fill={DIAGRAM} />
      <text x="28" y="32" fill={MUTED} fontFamily={MONO} fontSize="9" letterSpacing="3.2">
        POLAR VIEW · CONTINUOUS JET
      </text>
      <text x="692" y="32" textAnchor="end" fill={MUTED} fontFamily={MONO} fontSize="9" letterSpacing="2">
        NOT A POLYGON DRAWING
      </text>

      <circle cx={CX} cy={CY} r={PLANET_R} fill="hsl(32 42% 22%)" stroke="hsl(36 48% 40%)" strokeWidth="1.5" />
      <circle cx={CX} cy={CY} r={132} fill="none" stroke="hsl(30 35% 34%)" strokeWidth="11" opacity="0.7" />
      <circle cx={CX} cy={CY} r={78} fill="none" stroke="hsl(26 32% 28%)" strokeWidth="8" opacity="0.6" />
      <circle cx={CX} cy={CY} r={36} fill="hsl(18 45% 12%)" stroke="hsl(32 55% 38%)" />

      <path d={d} fill="hsl(38 80% 52% / 0.42)" stroke="none" />
      <path d={d} fill="none" stroke="hsl(42 95% 62%)" strokeWidth="3.1" />
      <path d={inner} fill="none" stroke={CYAN} strokeOpacity="0.75" strokeWidth="1.6" />

      {verts.map((th, i) => {
        const r = JET_R + amp;
        return (
          <circle
            key={i}
            cx={CX + r * Math.cos(th)}
            cy={CY + r * Math.sin(th)}
            r="4.4"
            fill={AMBER}
            stroke="hsl(42 100% 80%)"
            strokeWidth="1"
          />
        );
      })}

      <text x="28" y="400" fill={MUTED} fontFamily={MONO} fontSize="9" letterSpacing="2.4">
        {org}
      </text>
      <text x="692" y="400" textAnchor="end" fill={analog ? AMBER : MUTED} fontFamily={MONO} fontSize="9" letterSpacing="2">
        {analog ? analog.kicker.toUpperCase() : `m = ${m} VERTICES`}
      </text>
    </svg>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}
