import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  orthographicZoomFor,
  perspectiveStandOff,
} from "@/instruments/higher-dimensional/camera-frame";
import {
  bakeWorldBuffers,
  classifyRelief,
  concaveFromConvex,
  maskAssetUrl,
  reliefDepthSign,
  type MaskBuffers,
} from "@/instruments/higher-dimensional/mask-geometry";
import { renderLoopOwner } from "@/instruments/higher-dimensional/render-loop";

type Subject = "einstein" | "tesla";
type Shape = "convex" | "concave";
type CameraMode = "orbit" | "fixed";
type Projection = "perspective" | "orthographic";
type Viewing = "monocular" | "binocular";
type Report = "convex" | "concave" | "unsure";

type Prepared = {
  convex: MaskBuffers;
  concave: MaskBuffers;
  convexSign: number;
  concaveSign: number;
};

const REPORT_KEY = "misterylabs.hollow-genius.reports";

function toGeometry(buf: MaskBuffers): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(buf.positions, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(buf.normals, 3));
  geo.setIndex(new THREE.BufferAttribute(buf.indices, 1));
  geo.computeBoundingSphere();
  return geo;
}

function firstMesh(root: THREE.Object3D): THREE.Mesh | null {
  let found: THREE.Mesh | null = null;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!found && mesh.isMesh) found = mesh;
  });
  return found;
}

function prepareMesh(mesh: THREE.Mesh): Prepared {
  mesh.updateWorldMatrix(true, true);
  const geo = mesh.geometry;
  const pos = geo.attributes.position.array as Float32Array;
  const nrm = geo.attributes.normal?.array as Float32Array | undefined;
  const indexAttr = geo.index;
  const indices = indexAttr
    ? new Uint32Array(indexAttr.array)
    : Uint32Array.from({ length: pos.length / 3 }, (_, i) => i);
  const normals = nrm ? new Float32Array(nrm) : new Float32Array(pos.length);
  const convex = bakeWorldBuffers(pos, normals, indices, mesh.matrixWorld);
  geo.dispose();
  const concave = concaveFromConvex(convex);
  return {
    convex,
    concave,
    convexSign: reliefDepthSign(convex.positions),
    concaveSign: reliefDepthSign(concave.positions),
  };
}

function NormalLines({ geometry }: { geometry: THREE.BufferGeometry }) {
  const lines = useMemo(() => {
    const pos = geometry.attributes.position;
    const nrm = geometry.attributes.normal;
    const step = Math.max(1, Math.floor(pos.count / 350));
    const arr: number[] = [];
    const scale = 0.06;
    for (let i = 0; i < pos.count; i += step) {
      arr.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      arr.push(
        pos.getX(i) + nrm.getX(i) * scale,
        pos.getY(i) + nrm.getY(i) * scale,
        pos.getZ(i) + nrm.getZ(i) * scale,
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    return g;
  }, [geometry]);
  useEffect(() => () => lines.dispose(), [lines]);
  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial color="#22d3ee" transparent opacity={0.85} />
    </lineSegments>
  );
}

function MaskBody({
  geometry,
  yawRef,
  wireframe,
  normals,
}: {
  geometry: THREE.BufferGeometry;
  yawRef: React.MutableRefObject<number>;
  wireframe: boolean;
  normals: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.rotation.y = yawRef.current;
  });
  return (
    <group ref={group}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#c4a484" roughness={0.62} metalness={0.02} />
      </mesh>
      {wireframe && (
        <mesh geometry={geometry}>
          <meshBasicMaterial color="#fbbf24" wireframe transparent opacity={0.28} />
        </mesh>
      )}
      {normals && <NormalLines geometry={geometry} />}
    </group>
  );
}

function AnaglyphPass({ separation }: { separation: number }) {
  const { gl, scene, camera } = useThree();
  const right = useRef(new THREE.Vector3());
  const base = useRef(new THREE.Vector3());
  useFrame(() => {
    const ctx = gl.getContext();
    const color = gl.state.buffers.color;
    right.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
    base.current.copy(camera.position);
    const prevAutoClear = gl.autoClear;
    gl.autoClear = false;
    const drawEye = (offset: number, mask: [boolean, boolean, boolean, boolean]) => {
      camera.position.copy(base.current).addScaledVector(right.current, offset);
      camera.updateMatrixWorld();
      color.setLocked(false);
      ctx.colorMask(mask[0], mask[1], mask[2], mask[3]);
      color.setLocked(true);
      gl.render(scene, camera);
      color.setLocked(false);
    };
    try {
      gl.clear(true, true, true);
      drawEye(-separation / 2, [true, false, false, true]);
      gl.clearDepth();
      drawEye(separation / 2, [false, true, true, true]);
    } finally {
      color.setLocked(false);
      ctx.colorMask(true, true, true, true);
      color.reset();
      camera.position.copy(base.current);
      camera.updateMatrixWorld();
      gl.autoClear = prevAutoClear;
    }
  }, 1);
  return null;
}

function frameFront(camera: THREE.Camera, viewportHeight: number) {
  if (viewportHeight < 2) return;
  if (camera instanceof THREE.OrthographicCamera) {
    camera.zoom = orthographicZoomFor(viewportHeight);
    camera.position.set(0, 0, 4);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    return;
  }
  if (camera instanceof THREE.PerspectiveCamera) {
    const distance = perspectiveStandOff(camera.fov);
    camera.position.set(0, 0, distance);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
}

function FrameCamera({ resetToken, cameraMode }: { resetToken: number; cameraMode: CameraMode }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls);
  useLayoutEffect(() => {
    const orbit = controls as {
      target?: THREE.Vector3;
      update?: () => void;
      saveState?: () => void;
      _sphericalDelta?: { set: (x: number, y: number, z: number) => void };
      _panOffset?: { set: (x: number, y: number, z: number) => void };
    } | null;
    orbit?._sphericalDelta?.set(0, 0, 0);
    orbit?._panOffset?.set(0, 0, 0);
    if (orbit?.target) orbit.target.set(0, 0, 0);
    frameFront(camera, size.height);
    orbit?.saveState?.();
    orbit?.update?.();
  }, [camera, cameraMode, controls, resetToken, size.height, size.width]);
  return null;
}

function GLWatch({ onLost }: { onLost: (message: string) => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onLost("WebGL context was lost. Reload this page to draw the relief again.");
    };
    el.addEventListener("webglcontextlost", lost);
    return () => el.removeEventListener("webglcontextlost", lost);
  }, [gl, onLost]);
  return null;
}

function webglBlocker(): string | null {
  if (typeof document === "undefined") return null;
  if (typeof WebGLRenderingContext === "undefined") {
    return "This browser has no WebGL. The depth sign above still comes from the vertices, but the relief cannot be drawn.";
  }
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
      return "WebGL did not start. The depth sign above still comes from the vertices, but the relief cannot be drawn.";
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  } catch {
    return "WebGL is blocked. The depth sign above still comes from the vertices, but the relief cannot be drawn.";
  }
}

const GL_FALLBACK = "WebGL could not create a drawing surface for this pane. The other pane may still be available. The depth reading above comes from the vertices, not from this picture.";

function StageLights({ azimuth, elevation }: { azimuth: number; elevation: number }) {
  const az = (azimuth * Math.PI) / 180;
  const el = (elevation * Math.PI) / 180;
  const position: [number, number, number] = [
    Math.cos(el) * Math.sin(az) * 4,
    Math.sin(el) * 4,
    Math.cos(el) * Math.cos(az) * 4,
  ];
  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight position={position} intensity={1.55} />
    </>
  );
}

function MaskViewport({
  geometry,
  yawRef,
  diagnostic,
  cameraMode,
  projection,
  viewing,
  azimuth,
  elevation,
  separation,
  resetToken,
}: {
  geometry: THREE.BufferGeometry;
  yawRef: React.MutableRefObject<number>;
  diagnostic: boolean;
  cameraMode: CameraMode;
  projection: Projection;
  viewing: Viewing;
  azimuth: number;
  elevation: number;
  separation: number;
  resetToken: number;
}) {
  const ortho = projection === "orthographic";
  const manual = renderLoopOwner(diagnostic, viewing) === "anaglyph";
  const [glError, setGlError] = useState<string | null>(null);
  const blocked = useMemo(() => webglBlocker(), []);
  if (blocked || glError) {
    return (
      <p className="p-4 text-xs leading-relaxed text-amber-100" role="status">
        {blocked || glError}
      </p>
    );
  }
  const distance = perspectiveStandOff(32);
  return (
    <ErrorBoundary
      fallback={
        <p className="p-4 text-xs leading-relaxed text-amber-100" role="status">
          {GL_FALLBACK}
        </p>
      }
    >
      <Canvas
        key={projection}
        orthographic={ortho}
        dpr={[1, 1.5]}
        camera={ortho
          ? { zoom: orthographicZoomFor(420), position: [0, 0, 4], near: 0.01, far: 40 }
          : { fov: 32, position: [0, 0, distance], near: 0.05, far: 40 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => gl.setClearColor("#05060c", 1)}
      >
        <FrameCamera resetToken={resetToken} cameraMode={cameraMode} />
        <GLWatch onLost={setGlError} />
        <StageLights azimuth={azimuth} elevation={elevation} />
        <MaskBody geometry={geometry} yawRef={yawRef} wireframe={diagnostic} normals={diagnostic} />
        {cameraMode === "orbit" && (
          <OrbitControls makeDefault enablePan={false} enableDamping={false} target={[0, 0, 0]} />
        )}
        {manual && <AnaglyphPass separation={separation} />}
      </Canvas>
    </ErrorBoundary>
  );
}

function saveReport(entry: Record<string, unknown>) {
  try {
    const prev = JSON.parse(localStorage.getItem(REPORT_KEY) || "[]");
    prev.push(entry);
    localStorage.setItem(REPORT_KEY, JSON.stringify(prev.slice(-40)));
  } catch { /* storage unavailable */ }
}

export function HollowGenius() {
  const [subject, setSubject] = useState<Subject>("einstein");
  const [shape, setShape] = useState<Shape>("concave");
  const [cameraMode, setCameraMode] = useState<CameraMode>("fixed");
  const [projection, setProjection] = useState<Projection>("orthographic");
  const [viewing, setViewing] = useState<Viewing>("monocular");
  const [azimuth, setAzimuth] = useState(28);
  const [elevation, setElevation] = useState(42);
  const [turntable, setTurntable] = useState(true);
  const [spin, setSpin] = useState(0.35);
  const [separation, setSeparation] = useState(0.045);
  const [resetToken, setResetToken] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [error, setError] = useState<string | null>(null);
  const yawRef = useRef(0);
  const spinRef = useRef(spin);
  const turnRef = useRef(turntable);
  useEffect(() => { spinRef.current = spin; }, [spin]);
  useEffect(() => { turnRef.current = turntable; }, [turntable]);

  useEffect(() => {
    let dead = false;
    const loader = new GLTFLoader();
    setPrepared(null);
    setError(null);
    loader.load(
      maskAssetUrl(subject),
      (gltf) => {
        if (dead) return;
        const mesh = firstMesh(gltf.scene);
        if (!mesh) {
          setError("The mask file has no mesh.");
          return;
        }
        const next = prepareMesh(mesh);
        mesh.geometry.dispose();
        setPrepared(next);
      },
      undefined,
      () => { if (!dead) setError("The mask file did not load."); },
    );
    return () => { dead = true; };
  }, [subject]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (turnRef.current) yawRef.current += spinRef.current * dt;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const convexGeo = useMemo(() => (prepared ? toGeometry(prepared.convex) : null), [prepared]);
  const concaveGeo = useMemo(() => (prepared ? toGeometry(prepared.concave) : null), [prepared]);
  useEffect(() => () => { convexGeo?.dispose(); }, [convexGeo]);
  useEffect(() => () => { concaveGeo?.dispose(); }, [concaveGeo]);
  const geometry = shape === "convex" ? convexGeo : concaveGeo;
  const sign = prepared ? (shape === "convex" ? prepared.convexSign : prepared.concaveSign) : 0;
  const kind = classifyRelief(sign);

  const shared = {
    yawRef,
    cameraMode,
    projection,
    viewing,
    azimuth,
    elevation,
    separation,
    resetToken,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <figure className="order-2 overflow-hidden border border-cyan-500/25 bg-black lg:order-1">
          <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-300/80">Ground truth</span>
            <span className="font-mono text-[10px] text-cyan-100/80">{prepared ? kind : "…"}</span>
          </figcaption>
          <div className="relative h-[320px] sm:h-[420px]">
            {geometry && <MaskViewport geometry={geometry} diagnostic {...shared} />}
            {!geometry && !error && <p className="p-4 font-mono text-xs text-white/50">Loading {subject} relief…</p>}
            {error && <p className="p-4 text-xs text-amber-200">{error}</p>}
          </div>
          <p className="border-t border-white/10 px-3 py-2 text-[11px] leading-relaxed text-white/55">
            Computed from vertex positions: the central region is {sign >= 0 ? "closer to" : "farther from"} a camera on +Z than the periphery
            {prepared ? ` (depth sign ${sign.toFixed(3)})` : ""}. Wireframe and normals follow the surface that is actually drawn.
            Cover this pane if you want to judge the other one first.
          </p>
        </figure>

        <figure className="order-1 overflow-hidden border border-amber-500/25 bg-black lg:order-2">
          <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-300/80">Appearance</span>
            <span className="font-mono text-[10px] text-white/45">not a perception model</span>
          </figcaption>
          <div className="relative h-[320px] sm:h-[420px]">
            {geometry && <MaskViewport geometry={geometry} diagnostic={false} {...shared} />}
          </div>
          <div className="border-t border-white/10 px-3 py-3">
            <p className="mb-2 text-[11px] leading-relaxed text-white/60">
              What does this shaded view look like? The page does not infer an answer from the geometry.
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                ["convex", "Looks convex"],
                ["concave", "Looks concave"],
                ["unsure", "Unsure"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setReport(id);
                    saveReport({
                      t: Date.now(), subject, shape, cameraMode, projection, viewing, report: id, truth: kind,
                    });
                  }}
                  className={`min-h-11 rounded-sm border px-1 py-2 text-[11px] ${
                    report === id ? "border-amber-400/70 text-amber-100" : "border-white/15 text-white/70"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {report && (
              <p className="mt-2 text-[11px] text-white/45">
                Recorded: you reported “{report}”. Geometry on screen is a {kind}. Those can disagree. The report stays in this browser.
              </p>
            )}
          </div>
        </figure>
      </div>

      <div className="grid gap-4 border border-border/35 bg-secondary/20 p-4 md:grid-cols-2">
        <ControlGroup label="Subject">
          {(["einstein", "tesla"] as const).map((id) => (
            <Toggle key={id} on={subject === id} onClick={() => setSubject(id)}>
              {id === "einstein" ? "Einstein" : "Tesla"}
            </Toggle>
          ))}
        </ControlGroup>
        <ControlGroup label="Geometry">
          <Toggle on={shape === "convex"} onClick={() => setShape("convex")}>Convex relief</Toggle>
          <Toggle on={shape === "concave"} onClick={() => setShape("concave")}>Concave shell</Toggle>
        </ControlGroup>
        <ControlGroup label="Camera">
          <Toggle on={cameraMode === "orbit"} onClick={() => setCameraMode("orbit")}>Orbit</Toggle>
          <Toggle on={cameraMode === "fixed"} onClick={() => setCameraMode("fixed")}>Fixed</Toggle>
          <Toggle on={projection === "perspective"} onClick={() => setProjection("perspective")}>Perspective</Toggle>
          <Toggle on={projection === "orthographic"} onClick={() => setProjection("orthographic")}>Orthographic</Toggle>
          <button
            type="button"
            onClick={() => setResetToken((n) => n + 1)}
            className="min-h-11 rounded-sm border border-border/40 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground/80"
          >
            Reset camera
          </button>
        </ControlGroup>
        <ControlGroup label="Eyes">
          <Toggle on={viewing === "monocular"} onClick={() => setViewing("monocular")}>Monocular</Toggle>
          <Toggle on={viewing === "binocular"} onClick={() => setViewing("binocular")}>Binocular</Toggle>
          <Toggle on={turntable} onClick={() => setTurntable((v) => !v)}>{turntable ? "Turntable on" : "Turntable off"}</Toggle>
        </ControlGroup>
        <Slider label="Light azimuth" min={-180} max={180} step={1} value={azimuth} onChange={setAzimuth} unit="°" />
        <Slider label="Light elevation" min={5} max={85} step={1} value={elevation} onChange={setElevation} unit="°" />
        <Slider label="Turntable speed" min={0} max={1.2} step={0.01} value={spin} onChange={setSpin} unit=" rad/s" />
        <Slider label="Camera separation" min={0} max={0.12} step={0.005} value={separation} onChange={setSeparation} unit="" />
      </div>
    </div>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/45">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-sm border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] ${
        on ? "border-amber-500/50 bg-amber-950/40 text-amber-200" : "border-border/30 text-muted-foreground/60"
      }`}
    >
      {children}
    </button>
  );
}

function Slider({
  label, min, max, step, value, onChange, unit,
}: {
  label: string; min: number; max: number; step: number; value: number; onChange: (n: number) => void; unit: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/45">
        <span>{label}</span>
        <span className="tabular-nums text-foreground/70">{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>
      </div>
      <input
        className="h-11 w-full accent-amber-400"
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
      />
    </label>
  );
}
