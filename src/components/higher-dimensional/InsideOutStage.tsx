import { useEffect, useRef, useState } from "react";
import { FACE_COLORS, NET_LABELS, type Chirality } from "@/components/CubeNetExplorer";
import { foldCube, netFoldCloses, type V3 } from "@/instruments/higher-dimensional/fold-cube";
import {
  LEGACY_PLANE_RATES,
  T_EDGES,
  T_FACES,
  T_VERTS,
  ZERO_PLANES,
  applyPlanes,
  proj3to2,
  proj4to3,
  projectionDistance,
  type PlaneAngles,
} from "@/instruments/higher-dimensional/tesseract-math";
import { WORM_TUBE_WARNING, wormTubeQuads } from "@/instruments/higher-dimensional/worm-tube";

type Mode = "wire" | "hybrid" | "surface" | "worm";

const PLANE_KEYS = ["xw", "yz", "xy", "xz", "yw", "zw"] as const;

function resize(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, r.width) * dpr;
  canvas.height = Math.max(1, r.height) * dpr;
  return dpr;
}

function paintFold(
  canvas: HTMLCanvasElement,
  progress: number,
  netIdx: number,
  chirality: Chirality,
  mode: Mode,
  alpha: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = resize(canvas);
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#05060c";
  ctx.fillRect(0, 0, W, H);
  const faces = foldCube(netIdx, progress, chirality);
  let cx3 = 0, cy3 = 0, cz3 = 0, n = 0;
  for (const face of faces) for (const p of face) { cx3 += p[0]; cy3 += p[1]; cz3 += p[2]; n++; }
  cx3 /= n; cy3 /= n; cz3 /= n;
  const cx = W / 2, cy = H / 2;
  const sc = Math.min(W, H) * 0.16;
  const yaw = 0.7, pitch = 0.45;
  const project = (p: V3): [number, number, number] => {
    const x = p[0] - cx3, y = p[1] - cy3, z = p[2] - cz3;
    const cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
    const x1 = x * cyaw + z * syaw;
    const z1 = -x * syaw + z * cyaw;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const y2 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;
    const s = sc / (3.2 - z2 * 0.15);
    return [cx + x1 * s, cy - y2 * s, z2];
  };
  const drawn = faces.map((face, fi) => {
    const pts = face.map(project);
    const depth = pts.reduce((s, p) => s + p[2], 0) / pts.length;
    return { fi, pts, depth };
  }).sort((a, b) => a.depth - b.depth);
  const showSurface = mode === "surface" || mode === "hybrid";
  const showWire = mode === "wire" || mode === "hybrid";
  for (const { fi, pts } of drawn) {
    const col = FACE_COLORS[fi];
    if (showSurface) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
      ctx.closePath();
      ctx.fillStyle = col.fill.replace("0.82", String(Math.max(0.05, alpha)));
      ctx.fill();
    }
    if (showWire) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
      ctx.closePath();
      ctx.strokeStyle = col.stroke;
      ctx.lineWidth = 1.1 * dpr;
      ctx.stroke();
    }
  }
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `${11 * dpr}px "JetBrains Mono",ui-monospace,monospace`;
  ctx.fillText(`FOLD ${progress.toFixed(2)}  ·  ${NET_LABELS[netIdx]}  ·  ${chirality.toUpperCase()}`, 16 * dpr, 24 * dpr);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = `${10 * dpr}px "JetBrains Mono",ui-monospace,monospace`;
  const note = netFoldCloses(netIdx, chirality)
    ? "Rigid hinge fold of the net. Not an eversion."
    : "This grid has an extra join, so a right-angle fold does not close. Not an eversion.";
  ctx.fillText(note, 16 * dpr, H - 16 * dpr);
}

function paintTesseract(
  canvas: HTMLCanvasElement,
  angles: PlaneAngles,
  distance: number,
  perspective: boolean,
  mode: Mode,
  alpha: number,
  artTime: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = resize(canvas);
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#05060c";
  ctx.fillRect(0, 0, W, H);

  if (mode === "worm") {
    const sc = Math.min(W, H) * 0.28;
    const quads = wormTubeQuads(artTime);
    for (const quad of quads) {
      const pts = quad.pts.map((p) => {
        const z = 3.2 - p[2];
        const s = sc / z;
        return [cx + p[0] * s, cy - p[1] * s] as const;
      });
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
      ctx.closePath();
      ctx.fillStyle = `rgba(125, 211, 252, ${Math.max(0.04, alpha * 0.45)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(226, 232, 240, ${Math.max(0.08, alpha * 0.35)})`;
      ctx.lineWidth = 0.6 * dpr;
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(251,191,36,0.9)";
    ctx.font = `${11 * dpr}px "JetBrains Mono",ui-monospace,monospace`;
    const words = wrap(WORM_TUBE_WARNING, 46);
    words.forEach((line, i) => ctx.fillText(line, 16 * dpr, 28 * dpr + i * 16 * dpr));
    return;
  }

  const sc = Math.min(W, H) * 0.26;
  const d4 = projectionDistance(perspective, distance);
  const verts = T_VERTS.map((v) => {
    const r = applyPlanes(v, angles);
    return proj3to2(proj4to3(r, d4), 3.5, sc, cx, cy);
  });
  const showSurface = mode === "surface" || mode === "hybrid";
  const showWire = mode === "wire" || mode === "hybrid";
  if (showSurface) {
    const faces = T_FACES.map((ids) => {
      const pts = ids.map((i) => verts[i]);
      const depth = pts.reduce((s, p) => s + p[2], 0) / pts.length;
      const w = ids.reduce((s, i) => s + T_VERTS[i][3], 0) / ids.length;
      return { ids, pts, depth, w };
    }).sort((a, b) => a.depth - b.depth);
    for (const face of faces) {
      ctx.beginPath();
      ctx.moveTo(face.pts[0][0], face.pts[0][1]);
      for (const p of face.pts.slice(1)) ctx.lineTo(p[0], p[1]);
      ctx.closePath();
      const color = face.w > 0.5 ? "34,211,238" : face.w < -0.5 ? "251,191,36" : "167,139,250";
      ctx.fillStyle = `rgba(${color},${Math.max(0.04, alpha)})`;
      ctx.fill();
    }
  }
  if (showWire) {
    const edges = T_EDGES.map(([a, b, kind]) => ({
      a, b, kind, depth: (verts[a][2] + verts[b][2]) / 2,
    })).sort((x, y) => x.depth - y.depth);
    for (const edge of edges) {
      const t = Math.max(0, Math.min(1, (edge.depth + sc) / (2 * sc)));
      const o = 0.25 + t * 0.7;
      ctx.strokeStyle = edge.kind === "outer"
        ? `rgba(34,211,238,${o})`
        : edge.kind === "inner"
          ? `rgba(251,191,36,${o})`
          : `rgba(167,139,250,${o})`;
      ctx.lineWidth = (0.8 + t * 0.8) * dpr;
      ctx.beginPath();
      ctx.moveTo(verts[edge.a][0], verts[edge.a][1]);
      ctx.lineTo(verts[edge.b][0], verts[edge.b][1]);
      ctx.stroke();
    }
  }
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = `${11 * dpr}px "JetBrains Mono",ui-monospace,monospace`;
  ctx.fillText("4D PROJECTION  ·  NESTING IS NOT EVERSION", 16 * dpr, 24 * dpr);
}

function wrap(text: string, width: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > width) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export function InsideOutStage() {
  const tessRef = useRef<HTMLCanvasElement>(null);
  const foldRef = useRef<HTMLCanvasElement>(null);
  const anglesRef = useRef<PlaneAngles>({ ...ZERO_PLANES, yz: 0.3 });
  const artRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [reverse, setReverse] = useState(false);
  const [slow, setSlow] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState<Mode>("hybrid");
  const [wire, setWire] = useState(true);
  const [surface, setSurface] = useState(true);
  const [perspective, setPerspective] = useState(true);
  const [distance, setDistance] = useState(2.2);
  const [alpha, setAlpha] = useState(0.28);
  const [progress, setProgress] = useState(0.65);
  const [netIdx, setNetIdx] = useState(0);
  const [chirality, setChirality] = useState<Chirality>("cw");
  const [offsets, setOffsets] = useState<PlaneAngles>({ ...ZERO_PLANES });

  const runRef = useRef(running);
  const revRef = useRef(reverse);
  const slowRef = useRef(slow);
  const speedRef = useRef(speed);
  const modeRef = useRef(mode);
  const wireRef = useRef(wire);
  const surfaceRef = useRef(surface);
  const perspRef = useRef(perspective);
  const distRef = useRef(distance);
  const alphaRef = useRef(alpha);
  const progRef = useRef(progress);
  const netRef = useRef(netIdx);
  const chiRef = useRef(chirality);
  const offRef = useRef(offsets);
  useEffect(() => { runRef.current = running; }, [running]);
  useEffect(() => { revRef.current = reverse; }, [reverse]);
  useEffect(() => { slowRef.current = slow; }, [slow]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { wireRef.current = wire; }, [wire]);
  useEffect(() => { surfaceRef.current = surface; }, [surface]);
  useEffect(() => { perspRef.current = perspective; }, [perspective]);
  useEffect(() => { distRef.current = distance; }, [distance]);
  useEffect(() => { alphaRef.current = alpha; }, [alpha]);
  useEffect(() => { progRef.current = progress; }, [progress]);
  useEffect(() => { netRef.current = netIdx; }, [netIdx]);
  useEffect(() => { chiRef.current = chirality; }, [chirality]);
  useEffect(() => { offRef.current = offsets; }, [offsets]);

  useEffect(() => {
    const tess = tessRef.current;
    const fold = foldRef.current;
    if (!tess || !fold) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const play = runRef.current ? (revRef.current ? -1 : 1) * (slowRef.current ? 0.25 : 1) * speedRef.current : 0;
      const steps = play * dt * 60;
      (Object.keys(LEGACY_PLANE_RATES) as (keyof PlaneAngles)[]).forEach((key) => {
        anglesRef.current[key] += LEGACY_PLANE_RATES[key] * steps;
      });
      artRef.current += steps * 0.016;
      const totals = { ...anglesRef.current };
      (Object.keys(totals) as (keyof PlaneAngles)[]).forEach((key) => {
        totals[key] += offRef.current[key];
      });
      const drawMode: Mode = modeRef.current === "worm"
        ? "worm"
        : surfaceRef.current && wireRef.current
          ? "hybrid"
          : surfaceRef.current
            ? "surface"
            : wireRef.current
              ? "wire"
              : "wire";
      paintTesseract(tess, totals, distRef.current, perspRef.current, drawMode, alphaRef.current, artRef.current);
      paintFold(fold, progRef.current, netRef.current, chiRef.current, drawMode === "worm" ? "hybrid" : drawMode, alphaRef.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(() => { /* next frame resizes */ });
    ro.observe(tess);
    ro.observe(fold);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  function chooseMode(next: Mode) {
    setMode(next);
    if (next === "wire") { setWire(true); setSurface(false); }
    if (next === "hybrid") { setWire(true); setSurface(true); }
    if (next === "surface") { setWire(false); setSurface(true); }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {([
          ["wire", "Wireframe"],
          ["hybrid", "Hybrid"],
          ["surface", "Surfaces"],
          ["worm", "Worm tube"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => chooseMode(id)}
            className={`min-h-11 rounded-sm border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] ${
              mode === id ? "border-violet-400/60 bg-violet-950/40 text-violet-100" : "border-border/30 text-muted-foreground/60"
            }`}
          >
            {label}
          </button>
        ))}
        <button type="button" onClick={() => setRunning((v) => !v)} className="min-h-11 rounded-sm border border-border/40 px-3 font-mono text-[9px] uppercase tracking-[0.12em]">
          {running ? "Pause" : "Play"}
        </button>
        <button type="button" onClick={() => setReverse((v) => !v)} className={`min-h-11 rounded-sm border px-3 font-mono text-[9px] uppercase tracking-[0.12em] ${reverse ? "border-amber-400/60 text-amber-100" : "border-border/40"}`}>
          {reverse ? "Reversed" : "Reverse"}
        </button>
        <button type="button" onClick={() => setSlow((v) => !v)} className={`min-h-11 rounded-sm border px-3 font-mono text-[9px] uppercase tracking-[0.12em] ${slow ? "border-cyan-400/60 text-cyan-100" : "border-border/40"}`}>
          Slow motion
        </button>
      </div>

      {mode === "worm" && (
        <p className="border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-[12px] leading-relaxed text-amber-100/80">
          {WORM_TUBE_WARNING}
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="min-h-[320px] border border-border/35 bg-black sm:min-h-[420px]">
          <canvas ref={tessRef} className="h-full min-h-[320px] w-full sm:min-h-[420px]" aria-label="Tesseract projection or artistic worm tube" />
        </div>
        <div className="min-h-[320px] border border-border/35 bg-black sm:min-h-[420px]">
          <canvas ref={foldRef} className="h-full min-h-[320px] w-full sm:min-h-[420px]" aria-label="Cube net hinge fold" />
        </div>
      </div>

      <div className="grid gap-4 border border-border/35 bg-secondary/20 p-4 md:grid-cols-2">
        <label className="block text-[12px]">
          <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50">Speed {speed.toFixed(2)}×</span>
          <input className="h-11 w-full accent-violet-400" type="range" min={0.25} max={3} step={0.05} value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} />
        </label>
        <label className="block text-[12px]">
          <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50">Projection distance {perspective ? distance.toFixed(2) : "orthographic"}</span>
          <input className="h-11 w-full accent-violet-400" type="range" min={1.6} max={6} step={0.05} value={distance} onChange={(e) => setDistance(parseFloat(e.target.value))} />
        </label>
        <label className="block text-[12px]">
          <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50">Transparency {alpha.toFixed(2)}</span>
          <input className="h-11 w-full accent-violet-400" type="range" min={0.05} max={0.85} step={0.01} value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value))} />
        </label>
        <label className="block text-[12px]">
          <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50">Fold progress {progress.toFixed(2)}</span>
          <input className="h-11 w-full accent-cyan-400" type="range" min={0} max={1} step={0.01} value={progress} onChange={(e) => setProgress(parseFloat(e.target.value))} />
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setPerspective((v) => !v)} className="min-h-11 rounded-sm border border-border/40 px-3 font-mono text-[9px] uppercase tracking-[0.12em]">
            {perspective ? "Perspective" : "Orthographic"}
          </button>
          <button type="button" onClick={() => { setWire((v) => !v); setMode("hybrid"); }} className={`min-h-11 rounded-sm border px-3 font-mono text-[9px] uppercase tracking-[0.12em] ${wire ? "border-cyan-400/50 text-cyan-100" : "border-border/40"}`}>
            Wire {wire ? "on" : "off"}
          </button>
          <button type="button" onClick={() => { setSurface((v) => !v); setMode("hybrid"); }} className={`min-h-11 rounded-sm border px-3 font-mono text-[9px] uppercase tracking-[0.12em] ${surface ? "border-amber-400/50 text-amber-100" : "border-border/40"}`}>
            Surface {surface ? "on" : "off"}
          </button>
          <button type="button" onClick={() => setChirality((c) => c === "cw" ? "ccw" : "cw")} className="min-h-11 rounded-sm border border-border/40 px-3 font-mono text-[9px] uppercase tracking-[0.12em]">
            Chirality {chirality}
          </button>
        </div>
        <label className="block text-[12px]">
          <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50">Net</span>
          <select
            className="h-11 w-full border border-border/40 bg-background px-2 text-sm"
            value={netIdx}
            onChange={(e) => setNetIdx(parseInt(e.target.value, 10))}
          >
            {NET_LABELS.map((label, i) => <option key={label} value={i}>{label}</option>)}
          </select>
        </label>
        {PLANE_KEYS.map((key) => (
          <label key={key} className="block text-[12px]">
            <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50">
              {key.toUpperCase()} offset {offsets[key].toFixed(2)}
              {LEGACY_PLANE_RATES[key] ? " · legacy spin" : " · manual only"}
            </span>
            <input
              className="h-11 w-full accent-violet-400"
              type="range" min={-Math.PI} max={Math.PI} step={0.01} value={offsets[key]}
              onChange={(e) => setOffsets((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))}
              aria-label={`${key} rotation offset`}
            />
          </label>
        ))}
      </div>
      <p className="max-w-3xl text-[12px] leading-relaxed text-muted-foreground/70">
        XW, YZ, and XY keep the original automatic rates. XZ, YW, and ZW stay still until you move their offsets.
        A cell that appears inside another cell has been projected, not turned inside out.
        The fold uses the same eleven nets and the same chirality tree as the explorer below. The two panels do not share one slider.
      </p>
    </div>
  );
}
