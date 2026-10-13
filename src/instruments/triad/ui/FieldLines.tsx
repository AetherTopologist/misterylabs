import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useBureau } from "../sim/bureau";
import { engine } from "../sim/engine";
import { R_MIN } from "../sim/fields";
import { PAL } from "../sim/palette";
import type { SliceGrid } from "../sim/topology";

function ramp(t: number): [number, number, number] {
  const u = Math.max(0, Math.min(1, t));
  const stops: [number, number, number][] = [
    [0.08, 0.18, 0.38],
    [0.24, 0.55, 0.86],
    [0.93, 0.95, 0.97],
    [0.91, 0.62, 0.22],
  ];
  const x = u * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const a = stops[i];
  const b = stops[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

function SliceMesh({ grid, perp }: { grid: SliceGrid; perp: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => {
    const t = new THREE.DataTexture(grid.rgba, grid.n, grid.n, THREE.RGBAFormat);
    t.flipY = false;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearFilter;
    t.colorSpace = THREE.NoColorSpace;
    t.needsUpdate = true;
    return t;
  }, [grid]);
  const e1 = useMemo(() => new THREE.Vector3(), []);
  const e2 = useMemo(() => new THREE.Vector3(), []);
  const n = useMemo(() => new THREE.Vector3(), []);
  const basis = useMemo(() => new THREE.Matrix4(), []);
  useFrame(() => {
    const d = engine.display;
    const m = mesh.current;
    if (!m) return;
    const show = useBureau.getState().settings.showSlice;
    m.visible = show;
    e1.set(d.plane.e1x, d.plane.e1y, d.plane.e1z);
    if (perp) {
      e2.set(d.plane.nx, d.plane.ny, d.plane.nz);
      n.set(d.plane.e2x, d.plane.e2y, d.plane.e2z);
    } else {
      e2.set(d.plane.e2x, d.plane.e2y, d.plane.e2z);
      n.set(d.plane.nx, d.plane.ny, d.plane.nz);
    }
    basis.makeBasis(e1, e2, n);
    m.quaternion.setFromRotationMatrix(basis);
    m.position.set(n.x * grid.offsetM, d.acY + n.y * grid.offsetM, n.z * grid.offsetM);
    m.scale.set(grid.span, grid.span, 1);
  });
  return (
    <mesh ref={mesh}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent opacity={0.78} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Lines() {
  const view = useBureau((s) => s.view);
  const show = useBureau((s) => s.settings.showLines);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    if (!view) return g;
    let count = 0;
    for (const line of view.lines) count += Math.max(0, line.pts.length - 1);
    const pos = new Float32Array(Math.max(1, count) * 6);
    const col = new Float32Array(Math.max(1, count) * 6);
    let mags: number[] = [];
    for (const line of view.lines) mags = mags.concat(line.mag.filter((m) => m > 0));
    mags.sort((a, b) => a - b);
    const lo = mags[Math.floor(mags.length * 0.05)] || 1e-12;
    const hi = mags[Math.floor(mags.length * 0.95)] || lo * 10;
    const logLo = Math.log10(lo);
    const logHi = Math.log10(hi);
    let w = 0;
    for (const line of view.lines) {
      for (let i = 0; i < line.pts.length - 1; i++) {
        const a = line.pts[i];
        const b = line.pts[i + 1];
        const ta = (Math.log10(Math.max(line.mag[i], lo)) - logLo) / (logHi - logLo || 1);
        const tb = (Math.log10(Math.max(line.mag[i + 1], lo)) - logLo) / (logHi - logLo || 1);
        const ca = ramp(ta);
        const cb = ramp(tb);
        pos.set([a.x, a.y, a.z, b.x, b.y, b.z], w * 6);
        col.set([ca[0], ca[1], ca[2], cb[0], cb[1], cb[2]], w * 6);
        w++;
      }
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setDrawRange(0, w * 2);
    return g;
  }, [view]);
  if (!show) return null;
  return (
    <lineSegments geometry={geo} frustumCulled={false}>
      <lineBasicMaterial vertexColors transparent opacity={0.92} />
    </lineSegments>
  );
}

function Arrows() {
  const view = useBureau((s) => s.view);
  const show = useBureau((s) => s.settings.showArrows);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arrows = view?.arrows ?? [];
    const pos = new Float32Array(Math.max(1, arrows.length) * 6);
    arrows.forEach((a, i) => {
      pos.set([a.p.x, a.p.y, a.p.z, a.p.x + a.d.x, a.p.y + a.d.y, a.p.z + a.d.z], i * 6);
    });
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setDrawRange(0, arrows.length * 2);
    return g;
  }, [view]);
  if (!show) return null;
  return (
    <lineSegments geometry={geo} frustumCulled={false}>
      <lineBasicMaterial color={PAL.model} transparent opacity={0.55} />
    </lineSegments>
  );
}

function ExclusionAndSymmetry() {
  const group = useRef<THREE.Group>(null);
  const ticks = useRef<THREE.Group>(null);
  const tickLines = useMemo(() => {
    return [0, 1, 2].map(() => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#8ea0b5", transparent: true, opacity: 0.8 }));
      line.frustumCulled = false;
      return line;
    });
  }, []);
  const e1v = useMemo(() => new THREE.Vector3(), []);
  const e2v = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const showSym = useBureau((s) => s.settings.showSymmetry);
  useFrame(() => {
    const d = engine.display;
    const s = useBureau.getState().settings;
    if (group.current) {
      group.current.visible = s.showExclusion;
      d.nodes.forEach((p, i) => {
        const m = group.current?.children[i] as THREE.Object3D | undefined;
        if (m) m.position.set(p.x, p.y, p.z);
      });
    }
    if (ticks.current) {
      ticks.current.visible = s.showSymmetry;
      ticks.current.position.set(0, d.acY, 0);
      e1v.set(d.plane.e1x, d.plane.e1y, d.plane.e1z);
      e2v.set(d.plane.e2x, d.plane.e2y, d.plane.e2z);
      const R = Math.max(20, engine.params.orbitRadius * 1.12);
      tickLines.forEach((line, i) => {
        const ang = (i * 2 * Math.PI) / 3;
        dir.copy(e1v).multiplyScalar(Math.cos(ang)).addScaledVector(e2v, Math.sin(ang));
        const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
        attr.setXYZ(0, dir.x * R * 0.12, dir.y * R * 0.12, dir.z * R * 0.12);
        attr.setXYZ(1, dir.x * R, dir.y * R, dir.z * R);
        attr.needsUpdate = true;
      });
    }
  });
  return (
    <>
      <group ref={group}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[R_MIN, 18, 12]} />
            <meshBasicMaterial color={PAL.hyp} wireframe transparent opacity={0.85} />
          </mesh>
        ))}
      </group>
      <group ref={ticks}>
        {tickLines.map((line, i) => (
          <primitive key={i} object={line} />
        ))}
        {showSym ? (
          <Html position={[0, 8, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
            <div className="aim-label" style={{ color: "#8ea0b5", borderColor: "#8ea0b5" }}>
              C3 reference
              <br />
              not a field line
            </div>
          </Html>
        ) : null}
      </group>
    </>
  );
}

function NullMarks() {
  const nulls = useBureau((s) => s.view?.nulls ?? []);
  return (
    <>
      {nulls.map((n, i) => (
        <group key={`${n.klass}-${i}`} position={[n.view.x, n.view.y, n.view.z]}>
          <mesh>
            <octahedronGeometry args={[n.klass === "verified" ? 1.7 : 1.15, 0]} />
            <meshBasicMaterial color={n.klass === "verified" ? PAL.model : "#e0a100"} wireframe={n.klass !== "verified"} />
          </mesh>
          <Html center zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
            <div className="aim-label" style={{ color: n.klass === "verified" ? "#f4f7fb" : "#e0a100", borderColor: "currentColor" }}>
              {n.klass === "verified" ? "Verified null candidate" : "Under-resolved"}
              <br />
              not reconnection
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}

export function FieldLines() {
  const view = useBureau((s) => s.view);
  return (
    <>
      {view?.slice ? <SliceMesh grid={view.slice} perp={false} /> : null}
      {view?.perp ? <SliceMesh grid={view.perp} perp /> : null}
      <Lines />
      <Arrows />
      <ExclusionAndSymmetry />
      <NullMarks />
    </>
  );
}
