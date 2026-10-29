import * as THREE from "three";
import { GARDEN_COURT, GARDEN_RAIL } from "./terrain";

/** Hide the court when the camera is this far from its center. */
export const GARDEN_CULL = 230;

export type GardenBudget = {
  meshes: number;
  instanced: number;
  triangles: number;
  expanded: number;
  transparent: number;
  lights: number;
  materials: number;
};

export type FairGarden = {
  group: THREE.Group;
  cull: (cameraPosition: THREE.Vector3) => void;
  budget: () => GardenBudget;
};

function stoneMat(color: number) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0.08 });
}

function countTris(geometry: THREE.BufferGeometry) {
  const index = geometry.index;
  const count = index ? index.count : (geometry.getAttribute("position")?.count ?? 0);
  return count / 3;
}

export function measureGarden(root: THREE.Object3D): GardenBudget {
  let meshes = 0;
  let instanced = 0;
  let triangles = 0;
  let expanded = 0;
  let transparent = 0;
  let lights = 0;
  const materials = new Set<string>();
  root.traverse((obj) => {
    const node = obj as THREE.Mesh & { isInstancedMesh?: boolean; isLight?: boolean; count?: number };
    if (node.isLight) lights += 1;
    if (!node.isMesh) return;
    meshes += 1;
    const tris = countTris(node.geometry);
    triangles += tris;
    const copies = node.isInstancedMesh ? (node.count ?? 1) : 1;
    if (node.isInstancedMesh) instanced += 1;
    expanded += tris * copies;
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    for (const mat of mats) {
      materials.add(mat.uuid);
      if (mat.transparent) transparent += 1;
    }
  });
  return {
    meshes,
    instanced,
    triangles: Math.round(triangles),
    expanded: Math.round(expanded),
    transparent,
    lights,
    materials: materials.size,
  };
}

export function buildFairGarden(): FairGarden {
  const group = new THREE.Group();
  group.name = "fair-garden";
  group.position.set(GARDEN_COURT.x, 0, GARDEN_COURT.z);

  const dark = stoneMat(0x4e4840);
  const ash = stoneMat(0x6e655b);
  const pale = stoneMat(0x8f8678);
  const bronze = new THREE.MeshStandardMaterial({
    color: 0x8d6840,
    metalness: 0.62,
    roughness: 0.38,
    emissive: 0x3a2914,
    emissiveIntensity: 0.12,
  });
  const timber = new THREE.MeshStandardMaterial({ color: 0x3d2c22, roughness: 0.78, metalness: 0.06 });
  const leaf = new THREE.MeshStandardMaterial({ color: 0x8a4528, roughness: 0.86, metalness: 0.02 });
  const fir = new THREE.MeshStandardMaterial({ color: 0x3c5248, roughness: 0.9, metalness: 0.02 });
  const grass = new THREE.MeshStandardMaterial({ color: 0x8c7044, roughness: 0.92, metalness: 0 });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffe2b8,
    emissive: 0xffc98a,
    emissiveIntensity: 0.85,
    roughness: 0.34,
    metalness: 0.08,
  });

  const [outer, mid, inner] = GARDEN_COURT.rings;
  const terrace = (radius: number, top: number, below: number, material: THREE.Material) => {
    const height = Math.max(0.08, top - below);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + 0.18, height, 28), material);
    mesh.position.y = below + height / 2 + 0.02;
    group.add(mesh);
  };
  terrace(outer.r, outer.top, 0, dark);
  terrace(mid.r, mid.top, outer.top, ash);
  terrace(inner.r, inner.top, mid.top, pale);

  const railY = outer.top;
  const rail = new THREE.Mesh(new THREE.BoxGeometry(GARDEN_RAIL.hx * 2, 0.16, GARDEN_RAIL.hz * 2), pale);
  rail.position.set(GARDEN_RAIL.x, railY + 0.7, 0);
  group.add(rail);
  const balusterGeo = new THREE.BoxGeometry(0.12, 0.62, 0.12);
  const balusters = new THREE.InstancedMesh(balusterGeo, pale, 11);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 11; i++) {
    dummy.position.set(GARDEN_RAIL.x, railY + 0.34, -GARDEN_RAIL.hz + (i * (GARDEN_RAIL.hz * 2)) / 10);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    balusters.setMatrixAt(i, dummy.matrix);
  }
  balusters.computeBoundingSphere();
  group.add(balusters);

  const trunkGeo = new THREE.CylinderGeometry(0.09, 0.14, 1.55, 5);
  const canopyGeo = new THREE.IcosahedronGeometry(1.05, 1);
  const trees: Array<[number, number, number]> = [
    [-6.2, 2.2, 1.05],
    [5.4, -3.2, 1.15],
    [-2.8, -6.4, 0.9],
    [3.4, 6.2, 1.1],
    [7.2, 0.6, 0.85],
    [-7.1, -1.6, 0.95],
  ];
  const trunks = new THREE.InstancedMesh(trunkGeo, timber, trees.length);
  const canopies = new THREE.InstancedMesh(canopyGeo, leaf, trees.length);
  trees.forEach(([x, z, s], i) => {
    dummy.position.set(x, mid.top + 0.78, z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, mid.top + 2.15, z);
    dummy.scale.set(s, s * 0.82, s);
    dummy.rotation.set(0.1 * (i % 2 === 0 ? 1 : -1), i * 0.4, 0);
    dummy.updateMatrix();
    canopies.setMatrixAt(i, dummy.matrix);
  });
  trunks.computeBoundingSphere();
  canopies.computeBoundingSphere();
  group.add(trunks, canopies);

  const firGeo = new THREE.ConeGeometry(0.72, 2.5, 6);
  const firs: Array<[number, number]> = [
    [0.4, 10.2],
    [3.1, 9.6],
    [-2.6, 10.0],
  ];
  const conifers = new THREE.InstancedMesh(firGeo, fir, firs.length);
  firs.forEach(([x, z], i) => {
    dummy.position.set(x, outer.top + 1.25, z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    conifers.setMatrixAt(i, dummy.matrix);
  });
  conifers.computeBoundingSphere();
  group.add(conifers);

  const tuft = new THREE.ConeGeometry(0.14, 0.48, 4);
  const grassCount = 28;
  const grasses = new THREE.InstancedMesh(tuft, grass, grassCount);
  for (let i = 0; i < grassCount; i++) {
    const a = (i / grassCount) * Math.PI * 2 + 0.2;
    const radius = 9.4 + (i % 4) * 0.55;
    dummy.position.set(Math.cos(a) * radius, outer.top + 0.22, Math.sin(a) * radius * 0.78);
    dummy.scale.set(1, 0.75 + (i % 3) * 0.2, 1);
    dummy.rotation.set(0, a, 0);
    dummy.updateMatrix();
    grasses.setMatrixAt(i, dummy.matrix);
  }
  grasses.computeBoundingSphere();
  group.add(grasses);

  const postGeo = new THREE.CylinderGeometry(0.07, 0.09, 2.7, 5);
  const beamGeo = new THREE.BoxGeometry(0.14, 0.1, 5.2);
  const posts = new THREE.InstancedMesh(postGeo, timber, 4);
  const postAt: Array<[number, number]> = [
    [-10.2, -2.3],
    [-10.2, 2.3],
    [-7.6, -2.3],
    [-7.6, 2.3],
  ];
  postAt.forEach(([x, z], i) => {
    dummy.position.set(x, outer.top + 1.35, z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    posts.setMatrixAt(i, dummy.matrix);
  });
  posts.computeBoundingSphere();
  const beamA = new THREE.Mesh(beamGeo, bronze);
  beamA.position.set(-10.2, outer.top + 2.72, 0);
  const beamB = new THREE.Mesh(beamGeo, timber);
  beamB.position.set(-7.6, outer.top + 2.62, 0);
  const purlin = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.08, 0.1), bronze);
  purlin.position.set(-8.9, outer.top + 2.78, 0);
  group.add(posts, beamA, beamB, purlin);

  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.55, 1.35), pale);
  pedestal.position.y = inner.top + 0.275;
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.72, 12, 9), ash);
  sphere.position.y = inner.top + 1.27;
  const rib = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.045, 6, 16, Math.PI * 1.15), bronze);
  rib.position.set(1.15, inner.top + 1.15, 0.15);
  rib.rotation.z = -0.4;
  rib.rotation.y = 0.5;
  group.add(pedestal, sphere, rib);

  const lampPosts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.05, 1.7, 5), bronze, 6);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 7, 6), lanternMat, 6);
  const lamps: Array<[number, number]> = [
    [2.6, 2.2],
    [-2.6, 2.2],
    [2.6, -2.2],
    [-2.6, -2.2],
    [-9.4, -2.3],
    [-9.4, 2.3],
  ];
  lamps.forEach(([x, z], i) => {
    const d = Math.hypot(x, z);
    const foot = d < inner.r ? inner.top : d < mid.r ? mid.top : outer.top;
    dummy.position.set(x, foot + 0.85, z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    lampPosts.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, foot + 1.78, z);
    dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
  });
  lampPosts.computeBoundingSphere();
  heads.computeBoundingSphere();
  group.add(lampPosts, heads);

  const key = new THREE.PointLight(0xffc98a, 9, 18, 2);
  key.position.set(0, inner.top + 1.6, 0);
  const fill = new THREE.PointLight(0xffe1b0, 5, 14, 2);
  fill.position.set(-9.2, outer.top + 1.6, 0);
  group.add(key, fill);

  const origin = new THREE.Vector3(GARDEN_COURT.x, 0, GARDEN_COURT.z);
  return {
    group,
    cull: (cameraPosition) => {
      group.visible = cameraPosition.distanceTo(origin) < GARDEN_CULL;
    },
    budget: () => measureGarden(group),
  };
}
