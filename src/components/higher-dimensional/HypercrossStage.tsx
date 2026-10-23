import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  foldHypercross,
  modelCenter,
  project4to3,
  safe4DDistance,
  type CellId,
  type V4,
} from "@/instruments/higher-dimensional/hypercross-math";
import "./hypercross.css";

type TabId = "model" | "projection" | "hinges" | "reading";

const TABS: { id: TabId; label: string }[] = [
  { id: "model", label: "Model" },
  { id: "projection", label: "Projection" },
  { id: "hinges", label: "Hinges" },
  { id: "reading", label: "Reading" },
];

const COLOR: Record<CellId, string> = {
  "w-": "232, 220, 196",
  "z-": "251, 191, 36",
  "x-": "34, 211, 238",
  "y+": "167, 139, 250",
  "x+": "74, 222, 128",
  "y-": "251, 113, 133",
  "w+": "96, 165, 250",
  "z+": "251, 146, 60",
};

const DEFAULT_YAW = 0.62;
const DEFAULT_PITCH = 0.48;

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

function phaseLabel(progress: number, reverse: boolean, running: boolean) {
  if (progress <= 0.015) return "Unfolded net";
  if (progress >= 0.985) return "Folded tesseract";
  if (!running) return "Held";
  return reverse ? "Unfolding" : "Folding";
}

export function HypercrossStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [tab, setTab] = useState<TabId>("model");
  const [cellsOn, setCellsOn] = useState(true);
  const [edgesOn, setEdgesOn] = useState(true);
  const [hingesOn, setHingesOn] = useState(true);
  const [numbersOn, setNumbersOn] = useState(true);
  const [alpha, setAlpha] = useState(0.72);
  const [perspective, setPerspective] = useState(true);
  const [parallel4, setParallel4] = useState(false);
  const [dist4, setDist4] = useState(3.5);
  const [dist3, setDist3] = useState(9);
  const [yaw, setYaw] = useState(DEFAULT_YAW);
  const [pitch, setPitch] = useState(DEFAULT_PITCH);

  const progRef = useRef(progress);
  const runRef = useRef(running);
  const revRef = useRef(reverse);
  const cellsRef = useRef(cellsOn);
  const edgesRef = useRef(edgesOn);
  const hingesRef = useRef(hingesOn);
  const numbersRef = useRef(numbersOn);
  const alphaRef = useRef(alpha);
  const perspRef = useRef(perspective);
  const parRef = useRef(parallel4);
  const d4Ref = useRef(dist4);
  const d3Ref = useRef(dist3);
  const yawRef = useRef(yaw);
  const pitchRef = useRef(pitch);
  progRef.current = progress;
  runRef.current = running;
  revRef.current = reverse;
  cellsRef.current = cellsOn;
  edgesRef.current = edgesOn;
  hingesRef.current = hingesOn;
  numbersRef.current = numbersOn;
  alphaRef.current = alpha;
  perspRef.current = perspective;
  parRef.current = parallel4;
  d4Ref.current = dist4;
  d3Ref.current = dist3;
  yawRef.current = yaw;
  pitchRef.current = pitch;

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

      const model = foldHypercross(progRef.current);
      const cloud = model.cells.flatMap((cell) => cell.vertices);
      const center = modelCenter(cloud);
      const distance4 = safe4DDistance(cloud, d4Ref.current);
      const to3 = (p: V4) => project4to3(p, center, distance4, parRef.current);
      const cam = model.cells.map((cell) => cell.vertices.map((vertex) => camera(to3(vertex), yawRef.current, pitchRef.current)));
      let maxZ = 0;
      for (const cell of cam) for (const p of cell) maxZ = Math.max(maxZ, p[2]);
      const distance3 = Math.max(d3Ref.current, maxZ + 2.2);
      const flat: Pt[][] = cam.map((cell) => cell.map((p) => {
        if (!perspRef.current) return [p[0], -p[1], p[2]];
        const k = distance3 / (distance3 - p[2]);
        return [p[0] * k, -p[1] * k, p[2]];
      }));
      const fitted = fit2d(flat.flat(), width, height, 0.1);
      let cursor = 0;
      const screen = flat.map((cell) => cell.map(() => fitted[cursor++]));

      type Drawn = { color: string; pts: Pt[]; depth: number; cell: number; face: number[] };
      const faces: Drawn[] = [];
      model.cells.forEach((cell, index) => {
        for (const face of cell.faces) {
          const pts = face.map((vertex) => screen[index][vertex]);
          const depth = face.reduce((sum, vertex) => sum + cam[index][vertex][2], 0) / face.length;
          faces.push({ color: COLOR[cell.id], pts, depth, cell: index, face });
        }
      });
      faces.sort((a, b) => a.depth - b.depth);

      if (cellsRef.current) {
        for (const face of faces) {
          ctx.beginPath();
          ctx.moveTo(face.pts[0][0], face.pts[0][1]);
          for (const p of face.pts.slice(1)) ctx.lineTo(p[0], p[1]);
          ctx.closePath();
          ctx.fillStyle = `rgba(${face.color}, ${alphaRef.current})`;
          ctx.fill();
        }
      }
      if (edgesRef.current) {
        model.cells.forEach((cell, index) => {
          ctx.strokeStyle = `rgba(${COLOR[cell.id]}, 0.9)`;
          ctx.lineWidth = 1.05 * dpr;
          for (const [a, b] of cell.edges) {
            ctx.beginPath();
            ctx.moveTo(screen[index][a][0], screen[index][a][1]);
            ctx.lineTo(screen[index][b][0], screen[index][b][1]);
            ctx.stroke();
          }
        });
      }
      if (hingesRef.current) {
        ctx.strokeStyle = "rgba(255, 236, 190, 0.95)";
        ctx.lineWidth = 2.3 * dpr;
        for (const hinge of model.hinges) {
          const parentIndex = model.cells.findIndex((cell) => cell.id === hinge.parent);
          const spec = model.cells[parentIndex];
          const local = spec.vertices
            .map((vertex, index) => ({ vertex, index }))
            .filter((item) => hinge.parentPoints.some((point) => point.every((value, axis) => Math.abs(value - item.vertex[axis]) < 1e-4)))
            .map((item) => screen[parentIndex][item.index]);
          if (local.length < 4) continue;
          const cx = local.reduce((s, p) => s + p[0], 0) / local.length;
          const cy = local.reduce((s, p) => s + p[1], 0) / local.length;
          const loop = local.slice().sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
          ctx.beginPath();
          ctx.moveTo(loop[0][0], loop[0][1]);
          for (const p of loop.slice(1)) ctx.lineTo(p[0], p[1]);
          ctx.closePath();
          ctx.stroke();
        }
      }
      if (numbersRef.current) {
        const centers = model.cells.map((_, index) => {
          const c = screen[index].reduce((s, p) => [s[0] + p[0], s[1] + p[1]] as [number, number], [0, 0] as [number, number]);
          return [c[0] / screen[index].length, c[1] / screen[index].length] as [number, number];
        });
        const gap = 20 * dpr;
        for (let pass = 0; pass < 10; pass++) {
          for (let i = 0; i < centers.length; i++) {
            for (let j = i + 1; j < centers.length; j++) {
              let dx = centers[j][0] - centers[i][0];
              let dy = centers[j][1] - centers[i][1];
              let dist = Math.hypot(dx, dy);
              if (dist >= gap) continue;
              if (dist < 0.4) {
                dx = Math.cos(i * 1.7);
                dy = Math.sin(i * 1.7);
                dist = 1;
              }
              const push = (gap - dist) / 2;
              centers[i][0] -= (dx / dist) * push;
              centers[i][1] -= (dy / dist) * push;
              centers[j][0] += (dx / dist) * push;
              centers[j][1] += (dy / dist) * push;
            }
          }
        }
        const pad = 14 * dpr;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `600 ${12 * dpr}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        centers.forEach(([x, y], index) => {
          const px = Math.max(pad, Math.min(width - pad, x));
          const py = Math.max(pad, Math.min(height - pad, y));
          ctx.beginPath();
          ctx.arc(px, py, 10 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(5,6,12,0.78)";
          ctx.fill();
          ctx.fillStyle = "#f8f4ea";
          ctx.fillText(String(model.cells[index].netNumber), px, py + 0.5 * dpr);
        });
      }
      canvas.dataset.progress = progRef.current.toFixed(4);
      canvas.dataset.distance4 = distance4.toFixed(2);
    };

    const frame = (now: number) => {
      if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (runRef.current) {
        const dir = revRef.current ? -1 : 1;
        let next = progRef.current + dir * dt * 0.12;
        if (next >= 1) { next = 1; runRef.current = false; setRunning(false); }
        if (next <= 0) { next = 0; runRef.current = false; setRunning(false); }
        progRef.current = next;
        setProgress(next);
      }
      paint();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const observer = new ResizeObserver(() => {});
    observer.observe(canvas);
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  function onPlay() {
    setRunning((value) => {
      if (value) return false;
      if (progRef.current >= 0.999 && !revRef.current) setReverse(true);
      if (progRef.current <= 0.001 && revRef.current) setReverse(false);
      return true;
    });
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    drag.current = { x: event.clientX, y: event.clientY, yaw: yawRef.current, pitch: pitchRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const start = drag.current;
    if (!start) return;
    const nextYaw = start.yaw + (event.clientX - start.x) * 0.008;
    const nextPitch = Math.max(-1.2, Math.min(1.2, start.pitch + (event.clientY - start.y) * 0.008));
    yawRef.current = nextYaw;
    pitchRef.current = nextPitch;
    setYaw(nextYaw);
    setPitch(nextPitch);
  }
  function onPointerUp() {
    drag.current = null;
  }

  const model = foldHypercross(progress);
  const effective4 = safe4DDistance(model.cells.flatMap((cell) => cell.vertices), dist4);

  return (
    <div className="hx-cockpit" data-progress={progress.toFixed(2)}>
      <div className="hx-stage">
        <div className="hx-cap">
          <span>Hypercross</span>
          <span>{phaseLabel(progress, reverse, running)}</span>
        </div>
        <p className="hx-note">
          Square-face hinges live in the 4D model. This picture is that model projected to 3D, then to the screen. Drag orbits the camera only.
        </p>
        <div className="hx-view">
          <canvas
            ref={canvasRef}
            aria-label="Hypercross tesseract net"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
      </div>

      <div className="hx-bar">
        <p className="hx-status" aria-live="polite">
          <span>{phaseLabel(progress, reverse, running)}</span>
          <span>{progress.toFixed(2)}</span>
          <span>{reverse ? "Reversed" : "Forward"}</span>
        </p>
        <label className="hx-slider">
          <span>
            <span>Fold progress</span>
            <span>0 net · 1 tesseract</span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={progress}
            aria-label="Fold progress"
            onChange={(event) => {
              const next = parseFloat(event.target.value);
              progRef.current = next;
              setProgress(next);
            }}
          />
        </label>
        <div className="hx-row" style={{ marginTop: "0.28rem" }}>
          <button type="button" className="hx-choice" aria-pressed={running} onClick={onPlay}>
            {running ? "Pause" : "Play"}
          </button>
          <button type="button" className="hx-choice" aria-pressed={reverse} onClick={() => setReverse((value) => !value)}>
            {reverse ? "Reversed" : "Reverse"}
          </button>
        </div>
      </div>

      <section className="hx-dock" aria-label="Hypercross controls">
        <div className="hx-tabs" role="tablist" aria-label="Hypercross control groups">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="hx-panel" role="tabpanel">
          {tab === "model" && (
            <>
              <div className="hx-row">
                <button type="button" className="hx-choice" aria-pressed={cellsOn} onClick={() => setCellsOn((v) => !v)}>Cells</button>
                <button type="button" className="hx-choice" aria-pressed={edgesOn} onClick={() => setEdgesOn((v) => !v)}>Edges</button>
                <button type="button" className="hx-choice" aria-pressed={hingesOn} onClick={() => setHingesOn((v) => !v)}>Hinges</button>
                <button type="button" className="hx-choice" aria-pressed={numbersOn} onClick={() => setNumbersOn((v) => !v)}>Numbers</button>
              </div>
              <label className="hx-slider">
                <span><span>Cell transparency</span><span>{alpha.toFixed(2)}</span></span>
                <input type="range" min={0.12} max={0.9} step={0.01} value={alpha} aria-label="Cell transparency" onChange={(event) => setAlpha(parseFloat(event.target.value))} />
              </label>
              <ul className="hx-readout" aria-label="Cell key">
                {[...model.cells].sort((a, b) => a.netNumber - b.netNumber).map((cell) => (
                  <li key={cell.id}>
                    <span className="hx-swatch" style={{ background: `rgb(${COLOR[cell.id]})` }} />
                    {cell.netNumber} {cell.label}
                    {cell.id === "w-" ? " · root" : ""}
                    {cell.id === "z-" ? " · junction" : ""}
                  </li>
                ))}
              </ul>
              <p className="hx-hint">Amber-white squares are the seven hinges. Other shared sides of the folded tesseract are not hinges of this net.</p>
            </>
          )}
          {tab === "projection" && (
            <>
              <div className="hx-row">
                <button type="button" className="hx-choice" aria-pressed={!parallel4} onClick={() => setParallel4(false)}>Perspective 4D</button>
                <button type="button" className="hx-choice" aria-pressed={parallel4} onClick={() => setParallel4(true)}>Parallel 4D</button>
                <button type="button" className="hx-choice" aria-pressed={perspective} onClick={() => setPerspective((v) => !v)}>
                  {perspective ? "Perspective camera" : "Orthographic camera"}
                </button>
                <button
                  type="button"
                  className="hx-choice"
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
              <label className="hx-slider">
                <span>
                  <span>4D projection distance</span>
                  <span>{dist4.toFixed(1)} · used {effective4.toFixed(1)}</span>
                </span>
                <input type="range" min={2.5} max={16} step={0.1} value={dist4} aria-label="4D projection distance" onChange={(event) => setDist4(parseFloat(event.target.value))} />
              </label>
              <label className="hx-slider">
                <span><span>3D camera distance</span><span>{dist3.toFixed(1)}</span></span>
                <input type="range" min={4} max={24} step={0.1} value={dist3} aria-label="3D camera distance" onChange={(event) => setDist3(parseFloat(event.target.value))} />
              </label>
              <p className="hx-hint">
                Folding is the slider. The 4D distance changes how w is divided out. The camera distance, orthographic switch, and drag change only the 3D view. If the model would cross the 4D camera, the distance is raised and the used value is shown.
              </p>
            </>
          )}
          {tab === "hinges" && (
            <>
              <ol className="hx-readout" aria-label="Hinge sequence">
                {model.hinges.map((hinge, index) => (
                  <li key={`${hinge.parent}-${hinge.child}`}>
                    {index + 1}. {hinge.parentLabel} → {hinge.childLabel} · {Math.abs(hinge.angle * 180 / Math.PI).toFixed(0)}° open · square {hinge.face}
                  </li>
                ))}
              </ol>
              <p className="hx-hint">
                Each angle is a right angle times how open the net is. At progress 1 every hinge reads 0°. The square is the shared face in the folded tesseract, fixed by those two coordinates.
              </p>
            </>
          )}
          {tab === "reading" && (
            <div className="hx-read">
              <h3>Observation</h3>
              <p className="hx-hint">Eight numbered cubes and seven bright squares. The slider opens and closes the net. Dragging the picture changes the viewpoint. The two gestures do not do the same thing.</p>
              <h3>Model</h3>
              <p className="hx-hint">A cube’s boundary is six squares. A tesseract’s boundary is eight cubes, the cells x, y, z, w = ±1 on the vertices {"{−1, +1}"}⁴. Cells on different axes share a square. This net keeps seven of those squares as hinges: a spine W−, Z−, W+, Z+, and four arms on Z−. Progress 0 lays that tree in the hyperplane w = −1. Progress 1 is the canonical tesseract. The motion is a rigid 4D rotation about each hinge square, not a slide of the corners and not a rotation inside one cube’s 3-space.</p>
              <h3>Interpretation</h3>
              <p className="hx-hint">The screen is two projections in series. First the 4D model is sent to 3D, by a perspective divide along w or by a parallel shadow. Then an ordinary camera draws that 3D scene. Nested cubes at the folded end are the perspective drawing. They are not eight solids occupying one 3D volume in the model.</p>
              <h3>Speculation</h3>
              <p className="hx-hint">This animation is not a physical object passing through our space. The cruciform net is a classical unfolding, used as a shape only. It is not a reproduction of a painting, and it is not evidence about matter.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
