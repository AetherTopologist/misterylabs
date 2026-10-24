import * as THREE from "three";
import { computeUnfoldPath } from "@/components/CubeNetExplorer";
import { foldCube, type V3 } from "@/instruments/higher-dimensional/fold-cube";

/**
 * House of Unfolding. A fairground invitation, not the instrument.
 *
 * NETS[0] is the classic cross: six squares and five spanning-tree hinges.
 * The left board is that net, flat. The right volume is the same net
 * folded by foldCube. Nothing here mounts the cube laboratory.
 */

/** Classic cross. foldCube closes this index into a cube of side 2. */
export const HOUSE_NET = 0;
/** Partial fold held when motion is reduced. Not flat, and not closed. */
export const HOUSE_HOLD = 0.55;

const NET_SCALE = 0.42;
const FOLD_SCALE = 0.5;

export type HouseOfUnfolding = {
  group: THREE.Group;
  triangles: number;
  meshes: number;
  lights: number;
  hinges: number;
  tick: (time: number, cameraPosition: THREE.Vector3, reduced: boolean) => void;
  dispose: () => void;
};

const FACE_HEX = [0x22d3ee, 0xa78bfa, 0xfbbf24, 0x6366f1, 0x4ade80, 0xfb7185];

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
  g.font = "600 36px Palatino, 'Times New Roman', serif";
  g.fillText("INSIDE-OUT UNIVERSE", 256, 96);
  g.fillStyle = "#f3eee4";
  g.font = "400 32px Palatino, 'Times New Roman', serif";
  g.fillText("House of Unfolding", 256, 162);
  tex.needsUpdate = true;
  return tex;
}

function mapFaces(faces: V3[][], scale: number): THREE.Vector3[][] {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const face of faces) {
    for (const p of face) {
      for (let k = 0; k < 3; k++) {
        if (p[k] < min[k]) min[k] = p[k];
        if (p[k] > max[k]) max[k] = p[k];
      }
    }
  }
  const c = min.map((v, i) => (v + max[i]) / 2);
  return faces.map((face) =>
    face.map((p) => new THREE.Vector3((p[0] - c[0]) * scale, (p[1] - c[1]) * scale, (p[2] - c[2]) * scale)),
  );
}

function writeQuad(mesh: THREE.Mesh, quad: THREE.Vector3[]) {
  const attr = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
  const [a, b, c, d] = quad;
  const data = [a, b, c, a, c, d];
  for (let i = 0; i < 6; i++) attr.setXYZ(i, data[i].x, data[i].y, data[i].z);
  attr.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}

function writeOutline(line: THREE.LineSegments, quads: THREE.Vector3[][]) {
  const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
  let n = 0;
  for (const quad of quads) {
    for (let i = 0; i < 4; i++) {
      const a = quad[i];
      const b = quad[(i + 1) % 4];
      attr.setXYZ(n, a.x, a.y, a.z);
      attr.setXYZ(n + 1, b.x, b.y, b.z);
      n += 2;
    }
  }
  attr.needsUpdate = true;
}

const _up = new THREE.Vector3(0, 1, 0);
const _delta = new THREE.Vector3();

function aimHinge(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
  _delta.subVectors(b, a);
  const length = _delta.length();
  if (length < 1e-4) {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.scale.set(1, length, 1);
  _delta.multiplyScalar(1 / length);
  mesh.quaternion.setFromUnitVectors(_up, _delta);
}

function placeHinges(edges: [number, number][], quads: THREE.Vector3[][], hinges: THREE.Mesh[]) {
  edges.forEach(([parent, child], index) => {
    const hits: THREE.Vector3[] = [];
    for (const vertex of quads[child]) {
      if (quads[parent].some((other) => other.distanceTo(vertex) < 1e-3)) hits.push(vertex);
    }
    if (hits.length < 2) {
      hinges[index].visible = false;
      return;
    }
    aimHinge(hinges[index], hits[0], hits[1]);
  });
}

function faceMesh(color: number, name: string, material: THREE.Material) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(18), 3));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  return mesh;
}

function outlineLine(name: string, material: THREE.Material) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6 * 4 * 2 * 3), 3));
  const line = new THREE.LineSegments(geometry, material);
  line.name = name;
  return line;
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

export function buildHouseOfUnfolding(): HouseOfUnfolding {
  const group = new THREE.Group();
  group.name = "inside-out-house";
  const edges = computeUnfoldPath(HOUSE_NET, "cw").edges;

  const stone = new THREE.MeshStandardMaterial({ color: 0x2c2925, metalness: 0.08, roughness: 0.84 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x171a20, metalness: 0.72, roughness: 0.4 });
  const bronze = new THREE.MeshStandardMaterial({
    color: 0x8d6840,
    metalness: 0.74,
    roughness: 0.34,
    emissive: 0x3a2914,
    emissiveIntensity: 0.16,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xc4a574,
    metalness: 0.62,
    roughness: 0.38,
    emissive: 0x5a4630,
    emissiveIntensity: 0.2,
  });
  const porcelain = new THREE.MeshStandardMaterial({
    color: 0xf7f1e6,
    roughness: 0.42,
    metalness: 0.02,
    emissive: 0x6a5844,
    emissiveIntensity: 0.55,
    side: THREE.DoubleSide,
  });
  const ink = new THREE.LineBasicMaterial({ color: 0x140e0a });
  const faceMats = FACE_HEX.map(
    (color) =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.62,
        roughness: 0.38,
        metalness: 0.06,
        side: THREE.DoubleSide,
      }),
  );

  const stylobate = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.7, 0.18, 8), stone);
  stylobate.position.y = 0.09;
  const step = new THREE.Mesh(new THREE.CylinderGeometry(3.45, 3.65, 0.14, 8), bronze);
  step.position.y = 0.24;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(2.95, 8), metal);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.32;
  group.add(stylobate, step, floor);

  const posts: Array<[number, number]> = [
    [-2.35, 1.55],
    [2.35, 1.55],
    [-2.35, -1.35],
    [2.35, -1.35],
  ];
  for (const [x, z] of posts) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.9, 6), metal);
    shaft.position.set(x, 2.41, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.12, 6), bronze);
    base.position.set(x, 0.46, z);
    const capital = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.1, 6), gold);
    capital.position.set(x, 4.42, z);
    group.add(shaft, base, capital);
  }

  const beamFront = new THREE.Mesh(new THREE.BoxGeometry(5.05, 0.12, 0.16), metal);
  beamFront.position.set(0, 4.52, 1.55);
  const beamBack = beamFront.clone();
  beamBack.position.z = -1.35;
  const beamLeft = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 3.15), metal);
  beamLeft.position.set(-2.35, 4.52, 0.1);
  const beamRight = beamLeft.clone();
  beamRight.position.x = 2.35;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.14, 0.18), gold);
  lintel.position.set(0, 4.68, 1.55);
  group.add(beamFront, beamBack, beamLeft, beamRight, lintel);

  const lunette = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 3.6), porcelain);
  lunette.position.set(0, 2.35, -1.62);
  group.add(lunette);

  const hingeGeo = new THREE.CylinderGeometry(0.055, 0.055, 1, 5);

  const netPivot = new THREE.Group();
  netPivot.name = "inside-out-net";
  netPivot.rotation.y = 0.08;
  const netQuads = mapFaces(foldCube(HOUSE_NET, 0, "cw"), NET_SCALE);
  const netBox = new THREE.Box3();
  for (const quad of netQuads) for (const vertex of quad) netBox.expandByPoint(vertex);
  const netCenter = netBox.getCenter(new THREE.Vector3());
  const netSize = netBox.getSize(new THREE.Vector3());
  netPivot.position.set(-1.02, 0.78 - netBox.min.y, 0.95);
  const netBack = new THREE.Mesh(new THREE.PlaneGeometry(netSize.x + 0.28, netSize.y + 0.28), porcelain);
  netBack.position.set(netCenter.x, netCenter.y, netCenter.z - 0.05);
  netPivot.add(netBack);
  const netFaces = faceMats.map((material, index) => {
    const mesh = faceMesh(FACE_HEX[index], `unfold-net-${index}`, material);
    writeQuad(mesh, netQuads[index]);
    netPivot.add(mesh);
    return mesh;
  });
  const netOutline = outlineLine("unfold-net-outline", ink);
  writeOutline(netOutline, netQuads);
  netPivot.add(netOutline);
  const netHinges = edges.map((_, index) => {
    const mesh = new THREE.Mesh(hingeGeo, bronze);
    mesh.name = `unfold-hinge-net-${index}`;
    netPivot.add(mesh);
    return mesh;
  });
  placeHinges(edges, netQuads, netHinges);
  const frameT = 0.045;
  const frameZ = netCenter.z - 0.02;
  const halfW = netSize.x / 2 + 0.08;
  const halfH = netSize.y / 2 + 0.08;
  for (const [w, h, x, y] of [
    [netSize.x + 0.22, frameT, netCenter.x, netCenter.y + halfH],
    [netSize.x + 0.22, frameT, netCenter.x, netCenter.y - halfH],
    [frameT, netSize.y + 0.16, netCenter.x - halfW, netCenter.y],
    [frameT, netSize.y + 0.16, netCenter.x + halfW, netCenter.y],
  ] as Array<[number, number, number, number]>) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), gold);
    bar.position.set(x, y, frameZ);
    netPivot.add(bar);
  }
  group.add(netPivot);

  const foldPivot = new THREE.Group();
  foldPivot.name = "inside-out-fold";
  foldPivot.position.set(1.28, 2.35, 0.85);
  foldPivot.rotation.y = -0.55;
  const foldBack = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 2.45), porcelain);
  foldBack.position.z = -0.15;
  foldPivot.add(foldBack);
  const foldFaces = faceMats.map((material, index) => {
    const mesh = faceMesh(FACE_HEX[index], `unfold-fold-${index}`, material);
    foldPivot.add(mesh);
    return mesh;
  });
  const foldOutline = outlineLine("unfold-fold-outline", ink);
  foldPivot.add(foldOutline);
  const foldHinges = edges.map((_, index) => {
    const mesh = new THREE.Mesh(hingeGeo, gold);
    mesh.name = `unfold-hinge-fold-${index}`;
    foldPivot.add(mesh);
    return mesh;
  });
  const foldPed = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.62, 0.72, 8), bronze);
  foldPed.position.set(1.22, 0.68, 0.15);
  const foldNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.1, 8), gold);
  foldNeck.position.set(1.22, 1.06, 0.15);
  group.add(foldPivot, foldPed, foldNeck);

  const applyFold = (progress: number) => {
    const quads = mapFaces(foldCube(HOUSE_NET, progress, "cw"), FOLD_SCALE);
    foldFaces.forEach((mesh, index) => writeQuad(mesh, quads[index]));
    writeOutline(foldOutline, quads);
    placeHinges(edges, quads, foldHinges);
  };
  applyFold(HOUSE_HOLD);

  const signMap = plaqueTexture();
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.95),
    new THREE.MeshBasicMaterial({ map: signMap, toneMapped: false }),
  );
  sign.position.set(2.05, 1.05, 2.15);
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(2.02, 1.08, 0.08), stone);
  tablet.position.set(2.05, 1.05, 2.08);
  group.add(tablet, sign);

  const key = new THREE.PointLight(0xffe1b0, 18, 40, 2);
  key.position.set(-1.4, 4.2, 2.8);
  const fill = new THREE.PointLight(0xd5e4f4, 8, 28, 2);
  fill.position.set(1.6, 2.8, 2.7);
  group.add(key, fill);

  const counted = census(group);
  const origin = new THREE.Vector3();
  let frozen = false;
  return {
    group,
    triangles: counted.triangles,
    meshes: counted.meshes,
    lights: counted.lights,
    hinges: edges.length,
    tick(time, cameraPosition, reduced) {
      group.getWorldPosition(origin);
      if (cameraPosition.distanceTo(origin) > 170) return;
      if (reduced && frozen) return;
      const progress = reduced ? HOUSE_HOLD : HOUSE_HOLD + Math.sin(time * 0.22) * 0.16;
      applyFold(progress);
      frozen = reduced;
    },
    dispose() {
      signMap.dispose();
      stone.dispose();
      metal.dispose();
      bronze.dispose();
      gold.dispose();
      porcelain.dispose();
      ink.dispose();
      hingeGeo.dispose();
      for (const material of faceMats) material.dispose();
      for (const mesh of [...netFaces, ...foldFaces]) mesh.geometry.dispose();
      netOutline.geometry.dispose();
      foldOutline.geometry.dispose();
    },
  };
}
