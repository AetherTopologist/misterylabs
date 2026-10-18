import * as THREE from "three";

/**
 * Einstein's Hall of Faces. A fairground invitation, not the instrument.
 *
 * The sculpture is one decimated concave Einstein shell
 * (src/interactive-atlas/einstein-hall.glb, 4,004 triangles, about 313 KB).
 * Tesla is not loaded. The observatory ride is not mounted here.
 * Nothing in this hall decides whether a visitor sees the hollow as convex.
 */

const MASK_URL = new URL("./einstein-hall.glb", import.meta.url).href;

export type HallOfFaces = {
  group: THREE.Group;
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
  g.font = "600 58px Palatino, 'Times New Roman', serif";
  g.fillText("HOLLOW GENIUS", 256, 96);
  g.fillStyle = "#f3eee4";
  g.font = "400 36px Palatino, 'Times New Roman', serif";
  g.fillText("Hall of Faces", 256, 158);
  tex.needsUpdate = true;
  return tex;
}

export function buildHallOfFaces(): HallOfFaces {
  const group = new THREE.Group();
  group.name = "hollow-genius-hall";

  const stone = new THREE.MeshStandardMaterial({ color: 0x2c2925, metalness: 0.08, roughness: 0.84 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x171a20, metalness: 0.78, roughness: 0.36 });
  const bronze = new THREE.MeshStandardMaterial({
    color: 0x8d6840,
    metalness: 0.74,
    roughness: 0.34,
    emissive: 0x3a2914,
    emissiveIntensity: 0.18,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xc4a574,
    metalness: 0.62,
    roughness: 0.36,
    emissive: 0x5a4630,
    emissiveIntensity: 0.28,
  });
  const porcelain = new THREE.MeshStandardMaterial({
    color: 0xf3eadc,
    roughness: 0.42,
    metalness: 0.05,
    emissive: 0x4a3b2c,
    emissiveIntensity: 0.22,
    side: THREE.DoubleSide,
  });

  const stylobate = new THREE.Mesh(new THREE.CylinderGeometry(4.55, 4.75, 0.2, 8), stone);
  stylobate.position.y = 0.1;
  const step = new THREE.Mesh(new THREE.CylinderGeometry(3.55, 3.75, 0.16, 8), stone);
  step.position.y = 0.26;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3.05, 8), metal);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.35;
  group.add(stylobate, step, floor);

  const columnR = 3.15;
  const gap = 0.82;
  const columnCount = 6;
  for (let i = 0; i < columnCount; i++) {
    const t = (i + 0.5) / columnCount;
    const a = gap + t * (Math.PI * 2 - gap * 2);
    const x = Math.sin(a) * columnR;
    const z = Math.cos(a) * columnR;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 2.85, 8), metal);
    shaft.position.set(x, 1.85, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.12, 8), bronze);
    base.position.set(x, 0.48, z);
    const capital = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.1, 8), gold);
    capital.position.set(x, 3.28, z);
    group.add(shaft, base, capital);
  }

  const ring = new THREE.Mesh(new THREE.TorusGeometry(columnR, 0.055, 8, 48), metal);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 3.34;
  const crown = new THREE.Mesh(new THREE.TorusGeometry(columnR, 0.018, 6, 48), gold);
  crown.rotation.x = Math.PI / 2;
  crown.position.y = 3.42;
  group.add(ring, crown);

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.16, 0.22), metal);
  lintel.position.set(0, 3.22, 2.18);
  const band = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 0.24), gold);
  band.position.set(0, 3.08, 2.18);
  group.add(lintel, band);

  const pediment = new THREE.BufferGeometry();
  pediment.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([-2.35, 3.3, 2.2, 2.35, 3.3, 2.2, 0, 4.05, 2.2], 3),
  );
  pediment.computeVertexNormals();
  const pedMat = stone.clone();
  pedMat.side = THREE.DoubleSide;
  const ped = new THREE.Mesh(pediment, pedMat);
  group.add(ped);

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.74, 0.42, 16), bronze);
  plinth.position.y = 0.58;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.28, 16), bronze);
  neck.position.y = 0.9;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.5, 0.05, 20), gold);
  plate.position.y = 1.04;
  group.add(plinth, neck, plate);

  const pivot = new THREE.Group();
  pivot.name = "hollow-genius-turn";
  pivot.position.y = 1.86;
  pivot.rotation.y = 0.42;
  group.add(pivot);

  const signMap = plaqueTexture();
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.85), new THREE.MeshBasicMaterial({ map: signMap, toneMapped: false }));
  sign.position.set(2.05, 1.25, 3.15);
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.98, 0.08), stone);
  tablet.position.set(2.05, 1.25, 3.08);
  group.add(tablet, sign);

  const key = new THREE.PointLight(0xffe1b0, 16, 42, 2);
  key.position.set(-2.4, 4.4, 3.6);
  const fill = new THREE.PointLight(0xfff0d4, 8, 28, 2);
  fill.position.set(2.1, 2.4, 3.1);
  const rim = new THREE.PointLight(0xc5d0dc, 5, 18, 2);
  rim.position.set(0.2, 2.7, -2.5);
  group.add(key, fill, rim);

  let disposed = false;
  let mask: THREE.Mesh | null = null;
  void import("three/addons/loaders/GLTFLoader.js")
    .then(({ GLTFLoader }) => new GLTFLoader().loadAsync(MASK_URL))
    .then((gltf) => {
      const meshes: THREE.Mesh[] = [];
      gltf.scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) meshes.push(mesh);
      });
      const found = meshes[0];
      if (!found) return;
      const geometry = found.geometry;
      if (disposed) {
        geometry.dispose();
        return;
      }
      mask = new THREE.Mesh(geometry, porcelain);
      mask.name = "hollow-genius-mask";
      mask.frustumCulled = true;
      pivot.add(mask);
    })
    .catch(() => {
      /* The colonnade and the sign remain if the shell cannot load. */
    });

  const origin = new THREE.Vector3();
  return {
    group,
    tick(time, cameraPosition, reduced) {
      group.getWorldPosition(origin);
      if (cameraPosition.distanceTo(origin) > 170) return;
      pivot.rotation.y = reduced ? 0.42 : time * 0.12 + 0.15;
    },
    dispose() {
      disposed = true;
      signMap.dispose();
      porcelain.dispose();
    },
  };
}
