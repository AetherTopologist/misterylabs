import * as THREE from "three";

/**
 * The full-resolution export stores a face normal on every vertex, so the
 * stone lights as flat facets. Average only neighbors that already agree
 * within the crease. A 90° arris keeps its corner. Positions are not moved,
 * and vertices are not welded: each corner keeps its own index.
 */
export function smoothShallowNormals(geo: THREE.BufferGeometry, creaseDeg = 38) {
  const pos = geo.getAttribute("position");
  if (!pos) return;
  const index = geo.index;
  const corner = (tri: number, i: number) => (index ? index.getX(tri * 3 + i) : tri * 3 + i);
  const triCount = index ? index.count / 3 : pos.count / 3;
  if (triCount < 1) return;
  const crease = Math.cos((creaseDeg * Math.PI) / 180);
  const keyOf = (i: number) =>
    `${Math.round(pos.getX(i) * 500)},${Math.round(pos.getY(i) * 500)},${Math.round(pos.getZ(i) * 500)}`;
  const faces = new Map<string, number[]>();
  const faceN = new Float32Array(triCount * 3);
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let t = 0; t < triCount; t++) {
    const ia = corner(t, 0);
    const ib = corner(t, 1);
    const ic = corner(t, 2);
    ab.set(pos.getX(ib) - pos.getX(ia), pos.getY(ib) - pos.getY(ia), pos.getZ(ib) - pos.getZ(ia));
    ac.set(pos.getX(ic) - pos.getX(ia), pos.getY(ic) - pos.getY(ia), pos.getZ(ic) - pos.getZ(ia));
    n.crossVectors(ab, ac);
    const len = n.length();
    if (len > 1e-8) n.multiplyScalar(1 / len);
    else n.set(0, 1, 0);
    faceN[t * 3] = n.x;
    faceN[t * 3 + 1] = n.y;
    faceN[t * 3 + 2] = n.z;
    for (let c = 0; c < 3; c++) {
      const key = keyOf(corner(t, c));
      const list = faces.get(key);
      if (!list) faces.set(key, [t]);
      else if (list[list.length - 1] !== t) list.push(t);
    }
  }
  const out = new Float32Array(pos.count * 3);
  for (let t = 0; t < triCount; t++) {
    const fx = faceN[t * 3];
    const fy = faceN[t * 3 + 1];
    const fz = faceN[t * 3 + 2];
    for (let c = 0; c < 3; c++) {
      const vi = corner(t, c);
      const list = faces.get(keyOf(vi));
      let ax = 0;
      let ay = 0;
      let az = 0;
      if (list) {
        for (let k = 0; k < list.length; k++) {
          const other = list[k];
          const ox = faceN[other * 3];
          const oy = faceN[other * 3 + 1];
          const oz = faceN[other * 3 + 2];
          if (ox * fx + oy * fy + oz * fz >= crease) {
            ax += ox;
            ay += oy;
            az += oz;
          }
        }
      }
      let len = ax * ax + ay * ay + az * az;
      if (len < 1e-8) {
        ax = fx;
        ay = fy;
        az = fz;
      } else {
        len = Math.sqrt(len);
        ax /= len;
        ay /= len;
        az /= len;
      }
      out[vi * 3] = ax;
      out[vi * 3 + 1] = ay;
      out[vi * 3 + 2] = az;
    }
  }
  geo.setAttribute("normal", new THREE.BufferAttribute(out, 3));
}
