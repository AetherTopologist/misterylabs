import { useRef, useEffect, useState, useCallback } from "react";

// ── Face palette ───────────────────────────────────────────

const FACE_COLORS = [
  { fill: "rgba(34,211,238,0.82)",  stroke: "rgba(34,211,238,1)",   name: "Front",  tailwind: "bg-cyan-400",   text: "text-cyan-400"   },
  { fill: "rgba(167,139,250,0.82)", stroke: "rgba(167,139,250,1)",  name: "Back",   tailwind: "bg-violet-400", text: "text-violet-400" },
  { fill: "rgba(251,191,36,0.82)",  stroke: "rgba(251,191,36,1)",   name: "Top",    tailwind: "bg-amber-400",  text: "text-amber-400"  },
  { fill: "rgba(99,102,241,0.82)",  stroke: "rgba(99,102,241,1)",   name: "Bottom", tailwind: "bg-indigo-500", text: "text-indigo-400" },
  { fill: "rgba(74,222,128,0.82)",  stroke: "rgba(74,222,128,1)",   name: "Right",  tailwind: "bg-green-400",  text: "text-green-400"  },
  { fill: "rgba(251,113,133,0.82)", stroke: "rgba(251,113,133,1)",  name: "Left",   tailwind: "bg-rose-400",   text: "text-rose-400"   },
];

// ── Cube geometry ──────────────────────────────────────────

// 8 vertices: (±1, ±1, ±1)
const VERTS: [number,number,number][] = [
  [-1,-1, 1], [ 1,-1, 1], [ 1, 1, 1], [-1, 1, 1], // front quad
  [-1,-1,-1], [ 1,-1,-1], [ 1, 1,-1], [-1, 1,-1], // back quad
];

// 6 faces: [v0,v1,v2,v3, faceId]
const FACES: [number,number,number,number,number][] = [
  [0,1,2,3, 0], // Front  (z=+1)  → cyan
  [5,4,7,6, 1], // Back   (z=-1)  → violet
  [3,2,6,7, 2], // Top    (y=+1)  → amber
  [4,5,1,0, 3], // Bottom (y=-1)  → indigo
  [1,5,6,2, 4], // Right  (x=+1)  → green
  [4,0,3,7, 5], // Left   (x=-1)  → rose
];

// ── All 11 cube nets ───────────────────────────────────────
// Each net: 6 cells as [col, row], in face-order 0-5

type NetCell = [number, number]; // [col, row]

const NETS: NetCell[][] = [
  // 1 — Classic cross
  [[1,0],[1,3],[1,1],[1,2],[0,1],[2,1]],
  // 2 — Cross, left arm extends downward
  [[1,0],[0,3],[1,1],[0,2],[0,1],[2,1]],
  // 3 — Cross, right arm extends downward
  [[1,0],[2,3],[1,1],[2,2],[0,1],[2,1]],
  // 4 — 4-in-a-row, single arm pair at positions 1 (down ×2)
  [[1,0],[3,0],[0,0],[2,0],[1,1],[1,2]],
  // 5 — 4-in-a-row, arm pair at position 2
  [[1,0],[3,0],[0,0],[2,0],[2,1],[2,2]],
  // 6 — 4-in-a-row, arms at 1 and 3 (separated)
  [[1,0],[3,0],[0,0],[2,0],[1,1],[3,1]],
  // 7 — 4-in-a-row, arms at 0 and 2
  [[1,0],[3,0],[0,0],[2,0],[0,1],[2,1]],
  // 8 — 4-in-a-row, arms at 1 and 2 (adjacent)
  [[1,0],[3,0],[0,0],[2,0],[1,1],[2,1]],
  // 9 — 4-in-a-row, arms at 0 and 1 (adjacent, other side)
  [[1,0],[3,0],[0,0],[2,0],[0,1],[1,1]],
  // 10 — S-stair: 2+2+2 diagonal
  [[0,0],[3,2],[1,0],[2,2],[1,1],[2,1]],
  // 11 — Z-stair: reversed
  [[2,0],[0,2],[3,0],[1,2],[2,1],[1,1]],
];

const NET_LABELS = [
  "Classic Cross","L-Cross","J-Cross","Row + Tail A","Row + Tail B",
  "Row Skip 1-3","Row Skip 0-2","Row Adjacent 1-2","Row Adjacent 0-1",
  "S-Staircase","Z-Staircase",
];

// ── Quaternion helpers (minimal) ───────────────────────────

type Quat = [number,number,number,number];

function qMul(a: Quat, b: Quat): Quat {
  const [ax,ay,az,aw] = a, [bx,by,bz,bw] = b;
  return [
    aw*bx+ax*bw+ay*bz-az*by,
    aw*by-ax*bz+ay*bw+az*bx,
    aw*bz+ax*by-ay*bx+az*bw,
    aw*bw-ax*bx-ay*by-az*bz,
  ];
}

function qRot(v: [number,number,number], q: Quat): [number,number,number] {
  const [qx,qy,qz,qw] = q, [vx,vy,vz] = v;
  const tx=2*(qy*vz-qz*vy), ty=2*(qz*vx-qx*vz), tz=2*(qx*vy-qy*vx);
  return [vx+qw*tx+qy*tz-qz*ty, vy+qw*ty+qz*tx-qx*tz, vz+qw*tz+qx*ty-qy*tx];
}

// ── Canvas draw ────────────────────────────────────────────

function drawCube(
  canvas: HTMLCanvasElement,
  q: Quat,
  hovered: number | null,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2;
  const dpr = window.devicePixelRatio || 1;
  const fov = H * 0.76, dist = 4.8;
  const sc = Math.min(W, H) * 0.24;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#05060c";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.016)";
  ctx.lineWidth = 0.5 * dpr;
  const gs = 40 * dpr;
  for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // Transform verts
  function proj(v: [number,number,number]): [number,number,number] {
    const [rx,ry,rz] = qRot([v[0]*sc/dpr, v[1]*sc/dpr, v[2]*sc/dpr], q);
    const z = rz * dpr + dist * sc;
    const s = z > 0.01 ? fov / z : fov;
    return [cx + rx*dpr*s, cy - ry*dpr*s, rz];
  }
  const pv = VERTS.map(v => proj(v));

  // Sort faces by avg depth
  const sorted = FACES.map(([a,b,c,d,fi]) => {
    const z = (pv[a][2]+pv[b][2]+pv[c][2]+pv[d][2])/4;
    return { a,b,c,d,fi, z };
  }).sort((x,y) => x.z - y.z);

  // Draw faces
  for (const { a,b,c,d,fi } of sorted) {
    const fc = FACE_COLORS[fi];
    const isHovered = hovered === fi;

    ctx.beginPath();
    ctx.moveTo(pv[a][0], pv[a][1]);
    ctx.lineTo(pv[b][0], pv[b][1]);
    ctx.lineTo(pv[c][0], pv[c][1]);
    ctx.lineTo(pv[d][0], pv[d][1]);
    ctx.closePath();

    const alpha = isHovered ? "0.92" : "0.52";
    ctx.fillStyle = fc.fill.replace("0.82", alpha);
    ctx.fill();

    ctx.strokeStyle = isHovered ? fc.stroke : fc.stroke.replace("1)", "0.75)");
    ctx.lineWidth   = isHovered ? 2 * dpr : 0.9 * dpr;
    ctx.stroke();

    if (isHovered) {
      ctx.shadowColor = fc.stroke;
      ctx.shadowBlur  = 18 * dpr;
      ctx.stroke();
      ctx.shadowBlur  = 0;
    }
  }

  // Diagnostic corners
  const m = 14*dpr, ml = 10*dpr;
  ctx.strokeStyle = "rgba(34,211,238,0.32)"; ctx.lineWidth = 0.8*dpr;
  ctx.beginPath(); ctx.moveTo(m,m+ml); ctx.lineTo(m,m); ctx.lineTo(m+ml,m); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W-m,H-m-ml); ctx.lineTo(W-m,H-m); ctx.lineTo(W-m-ml,H-m); ctx.stroke();
  ctx.strokeStyle = "rgba(251,191,36,0.22)";
  ctx.beginPath(); ctx.moveTo(m,H-m-ml); ctx.lineTo(m,H-m); ctx.lineTo(m+ml,H-m); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W-m,m+ml); ctx.lineTo(W-m,m); ctx.lineTo(W-m-ml,m); ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.font = `${8*dpr}px "JetBrains Mono",ui-monospace,monospace`;
  ctx.textAlign = "center"; ctx.letterSpacing = `${2*dpr}px`;
  ctx.fillText("CUBE · 6 FACES · 3D VIEW", cx, m + 10*dpr);
  ctx.textAlign = "left"; ctx.letterSpacing = "0px";
}

// ── Component ──────────────────────────────────────────────

export function CubeNetExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const spinRef   = useRef(0);
  const qRef      = useRef<Quat>([0,0,0,1]);

  const [netIdx,   setNetIdx]   = useState(0);
  const [hovered,  setHovered]  = useState<number | null>(null);
  const [autoSpin, setAutoSpin] = useState(true);

  const autoRef    = useRef(true);
  const hoveredRef = useRef<number | null>(null);
  useEffect(() => { autoRef.current    = autoSpin; }, [autoSpin]);
  useEffect(() => { hoveredRef.current = hovered;  }, [hovered]);

  const handleCellHover = useCallback((fi: number | null) => setHovered(fi), []);

  // RAF
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
      if (autoRef.current) {
        spinRef.current += 0.007;
        const a = spinRef.current;
        const yh = a/2;
        const qY: Quat = [0, Math.sin(yh), 0, Math.cos(yh)];
        const ph = Math.sin(a*0.31)*0.4/2;
        const qX: Quat = [Math.sin(ph), 0, 0, Math.cos(ph)];
        qRef.current = qMul(qX, qY);
      }
      drawCube(canvas!, qRef.current, hoveredRef.current);
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  const net = NETS[netIdx];

  // Normalize net bounds for display
  const minCol = Math.min(...net.map(c => c[0]));
  const minRow = Math.min(...net.map(c => c[1]));
  const maxCol = Math.max(...net.map(c => c[0])) - minCol;
  const maxRow = Math.max(...net.map(c => c[1])) - minRow;
  const CELL = 40; // px per cell
  const gridW = (maxCol + 1) * CELL;
  const gridH = (maxRow + 1) * CELL;

  return (
    <div className="flex flex-col overflow-hidden border border-border/35 bg-black/30 lg:flex-row">

      {/* 2D net panel */}
      <div className="flex flex-col gap-4 border-b border-border/30 bg-black/20 p-5 lg:w-72 lg:border-b-0 lg:border-r">
        <div>
          <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/45">
            SYS // OBS-CN · Cube Nets
          </div>
          <h3 className="text-base font-semibold tracking-tight">2D Net Explorer</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/55">
            All 11 distinct nets that fold into a cube. Hover a colored square to
            highlight the matching face in the 3D view.
          </p>
        </div>

        {/* Net display — SVG (no inline style props) */}
        <div
          className="flex items-center justify-center rounded-sm border border-border/25 bg-secondary/10 p-4"
          aria-label={`Cube net ${netIdx + 1}: ${NET_LABELS[netIdx]}`}
        >
          <svg
            width={gridW}
            height={gridH}
            viewBox={`0 0 ${gridW} ${gridH}`}
            role="img"
            aria-label="Cube net grid"
          >
            {net.map(([col, row], fi) => {
              const nc = FACE_COLORS[fi];
              const x = (col - minCol) * CELL;
              const y = (row - minRow) * CELL;
              const isActive = hovered === fi;
              return (
                <g
                  key={fi}
                  onMouseEnter={() => handleCellHover(fi)}
                  onMouseLeave={() => handleCellHover(null)}
                  onClick={() => setAutoSpin(false)}
                  className="cursor-pointer"
                  aria-label={nc.name}
                >
                  <rect
                    x={x + 1} y={y + 1}
                    width={CELL - 3} height={CELL - 3}
                    rx={4}
                    fill={nc.fill}
                    stroke={nc.stroke}
                    strokeWidth={isActive ? 2 : 0.9}
                    opacity={isActive ? 1 : 0.72}
                  />
                  {isActive && (
                    <rect
                      x={x + 1} y={y + 1}
                      width={CELL - 3} height={CELL - 3}
                      rx={4}
                      fill="none"
                      stroke={nc.stroke}
                      strokeWidth={6}
                      opacity={0.25}
                    />
                  )}
                  <text
                    x={x + CELL / 2} y={y + CELL / 2 + 4}
                    textAnchor="middle"
                    fontSize={9}
                    fontFamily="JetBrains Mono, ui-monospace, monospace"
                    fontWeight={700}
                    fill="rgba(0,0,0,0.72)"
                    pointerEvents="none"
                  >
                    {nc.name.slice(0, 2).toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Net label */}
        <div className="text-center">
          <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/35">
            Net {netIdx + 1} of 11
          </div>
          <div className="mt-0.5 text-xs font-medium text-foreground/70">{NET_LABELS[netIdx]}</div>
        </div>

        {/* Net selector */}
        <div className="grid grid-cols-6 gap-1">
          {NETS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setNetIdx(i)}
              className={`rounded-sm border py-1.5 font-mono text-[9px] font-semibold transition-colors ${
                i === netIdx
                  ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-300"
                  : "border-border/25 bg-secondary/15 text-muted-foreground/50 hover:border-border/45 hover:text-foreground/60"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Face legend */}
        <div className="rounded-sm border border-border/25 bg-secondary/15 p-3">
          <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/35">
            Face key
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {FACE_COLORS.map((fc, i) => (
              <div
                key={i}
                className={`flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 transition-colors ${hovered === i ? "bg-white/5" : ""}`}
                onMouseEnter={() => handleCellHover(i)}
                onMouseLeave={() => handleCellHover(null)}
              >
                <span className={`cn-face-${i} h-2.5 w-2.5 shrink-0 rounded-sm`} />
                <span className="font-mono text-[9px] text-muted-foreground/60">{fc.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3D cube canvas */}
      <div className="relative min-h-[280px] flex-1 sm:min-h-[360px] lg:min-h-0">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          aria-label="Rotating 3D cube with six colored faces matching the net display"
        />
        {/* Spin toggle */}
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => setAutoSpin(a => !a)}
            className="flex items-center gap-1.5 rounded-sm border border-white/10 bg-black/50 px-2 py-1 backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${autoSpin ? "animate-pulse bg-cyan-400/80" : "bg-muted-foreground/40"}`} />
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-foreground/50">
              {autoSpin ? "Spinning" : "Paused"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
