import { useRef, useEffect, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────

type Vec3 = [number, number, number];
type Quat = [number, number, number, number]; // [x, y, z, w]

// ── Quaternion math (no external lib) ─────────────────────

function quatNorm(q: Quat): Quat {
  const [x, y, z, w] = q;
  const len = Math.sqrt(x * x + y * y + z * z + w * w);
  if (len < 1e-10) return [0, 0, 0, 1];
  return [x / len, y / len, z / len, w / len];
}

// Quaternion product (Hamilton product)
function quatMul(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw*bx + ax*bw + ay*bz - az*by,
    aw*by - ax*bz + ay*bw + az*bx,
    aw*bz + ax*by - ay*bx + az*bw,
    aw*bw - ax*bx - ay*by - az*bz,
  ];
}

// Rodrigues' rotation formula — fastest sandwich product
function quatRotate(v: Vec3, q: Quat): Vec3 {
  const [qx, qy, qz, qw] = q;
  const [vx, vy, vz] = v;
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  return [
    vx + qw * tx + qy * tz - qz * ty,
    vy + qw * ty + qz * tx - qx * tz,
    vz + qw * tz + qx * ty - qy * tx,
  ];
}

// ── Geometry ───────────────────────────────────────────────

const CUBE_VERTS: Vec3[] = [
  [-1, -1, -1], [ 1, -1, -1], [ 1,  1, -1], [-1,  1, -1],
  [-1, -1,  1], [ 1, -1,  1], [ 1,  1,  1], [-1,  1,  1],
];
const CUBE_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

// ── Projection ─────────────────────────────────────────────

function perspProject(
  v: Vec3, cx: number, cy: number, fov: number, dist: number
): [number, number, number] {
  const z = v[2] + dist;
  const s = z > 0.01 ? fov / z : fov;
  return [cx + v[0] * s, cy - v[1] * s, v[2]];
}

// ── Canvas draw ────────────────────────────────────────────

function drawScene(
  canvas: HTMLCanvasElement,
  q: Quat,
  axis: Vec3,
  scalePx: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const dpr = window.devicePixelRatio || 1;
  const fov = H * 0.82;
  const dist = 5.5;

  // Clear
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#05060c";
  ctx.fillRect(0, 0, W, H);

  // Fine technical grid (matches atlas-hero background)
  ctx.strokeStyle = "rgba(255,255,255,0.016)";
  ctx.lineWidth = 0.5 * dpr;
  const gridStep = 40 * dpr;
  for (let x = 0; x < W; x += gridStep) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += gridStep) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const sc = scalePx * dpr;

  // ── Ghost sphere (world-space reference, not rotated) ─────
  const ghostR = sc * 1.55;
  // Ambient glow behind sphere
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, ghostR);
  grd.addColorStop(0,    "rgba(34,211,238,0.045)");
  grd.addColorStop(0.55, "rgba(34,211,238,0.018)");
  grd.addColorStop(1,    "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // Latitude ellipses (flat ovals — world-space reference frame)
  for (const t of [-0.64, -0.38, 0, 0.38, 0.64]) {
    const latR  = Math.sqrt(Math.max(0, 1 - t * t)) * ghostR;
    const latY  = cy + t * ghostR;
    ctx.strokeStyle = t === 0 ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.028)";
    ctx.lineWidth   = 0.4 * dpr;
    ctx.beginPath();
    ctx.ellipse(cx, latY, latR, latR * 0.19, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Center meridian (vertical dashed)
  ctx.strokeStyle = "rgba(255,255,255,0.055)";
  ctx.lineWidth   = 0.45 * dpr;
  ctx.setLineDash([3 * dpr, 4 * dpr]);
  ctx.beginPath();
  ctx.moveTo(cx, cy - ghostR);
  ctx.lineTo(cx, cy + ghostR);
  ctx.stroke();
  ctx.setLineDash([]);

  // Sphere boundary circle
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth   = 0.8 * dpr;
  ctx.beginPath();
  ctx.arc(cx, cy, ghostR, 0, Math.PI * 2);
  ctx.stroke();

  // ── Cube ─────────────────────────────────────────────────
  const rotVerts = CUBE_VERTS.map(v => {
    const r = quatRotate(v, q);
    return [r[0] * sc, r[1] * sc, r[2] * sc] as Vec3;
  });
  const proj = rotVerts.map(v => perspProject(v, cx, cy, fov, dist));

  // Sort edges back-to-front
  const sortedEdges = [...CUBE_EDGES].sort((a, b) => {
    const za = (proj[a[0]][2] + proj[a[1]][2]) / 2;
    const zb = (proj[b[0]][2] + proj[b[1]][2]) / 2;
    return za - zb;
  });

  // Draw edges with depth-based color shift (front=cyan, back=violet)
  for (const [a, b] of sortedEdges) {
    const [ax, ay, az] = proj[a];
    const [bx, by, bz] = proj[b];
    const avgZ = (az + bz) / 2;
    const t = Math.max(0, Math.min(1, (avgZ + sc) / (2 * sc)));
    // Front face: bright cyan; rear: muted violet-tinted
    const r = Math.round(34  + (1 - t) * 90);
    const g = Math.round(211 * t + 100 * (1 - t));
    const bl = Math.round(238 * t + 180 * (1 - t));
    const alpha = (0.18 + t * 0.70).toFixed(2);
    ctx.strokeStyle = `rgba(${r},${g},${bl},${alpha})`;
    ctx.lineWidth = (0.9 + t * 0.7) * dpr;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  // Vertices with depth-based sizing
  for (const [px, py, pz] of proj) {
    const t = Math.max(0, Math.min(1, (pz + sc) / (2 * sc)));
    const alpha = (0.4 + t * 0.55).toFixed(2);
    ctx.fillStyle = `rgba(34,211,238,${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, (1.8 + t * 1.4) * dpr, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Rotation axis arrow (amber dashed) ───────────────────
  const [ax, ay, az] = axis;
  const arrowLen = ghostR * 1.05;
  const tailLen  = ghostR * 0.22;
  const arrowEnd   = perspProject([ax * arrowLen, ay * arrowLen, az * arrowLen], cx, cy, fov, dist);
  const arrowStart = perspProject([-ax * tailLen, -ay * tailLen, -az * tailLen], cx, cy, fov, dist);

  ctx.strokeStyle = "rgba(251,191,36,0.85)";
  ctx.lineWidth   = 1.5 * dpr;
  ctx.setLineDash([5 * dpr, 4 * dpr]);
  ctx.beginPath();
  ctx.moveTo(arrowStart[0], arrowStart[1]);
  ctx.lineTo(arrowEnd[0],   arrowEnd[1]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrowhead
  const dx  = arrowEnd[0] - arrowStart[0];
  const dy  = arrowEnd[1] - arrowStart[1];
  const d2  = Math.sqrt(dx * dx + dy * dy);
  if (d2 > 8 * dpr) {
    const ux  = dx / d2;
    const uy  = dy / d2;
    const ahl = 11 * dpr;
    const ahw = 5 * dpr;
    ctx.fillStyle = "rgba(251,191,36,0.85)";
    ctx.beginPath();
    ctx.moveTo(arrowEnd[0], arrowEnd[1]);
    ctx.lineTo(arrowEnd[0] - ahl * ux + ahw * (-uy), arrowEnd[1] - ahl * uy + ahw * ux);
    ctx.lineTo(arrowEnd[0] - ahl * ux - ahw * (-uy), arrowEnd[1] - ahl * uy - ahw * ux);
    ctx.closePath();
    ctx.fill();
  }

  // Axis tail dot
  ctx.fillStyle = "rgba(251,191,36,0.55)";
  ctx.beginPath();
  ctx.arc(arrowStart[0], arrowStart[1], 2.5 * dpr, 0, Math.PI * 2);
  ctx.fill();

  // ── Diagnostic frame ──────────────────────────────────────
  const m  = 14 * dpr;
  const ml = 10 * dpr;
  ctx.strokeStyle = "rgba(34,211,238,0.32)";
  ctx.lineWidth   = 0.8 * dpr;
  ctx.beginPath();
  ctx.moveTo(m, m + ml); ctx.lineTo(m, m); ctx.lineTo(m + ml, m);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W - m, H - m - ml); ctx.lineTo(W - m, H - m); ctx.lineTo(W - m - ml, H - m);
  ctx.stroke();
  ctx.strokeStyle = "rgba(251,191,36,0.22)";
  ctx.beginPath();
  ctx.moveTo(m, H - m - ml); ctx.lineTo(m, H - m); ctx.lineTo(m + ml, H - m);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W - m, m + ml); ctx.lineTo(W - m, m); ctx.lineTo(W - m - ml, m);
  ctx.stroke();

  // Label: top-center
  ctx.fillStyle  = "rgba(255,255,255,0.18)";
  ctx.font       = `${8 * dpr}px "JetBrains Mono",ui-monospace,monospace`;
  ctx.textAlign  = "center";
  ctx.letterSpacing = `${2 * dpr}px`;
  ctx.fillText("UNIT QUATERNION · ROTATION FIELD", cx, m + 10 * dpr);
  // Label: bottom-right (angle readout)
  ctx.textAlign  = "right";
  ctx.fillStyle  = "rgba(251,191,36,0.45)";
  ctx.fillText("AXIS · ANGLE ENCODING", W - m - 2, H - m - 4 * dpr);
  ctx.textAlign  = "left";
  ctx.letterSpacing = "0px";
}

// ── Slider ─────────────────────────────────────────────────

type SliderVariant = "x" | "y" | "z" | "w";

const VARIANT: Record<SliderVariant, { label: string; fill: string; thumb: string }> = {
  x: { label: "text-cyan-400",   fill: "bg-cyan-400/60",   thumb: "bg-cyan-400   q-thumb-x" },
  y: { label: "text-green-400",  fill: "bg-green-400/60",  thumb: "bg-green-400  q-thumb-y" },
  z: { label: "text-violet-400", fill: "bg-violet-400/60", thumb: "bg-violet-400 q-thumb-z" },
  w: { label: "text-amber-400",  fill: "bg-amber-400/60",  thumb: "bg-amber-400  q-thumb-w" },
};

interface SliderProps {
  label: string;
  value: number;
  variant: SliderVariant;
  onChange: (v: number) => void;
}

function QSlider({ label, value, variant, onChange }: SliderProps) {
  const pct = ((value + 1) / 2) * 100;
  const vc = VARIANT[variant];
  return (
    <div className="group flex items-center gap-3">
      <span className={`w-4 shrink-0 font-mono text-[10px] font-semibold uppercase ${vc.label}`}>
        {label}
      </span>
      <div className="relative flex-1 py-2">
        {/* Track */}
        <div className="h-0.5 w-full rounded-full bg-foreground/15" />
        {/* Fill — width set via ref callback so no inline style prop */}
        <div
          ref={el => { if (el) el.style.width = `${pct}%`; }}
          className={`pointer-events-none absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full ${vc.fill}`}
        />
        <input
          type="range"
          min={-1}
          max={1}
          step={0.001}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`Quaternion ${label} component`}
        />
        {/* Thumb — position set via ref callback */}
        <div
          ref={el => { if (el) el.style.left = `${pct}%`; }}
          className={`pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/25 ${vc.thumb}`}
        />
      </div>
      <span className="w-14 text-right font-mono text-[11px] tabular-nums text-foreground/75">
        {value >= 0 ? "+" : ""}{value.toFixed(3)}
      </span>
    </div>
  );
}

// ── Math readout ───────────────────────────────────────────

function fmt3(v: number) {
  return (v >= 0 ? "+" : "") + v.toFixed(3);
}

// ── Main component ─────────────────────────────────────────

export function QuaternionExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const spinRef = useRef(0);

  // Raw slider values — [x, y, z, w]
  const [raw, setRaw] = useState<Quat>([0, 1, 0, 1] as Quat); // nice 45° Y-axis default
  const rawRef = useRef<Quat>([0, 1, 0, 1] as Quat);

  // Auto-spin state
  const [autoSpin, setAutoSpin] = useState(true);
  const autoSpinRef = useRef(true);

  // Currently displayed (normalized) quaternion — updated from RAF
  const [displayQ, setDisplayQ] = useState<Quat>(quatNorm([0, 1, 0, 1]));
  const displayFrameRef = useRef(0);

  useEffect(() => { autoSpinRef.current = autoSpin; }, [autoSpin]);

  // When sliders change, pause auto-spin
  const setComponent = useCallback((idx: number, val: number) => {
    const next = [...rawRef.current] as Quat;
    next[idx] = val;
    rawRef.current = next;
    setRaw(next);
    if (autoSpinRef.current) {
      setAutoSpin(false);
      autoSpinRef.current = false;
    }
  }, []);

  const handleReset = useCallback(() => {
    const identity: Quat = [0, 0, 0, 1];
    rawRef.current = identity;
    setRaw(identity);
    spinRef.current = 0;
    setAutoSpin(true);
    autoSpinRef.current = true;
  }, []);

  // RAF loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // HiDPI sizing
    const dpr = window.devicePixelRatio || 1;
    function sizeCanvas() {
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
    }
    sizeCanvas();

    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(canvas);

    function frame() {
      let q: Quat;
      if (autoSpinRef.current) {
        spinRef.current += 0.007; // slow cinematic pan
        const a = spinRef.current;
        // Primary Y-axis pan (globe-like rotation)
        const yh = a / 2;
        const qY: Quat = [0, Math.sin(yh), 0, Math.cos(yh)];
        // Gentle X-axis tilt wobble (nod, period ~20s)
        const ph = Math.sin(a * 0.28) * 0.38 / 2;
        const qX: Quat = [Math.sin(ph), 0, 0, Math.cos(ph)];
        // Tiny Z roll for atmosphere
        const rh = Math.sin(a * 0.13) * 0.12 / 2;
        const qZ: Quat = [0, 0, Math.sin(rh), Math.cos(rh)];
        // Compose: Z → Y → X (applied right-to-left)
        q = quatNorm(quatMul(qX, quatMul(qY, qZ)));
      } else {
        q = quatNorm(rawRef.current);
      }

      // Derive axis
      const [qx, qy, qz, qw] = q;
      const sinHalf = Math.sqrt(qx * qx + qy * qy + qz * qz);
      const axLen = sinHalf < 1e-8 ? 1 : sinHalf;
      const axis: Vec3 = [qx / axLen, qy / axLen, qz / axLen];

      // Draw
      const scalePx = Math.min(canvas!.width, canvas!.height) / (window.devicePixelRatio || 1) * 0.26;
      drawScene(canvas!, q, axis, scalePx);

      // Throttle display-state updates to ~15fps to reduce re-renders
      displayFrameRef.current++;
      if (displayFrameRef.current % 4 === 0) {
        setDisplayQ(q);
        if (autoSpinRef.current) {
          rawRef.current = q;
          setRaw(q);
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []); // one-time setup; reads via refs

  // Derived display values
  const [qx, qy, qz, qw] = displayQ;
  const sinHalf = Math.sqrt(qx * qx + qy * qy + qz * qz);
  const axLen = sinHalf < 1e-8 ? 1 : sinHalf;
  const dispAxis: Vec3 = [qx / axLen, qy / axLen, qz / axLen];
  const angleDeg = (2 * Math.atan2(sinHalf, Math.abs(qw)) * (180 / Math.PI));

  return (
    <div className="flex flex-col gap-0 overflow-hidden border border-border/35 bg-card/20 lg:flex-row">

      {/* ── Canvas panel ─────────────────────────────── */}
      <div className="relative flex-1 min-h-[300px] sm:min-h-[380px] lg:min-h-[500px]">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          aria-label="Interactive quaternion rotation visualization — wireframe cube rotates according to slider values"
        />
        {/* Auto-spin indicator */}
        {autoSpin && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-sm border border-white/10 bg-black/40 px-2 py-1 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400/80" />
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/70">Live orbit</span>
          </div>
        )}
      </div>

      {/* ── Control panel ────────────────────────────── */}
      <div className="flex w-full flex-col gap-5 border-t border-border/30 bg-secondary/30 p-5 lg:w-80 lg:border-l lg:border-t-0">

        {/* Header */}
        <div>
          <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/50">
            SYS // Q4 · Transport Field Explorer
          </div>
          <h3 className="text-base font-semibold tracking-tight">Quaternion Rotation</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground/60">
            Drag sliders to define a unit quaternion. The amber arrow shows the rotation axis; the cyan wireframe shows the resulting 3D orientation.
          </p>
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-3.5">
          <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/65">
            Raw components (auto-normalized)
          </div>
          <QSlider label="x" value={raw[0]} variant="x" onChange={v => setComponent(0, v)} />
          <QSlider label="y" value={raw[1]} variant="y" onChange={v => setComponent(1, v)} />
          <QSlider label="z" value={raw[2]} variant="z" onChange={v => setComponent(2, v)} />
          <QSlider label="w" value={raw[3]} variant="w" onChange={v => setComponent(3, v)} />
        </div>

        {/* Math readout */}
        <div className="rounded-sm border border-border/30 bg-secondary/20 p-3.5">
          <div className="mb-2.5 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/65">
            Normalized q
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {(["w","x","y","z"] as const).map((k, i) => {
              const val = [qw, qx, qy, qz][i];
              const cls = ["text-amber-400","text-cyan-400","text-green-400","text-violet-400"][i];
              return (
                <div key={k} className="flex items-baseline gap-1.5">
                  <span className={`font-mono text-[9px] font-semibold ${cls}`}>{k}</span>
                  <span className="font-mono text-[11px] tabular-nums text-foreground/80">{fmt3(val)}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 border-t border-border/20 pt-3">
            <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/65">
              Rotation axis
            </div>
            <div className="font-mono text-[10px] tabular-nums text-foreground/70">
              ({fmt3(dispAxis[0])},&nbsp;{fmt3(dispAxis[1])},&nbsp;{fmt3(dispAxis[2])})
            </div>
          </div>

          <div className="mt-3 border-t border-border/20 pt-3">
            <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/65">
              Rotation angle
            </div>
            <div className="font-mono text-xl tabular-nums text-foreground/90">
              {angleDeg.toFixed(1)}<span className="ml-0.5 text-sm text-muted-foreground/50">°</span>
            </div>
          </div>
        </div>

        {/* Formula note */}
        <div className="rounded-sm border border-amber-500/15 bg-amber-950/15 px-3 py-2.5">
          <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/50">Formula</div>
          <div className="font-mono text-[10px] leading-relaxed text-muted-foreground/60">
            q = cos(θ/2) +<br />
            sin(θ/2)·(x<span className="text-cyan-400/70">i</span> + y<span className="text-green-400/70">j</span> + z<span className="text-violet-400/70">k</span>)
          </div>
          <p className="mt-1.5 text-[9px] leading-relaxed text-muted-foreground/65">
            Every 3D rotation maps to exactly two unit quaternions: q and −q.
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !autoSpin;
              setAutoSpin(next);
              autoSpinRef.current = next;
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-border/40 bg-secondary/30 px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary/50"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${autoSpin ? "bg-amber-400 animate-pulse" : "bg-muted-foreground/40"}`}
            />
            {autoSpin ? "Pause orbit" : "Auto-orbit"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-sm border border-border/30 bg-secondary/20 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
