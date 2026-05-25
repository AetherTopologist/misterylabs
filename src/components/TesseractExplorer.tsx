import { useRef, useEffect, useState } from "react";

// ── 4D geometry (precomputed) ──────────────────────────────

type Vec4 = [number, number, number, number];
type Vec3 = [number, number, number];

// 16 vertices: all (±1,±1,±1,±1) combinations
const T_VERTS: Vec4[] = Array.from({ length: 16 }, (_, i) => [
  i & 8 ? 1 : -1,
  i & 4 ? 1 : -1,
  i & 2 ? 1 : -1,
  i & 1 ? 1 : -1,
]);

type EdgeKind = "outer" | "inner" | "bridge";

// 32 edges: vertex pairs differing in exactly 1 coordinate
const T_EDGES: [number, number, EdgeKind][] = (() => {
  const edges: [number, number, EdgeKind][] = [];
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      let diff = 0;
      for (let k = 0; k < 4; k++) if (T_VERTS[i][k] !== T_VERTS[j][k]) diff++;
      if (diff === 1) {
        const wi = T_VERTS[i][3], wj = T_VERTS[j][3];
        const kind: EdgeKind = wi === 1 && wj === 1 ? "outer"
                             : wi === -1 && wj === -1 ? "inner"
                             : "bridge";
        edges.push([i, j, kind]);
      }
    }
  }
  return edges;
})();

// ── Math ───────────────────────────────────────────────────

function rot4D(v: Vec4, a: number, b: number, angle: number): Vec4 {
  const r = [...v] as Vec4;
  const c = Math.cos(angle), s = Math.sin(angle);
  r[a] = v[a] * c - v[b] * s;
  r[b] = v[a] * s + v[b] * c;
  return r;
}

function proj4to3(v: Vec4, d4: number): Vec3 {
  const w = d4 - v[3];
  const s = Math.abs(w) > 0.01 ? 1 / w : 50;
  return [v[0] * s, v[1] * s, v[2] * s];
}

function proj3to2(
  v: Vec3, d3: number, scale: number, cx: number, cy: number
): [number, number, number] {
  const z = d3 - v[2];
  const s = Math.abs(z) > 0.01 ? scale / z : scale * 50;
  return [cx + v[0] * s, cy - v[1] * s, v[2]];
}

// ── Canvas draw ────────────────────────────────────────────

function drawTesseract(
  canvas: HTMLCanvasElement,
  xw: number, yz: number, xy: number,
  usePerspective: boolean,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const dpr = window.devicePixelRatio || 1;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#05060c";
  ctx.fillRect(0, 0, W, H);

  // Technical grid
  ctx.strokeStyle = "rgba(255,255,255,0.016)";
  ctx.lineWidth = 0.5 * dpr;
  const gs = 40 * dpr;
  for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // Ghost sphere (orientation reference)
  const ghostR = Math.min(W, H) * 0.38;
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, ghostR);
  grd.addColorStop(0,    "rgba(139,92,246,0.05)");
  grd.addColorStop(0.6,  "rgba(139,92,246,0.02)");
  grd.addColorStop(1,    "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(139,92,246,0.08)";
  ctx.lineWidth = 0.7 * dpr;
  ctx.beginPath(); ctx.arc(cx, cy, ghostR, 0, Math.PI * 2); ctx.stroke();

  const sc = Math.min(W, H) * 0.26;
  const d4 = usePerspective ? 2.2 : 999;
  const d3 = 3.5;

  // Transform all 16 vertices
  const verts2D = T_VERTS.map(v => {
    let r = rot4D(v, 0, 3, xw);
    r     = rot4D(r, 1, 2, yz);
    r     = rot4D(r, 0, 1, xy);
    const v3 = proj4to3(r, d4);
    return proj3to2(v3, d3, sc, cx, cy);
  });

  // Sort edges back → front by average depth
  const sorted = T_EDGES.map(([a, b, kind]) => ({
    a, b, kind, depth: (verts2D[a][2] + verts2D[b][2]) / 2,
  })).sort((x, y) => x.depth - y.depth);

  // Draw edges
  for (const { a, b, kind, depth } of sorted) {
    const [ax, ay] = verts2D[a];
    const [bx, by] = verts2D[b];
    const t = Math.max(0, Math.min(1, (depth + sc) / (2 * sc)));
    const alpha = 0.20 + t * 0.68;

    if (kind === "outer") {
      ctx.strokeStyle = `rgba(34,211,238,${alpha.toFixed(2)})`;
    } else if (kind === "inner") {
      ctx.strokeStyle = `rgba(251,191,36,${alpha.toFixed(2)})`;
    } else {
      ctx.strokeStyle = `rgba(167,139,250,${alpha.toFixed(2)})`;
    }

    ctx.lineWidth = (0.7 + t * 0.7) * dpr;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  // Draw vertices
  for (let i = 0; i < 16; i++) {
    const [px, py, pz] = verts2D[i];
    const t = Math.max(0, Math.min(1, (pz + sc) / (2 * sc)));
    const isOuter = T_VERTS[i][3] === 1;
    const alpha = (0.45 + t * 0.5).toFixed(2);
    ctx.fillStyle = isOuter ? `rgba(34,211,238,${alpha})` : `rgba(251,191,36,${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, (1.6 + t * 1.5) * dpr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Diagnostic frame
  const m = 14 * dpr, ml = 10 * dpr;
  ctx.strokeStyle = "rgba(139,92,246,0.35)";
  ctx.lineWidth = 0.8 * dpr;
  ctx.beginPath(); ctx.moveTo(m,m+ml); ctx.lineTo(m,m); ctx.lineTo(m+ml,m); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W-m,H-m-ml); ctx.lineTo(W-m,H-m); ctx.lineTo(W-m-ml,H-m); ctx.stroke();
  ctx.strokeStyle = "rgba(251,191,36,0.22)";
  ctx.beginPath(); ctx.moveTo(m,H-m-ml); ctx.lineTo(m,H-m); ctx.lineTo(m+ml,H-m); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W-m,m+ml); ctx.lineTo(W-m,m); ctx.lineTo(W-m-ml,m); ctx.stroke();

  // Title
  ctx.fillStyle  = "rgba(255,255,255,0.18)";
  ctx.font       = `${8*dpr}px "JetBrains Mono",ui-monospace,monospace`;
  ctx.textAlign  = "center";
  ctx.letterSpacing = `${2*dpr}px`;
  ctx.fillText("TESSERACT · 4D → 3D → 2D", cx, m + 10 * dpr);
  ctx.textAlign  = "left";

  // Legend dots
  const ly = H - m - 4 * dpr;
  ctx.font = `${7.5*dpr}px "JetBrains Mono",ui-monospace,monospace`;
  ctx.letterSpacing = `${1.5*dpr}px`;
  const legend = [
    { col: "rgba(34,211,238,0.85)",  label: "W=+1" },
    { col: "rgba(251,191,36,0.85)",  label: "W=−1" },
    { col: "rgba(167,139,250,0.85)", label: "BRIDGE" },
  ];
  let lx = m + 2;
  for (const { col, label } of legend) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(lx + 3*dpr, ly - 3.5*dpr, 3*dpr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillText(label, lx + 9*dpr, ly);
    lx += (label.length * 5.8 + 18) * dpr;
  }
  ctx.letterSpacing = "0px";
}

// ── Component ──────────────────────────────────────────────

export function TesseractExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const anglesRef = useRef({ xw: 0, yz: 0.3, xy: 0 });

  const [running,    setRunning]    = useState(true);
  const [speed,      setSpeed]      = useState(1.0);
  const [persp,      setPersp]      = useState(true);

  const runRef  = useRef(true);
  const speedRef = useRef(1.0);
  const perspRef = useRef(true);

  useEffect(() => { runRef.current  = running;  }, [running]);
  useEffect(() => { speedRef.current = speed;   }, [speed]);
  useEffect(() => { perspRef.current = persp;   }, [persp]);

  // RAF loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    function resize() {
      const r = canvas!.getBoundingClientRect();
      canvas!.width  = r.width  * dpr;
      canvas!.height = r.height * dpr;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function frame() {
      if (runRef.current) {
        const s = speedRef.current;
        anglesRef.current.xw += 0.006 * s;
        anglesRef.current.yz += 0.004 * s;
        anglesRef.current.xy += 0.0018 * s;
      }
      const { xw, yz, xy } = anglesRef.current;
      drawTesseract(canvas!, xw, yz, xy, perspRef.current);
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  return (
    <div className="flex flex-col overflow-hidden border border-border/35 bg-black/30 lg:flex-row">

      {/* Canvas */}
      <div className="relative min-h-[300px] flex-1 sm:min-h-[380px] lg:min-h-[500px]">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          aria-label="4D tesseract projected onto 2D canvas — 32 edges in three color classes"
        />
        {running && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-sm border border-white/10 bg-black/50 px-2 py-1 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400/80" />
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-violet-400/70">
              4D rotating
            </span>
          </div>
        )}
      </div>

      {/* Control panel */}
      <div className="flex w-full flex-col gap-5 border-t border-border/30 bg-black/20 p-5 lg:w-72 lg:border-l lg:border-t-0">

        {/* Header */}
        <div>
          <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/45">
            SYS // OBS-T4 · 4D Hypercube
          </div>
          <h3 className="text-base font-semibold tracking-tight">Tesseract Projection</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/55">
            A tesseract (4D hypercube) projected through successive perspective
            transformations. Cyan edges form the outer cell (w=+1); amber edges form
            the inner cell (w=−1); violet edges are the 8 bridges connecting them.
          </p>
        </div>

        {/* Projection toggle */}
        <div>
          <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
            4D projection mode
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {([true, false] as const).map(p => (
              <button
                key={String(p)}
                type="button"
                onClick={() => setPersp(p)}
                className={`rounded-sm border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
                  persp === p
                    ? "border-violet-500/50 bg-violet-950/40 text-violet-300"
                    : "border-border/30 bg-secondary/20 text-muted-foreground/55 hover:border-border/50"
                }`}
              >
                {p ? "Perspective" : "Orthographic"}
              </button>
            ))}
          </div>
        </div>

        {/* Rotation planes */}
        <div className="rounded-sm border border-border/30 bg-secondary/20 p-3.5">
          <div className="mb-2.5 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
            Rotation planes
          </div>
          {[
            { plane: "XW", col: "text-cyan-400",   desc: "hyper-rotation" },
            { plane: "YZ", col: "text-amber-400",  desc: "spatial roll" },
            { plane: "XY", col: "text-violet-400", desc: "slow tumble" },
          ].map(({ plane, col, desc }) => (
            <div key={plane} className="mb-1.5 flex items-center gap-2">
              <span className={`w-7 font-mono text-[10px] font-semibold ${col}`}>{plane}</span>
              <div className="h-px flex-1 bg-border/20" />
              <span className="font-mono text-[9px] text-muted-foreground/40">{desc}</span>
            </div>
          ))}
        </div>

        {/* Speed slider */}
        <div>
          <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
            Rotation speed
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 py-2">
              <div className="h-0.5 w-full rounded-full bg-white/10" />
              <div
                ref={el => { if (el) el.style.width = `${((speed - 0.25) / 2.75) * 100}%`; }}
                className="pointer-events-none absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-violet-400/60"
              />
              <input
                type="range" min={0.25} max={3} step={0.05}
                value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Tesseract rotation speed"
              />
              <div
                ref={el => { if (el) el.style.left = `${((speed - 0.25) / 2.75) * 100}%`; }}
                className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-violet-400 q-thumb-z"
              />
            </div>
            <span className="w-10 text-right font-mono text-[11px] tabular-nums text-foreground/75">
              {speed.toFixed(2)}×
            </span>
          </div>
        </div>

        {/* Geometry info */}
        <div className="rounded-sm border border-violet-500/15 bg-violet-950/15 px-3.5 py-3">
          <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.2em] text-violet-400/50">
            Hypercube structure
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[
              ["Vertices", "16"],
              ["Edges",    "32"],
              ["Faces",    "24"],
              ["Cells",    "8" ],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="font-mono text-[9px] text-muted-foreground/45">{label}</span>
                <span className="font-mono text-[9px] font-semibold tabular-nums text-foreground/75">
                  {value}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground/38">
            A tesseract is to a cube what a cube is to a square — one dimension higher.
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { const n = !running; setRunning(n); runRef.current = n; }}
            className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-border/40 bg-secondary/30 px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary/50"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${running ? "animate-pulse bg-violet-400" : "bg-muted-foreground/40"}`} />
            {running ? "Pause" : "Resume"}
          </button>
          <button
            type="button"
            onClick={() => { anglesRef.current = { xw: 0, yz: 0.3, xy: 0 }; }}
            className="rounded-sm border border-border/30 bg-secondary/20 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
