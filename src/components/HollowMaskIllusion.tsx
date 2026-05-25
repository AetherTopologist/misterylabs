import { useRef, useEffect, useState } from "react";

type MaskMode = "illusion" | "concave";

// ── Draw ───────────────────────────────────────────────────────────────────

function drawMask(canvas: HTMLCanvasElement, theta: number, mode: MaskMode) {
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
  for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Mask geometry
  const maskH = Math.min(W, H) * 0.60;
  const maskW0 = maskH * 0.68;
  const cosT = Math.cos(theta);
  const viewingBack = cosT < 0;
  const showConcave = mode === "concave" && viewingBack;
  const xMirror = showConcave ? -1 : 1;
  const maskW = maskW0 * Math.abs(cosT);
  const faceY = cy + maskH * 0.02;

  // Edge-on: just draw a thin vertical line
  if (maskW < 2 * dpr) {
    ctx.strokeStyle = "rgba(200,185,168,0.35)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(cx, faceY - maskH * 0.5);
    ctx.lineTo(cx, faceY + maskH * 0.5);
    ctx.stroke();
    // still draw frame + labels
    drawFrame(ctx, W, H, dpr);
    drawLabels(ctx, cx, H, dpr, showConcave, theta);
    return;
  }

  const hw = maskW * 0.5, hh = maskH * 0.5;

  // ── Face oval fill ────────────────────────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, faceY, hw, hh, 0, 0, Math.PI * 2);
  ctx.clip();

  let faceGrd: CanvasGradient;
  if (!showConcave) {
    // Convex: bright upper-left centre, shadow at edges
    faceGrd = ctx.createRadialGradient(
      cx - hw * 0.18, faceY - hh * 0.20, 0,
      cx + hw * 0.10, faceY + hh * 0.15, hw * 1.05
    );
    faceGrd.addColorStop(0,    "rgba(218,200,180,0.97)");
    faceGrd.addColorStop(0.28, "rgba(185,165,142,0.94)");
    faceGrd.addColorStop(0.58, "rgba(135,115,95,0.90)");
    faceGrd.addColorStop(0.82, "rgba(72,56,42,0.86)");
    faceGrd.addColorStop(1,    "rgba(32,24,16,0.80)");
  } else {
    // True concave: dark recess at centre, rim-lit edges
    faceGrd = ctx.createRadialGradient(cx, faceY, 0, cx, faceY, hw * 0.95);
    faceGrd.addColorStop(0,    "rgba(30,22,14,0.96)");
    faceGrd.addColorStop(0.42, "rgba(68,52,38,0.93)");
    faceGrd.addColorStop(0.72, "rgba(148,125,102,0.90)");
    faceGrd.addColorStop(0.90, "rgba(175,148,120,0.85)");
    faceGrd.addColorStop(1,    "rgba(48,36,26,0.75)");
  }
  ctx.fillStyle = faceGrd;
  ctx.fillRect(cx - hw, faceY - hh, maskW, maskH);
  ctx.restore();

  // Face outline
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, faceY, hw, hh, 0, 0, Math.PI * 2);
  ctx.strokeStyle = showConcave ? "rgba(168,142,115,0.22)" : "rgba(215,192,165,0.28)";
  ctx.lineWidth = 1.2 * dpr;
  ctx.stroke();
  ctx.restore();

  // ── Specular highlight (convex only) ──────────────────────────────────────
  if (!showConcave) {
    const sx = cx - hw * 0.16, sy = faceY - hh * 0.26;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, hw * 0.22);
    sg.addColorStop(0, "rgba(255,248,235,0.62)");
    sg.addColorStop(0.55, "rgba(240,225,205,0.20)");
    sg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.ellipse(sx, sy, hw * 0.22, hh * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Eye sockets ───────────────────────────────────────────────────────────
  const eyeY  = faceY - hh * 0.13;
  const eyeOX = hw * 0.24 * xMirror;
  const erx   = Math.max(2, hw * 0.132);
  const ery   = Math.max(2, hh * 0.096);

  for (const side of [-1, 1] as const) {
    const ex = cx + side * eyeOX;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, erx, ery, 0, 0, Math.PI * 2);
    ctx.clip();

    let eg: CanvasGradient;
    if (!showConcave) {
      eg = ctx.createRadialGradient(ex, eyeY, 0, ex, eyeY, erx * 1.6);
      eg.addColorStop(0,    "rgba(12,8,4,0.97)");
      eg.addColorStop(0.62, "rgba(38,26,18,0.85)");
      eg.addColorStop(1,    "rgba(85,65,48,0.32)");
    } else {
      eg = ctx.createRadialGradient(ex - erx * 0.22, eyeY - ery * 0.22, 0, ex, eyeY, erx * 1.6);
      eg.addColorStop(0,    "rgba(172,145,118,0.82)");
      eg.addColorStop(0.58, "rgba(95,74,56,0.72)");
      eg.addColorStop(1,    "rgba(38,28,20,0.22)");
    }
    ctx.fillStyle = eg;
    ctx.fillRect(ex - erx * 1.8, eyeY - ery * 1.8, erx * 3.6, ery * 3.6);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, erx, ery, 0, 0, Math.PI * 2);
    ctx.strokeStyle = showConcave ? "rgba(155,130,105,0.20)" : "rgba(55,38,24,0.30)";
    ctx.lineWidth = 0.8 * dpr;
    ctx.stroke();
    ctx.restore();
  }

  // ── Nose ─────────────────────────────────────────────────────────────────
  const noseTipY = faceY + hh * 0.13;
  const noseTopY = faceY + hh * 0.00;
  const nw = Math.max(3, hw * 0.13);
  const ntx = cx + hw * 0.02 * xMirror;

  if (!showConcave) {
    // Highlight on bridge / tip
    const ng = ctx.createRadialGradient(ntx - nw * 0.32, noseTipY - hh * 0.04, 0, ntx, noseTipY, nw * 1.3);
    ng.addColorStop(0,   "rgba(235,215,190,0.70)");
    ng.addColorStop(0.58,"rgba(145,122,98,0.28)");
    ng.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.ellipse(ntx - nw * 0.28, noseTipY - hh * 0.02, nw * 0.85, hh * 0.075, 0, 0, Math.PI * 2);
    ctx.fill();
    // Under-nose shadow
    ctx.fillStyle = "rgba(22,15,10,0.52)";
    ctx.beginPath();
    ctx.ellipse(ntx + nw * 0.14 * xMirror, noseTipY + hh * 0.020, nw * 1.05, hh * 0.026, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Concave: dark recess where nose should protrude
    const nd = ctx.createRadialGradient(ntx, noseTopY, 0, ntx, noseTopY, nw * 1.9);
    nd.addColorStop(0,   "rgba(12,8,4,0.78)");
    nd.addColorStop(0.68,"rgba(35,26,18,0.35)");
    nd.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = nd;
    ctx.beginPath();
    ctx.ellipse(ntx, noseTipY - hh * 0.02, nw * 1.6, hh * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nostrils
  const nAlpha = showConcave ? 0.22 : 0.62;
  for (const side of [-1, 1] as const) {
    ctx.fillStyle = `rgba(16,10,6,${nAlpha})`;
    ctx.beginPath();
    ctx.ellipse(ntx + side * nw * 0.40 * xMirror, noseTipY + hh * 0.006, nw * 0.22, hh * 0.022, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Mouth ─────────────────────────────────────────────────────────────────
  const mouthY = faceY + hh * 0.230;
  const mw = Math.max(5, hw * 0.30);
  const lc = hh * 0.020;

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = showConcave ? "rgba(125,105,82,0.40)" : "rgba(62,44,30,0.70)";
  ctx.lineWidth = showConcave ? 1.0 * dpr : 1.6 * dpr;
  ctx.beginPath();
  ctx.moveTo(cx - mw * 0.50, mouthY);
  ctx.bezierCurveTo(cx - mw * 0.18, mouthY - lc * 0.5, cx + mw * 0.18, mouthY - lc * 0.5, cx + mw * 0.50, mouthY);
  ctx.stroke();

  ctx.strokeStyle = showConcave ? "rgba(112,94,74,0.35)" : "rgba(48,34,22,0.58)";
  ctx.lineWidth = showConcave ? 0.9 * dpr : 1.3 * dpr;
  ctx.beginPath();
  ctx.moveTo(cx - mw * 0.44, mouthY + lc * 0.4);
  ctx.bezierCurveTo(cx - mw * 0.14, mouthY + lc * 1.15, cx + mw * 0.14, mouthY + lc * 1.15, cx + mw * 0.44, mouthY + lc * 0.4);
  ctx.stroke();
  ctx.restore();

  // Philtrum highlight (convex)
  if (!showConcave) {
    ctx.fillStyle = "rgba(210,190,165,0.30)";
    ctx.beginPath();
    ctx.ellipse(cx, mouthY - lc * 0.85, nw * 0.28, hh * 0.018, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Edge depth shadow / rim ───────────────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, faceY, hw, hh, 0, 0, Math.PI * 2);
  ctx.clip();
  const rim = ctx.createRadialGradient(cx, faceY, hw * 0.28, cx, faceY, hw * 0.58);
  if (!showConcave) {
    rim.addColorStop(0, "rgba(0,0,0,0)");
    rim.addColorStop(0.72, "rgba(0,0,0,0)");
    rim.addColorStop(1, "rgba(0,0,0,0.28)");
  } else {
    rim.addColorStop(0, "rgba(0,0,0,0.38)");
    rim.addColorStop(0.52, "rgba(0,0,0,0.10)");
    rim.addColorStop(1, "rgba(0,0,0,0)");
  }
  ctx.fillStyle = rim;
  ctx.fillRect(cx - hw, faceY - hh, maskW, maskH);
  ctx.restore();

  drawFrame(ctx, W, H, dpr);
  drawLabels(ctx, cx, H, dpr, showConcave, theta);
}

function drawFrame(ctx: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  const m = 14 * dpr, ml = 10 * dpr;
  ctx.lineWidth = 0.8 * dpr;
  ctx.strokeStyle = "rgba(251,146,60,0.35)";
  ctx.beginPath(); ctx.moveTo(m, m + ml); ctx.lineTo(m, m); ctx.lineTo(m + ml, m); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - m, H - m - ml); ctx.lineTo(W - m, H - m); ctx.lineTo(W - m - ml, H - m); ctx.stroke();
  ctx.strokeStyle = "rgba(34,211,238,0.22)";
  ctx.beginPath(); ctx.moveTo(m, H - m - ml); ctx.lineTo(m, H - m); ctx.lineTo(m + ml, H - m); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - m, m + ml); ctx.lineTo(W - m, m); ctx.lineTo(W - m - ml, m); ctx.stroke();
}

function drawLabels(
  ctx: CanvasRenderingContext2D,
  cx: number, H: number, dpr: number,
  showConcave: boolean, theta: number
) {
  const m = 14 * dpr;
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.font = `${8 * dpr}px "JetBrains Mono",ui-monospace,monospace`;
  ctx.textAlign = "center";
  ctx.letterSpacing = `${2 * dpr}px`;
  ctx.fillText("HOLLOW MASK · DEPTH INVERSION", cx, m + 10 * dpr);

  const label = showConcave ? "TRUE CONCAVE" : "PERCEIVED CONVEX";
  ctx.fillStyle = showConcave ? "rgba(34,211,238,0.65)" : "rgba(251,146,60,0.65)";
  ctx.font = `${9 * dpr}px "JetBrains Mono",ui-monospace,monospace`;
  ctx.letterSpacing = `${1.5 * dpr}px`;
  ctx.fillText(label, cx, H - m - 4 * dpr);

  // Rotation angle indicator (small arc on bottom-right)
  const norm = ((theta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const pct = norm / (Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.font = `${7.5 * dpr}px "JetBrains Mono",ui-monospace,monospace`;
  ctx.letterSpacing = `${1 * dpr}px`;
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(pct * 360)}°`, cx * 2 - m - 2 * dpr, H - m - 4 * dpr);

  ctx.textAlign = "left";
  ctx.letterSpacing = "0px";
}

// ── Component ──────────────────────────────────────────────────────────────

export function HollowMaskIllusion() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const thetaRef   = useRef(0);
  const modeRef    = useRef<MaskMode>("illusion");
  const speedRef   = useRef(1.0);
  const runRef     = useRef(true);

  const [mode,    setMode]    = useState<MaskMode>("illusion");
  const [speed,   setSpeed]   = useState(1.0);
  const [running, setRunning] = useState(true);

  useEffect(() => { modeRef.current  = mode;    }, [mode]);
  useEffect(() => { speedRef.current = speed;   }, [speed]);
  useEffect(() => { runRef.current   = running; }, [running]);

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
      if (runRef.current) thetaRef.current += 0.012 * speedRef.current;
      drawMask(canvas!, thetaRef.current, modeRef.current);
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
          aria-label="Rotating hollow mask — concave face appears convex due to prior-driven depth inversion"
        />
        {running && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-sm border border-white/10 bg-black/50 px-2 py-1 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400/80" />
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/70">
              rotating
            </span>
          </div>
        )}
        <div className="absolute right-3 top-3 rounded-sm border border-white/10 bg-black/50 px-2 py-1 backdrop-blur-sm">
          <span className={`font-mono text-[8px] uppercase tracking-[0.2em] ${
            mode === "illusion" ? "text-amber-400/70" : "text-cyan-400/70"
          }`}>
            {mode === "illusion" ? "perceived convex" : "true concave"}
          </span>
        </div>
      </div>

      {/* Control panel */}
      <div className="flex w-full flex-col gap-5 border-t border-border/30 bg-black/20 p-5 lg:w-72 lg:border-l lg:border-t-0">

        <div>
          <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/45">
            SYS // OBS-PM · Perceptual Mask
          </div>
          <h3 className="text-base font-semibold tracking-tight">Hollow Mask Illusion</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/55">
            A concave hollow mask rotates. Your visual system — trained on convex faces —
            overrides the concave depth cues and perceives convex geometry. Toggle to see
            the corrected physics.
          </p>
        </div>

        {/* Mode toggle */}
        <div>
          <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
            Render mode
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(["illusion", "concave"] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-sm border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
                  mode === m
                    ? m === "illusion"
                      ? "border-amber-500/50 bg-amber-950/40 text-amber-300"
                      : "border-cyan-500/50 bg-cyan-950/30 text-cyan-300"
                    : "border-border/30 bg-secondary/20 text-muted-foreground/55 hover:border-border/50"
                }`}
              >
                {m === "illusion" ? "Perceived" : "True Concave"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground/38">
            Switch mid-rotation to see the lighting inversion at the back of the mask.
          </p>
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
                className="pointer-events-none absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-amber-400/60"
              />
              <input
                type="range" min={0.25} max={3} step={0.05}
                value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Mask rotation speed"
              />
              <div
                ref={el => { if (el) el.style.left = `${speedPct}%`; }}
                className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-amber-400 q-thumb-w"
              />
            </div>
            <span className="w-10 text-right font-mono text-[11px] tabular-nums text-foreground/75">
              {speed.toFixed(2)}×
            </span>
          </div>
        </div>

        {/* Observer note */}
        <div className="rounded-sm border border-amber-500/15 bg-amber-950/15 px-3.5 py-3">
          <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/50">
            Observer disagreement
          </div>
          <p className="text-[9px] leading-relaxed text-muted-foreground/42">
            <span className="text-amber-400/60">Intrinsic curvature</span> — measured by an
            observer inside the surface — is the same whether the mask is convex or concave.
            <span className="text-cyan-400/60"> Extrinsic curvature</span> — the embedding in
            space — is opposite. In xPRIMEray, two transport rays entering the same boundary
            from opposite sides will disagree on its apparent curvature sign.
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { const n = !running; setRunning(n); runRef.current = n; }}
            className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-border/40 bg-secondary/30 px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary/50"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${running ? "animate-pulse bg-amber-400" : "bg-muted-foreground/40"}`} />
            {running ? "Pause" : "Resume"}
          </button>
          <button
            type="button"
            onClick={() => { thetaRef.current = 0; }}
            className="rounded-sm border border-border/30 bg-secondary/20 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
