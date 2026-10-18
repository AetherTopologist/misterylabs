import * as THREE from "three";

// Hollow-mask geometry.
// A convex relief is turned into a concave shell by reflecting vertex
// positions through the depth plane. Normals become normalize(-nx, -ny, nz)
// so the interior still faces +Z. Winding stays with those normals; reversing
// it culls the shell. Reversing normals on the unmoved mesh is not this operation.

export type MaskBuffers = {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
};

export function centerScale(positions: Float32Array, targetHeight = 1.65): Float32Array {
  const n = positions.length / 3;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const height = Math.max(1e-6, maxY - minY);
  const s = targetHeight / height;
  const out = new Float32Array(positions.length);
  for (let i = 0; i < n; i++) {
    out[i * 3] = (positions[i * 3] - cx) * s;
    out[i * 3 + 1] = (positions[i * 3 + 1] - cy) * s;
    out[i * 3 + 2] = (positions[i * 3 + 2] - cz) * s;
  }
  return out;
}

/**
 * Bake a mesh world matrix into a copy of the buffers, then center the
 * positions. Normals use the inverse-transpose of that matrix. A mirrored
 * matrix also swaps winding so front-face culling still matches the normals.
 * centerScale is a uniform scale plus a translation, so it does not rotate
 * those normals.
 */
export function bakeWorldBuffers(
  positions: Float32Array,
  normals: Float32Array,
  indices: Uint32Array,
  matrixWorld: THREE.Matrix4,
): MaskBuffers {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
  const hadNormals = normals.length === positions.length && normals.some((n) => n !== 0);
  if (hadNormals) {
    geo.setAttribute("normal", new THREE.BufferAttribute(normals.slice(), 3));
  }
  geo.setIndex(new THREE.BufferAttribute(indices.slice(), 1));
  geo.applyMatrix4(matrixWorld);
  if (matrixWorld.determinant() < 0 && geo.index) {
    const idx = geo.index;
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i + 1);
      idx.setX(i + 1, idx.getX(i + 2));
      idx.setX(i + 2, a);
    }
  }
  if (!hadNormals) geo.computeVertexNormals();
  const centered = centerScale(geo.getAttribute("position").array as Float32Array);
  const bakedNormals = new Float32Array(geo.getAttribute("normal").array as ArrayLike<number>);
  const bakedIndices = new Uint32Array(geo.index ? geo.index.array : indices);
  geo.dispose();
  return { positions: centered, normals: bakedNormals, indices: bakedIndices };
}

/**
 * Positive when the central region sits at higher Z than the periphery
 * (a relief bulging toward a camera on +Z). Negative when the center recedes.
 */
export function reliefDepthSign(positions: Float32Array): number {
  const n = positions.length / 3;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const hx = Math.max(1e-6, (maxX - minX) / 2);
  const hy = Math.max(1e-6, (maxY - minY) / 2);
  let cSum = 0, cN = 0, rSum = 0, rN = 0;
  for (let i = 0; i < n; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    const radial = Math.hypot((x - cx) / hx, (y - cy) / hy);
    if (radial < 0.28) { cSum += z; cN++; }
    else if (radial > 0.72) { rSum += z; rN++; }
  }
  if (!cN || !rN) return 0;
  return cSum / cN - rSum / rN;
}

export type ReliefClass = "convex relief" | "concave shell" | "flat";

export function classifyRelief(sign: number): ReliefClass {
  if (sign > 1e-4) return "convex relief";
  if (sign < -1e-4) return "concave shell";
  return "flat";
}

export function concaveFromConvex(source: MaskBuffers): MaskBuffers {
  const positions = new Float32Array(source.positions);
  const normals = new Float32Array(source.normals);
  const indices = new Uint32Array(source.indices);
  let zmin = Infinity, zmax = -Infinity;
  for (let i = 2; i < positions.length; i += 3) {
    const z = positions[i];
    if (z < zmin) zmin = z;
    if (z > zmax) zmax = z;
  }
  const flip = zmin + zmax;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 2] = flip - positions[i + 2];
    const nx = -normals[i];
    const ny = -normals[i + 1];
    const nz = normals[i + 2];
    const l = Math.hypot(nx, ny, nz) || 1;
    normals[i] = nx / l;
    normals[i + 1] = ny / l;
    normals[i + 2] = nz / l;
  }
  return { positions, normals, indices };
}

export function positionsEqual(a: Float32Array, b: Float32Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function maskAssetUrl(subject: "einstein" | "tesla"): string {
  const base = import.meta.env.BASE_URL || "/";
  const file = subject === "einstein" ? "einstein-mask.glb" : "tesla-mask.glb";
  return `${base}models/${file}`;
}
