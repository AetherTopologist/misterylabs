import * as THREE from "three";
import { stairHeight } from "./ascent";
import { CAP_WALK_R } from "./monument-cap";

/**
 * Seats either Cenotaph GLB into the same monument frame.
 *
 * The production file names its shell `Unir`. The full-resolution export
 * does not: the shell is one primitive under `Unir.510`. Fitting that shell
 * and the SketchUp ground datum keeps both files where the stair survey
 * already lives. A missing name must not fall through to the old cenY of
 * 15.04 m, which would lift the whole building.
 *
 * The full-resolution file also adds a flat cap at 13.103 m across the
 * open dome. The historic tread and the procedural observation floor stay
 * at 12.937 m. That 166 mm step is measured and left visible. The cap is
 * walkable out to CAP_WALK_R. The northern passage, measured separately,
 * opens from that cap only while this grid is installed.
 */
export const TREAD_Y = 12.937;
export const CAP_Y = 13.103;

export type SphereFit = { cx: number; cy: number; cz: number; r: number };

export type MonumentSeat = {
  rootPosition: THREE.Vector3;
  holderY: number;
  fit: SphereFit | null;
  shellMeshes: THREE.Mesh[];
  /** True when the shell was the node named Unir, as in the production file. */
  namedShell: boolean;
};

export type CapGrid = {
  x0: number;
  z0: number;
  step: number;
  cols: number;
  rows: number;
  heights: Float32Array;
  cells: number;
  yMin: number;
  yMax: number;
};

const SHELL_R_MIN = 45;
const SHELL_R_MAX = 60;
const SHELL_RESIDUAL = 0.4;

export function solveSphere(pts: Array<[number, number, number]>): SphereFit {
  const ata = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const atb = [0, 0, 0, 0];
  for (const [x, y, z] of pts) {
    const row = [x, y, z, 1];
    const b = -(x * x + y * y + z * z);
    for (let i = 0; i < 4; i++) {
      atb[i] += row[i] * b;
      for (let j = 0; j < 4; j++) ata[i][j] += row[i] * row[j];
    }
  }
  for (let col = 0; col < 4; col++) {
    let pivot = col;
    for (let r = col + 1; r < 4; r++) if (Math.abs(ata[r][col]) > Math.abs(ata[pivot][col])) pivot = r;
    [ata[col], ata[pivot]] = [ata[pivot], ata[col]];
    [atb[col], atb[pivot]] = [atb[pivot], atb[col]];
    const div = ata[col][col] || 1e-12;
    for (let j = col; j < 4; j++) ata[col][j] /= div;
    atb[col] /= div;
    for (let r = 0; r < 4; r++) {
      if (r === col) continue;
      const f = ata[r][col];
      for (let j = col; j < 4; j++) ata[r][j] -= f * ata[col][j];
      atb[r] -= f * atb[col];
    }
  }
  const cx = -atb[0] / 2;
  const cy = -atb[1] / 2;
  const cz = -atb[2] / 2;
  const r = Math.sqrt(Math.max(0, cx * cx + cy * cy + cz * cz - atb[3]));
  return { cx, cy, cz, r };
}

function sampleObject(root: THREE.Object3D) {
  const pts: Array<[number, number, number]> = [];
  const v = new THREE.Vector3();
  const meshes: THREE.Mesh[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    meshes.push(mesh);
    const pos = mesh.geometry.getAttribute("position");
    if (!pos) return;
    const step = Math.max(1, Math.floor(pos.count / 900));
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos as THREE.BufferAttribute, i).applyMatrix4(mesh.matrixWorld);
      pts.push([v.x, v.y, v.z]);
    }
  });
  return { pts, meshes };
}

function residual(pts: Array<[number, number, number]>, fit: SphereFit) {
  if (!pts.length || !(fit.r > 0)) return Infinity;
  let sum = 0;
  for (const [x, y, z] of pts) {
    const dx = x - fit.cx;
    const dy = y - fit.cy;
    const dz = z - fit.cz;
    sum += Math.abs(Math.hypot(dx, dy, dz) - fit.r);
  }
  return sum / pts.length;
}

function discoverShell(root: THREE.Object3D) {
  let best: { mesh: THREE.Mesh; fit: SphereFit; error: number } | null = null;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const { pts } = sampleObject(mesh);
    if (pts.length < 80) return;
    const fit = solveSphere(pts);
    if (fit.r < SHELL_R_MIN || fit.r > SHELL_R_MAX) return;
    const error = residual(pts, fit);
    if (error > SHELL_RESIDUAL) return;
    if (!best || error < best.error) best = { mesh, fit, error };
  });
  return best;
}

/**
 * Park `root` so its shell center is on the monument axis and the SketchUp
 * ground datum stays on y = 0. Call this before parenting `root` under a
 * holder that is already raised.
 */
export function seatMonument(root: THREE.Object3D): MonumentSeat {
  root.updateMatrixWorld(true);
  const named = root.getObjectByName("Unir");
  const namedSample = named ? sampleObject(named) : null;
  const discovered = namedSample && namedSample.pts.length > 20 ? null : discoverShell(root);
  const shell = namedSample && namedSample.pts.length > 20 ? named : discovered?.mesh ?? null;
  const sampled = shell ? (namedSample && shell === named ? namedSample : sampleObject(shell)) : null;
  const fit = sampled && sampled.pts.length > 20 ? solveSphere(sampled.pts) : null;
  const sketch = root.getObjectByName("SketchUp") ?? root;
  const bounds = new THREE.Box3().setFromObject(sketch);
  const shellMeshes = sampled?.meshes ?? [];
  if (fit && fit.r > 1) {
    const minLocal = bounds.min.y - fit.cy;
    return {
      rootPosition: new THREE.Vector3(-fit.cx, -fit.cy, -fit.cz),
      holderY: -minLocal,
      fit,
      shellMeshes,
      namedShell: Boolean(namedSample && shell === named),
    };
  }
  return {
    rootPosition: new THREE.Vector3(0, -bounds.min.y, 0),
    holderY: 0,
    fit: null,
    shellMeshes,
    namedShell: false,
  };
}

/** Up-facing mesh of the flat cap. Not a ceiling, and not the historic ramp.
 * Clean v01 kept only the downward skin of that cap, so that file may pass
 * `allowDownwardCap`. Production and Full Resolution do not. */
export function surveyCap(root: THREE.Object3D, step = 0.5, allowDownwardCap = false): CapGrid {
  root.updateMatrixWorld(true);
  const x0 = -22;
  const z0 = -22;
  const x1 = 22;
  const z1 = 24;
  const cols = Math.round((x1 - x0) / step) + 1;
  const rows = Math.round((z1 - z0) / step) + 1;
  const heights = new Float32Array(cols * rows);
  heights.fill(Number.NaN);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  let cells = 0;
  let yMin = Infinity;
  let yMax = -Infinity;
  const mark = (x: number, z: number, y: number) => {
    const ix = Math.round((x - x0) / step);
    const iz = Math.round((z - z0) / step);
    if (ix < 0 || iz < 0 || ix >= cols || iz >= rows) return;
    const at = iz * cols + ix;
    if (!Number.isFinite(heights[at])) cells++;
    if (!Number.isFinite(heights[at]) || y > heights[at]) heights[at] = y;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  };
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const pos = mesh.geometry.getAttribute("position");
    const index = mesh.geometry.index;
    if (!pos) return;
    const tri = index ? index.count / 3 : pos.count / 3;
    const get = (i: number) => (index ? index.getX(i) : i);
    for (let t = 0; t < tri; t++) {
      a.fromBufferAttribute(pos as THREE.BufferAttribute, get(t * 3)).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(pos as THREE.BufferAttribute, get(t * 3 + 1)).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(pos as THREE.BufferAttribute, get(t * 3 + 2)).applyMatrix4(mesh.matrixWorld);
      ab.subVectors(b, a);
      ac.subVectors(c, a);
      const nx = ab.y * ac.z - ab.z * ac.y;
      const ny = ab.z * ac.x - ab.x * ac.z;
      const nz = ab.x * ac.y - ab.y * ac.x;
      const len = Math.hypot(nx, ny, nz);
      const nyN = len < 1e-8 ? 0 : ny / len;
      const upward = nyN >= 0.65;
      const downwardCap = allowDownwardCap && nyN <= -0.65;
      if (!upward && !downwardCap) continue;
      const cx = (a.x + b.x + c.x) / 3;
      const cy = (a.y + b.y + c.y) / 3;
      const cz = (a.z + b.z + c.z) / 3;
      const base = stairHeight(cx, cz);
      const flatCap = Math.abs(cy - CAP_Y) < 0.012 && Math.hypot(cx, cz) <= 21.5;
      // A downward face is only the cleaned cap, never a stair soffit.
      if (downwardCap && !flatCap) continue;
      // Stair lips a few centimeters off the piecewise profile are not the cap.
      const overTread =
        Math.abs(base - TREAD_Y) <= 0.03 && cy > base + 0.02 && cy < base + 0.45;
      if (!flatCap && !overTread) continue;
      const minX = Math.min(a.x, b.x, c.x);
      const maxX = Math.max(a.x, b.x, c.x);
      const minZ = Math.min(a.z, b.z, c.z);
      const maxZ = Math.max(a.z, b.z, c.z);
      const i0 = Math.max(0, Math.ceil((minX - x0) / step));
      const i1 = Math.min(cols - 1, Math.floor((maxX - x0) / step));
      const j0 = Math.max(0, Math.ceil((minZ - z0) / step));
      const j1 = Math.min(rows - 1, Math.floor((maxZ - z0) / step));
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const x = x0 + i * step;
          const z = z0 + j * step;
          const v0x = c.x - a.x;
          const v0z = c.z - a.z;
          const v1x = b.x - a.x;
          const v1z = b.z - a.z;
          const v2x = x - a.x;
          const v2z = z - a.z;
          const dot00 = v0x * v0x + v0z * v0z;
          const dot01 = v0x * v1x + v0z * v1z;
          const dot02 = v0x * v2x + v0z * v2z;
          const dot11 = v1x * v1x + v1z * v1z;
          const dot12 = v1x * v2x + v1z * v2z;
          const den = dot00 * dot11 - dot01 * dot01;
          if (Math.abs(den) < 1e-8) continue;
          const inv = 1 / den;
          const u = (dot11 * dot02 - dot01 * dot12) * inv;
          const v = (dot00 * dot12 - dot01 * dot02) * inv;
          if (u < -1e-3 || v < -1e-3 || u + v > 1 + 1e-3) continue;
          const y = a.y + (b.y - a.y) * v + (c.y - a.y) * u;
          const ground = stairHeight(x, z);
          const aboveTread = Math.abs(ground - TREAD_Y) <= 0.03;
          // Do not retread the historic ramp below the arrival.
          if (ground > 0.05 && ground < TREAD_Y - 0.05) continue;
          if (!aboveTread && Math.hypot(x, z) > CAP_WALK_R + 1e-3) continue;
          if (!aboveTread && Math.abs(y - CAP_Y) > 0.02) continue;
          mark(x, z, y);
        }
      }
    }
  });
  return { x0, z0, step, cols, rows, heights, cells, yMin: cells ? yMin : 0, yMax: cells ? yMax : 0 };
}

/** Triangles whose centroid is the flat interior cap, if this file has one. */
export function capTriangles(root: THREE.Object3D) {
  let triangles = 0;
  let centralCentroids = 0;
  let interiorVertices = 0;
  const seen = new Set<string>();
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const pos = mesh.geometry.getAttribute("position");
    const index = mesh.geometry.index;
    if (!pos) return;
    const tri = index ? index.count / 3 : pos.count / 3;
    const get = (i: number) => (index ? index.getX(i) : i);
    const v = new THREE.Vector3();
    for (let t = 0; t < tri; t++) {
      v.set(0, 0, 0);
      const ids = [get(t * 3), get(t * 3 + 1), get(t * 3 + 2)];
      for (const id of ids) {
        v.x += pos.getX(id);
        v.y += pos.getY(id);
        v.z += pos.getZ(id);
      }
      v.multiplyScalar(1 / 3).applyMatrix4(mesh.matrixWorld);
      if (Math.hypot(v.x, v.z) > 16 || Math.abs(v.y - CAP_Y) > 0.02) continue;
      triangles++;
      if (Math.hypot(v.x, v.z) < 8) centralCentroids++;
      for (const id of ids) {
        const key = `${mesh.uuid}:${id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const x = pos.getX(id);
        const y = pos.getY(id);
        const z = pos.getZ(id);
        v.set(x, y, z).applyMatrix4(mesh.matrixWorld);
        if (Math.hypot(v.x, v.z) < 8) interiorVertices++;
      }
    }
  });
  return { triangles, centralCentroids, interiorVertices };
}
