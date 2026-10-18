import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  DANCER_OMEGA,
  DANCER_SPEED_MAX,
  DANCER_SPEED_MIN,
  DANCER_SPEED_STEP,
  physicalAngle,
  type SpinDirection,
} from "@/instruments/higher-dimensional/dancer-motion";
import "./spinning-dancer.css";

export type DancerRender = {
  shaded: boolean;
  perspective: boolean;
  depthCues: boolean;
  floorShadow: boolean;
  markers: boolean;
  direction: SpinDirection;
};

const SILHOUETTE: DancerRender = {
  shaded: false,
  perspective: false,
  depthCues: false,
  floorShadow: false,
  markers: false,
  direction: 1,
};

type DancerTab = "motion" | "appearance" | "observer";

const DANCER_TABS: { id: DancerTab; label: string }[] = [
  { id: "motion", label: "Motion" },
  { id: "appearance", label: "Appearance" },
  { id: "observer", label: "Observer" },
];

// ── Types & 3D model ───────────────────────────────────────────────────────
type V3 = [number, number, number];

// Arabesque pose. Y-up, origin at hips. All coords in body-scale units.
// legEm: 0 = leg hanging low behind, 1 = full high arabesque
// armPos: 0 = arms in relaxed curve, 1 = fully extended ballet position
function buildJoints(legEm: number, armPos: number): Record<string, V3> {
  return {
    hipC:  [ 0.00,  0.00,  0.00],
    hipL:  [-0.13,  0.00,  0.00],
    hipR:  [ 0.13,  0.00,  0.00],
    spine: [ 0.00,  0.40,  0.00],
    chest: [ 0.00,  0.70,  0.00],
    neck:  [ 0.00,  0.90,  0.00],
    head:  [ 0.00,  1.14,  0.00],
    bun:   [ 0.00,  1.30,  0.00],
    shdL:  [-0.24,  0.84,  0.00],
    shdR:  [ 0.24,  0.84,  0.00],
    elbL:  [-(0.32 + armPos * 0.10),  0.66 - armPos * 0.06, -0.04],
    elbR:  [ 0.28,  1.10 + armPos * 0.13, -0.02],
    hndL:  [-(0.44 + armPos * 0.20),  0.50 - armPos * 0.07, -0.11],
    hndR:  [ 0.22,  1.36 + armPos * 0.28, -0.04],
    kneeR: [ 0.14, -0.52,  0.00],
    footR: [ 0.14, -1.10,  0.00],
    toeR:  [ 0.16, -1.16,  0.05],
    kneeL: [-0.10, -0.30 + legEm * 0.46,  0.30 + legEm * 0.27],
    footL: [-0.12, -0.66 + legEm * 0.88,  0.55 + legEm * 0.70],
  };
}

// ── Math ───────────────────────────────────────────────────────────────────
function rotY(v: V3, phi: number): V3 {
  const c = Math.cos(phi), s = Math.sin(phi);
  return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c];
}

// Orthographic project: preserves depth ambiguity (no perspective foreshortening)
function orth(v: V3, sc: number, cx: number, cy: number): [number, number] {
  return [cx + v[0] * sc, cy - v[1] * sc];
}

// Rim glow color: cyan (far back) → violet (side-on) → amber (near front)
function rimColor(z: number): string {
  const t = Math.max(-1, Math.min(1, z));
  let r: number, g: number, b: number;
  if (t < 0) {
    const u = t + 1;  // 0 = cyan, 1 = violet
    r = Math.round(34  + (139 - 34)  * u);
    g = Math.round(211 + (92  - 211) * u);
    b = Math.round(238 + (246 - 238) * u);
  } else {
    r = Math.round(139 + (251 - 139) * t);
    g = Math.round(92  + (191 - 92)  * t);
    b = Math.round(246 + (36  - 246) * t);
  }
  return `rgba(${r},${g},${b},0.26)`;
}

// ── Segment table: [jointA, jointB, radiusFractionOfSc] ───────────────────
// Radius is lineWidth / 2 as a fraction of the body scale factor `sc`.
const SEGS: Array<[string, string, number]> = [
  ["shdL",  "elbL",  0.055],
  ["elbL",  "hndL",  0.042],
  ["shdR",  "elbR",  0.055],
  ["elbR",  "hndR",  0.042],
  ["hipL",  "kneeL", 0.078],
  ["kneeL", "footL", 0.060],
  ["hipR",  "kneeR", 0.086],
  ["kneeR", "footR", 0.066],
  ["footR", "toeR",  0.038],
  ["hipL",  "hipR",  0.078],
  ["shdL",  "shdR",  0.070],
  ["hipC",  "spine", 0.092],
  ["spine", "chest", 0.088],
  ["chest", "neck",  0.082],
  ["neck",  "head",  0.050],
];

// ── Draw ───────────────────────────────────────────────────────────────────
function drawDancer(
  canvas: HTMLCanvasElement,
  phi: number,
  legEm: number,
  armPos: number,
  focusPct: number,
  render: DancerRender = SILHOUETTE,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width, H = canvas.height;
  const cx = W / 2;
  const dpr = window.devicePixelRatio || 1;
  const sc = Math.min(W, H) * 0.295;
  // Body centre offset: hip at 0 + standing foot at -1.1 → visual centre lower
  const cy = H * 0.51 + sc * 0.16;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#05060c";
  ctx.fillRect(0, 0, W, H);

  // Technical grid
  ctx.strokeStyle = "rgba(255,255,255,0.016)";
  ctx.lineWidth = 0.5 * dpr;
  const gs = 40 * dpr;
  for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // ── Build projected joint map ─────────────────────────────────────────────
  const J = buildJoints(legEm, armPos);
  const pts: Record<string, [number, number]> = {};
  const zs:  Record<string, number>            = {};
  const rotated: Record<string, V3> = {};
  function project(v: V3): [number, number] {
    if (!render.perspective) return orth(v, sc, cx, cy);
    const dist = 4.4;
    const z = dist - v[2];
    const s = z > 0.08 ? (sc * dist) / z : sc;
    return [cx + v[0] * s, cy - v[1] * s];
  }
  for (const [k, v] of Object.entries(J)) {
    const r = rotY(v, phi);
    rotated[k] = r;
    pts[k] = project(r);
    zs[k]  = r[2];
  }

  const segAvgZ = (a: string, b: string) => (zs[a] + zs[b]) * 0.5;

  if (render.depthCues || render.floorShadow || render.markers) {
    const floorY = -1.28;
    const floor = project([0, floorY, 0]);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.ellipse(floor[0], floor[1], sc * 0.72, sc * (render.perspective ? 0.22 : 0.08), 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (render.floorShadow) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    for (const [a, b, rf] of SEGS) {
      const ra = rotated[a], rb = rotated[b];
      const pa = project([ra[0] + ra[2] * 0.15, -1.27, ra[2] * 0.15]);
      const pb = project([rb[0] + rb[2] * 0.15, -1.27, rb[2] * 0.15]);
      ctx.lineWidth = rf * sc * 1.4;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
    }
  }

  // ── Ambient glow (back-lit silhouette) ────────────────────────────────────
  const midY = (pts.neck[1] + pts.footR[1]) * 0.5;
  const bg = ctx.createRadialGradient(cx, midY, 0, cx, midY, sc * 1.70);
  bg.addColorStop(0,    "rgba(109,72,220,0.20)");
  bg.addColorStop(0.40, "rgba(60,100,215,0.10)");
  bg.addColorStop(0.70, "rgba(34,211,238,0.05)");
  bg.addColorStop(1,    "rgba(0,0,0,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Focus zone: soft spotlight at the chosen body-point
  const topY = pts.bun[1], botY = pts.toeR[1];
  const fy = topY + (botY - topY) * focusPct;
  const fz = ctx.createRadialGradient(cx, fy, 0, cx, fy, sc * 0.38);
  fz.addColorStop(0, "rgba(180,225,255,0.07)");
  fz.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = fz;
  ctx.fillRect(0, 0, W, H);

  // ── Painter sort: back → front ────────────────────────────────────────────
  const sorted = SEGS
    .map(([a, b, rf]) => ({ a, b, rf, z: segAvgZ(a, b) }))
    .sort((x, y) => x.z - y.z);

  const GR = sc * 0.028;  // glow ring width (additive radius)
  ctx.lineCap = "round";

  // Pass 1 — glow rings (all segments, low-opacity colored rim)
  for (const { a, b, rf, z } of sorted) {
    const [x1, y1] = pts[a], [x2, y2] = pts[b];
    ctx.lineWidth   = (rf * sc + GR) * 2;
    ctx.strokeStyle = rimColor(z);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  // Head + bun glow
  for (const [k, rf] of [["head", 0.108], ["bun", 0.060]] as const) {
    const [px, py] = pts[k];
    ctx.fillStyle = rimColor(zs[k]);
    ctx.beginPath(); ctx.arc(px, py, rf * sc + GR, 0, Math.PI * 2); ctx.fill();
  }

  // Pass 2 — body. Silhouette stays a flat fill. Shaded mode uses depth as a light cue.
  for (const { a, b, rf, z } of sorted) {
    const [x1, y1] = pts[a], [x2, y2] = pts[b];
    ctx.lineWidth   = rf * sc * 2;
    if (render.shaded) {
      const t = Math.max(0, Math.min(1, (z + 1.1) / 2.2));
      const lit = Math.round(48 + t * 170);
      ctx.strokeStyle = `rgb(${lit},${Math.round(lit * 0.9)},${Math.round(lit * 0.78)})`;
    } else {
      ctx.strokeStyle = "#05060c";
    }
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  for (const [k, rf] of [["head", 0.108], ["bun", 0.060]] as const) {
    const [px, py] = pts[k];
    if (render.shaded) {
      const t = Math.max(0, Math.min(1, (zs[k] + 1.1) / 2.2));
      const lit = Math.round(48 + t * 170);
      ctx.fillStyle = `rgb(${lit},${Math.round(lit * 0.9)},${Math.round(lit * 0.78)})`;
    } else {
      ctx.fillStyle = "#05060c";
    }
    ctx.beginPath(); ctx.arc(px, py, rf * sc, 0, Math.PI * 2); ctx.fill();
  }

  // ── Focus crosshair ───────────────────────────────────────────────────────
  const fr = 8 * dpr;
  ctx.strokeStyle = "rgba(175,215,255,0.35)";
  ctx.lineWidth   = 0.9 * dpr;
  ctx.lineCap     = "butt";
  ctx.beginPath(); ctx.moveTo(cx - fr * 2.6, fy); ctx.lineTo(cx + fr * 2.6, fy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, fy - fr * 1.8); ctx.lineTo(cx, fy + fr * 1.8); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, fy, fr, 0, Math.PI * 2); ctx.stroke();

  if (render.markers) {
    const foot = pts.footR;
    const ahead = project(rotY([0.45, -1.22, 0.05], phi));
    ctx.strokeStyle = "rgba(251,191,36,0.85)";
    ctx.fillStyle = "rgba(251,191,36,0.9)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(foot[0], foot[1]);
    ctx.lineTo(ahead[0], ahead[1]);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ahead[0], ahead[1], 4 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${8 * dpr}px "JetBrains Mono",ui-monospace,monospace`;
    ctx.fillStyle = "rgba(251,191,36,0.8)";
    ctx.textAlign = "left";
    ctx.fillText(render.direction === 1 ? "PHYSICAL CW" : "PHYSICAL CCW", ahead[0] + 8 * dpr, ahead[1]);
  }

  // ── Diagnostic frame ─────────────────────────────────────────────────────
  const m = 14 * dpr, ml = 10 * dpr;
  ctx.lineWidth = 0.8 * dpr;
  ctx.strokeStyle = "rgba(139,92,246,0.35)";
  ctx.beginPath(); ctx.moveTo(m, m + ml); ctx.lineTo(m, m); ctx.lineTo(m + ml, m); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W-m, H-m-ml); ctx.lineTo(W-m, H-m); ctx.lineTo(W-m-ml, H-m); ctx.stroke();
  ctx.strokeStyle = "rgba(251,191,36,0.22)";
  ctx.beginPath(); ctx.moveTo(m, H-m-ml); ctx.lineTo(m, H-m); ctx.lineTo(m+ml, H-m); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W-m, m+ml); ctx.lineTo(W-m, m); ctx.lineTo(W-m-ml, m); ctx.stroke();

  // ── Labels ────────────────────────────────────────────────────────────────
  ctx.fillStyle     = "rgba(255,255,255,0.18)";
  ctx.font          = `${8 * dpr}px "JetBrains Mono",ui-monospace,monospace`;
  ctx.textAlign     = "center";
  ctx.letterSpacing = `${2 * dpr}px`;
  ctx.fillText("SPINNING DANCER · BISTABLE SILHOUETTE", cx, m + 10 * dpr);
  ctx.textAlign     = "left";
  ctx.letterSpacing = "0px";
}

// ── Component ──────────────────────────────────────────────────────────────
export function SpinningDancer({ ride = false }: { ride?: boolean }) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const phiRef      = useRef(0.4);
  const rideRef     = useRef(ride);
  const lastTRef    = useRef<number | null>(null);

  // Live refs — state values mirrored for RAF closure access
  const dirRef      = useRef<1 | -1>(1);
  const speedRef    = useRef(1.0);
  const autoRef     = useRef(true);
  const legEmRef    = useRef(0.70);
  const armPosRef   = useRef(0.60);
  const focusRef    = useRef(0.72);   // default: near standing foot
  const dragRef     = useRef(false);
  const lastXRef    = useRef(0);
  const renderRef   = useRef<DancerRender>(SILHOUETTE);

  const [dir,     setDir]     = useState<1 | -1>(1);
  const [speed,   setSpeed]   = useState(1.0);
  const [autoSpin,setAutoSpin]= useState(true);
  const [legEm,   setLegEm]   = useState(0.70);
  const [armPos,  setArmPos]  = useState(0.60);
  const [focus,   setFocus]   = useState(72);
  const [shaded, setShaded] = useState(false);
  const [perspective, setPerspective] = useState(false);
  const [depthCues, setDepthCues] = useState(false);
  const [floorShadow, setFloorShadow] = useState(false);
  const [markers, setMarkers] = useState(false);
  const [perceived, setPerceived] = useState<"clockwise" | "counterclockwise" | "unstable" | null>(null);
  const [reversalArmed, setReversalArmed] = useState(false);
  const [tab, setTab] = useState<DancerTab>("motion");
  const [collapsed, setCollapsed] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => { dirRef.current    = dir;         }, [dir]);
  useEffect(() => { speedRef.current  = speed;       }, [speed]);
  useEffect(() => { autoRef.current   = autoSpin;    }, [autoSpin]);
  useEffect(() => { legEmRef.current  = legEm;       }, [legEm]);
  useEffect(() => { armPosRef.current = armPos;      }, [armPos]);
  useEffect(() => { focusRef.current  = focus / 100; }, [focus]);
  useEffect(() => {
    renderRef.current = {
      shaded, perspective, depthCues, floorShadow, markers, direction: dir,
    };
  }, [shaded, perspective, depthCues, floorShadow, markers, dir]);

  useEffect(() => {
    if (!full) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [full]);

  // RAF + mouse/touch drag
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

    function frame(now: number) {
      if (rideRef.current) {
        const dt = lastTRef.current == null ? 0 : Math.min(0.05, (now - lastTRef.current) / 1000);
        lastTRef.current = now;
        if (autoRef.current && !dragRef.current) {
          phiRef.current = physicalAngle({
            elapsed: dt,
            speed: speedRef.current,
            direction: dirRef.current,
            offset: phiRef.current,
          });
        }
        drawDancer(canvas!, phiRef.current, legEmRef.current, armPosRef.current, focusRef.current, renderRef.current);
      } else {
        if (autoRef.current && !dragRef.current) {
          phiRef.current += 0.014 * speedRef.current * dirRef.current;
        }
        drawDancer(canvas!, phiRef.current, legEmRef.current, armPosRef.current, focusRef.current);
      }
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);

    // ── Mouse drag ──────────────────────────────────────────────────────────
    function onDown(e: MouseEvent) {
      dragRef.current  = true;
      lastXRef.current = e.clientX;
      canvas!.style.cursor = "grabbing";
    }
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return;
      const w  = canvas!.getBoundingClientRect().width;
      const dx = e.clientX - lastXRef.current;
      lastXRef.current  = e.clientX;
      phiRef.current   += (dx / w) * Math.PI * 2.8;
    }
    function onUp() {
      dragRef.current = false;
      canvas!.style.cursor = "grab";
    }

    // ── Touch drag ──────────────────────────────────────────────────────────
    function onTStart(e: TouchEvent) {
      dragRef.current  = true;
      lastXRef.current = e.touches[0].clientX;
    }
    function onTMove(e: TouchEvent) {
      if (!dragRef.current) return;
      const w  = canvas!.getBoundingClientRect().width;
      const dx = e.touches[0].clientX - lastXRef.current;
      lastXRef.current  = e.touches[0].clientX;
      phiRef.current   += (dx / w) * Math.PI * 2.8;
    }
    function onTEnd() { dragRef.current = false; }

    canvas.addEventListener("mousedown",  onDown);
    window.addEventListener("mousemove",  onMove);
    window.addEventListener("mouseup",    onUp);
    canvas.addEventListener("touchstart", onTStart, { passive: true });
    canvas.addEventListener("touchmove",  onTMove,  { passive: true });
    canvas.addEventListener("touchend",   onTEnd);
    canvas.style.cursor = "grab";

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("mousedown",  onDown);
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("mouseup",    onUp);
      canvas.removeEventListener("touchstart", onTStart);
      canvas.removeEventListener("touchmove",  onTMove);
      canvas.removeEventListener("touchend",   onTEnd);
    };
  }, []);

  // Slider fill percentages (no style={{}} — use ref callbacks)
  const spdPct = ((speed - DANCER_SPEED_MIN) / (DANCER_SPEED_MAX - DANCER_SPEED_MIN)) * 100;
  const legPct = legEm  * 100;
  const armPct = armPos * 100;

  function mkSlider(
    pct: number,
    fillCls: string,
    thumbCls: string,
    fillRef: React.RefCallback<HTMLDivElement>,
    thumbRef: React.RefCallback<HTMLDivElement>,
    min: number, max: number, step: number,
    value: number,
    onChange: (v: number) => void,
    label: string,
    isInt = false,
  ) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative flex-1 py-2">
          <div className="h-0.5 w-full rounded-full bg-white/10" />
          <div ref={fillRef} className={`pointer-events-none absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full ${fillCls}`} />
          <input
            type="range" min={min} max={max} step={step} value={value}
            onChange={e => onChange(isInt ? parseInt(e.target.value) : parseFloat(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={label}
          />
          <div ref={thumbRef} className={`pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 ${thumbCls}`} />
        </div>
      </div>
    );
  }

  const focusLabel = focus < 18 ? "Head" : focus < 40 ? "Torso" : focus < 62 ? "Hips" : focus < 82 ? "Knee" : "Foot";

  function onTabKey(event: KeyboardEvent<HTMLDivElement>) {
    const key = event.key;
    if (key !== "ArrowRight" && key !== "ArrowLeft" && key !== "Home" && key !== "End") return;
    event.preventDefault();
    const ids = DANCER_TABS.map((item) => item.id);
    const index = ids.indexOf(tab);
    const next = key === "Home"
      ? ids[0]
      : key === "End"
        ? ids[ids.length - 1]
        : ids[(index + (key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length];
    setTab(next);
    document.getElementById(`ad-tab-${next}`)?.focus();
  }

  function saveReport(id: "clockwise" | "counterclockwise" | "unstable") {
    setPerceived(id);
    setReversalArmed(false);
    try {
      const key = "misterylabs.ambiguous-dancer.reports";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.push({
        t: Date.now(),
        perceived: id,
        physical: dirRef.current === 1 ? "cw" : "ccw",
        shaded, perspective, depthCues, floorShadow, markers,
      });
      localStorage.setItem(key, JSON.stringify(prev.slice(-40)));
    } catch { /* storage unavailable */ }
  }

  function reverseYaw() {
    const next: 1 | -1 = dir === 1 ? -1 : 1;
    setDir(next);
    dirRef.current = next;
    setReversalArmed(true);
  }

  if (ride) {
    const turn = (2 * Math.PI) / (DANCER_SPEED_MAX * DANCER_OMEGA);
    return (
      <div className={`ad-cockpit${full ? " is-full" : ""}${collapsed ? " is-bare" : ""}`}>
        <div className="ad-stage">
          <canvas
            ref={canvasRef}
            className="h-full w-full"
            aria-label="Spinning dancer bistable silhouette — drag to rotate manually"
          />
          {markers && (
            <div className="ad-badge">
              physical {dir === 1 ? "cw" : "ccw"}
            </div>
          )}
          <div className="ad-drag">drag · rotate</div>
        </div>

        <section className="ad-dock" aria-label="Ambiguous Dancer controls">
          <div className="ad-dock-top">
            <p className="ad-status" aria-live="polite">
              <span>{speed.toFixed(2)}×</span>
              <span>{autoSpin ? "Running" : "Paused"}</span>
              <span>{shaded ? "Shaded" : "Silhouette"}</span>
              <span>{perceived ? `Report ${perceived}` : "No report"}</span>
            </p>
            <div className="ad-tools">
              <button type="button" className="ad-tool" aria-pressed={collapsed} onClick={() => setCollapsed((v) => !v)}>
                {collapsed ? "Show controls" : "Hide controls"}
              </button>
              <button type="button" className="ad-tool" aria-pressed={full} onClick={() => setFull((v) => !v)}>
                {full ? "Close" : "Expand"}
              </button>
            </div>
          </div>
          <p className="ad-note">
            Missing depth cues leave the silhouette bistable: one drawing fits both physical directions. Your report does not change the yaw.
          </p>

          {collapsed ? null : (
            <>
              <div className="ad-tabs" role="tablist" aria-label="Control groups" onKeyDown={onTabKey}>
                {DANCER_TABS.map((item) => (
                  <button
                    key={item.id}
                    id={`ad-tab-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.id}
                    aria-controls={`ad-panel-${item.id}`}
                    tabIndex={tab === item.id ? 0 : -1}
                    onClick={() => setTab(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="ad-panel" role="tabpanel" id={`ad-panel-${tab}`} aria-labelledby={`ad-tab-${tab}`}>
                {tab === "motion" && (
                  <>
                    <div className="ad-row">
                      <button
                        type="button"
                        className="ad-choice"
                        aria-pressed={autoSpin}
                        onClick={() => { const n = !autoSpin; setAutoSpin(n); autoRef.current = n; }}
                      >
                        {autoSpin ? "Pause" : "Play"}
                      </button>
                      <button type="button" className="ad-choice" onClick={reverseYaw}>
                        Reverse physical direction
                      </button>
                    </div>
                    <label className="ad-slider">
                      <span>
                        <span>Speed</span>
                        <span>{speed.toFixed(2)}×</span>
                      </span>
                      <input
                        type="range"
                        min={DANCER_SPEED_MIN}
                        max={DANCER_SPEED_MAX}
                        step={DANCER_SPEED_STEP}
                        value={speed}
                        aria-label="Rotation speed"
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      />
                    </label>
                    <p className="ad-hint">
                      1× is {DANCER_OMEGA.toFixed(2)} rad/s. {DANCER_SPEED_MAX}× is {(DANCER_SPEED_MAX * DANCER_OMEGA).toFixed(2)} rad/s, about one turn every {turn.toFixed(2)} s. Speed, pause, and reverse keep the current angle.
                    </p>
                    <label className="ad-slider">
                      <span>
                        <span>Leg emphasis</span>
                        <span>{Math.round(legEm * 100)}%</span>
                      </span>
                      <input
                        type="range" min={0} max={1} step={0.01} value={legEm}
                        aria-label="Raised leg height"
                        onChange={(e) => setLegEm(parseFloat(e.target.value))}
                      />
                    </label>
                    <label className="ad-slider">
                      <span>
                        <span>Arm position</span>
                        <span>{Math.round(armPos * 100)}%</span>
                      </span>
                      <input
                        type="range" min={0} max={1} step={0.01} value={armPos}
                        aria-label="Arm extension"
                        onChange={(e) => setArmPos(parseFloat(e.target.value))}
                      />
                    </label>
                    <label className="ad-slider">
                      <span>
                        <span>Focus point</span>
                        <span>{focusLabel}</span>
                      </span>
                      <input
                        type="range" min={0} max={100} step={1} value={focus}
                        aria-label="Focus point on body"
                        onChange={(e) => setFocus(parseInt(e.target.value, 10))}
                      />
                    </label>
                    <p className="ad-hint">Sustained gaze on the foot or hand can trigger a perceptual flip.</p>
                    <button type="button" className="ad-choice ad-block" onClick={() => { phiRef.current = 0.4; }}>
                      Reset motion
                    </button>
                  </>
                )}
                {tab === "appearance" && (
                  <>
                    <div className="ad-row">
                      <button type="button" className="ad-choice" aria-pressed={!shaded} onClick={() => setShaded(false)}>Silhouette</button>
                      <button type="button" className="ad-choice" aria-pressed={shaded} onClick={() => setShaded(true)}>Shaded</button>
                      <button type="button" className="ad-choice" aria-pressed={!perspective} onClick={() => setPerspective(false)}>Orthographic</button>
                      <button type="button" className="ad-choice" aria-pressed={perspective} onClick={() => setPerspective(true)}>Perspective</button>
                    </div>
                    <div className="ad-row">
                      <button type="button" className="ad-choice" aria-pressed={depthCues} onClick={() => setDepthCues((v) => !v)}>
                        Depth cues {depthCues ? "on" : "off"}
                      </button>
                      <button type="button" className="ad-choice" aria-pressed={floorShadow} onClick={() => setFloorShadow((v) => !v)}>
                        Floor shadow {floorShadow ? "on" : "off"}
                      </button>
                      <button type="button" className="ad-choice" aria-pressed={markers} onClick={() => setMarkers((v) => !v)}>
                        Physical marker {markers ? "on" : "off"}
                      </button>
                    </div>
                    <p className="ad-hint">
                      Optional experiments. Shading, perspective, a floor shadow, and the marker add visual evidence. They do not report your perception, and they are off until you turn them on.
                    </p>
                  </>
                )}
                {tab === "observer" && (
                  <div className="ad-report">
                    <div>
                      {reversalArmed
                        ? "Physical yaw just reversed. What did the spin appear to do?"
                        : "Perceived rotation — your report"}
                    </div>
                    <button type="button" className="ad-choice ad-block" aria-pressed={perceived === "clockwise"} onClick={() => saveReport("clockwise")}>
                      Looks clockwise
                    </button>
                    <button type="button" className="ad-choice ad-block" aria-pressed={perceived === "counterclockwise"} onClick={() => saveReport("counterclockwise")}>
                      Looks counter-clockwise
                    </button>
                    <button type="button" className="ad-choice ad-block" aria-pressed={perceived === "unstable"} onClick={() => saveReport("unstable")}>
                      Unstable / unsure
                    </button>
                    <p>
                      Saved in this browser only. The figure is not scored against your answer.
                      {perceived ? ` Last report: ${perceived}.` : ""}
                    </p>
                    <p>
                      Model yaw is {dir === 1 ? "clockwise" : "counter-clockwise"}. Reversing it does not rewrite the pose, and it is not a claim about what you saw.
                    </p>
                    <p>
                      In xPRIMEray, two transport rays entering the same curved boundary from opposite sides make opposite assumptions about which side is interior — and both remain consistent with the boundary's 2D cross-section.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden border border-border/35 bg-card/20 lg:flex-row">

      {/* Canvas */}
      <div className="relative min-h-[320px] flex-1 sm:min-h-[400px] lg:min-h-[480px]">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          aria-label="Spinning dancer bistable silhouette — drag to rotate manually"
        />

        {/* Live status badge */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-sm border border-white/10 bg-black/55 px-2 py-1 backdrop-blur-sm">
          {autoSpin && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400/85" />}
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-violet-400/75">
            {ride ? (dir === 1 ? "physical cw" : "physical ccw") : (dir === 1 ? "clockwise" : "counter-cw")}
          </span>
        </div>

        {/* Drag hint */}
        <div className="absolute bottom-3 right-3 rounded-sm border border-white/8 bg-black/40 px-2 py-1">
          <span className="font-mono text-[7.5px] uppercase tracking-[0.15em] text-white/25">drag · rotate</span>
        </div>
      </div>

      {/* Control panel */}
      <div className="flex w-full flex-col gap-5 border-t border-border/30 bg-secondary/30 p-5 lg:w-72 lg:border-l lg:border-t-0">

        {/* Header */}
        <div>
          <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/45">
            SYS // OBS-PB · Perceptual Bistability
          </div>
          <h3 className="text-base font-semibold tracking-tight">Spinning Dancer</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/55">
            Pure silhouette — no stereo depth cue. Drag to rotate manually. Two observers
            can assign opposite 3D interpretations of the same 2D path and both be
            geometrically consistent.
          </p>
        </div>

        {/* Spin controls */}
        <div>
          <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
            Spin
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => { const n = !autoSpin; setAutoSpin(n); autoRef.current = n; }}
              className={`flex items-center justify-center gap-1.5 rounded-sm border px-2 py-2 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${
                autoSpin
                  ? "border-violet-500/50 bg-violet-950/40 text-violet-300"
                  : "border-border/30 bg-secondary/20 text-muted-foreground/55 hover:border-border/50"
              }`}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${autoSpin ? "animate-pulse bg-violet-400" : "bg-muted-foreground/35"}`} />
              {autoSpin ? "Live" : "Hold"}
            </button>
            {([1, -1] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => { setDir(d); dirRef.current = d; }}
                className={`rounded-sm border px-2 py-2 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${
                  dir === d
                    ? "border-cyan-500/50 bg-cyan-950/30 text-cyan-300"
                    : "border-border/30 bg-secondary/20 text-muted-foreground/55 hover:border-border/50"
                }`}
              >
                {d === 1 ? "CW" : "CCW"}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[9px] leading-relaxed text-muted-foreground/35">
            Both directions are valid 3D readings of the same 2D path.
          </p>
        </div>

        {/* Speed */}
        <div>
          <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
            Speed
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 py-2">
              <div className="h-0.5 w-full rounded-full bg-white/10" />
              <div
                ref={el => { if (el) el.style.width = `${spdPct}%`; }}
                className="pointer-events-none absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-violet-400/60"
              />
              <input
                type="range" min={DANCER_SPEED_MIN} max={DANCER_SPEED_MAX} step={DANCER_SPEED_STEP} value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Rotation speed"
              />
              <div
                ref={el => { if (el) el.style.left = `${spdPct}%`; }}
                className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-violet-400 q-thumb-z"
              />
            </div>
            <span className="w-10 text-right font-mono text-[11px] tabular-nums text-foreground/75">
              {speed.toFixed(2)}×
            </span>
          </div>
        </div>

        {/* Leg emphasis */}
        <div>
          <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
            Leg emphasis
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 py-2">
              <div className="h-0.5 w-full rounded-full bg-white/10" />
              <div
                ref={el => { if (el) el.style.width = `${legPct}%`; }}
                className="pointer-events-none absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-cyan-400/60"
              />
              <input
                type="range" min={0} max={1} step={0.01} value={legEm}
                onChange={e => setLegEm(parseFloat(e.target.value))}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Raised leg height"
              />
              <div
                ref={el => { if (el) el.style.left = `${legPct}%`; }}
                className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-cyan-400 q-thumb-x"
              />
            </div>
            <span className="w-10 text-right font-mono text-[11px] tabular-nums text-foreground/75">
              {Math.round(legEm * 100)}%
            </span>
          </div>
        </div>

        {/* Arm position */}
        <div>
          <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
            Arm position
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 py-2">
              <div className="h-0.5 w-full rounded-full bg-white/10" />
              <div
                ref={el => { if (el) el.style.width = `${armPct}%`; }}
                className="pointer-events-none absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-amber-400/60"
              />
              <input
                type="range" min={0} max={1} step={0.01} value={armPos}
                onChange={e => setArmPos(parseFloat(e.target.value))}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Arm extension"
              />
              <div
                ref={el => { if (el) el.style.left = `${armPct}%`; }}
                className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-amber-400 q-thumb-w"
              />
            </div>
            <span className="w-10 text-right font-mono text-[11px] tabular-nums text-foreground/75">
              {Math.round(armPos * 100)}%
            </span>
          </div>
        </div>

        {/* Focus point */}
        <div>
          <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
            Focus point
          </div>
          <p className="mb-1.5 text-[9px] leading-relaxed text-muted-foreground/35">
            Sustained gaze on the foot or hand can trigger a perceptual flip.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 py-2">
              <div className="h-0.5 w-full rounded-full bg-white/10" />
              <div
                ref={el => { if (el) el.style.width = `${focus}%`; }}
                className="pointer-events-none absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-sky-400/50"
              />
              <input
                type="range" min={0} max={100} step={1} value={focus}
                onChange={e => setFocus(parseInt(e.target.value))}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Focus point on body"
              />
              <div
                ref={el => { if (el) el.style.left = `${focus}%`; }}
                className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-sky-300/80"
              />
            </div>
            <span className="w-12 text-right font-mono text-[9px] text-muted-foreground/55">
              {focusLabel}
            </span>
          </div>
        </div>

        {/* Observer note */}
        <div className="rounded-sm border border-violet-500/15 bg-violet-950/15 px-3.5 py-3">
          <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.2em] text-violet-400/50">
            Transport assumption
          </div>
          <p className="text-[9px] leading-relaxed text-muted-foreground/42">
            In xPRIMEray, two transport rays entering the same curved boundary from
            opposite sides make opposite assumptions about which side is interior — and
            both remain consistent with the boundary's 2D cross-section. This is the
            geometric equivalent of perceptual bistability.
          </p>
        </div>

        {/* Reset */}
        <button
          type="button"
          onClick={() => { phiRef.current = 0.4; }}
          className="rounded-sm border border-border/30 bg-secondary/20 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
        >
          Reset pose
        </button>
      </div>
    </div>
  );
}
