import React, { useEffect, useRef, useState } from "react";

// ── Simulation constants ──────────────────────────────────
const SIM_W = 420;
const SIM_H = 340;
const LAMBDA = 50;    // base wavelength in sim pixels at n=1
const K0 = (2 * Math.PI) / LAMBDA;

// Fresnel reflectance for normal incidence (|r|²)
function fresnelR(n1: number, n2: number): number {
  const den = n1 + n2;
  if (Math.abs(den) < 0.06) return 0.97;
  return Math.min(Math.pow((n1 - n2) / den, 2), 0.97);
}

// Wave amplitude at simulation pixel (px, py)
// Upper half n=1 air: incident + reflected
// Lower half n=n2: transmitted forward (+IOR) or converging (-IOR)
function waveField(
  px: number, py: number, t: number,
  srcX: number, srcY: number, memY: number, halfH: number,
  n2: number, amp: number, freq: number
): number {
  const omega = 2 * Math.PI * freq;
  const R = fresnelR(1.0, n2);
  const sqrtR = Math.sqrt(R);
  const sqrtT = Math.sqrt(Math.max(0, 1 - R));

  if (py < memY - halfH) {
    // Upper: incident circular wave + reflected from mirror source
    const r1 = Math.hypot(px - srcX, py - srcY) + 0.5;
    const mirrorY = 2 * memY - srcY;
    const r2 = Math.hypot(px - srcX, py - mirrorY) + 0.5;
    return (
      amp * Math.sin(K0 * r1 - omega * t) +
      amp * sqrtR * Math.sin(K0 * r2 - omega * t + Math.PI)
    );
  }

  if (py > memY + halfH) {
    if (n2 >= 0) {
      // Positive IOR: forward-propagating from membrane entry point
      const r = Math.hypot(px - srcX, py - memY) + 0.5;
      return amp * sqrtT * Math.sin(K0 * n2 * r - omega * t);
    } else {
      // Negative IOR: converging toward focal point (flat-lens reconstruction)
      const focalY = 2 * memY - srcY;
      const rf = Math.hypot(px - srcX, py - focalY) + 0.5;
      // Positive phase grows with rf → wavefronts move inward (converging)
      return amp * sqrtT * Math.sin(K0 * Math.abs(n2) * rf + omega * t);
    }
  }

  return 0; // inside membrane
}

// Map wave amplitude to RGB (dark base, cyan positive, magenta negative)
function waveToRgb(u: number, inMemb: boolean): [number, number, number] {
  if (inMemb) return [16, 30, 42];
  const c = Math.max(-1.8, Math.min(1.8, u));
  const n = c / 1.8;
  const I = Math.pow(Math.abs(n), 0.58);
  if (n > 0) {
    return [Math.floor(5 + 12 * I), Math.floor(5 + 165 * I), Math.floor(8 + 200 * I)];
  }
  return [Math.floor(5 + 198 * I), Math.floor(5 + 5 * I), Math.floor(8 + 155 * I)];
}

// ── Presets ───────────────────────────────────────────────

const PRESETS: { label: string; ior: number; freq: number; amp: number }[] = [
  { label: "Air",      ior: 1.00, freq: 0.9, amp: 1.0 },
  { label: "Glass",    ior: 1.50, freq: 0.9, amp: 1.0 },
  { label: "Exotic",   ior: -1.50, freq: 0.9, amp: 1.0 },
  { label: "Meta",     ior: -2.20, freq: 0.7, amp: 1.1 },
];

// ── Component ─────────────────────────────────────────────

export function PoissonDotAndNegativeIOR() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef     = useRef(0);
  const rafRef   = useRef(0);

  // Mutable refs — read by RAF loop without stale closures
  const pausedRef    = useRef(false);
  const iorRef       = useRef(1.5);
  const freqRef      = useRef(0.9);
  const ampRef       = useRef(1.0);
  const membRef      = useRef(14);

  // React state — for UI re-renders only
  const [ior,       setIorState]   = useState(1.5);
  const [freq,      setFreqState]  = useState(0.9);
  const [amp,       setAmpState]   = useState(1.0);
  const [membThick, setMembState]  = useState(14);
  const [paused,    setPaused]     = useState(false);

  function setIor(v: number)  { iorRef.current  = v; setIorState(v);  }
  function setFreq(v: number) { freqRef.current  = v; setFreqState(v); }
  function setAmp(v: number)  { ampRef.current   = v; setAmpState(v);  }
  function setMemb(v: number) { membRef.current  = v; setMembState(v); }

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // ── RAF render loop (mount-only) ──────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = SIM_W;
    canvas.height = SIM_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const srcX = SIM_W / 2;
    const srcY = Math.floor(SIM_H * 0.22);
    const memY = Math.floor(SIM_H * 0.50);

    let last = performance.now();

    function draw(now: number) {
      rafRef.current = requestAnimationFrame(draw);
      const dt = (now - last) / 1000;
      last = now;
      if (!pausedRef.current) tRef.current += dt;

      const t   = tRef.current;
      const n2  = iorRef.current;
      const fq  = freqRef.current;
      const am  = ampRef.current;
      const mh  = membRef.current;
      const hH  = mh * 0.5;

      // ── Pixel field ───────────────────────────────────
      const imgData = ctx.createImageData(SIM_W, SIM_H);
      const d = imgData.data;

      for (let py = 0; py < SIM_H; py++) {
        const inMemb = py >= memY - hH && py <= memY + hH;
        for (let px = 0; px < SIM_W; px++) {
          const u = inMemb ? 0 : waveField(px, py, t, srcX, srcY, memY, hH, n2, am, fq);
          const [r, g, b] = waveToRgb(u, inMemb);
          const i = (py * SIM_W + px) * 4;
          d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // ── Overlay: source glow ──────────────────────────
      const sgrd = ctx.createRadialGradient(srcX, srcY, 0, srcX, srcY, 22);
      sgrd.addColorStop(0,   "rgba(255,160,20,0.92)");
      sgrd.addColorStop(0.4, "rgba(255,90,10,0.32)");
      sgrd.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = sgrd;
      ctx.beginPath();
      ctx.arc(srcX, srcY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffb030";
      ctx.beginPath();
      ctx.arc(srcX, srcY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // ── Overlay: negative IOR focal point ─────────────
      if (n2 < 0) {
        const fy = 2 * memY - srcY;
        const fgrd = ctx.createRadialGradient(srcX, fy, 0, srcX, fy, 16);
        fgrd.addColorStop(0,   "rgba(210,70,168,0.60)");
        fgrd.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = fgrd;
        ctx.beginPath();
        ctx.arc(srcX, fy, 16, 0, Math.PI * 2);
        ctx.fill();
        // Crosshair
        ctx.strokeStyle = "rgba(200,70,160,0.40)";
        ctx.setLineDash([2, 3]);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(srcX - 11, fy); ctx.lineTo(srcX + 11, fy);
        ctx.moveTo(srcX, fy - 11); ctx.lineTo(srcX, fy + 11);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ── Overlay: region labels ─────────────────────────
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(155,185,200,0.32)";
      ctx.fillText("n₁ = +1.00  [air]", 8, srcY - 15);
      ctx.fillStyle = n2 >= 0 ? "rgba(80,190,215,0.50)" : "rgba(200,75,160,0.55)";
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      const sign = n2 >= 0 ? "+" : "";
      ctx.fillText(`n₂ = ${sign}${n2.toFixed(2)}`, 8, SIM_H - 9);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Derived metrics (React state, so recalculates on render) ──
  const R = fresnelR(1.0, ior);
  const T = 1 - R;
  const isNeg = ior < 0;
  const resonanceN = (2 * membThick * Math.abs(ior)) / LAMBDA;
  const nearRes = Math.abs(resonanceN - Math.round(resonanceN)) < 0.12 && Math.abs(ior) > 0.1;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">

      {/* ── Canvas ──────────────────────────────────────── */}
      <div className="corner-marks flex-1 min-w-0 overflow-hidden rounded-sm border border-border/30 bg-[#05060c]">
        <canvas
          ref={el => {
            canvasRef.current = el;
            if (el) el.style.width = "100%";
          }}
          className="block"
        />
      </div>

      {/* ── Controls ────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:w-80">

        {/* Mode toggle */}
        <div className="panel">
          <div className="panel-header">
            <span>Transport Mode</span>
            <span className={isNeg ? "text-rose-400/70" : "text-cyan-400/65"}>
              {isNeg ? "Negative Index" : "Classical IOR"}
            </span>
          </div>
          <div className="flex gap-2 p-3">
            <button
              type="button"
              onClick={() => setIor(1.5)}
              className={`flex-1 rounded-sm border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] transition-base ${
                !isNeg
                  ? "border-cyan-500/45 bg-cyan-950/20 text-cyan-300"
                  : "border-border/35 text-muted-foreground/45 hover:border-border/60"
              }`}
            >
              Classical
            </button>
            <button
              type="button"
              onClick={() => setIor(-1.5)}
              className={`flex-1 rounded-sm border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] transition-base ${
                isNeg
                  ? "border-rose-500/45 bg-rose-950/20 text-rose-300"
                  : "border-border/35 text-muted-foreground/45 hover:border-border/60"
              }`}
            >
              Negative
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => { setIor(p.ior); setFreq(p.freq); setAmp(p.amp); }}
              className="rounded-sm border border-border/30 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50 transition-base hover:border-border/60 hover:text-muted-foreground"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* IOR slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/55">
              Index of Refraction n₂
            </label>
            <span className={`font-mono text-[10px] font-semibold tabular-nums ${isNeg ? "text-rose-400" : "text-amber-400"}`}>
              {ior >= 0 ? "+" : ""}{ior.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={-3.0}
            max={3.0}
            step={0.05}
            value={ior}
            onChange={e => {
              let v = parseFloat(e.target.value);
              if (v > -1.12 && v < -0.88) v = v < -1 ? -1.12 : -0.88;
              setIor(v);
            }}
            className="w-full q-thumb-w"
          />
          <div className="flex justify-between font-mono text-[8px] text-muted-foreground/28">
            <span>−3.0</span>
            <span>0</span>
            <span>+3.0</span>
          </div>
        </div>

        {/* Frequency slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/55">
              Frequency
            </label>
            <span className="font-mono text-[10px] font-semibold tabular-nums text-cyan-400">
              {freq.toFixed(2)} Hz
            </span>
          </div>
          <input
            type="range" min={0.3} max={2.5} step={0.05} value={freq}
            onChange={e => setFreq(parseFloat(e.target.value))}
            className="w-full q-thumb-x"
          />
        </div>

        {/* Amplitude slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/55">
              Amplitude
            </label>
            <span className="font-mono text-[10px] font-semibold tabular-nums text-violet-400">
              {amp.toFixed(2)}
            </span>
          </div>
          <input
            type="range" min={0.3} max={1.6} step={0.05} value={amp}
            onChange={e => setAmp(parseFloat(e.target.value))}
            className="w-full q-thumb-z"
          />
        </div>

        {/* Membrane thickness slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/55">
              Membrane Thickness
            </label>
            <span className="font-mono text-[10px] font-semibold tabular-nums text-sky-400">
              {membThick} px
            </span>
          </div>
          <input
            type="range" min={4} max={44} step={2} value={membThick}
            onChange={e => setMemb(parseInt(e.target.value))}
            className="w-full q-thumb-y"
          />
        </div>

        {/* Live metrics card */}
        <div className="panel">
          <div className="panel-header">
            <span>Live Metrics</span>
            {nearRes && (
              <span className="animate-pulse font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400/80">
                Resonance
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 p-3">
            <div>
              <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/38">
                Reflection R
              </div>
              <div className="readout text-sm font-semibold text-foreground/80">
                {(R * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/38">
                Transmission T
              </div>
              <div className="readout text-sm font-semibold text-foreground/80">
                {(T * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/38">
                Phase Velocity
              </div>
              <div className={`readout text-xs font-semibold ${isNeg ? "text-rose-400" : "text-cyan-400"}`}>
                {isNeg ? "← backward" : "→ forward"}
              </div>
            </div>
            <div>
              <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/38">
                2d·|n₂|/λ
              </div>
              <div className={`readout text-xs font-semibold tabular-nums ${nearRes ? "text-amber-400" : "text-muted-foreground/55"}`}>
                {resonanceN.toFixed(2)}
                {nearRes && " ≈ m"}
              </div>
            </div>
          </div>
        </div>

        {/* Pause / Reset */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPaused(p => !p)}
            className={`flex-1 rounded-sm border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] transition-base ${
              paused
                ? "border-amber-500/45 bg-amber-950/20 text-amber-300"
                : "border-border/38 text-muted-foreground/55 hover:border-border/65"
            }`}
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => { tRef.current = 0; }}
            className="rounded-sm border border-border/32 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/45 transition-base hover:border-border/60 hover:text-muted-foreground"
          >
            Reset
          </button>
        </div>

        {/* Observer note */}
        <div className="rounded-sm border border-violet-500/14 bg-violet-950/10 p-3">
          <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.3em] text-violet-400/50">
            Observer Note · Optical Transport
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground/52">
            In xPRIMEray's GRIN field, the effective index n(x) governs curved-ray transport
            boundary ownership. A negative-index region redirects paths backward — analogous
            to trapped transport at wormhole seam boundaries, where interior and exterior
            curvature ownership inverts. The dashed crosshair marks the flat-lens focal
            reconstruction point.
          </p>
        </div>

      </div>
    </div>
  );
}
