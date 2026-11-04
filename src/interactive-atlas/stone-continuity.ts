import * as THREE from "three";

/**
 * Full-resolution continuity pass.
 *
 * The export already stores smooth normals inside each primitive, and it
 * splits right-angle corners onto their own vertices. What it does not do
 * is agree across the six material primitives: a coplanar seam is two
 * normals that never meet. This averages only those neighbors, in seated
 * meters, and refuses a crease. Positions are not moved. A vertex index
 * that would have to hold two normals is left alone, so a shared arris
 * cannot be sanded into a bevel.
 */
export type ContinuitySource = {
  geometry: THREE.BufferGeometry;
  matrixWorld: THREE.Matrix4;
};

const _pa = new THREE.Vector3();
const _pb = new THREE.Vector3();
const _pc = new THREE.Vector3();
const _ab = new THREE.Vector3();
const _ac = new THREE.Vector3();
const _n = new THREE.Vector3();
const _want = new THREE.Vector3();

export function smoothShallowNormalsAcross(sources: ContinuitySource[], creaseDeg = 38, weld = 0.005) {
  const crease = Math.cos((creaseDeg * Math.PI) / 180);
  const quant = 1 / weld;
  type Face = { nx: number; ny: number; nz: number; area: number; src: number; degenerate: boolean };
  const faces: Face[] = [];
  const groups = new Map<string, { fi: number; x: number; y: number; z: number }[]>();
  const prepared = sources.map((source) => {
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(source.matrixWorld);
    return {
      geometry: source.geometry,
      matrixWorld: source.matrixWorld,
      inverseNormal: normalMatrix.clone().invert(),
      position: source.geometry.getAttribute("position") as THREE.BufferAttribute | undefined,
      index: source.geometry.index,
    };
  });

  const worldAt = (src: number, vi: number, out: THREE.Vector3) => {
    const p = prepared[src];
    out.fromBufferAttribute(p.position!, vi).applyMatrix4(p.matrixWorld);
    return out;
  };
  const cellOf = (x: number, y: number, z: number) =>
    `${Math.round(x * quant)},${Math.round(y * quant)},${Math.round(z * quant)}`;
  const nearFaces = (x: number, y: number, z: number, into: Set<number>) => {
    const ix = Math.round(x * quant);
    const iy = Math.round(y * quant);
    const iz = Math.round(z * quant);
    const reach = weld * weld;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const list = groups.get(`${ix + dx},${iy + dy},${iz + dz}`);
          if (!list) continue;
          for (let i = 0; i < list.length; i++) {
            const hit = list[i];
            const ddx = hit.x - x;
            const ddy = hit.y - y;
            const ddz = hit.z - z;
            if (ddx * ddx + ddy * ddy + ddz * ddz <= reach) into.add(hit.fi);
          }
        }
      }
    }
  };

  for (let s = 0; s < prepared.length; s++) {
    const p = prepared[s];
    if (!p.position) continue;
    const triCount = p.index ? p.index.count / 3 : p.position.count / 3;
    const corner = (tri: number, i: number) => (p.index ? p.index.getX(tri * 3 + i) : tri * 3 + i);
    for (let t = 0; t < triCount; t++) {
      const ia = corner(t, 0);
      const ib = corner(t, 1);
      const ic = corner(t, 2);
      worldAt(s, ia, _pa);
      worldAt(s, ib, _pb);
      worldAt(s, ic, _pc);
      _ab.subVectors(_pb, _pa);
      _ac.subVectors(_pc, _pa);
      _n.crossVectors(_ab, _ac);
      const area = _n.length() * 0.5;
      const fi = faces.length;
      if (area < 1e-8) {
        faces.push({ nx: 0, ny: 0, nz: 0, area: 0, src: s, degenerate: true });
        continue;
      }
      _n.multiplyScalar(1 / (area * 2));
      faces.push({ nx: _n.x, ny: _n.y, nz: _n.z, area, src: s, degenerate: false });
      const corners = [_pa, _pb, _pc];
      for (let c = 0; c < 3; c++) {
        const at = corners[c];
        const key = cellOf(at.x, at.y, at.z);
        const list = groups.get(key);
        const hit = { fi, x: at.x, y: at.y, z: at.z };
        if (!list) groups.set(key, [hit]);
        else list.push(hit);
      }
    }
  }

  for (let s = 0; s < prepared.length; s++) {
    const p = prepared[s];
    if (!p.position) continue;
    const triCount = p.index ? p.index.count / 3 : p.position.count / 3;
    const corner = (tri: number, i: number) => (p.index ? p.index.getX(tri * 3 + i) : tri * 3 + i);
    const out = new Float32Array(p.position.count * 3);
    const current = p.geometry.getAttribute("normal") as THREE.BufferAttribute | undefined;
    if (current) {
      for (let i = 0; i < p.position.count; i++) {
        out[i * 3] = current.getX(i);
        out[i * 3 + 1] = current.getY(i);
        out[i * 3 + 2] = current.getZ(i);
      }
    }
    const written = new Map<number, THREE.Vector3>();
    const locked = new Set<number>();
    let faceCursor = 0;
    for (let i = 0; i < s; i++) {
      const other = prepared[i];
      if (!other.position) continue;
      faceCursor += other.index ? other.index.count / 3 : other.position.count / 3;
    }
    for (let t = 0; t < triCount; t++) {
      const face = faces[faceCursor + t];
      if (!face || face.degenerate) continue;
      for (let c = 0; c < 3; c++) {
        const vi = corner(t, c);
        if (locked.has(vi)) continue;
        worldAt(s, vi, _pa);
        const bag = new Set<number>();
        nearFaces(_pa.x, _pa.y, _pa.z, bag);
        let ax = 0;
        let ay = 0;
        let az = 0;
        let weight = 0;
        for (const fi of bag) {
          const other = faces[fi];
          if (other.degenerate) continue;
          if (other.nx * face.nx + other.ny * face.ny + other.nz * face.nz < crease) continue;
          ax += other.nx * other.area;
          ay += other.ny * other.area;
          az += other.nz * other.area;
          weight += other.area;
        }
        if (weight < 1e-8) continue;
        _want.set(ax, ay, az).normalize().applyMatrix3(p.inverseNormal).normalize();
        if (!Number.isFinite(_want.x)) continue;
        const prior = written.get(vi);
        if (prior && prior.dot(_want) < 0.999) {
          locked.add(vi);
          written.delete(vi);
          continue;
        }
        if (!prior) written.set(vi, _want.clone());
      }
    }
    for (const [vi, normal] of written) {
      out[vi * 3] = normal.x;
      out[vi * 3 + 1] = normal.y;
      out[vi * 3 + 2] = normal.z;
    }
    p.geometry.setAttribute("normal", new THREE.BufferAttribute(out, 3));
  }
}

/** Full resolution only. Production geometry is returned untouched. */
export function smoothFullResolutionNormals(sources: ContinuitySource[], which: "production" | "full") {
  if (which !== "full") return false;
  smoothShallowNormalsAcross(sources, 38, 0.005);
  return true;
}
