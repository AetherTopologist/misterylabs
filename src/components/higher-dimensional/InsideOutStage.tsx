import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  CubeNetDiagram,
  FACE_COLORS,
  NET_LABELS,
  computeUnfoldPath,
  type Chirality,
} from "@/components/CubeNetExplorer";
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
type LabId = "cube" | "four" | "compare";
type FocusId = "both" | "net" | "fold";
type TabId = "projection" | "motion" | "inspect";
type Pt = [number, number, number];

const LAB_KEY = "misterylabs.inside-out.lab";

const LABS: { id: LabId; label: string }[] = [
  { id: "cube", label: "Cube" },
  { id: "four", label: "4D" },
  { id: "compare", label: "Compare" },
];

const TABS: { id: TabId; label: string }[] = [
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

const FACE_NAMES = ["Front", "Back", "Top", "Bottom", "Right", "Left"] as const;

type ScreenPoly = { fi: number; pts: [number, number][] };

function storedLab(): LabId {
  if (typeof window === "undefined") return "cube";
  try {
    const value = window.localStorage.getItem(LAB_KEY);
    if (value === "cube" || value === "four" || value === "compare") return value;
  } catch { /* private mode */ }
  return "cube";
}

function resize(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return 0;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  return dpr;
}

/** Uniform scale of an already-projected drawing. Does not change the projection. */
function fitTransform(points: Pt[], width: number, height: number, margin = 0.12) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const point of points) {
    if (point[0] < minX) minX = point[0];
    if (point[1] < minY) minY = point[1];
    if (point[0] > maxX) maxX = point[0];
    if (point[1] > maxY) maxY = point[1];
  }
  const spanX = Math.max(1e-4, maxX - minX);
  const spanY = Math.max(1e-4, maxY - minY);
  const scale = Math.min((width * (1 - 2 * margin)) / spanX, (height * (1 - 2 * margin)) / spanY);
  return {
    scale,
    ox: (width - (minX + maxX) * scale) / 2,
    oy: (height - (minY + maxY) * scale) / 2,
  };
}

function applyFit(point: Pt, fit: { scale: number; ox: number; oy: number }): Pt {
  return [fit.ox + point[0] * fit.scale, fit.oy + point[1] * fit.scale, point[2]];
}

function projectFold(point: V3, origin: V3): Pt {
  const x = point[0] - origin[0];
  const y = point[1] - origin[1];
  const z = point[2] - origin[2];
  const yaw = 0.7;
  const pitch = 0.45;
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
  const perspective = 1 / (3.2 - z2 * 0.15);
  return [x1 * perspective, -y2 * perspective, z2];
}

function paintFold(
  canvas: HTMLCanvasElement,
  progress: number,
  netIdx: number,
  chirality: Chirality,
  selected: number | null,
  polys: ScreenPoly[],
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = resize(canvas);
  if (!dpr) return;
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#05060c";
  ctx.fillRect(0, 0, width, height);

  const faces = foldCube(netIdx, progress, chirality);
  const origin: V3 = [0, 0, 0];
  let count = 0;
  for (const face of faces) for (const point of face) {
    origin[0] += point[0]; origin[1] += point[1]; origin[2] += point[2]; count++;
  }
  origin[0] /= count; origin[1] /= count; origin[2] /= count;

  const raw = faces.map((face) => face.map((point) => projectFold(point, origin)));
  const fit = fitTransform(raw.flat(), width, height, 0.08);
  const order = computeUnfoldPath(netIdx, chirality).order;
  const drawn = raw.map((face, fi) => {
    const pts = face.map((point) => applyFit(point, fit));
    const depth = pts.reduce((sum, point) => sum + point[2], 0) / pts.length;
    return { fi, pts, depth };
  }).sort((a, b) => a.depth - b.depth);

  polys.length = 0;
  for (const { fi, pts } of drawn) {
    const color = FACE_COLORS[fi];
    const on = selected === fi;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const point of pts.slice(1)) ctx.lineTo(point[0], point[1]);
    ctx.closePath();
    ctx.fillStyle = color.fill.replace("0.82", on ? "0.94" : "0.62");
    ctx.fill();
    ctx.strokeStyle = on ? "#f8fafc" : color.stroke;
    ctx.lineWidth = (on ? 2.6 : 1.25) * dpr;
    ctx.stroke();
    polys.push({ fi, pts: pts.map((point) => [point[0] / dpr, point[1] / dpr]) });
  }

  if (selected != null) {
    const hit = drawn.find((face) => face.fi === selected);
    if (hit) {
      const sx = hit.pts.reduce((sum, point) => sum + point[0], 0) / hit.pts.length;
      const sy = hit.pts.reduce((sum, point) => sum + point[1], 0) / hit.pts.length;
      const step = order.indexOf(selected) + 1;
      ctx.beginPath();
      ctx.arc(sx, sy, 12 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(5,6,12,0.88)";
      ctx.fill();
      ctx.lineWidth = 1.5 * dpr;
      ctx.strokeStyle = "#f8fafc";
      ctx.stroke();
      ctx.fillStyle = "#f8fafc";
      ctx.font = `700 ${12 * dpr}px "JetBrains Mono",ui-monospace,monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(step), sx, sy);
    }
  }
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
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#05060c";
  ctx.fillRect(0, 0, width, height);

  if (mode === "worm") {
    const quads = wormTubeQuads(artTime);
    const raw = quads.map((quad) => quad.pts.map((point): Pt => {
      const z = 3.2 - point[2];
      const scale = 1 / z;
      return [point[0] * scale, -point[1] * scale, point[2]];
    }));
    const fit = fitTransform(raw.flat(), width, height, 0.08);
    raw.forEach((quad) => {
      const pts = quad.map((point) => applyFit(point, fit));
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const point of pts.slice(1)) ctx.lineTo(point[0], point[1]);
      ctx.closePath();
      ctx.fillStyle = `rgba(125, 211, 252, ${Math.max(0.04, alpha * 0.45)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(226, 232, 240, ${Math.max(0.08, alpha * 0.35)})`;
      ctx.lineWidth = 0.6 * dpr;
      ctx.stroke();
    });
    return;
  }

  const d4 = projectionDistance(perspective, distance);
  const raw = T_VERTS.map((vertex) => {
    const rotated = applyPlanes(vertex, angles);
    return proj3to2(proj4to3(rotated, d4), 3.5, 1, 0, 0);
  });
  const fit = fitTransform(raw, width, height, 0.08);
  const verts = raw.map((point) => applyFit(point, fit));
  const showSurface = mode === "surface" || mode === "hybrid";
  const showWire = mode === "wire" || mode === "hybrid";
  if (showSurface) {
    const faces = T_FACES.map((ids) => {
      const pts = ids.map((index) => verts[index]);
      const depth = pts.reduce((sum, point) => sum + point[2], 0) / pts.length;
      const w = ids.reduce((sum, index) => sum + T_VERTS[index][3], 0) / ids.length;
      return { pts, depth, w };
    }).sort((a, b) => a.depth - b.depth);
    for (const face of faces) {
      ctx.beginPath();
      ctx.moveTo(face.pts[0][0], face.pts[0][1]);
      for (const point of face.pts.slice(1)) ctx.lineTo(point[0], point[1]);
      ctx.closePath();
      const color = face.w > 0.5 ? "34,211,238" : face.w < -0.5 ? "251,191,36" : "167,139,250";
      ctx.fillStyle = `rgba(${color},${Math.max(0.04, alpha)})`;
      ctx.fill();
    }
  }
  if (showWire) {
    const edges = T_EDGES.map(([a, b, kind]) => ({
      a, b, kind, depth: (verts[a][2] + verts[b][2]) / 2,
    })).sort((left, right) => left.depth - right.depth);
    for (const edge of edges) {
      const t = Math.max(0, Math.min(1, (edge.depth + width) / (2 * width)));
      const opacity = 0.25 + t * 0.7;
      ctx.strokeStyle = edge.kind === "outer"
        ? `rgba(34,211,238,${opacity})`
        : edge.kind === "inner"
          ? `rgba(251,191,36,${opacity})`
          : `rgba(167,139,250,${opacity})`;
      ctx.lineWidth = (0.9 + t * 1.1) * dpr;
      ctx.beginPath();
      ctx.moveTo(verts[edge.a][0], verts[edge.a][1]);
      ctx.lineTo(verts[edge.b][0], verts[edge.b][1]);
      ctx.stroke();
    }
  }
}

function pointInPoly(x: number, y: number, pts: [number, number][]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const crosses = (yi > y) !== (yj > y)
      && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function InsideOutStage() {
  const tessRef = useRef<HTMLCanvasElement>(null);
  const foldRef = useRef<HTMLCanvasElement>(null);
  const foldPolys = useRef<ScreenPoly[]>([]);
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
  const [selected, setSelected] = useState<number | null>(null);
  const [offsets, setOffsets] = useState<PlaneAngles>({ ...ZERO_PLANES });
  const [integral, setIntegral] = useState<PlaneAngles>({ ...ZERO_PLANES, yz: 0.3 });
  const [lab, setLab] = useState<LabId>(storedLab);
  const [focus, setFocus] = useState<FocusId>("both");
  const [controls, setControls] = useState<"cube" | "four">("cube");
  const [tab, setTab] = useState<TabId>("projection");
  const [collapsed, setCollapsed] = useState(false);
  const [full, setFull] = useState(false);

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
  const selectedRef = useRef(selected);
  const offRef = useRef(offsets);
  const labRef = useRef(lab);
  const focusRef = useRef(focus);
  const controlsRef = useRef(controls);
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
  selectedRef.current = selected;
  offRef.current = offsets;
  labRef.current = lab;
  focusRef.current = focus;
  controlsRef.current = controls;
  tabRef.current = tab;

  useEffect(() => {
    try { window.localStorage.setItem(LAB_KEY, lab); } catch { /* private mode */ }
  }, [lab]);

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
      const currentLab = labRef.current;
      const cubeOn = currentLab === "cube" || currentLab === "compare";
      const fourOn = currentLab === "four" || currentLab === "compare";
      const foldOn = cubeOn && focusRef.current !== "net";
      const tessOn = fourOn;
      fold.dataset.progress = progRef.current.toFixed(4);
      fold.dataset.face = selectedRef.current == null ? "" : String(selectedRef.current);
      tess.dataset.xw = anglesRef.current.xw.toFixed(6);
      if (tessOn) {
        paintTesseract(
          tess,
          totals,
          distRef.current,
          perspRef.current,
          modeRef.current,
          alphaRef.current,
          artRef.current,
        );
      }
      if (foldOn) {
        paintFold(fold, progRef.current, netRef.current, chiRef.current, selectedRef.current, foldPolys.current);
      }
      const inspectOn = tabRef.current === "inspect" && (
        currentLab === "four" || (currentLab === "compare" && controlsRef.current === "four")
      );
      if (inspectOn && now - lastPublish > 200) {
        lastPublish = now;
        setIntegral({ ...anglesRef.current });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const observer = new ResizeObserver(() => { /* the next frame reads the new rect */ });
    observer.observe(tess);
    observer.observe(fold);
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!full) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [full]);

  function onFoldPointer(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = foldRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hits = foldPolys.current;
    for (let i = hits.length - 1; i >= 0; i--) {
      if (pointInPoly(x, y, hits[i].pts)) {
        setSelected(hits[i].fi);
        return;
      }
    }
  }

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

  const cubeOn = lab === "cube" || lab === "compare";
  const fourOn = lab === "four" || lab === "compare";
  const netLive = cubeOn && focus !== "fold";
  const foldLive = cubeOn && focus !== "net";
  const tessLive = fourOn;
  const showCubeDock = !collapsed && (lab === "cube" || (lab === "compare" && controls === "cube"));
  const showFourDock = !collapsed && (lab === "four" || (lab === "compare" && controls === "four"));
  const closes = netFoldCloses(netIdx, chirality);
  const unfold = computeUnfoldPath(netIdx, chirality);
  const step = selected == null ? null : unfold.order.indexOf(selected) + 1;
  const modeLabel = mode === "worm" ? "Artistic tube" : mode;
  const selectedName = selected == null ? null : FACE_NAMES[selected];

  return (
    <div
      className={`io-cockpit${full ? " is-full" : ""}`}
      data-lab={lab}
      data-focus={focus}
      data-net={netIdx}
      data-chirality={chirality}
      data-progress={progress.toFixed(2)}
      data-face={selected ?? ""}
    >
      <div className="io-stage">
        <section className="io-lab" data-lab-pane="cube" data-live={cubeOn ? "true" : "false"} aria-hidden={cubeOn ? undefined : true}>
          <div className="io-cube-pair">
            <figure className="io-pane" data-pane="net" data-live={netLive ? "true" : "false"} aria-hidden={netLive ? undefined : true}>
              <figcaption className="io-cap">
                <span>Flat net</span>
                <span>{NET_LABELS[netIdx]}</span>
              </figcaption>
              <p className="io-pane-note">Five spanning-tree hinges. Not every shared side.</p>
              <div className="io-view">
                <CubeNetDiagram
                  netIdx={netIdx}
                  chirality={chirality}
                  activeFace={selected}
                  hinges
                  fit="contain"
                  onFaceSelect={setSelected}
                  label={`Cube net ${netIdx + 1}: ${NET_LABELS[netIdx]}`}
                />
              </div>
            </figure>
            <figure className="io-pane" data-pane="fold" data-live={foldLive ? "true" : "false"} aria-hidden={foldLive ? undefined : true}>
              <figcaption className="io-cap">
                <span>Hinged fold</span>
                <span>{chirality === "cw" ? "Clockwise" : "Counterclockwise"}</span>
              </figcaption>
              <p className="io-pane-note">Progress 0 is the flat net. Progress 1 is fully folded. Not a hypercube.</p>
              <div className="io-view">
                <canvas
                  ref={foldRef}
                  aria-label="Cube net hinge fold"
                  onPointerDown={onFoldPointer}
                />
              </div>
            </figure>
          </div>
          <div className="io-cube-bar">
            <Slider
              label="Fold progress"
              min={0}
              max={1}
              step={0.01}
              value={progress}
              onChange={setProgress}
              display={`${progress.toFixed(2)} · 0 flat, 1 folded`}
            />
          </div>
        </section>

        <section className="io-lab" data-lab-pane="four" data-live={tessLive ? "true" : "false"} aria-hidden={tessLive ? undefined : true}>
          <figure className="io-pane" data-pane="projection" data-live={tessLive ? "true" : "false"}>
            <figcaption className="io-cap">
              <span>4D projection</span>
              <span>{modeLabel}</span>
            </figcaption>
            <p className="io-pane-note">
              {mode === "worm"
                ? "Artistic tube. Not a 4D projection and not the cube fold."
                : "Perspective drawing of the hypercube. A nested cell is not an inside-out cube."}
            </p>
            <div className="io-view">
              <canvas ref={tessRef} aria-label="Tesseract projection or artistic worm tube" />
            </div>
          </figure>
        </section>
      </div>

      <section className="io-dock" aria-label="Inside-Out controls">
        <div className="io-dock-top">
          <p className="io-status" aria-live="polite">
            {lab !== "four" && (
              <>
                <span>{NET_LABELS[netIdx]}</span>
                <span>{chirality}</span>
                <span>{progress.toFixed(2)}</span>
              </>
            )}
            {lab !== "cube" && (
              <>
                <span>{speed.toFixed(2)}×</span>
                <span>{running ? (reverse ? "Reversed" : "Running") : "Paused"}</span>
                <span>{modeLabel}</span>
              </>
            )}
          </p>
          <div className="io-tools">
            <button type="button" className="io-tool" aria-pressed={collapsed} onClick={() => setCollapsed((value) => !value)}>
              {collapsed ? "Show controls" : "Hide controls"}
            </button>
            <button type="button" className="io-tool" aria-pressed={full} onClick={() => setFull((value) => !value)}>
              {full ? "Exit stage" : "Expand stage"}
            </button>
          </div>
        </div>
        <div className="io-views" role="group" aria-label="Laboratory">
          {LABS.map((item) => (
            <button key={item.id} type="button" aria-pressed={lab === item.id} onClick={() => setLab(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <p className="io-hint">Nesting is not eversion. The amber dashes are the five spanning-tree hinges.</p>
        {lab === "compare" && !collapsed && (
          <div className="io-views" role="group" aria-label="Compare controls">
            <button type="button" aria-pressed={controls === "cube"} onClick={() => setControls("cube")}>Cube controls</button>
            <button type="button" aria-pressed={controls === "four"} onClick={() => setControls("four")}>4D controls</button>
          </div>
        )}

        {showCubeDock && (
          <div className="io-panel">
            <div className="io-row" role="group" aria-label="Cube panel focus">
              <button type="button" className="io-choice" aria-pressed={focus === "both"} onClick={() => setFocus("both")}>Both views</button>
              <button type="button" className="io-choice" aria-pressed={focus === "net"} onClick={() => setFocus("net")}>Net only</button>
              <button type="button" className="io-choice" aria-pressed={focus === "fold"} onClick={() => setFocus("fold")}>Fold only</button>
            </div>
            <p className="io-face-readout" data-testid="cube-selection">
              <span>{selectedName == null ? "No face selected" : `${selectedName} · step ${step}`}</span>
              <button type="button" className="io-choice" onClick={() => setSelected(null)}>Clear face</button>
            </p>
            <label className="io-field">
              <span>
                <span>Cube net</span>
                <span>{netIdx + 1} / {NET_LABELS.length}</span>
              </span>
              <select aria-label="Cube net" value={netIdx} onChange={(event) => setNetIdx(parseInt(event.target.value, 10))}>
                {NET_LABELS.map((label, index) => <option key={label} value={index}>{label}</option>)}
              </select>
            </label>
            <div className="io-row" aria-label="Net index">
              {NET_LABELS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className="io-choice"
                  aria-pressed={netIdx === index}
                  aria-label={`Select ${label}`}
                  onClick={() => setNetIdx(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="io-row">
              <button type="button" className="io-choice" aria-pressed={chirality === "cw"} onClick={() => setChirality("cw")}>
                Clockwise fold
              </button>
              <button type="button" className="io-choice" aria-pressed={chirality === "ccw"} onClick={() => setChirality("ccw")}>
                Counterclockwise fold
              </button>
            </div>
            <p className="io-hint">
              {NET_LABELS[netIdx]} {closes ? "closes" : "does not close"}.{" "}
              {closes
                ? "At progress 1 its spanning tree hinges into a cube of side 2."
                : "This grid has an extra join, so a right-angle fold is not a cube."}
              {" "}The fold is paper in 3D. It is not a 4D unfolding, and it does not turn the tesseract.
            </p>
          </div>
        )}

        {showFourDock && (
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
                    <button type="button" className="io-choice" aria-pressed={perspective} onClick={() => setPerspective((value) => !value)}>
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
                    Wire, hybrid, and surfaces draw the same 4D projection. Orthographic projection ignores the distance slider and keeps the value for when perspective returns. Transparency belongs to this drawing, not to the paper fold.
                  </p>
                  {mode === "worm" && <p className="io-warn">{WORM_TUBE_WARNING}</p>}
                </>
              )}
              {tab === "motion" && (
                <>
                  <div className="io-row">
                    <button type="button" className="io-choice" aria-pressed={running} onClick={() => setRunning((value) => !value)}>
                      {running ? "Pause" : "Play"}
                    </button>
                    <button type="button" className="io-choice" aria-pressed={reverse} onClick={() => setReverse((value) => !value)}>
                      {reverse ? "Reversed" : "Reverse"}
                    </button>
                    <button type="button" className="io-choice" aria-pressed={slow} onClick={() => setSlow((value) => !value)}>
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
                    Play, pause, reverse, and slow motion continue the same integral. Slow motion multiplies the rate by 0.25. Switching laboratories does not restart it. XW, YZ, and XY also spin on their own. XZ, YW, and ZW move only from these offsets.
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
                    Totals are the running integral plus the offset. YZ starts at 0.30 rad. The other planes start at 0. A hidden laboratory is not redrawn, but the integral keeps going.
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
