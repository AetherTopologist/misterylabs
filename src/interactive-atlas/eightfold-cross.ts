import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  foldHypercross,
  type V4,
} from "@/instruments/higher-dimensional/hypercross-math";

/**
 * The Eightfold Cross. A fairground invitation, not the instrument.
 *
 * The cells are foldHypercross(0): the unfolded net, eight rigid cubes
 * and seven tree hinges. Every vertex of that net sits in the hyperplane
 * w = −1. The cubes are volumes, not flat tiles.
 *
 * The whole assembly is mapped by one proper rotation, one translation,
 * and one uniform scale:
 *   (x, y, z) → (x, z + 7, −y), then × CROSS_SCALE, then lift in y.
 * No cell is moved on its own.
 *
 * Porcelain shells are inset by CROSS_INSET. That gap is scenery, so the
 * junction cube stays visible between its six neighbors. Centers and the
 * seven hinge squares stay on the mathematical net. Nothing here folds.
 */

export const CROSS_SCALE = 0.92;
export const CROSS_LIFT = 1.15;
/** Linear inset of the porcelain shells. Scenery, not a new layout. */
export const CROSS_INSET = 0.9;

export type EightfoldCross = {
  group: THREE.Group;
  triangles: number;
  meshes: number;
  lights: number;
  cells: number;
  hinges: number;
  edges: number;
  tick: (time: number, cameraPosition: THREE.Vector3, reduced: boolean) => void;
  dispose: () => void;
};

export function placeCrossPoint(p: V4): [number, number, number] {
  return [p[0] * CROSS_SCALE, (p[2] + 7) * CROSS_SCALE + CROSS_LIFT, -p[1] * CROSS_SCALE];
}

function v3(p: [number, number, number]) {
  return new THREE.Vector3(p[0], p[1], p[2]);
}

function centroid(points: V4[]): V4 {
  const c: V4 = [0, 0, 0, 0];
  for (const p of points) for (let k = 0; k < 4; k++) c[k] += p[k];
  return c.map((value) => value / points.length) as V4;
}

function plaqueTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const g = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (!g) return tex;
  g.fillStyle = "#141210";
  g.fillRect(0, 0, 512, 256);
  g.strokeStyle = "#c4a574";
  g.lineWidth = 8;
  g.strokeRect(18, 18, 476, 220);
  g.fillStyle = "#c4a574";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "600 42px Palatino, 'Times New Roman', serif";
  g.fillText("HYPERCROSS", 256, 96);
  g.fillStyle = "#f3eee4";
  g.font = "400 32px Palatino, 'Times New Roman', serif";
  g.fillText("The Eightfold Cross", 256, 162);
  tex.needsUpdate = true;
  return tex;
}

function orderQuad(points: THREE.Vector3[]) {
  const center = new THREE.Vector3();
  for (const p of points) center.add(p);
  center.multiplyScalar(1 / points.length);
  const normal = new THREE.Vector3()
    .crossVectors(points[1].clone().sub(points[0]), points[2].clone().sub(points[0]));
  if (normal.lengthSq() < 1e-8) {
    normal.crossVectors(points[1].clone().sub(points[0]), points[3].clone().sub(points[0]));
  }
  normal.normalize();
  const tangent = points[0].clone().sub(center);
  if (tangent.lengthSq() < 1e-8) tangent.set(1, 0, 0);
  tangent.normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent);
  return points.slice().sort((a, b) => {
    const da = a.clone().sub(center);
    const db = b.clone().sub(center);
    return Math.atan2(da.dot(bitangent), da.dot(tangent)) - Math.atan2(db.dot(bitangent), db.dot(tangent));
  });
}

function quadGeometry(quad: THREE.Vector3[], shrink: number) {
  const center = new THREE.Vector3();
  for (const p of quad) center.add(p);
  center.multiplyScalar(0.25);
  const shrunk = quad.map((p) => center.clone().lerp(p, shrink));
  const positions = [
    ...shrunk[0].toArray(), ...shrunk[1].toArray(), ...shrunk[2].toArray(),
    ...shrunk[0].toArray(), ...shrunk[2].toArray(), ...shrunk[3].toArray(),
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function edgeKey(a: THREE.Vector3, b: THREE.Vector3) {
  const q = (value: number) => Math.round(value * 1000);
  const left = `${q(a.x)},${q(a.y)},${q(a.z)}`;
  const right = `${q(b.x)},${q(b.y)},${q(b.z)}`;
  return left < right ? `${left}|${right}` : `${right}|${left}`;
}

function census(root: THREE.Object3D) {
  let triangles = 0;
  let meshes = 0;
  let lights = 0;
  root.traverse((obj) => {
    if ((obj as THREE.Light).isLight) lights += 1;
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    meshes += 1;
    const index = mesh.geometry.getIndex();
    if (index) triangles += index.count / 3;
    else triangles += (mesh.geometry.getAttribute("position")?.count ?? 0) / 3;
  });
  return { triangles, meshes, lights };
}

export function buildEightfoldCross(): EightfoldCross {
  const group = new THREE.Group();
  group.name = "hypercross-eightfold";
  const state = foldHypercross(0);

  const porcelain = new THREE.MeshStandardMaterial({
    color: 0xf4efe6,
    roughness: 0.46,
    metalness: 0.04,
    emissive: 0x8d7b68,
    emissiveIntensity: 0.55,
  });
  const bronze = new THREE.MeshStandardMaterial({
    color: 0x8d6840,
    metalness: 0.72,
    roughness: 0.36,
    emissive: 0x4a3218,
    emissiveIntensity: 0.32,
  });
  const stone = new THREE.MeshStandardMaterial({ color: 0x2c2925, metalness: 0.08, roughness: 0.84 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x171a20, metalness: 0.7, roughness: 0.42 });
  const hingeMats: THREE.MeshStandardMaterial[] = [];

  const side = 2 * CROSS_SCALE * CROSS_INSET;
  const cubeGeo = new THREE.BoxGeometry(side, side, side);
  for (const cell of state.cells) {
    const at = placeCrossPoint(centroid(cell.vertices));
    const mesh = new THREE.Mesh(cubeGeo, porcelain);
    mesh.name = `cross-cell-${cell.id}`;
    mesh.position.set(at[0], at[1], at[2]);
    group.add(mesh);
  }

  const seen = new Set<string>();
  const bars: THREE.BufferGeometry[] = [];
  const unit = new THREE.Vector3(0, 0, 1);
  for (const cell of state.cells) {
    for (const [i, j] of cell.edges) {
      const a = v3(placeCrossPoint(cell.vertices[i]));
      const b = v3(placeCrossPoint(cell.vertices[j]));
      const key = edgeKey(a, b);
      if (seen.has(key)) continue;
      seen.add(key);
      const dir = new THREE.Vector3().subVectors(b, a);
      const length = dir.length();
      if (length < 1e-4) continue;
      const geo = new THREE.BoxGeometry(0.1, 0.1, length);
      geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(unit, dir.multiplyScalar(1 / length)));
      const mid = a.add(b).multiplyScalar(0.5);
      geo.translate(mid.x, mid.y, mid.z);
      bars.push(geo);
    }
  }
  const edgeGeo = mergeGeometries(bars, false) ?? new THREE.BufferGeometry();
  for (const geo of bars) geo.dispose();
  const edges = new THREE.Mesh(edgeGeo, bronze);
  edges.name = "cross-edges";
  group.add(edges);

  for (const hinge of state.hinges) {
    const quad = orderQuad(hinge.parentPoints.map((point) => v3(placeCrossPoint(point))));
    const material = new THREE.MeshStandardMaterial({
      color: 0x241c38,
      emissive: 0x7d8cff,
      emissiveIntensity: 0.34,
      roughness: 0.42,
      metalness: 0.12,
      side: THREE.DoubleSide,
    });
    hingeMats.push(material);
    const mesh = new THREE.Mesh(quadGeometry(quad, 0.62), material);
    mesh.name = `cross-hinge-${hinge.parent}-${hinge.child}`;
    group.add(mesh);
  }

  const stylobate = new THREE.Mesh(new THREE.CylinderGeometry(3.85, 4.05, 0.2, 8), stone);
  stylobate.position.y = 0.1;
  const step = new THREE.Mesh(new THREE.CylinderGeometry(2.85, 3.05, 0.12, 8), bronze);
  step.position.y = 0.26;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(2.45, 8), metal);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.33;
  const socle = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.7, 0.72), stone);
  socle.name = "cross-socle";
  socle.position.y = 0.78;
  group.add(stylobate, step, floor, socle);

  const signMap = plaqueTexture();
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.95),
    new THREE.MeshBasicMaterial({ map: signMap, toneMapped: false }),
  );
  sign.position.set(3.55, 1.2, 2.85);
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(2.04, 1.08, 0.08), stone);
  tablet.position.set(3.55, 1.2, 2.78);
  group.add(tablet, sign);

  const key = new THREE.PointLight(0xffe1b0, 16, 42, 2);
  key.position.set(-2.4, 5.6, 3.6);
  const accent = new THREE.PointLight(0x9aa6ff, 7, 22, 2);
  accent.position.set(0.4, 5.4, 2.4);
  group.add(key, accent);

  const counted = census(group);
  const origin = new THREE.Vector3();
  let frozen = false;
  return {
    group,
    triangles: counted.triangles,
    meshes: counted.meshes,
    lights: counted.lights,
    cells: state.cells.length,
    hinges: state.hinges.length,
    edges: seen.size,
    tick(time, cameraPosition, reduced) {
      group.getWorldPosition(origin);
      if (cameraPosition.distanceTo(origin) > 170) return;
      if (reduced && frozen) return;
      hingeMats.forEach((material, index) => {
        material.emissiveIntensity = reduced ? 0.34 : 0.26 + Math.sin(time * 0.24 + index * 0.85) * 0.08;
      });
      frozen = reduced;
    },
    dispose() {
      signMap.dispose();
      porcelain.dispose();
      bronze.dispose();
      stone.dispose();
      metal.dispose();
      for (const material of hingeMats) material.dispose();
      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh && mesh.geometry && mesh.geometry !== cubeGeo) mesh.geometry.dispose();
      });
      cubeGeo.dispose();
    },
  };
}
