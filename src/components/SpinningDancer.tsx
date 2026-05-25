import { useRef, useEffect, useState } from "react";

// ── 3D model ───────────────────────────────────────────────────────────────
// Arabesque pose. Y-up, origin at hips. Units are ~half body-height.

type V3 = [number, number, number];

const J: Record<string, V3> = {
  hipC:  [ 0.00,  0.00,  0.00],
  hipL:  [-0.13,  0.00,  0.00],
  hipR:  [ 0.13,  0.00,  0.00],
  spine: [ 0.00,  0.40,  0.00],
  chest: [ 0.00,  0.70,  0.00],
  neck:  [ 0.00,  0.90,  0.00],
  head:  [ 0.00,  1.14,  0.00],
  shdL:  [-0.24,  0.84,  0.00],
  shdR:  [ 0.24,  0.84,  0.00],
  elbL:  [-0.44,  0.66, -0.06],
  elbR:  [ 0.30,  1.20, -0.02],
  hndL:  [-0.56,  0.50, -0.11],
  hndR:  [ 0.24,  1.54, -0.04],
  kneeR: [ 0.14, -0.52,  0.00],
  footR: [ 0.14, -1.10,  0.00],
  kneeL: [-0.10,  0.08,  0.56],
  footL: [-0.12, -0.20,  1.20],
};

function rotY(v: V3, phi: number): V3 {
  const c = Math.cos(phi), s = Math.sin(phi);
  return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c];
}

// Orthographic project (no perspective — preserves ambiguity)
function proj(v: V3, sc: number, cx: number, cy: number): [number, number] {
  return [cx + v[0] * sc, cy - v[1] * sc];
}

// Capsule: thick rounded stroke between two 2D points
function capsule(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  r: number,
) {
  ctx.lineWidth = r * 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// ── Draw ───────────────────────────────────────────────────────────────────

function drawDancer(
  canvas: HTMLCanvasElement,
  phi: number,
  focusPct: number, // 0..1 — subtle highlight zone vertical position
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width, H = canvas.height;
  const cx = W / 2;
  const dpr = window.devicePixelRatio || 1;
  const sc = Math.min(W, H) * 0.30;
  // Dancer centre sits slightly above canvas centre (standing leg ~1.1 below hip)
  const cy = H * 0.52 + sc * 0.18;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#05060c";
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.016)";
  ctx.lineWidth = 0.5 * dpr;
  const gs = 40 * dpr;
  for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // ── Project all joints ────────────────────────────────────────────────────
  const p: Record<string, [number, number]> = {};
  for (const [k, v] of Object.entries(J)) {
    p[k] = proj(rotY(v, phi), sc, cx, cy);
  }

  // ── Ambient glow (back-lit silhouette effect) ─────────────────────────────
  const danCY = (p.neck[1] + p.footR[1]) / 2;
  const glowH = Math.abs(p.head[1] - p.footR[1]) * 0.65;

  const outer = ctx.createRadialGradient(cx, danCY, 0, cx, danCY, glowH * 1.9);
  outer.addColorStop(0,    "rgba(109,72,220,0.22)");
  outer.addColorStop(0.38, "rgba(80,120,230,0.12)");
  outer.addColorStop(0.72, "rgba(34,144,200,0.06)");
  outer.addColorStop(1,    "rgba(0,0,0,0)");
  ctx.fillStyle = outer;
  ctx.fillRect(0, 0, W, H);

  // Focus zone nudge — slightly brighter stripe where user is looking
  if (focusPct >= 0) {
    const fy = p.head[1] + (p.footR[1] - p.head[1]) * focusPct;
    const fz = ctx.createRadialGradient(cx, fy, 0, cx, fy, sc * 0.35);
    fz.addColorStop(0,   "rgba(180,220,255,0.07)");
    fz.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = fz;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Silhouette ────────────────────────────────────────────────────────────
  // All body segments drawn in background-black, blocking the glow → dark figure
  const SEG_COLOR = "#020307";
  ctx.strokeStyle = SEG_COLOR;
  ctx.lineJoin = "round";

  // Helpers
  const s = (a: string, b: string, r: number) =>
    capsule(ctx, p[a][0], p[a][1], p[b][0], p[b][1], r * dpr);

  // Torso (heaviest)
  s("hipC",  "spine", 13);
  s("spine", "chest", 12);
  s("chest", "neck",  10);

  // Hips bar
  s("hipL", "hipR", 10);

  // Shoulders bar
  s("shdL", "shdR", 8);

  // Standing leg (right)
  s("hipR",  "kneeR", 11);
  s("kneeR", "footR", 9);

  // Raised leg (left — arabesque)
  s("hipL",  "kneeL", 10);
  s("kneeL", "footL",  8);

  // Arms
  s("shdL", "elbL", 7);
  s("elbL", "hndL", 6);
  s("shdR", "elbR", 7);
  s("elbR", "hndR", 5);

  // Head
  ctx.fillStyle = SEG_COLOR;
  ctx.beginPath();
  ctx.arc(p.head[0], p.head[1], 13 * dpr, 0, Math.PI * 2);
  ctx.fill();

  // ── Diagnostic frame ─────────────────────────────────────────────────────
  const m = 14 * dpr, ml = 10 * dpr;
  ctx.lineWidth = 0.8 * dpr;
  ctx.strokeStyle = "rgba(139,92,246,0.35)";
  ctx.beginPath(); ctx.moveTo(m, m + ml); ctx.lineTo(m, m); ctx.lineTo(m + ml, m); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - m, H - m - ml); ctx.lineTo(W - m, H - m); ctx.lineTo(W - m - ml, H - m); ctx.stroke();
  ctx.strokeStyle = "rgba(251,191,36,0.22)";
  ctx.beginPath(); ctx.moveTo(m, H - m - ml); ctx.lineTo(m, H - m); ctx.lineTo(m + ml, H - m); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - m, m + ml); ctx.lineTo(W - m, m); ctx.lineTo(W - m - ml, m); ctx.stroke();

  // ── Labels ────────────────────────────────────────────────────────────────
  ctx.font = `${8 * dpr}px "JetBrains Mono",ui-monospace,monospace`;
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.textAlign = "center";
  ctx.letterSpacing = `${2 * dpr}px`;
  ctx.fillText("SPINNING DANCER · PERCEPTUAL BISTABILITY", cx, m + 10 * dpr);

  // Focus crosshair
  if (focusPct >= 0) {
    const fy = p.head[1] + (p.footR[1] - p.head[1]) * focusPct;
    const cr = 6 * dpr;
    ctx.strokeStyle = "rgba(180,220,255,0.35)";
    ctx.lineWidth = 0.8 * dpr;
    ctx.beginPath(); ctx.moveTo(cx - cr * 2.2, fy); ctx.lineTo(cx + cr * 2.2, fy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, fy - cr * 1.5); ctx.lineTo(cx, fy + cr * 1.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, fy, cr, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.textAlign = "left";
  ctx.letterSpacing = "0px";
}

// ── Component ──────────────────────────────────────────────────────────────

export function SpinningDancer() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const phiRef      = useRef(0);
  const dirRef      = useRef(1);
  const speedRef    = useRef(1.0);
  const runRef      = useRef(true);
  const focusRef    = useRef(0.5);

  const [dir,     setDir]     = useState<1 | -1>(1);
  const [speed,   setSpeed]   = useState(1.0);
  const [running, setRunning] = useState(true);
  const [focus,   setFocus]   = useState(50); // 0..100

  useEffect(() => { dirRef.current   = dir;         }, [dir]);
  useEffect(() => { speedRef.current = speed;       }, [speed]);
  useEffect(() => { runRef.current   = running;     }, [running]);
  useEffect(() => { focusRef.current = focus / 100; }, [focus]);

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
      if (runRef.current) phiRef.current += 0.014 * speedRef.current * dirRef.current;
      drawDancer(canvas!, phiRef.current, focusRef.current);
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  const speedPct = ((speed - 0.25) / 2.75) * 100;

  return (
    <div className="flex flex-col overflow-hidden border border-border/35 bg-black/30 lg:flex-row">

      {/* Canvas */}
      <div className="relative min-h-[300px] flex-1 sm:min-h-[380px] lg:min-h-[460px]">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          aria-label="Spinning dancer silhouette — ambiguous rotation direction due to absent depth cue"
        />
        {running && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-sm border border-white/10 bg-black/50 px-2 py-1 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400/80" />
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-violet-400/70">
              {dir === 1 ? "clockwise" : "counter-cw"}
            </span>
          </div>
        )}
      </div>

      {/* Control panel */}
      <div className="flex w-full flex-col gap-5 border-t border-border/30 bg-black/20 p-5 lg:w-72 lg:border-l lg:border-t-0">

        <div>
          <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/45">
            SYS // OBS-PB · Perceptual Bistability
          </div>
          <h3 className="text-base font-semibold tracking-tight">Spinning Dancer</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/55">
            A silhouette carries no stereo depth cues. Your visual system assigns a 3D
            interpretation — but two observers can assign opposite ones and both be consistent
            with the 2D projection.
          </p>
        </div>

        {/* Direction flip */}
        <div>
          <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
            Assigned spin direction
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {([1, -1] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => { setDir(d); dirRef.current = d; }}
                className={`rounded-sm border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
                  dir === d
                    ? "border-violet-500/50 bg-violet-950/40 text-violet-300"
                    : "border-border/30 bg-secondary/20 text-muted-foreground/55 hover:border-border/50"
                }`}
              >
                {d === 1 ? "Clockwise" : "Counter-CW"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground/38">
            Both directions are valid 3D interpretations of the same 2D path.
          </p>
        </div>

        {/* Focus point */}
        <div>
          <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
            Focus point
          </div>
          <p className="mb-2 text-[9px] leading-relaxed text-muted-foreground/38">
            Move the crosshair to a body part. Sustained focus on the foot or hand can nudge a perception flip.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 py-2">
              <div className="h-0.5 w-full rounded-full bg-white/10" />
              <div
                ref={el => { if (el) el.style.width = `${focus}%`; }}
                className="pointer-events-none absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-blue-400/50"
              />
              <input
                type="range" min={0} max={100} step={1}
                value={focus}
                onChange={e => setFocus(parseInt(e.target.value))}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Focus point position (head to foot)"
              />
              <div
                ref={el => { if (el) el.style.left = `${focus}%`; }}
                className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-blue-300/80"
              />
            </div>
            <span className="w-16 text-right font-mono text-[9px] tabular-nums text-muted-foreground/55">
              {focus < 20 ? "Head" : focus < 45 ? "Torso" : focus < 68 ? "Hips" : focus < 88 ? "Knee" : "Foot"}
            </span>
          </div>
        </div>

        {/* Speed */}
        <div>
          <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
            Rotation speed
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 py-2">
              <div className="h-0.5 w-full rounded-full bg-white/10" />
              <div
                ref={el => { if (el) el.style.width = `${speedPct}%`; }}
                className="pointer-events-none absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-violet-400/60"
              />
              <input
                type="range" min={0.25} max={3} step={0.05}
                value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Dancer rotation speed"
              />
              <div
                ref={el => { if (el) el.style.left = `${speedPct}%`; }}
                className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-violet-400 q-thumb-z"
              />
            </div>
            <span className="w-10 text-right font-mono text-[11px] tabular-nums text-foreground/75">
              {speed.toFixed(2)}×
            </span>
          </div>
        </div>

        {/* Observer note */}
        <div className="rounded-sm border border-violet-500/15 bg-violet-950/15 px-3.5 py-3">
          <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.2em] text-violet-400/50">
            Transport assumption
          </div>
          <p className="text-[9px] leading-relaxed text-muted-foreground/42">
            In xPRIMEray, two transport rays that observe the same curved boundary from
            opposite sides make opposite assumptions about which side is the interior.
            Like this silhouette, the 2D projection is identical — only the assigned 3D
            interpretation differs.
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
            onClick={() => { phiRef.current = 0; }}
            className="rounded-sm border border-border/30 bg-secondary/20 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
