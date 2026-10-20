import { useEffect, useRef, useState, type KeyboardEvent } from "react";
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
import "./inside-out.css";

type Mode = "wire" | "hybrid" | "surface" | "worm";
type ViewId = "projection" | "fold" | "compare";
type TabId = "structure" | "projection" | "motion" | "inspect";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "projection", label: "Projection" },
  { id: "fold", label: "Cube fold" },
  { id: "compare", label: "Compare" },
];

const TABS: { id: TabId; label: string }[] = [
  { id: "structure", label: "Structure" },
  { id: "projection", label: "Projection" },
  { id: "motion", label: "Motion" },
  { id: "inspect", label: "Inspect" },
];

const PLANE_LABELS: { key: keyof PlaneAngles; label: string }[] = [
  { key: "xy", label: "XY rotation" },
  { key: "xz", label: "XZ rotation" },
  { key: "xw", label: "XW rotation" },
  { key: "yz", label: "YZ rotation" },
  { key: "yw", label: "YW rotation" },
  { key: "zw", label: "ZW rotation" },
];

const MODE_BUTTONS: { id: Mode; label: string }[] = [
  { id: "wire", label: "Wireframe" },
  { id: "hybrid", label: "Hybrid" },
  { id: "surface", label: "Surfaces" },
  { id: "worm", label: "Worm tube" },
];

function useWideScreen() {
  const [wide, setWide] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const apply = () => setWide(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return wide;
}

function resize(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const r = canvas.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return 0;
  canvas.width = r.width * dpr;
  canvas.height = r.height * dpr;
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
  if (!dpr) return;
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
  if (!dpr) return;
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
  const [perspective, setPerspective] = useState(true);
  const [distance, setDistance] = useState(2.2);
  const [alpha, setAlpha] = useState(0.28);
  const [progress, setProgress] = useState(0.65);
  const [netIdx, setNetIdx] = useState(0);
  const [chirality, setChirality] = useState<Chirality>("cw");
  const [offsets, setOffsets] = useState<PlaneAngles>({ ...ZERO_PLANES });
  const [integral, setIntegral] = useState<PlaneAngles>({ ...ZERO_PLANES, yz: 0.3 });
  const [view, setView] = useState<ViewId>("projection");
  const [tab, setTab] = useState<TabId>("projection");
  const [collapsed, setCollapsed] = useState(false);
  const [full, setFull] = useState(false);
  const wide = useWideScreen();

  const runRef = useRef(running);
  const revRef = useRef(reverse);
  const slowRef = useRef(slow);
  const speedRef = useRef(speed);
  const modeRef = useRef(mode);
  const perspRef = useRef(perspective);
  const distRef = useRef(distance);
  const alphaRef = useRef(alpha);
  const progRef = useRef(progress);
  const netRef = useRef(netIdx);
  const chiRef = useRef(chirality);
  const offRef = useRef(offsets);
  const wideRef = useRef(wide);
  const viewRef = useRef(view);
  const tabRef = useRef(tab);
  runRef.current = running;
  revRef.current = reverse;
  slowRef.current = slow;
  speedRef.current = speed;
  modeRef.current = mode;
  perspRef.current = perspective;
  distRef.current = distance;
  alphaRef.current = alpha;
  progRef.current = progress;
  netRef.current = netIdx;
  chiRef.current = chirality;
  offRef.current = offsets;
  wideRef.current = wide;
  viewRef.current = view;
  tabRef.current = tab;

  useEffect(() => {
    const tess = tessRef.current;
    const fold = foldRef.current;
    if (!tess || !fold) return;
    let raf = 0;
    let dead = false;
    let last = performance.now();
    let lastPublish = 0;
    const frame = (now: number) => {
      if (dead) return;
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
      const drawMode = modeRef.current;
      const showTess = wideRef.current || viewRef.current === "projection" || viewRef.current === "compare";
      const showFold = wideRef.current || viewRef.current === "fold" || viewRef.current === "compare";
      tess.dataset.xw = anglesRef.current.xw.toFixed(6);
      fold.dataset.progress = progRef.current.toFixed(4);
      if (showTess) {
        paintTesseract(tess, totals, distRef.current, perspRef.current, drawMode, alphaRef.current, artRef.current);
      }
      if (showFold) {
        paintFold(
          fold,
          progRef.current,
          netRef.current,
          chiRef.current,
          drawMode === "worm" ? "hybrid" : drawMode,
          alphaRef.current,
        );
      }
      if (tabRef.current === "inspect" && now - lastPublish > 200) {
        lastPublish = now;
        setIntegral({ ...anglesRef.current });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(() => { /* the next frame reads the new rect */ });
    ro.observe(tess);
    ro.observe(fold);
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!full) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [full]);

  function onTabKey(event: KeyboardEvent<HTMLDivElement>) {
    const key = event.key;
    if (key !== "ArrowRight" && key !== "ArrowLeft" && key !== "Home" && key !== "End") return;
    event.preventDefault();
    const ids = TABS.map((item) => item.id);
    const index = ids.indexOf(tab);
    const next = key === "Home"
      ? ids[0]
      : key === "End"
        ? ids[ids.length - 1]
        : ids[(index + (key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length];
    setTab(next);
    document.getElementById(`io-tab-${next}`)?.focus();
  }

  const projectionLive = wide || view === "projection" || view === "compare";
  const foldLive = wide || view === "fold" || view === "compare";
  const closes = netFoldCloses(netIdx, chirality);
  const modeLabel = mode === "worm" ? "Artistic tube" : mode;

  return (
    <div className={`io-cockpit${full ? " is-full" : ""}`} data-view={view}>
      <div className="io-stage">
        <figure
          className="io-pane"
          data-pane="projection"
          data-live={projectionLive ? "true" : "false"}
          aria-hidden={projectionLive ? undefined : true}
        >
          <figcaption className="io-cap">
            <span>4D projection</span>
            <span>{modeLabel}</span>
          </figcaption>
          <p className="io-pane-note">
            {mode === "worm"
              ? "Artistic tube. Not a 4D projection and not the cube fold."
              : "Perspective drawing of the hypercube. A nested cell is not an eversion."}
          </p>
          <div className="io-view">
            <canvas ref={tessRef} aria-label="Tesseract projection or artistic worm tube" />
          </div>
        </figure>
        <figure
          className="io-pane"
          data-pane="fold"
          data-live={foldLive ? "true" : "false"}
          aria-hidden={foldLive ? undefined : true}
        >
          <figcaption className="io-cap">
            <span>Cube-net fold</span>
            <span>3D paper</span>
          </figcaption>
          <p className="io-pane-note">Six squares hinge into a cube. This is not a hypercube unfolding.</p>
          <div className="io-view">
            <canvas ref={foldRef} aria-label="Cube net hinge fold" />
          </div>
        </figure>
      </div>

      <section className="io-dock" aria-label="Inside-Out controls">
        <div className="io-dock-top">
          <p className="io-status" aria-live="polite">
            <span>{speed.toFixed(2)}×</span>
            <span>{running ? (reverse ? "Reversed" : "Running") : "Paused"}</span>
            <span>{slow ? "Slow motion" : "Full rate"}</span>
            <span>{modeLabel}</span>
            <span>{NET_LABELS[netIdx]}</span>
          </p>
          <div className="io-tools">
            <button type="button" className="io-tool" aria-pressed={collapsed} onClick={() => setCollapsed((v) => !v)}>
              {collapsed ? "Show controls" : "Hide controls"}
            </button>
            <button type="button" className="io-tool" aria-pressed={full} onClick={() => setFull((v) => !v)}>
              {full ? "Exit stage" : "Expand stage"}
            </button>
          </div>
        </div>
        <p className="io-hint">Nesting is not eversion. The paper fold is not a hypercube unfolding.</p>
        <div className="io-views" role="group" aria-label="Which viewport">
          {VIEWS.map((item) => (
            <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        {collapsed ? null : (
          <>
            <div className="io-tabs" role="tablist" aria-label="Control groups" onKeyDown={onTabKey}>
              {TABS.map((item) => (
                <button
                  key={item.id}
                  id={`io-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  aria-controls={`io-panel-${item.id}`}
                  tabIndex={tab === item.id ? 0 : -1}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="io-panel" role="tabpanel" id={`io-panel-${tab}`} aria-labelledby={`io-tab-${tab}`}>
              {tab === "structure" && (
                <>
                  <label className="io-field">
                    <span>
                      <span>Cube net</span>
                      <span>{netIdx + 1} / {NET_LABELS.length}</span>
                    </span>
                    <select
                      aria-label="Cube net"
                      value={netIdx}
                      onChange={(event) => setNetIdx(parseInt(event.target.value, 10))}
                    >
                      {NET_LABELS.map((label, i) => <option key={label} value={i}>{label}</option>)}
                    </select>
                  </label>
                  <div className="io-row">
                    <button type="button" className="io-choice" aria-pressed={chirality === "cw"} onClick={() => setChirality("cw")}>
                      Clockwise fold
                    </button>
                    <button type="button" className="io-choice" aria-pressed={chirality === "ccw"} onClick={() => setChirality("ccw")}>
                      Counterclockwise fold
                    </button>
                  </div>
                  <Slider
                    label="Fold progress"
                    min={0}
                    max={1}
                    step={0.01}
                    value={progress}
                    onChange={setProgress}
                    display={`${progress.toFixed(2)} of 1`}
                  />
                  <p className="io-hint">
                    {NET_LABELS[netIdx]} {closes ? "closes" : "does not close"}.{" "}
                    {closes
                      ? "At progress 1 its spanning tree hinges into a cube of side 2."
                      : "This grid has an extra join, so a right-angle fold is not a cube."}
                    {" "}The fold is paper in 3D. It is not a 4D unfolding, and it does not turn the tesseract.
                  </p>
                </>
              )}
              {tab === "projection" && (
                <>
                  <div className="io-row">
                    {MODE_BUTTONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={item.id === "worm" ? "io-choice is-art" : "io-choice"}
                        aria-pressed={mode === item.id}
                        onClick={() => setMode(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                    <button type="button" className="io-choice" aria-pressed={perspective} onClick={() => setPerspective((v) => !v)}>
                      {perspective ? "Perspective" : "Orthographic"}
                    </button>
                  </div>
                  <Slider
                    label="Projection distance"
                    min={1.6}
                    max={6}
                    step={0.05}
                    value={distance}
                    onChange={setDistance}
                    display={perspective ? distance.toFixed(2) : `slider ${distance.toFixed(2)} · ignored`}
                  />
                  <Slider
                    label="Surface transparency"
                    min={0.05}
                    max={0.85}
                    step={0.01}
                    value={alpha}
                    onChange={setAlpha}
                    display={alpha.toFixed(2)}
                  />
                  <p className="io-hint">
                    Wire, hybrid, and surfaces draw the same 4D projection. Orthographic projection ignores the distance slider and keeps the value for when perspective returns.
                  </p>
                  {mode === "worm" && <p className="io-warn">{WORM_TUBE_WARNING}</p>}
                </>
              )}
              {tab === "motion" && (
                <>
                  <div className="io-row">
                    <button type="button" className="io-choice" aria-pressed={running} onClick={() => setRunning((v) => !v)}>
                      {running ? "Pause" : "Play"}
                    </button>
                    <button type="button" className="io-choice" aria-pressed={reverse} onClick={() => setReverse((v) => !v)}>
                      {reverse ? "Reversed" : "Reverse"}
                    </button>
                    <button type="button" className="io-choice" aria-pressed={slow} onClick={() => setSlow((v) => !v)}>
                      Slow motion
                    </button>
                  </div>
                  <Slider
                    label="Speed multiplier"
                    min={0.25}
                    max={3}
                    step={0.05}
                    value={speed}
                    onChange={setSpeed}
                    display={`${speed.toFixed(2)}×`}
                  />
                  <p className="io-hint">
                    Play, pause, reverse, and slow motion continue the same integral. Slow motion multiplies the rate by 0.25. Switching viewports does not restart it. XW, YZ, and XY also spin on their own. XZ, YW, and ZW move only from these offsets.
                  </p>
                  {PLANE_LABELS.map(({ key, label }) => (
                    <Slider
                      key={key}
                      label={`${key.toUpperCase()} rotation offset`}
                      caption={label}
                      hint={LEGACY_PLANE_RATES[key] ? "legacy spin" : "manual only"}
                      min={-Math.PI}
                      max={Math.PI}
                      step={0.01}
                      value={offsets[key]}
                      onChange={(value) => setOffsets((prev) => ({ ...prev, [key]: value }))}
                      display={`${offsets[key].toFixed(2)} rad`}
                    />
                  ))}
                </>
              )}
              {tab === "inspect" && (
                <>
                  <ul className="io-readout" aria-label="Current settings">
                    <li>Mode {modeLabel}. {mode === "worm" ? "The tube is artistic and ignores the 4D angles." : "This is the mathematical projection."}</li>
                    <li>Net {NET_LABELS[netIdx]}, {chirality}, progress {progress.toFixed(2)}. {closes ? "Closes at 1." : "Does not close."}</li>
                    <li>{perspective ? `Perspective, distance ${distance.toFixed(2)}` : "Orthographic, distance slider ignored"} · transparency {alpha.toFixed(2)}</li>
                    <li>{running ? "Integral running" : "Integral held"} · {reverse ? "reversed" : "forward"} · {slow ? "×0.25" : "full rate"} · speed {speed.toFixed(2)}×</li>
                  </ul>
                  <p className="io-hint">
                    Totals are the running integral plus the offset. YZ starts at 0.30 rad. The other planes start at 0. A hidden pane is not redrawn, but the integral keeps going.
                  </p>
                  <ul className="io-readout" aria-label="Total plane angles">
                    {PLANE_LABELS.map(({ key, label }) => (
                      <li key={key}>
                        {label} {(integral[key] + offsets[key]).toFixed(3)} rad
                        {" "}· offset {offsets[key].toFixed(2)} rad
                        {LEGACY_PLANE_RATES[key] ? " · legacy spin" : " · manual only"}
                      </li>
                    ))}
                  </ul>
                  <p className="io-hint">
                    Nested cells are a perspective drawing, not a topological eversion. The cube-net fold is not an unfolding of this hypercube. Nothing here is an eight-cell hypercross.
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Slider({
  label, caption, hint, min, max, step, value, onChange, display,
}: {
  label: string;
  caption?: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  display: string;
}) {
  return (
    <label className="io-slider">
      <span>
        <span>{caption ?? label}{hint ? ` · ${hint}` : ""}</span>
        <span>{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(parseFloat(event.target.value))}
      />
    </label>
  );
}
