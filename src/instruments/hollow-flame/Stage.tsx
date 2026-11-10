import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { flameRadius, shellRadius } from "@/instruments/hollow-flame/physics";
import { CELL_FRAG, CELL_VERT, FLAME_FRAG, FLAME_VERT, SHEATH_FRAG, SHEATH_VERT } from "@/instruments/hollow-flame/shaders";
import { sim, type CameraCue } from "@/instruments/hollow-flame/sim";
import { getDock } from "@/instruments/hollow-flame/dock";

const VAPOR = 56;
const OXY = 72;

function makeDot() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  if (!g) return new THREE.Texture();
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.45, "rgba(255,255,255,0.45)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function modeIndex(mode: string) {
  if (mode === "temperature") return 1;
  if (mode === "reaction") return 2;
  if (mode === "section") return 3;
  return 0;
}

function FlameVolume() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uAmp: { value: 0 },
          uFuel: { value: 0.72 },
          uOxygen: { value: 0.8 },
          uAir: { value: 0.18 },
          uHeight: { value: 1.2 },
          uThick: { value: 0.08 },
          uMode: { value: 0 },
          uFlicker: { value: 1 },
        },
        vertexShader: FLAME_VERT,
        fragmentShader: FLAME_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
      }),
    [],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((_, delta) => {
    const u = mat.uniforms;
    const step = Math.min(delta, 0.05);
    u.uTime.value += sim.reduced ? step * 0.2 : step;
    u.uAmp.value = sim.amp;
    u.uFuel.value = sim.fuel;
    u.uOxygen.value = sim.oxygen;
    u.uAir.value = sim.airEff;
    u.uHeight.value = Math.max(0.12, sim.size);
    u.uThick.value = sim.thickness;
    u.uMode.value = modeIndex(sim.mode);
    u.uFlicker.value = sim.reduced ? 0 : 1;
  });
  return (
    <mesh ref={mesh} position={[0, 1.2, 0]} material={mat} renderOrder={3}>
      <boxGeometry args={[2.8, 2.4, 2.8]} />
    </mesh>
  );
}

function Candle() {
  const glow = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const mesh = glow.current;
    if (!mesh) return;
    const m = mesh.material as THREE.MeshBasicMaterial;
    m.opacity = 0.15 + sim.amp * 0.9;
    const s = 0.6 + sim.amp * 1.4;
    mesh.scale.setScalar(s);
  });
  return (
    <group>
      <mesh position={[0, -0.78, 0]}>
        <cylinderGeometry args={[0.62, 0.68, 0.08, 28]} />
        <meshStandardMaterial color="#14110f" roughness={0.92} />
      </mesh>
      <mesh position={[0, -0.36, 0]}>
        <cylinderGeometry args={[0.22, 0.24, 0.7, 28]} />
        <meshStandardMaterial color="#e4d0ae" roughness={0.78} metalness={0} />
      </mesh>
      <mesh position={[0, -0.02, 0]} scale={[1, 0.28, 1]}>
        <sphereGeometry args={[0.22, 24, 16]} />
        <meshStandardMaterial color="#c9a36a" roughness={0.45} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.16, 8]} />
        <meshStandardMaterial color="#1a120e" roughness={1} />
      </mesh>
      <mesh ref={glow} position={[0, 0.12, 0]} renderOrder={2}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color="#ffb15a" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

type Spec = { y: number; ang: number; rad: number; speed: number };

function Motes({ dot }: { dot: THREE.Texture }) {
  const vaporPos = useMemo(() => new Float32Array(VAPOR * 3), []);
  const oxyPos = useMemo(() => new Float32Array(OXY * 3), []);
  const vaporSpecs = useMemo(() => {
    const list: Spec[] = [];
    for (let i = 0; i < VAPOR; i++) {
      list.push({ y: Math.random(), ang: Math.random() * Math.PI * 2, rad: Math.random() * 0.08, speed: 0.25 + Math.random() * 0.45 });
    }
    return list;
  }, []);
  const oxySpecs = useMemo(() => {
    const list: Spec[] = [];
    for (let i = 0; i < OXY; i++) {
      list.push({
        y: Math.random() * 1.2,
        ang: Math.random() * Math.PI * 2,
        rad: 0.4 + Math.random() * 0.45,
        speed: 0.08 + Math.random() * 0.16,
      });
    }
    return list;
  }, []);
  const vaporGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(vaporPos, 3));
    return g;
  }, [vaporPos]);
  const oxyGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(oxyPos, 3));
    return g;
  }, [oxyPos]);
  const vaporMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#b9a28c",
        size: 0.045,
        map: dot,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [dot],
  );
  const oxyMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#b7e0e8",
        size: 0.05,
        map: dot,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    [dot],
  );
  useEffect(
    () => () => {
      vaporGeo.dispose();
      oxyGeo.dispose();
      vaporMat.dispose();
      oxyMat.dispose();
    },
    [oxyGeo, oxyMat, vaporGeo, vaporMat],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05) * (sim.reduced ? 0.25 : 1);
    const h = Math.max(0.25, sim.size);
    const pull = 0.15 + sim.amp * 1.5;
    for (let i = 0; i < VAPOR; i++) {
      const s = vaporSpecs[i];
      s.y += s.speed * dt * (0.4 + sim.amp + sim.smoke);
      if (s.y > h * (sim.smoke > 0.2 ? 1.35 : 1)) {
        s.y = Math.random() * 0.08;
        s.ang = Math.random() * Math.PI * 2;
        s.rad = Math.random() * 0.06;
      }
      const lean = sim.airEff * 0.52 * s.y;
      vaporPos[i * 3] = Math.cos(s.ang) * s.rad + lean;
      vaporPos[i * 3 + 1] = s.y;
      vaporPos[i * 3 + 2] = Math.sin(s.ang) * s.rad;
    }
    for (let i = 0; i < OXY; i++) {
      const s = oxySpecs[i];
      const t = Math.min(1, Math.max(0, s.y / h));
      const target = Math.max(0.04, shellRadius(t, sim.fuel, sim.oxygen));
      s.rad += (target - s.rad) * Math.min(1, dt * pull);
      s.y += s.speed * dt * (0.45 + sim.amp);
      s.ang += dt * 0.25;
      if (s.y > h * 1.05) {
        s.y = Math.random() * h * 0.85;
        s.ang = Math.random() * Math.PI * 2;
        s.rad = flameRadius(Math.random(), sim.fuel) + 0.25 + Math.random() * 0.35;
      }
      const lean = sim.airEff * 0.52 * s.y;
      oxyPos[i * 3] = Math.cos(s.ang) * s.rad + lean;
      oxyPos[i * 3 + 1] = s.y;
      oxyPos[i * 3 + 2] = Math.sin(s.ang) * s.rad;
    }
    vaporGeo.attributes.position.needsUpdate = true;
    oxyGeo.attributes.position.needsUpdate = true;
    const field = sim.mode === "section" || sim.mode === "reaction";
    vaporMat.opacity = Math.min(0.85, sim.smoke * 0.5 + sim.amp * (field ? 0.7 : 0.38));
    oxyMat.opacity = (field ? 0.72 : 0.2) * (0.3 + sim.amp * 0.7);
    vaporMat.color.set(sim.smoke > 0.25 ? "#9a9086" : "#b9a28c");
  });

  return (
    <group renderOrder={2}>
      <points geometry={vaporGeo} material={vaporMat} />
      <points geometry={oxyGeo} material={oxyMat} />
    </group>
  );
}

function Plasmoid({ clip }: { clip: THREE.Plane }) {
  const outer = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uDisrupt: { value: 0 },
          uMode: { value: 0 },
          uAmp: { value: 0 },
          uCut: { value: 0 },
          uPower: { value: 1.6 },
          uColor: { value: new THREE.Color("#9ec9d4") },
        },
        vertexShader: SHEATH_VERT,
        fragmentShader: SHEATH_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const inner = useMemo(() => {
    const m = outer.clone();
    m.uniforms = {
      uTime: { value: 0 },
      uDisrupt: { value: 0 },
      uMode: { value: 0 },
      uAmp: { value: 0 },
      uCut: { value: 0 },
      uPower: { value: 2.8 },
      uColor: { value: new THREE.Color("#f4f7f2") },
    };
    return m;
  }, [outer]);
  const torusMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#e7f6f8",
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );
  useEffect(
    () => () => {
      outer.dispose();
      inner.dispose();
      torusMat.dispose();
    },
    [inner, outer, torusMat],
  );
  const spin = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05);
    const cut = sim.mode === "section" ? 1 : 0;
    for (const m of [outer, inner]) {
      m.uniforms.uTime.value += sim.reduced ? step * 0.2 : step;
      m.uniforms.uDisrupt.value = sim.airEff;
      m.uniforms.uMode.value = modeIndex(sim.mode);
      m.uniforms.uAmp.value = Math.max(sim.amp, 0.05);
      m.uniforms.uCut.value = cut;
    }
    torusMat.opacity = 0.15 + sim.amp * 0.8;
    torusMat.clippingPlanes = cut ? [clip] : [];
    if (spin.current && !sim.reduced) spin.current.rotation.y += step * 0.35;
    if (spin.current && !sim.reduced) spin.current.rotation.z += step * 0.12;
  });
  return (
    <group position={[0, 0.78, 0]}>
      <mesh position={[0, -0.78, 0]}>
        <cylinderGeometry args={[0.7, 0.76, 0.08, 28]} />
        <meshStandardMaterial color="#14110f" roughness={0.92} />
      </mesh>
      <mesh material={outer}>
        <sphereGeometry args={[0.78, 48, 32]} />
      </mesh>
      <mesh material={inner}>
        <sphereGeometry args={[0.6, 40, 28]} />
      </mesh>
      <group ref={spin}>
        <mesh material={torusMat} rotation={[Math.PI / 2.4, 0.2, 0]}>
          <torusGeometry args={[0.46, 0.012, 8, 48]} />
        </mesh>
        <mesh material={torusMat} rotation={[0.4, 0.6, Math.PI / 2]}>
          <torusGeometry args={[0.34, 0.008, 8, 40]} />
        </mesh>
      </group>
    </group>
  );
}

function CellBody({ clip }: { clip: THREE.Plane }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMode: { value: 0 },
          uAmp: { value: 0 },
          uCut: { value: 0 },
          uWound: { value: 0 },
        },
        vertexShader: CELL_VERT,
        fragmentShader: CELL_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const nucleus = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f3eadc",
        emissive: "#e8893a",
        emissiveIntensity: 0.08,
        roughness: 0.42,
      }),
    [],
  );
  const organ = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#9ec9d4",
        roughness: 0.55,
        transparent: true,
        opacity: 0.85,
      }),
    [],
  );
  useEffect(
    () => () => {
      mat.dispose();
      nucleus.dispose();
      organ.dispose();
    },
    [mat, nucleus, organ],
  );
  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05);
    mat.uniforms.uTime.value += sim.reduced ? step * 0.15 : step;
    mat.uniforms.uMode.value = modeIndex(sim.mode);
    mat.uniforms.uAmp.value = Math.max(sim.amp, 0.04);
    mat.uniforms.uCut.value = sim.mode === "section" ? 1 : 0;
    mat.uniforms.uWound.value = sim.wound;
    const planes = sim.mode === "section" ? [clip] : [];
    nucleus.clippingPlanes = planes;
    organ.clippingPlanes = planes;
    nucleus.emissiveIntensity = 0.02 + sim.amp * 0.22;
    organ.opacity = 0.25 + sim.amp * 0.6;
  });
  return (
    <group position={[0, 0.8, 0]}>
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.7, 0.76, 0.08, 28]} />
        <meshStandardMaterial color="#14110f" roughness={0.92} />
      </mesh>
      <mesh material={mat}>
        <sphereGeometry args={[0.74, 48, 32]} />
      </mesh>
      <mesh material={nucleus} position={[0.02, 0.04, 0]}>
        <sphereGeometry args={[0.2, 28, 20]} />
      </mesh>
      <mesh material={organ} position={[-0.22, -0.08, 0.12]} scale={[1.4, 0.7, 0.7]}>
        <sphereGeometry args={[0.1, 16, 12]} />
      </mesh>
      <mesh material={organ} position={[0.18, -0.16, -0.1]} scale={[0.8, 1.3, 0.8]}>
        <sphereGeometry args={[0.08, 16, 12]} />
      </mesh>
      <mesh material={organ} position={[0.05, 0.22, -0.16]}>
        <sphereGeometry args={[0.07, 14, 12]} />
      </mesh>
    </group>
  );
}

const FRAMES: Record<Exclude<CameraCue, "">, { pos: [number, number, number]; target: [number, number, number] }> = {
  three: { pos: [1.42, 1.18, 2.72], target: [0, 0.62, 0] },
  above: { pos: [0.18, 3.15, 0.48], target: [0, 0.5, 0] },
  wide: { pos: [0.1, 1.55, 11.2], target: [0, 0.48, 0] },
};

function place(
  camera: THREE.Camera,
  controls: { target: THREE.Vector3; update: () => void } | null,
  cue: Exclude<CameraCue, "">,
) {
  const f = FRAMES[cue];
  camera.position.set(f.pos[0], f.pos[1], f.pos[2]);
  if (controls) {
    controls.target.set(f.target[0], f.target[1], f.target[2]);
    controls.update();
  }
}

function Scene({ dot }: { dot: THREE.Texture }) {
  const flame = useRef<THREE.Group>(null);
  const plasma = useRef<THREE.Group>(null);
  const cell = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const booted = useRef(false);
  const lastMode = useRef(sim.mode);
  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const layoutKey = useRef("");

  useFrame((state) => {
    const live = state.controls as { target: THREE.Vector3; update: () => void } | null;
    if (!booted.current) {
      booted.current = true;
      place(state.camera, live, "three");
    }
    if (sim.cameraCue) {
      const cue = sim.cameraCue;
      sim.cameraCue = "";
      place(state.camera, live, cue);
    }
    if (sim.mode !== lastMode.current) {
      lastMode.current = sim.mode;
      if (sim.mode === "section" && state.camera.position.x < 0.35) {
        state.camera.position.x = Math.abs(state.camera.position.x) + 0.4;
        live?.update();
      }
    }
    const manifold = sim.subject === "manifold";
    const dock = getDock();
    const narrow = window.innerWidth < 480;
    const tuck = manifold && narrow && dock.open && dock.tab !== "compare";
    const squeeze = manifold && narrow && dock.open && dock.tab === "compare";
    const cueKey = `${dock.open ? 1 : 0}:${dock.tab}:${narrow ? 1 : 0}:${sim.subject}`;
    if (cueKey !== layoutKey.current) {
      layoutKey.current = cueKey;
      if (squeeze && live) {
        const offset = tmp.copy(state.camera.position).sub(live.target);
        const dist = offset.length();
        if (dist > 0.2 && dist < 6.4) {
          offset.multiplyScalar(6.4 / dist);
          state.camera.position.copy(live.target).add(offset);
          live.update();
        }
      }
    }
    if (flame.current) {
      flame.current.visible = sim.subject === "flame" || manifold;
      flame.current.position.x = manifold && !tuck ? (squeeze ? -1.02 : -1.45) : 0;
      const s = !manifold || tuck ? 1 : squeeze ? 0.68 : 0.8;
      flame.current.scale.setScalar(s);
    }
    if (plasma.current) {
      plasma.current.visible = (sim.subject === "plasmoid" || manifold) && !tuck;
      plasma.current.position.x = 0;
      plasma.current.scale.setScalar(manifold ? (squeeze ? 0.62 : 0.78) : 1);
    }
    if (cell.current) {
      cell.current.visible = (sim.subject === "cell" || manifold) && !tuck;
      cell.current.position.x = manifold && !tuck ? (squeeze ? 1.02 : 1.45) : 0;
      cell.current.scale.setScalar(manifold ? (squeeze ? 0.62 : 0.78) : 1);
    }
    if (light.current) {
      const warm = sim.subject === "plasmoid" ? "#d5eef5" : sim.subject === "cell" ? "#f0c9a4" : "#ff9a3c";
      light.current.color.set(warm);
      light.current.intensity = 1.2 + sim.amp * (sim.subject === "flame" || manifold ? 8 : 3.5);
      const host = sim.subject === "plasmoid" ? plasma.current : sim.subject === "cell" ? cell.current : flame.current;
      if (host) {
        host.getWorldPosition(tmp);
        light.current.position.set(tmp.x, tmp.y + 0.9, tmp.z + 0.35);
      }
    }
  });

  return (
    <>
      <color attach="background" args={["#090807"]} />
      <hemisphereLight args={["#f3eadc", "#1a120e", 0.55]} />
      <directionalLight position={[2.4, 4.2, 2.2]} intensity={1.15} color="#fff4e6" />
      <pointLight ref={light} position={[0, 1.1, 0.4]} intensity={2} distance={7} decay={2} color="#ff9a3c" />
      <group ref={flame}>
        <Candle />
        <Motes dot={dot} />
        <FlameVolume />
      </group>
      <group ref={plasma}>
        <Plasmoid clip={clip} />
      </group>
      <group ref={cell}>
        <CellBody clip={clip} />
      </group>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.35}
        maxDistance={16}
        minPolarAngle={0.12}
        maxPolarAngle={1.45}
        target={[0, 0.62, 0]}
      />
    </>
  );
}

export function Stage() {
  const dot = useMemo(() => makeDot(), []);
  useEffect(() => () => dot.dispose(), [dot]);
  const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 820 ? 1.15 : 1.6);
  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [1.42, 1.18, 2.72], fov: 32, near: 0.08, far: 40 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", failIfMajorPerformanceCaveat: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.localClippingEnabled = true;
      }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
    >
      <Scene dot={dot} />
    </Canvas>
  );
}
