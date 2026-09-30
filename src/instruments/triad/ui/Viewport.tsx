import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { AIRFRAME_MESH, B777, airframeExtent } from "../sim/airframe";
import { BORE_LEAD, BORE_MAX, BORE_RING, engine } from "../sim/engine";
import { PAL } from "../sim/palette";
import { displayWeights } from "./displayFocus";

const FIELD_N = 52;
const LOCUS_RGB: [number, number, number][] = [
  [0.96, 0.97, 0.99],
  [0.62, 0.7, 0.78],
  [0.78, 0.84, 0.9],
];

function Aircraft() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const d = engine.display;
    g.position.set(0, d.acY, 0);
    g.quaternion.set(d.quat.x, d.quat.y, d.quat.z, d.quat.w);
    const opacity = displayWeights().aircraft;
    g.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (!mat || !("opacity" in mat)) return;
      mat.transparent = opacity < 0.999;
      mat.opacity = opacity;
    });
  });
  const skin = { color: PAL.model, metalness: 0.28, roughness: 0.42 };
  const metal = { color: PAL.metal, metalness: 0.38, roughness: 0.4 };
  const hot = { color: PAL.ink, metalness: 0.5, roughness: 0.35 };
  return (
    <group ref={ref}>
      <mesh position={AIRFRAME_MESH.fuse.position} rotation={AIRFRAME_MESH.fuse.rotation}>
        <cylinderGeometry args={[AIRFRAME_MESH.fuse.radius, AIRFRAME_MESH.fuse.radius, AIRFRAME_MESH.fuse.length, 28]} />
        <meshStandardMaterial {...skin} />
      </mesh>
      <mesh position={AIRFRAME_MESH.nose.position} rotation={AIRFRAME_MESH.nose.rotation}>
        <coneGeometry args={[AIRFRAME_MESH.nose.radius, AIRFRAME_MESH.nose.length, 28]} />
        <meshStandardMaterial {...skin} />
      </mesh>
      <mesh position={AIRFRAME_MESH.tail.position} rotation={AIRFRAME_MESH.tail.rotation}>
        <coneGeometry args={[AIRFRAME_MESH.tail.radius, AIRFRAME_MESH.tail.length, 24]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      {AIRFRAME_MESH.boxes.map((b) => (
        <mesh key={b.name} position={b.position} rotation={b.rotation}>
          <boxGeometry args={b.size} />
          <meshStandardMaterial {...(b.name === "fin" ? skin : metal)} />
        </mesh>
      ))}
      {AIRFRAME_MESH.nacelles.map((n) => (
        <mesh key={n.name} position={n.position} rotation={n.rotation}>
          <cylinderGeometry args={[n.radius, n.radius * 0.92, n.length, 20]} />
          <meshStandardMaterial {...hot} />
        </mesh>
      ))}
      <mesh position={[0, 1.55, 2]}>
        <boxGeometry args={[0.18, 0.12, 36]} />
        <meshStandardMaterial color={PAL.obs} />
      </mesh>
      <NoseLead />
    </group>
  );
}

/** Local hypothesis lead. A few tens of meters on the nose axis. Not the destination anchor. */
function NoseLead() {
  const ref = useRef<THREE.Mesh>(null);
  const tip = useMemo(() => airframeExtent().noseTip, []);
  const len = 36;
  useFrame(() => {
    const mesh = ref.current;
    if (mesh) mesh.visible = engine.params.vacuumBore === true;
  });
  return (
    <mesh ref={ref} visible={false} position={[0, 0, tip + len / 2]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[2.4, 3.6, len, 20, 1, true]} />
      <meshBasicMaterial color={PAL.hyp} transparent opacity={0.33} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Markers() {
  const nodes = useRef<THREE.Group>(null);
  const slots = useRef<THREE.Group>(null);
  const pres = useRef<THREE.Group>(null);
  const shells = useRef<THREE.Group>(null);
  const triangle = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(9), 3));
    const line = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: PAL.model }));
    line.frustumCulled = false;
    return line;
  }, []);
  const guide = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(engine.display.guide, 3));
    const line = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: PAL.obs }));
    line.frustumCulled = false;
    return line;
  }, []);
  useFrame(() => {
    const d = engine.display;
    const attr = guide.geometry.getAttribute("position") as THREE.BufferAttribute;
    attr.needsUpdate = true;
    const tri = triangle.geometry.getAttribute("position") as THREE.BufferAttribute;
    d.nodes.forEach((p, i) => tri.setXYZ(i, p.x, p.y, p.z));
    tri.needsUpdate = true;
    const place = (group: THREE.Group | null, pts: { x: number; y: number; z: number }[], visible: boolean) => {
      if (!group) return;
      group.visible = visible;
      pts.forEach((p, i) => {
        const m = group.children[i] as THREE.Object3D | undefined;
        if (m) m.position.set(p.x, p.y, p.z);
      });
    };
    place(nodes.current, d.nodes, true);
    place(slots.current, d.slots, true);
    place(pres.current, d.predetermined, d.showPredetermined);
    place(shells.current, d.nodes, d.plasma);
    d.nodeDark.forEach((dark, i) => {
      const m = nodes.current?.children[i] as THREE.Mesh | undefined;
      const mat = m?.material as THREE.MeshStandardMaterial | undefined;
      if (!mat) return;
      const rgb = LOCUS_RGB[i];
      mat.color.setRGB(rgb[0], rgb[1], rgb[2]);
      mat.emissive.setRGB(rgb[0], rgb[1], rgb[2]);
      mat.emissiveIntensity = (dark ? 0.08 : 1.15) * displayWeights().nodes;
      mat.opacity = (dark ? 0.35 : 1) * Math.max(0.45, displayWeights().nodes);
    });
  });
  return (
    <>
      <primitive object={guide} />
      <primitive object={triangle} />
      <group ref={nodes}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[2.2, 20, 16]} />
            <meshStandardMaterial
              color={PAL.model}
              emissive={PAL.model}
              emissiveIntensity={2.2}
              toneMapped={false}
              transparent
            />
          </mesh>
        ))}
      </group>
      <group ref={slots}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <octahedronGeometry args={[1.3, 0]} />
            <meshBasicMaterial color={PAL.obs} wireframe />
          </mesh>
        ))}
      </group>
      <group ref={pres}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <boxGeometry args={[1.6, 1.6, 1.6]} />
            <meshBasicMaterial color={PAL.obs} wireframe />
          </mesh>
        ))}
      </group>
      <group ref={shells}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[5.5, 16, 12]} />
            <meshBasicMaterial color={PAL.hyp} transparent opacity={0.18} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </>
  );
}

function FieldSlice() {
  const mesh = useRef<THREE.Mesh>(null);
  const rev = useRef(-1);
  const tex = useMemo(() => {
    const t = new THREE.DataTexture(engine.display.field, FIELD_N, FIELD_N, THREE.RGBAFormat);
    t.flipY = false;
    t.needsUpdate = true;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearFilter;
    t.colorSpace = THREE.NoColorSpace;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  }, []);
  const e1 = useMemo(() => new THREE.Vector3(), []);
  const e2 = useMemo(() => new THREE.Vector3(), []);
  const n = useMemo(() => new THREE.Vector3(), []);
  const basis = useMemo(() => new THREE.Matrix4(), []);
  useFrame(() => {
    const d = engine.display;
    if (!mesh.current) return;
    mesh.current.visible = d.showField;
    const mat = mesh.current.material as THREE.MeshBasicMaterial;
    mat.opacity = displayWeights().field;
    mesh.current.position.set(0, d.acY, 0);
    e1.set(d.plane.e1x, d.plane.e1y, d.plane.e1z);
    e2.set(d.plane.e2x, d.plane.e2y, d.plane.e2z);
    n.set(d.plane.nx, d.plane.ny, d.plane.nz);
    basis.makeBasis(e1, e2, n);
    mesh.current.quaternion.setFromRotationMatrix(basis);
    mesh.current.scale.set(d.fieldSpan, d.fieldSpan, 1);
    if (rev.current !== d.fieldRev) {
      rev.current = d.fieldRev;
      tex.needsUpdate = true;
    }
  });
  return (
    <mesh ref={mesh}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function BoreHistory() {
  const ringLines = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(BORE_MAX * BORE_RING * 2 * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(BORE_MAX * BORE_RING * 2 * 3), 3));
    geo.setDrawRange(0, 0);
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 });
    const line = new THREE.LineSegments(geo, mat);
    line.frustumCulled = false;
    return line;
  }, []);
  const trails = useMemo(
    () =>
      LOCUS_RGB.map((rgb) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(BORE_MAX * 3), 3));
        geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(BORE_MAX * 3), 3));
        geo.setDrawRange(0, 0);
        const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true });
        const line = new THREE.Line(geo, mat);
        line.frustumCulled = false;
        return { line, rgb };
      }),
    [],
  );
  const beads = useMemo(
    () =>
      LOCUS_RGB.map((rgb) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(BORE_MAX * 3), 3));
        geo.setDrawRange(0, 0);
        const mat = new THREE.PointsMaterial({
          color: new THREE.Color(rgb[0], rgb[1], rgb[2]),
          size: 1.7,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
        });
        const pts = new THREE.Points(geo, mat);
        pts.frustumCulled = false;
        return pts;
      }),
    [],
  );
  const tube = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array((BORE_MAX + 1 + BORE_LEAD) * BORE_RING * 3), 3),
    );
    geo.setIndex(new THREE.BufferAttribute(new Uint32Array((BORE_MAX + BORE_LEAD) * BORE_RING * 6), 1));
    geo.setDrawRange(0, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: PAL.hyp,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 1;
    return mesh;
  }, []);
  useFrame(() => {
    const d = engine.display;
    const n = d.boreCount;
    const locus = displayWeights().locus;
    (ringLines.material as THREE.LineBasicMaterial).opacity = 0.85 * locus;
    trails.forEach((entry) => {
      (entry.line.material as THREE.LineBasicMaterial).opacity = locus;
    });
    beads.forEach((bead) => {
      (bead.material as THREE.PointsMaterial).opacity = 0.95 * locus;
    });
    (tube.material as THREE.MeshBasicMaterial).opacity = 0.28 * Math.max(locus, 0.35);
    const windowS = Math.max(1, engine.params.historyS);
    ringLines.visible = d.boreOn && n > 0;
    const rPos = ringLines.geometry.getAttribute("position") as THREE.BufferAttribute;
    const rCol = ringLines.geometry.getAttribute("color") as THREE.BufferAttribute;
    let seg = 0;
    if (d.boreOn) {
      for (let s = 0; s < n; s++) {
        if (!d.pitchMark[s]) continue;
        const fade = Math.max(0.35, 1 - d.boreAge[s] / windowS);
        const shade = 0.55 * fade;
        for (let k = 0; k < BORE_RING; k++) {
          const a = (s * BORE_RING + k) * 3;
          const b = (s * BORE_RING + ((k + 1) % BORE_RING)) * 3;
          const o = seg * 2;
          rPos.setXYZ(o, d.boreRings[a], d.boreRings[a + 1], d.boreRings[a + 2]);
          rPos.setXYZ(o + 1, d.boreRings[b], d.boreRings[b + 1], d.boreRings[b + 2]);
          rCol.setXYZ(o, shade, shade, shade);
          rCol.setXYZ(o + 1, shade, shade, shade);
          seg++;
        }
      }
    }
    ringLines.geometry.setDrawRange(0, seg * 2);
    rPos.needsUpdate = true;
    rCol.needsUpdate = true;

    trails.forEach((entry, i) => {
      const line = entry.line;
      line.visible = d.boreOn && n > 1;
      const pos = line.geometry.getAttribute("position") as THREE.BufferAttribute;
      const col = line.geometry.getAttribute("color") as THREE.BufferAttribute;
      const dark = d.nodeDark[i];
      const [cr, cg, cb] = entry.rgb;
      for (let s = 0; s < n; s++) {
        const src = (i * BORE_MAX + s) * 3;
        pos.setXYZ(s, d.boreNodes[src], d.boreNodes[src + 1], d.boreNodes[src + 2]);
        const fade = Math.max(0.28, 1 - d.boreAge[s] / windowS) * (dark ? 0.35 : 1);
        col.setXYZ(s, cr * fade, cg * fade, cb * fade);
      }
      line.geometry.setDrawRange(0, n);
      pos.needsUpdate = true;
      col.needsUpdate = true;
      const bead = beads[i];
      bead.visible = line.visible;
      const bPos = bead.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let s = 0; s < n; s += 2) {
        const src = (i * BORE_MAX + s) * 3;
        bPos.setXYZ(s / 2, d.boreNodes[src], d.boreNodes[src + 1], d.boreNodes[src + 2]);
      }
      bead.geometry.setDrawRange(0, Math.ceil(n / 2));
      bPos.needsUpdate = true;
    });

    const lead = d.vacuumBore ? d.leadCount : 0;
    const rings = (d.vacuumBore ? n : 0) + (d.vacuumBore ? 1 : 0) + lead;
    tube.visible = d.vacuumBore && rings > 1;
    if (!tube.visible) return;
    const pos = tube.geometry.getAttribute("position") as THREE.BufferAttribute;
    const writeRing = (slot: number, src: Float32Array, srcRing: number) => {
      for (let k = 0; k < BORE_RING; k++) {
        const s = (srcRing * BORE_RING + k) * 3;
        pos.setXYZ(slot * BORE_RING + k, src[s], src[s + 1], src[s + 2]);
      }
    };
    for (let s = 0; s < n; s++) writeRing(s, d.boreRings, s);
    writeRing(n, d.nowRing, 0);
    for (let s = 0; s < lead; s++) writeRing(n + 1 + s, d.leadRings, s);
    const index = tube.geometry.getIndex();
    if (!index) return;
    let cursor = 0;
    for (let s = 0; s < rings - 1; s++) {
      for (let k = 0; k < BORE_RING; k++) {
        const k2 = (k + 1) % BORE_RING;
        const a = s * BORE_RING + k;
        const b = s * BORE_RING + k2;
        const c = (s + 1) * BORE_RING + k;
        const e = (s + 1) * BORE_RING + k2;
        index.setX(cursor++, a);
        index.setX(cursor++, c);
        index.setX(cursor++, e);
        index.setX(cursor++, a);
        index.setX(cursor++, e);
        index.setX(cursor++, b);
      }
    }
    tube.geometry.setDrawRange(0, cursor);
    pos.needsUpdate = true;
    index.needsUpdate = true;
  });
  return (
    <>
      <primitive object={tube} />
      <primitive object={ringLines} />
      {trails.map((entry, i) => (
        <primitive key={`locus-${i}`} object={entry.line} />
      ))}
      {beads.map((pts, i) => (
        <primitive key={`bead-${i}`} object={pts} />
      ))}
    </>
  );
}

function VelocityTick() {
  const arrow = useMemo(
    () => new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 20, new THREE.Color(PAL.obs).getHex(), 4, 2),
    [],
  );
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const d = engine.display;
    const len = Math.hypot(d.vel.x, d.vel.y, d.vel.z);
    arrow.visible = len > 1;
    if (!arrow.visible) return;
    arrow.position.set(0, d.acY, 0);
    dir.set(d.vel.x / len, d.vel.y / len, d.vel.z / len);
    arrow.setDirection(dir);
    arrow.setLength(len, Math.min(6, len * 0.18), 2.2);
  });
  return <primitive object={arrow} />;
}

function PoyntingArrows() {
  const group = useRef<THREE.Group>(null);
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const d = engine.display;
    g.visible = d.showPoynting;
    const arrowOpacity = displayWeights().poynting;
    d.arrows.forEach((a, i) => {
      const arrow = g.children[i] as THREE.ArrowHelper;
      const lineMat = arrow.line.material as THREE.Material;
      const coneMat = arrow.cone.material as THREE.Material;
      lineMat.transparent = true;
      coneMat.transparent = true;
      lineMat.opacity = arrowOpacity;
      coneMat.opacity = arrowOpacity;
      const len = Math.hypot(a.dx, a.dy, a.dz);
      if (len < 0.05) {
        arrow.visible = false;
        return;
      }
      arrow.visible = true;
      arrow.position.set(a.x, a.y, a.z);
      dir.set(a.dx / len, a.dy / len, a.dz / len);
      arrow.setDirection(dir);
      arrow.setLength(Math.min(len, d.fieldSpan * 0.08), Math.min(3, len * 0.35), 1.1);
    });
  });
  const arrows = useMemo(
    () =>
      engine.display.arrows.map(
        () => new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 4, new THREE.Color(PAL.model).getHex()),
      ),
    [],
  );
  return (
    <group ref={group}>
      {arrows.map((a, i) => (
        <primitive key={i} object={a} />
      ))}
    </group>
  );
}

function RaysAndGhosts() {
  const rayGroup = useRef<THREE.Group>(null);
  const importGroup = useRef<THREE.Group>(null);
  const raySig = useRef<Float32Array | null>(null);
  const aim = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    const mat = new THREE.LineDashedMaterial({ color: PAL.hyp, dashSize: 6, gapSize: 3.5, toneMapped: false });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    line.computeLineDistances();
    return line;
  }, []);
  const aimLabel = useRef<THREE.Group>(null);
  const labelEl = useRef<HTMLDivElement>(null);
  useFrame(() => {
    const d = engine.display;
    const rays = d.rays;
    const g = rayGroup.current;
    if (g && rays[0] !== raySig.current) {
      raySig.current = rays[0] ?? null;
      while (g.children.length < rays.length) {
        const geo = new THREE.BufferGeometry();
        const mat = new THREE.LineBasicMaterial({ color: PAL.hyp });
        g.add(new THREE.Line(geo, mat));
      }
      g.children.forEach((child, i) => {
        const line = child as THREE.Line;
        const pts = rays[i];
        if (!pts) {
          line.visible = false;
          return;
        }
        line.visible = true;
        const hypo = engine.params.constitutive !== "vacuum";
        (line.material as THREE.LineBasicMaterial).color.set(hypo ? PAL.hyp : PAL.model);
        line.geometry.setAttribute("position", new THREE.BufferAttribute(pts, 3));
      });
    }
    if (g && rays.length === 0) {
      g.children.forEach((child) => {
        child.visible = false;
      });
      raySig.current = null;
    }
    const on = engine.params.anchor;
    aim.visible = on;
    const len = B777.lengthM * 3;
    const y = d.acY + 1.4;
    const br = d.anchorBearing;
    const x = Math.sin(br) * len;
    const z = Math.cos(br) * len;
    const pos = aim.geometry.getAttribute("position") as THREE.BufferAttribute;
    pos.setXYZ(0, 0, y, 0);
    pos.setXYZ(1, x, y, z);
    pos.needsUpdate = true;
    aim.computeLineDistances();
    if (aimLabel.current) {
      aimLabel.current.visible = on;
      aimLabel.current.position.set(x, y + 6, z);
    }
    if (labelEl.current) labelEl.current.style.display = on ? "block" : "none";
    const ig = importGroup.current;
    if (ig) {
      ig.visible = d.importOn;
      if (d.importAc) {
        ig.children[0].position.set(d.importAc.x, d.importAc.y, d.importAc.z);
        ig.children[0].visible = true;
      }
      for (let i = 0; i < 3; i++) {
        const m = ig.children[i + 1];
        const p = d.importNodes[i];
        if (!m) continue;
        m.visible = !!p;
        if (p) m.position.set(p.x, p.y, p.z);
      }
    }
  });
  return (
    <>
      <group ref={rayGroup} />
      <primitive object={aim} />
      <group ref={aimLabel}>
        <Html center distanceFactor={220} zIndexRange={[12, 0]} style={{ pointerEvents: "none" }}>
          <div ref={labelEl} className="aim-label" style={{ display: "none" }}>
            Hypothesis aim axis
            <br />
            Not a transport path
          </div>
        </Html>
      </group>
      <group ref={importGroup}>
        <mesh>
          <boxGeometry args={[20, 4, 50]} />
          <meshBasicMaterial color={PAL.obs} wireframe />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[1.5, 10, 8]} />
            <meshBasicMaterial color={PAL.obs} wireframe />
          </mesh>
        ))}
      </group>
    </>
  );
}

function RangeFloor() {
  const rings = [40, 80, 160, 320];
  return (
    <group>
      {rings.map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[r - 0.35, r + 0.35, 80]} />
          <meshBasicMaterial color={PAL.obsDim} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 4, 0]} position={[0, 0.02, 0]}>
          <boxGeometry args={[0.4, 0.05, 640]} />
          <meshBasicMaterial color={PAL.line} />
        </mesh>
      ))}
    </group>
  );
}

function Rig() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3 } | null;
  const prev = useRef<string>("");
  const lock = useRef(true);
  useFrame(() => {
    const vp = engine.params.viewpoint;
    const d = engine.display;
    const targetY = d.acY;
    if (vp !== prev.current) {
      prev.current = vp;
      lock.current = true;
      const R = Math.max(56, engine.params.orbitRadius);
      const wake = Math.min(
        1600,
        Math.max(R * 2.6, engine.params.speed * Math.min(engine.params.historyS, 5) * 0.62 + R),
      );
      const spots: Record<string, [number, number, number]> = {
        chase: [wake * 0.7, targetY + wake * 0.28, -wake * 0.52],
        overhead: [0.2, targetY + Math.max(R * 2.6, wake * 0.9), 0.2],
        starboard: [Math.max(R * 1.7, wake * 0.72), targetY + R * 0.28, R * 0.2],
        nose: [R * 0.04, targetY + R * 0.1, Math.max(160, R * 3.35)],
        node: [d.nodes[0].x, d.nodes[0].y + 3, d.nodes[0].z],
        ground: [d.ground.x, d.ground.y, d.ground.z],
      };
      const p = spots[vp] ?? spots.chase;
      camera.position.set(p[0], p[1], p[2]);
      controls?.target.set(0, targetY, 0);
      camera.lookAt(0, targetY, 0);
    } else if (lock.current && (vp === "ground" || vp === "node")) {
      if (vp === "ground") camera.position.set(d.ground.x, d.ground.y, d.ground.z);
      else camera.position.set(d.nodes[0].x, d.nodes[0].y + 3, d.nodes[0].z);
      camera.lookAt(0, targetY, 0);
      controls?.target.set(0, targetY, 0);
    } else if (controls && vp !== "ground") {
      const dy = targetY - controls.target.y;
      if (Math.abs(dy) > 0.05) {
        camera.position.y += dy;
        controls.target.y += dy;
      }
    }
    engine.camera.x = d.acx + camera.position.x;
    engine.camera.y = 10668 + camera.position.y;
    engine.camera.z = d.acz + camera.position.z;
  });
  return (
    <OrbitControls
      makeDefault
      enablePan
      enableDamping={false}
      minDistance={18}
      maxDistance={8000}
      maxPolarAngle={Math.PI * 0.98}
      onStart={() => {
        lock.current = false;
      }}
    />
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={[PAL.bg]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[80, 140, 40]} intensity={1.35} />
      <directionalLight position={[-60, 20, -80]} intensity={0.35} color={PAL.obs} />
      <RangeFloor />
      <BoreHistory />
      <FieldSlice />
      <Aircraft />
      <Markers />
      <VelocityTick />
      <PoyntingArrows />
      <RaysAndGhosts />
      <Rig />
    </>
  );
}

export function Viewport() {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [8, 18, 160], fov: 40, near: 0.4, far: 30000 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <Scene />
    </Canvas>
  );
}
