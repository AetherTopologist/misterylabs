import * as THREE from "three";
import {
  ZERO_ANGLES,
  buildWormModel,
  type CellId,
  type V3,
} from "@/instruments/higher-dimensional/cubic-worm-math";

/**
 * The Square Throat. A fairground invitation, not the instrument.
 *
 * The inner panels are one frozen face-on projection from buildWormModel
 * (pair W, view Z, distance 3.2, angles 0). That projection is enlarged so
 * the square reads from the path, and depth is stretched a little further
 * so the frames read as a doorway. Both scales are scenery. This stone is
 * not a 4D object, and no metric is computed. You cannot walk through it.
 */

export const THROAT_DISTANCE = 3.2;
/** Depth scale applied after the projection. Scenery, not a second model. */
export const THROAT_DEPTH = 3.15;
const SXY = 1.72;

const WALL_COLOR: Record<string, number> = {
  "x-": 0x689466,
  "x+": 0xbe7a52,
  "y-": 0x7a7670,
  "y+": 0xceb87c,
};

export type SquareThroat = {
  group: THREE.Group;
  triangles: number;
  meshes: number;
  lights: number;
  tick: (time: number, cameraPosition: THREE.Vector3, reduced: boolean) => void;
  dispose: () => void;
};

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
  g.font = "600 46px Palatino, 'Times New Roman', serif";
  g.fillText("CUBIC WORM", 256, 96);
  g.fillStyle = "#f3eee4";
  g.font = "400 34px Palatino, 'Times New Roman', serif";
  g.fillText("The Square Throat", 256, 162);
  tex.needsUpdate = true;
  return tex;
}

function slabGeometry(quad: THREE.Vector3[], depth: number) {
  const e1 = new THREE.Vector3().subVectors(quad[1], quad[0]);
  const e2 = new THREE.Vector3().subVectors(quad[3], quad[0]);
  const n = new THREE.Vector3().crossVectors(e1, e2);
  if (n.lengthSq() < 1e-8) n.set(0, 0, 1);
  else n.normalize();
  if (n.z < 0) n.negate();
  const half = n.multiplyScalar(depth / 2);
  const front = quad.map((p) => p.clone().add(half));
  const back = quad.map((p) => p.clone().sub(half));
  const positions: number[] = [];
  const push = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  push(front[0], front[1], front[2]);
  push(front[0], front[2], front[3]);
  push(back[0], back[2], back[1]);
  push(back[0], back[3], back[2]);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    push(front[i], back[i], back[j]);
    push(front[i], back[j], front[j]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function addFrame(quad: THREE.Vector3[], material: THREE.Material, thick: number, parent: THREE.Object3D, name: string) {
  const up = new THREE.Vector3(0, 0, 1);
  quad.forEach((a, i) => {
    const b = quad[(i + 1) % 4];
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = dir.length();
    if (length < 1e-4) return;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(thick, thick, length), material);
    mesh.name = `${name}-${i}`;
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(up, dir.multiplyScalar(1 / length));
    parent.add(mesh);
  });
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

export function buildSquareThroat(): SquareThroat {
  const group = new THREE.Group();
  group.name = "cubic-worm-throat";
  const model = buildWormModel(ZERO_ANGLES, "w", 2, THROAT_DISTANCE, false);

  const stone = new THREE.MeshStandardMaterial({ color: 0x2c2925, metalness: 0.08, roughness: 0.84 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x171a20, metalness: 0.72, roughness: 0.4 });
  const bronze = new THREE.MeshStandardMaterial({
    color: 0x8d6840,
    metalness: 0.74,
    roughness: 0.34,
    emissive: 0x3a2914,
    emissiveIntensity: 0.34,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xc4a574,
    metalness: 0.62,
    roughness: 0.38,
    emissive: 0x5a4630,
    emissiveIntensity: 0.38,
  });
  const porcelain = new THREE.MeshStandardMaterial({
    color: 0xf7f1e6,
    roughness: 0.42,
    metalness: 0.02,
    emissive: 0x6a5844,
    emissiveIntensity: 0.55,
    side: THREE.DoubleSide,
  });
  const farMat = new THREE.MeshStandardMaterial({
    color: 0x060a0e,
    roughness: 0.72,
    metalness: 0.08,
    emissive: 0x3a4e78,
    emissiveIntensity: 0.22,
    side: THREE.DoubleSide,
  });
  const wallMats = new Map<CellId, THREE.MeshStandardMaterial>();
  for (const [id, color] of Object.entries(WALL_COLOR) as Array<[CellId, number]>) {
    wallMats.set(
      id,
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.58,
        roughness: 0.48,
        metalness: 0.08,
        side: THREE.DoubleSide,
      }),
    );
  }

  const used: V3[] = [];
  for (const cell of model.cells) {
    for (const face of cell.faces) {
      if (face.role === "entrance" || face.role === "far-mouth" || face.role === "rim") {
        for (const index of face.indices) used.push(cell.projected[index]);
      }
    }
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of used) {
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[2] < minZ) minZ = p[2];
    if (p[2] > maxZ) maxZ = p[2];
  }
  const midX = (minX + maxX) / 2;
  const place = (p: V3) =>
    new THREE.Vector3((p[0] - midX) * SXY, (p[1] - minY) * SXY + 1.05, (p[2] - minZ) * THROAT_DEPTH + 0.35);

  const throat = new THREE.Group();
  throat.name = "cubic-worm-projection";
  let entrance: THREE.Vector3[] | null = null;
  let farQuad: THREE.Vector3[] | null = null;
  for (const cell of model.cells) {
    for (const face of cell.faces) {
      if (face.role !== "entrance" && face.role !== "far-mouth" && face.role !== "rim") continue;
      const quad = face.indices.map((index) => place(cell.projected[index]));
      if (face.role === "entrance") {
        entrance = quad;
        continue;
      }
      const material = face.role === "far-mouth" ? farMat : wallMats.get(cell.id)!;
      const geometry = slabGeometry(quad, face.role === "far-mouth" ? 0.1 : 0.16);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = face.role === "far-mouth" ? "throat-far" : `throat-wall-${cell.id}`;
      throat.add(mesh);
      if (face.role === "far-mouth") farQuad = quad;
    }
  }
  if (entrance) addFrame(entrance, bronze, 0.18, throat, "throat-entrance");
  if (farQuad) addFrame(farQuad, gold, 0.09, throat, "throat-far-frame");
  group.add(throat);

  const door = entrance ? new THREE.Box3().setFromPoints(entrance) : new THREE.Box3();
  const stylobate = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.6, 0.18, 8), stone);
  stylobate.position.y = 0.09;
  const step = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.45, 0.14, 8), bronze);
  step.position.y = 0.24;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(2.85, 8), metal);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.32;
  group.add(stylobate, step, floor);

  const pierX = Math.max(1.7, door.max.x + 0.28);
  const pierZ = door.max.z + 0.02;
  const pierH = Math.max(3.2, door.max.y - 0.55);
  const pierY = 0.48 + pierH / 2;
  for (const x of [-pierX, pierX]) {
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.28, pierH, 0.32), stone);
    shaft.position.set(x, pierY, pierZ);
    const capital = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.42), gold);
    capital.position.set(x, 0.48 + pierH + 0.05, pierZ);
    const jamb = new THREE.Mesh(new THREE.PlaneGeometry(0.22, pierH * 0.92), porcelain);
    jamb.position.set(x + (x < 0 ? 0.15 : -0.15), pierY, pierZ + 0.17);
    group.add(shaft, capital, jamb);
  }
  const lintelW = pierX * 2 + 0.4;
  const lintelY = 0.48 + pierH + 0.16;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(lintelW, 0.16, 0.36), bronze);
  lintel.position.set(0, lintelY, pierZ);
  const band = new THREE.Mesh(new THREE.BoxGeometry(lintelW * 0.86, 0.05, 0.38), gold);
  band.position.set(0, lintelY - 0.08, pierZ);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(lintelW, 0.1, 0.36), bronze);
  sill.position.set(0, door.min.y - 0.08, pierZ);
  group.add(lintel, band, sill);

  const signMap = plaqueTexture();
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.85, 0.92),
    new THREE.MeshBasicMaterial({ map: signMap, toneMapped: false }),
  );
  sign.position.set(pierX + 0.15, 1.15, pierZ + 0.55);
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(1.98, 1.05, 0.08), stone);
  tablet.position.set(pierX + 0.15, 1.15, pierZ + 0.48);
  group.add(tablet, sign);

  const key = new THREE.PointLight(0xffe1b0, 16, 40, 2);
  key.position.set(-1.4, 4.4, pierZ + 1.6);
  const depth = new THREE.PointLight(0x9eb6e4, 5, 16, 2);
  depth.position.set(0, (door.min.y + door.max.y) / 2, (door.min.z + door.max.z) / 2 - 0.4);
  group.add(key, depth);

  const counted = census(group);
  const origin = new THREE.Vector3();
  let frozen = false;
  return {
    group,
    triangles: counted.triangles,
    meshes: counted.meshes,
    lights: counted.lights,
    tick(time, cameraPosition, reduced) {
      group.getWorldPosition(origin);
      if (cameraPosition.distanceTo(origin) > 170) return;
      if (reduced && frozen) return;
      const glow = reduced ? 0.22 : 0.18 + Math.sin(time * 0.28) * 0.05;
      farMat.emissiveIntensity = glow;
      depth.intensity = reduced ? 5 : 4.4 + Math.sin(time * 0.28) * 0.7;
      frozen = reduced;
    },
    dispose() {
      signMap.dispose();
      stone.dispose();
      metal.dispose();
      bronze.dispose();
      gold.dispose();
      porcelain.dispose();
      farMat.dispose();
      for (const material of wallMats.values()) material.dispose();
      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) mesh.geometry?.dispose();
      });
    },
  };
}
