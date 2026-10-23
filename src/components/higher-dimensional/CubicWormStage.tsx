import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import {
  W_PLANES,
  ZERO_ANGLES,
  buildWormModel,
  type CellId,
  type CellRole,
  type FaceRole,
  type PairId,
  type PlaneAngles,
  type PlaneId,
  type ProjectedCell,
  type ProjectedFace,
  type Axis,
} from "@/instruments/higher-dimensional/cubic-worm-math";
import "./cubic-worm.css";

type Mode = "geometry" | "worm" | "reveal";
type TabId = "turn" | "look" | "read";

const MODES: { id: Mode; label: string }[] = [
  { id: "geometry", label: "Geometry" },
  { id: "worm", label: "Cubic Worm" },
  { id: "reveal", label: "Reveal" },
];

const PAIRS: { id: PairId; label: string; axis: Axis }[] = [
  { id: "w", label: "W", axis: 3 },
  { id: "x", label: "X", axis: 0 },
  { id: "y", label: "Y", axis: 1 },
  { id: "z", label: "Z", axis: 2 },
];

const VIEWS: { axis: Axis; label: string }[] = [
  { axis: 0, label: "View X" },
  { axis: 1, label: "View Y" },
  { axis: 2, label: "View Z" },
];

const COLOR: Record<CellId, string> = {
  "w-": "222, 206, 170",
  "w+": "126, 176, 204",
  "x-": "104, 148, 102",
  "x+": "190, 122, 82",
  "y-": "122, 118, 112",
  "y+": "206, 184, 124",
  "z-": "92, 84, 76",
  "z+": "158, 148, 136",
};

const AXIS_NAME = ["x", "y", "z", "w"];

const DEFAULT_YAW = 0.02;
const DEFAULT_PITCH = 0.2;

type Pt = [number, number, number];

function resize(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return 0;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  return dpr;
}

function camera(p: Pt, yaw: number, pitch: number): Pt {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = p[0] * cy + p[2] * sy;
  const z1 = -p[0] * sy + p[2] * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return [x1, p[1] * cp - z1 * sp, p[1] * sp + z1 * cp];
}

function fit2d(points: Pt[], width: number, height: number, margin = 0.1) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p[0]);
    minY = Math.min(minY, p[1]);
    maxX = Math.max(maxX, p[0]);
    maxY = Math.max(maxY, p[1]);
  }
  const bw = Math.max(1e-4, maxX - minX);
  const bh = Math.max(1e-4, maxY - minY);
  const s = Math.min((width * (1 - 2 * margin)) / bw, (height * (1 - 2 * margin)) / bh);
  const ox = (width - (minX + maxX) * s) / 2;
  const oy = (height - (minY + maxY) * s) / 2;
  return points.map(([x, y, z]) => [ox + x * s, oy + y * s, z] as Pt);
}

function wrap(deg: number) {
  return ((deg % 360) + 360) % 360;
}

function radians(angles: PlaneAngles): PlaneAngles {
  return {
    xy: angles.xy * Math.PI / 180,
    xz: angles.xz * Math.PI / 180,
    yz: angles.yz * Math.PI / 180,
    xw: angles.xw * Math.PI / 180,
    yw: angles.yw * Math.PI / 180,
    zw: angles.zw * Math.PI / 180,
  };
}

function phaseLabel(angles: PlaneAngles, running: boolean) {
  const still = (Object.values(angles) as number[]).every((value) => Math.abs(value) < 0.8 || Math.abs(value - 360) < 0.8);
  if (still && !running) return "Face-on";
  if (!running) return "Held";
  return "Turning";
}

function shade(rgb: string, light: number, alpha: number) {
  const [r, g, b] = rgb.split(",").map((part) => Math.round(Number(part) * light));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function faceVisible(role: FaceRole, mode: Mode, showCaps: boolean) {
  if (role === "cap") return mode !== "worm" || showCaps;
  return true;
}

function faceFill(role: FaceRole, mode: Mode, showCaps: boolean) {
  if (!faceVisible(role, mode, showCaps)) return false;
  if (mode === "worm" && (role === "entrance" || role === "far-mouth")) return false;
  return true;
}

export function CubicWormStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("worm");
  const [tab, setTab] = useState<TabId>("turn");
  const [angles, setAngles] = useState<PlaneAngles>({ ...ZERO_ANGLES });
  const [plane, setPlane] = useState<PlaneId>("xw");
  const [running, setRunning] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [speed, setSpeed] = useState(22);
  const [pair, setPair] = useState<PairId>("w");
  const [view, setView] = useState<Axis>(2);
  const [parallel, setParallel] = useState(false);
  const [perspective, setPerspective] = useState(true);
  const [dist4, setDist4] = useState(3.2);
  const [dist3, setDist3] = useState(8);
  const [yaw, setYaw] = useState(DEFAULT_YAW);
  const [pitch, setPitch] = useState(DEFAULT_PITCH);
  const [nearAlpha, setNearAlpha] = useState(0.2);
  const [farAlpha, setFarAlpha] = useState(0.5);
  const [wallAlpha, setWallAlpha] = useState(0.94);
  const [showCaps, setShowCaps] = useState(false);
  const [numbersOn, setNumbersOn] = useState(false);
  const [contrast, setContrast] = useState(true);

  const modeRef = useRef(mode);
  const anglesRef = useRef(angles);
  const planeRef = useRef(plane);
  const runRef = useRef(running);
  const revRef = useRef(reverse);
  const speedRef = useRef(speed);
  const pairRef = useRef(pair);
  const viewRef = useRef(view);
  const parRef = useRef(parallel);
  const perspRef = useRef(perspective);
  const d4Ref = useRef(dist4);
  const d3Ref = useRef(dist3);
  const yawRef = useRef(yaw);
  const pitchRef = useRef(pitch);
  const nearARef = useRef(nearAlpha);
  const farARef = useRef(farAlpha);
  const wallARef = useRef(wallAlpha);
  const capsRef = useRef(showCaps);
  const numRef = useRef(numbersOn);
  const contrastRef = useRef(contrast);
  modeRef.current = mode;
  anglesRef.current = angles;
  planeRef.current = plane;
  runRef.current = running;
  revRef.current = reverse;
  speedRef.current = speed;
  pairRef.current = pair;
  viewRef.current = view;
  parRef.current = parallel;
  perspRef.current = perspective;
  d4Ref.current = dist4;
  d3Ref.current = dist3;
  yawRef.current = yaw;
  pitchRef.current = pitch;
  nearARef.current = nearAlpha;
  farARef.current = farAlpha;
  wallARef.current = wallAlpha;
  capsRef.current = showCaps;
  numRef.current = numbersOn;
  contrastRef.current = contrast;

  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let dead = false;
    let last = performance.now();

    const paint = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = resize(canvas);
      if (!dpr) return;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#05060c";
      ctx.fillRect(0, 0, width, height);

      const model = buildWormModel(radians(anglesRef.current), pairRef.current, viewRef.current, d4Ref.current, parRef.current);
      const modeNow = modeRef.current;
      const showLabels = modeNow === "reveal" || (modeNow === "geometry" && numRef.current) || (modeNow === "worm" && numRef.current);

      const cam = model.cells.map((cell) => cell.projected.map((point) => camera(point, yawRef.current, pitchRef.current)));
      let maxZ = 0;
      for (const cell of cam) for (const p of cell) maxZ = Math.max(maxZ, p[2]);
      const distance3 = Math.max(d3Ref.current, maxZ + 2.4);
      const flat: Pt[][] = cam.map((cell) => cell.map((p) => {
        if (!perspRef.current) return [p[0], -p[1], p[2]];
        const k = distance3 / (distance3 - p[2]);
        return [p[0] * k, -p[1] * k, p[2]];
      }));
      const fitted = fit2d(flat.flat(), width, height, 0.08);
      let cursor = 0;
      const screen = flat.map((cell) => cell.map(() => fitted[cursor++]));

      let minD = Infinity;
      let maxD = -Infinity;
      cam.forEach((cell) => cell.forEach((p) => {
        minD = Math.min(minD, p[2]);
        maxD = Math.max(maxD, p[2]);
      }));
      const span = Math.max(1e-4, maxD - minD);

      type Drawn = { color: string; alpha: number; pts: Pt[]; depth: number; role: FaceRole };
      const faces: Drawn[] = [];
      model.cells.forEach((cell, index) => {
        for (const face of cell.faces) {
          if (!faceFill(face.role, modeNow, capsRef.current)) continue;
          const pts = face.indices.map((vertex) => screen[index][vertex]);
          const depth = face.indices.reduce((sum, vertex) => sum + cam[index][vertex][2], 0) / face.indices.length;
          let alpha = modeNow === "worm" ? alphaFor(cell.role, face.role, nearARef.current, farARef.current, wallARef.current) : modeNow === "reveal" ? revealAlpha(cell.role) : 0.38;
          if (face.role === "cap" && modeNow === "worm") alpha = 0.28;
          faces.push({ color: COLOR[cell.id], alpha, pts, depth, role: face.role });
        }
      });
      faces.sort((a, b) => a.depth - b.depth);
      for (const face of faces) {
        const light = 0.48 + 0.7 * ((face.depth - minD) / span);
        ctx.beginPath();
        ctx.moveTo(face.pts[0][0], face.pts[0][1]);
        for (const p of face.pts.slice(1)) ctx.lineTo(p[0], p[1]);
        ctx.closePath();
        ctx.fillStyle = shade(face.color, light, face.alpha);
        ctx.fill();
      }

      const edgeColor = contrastRef.current ? "rgba(255, 248, 236, 0.92)" : "rgba(232, 220, 200, 0.55)";
      ctx.lineWidth = (contrastRef.current ? 1.7 : 1.05) * dpr;
      ctx.strokeStyle = edgeColor;
      model.cells.forEach((cell, index) => {
        const show = modeNow !== "worm" || cell.role !== "cap" || capsRef.current;
        if (!show) return;
        for (const [a, b] of cell.edges) {
          ctx.beginPath();
          ctx.moveTo(screen[index][a][0], screen[index][a][1]);
          ctx.lineTo(screen[index][b][0], screen[index][b][1]);
          ctx.stroke();
        }
      });

      if (modeNow === "worm") {
        for (const cell of model.cells) {
          if (cell.role !== "far") continue;
          const index = model.cells.indexOf(cell);
          for (const face of cell.faces) {
            if (face.role !== "far-mouth") continue;
            traceFace(ctx, screen[index], face);
            ctx.fillStyle = "rgba(6, 10, 14, 0.78)";
            ctx.fill();
          }
        }
        strokeRole(ctx, model.cells, screen, "entrance", "rgba(255, 248, 230, 0.98)", 3.1 * dpr);
        strokeRole(ctx, model.cells, screen, "far-mouth", "rgba(150, 214, 232, 0.95)", 2.5 * dpr);
        strokeRole(ctx, model.cells, screen, "rim", edgeColor, 1.6 * dpr);
      }

      if (showLabels) separateLabels(model.cells, screen, dpr, ctx);

      canvas.dataset.mode = modeNow;
      canvas.dataset.angle = anglesRef.current[planeRef.current].toFixed(2);
      canvas.dataset.plane = planeRef.current;
      canvas.dataset.near = model.near;
      canvas.dataset.far = model.far;
      canvas.dataset.distance4 = model.distance.toFixed(2);
      canvas.dataset.bridge = "none";
    };

    const frame = (now: number) => {
      if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (runRef.current) {
        const dir = revRef.current ? -1 : 1;
        const id = planeRef.current;
        const next = wrap(anglesRef.current[id] + dir * speedRef.current * dt);
        const updated = { ...anglesRef.current, [id]: next };
        anglesRef.current = updated;
        setAngles(updated);
      }
      paint();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  function onPlay() {
    setRunning((value) => !value);
  }

  function setPlaneAngle(id: PlaneId, value: number) {
    const updated = { ...anglesRef.current, [id]: id === planeRef.current || W_PLANES.includes(id) ? wrap(value) : value };
    anglesRef.current = updated;
    setAngles(updated);
  }

  function faceOn() {
    const cleared = { ...ZERO_ANGLES };
    anglesRef.current = cleared;
    setAngles(cleared);
    setRunning(false);
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    drag.current = { x: event.clientX, y: event.clientY, yaw: yawRef.current, pitch: pitchRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const start = drag.current;
    if (!start) return;
    const nextYaw = start.yaw + (event.clientX - start.x) * 0.008;
    const nextPitch = Math.max(-1.15, Math.min(1.15, start.pitch + (event.clientY - start.y) * 0.008));
    yawRef.current = nextYaw;
    pitchRef.current = nextPitch;
    setYaw(nextYaw);
    setPitch(nextPitch);
  }
  function onPointerUp() {
    drag.current = null;
  }

  const model = buildWormModel(radians(angles), pair, view, dist4, parallel);
  const primary = angles[plane];

  return (
    <div className="cw-cockpit" data-mode={mode} data-bridge="none" data-angle={primary.toFixed(1)}>
      <div className="cw-stage">
        <div className="cw-cap">
          <span>Cubic Worm</span>
          <span>{phaseLabel(angles, running)}</span>
        </div>
        <p className="cw-note">
          The slider turns the hypercube in a W plane. Dragging orbits the camera and does not rotate the solid.
        </p>
        <div className="cw-view">
          <canvas
            ref={canvasRef}
            aria-label="Cubic worm tesseract projection"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
      </div>

      <div className="cw-bar">
        <p className="cw-status" aria-live="polite">
          <span>{phaseLabel(angles, running)}</span>
          <span>{plane.toUpperCase()} {primary.toFixed(0)}°</span>
          <span>{model.cells.find((cell) => cell.id === model.near)?.label} near</span>
          <span>{reverse ? "Reversed" : "Forward"}</span>
        </p>
        <label className="cw-slider">
          <span>
            <span>{plane.toUpperCase()} rotation</span>
            <span>{primary.toFixed(0)}°</span>
          </span>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={primary}
            aria-label={`${plane.toUpperCase()} rotation`}
            onChange={(event) => setPlaneAngle(plane, parseFloat(event.target.value))}
          />
        </label>
        <div className="cw-row" style={{ marginTop: "0.2rem" }}>
          {W_PLANES.map((id) => (
            <button key={id} type="button" className="cw-choice" aria-pressed={plane === id} onClick={() => setPlane(id)}>
              {id.toUpperCase()}
            </button>
          ))}
          <button type="button" className="cw-choice" aria-pressed={running} onClick={onPlay}>
            {running ? "Pause" : "Play"}
          </button>
          <button type="button" className="cw-choice" aria-pressed={reverse} onClick={() => setReverse((value) => !value)}>
            {reverse ? "Reversed" : "Reverse"}
          </button>
          <button type="button" className="cw-choice" onClick={faceOn}>Face-on</button>
        </div>
      </div>

      <section className="cw-dock" aria-label="Cubic worm controls">
        <div className="cw-row cw-modes">
          {MODES.map((item) => (
            <button key={item.id} type="button" className="cw-choice" aria-pressed={mode === item.id} onClick={() => setMode(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="cw-scroll">
        <div className="cw-tabs" role="tablist" aria-label="Cubic worm control groups">
          {([["turn", "Turn"], ["look", "Look"], ["read", "Read"]] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        <div className="cw-panel" role="tabpanel">
          {mode === "reveal" && (
            <RevealBlock modelView={model.viewAxis} model={model} plane={plane} angles={angles} />
          )}
          {tab === "turn" && (
            <>
              <div className="cw-row">
                {PAIRS.map((item) => (
                  <button key={item.id} type="button" className="cw-choice" aria-pressed={pair === item.id} onClick={() => setPair(item.id)}>
                    Pair {item.label}
                  </button>
                ))}
              </div>
              <div className="cw-row" style={{ marginTop: "0.35rem" }}>
                {VIEWS.map((item) => (
                  <button
                    key={item.axis}
                    type="button"
                    className="cw-choice"
                    aria-pressed={model.viewAxis === item.axis}
                    disabled={item.axis === model.projectAxis}
                    onClick={() => setView(item.axis)}
                  >
                    {item.label}
                  </button>
                ))}
                <button type="button" className="cw-choice" aria-pressed={showCaps} onClick={() => setShowCaps((value) => !value)}>End cells</button>
                <button type="button" className="cw-choice" aria-pressed={numbersOn} onClick={() => setNumbersOn((value) => !value)}>Numbers</button>
                <button type="button" className="cw-choice" aria-pressed={contrast} onClick={() => setContrast((value) => !value)}>High contrast</button>
              </div>
              <label className="cw-slider">
                <span><span>Turn speed</span><span>{speed.toFixed(0)}°/s</span></span>
                <input type="range" min={5} max={80} step={1} value={speed} aria-label="Turn speed" onChange={(event) => setSpeed(parseFloat(event.target.value))} />
              </label>
              <label className="cw-slider">
                <span><span>Near cell</span><span>{nearAlpha.toFixed(2)}</span></span>
                <input type="range" min={0} max={0.8} step={0.01} value={nearAlpha} aria-label="Near cell transparency" onChange={(event) => setNearAlpha(parseFloat(event.target.value))} />
              </label>
              <label className="cw-slider">
                <span><span>Far cell</span><span>{farAlpha.toFixed(2)}</span></span>
                <input type="range" min={0} max={0.9} step={0.01} value={farAlpha} aria-label="Far cell transparency" onChange={(event) => setFarAlpha(parseFloat(event.target.value))} />
              </label>
              <label className="cw-slider">
                <span><span>Connecting walls</span><span>{wallAlpha.toFixed(2)}</span></span>
                <input type="range" min={0.2} max={1} step={0.01} value={wallAlpha} aria-label="Connecting wall transparency" onChange={(event) => setWallAlpha(parseFloat(event.target.value))} />
              </label>
              {(["xy", "xz", "yz"] as const).map((id) => (
                <label key={id} className="cw-slider">
                  <span><span>{id.toUpperCase()} plane</span><span>{angles[id].toFixed(0)}°</span></span>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={angles[id]}
                    aria-label={`${id.toUpperCase()} rotation`}
                    onChange={(event) => setPlaneAngle(id, parseFloat(event.target.value))}
                  />
                </label>
              ))}
              <ul className="cw-readout" aria-label="Cell key">
                {model.cells.map((cell) => (
                  <li key={cell.id}>
                    <span className="cw-swatch" style={{ background: `rgb(${COLOR[cell.id]})` }} />
                    {cell.label} · {cell.role}
                  </li>
                ))}
              </ul>
              <p className="cw-hint">
                Walls are the four cells whose axes are neither the pair nor the view. End cells close the view axis. Opposite cells share no face.
              </p>
            </>
          )}
          {tab === "look" && (
            <>
              <div className="cw-row">
                <button type="button" className="cw-choice" aria-pressed={!parallel} onClick={() => setParallel(false)}>Perspective 4D</button>
                <button type="button" className="cw-choice" aria-pressed={parallel} onClick={() => setParallel(true)}>Parallel 4D</button>
                <button type="button" className="cw-choice" aria-pressed={perspective} onClick={() => setPerspective((value) => !value)}>
                  {perspective ? "Perspective camera" : "Orthographic camera"}
                </button>
                <button
                  type="button"
                  className="cw-choice"
                  onClick={() => {
                    yawRef.current = DEFAULT_YAW;
                    pitchRef.current = DEFAULT_PITCH;
                    setYaw(DEFAULT_YAW);
                    setPitch(DEFAULT_PITCH);
                  }}
                >
                  Reset camera
                </button>
              </div>
              <label className="cw-slider">
                <span>
                  <span>4D projection distance</span>
                  <span>{dist4.toFixed(1)} · used {model.distance.toFixed(1)}</span>
                </span>
                <input type="range" min={2} max={12} step={0.1} value={dist4} aria-label="4D projection distance" onChange={(event) => setDist4(parseFloat(event.target.value))} />
              </label>
              <label className="cw-slider">
                <span><span>3D camera distance</span><span>{dist3.toFixed(1)}</span></span>
                <input type="range" min={4} max={24} step={0.1} value={dist3} aria-label="3D camera distance" onChange={(event) => setDist3(parseFloat(event.target.value))} />
              </label>
              <p className="cw-hint">
                Perspective along the pair axis makes the nearer cell larger. Parallel projection stacks the opposite cells, and the passage disappears. The used distance is raised if a vertex would cross the camera.
              </p>
            </>
          )}
          {tab === "read" && (
            <div className="cw-read">
              <h3>Observation</h3>
              <p className="cw-hint">A square mouth, four walls, and a smaller far opening can appear in the picture. Turning the solid changes that picture. It does not appear at every angle.</p>
              <h3>Model</h3>
              <p className="cw-hint">The object is a tesseract boundary: eight cubes on the vertices {"{−1, +1}"}⁴. Opposite cells, such as W− and W+, do not share a face. There is no unique throat in the boundary. The drawing selects the pair as the projection axis and four other cells as walls. Every filled polygon is a face of one of those cubes.</p>
              <h3>Interpretation</h3>
              <p className="cw-hint">Depth order, perspective scale, and which faces are left open produce the impression of a passage. The impression is viewpoint-dependent. A parallel projection removes it.</p>
              <h3>Speculation</h3>
              <p className="cw-hint">How much of the apparent depth is supplied by the projection and by the eye, rather than by the object’s topology? This is not a general-relativistic wormhole. No spacetime metric is computed. No physical passage through space is established.</p>
              <Link className="cw-jump" to="/observatory/higher-dimensional/hypercross">
                Explore the eight-cell structure → Hypercross
              </Link>
            </div>
          )}
        </div>
        </div>
      </section>
    </div>
  );
}

function RevealBlock({
  model,
  modelView,
  plane,
  angles,
}: {
  model: ReturnType<typeof buildWormModel>;
  modelView: Axis;
  plane: PlaneId;
  angles: PlaneAngles;
}) {
  const roleLine = (role: CellRole) => model.cells.filter((cell) => cell.role === role).map((cell) => cell.label).join(", ");
  return (
    <>
      <h3>Cells</h3>
      <ul className="cw-readout" aria-label="Reveal diagnostics">
        <li>Near {model.cells.find((cell) => cell.id === model.near)?.label} · far {model.cells.find((cell) => cell.id === model.far)?.label}</li>
        <li>Walls {roleLine("wall")}</li>
        <li>End cells {roleLine("cap")}</li>
        <li>Pair axis {AXIS_NAME[model.projectAxis]} · view axis {AXIS_NAME[modelView]}</li>
        <li>{plane.toUpperCase()} {angles[plane].toFixed(0)}° · distance {model.requested.toFixed(1)} used {model.distance.toFixed(1)}</li>
        <li>Opposite cells are not adjacent. No unique throat is part of the boundary.</li>
        <li>Artistic bridge: none. Every surface is a cubic-cell face.</li>
      </ul>
    </>
  );
}

function alphaFor(role: CellRole, face: FaceRole, near: number, far: number, wall: number) {
  if (face === "cap" || role === "cap") return 0.28;
  if (role === "near") return near;
  if (role === "far") return far;
  return wall;
}

function revealAlpha(role: CellRole) {
  if (role === "near" || role === "far") return 0.34;
  if (role === "wall") return 0.72;
  return 0.2;
}

function strokeRole(
  ctx: CanvasRenderingContext2D,
  cells: ProjectedCell[],
  screen: Pt[][],
  role: FaceRole,
  color: string,
  width: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  cells.forEach((cell, index) => {
    for (const face of cell.faces) {
      if (face.role !== role) continue;
      traceFace(ctx, screen[index], face);
      ctx.stroke();
    }
  });
}

function traceFace(ctx: CanvasRenderingContext2D, points: Pt[], face: ProjectedFace) {
  const loop = face.indices.map((vertex) => points[vertex]);
  ctx.beginPath();
  ctx.moveTo(loop[0][0], loop[0][1]);
  for (const p of loop.slice(1)) ctx.lineTo(p[0], p[1]);
  ctx.closePath();
}

function separateLabels(cells: ProjectedCell[], screen: Pt[][], dpr: number, ctx: CanvasRenderingContext2D) {
  const centers = cells.map((_, index) => {
    const c = screen[index].reduce((sum, p) => [sum[0] + p[0], sum[1] + p[1]], [0, 0]);
    return [c[0] / screen[index].length, c[1] / screen[index].length];
  });
  const min = 18 * dpr;
  for (let pass = 0; pass < 8; pass++) {
    for (let i = 0; i < centers.length; i++) {
      for (let j = i + 1; j < centers.length; j++) {
        let dx = centers[j][0] - centers[i][0];
        let dy = centers[j][1] - centers[i][1];
        let dist = Math.hypot(dx, dy);
        if (dist < min) {
          if (dist < 0.5) { dx = min; dy = 0; dist = min; }
          const push = (min - dist) / 2;
          centers[i][0] -= (dx / dist) * push;
          centers[i][1] -= (dy / dist) * push;
          centers[j][0] += (dx / dist) * push;
          centers[j][1] += (dy / dist) * push;
        }
      }
    }
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${12 * dpr}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  cells.forEach((cell, index) => {
    const [x, y] = centers[index];
    ctx.beginPath();
    ctx.arc(x, y, 11 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(5, 6, 12, 0.82)";
    ctx.fill();
    ctx.fillStyle = "#f8f4ea";
    ctx.fillText(cell.label, x, y + 0.5 * dpr);
  });
}
