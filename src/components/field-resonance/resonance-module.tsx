import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Pause, Play, SkipForward } from "lucide-react";
import {
  STATIONS,
  angleFromStation,
  burstFrom,
  formatField,
  formatGauss,
  hzBand,
  hzToPos,
  matchOf,
  mgBand,
  mgToPos,
  phaseName,
  posToHz,
  posToMg,
  stationIndexFromAngle,
  waveAt,
  waveSnap,
  type Particle,
  type SourceMode,
} from "@/lib/field-resonance";
import { drawScene, measure, readPalette, type Layout } from "@/lib/draw-resonance";

const HOLD_S = 1.55;

type Readout = {
  phase: string;
  epsilon: number;
  ox: number;
  charge: number;
  placed: boolean;
  running: boolean;
};

function initialReadout(reduce: boolean): Readout {
  const wave = waveAt(0.25 / 0.9, 0.9, 0.7);
  return {
    phase: reduce ? "X-point" : phaseName(wave.epsilon),
    epsilon: reduce ? 0.82 : wave.epsilon,
    ox: reduce ? 0.55 : wave.ox,
    charge: 0,
    placed: false,
    running: !reduce,
  };
}

export function ResonanceModule() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<Layout>({ s: 1, cx: 0, cy: 0, w: 1, h: 1 });
  const dragRef = useRef(false);

  const [source, setSource] = useState<SourceMode>("lasers");
  const [stationId, setStationId] = useState("vii");
  const [mg, setMg] = useState(1.15);
  const [hz, setHz] = useState(0.9);
  const [amplitude, setAmplitude] = useState(0.7);
  const [readout, setReadout] = useState<Readout>(() => initialReadout(false));

  const sim = useRef({
    time: 0.25 / 0.9,
    mg: 1.15,
    hz: 0.9,
    amplitude: 0.7,
    source: "lasers" as SourceMode,
    stationId: "vii",
    destAngle: angleFromStation(2),
    running: true,
    reduce: false,
    gliding: false,
    glideMg: 1.15,
    glideHz: 0.9,
    charge: 0,
    placed: false,
    snap: null as null | { u: number },
    particles: [] as Particle[],
    prevEps: 0,
    flash: 0,
    ui: 0,
  });

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sim.current.reduce = reduce;
    sim.current.running = !reduce;
    if (reduce) {
      sim.current.time = 0;
      setReadout((r) => ({ ...r, running: false, phase: "X-point", epsilon: 0.82 }));
    }
  }, []);

  useEffect(() => {
    const s = sim.current;
    if (!s.gliding) {
      s.mg = mg;
      s.hz = hz;
    }
    s.amplitude = amplitude;
    s.source = source;
    if (s.stationId !== stationId) {
      s.stationId = stationId;
      const idx = STATIONS.findIndex((st) => st.id === stationId);
      if (!dragRef.current && idx >= 0) s.destAngle = angleFromStation(idx);
    }
  }, [mg, hz, amplitude, source, stationId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pal = readPalette();
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = sim.current;
      const station = STATIONS.find((st) => st.id === s.stationId) ?? STATIONS[2];

      if (s.gliding) {
        const k = 1 - Math.exp(-dt * 3.2);
        s.mg += (s.glideMg - s.mg) * k;
        s.hz += (s.glideHz - s.hz) * k;
        if (Math.abs(s.mg - s.glideMg) < 0.01 && Math.abs(s.hz - s.glideHz) < 0.02) {
          s.mg = s.glideMg;
          s.hz = s.glideHz;
          s.gliding = false;
        }
      }

      const advance = (s.running && !s.reduce) || s.snap !== null;
      if (advance) {
        if (s.snap) {
          s.snap.u += dt / 1.45;
          if (s.snap.u >= 1) s.snap = null;
        } else {
          s.time += dt;
        }
      }

      const wave = s.reduce && !s.snap
        ? { epsilon: 0.82, ox: s.amplitude * 0.78, left: 0.12, right: 0.95 }
        : s.snap
          ? waveSnap(s.snap.u, s.amplitude)
          : waveAt(s.time, s.hz, s.amplitude);

      const rising = s.prevEps < 0.62 && wave.epsilon >= 0.62;
      s.prevEps = wave.epsilon;
      if (rising) {
        s.particles.push(...burstFrom(wave.ox, Math.random));
        s.flash = 1;
      }
      s.flash = Math.max(0, s.flash - dt * 1.4);

      const spin = s.hz * s.time * Math.PI * 2;
      if (advance) stepParticles(s.particles, wave.ox, wave.epsilon, dt);

      const gate = matchOf(s.mg, s.hz, station);
      if (s.placed) {
        if (!gate.locked) {
          s.placed = false;
          s.charge = 0;
        }
      } else if (gate.locked && (s.running || s.reduce)) {
        s.charge = Math.min(1, s.charge + dt / HOLD_S);
        if (s.charge >= 1) s.placed = true;
      } else {
        s.charge = Math.max(0, s.charge - dt / 0.45);
      }

      const L = measure(canvas, host);
      layoutRef.current = L;
      drawScene(ctx, L, pal, {
        epsilon: wave.epsilon,
        ox: wave.ox,
        left: wave.left,
        right: wave.right,
        megagauss: s.mg,
        source: s.source,
        charge: s.source === "orbs" ? s.charge : 0,
        placed: s.placed,
        station,
        destAngle: s.destAngle,
        spin,
        particles: s.particles,
        flash: s.flash,
      });

      s.ui += dt;
      if (s.ui > 0.1) {
        s.ui = 0;
        const nextMg = s.mg;
        const nextHz = s.hz;
        setMg((v) => (Math.abs(v - nextMg) < 0.0008 ? v : nextMg));
        setHz((v) => (Math.abs(v - nextHz) < 0.0008 ? v : nextHz));
        setReadout({
          phase: phaseName(wave.epsilon),
          epsilon: wave.epsilon,
          ox: wave.ox,
          charge: s.charge,
          placed: s.placed,
          running: s.running,
        });
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    const obs = new ResizeObserver(() => {
      last = performance.now();
    });
    obs.observe(host);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, []);

  const station = STATIONS.find((st) => st.id === stationId) ?? STATIONS[2];
  const gate = matchOf(mg, hz, station);
  const bBand = mgBand(station);
  const fBand = hzBand(station);

  function nudgeStation(id: string) {
    dragRef.current = false;
    setStationId(id);
    const idx = STATIONS.findIndex((st) => st.id === id);
    if (idx >= 0) sim.current.destAngle = angleFromStation(idx);
  }

  function worldFromEvent(e: PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const dpr = (canvasRef.current?.width ?? rect.width) / Math.max(1, rect.width);
    const L = layoutRef.current;
    const sx = px * dpr;
    const sy = py * dpr;
    return [(sx - L.cx) / L.s, -(sy - L.cy) / L.s] as const;
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
      <div className="min-w-0">
        <div
          ref={hostRef}
          className="relative aspect-square w-full overflow-hidden rounded-lg border border-fr-rule bg-fr-ink"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full touch-pan-y"
            aria-hidden="true"
            onPointerDown={(e) => {
              if (sim.current.source !== "orbs") return;
              const [x, y] = worldFromEvent(e);
              const fx = Math.cos(sim.current.destAngle) * 1.28;
              const fy = Math.sin(sim.current.destAngle) * 1.28;
              if ((x - fx) ** 2 + (y - fy) ** 2 > 0.09) return;
              dragRef.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!dragRef.current) return;
              const [x, y] = worldFromEvent(e);
              const ang = Math.atan2(y, x);
              sim.current.destAngle = ang;
              const idx = stationIndexFromAngle(ang);
              const id = STATIONS[idx]?.id;
              if (id && id !== sim.current.stationId) {
                sim.current.stationId = id;
                setStationId(id);
              }
            }}
            onPointerUp={() => {
              dragRef.current = false;
            }}
            onPointerCancel={() => {
              dragRef.current = false;
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <span className="rounded-md border border-fr-rule bg-fr-ink/80 px-2 py-1 font-mono text-xs tracking-wide text-fr-snap">
              {readout.placed ? "Relocated" : readout.phase}
            </span>
            <span className="rounded-md border border-fr-rule bg-fr-ink/80 px-2 py-1 text-right font-mono text-xs text-fr-mute tabular-nums">
              ε {readout.epsilon.toFixed(2)}
              <span className="mx-1 text-fr-rule">·</span>
              x<sub>n</sub> {readout.ox.toFixed(2)}
            </span>
          </div>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-fr-mute">
          <li className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-fr-copper" /> Inflow B
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-fr-snap" /> Reconnected
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-px w-3 border-t border-dashed border-fr-paper" /> Slow shock
          </li>
          <li>X · merge site</li>
        </ul>
        <p className="sr-only" aria-live="polite">
          {readout.placed
            ? `Relocated to ${station.name}. No trajectory.`
            : `${readout.phase}. Resonance hold ${Math.round(readout.charge * 100)} percent.`}
        </p>
      </div>

      <aside className="flex flex-col gap-4 rounded-lg border border-fr-rule bg-fr-panel p-4">
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-fr-copper px-3 text-sm font-medium text-fr-ink"
            onClick={() => {
              sim.current.running = !sim.current.running;
              sim.current.reduce = false;
              setReadout((r) => ({ ...r, running: sim.current.running }));
            }}
          >
            {readout.running ? <Pause className="size-4" /> : <Play className="size-4" />}
            {readout.running ? "Pause" : "Run"}
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-fr-rule bg-fr-panel2 px-3 text-sm text-fr-paper"
            onClick={() => {
              sim.current.snap = { u: 0 };
              sim.current.reduce = false;
            }}
          >
            <SkipForward className="size-4" />
            One snap
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSource("lasers")}
            className={
              "min-h-11 rounded-md border px-2 text-sm " +
              (source === "lasers" ? "border-fr-copper bg-fr-copper text-fr-ink" : "border-fr-rule text-fr-mute")
            }
          >
            Laser sets
          </button>
          <button
            type="button"
            onClick={() => setSource("orbs")}
            className={
              "min-h-11 rounded-md border px-2 text-sm " +
              (source === "orbs" ? "border-fr-copper bg-fr-copper text-fr-ink" : "border-fr-rule text-fr-mute")
            }
          >
            Orbs
          </button>
        </div>
        <p className="text-sm text-fr-mute">
          {source === "lasers"
            ? "Holt’s Figure 3. Adjacent laser sets pulse in turn, and the merge walks from side to side."
            : "Forbes’s reading. Three generators orbit instead of the laser pulse. Drag the outer 4 — it picks the harmonic. They draw in only while the hold charges. That collapse is not in the 1979 paper."}
        </p>

        <div className="flex gap-2">
          {readout.placed ? (
            <button
              type="button"
              className="min-h-11 flex-1 rounded-md border border-fr-rule px-3 text-sm text-fr-paper"
              onClick={() => {
                sim.current.placed = false;
                sim.current.charge = 0;
                sim.current.gliding = false;
                setMg((v) => v * 0.72);
              }}
            >
              Release lock
            </button>
          ) : (
            <button
              type="button"
              className="min-h-11 flex-1 rounded-md border border-fr-copper px-3 text-sm text-fr-copper"
              onClick={() => {
                sim.current.gliding = true;
                sim.current.glideMg = station.megagauss;
                sim.current.glideHz = station.hertz;
                sim.current.running = true;
                sim.current.reduce = false;
              }}
            >
              Set this harmonic
            </button>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-fr-paper">Harmonic</h2>
            <span className="font-mono text-xs text-fr-mute">{station.kicker}</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {STATIONS.map((st) => {
              const on = st.id === stationId;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => nudgeStation(st.id)}
                  className={
                    "flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 text-left " +
                    (on
                      ? "border-fr-copper bg-fr-panel2 text-fr-paper"
                      : "border-fr-rule bg-fr-ink text-fr-mute")
                  }
                >
                  <span className="text-sm">{st.name}</span>
                  <span className="font-mono text-xs tabular-nums text-fr-mute">
                    {formatField(st.megagauss)} · {st.hertz.toFixed(2)} Hz
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-fr-mute">{station.line}</p>
        </div>

        <Dial
          label="Megagauss"
          value={formatField(mg)}
          hint={formatGauss(mg)}
          pos={mgToPos(mg)}
          band={bBand}
          matched={gate.bOk}
          onPos={(t) => {
            sim.current.gliding = false;
            setMg(posToMg(t));
          }}
        />
        <Dial
          label="Pulse"
          value={`${hz.toFixed(2)} Hz`}
          hint="Schematic rate, not a laser rep-rate"
          pos={hzToPos(hz)}
          band={fBand}
          matched={gate.fOk}
          onPos={(t) => {
            sim.current.gliding = false;
            setHz(posToHz(t));
          }}
        />
        <Dial
          label="Walk"
          value={amplitude.toFixed(2)}
          hint="How far the merge site travels"
          pos={amplitude}
          matched={false}
          onPos={(t) => setAmplitude(t)}
        />

        <div>
          <div className="mb-2 flex items-center justify-between font-mono text-xs text-fr-mute">
            <span>Resonance hold</span>
            <span className="tabular-nums">{Math.round(readout.charge * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-fr-ink">
            <div
              className="h-full bg-fr-snap"
              style={{ width: `${Math.round(readout.charge * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-fr-mute">
            {gate.locked
              ? "Both locks are in the band. Hold it and Holt’s step fires — the craft does not move across the picture."
              : "Put megagauss and pulse inside the marks. The band is that station’s harmonic."}
          </p>
        </div>
      </aside>
    </div>
  );
}

function Dial({
  label,
  value,
  hint,
  pos,
  band,
  matched,
  onPos,
}: {
  label: string;
  value: string;
  hint: string;
  pos: number;
  band?: { lo: number; hi: number };
  matched: boolean;
  onPos: (t: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-fr-paper">{label}</span>
        <span className={"font-mono text-sm tabular-nums " + (matched ? "text-fr-snap" : "text-fr-copper")}>
          {value}
        </span>
      </span>
      <span className="relative mt-1 block h-11">
        <span className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-fr-rule" />
        {band && (
          <span
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-fr-snap/30"
            style={{
              left: `${band.lo * 100}%`,
              width: `${Math.max(1.5, (band.hi - band.lo) * 100)}%`,
            }}
          />
        )}
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(pos * 1000)}
          aria-valuetext={value}
          onChange={(e) => onPos(Number(e.target.value) / 1000)}
          className="absolute inset-0"
        />
      </span>
      <span className="block text-xs text-fr-mute">{hint}</span>
    </label>
  );
}

function stepParticles(particles: Particle[], ox: number, epsilon: number, dt: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt * 0.8;
    if (p.life <= 0 || p.x * p.x + p.y * p.y > 2.2) particles.splice(i, 1);
  }
  void ox;
  void epsilon;
}
