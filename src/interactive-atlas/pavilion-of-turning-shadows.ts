import * as THREE from "three";

/**
 * Pavilion of Turning Shadows. A fairground invitation, not the instrument.
 *
 * The figure is a procedural silhouette. No mesh asset is loaded.
 * It turns slowly on a pedestal. It does not run the dancer's yaw, ledger,
 * or shading, and it does not say which way the figure is turning.
 */

export type TurningShadows = {
  group: THREE.Group;
  /** Triangles in the pavilion itself, before any shared atlas ground. */
  triangles: number;
  tick: (time: number, cameraPosition: THREE.Vector3, reduced: boolean) => void;
  dispose: () => void;
};

function countTriangles(root: THREE.Object3D) {
  let count = 0;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry;
    const index = geometry.getIndex();
    if (index) count += index.count / 3;
    else count += (geometry.getAttribute("position")?.count ?? 0) / 3;
  });
  return count;
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
  g.fillText("AMBIGUOUS DANCER", 256, 96);
  g.fillStyle = "#f3eee4";
  g.font = "400 32px Palatino, 'Times New Roman', serif";
  g.fillText("Pavilion of Turning Shadows", 256, 162);
  tex.needsUpdate = true;
  return tex;
}

/** A limb as one box. Local origin is the joint; the mesh hangs along −Y or along +Z. */
function limb(w: number, h: number, d: number, material: THREE.Material, y: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.y = y;
  return mesh;
}

export function buildPavilionOfTurningShadows(): TurningShadows {
  const group = new THREE.Group();
  group.name = "ambiguous-dancer-pavilion";

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
    emissiveIntensity: 0.22,
  });
  const porcelain = new THREE.MeshStandardMaterial({
    color: 0xf7f1e6,
    roughness: 0.55,
    metalness: 0,
    emissive: 0x8a7560,
    emissiveIntensity: 0.45,
    side: THREE.DoubleSide,
  });
  const silhouette = new THREE.MeshStandardMaterial({
    color: 0x100e12,
    metalness: 0.15,
    roughness: 0.55,
    emissive: 0x2a241c,
    emissiveIntensity: 0.55,
  });

  const stylobate = new THREE.Mesh(new THREE.CylinderGeometry(4.15, 4.35, 0.18, 8), stone);
  stylobate.position.y = 0.09;
  const step = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.14, 8), bronze);
  step.position.y = 0.24;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(2.7, 8), metal);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.32;
  group.add(stylobate, step, floor);

  // Four posts, open toward +z (the path). Not the six-column tholos of Hall of Faces.
  const posts: Array<[number, number]> = [
    [-2.15, 1.35],
    [2.15, 1.35],
    [-2.15, -1.55],
    [2.15, -1.55],
  ];
  for (const [x, z] of posts) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.55, 6), metal);
    shaft.position.set(x, 1.7, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.12, 6), bronze);
    base.position.set(x, 0.46, z);
    const capital = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.1, 6), gold);
    capital.position.set(x, 3.02, z);
    group.add(shaft, base, capital);
  }

  const beamZ = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.12, 0.16), metal);
  beamZ.position.set(0, 3.14, 1.35);
  const beamBack = beamZ.clone();
  beamBack.position.z = -1.55;
  const beamX = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 3.1), metal);
  beamX.position.set(-2.15, 3.14, -0.1);
  const beamRight = beamX.clone();
  beamRight.position.x = 2.15;
  group.add(beamZ, beamBack, beamX, beamRight);

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 0.18), gold);
  lintel.position.set(0, 3.28, 1.35);
  group.add(lintel);

  // Pale lunette behind the figure so the silhouette reads from the path.
  const lunette = new THREE.Mesh(new THREE.CircleGeometry(1.7, 24), porcelain);
  lunette.position.set(0, 2.15, -1.85);
  group.add(lunette);

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.42, 8), bronze);
  pedestal.position.y = 0.54;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.16, 8), gold);
  neck.position.y = 0.8;
  group.add(pedestal, neck);

  const pivot = new THREE.Group();
  pivot.name = "ambiguous-dancer-turn";
  pivot.position.y = 0.9;
  pivot.rotation.y = 0.9;
  group.add(pivot);

  const figure = new THREE.Group();
  figure.name = "ambiguous-dancer-silhouette";
  figure.scale.setScalar(2.05);
  const torso = limb(0.38, 0.78, 0.18, silhouette, 0.82);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), silhouette);
  head.scale.set(1, 1.15, 0.85);
  head.position.y = 1.38;
  const armL = limb(0.1, 0.52, 0.1, silhouette, 0.78);
  armL.position.set(-0.26, 0.24, 0);
  armL.rotation.z = 0.7;
  const armR = limb(0.1, 0.5, 0.1, silhouette, 0.74);
  armR.position.set(0.24, 0.18, 0.02);
  armR.rotation.z = -1.25;
  const stand = limb(0.11, 0.66, 0.11, silhouette, 0.3);
  stand.position.set(-0.08, 0, 0);
  const arabesque = limb(0.1, 0.64, 0.1, silhouette, 0.26);
  arabesque.position.set(0.12, 0.1, 0);
  arabesque.rotation.x = -1.2;
  arabesque.rotation.z = 0.2;
  figure.add(torso, head, armL, armR, stand, arabesque);
  pivot.add(figure);

  const signMap = plaqueTexture();
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.85, 0.92),
    new THREE.MeshBasicMaterial({ map: signMap, toneMapped: false }),
  );
  sign.position.set(2.35, 1.15, 2.55);
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(1.98, 1.05, 0.08), stone);
  tablet.position.set(2.35, 1.15, 2.48);
  group.add(tablet, sign);

  const key = new THREE.PointLight(0xfff2d4, 28, 28, 2);
  key.position.set(0.2, 3.2, 2.2);
  const wash = new THREE.PointLight(0xfff6e8, 18, 16, 2);
  wash.position.set(0, 2.3, -0.4);
  const fill = new THREE.PointLight(0xd5e2f2, 8, 22, 2);
  fill.position.set(1.8, 2.4, 2.6);
  const rim = new THREE.PointLight(0xfff8ee, 22, 10, 2);
  rim.position.set(0, 2.15, 1.15);
  group.add(key, wash, fill, rim);

  const triangles = countTriangles(group);
  const origin = new THREE.Vector3();
  return {
    group,
    triangles,
    tick(time, cameraPosition, reduced) {
      group.getWorldPosition(origin);
      if (cameraPosition.distanceTo(origin) > 170) return;
      pivot.rotation.y = reduced ? 0.9 : time * 0.22 + 0.4;
    },
    dispose() {
      signMap.dispose();
      stone.dispose();
      metal.dispose();
      bronze.dispose();
      gold.dispose();
      porcelain.dispose();
      silhouette.dispose();
    },
  };
}
