import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import type { AtlasApi, AtlasUi, DestinationId, ExhibitId } from "./destinations";
import { COLLECTIONS, HIDDEN_DESTINATIONS } from "./destinations";
import { FOREST_LINKS } from "./forest";

// Forest links are a future horizontal layer. They are not provenance,
// and they are never drawn with the atlas walkways or roots.
function architectureHolds() {
  return (
    FOREST_LINKS.every((link) => link.layer === "forest") &&
    HIDDEN_DESTINATIONS.every((place) => place.kind === "hidden" && !place.placed) &&
    COLLECTIONS.every((place) => place.kind === "collection")
  );
}

const HOME_R = 108;
const HOME_P = 1.2;
const HOME_YAW = 0.55;
const R_MIN = 16;
const R_CEN_MIN = 36;
const R_MAX = 128;
const P_MIN = 0.38;
const P_MAX = 1.22;

const CEN_Y = 8.55;
const CEN_R = 10.7;

type Ribbon = { positions: number[]; indices: number[] };

const _Y = new THREE.Vector3(0, 1, 0);
const _X = new THREE.Vector3(1, 0, 0);
const _ndc = new THREE.Vector2();
const _hit = new THREE.Vector3();
const _focus = new THREE.Vector3();
const _sphere = new THREE.Sphere();

const SITES: Record<ExhibitId, THREE.Vector3> = {
  hydrogen: new THREE.Vector3(36, 2.4, 18),
  triad: new THREE.Vector3(-48, 2.2, 12),
  optics: new THREE.Vector3(38, 2.2, -28),
  xprimeray: new THREE.Vector3(8, 2.4, -42),
  bell: new THREE.Vector3(-26, 4.2, -56),
};

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

function angDelta(from: number, to: number) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function emptyRibbon(): Ribbon {
  return { positions: [], indices: [] };
}

function curve(pts: Array<[number, number, number]>, n = 22) {
  const v = pts.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  return new THREE.CatmullRomCurve3(v, false, "catmullrom", 0.18).getPoints(n);
}

function addStrip(r: Ribbon, pts: THREE.Vector3[], width: number, axis: 0 | 1) {
  if (pts.length < 2) return;
  const base = r.positions.length / 3;
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const lateral = new THREE.Vector3();
  const prevSide = new THREE.Vector3();
  const hw = width * 0.5;
  for (let i = 0; i < pts.length; i++) {
    if (i === pts.length - 1) tangent.subVectors(pts[i]!, pts[i - 1]!);
    else tangent.subVectors(pts[i + 1]!, pts[i]!);
    if (tangent.lengthSq() < 1e-10) tangent.set(0, 0, 1);
    else tangent.normalize();
    if (i === 0) {
      const upRef = Math.abs(tangent.y) > 0.92 ? _X : _Y;
      lateral.crossVectors(tangent, upRef);
      if (lateral.lengthSq() < 1e-8) lateral.set(1, 0, 0);
      lateral.normalize();
      if (axis === 0) side.copy(lateral);
      else side.crossVectors(tangent, lateral).normalize();
    } else {
      side.copy(prevSide);
      side.addScaledVector(tangent, -side.dot(tangent));
      if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
      side.normalize();
    }
    prevSide.copy(side);
    const p = pts[i]!;
    r.positions.push(
      p.x + side.x * hw,
      p.y + side.y * hw,
      p.z + side.z * hw,
      p.x - side.x * hw,
      p.y - side.y * hw,
      p.z - side.z * hw,
    );
    if (i > 0) {
      const a = base + (i - 1) * 2;
      const c = base + i * 2;
      r.indices.push(a, a + 1, c + 1, a, c + 1, c);
    }
  }
}

function addRibbon(r: Ribbon, pts: THREE.Vector3[], width: number, cross = false) {
  addStrip(r, pts, width, 0);
  if (cross) addStrip(r, pts, width * 0.72, 1);
}

function meshFrom(r: Ribbon, material: THREE.Material) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(r.positions, 3));
  geo.setIndex(r.indices);
  geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  return mesh;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d");
  if (!g) return new THREE.Texture();
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,250,242,1)");
  grd.addColorStop(0.2, "rgba(255,244,220,0.8)");
  grd.addColorStop(0.5, "rgba(214,196,160,0.16)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function basicGlow(color: number, opacity: number) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
}

function fovFor(base: number, aspect: number) {
  const h = 2 * Math.atan(Math.tan((base * Math.PI) / 360) * aspect);
  const minH = aspect < 1 ? 0.82 : 0.62;
  if (h >= minH) return base;
  return Math.min(92, (2 * Math.atan(Math.tan(minH / 2) / aspect) * 180) / Math.PI);
}

function layPath(scene: THREE.Scene, pts: THREE.Vector3[], walkMat: THREE.Material, glowMat: THREE.Material, walkW: number, glowW: number) {
  const flat = pts.map((p) => new THREE.Vector3(p.x, 0.05, p.z));
  const walk = emptyRibbon();
  addRibbon(walk, flat, walkW, false);
  scene.add(meshFrom(walk, walkMat));
  const glowPts = pts.map((p) => new THREE.Vector3(p.x, 0.16, p.z));
  const glow = emptyRibbon();
  addRibbon(glow, glowPts, glowW, true);
  scene.add(meshFrom(glow, glowMat));
}

export function mountObservatory(canvas: HTMLCanvasElement, onChange: (ui: AtlasUi) => void) {
  if (!architectureHolds()) {
    throw new Error("Atlas architecture mixed a hidden, collection, or forest link into the ground.");
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !coarse,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.setClearColor(0x07080b, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.15 : 1.5));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07080b);
  scene.fog = new THREE.FogExp2(0x07080b, 0.0064);
  const camera = new THREE.PerspectiveCamera(46, 1, 0.15, 640);

  scene.add(new THREE.HemisphereLight(0x465060, 0x1a1612, 0.72));
  scene.add(new THREE.AmbientLight(0x14161c, 0.22));
  const moon = new THREE.DirectionalLight(0xc5ced8, 0.85);
  moon.position.set(-48, 54, 18);
  scene.add(moon);

  const stone = new THREE.MeshStandardMaterial({ color: 0x14171c, metalness: 0.18, roughness: 0.78 });
  const stoneDark = new THREE.MeshStandardMaterial({ color: 0x0c0e12, metalness: 0.22, roughness: 0.7 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x171a20, metalness: 0.78, roughness: 0.36 });
  const figureMat = new THREE.MeshStandardMaterial({ color: 0x3a342c, metalness: 0.2, roughness: 0.62 });
  const walkMat = new THREE.MeshStandardMaterial({
    color: 0x1c2028,
    metalness: 0.55,
    roughness: 0.46,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    side: THREE.DoubleSide,
  });
  const pathGlow = basicGlow(0xf4efe6, 0.36);
  const rootGlow = basicGlow(0xc4a574, 0.26);
  const goldLine = basicGlow(0xc4a574, 0.5);
  const coolLine = basicGlow(0xd5dee8, 0.45);

  const glassMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    vertexShader: `
      varying vec3 vN; varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: `
      varying vec3 vN; varying vec3 vW;
      void main() {
        vec3 V = normalize(cameraPosition - vW);
        float f = pow(1.0 - abs(dot(normalize(vN), V)), 2.05);
        gl_FragColor = vec4(0.96, 0.91, 0.82, f * 0.55);
      }
    `,
  });

  const densityMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: { uPulse: { value: 1 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: `
      varying vec3 vN; varying vec3 vW;
      uniform float uPulse;
      void main() {
        vec3 V = normalize(cameraPosition - vW);
        float nd = abs(dot(normalize(vN), V));
        float fres = pow(1.0 - nd, 1.6);
        float core = pow(nd, 0.9);
        vec3 col = vec3(1.0, 0.97, 0.9) * core * 1.2 + vec3(0.78, 0.66, 0.42) * fres * 0.35;
        gl_FragColor = vec4(col, (core * 0.78 + fres * 0.16) * uPulse);
      }
    `,
  });

  const groundMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: `
      varying vec3 vW;
      void main() {
        float r = length(vW.xz);
        float edge = smoothstep(74.0, 96.0, r);
        float rings = smoothstep(0.04, 0.0, abs(fract(r * 0.045) - 0.5) - 0.47);
        float seat = smoothstep(2.2, 0.0, abs(r - 23.5));
        vec3 col = mix(vec3(0.055, 0.058, 0.066), vec3(0.012, 0.013, 0.016), edge);
        col += vec3(0.03, 0.028, 0.02) * rings * (1.0 - edge);
        col += vec3(0.08, 0.065, 0.04) * seat;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const ground = new THREE.Mesh(new THREE.CircleGeometry(96, 96), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);

  const abyss = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), new THREE.MeshBasicMaterial({ color: 0x050608 }));
  abyss.rotation.x = -Math.PI / 2;
  abyss.position.y = -8.4;
  scene.add(abyss);

  const cliffPos: number[] = [];
  const rim = (theta: number, radius = 96, y = 0) => new THREE.Vector3(Math.sin(theta) * radius, y, Math.cos(theta) * radius);
  const a0 = Math.PI - 1.15;
  const a1 = Math.PI + 1.15;
  const seg = 36;
  for (let i = 0; i < seg; i++) {
    const t0 = a0 + ((a1 - a0) * i) / seg;
    const t1 = a0 + ((a1 - a0) * (i + 1)) / seg;
    const wobble = Math.sin(i * 0.65) * 0.28;
    const p0 = rim(t0, 96, 0);
    const p1 = rim(t1, 96, 0);
    const q0 = rim(t0, 96, -7.2 + wobble);
    const q1 = rim(t1, 96, -7.2 + wobble);
    cliffPos.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, q1.x, q1.y, q1.z, p0.x, p0.y, p0.z, q1.x, q1.y, q1.z, q0.x, q0.y, q0.z);
  }
  const cliffGeo = new THREE.BufferGeometry();
  cliffGeo.setAttribute("position", new THREE.Float32BufferAttribute(cliffPos, 3));
  cliffGeo.computeVertexNormals();
  const cliff = new THREE.Mesh(cliffGeo, stone);
  cliff.frustumCulled = false;
  scene.add(cliff);
  const lipPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) lipPts.push(rim(a0 + ((a1 - a0) * i) / 40, 96.2, 0.05));
  const lip = emptyRibbon();
  addRibbon(lip, lipPts, 0.18, true);
  scene.add(meshFrom(lip, goldLine));

  // Cenotaph — spatial origin. Boullée's sphere, translated: stone, drums, one oculus.
  // Human-height posts sit against the drum so the sphere reads as architecture, not a lamp.
  const cen = new THREE.Group();
  const steps: Array<[number, number, number, number]> = [
    [31.5, 32.4, 0.42, 0.21],
    [24.5, 26.2, 0.55, 0.7],
    [20.4, 22.2, 0.7, 1.35],
    [16.2, 17.4, 4.15, 3.75],
  ];
  for (const [rTop, rBot, h, y] of steps) {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 72), y > 2 ? stoneDark : stone);
    drum.position.y = y;
    cen.add(drum);
  }
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(CEN_R, 48, 32), stoneDark);
  sphere.position.y = CEN_Y;
  cen.add(sphere);
  for (const dy of [-3.4, -0.4, 2.6]) {
    const rr = Math.sqrt(Math.max(0.2, CEN_R * CEN_R - dy * dy));
    const course = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.028, 6, 72), metal);
    course.rotation.x = Math.PI / 2;
    course.position.y = CEN_Y + dy;
    cen.add(course);
  }
  const seat = new THREE.Mesh(new THREE.TorusGeometry(11.4, 0.04, 8, 80), goldLine);
  seat.rotation.x = Math.PI / 2;
  seat.position.y = 5.55;
  cen.add(seat);
  const armillary = new THREE.Mesh(new THREE.TorusGeometry(CEN_R + 0.72, 0.022, 6, 80), goldLine);
  armillary.rotation.x = Math.PI / 2.4;
  armillary.rotation.z = 0.4;
  armillary.position.y = CEN_Y;
  cen.add(armillary);

  const oculus = new THREE.Mesh(new THREE.CircleGeometry(1.15, 32), new THREE.MeshBasicMaterial({ color: 0x05060a }));
  oculus.rotation.x = -Math.PI / 2;
  oculus.position.y = CEN_Y + CEN_R - 0.18;
  cen.add(oculus);
  const oculusRing = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.03, 6, 40), basicGlow(0xf6efe4, 0.55));
  oculusRing.rotation.x = Math.PI / 2;
  oculusRing.position.y = CEN_Y + CEN_R - 0.04;
  cen.add(oculusRing);
  const oculusLight = new THREE.PointLight(0xfff1dc, 6, 18, 2);
  oculusLight.position.set(0, CEN_Y + CEN_R + 0.3, 0);
  cen.add(oculusLight);

  const recess = new THREE.Mesh(new THREE.BoxGeometry(1.7, 3.6, 1.1), new THREE.MeshStandardMaterial({ color: 0x07080b, roughness: 1 }));
  recess.position.set(0, 2.35, 15.7);
  cen.add(recess);
  const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 2.7), basicGlow(0xf7f1e6, 0.42));
  slit.position.set(0, 2.25, 16.22);
  cen.add(slit);
  const doorLight = new THREE.PointLight(0xffe7c4, 6, 12, 2);
  doorLight.position.set(0, 2.2, 17.2);
  cen.add(doorLight);

  const pierGeo = new THREE.CylinderGeometry(0.16, 0.28, 5.2, 6);
  const piers = new THREE.InstancedMesh(pierGeo, stone, 24);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + 0.08;
    dummy.position.set(Math.cos(a) * 22.4, 2.9, Math.sin(a) * 22.4);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    piers.setMatrixAt(i, dummy.matrix);
  }
  piers.instanceMatrix.needsUpdate = true;
  cen.add(piers);

  const postGeo = new THREE.CylinderGeometry(0.05, 0.07, 1.75, 5);
  const postsScale = new THREE.InstancedMesh(postGeo, metal, 40);
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 28.2, 1.28, Math.sin(a) * 28.2);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    postsScale.setMatrixAt(i, dummy.matrix);
  }
  postsScale.instanceMatrix.needsUpdate = true;
  cen.add(postsScale);
  scene.add(cen);

  const glowTex = glowTexture();
  const spriteMat = new THREE.SpriteMaterial({
    map: glowTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    opacity: 0.85,
  });

  const highlights: Array<{ id: ExhibitId; mat: THREE.MeshBasicMaterial }> = [];

  const addPad = (x: number, z: number, radius: number) => {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(radius, 40), metal);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(x, 0.03, z);
    scene.add(pad);
  };

  const markSite = (id: ExhibitId, radius: number) => {
    const mat = goldLine.clone();
    mat.opacity = 0.42;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.035, 6, 48), mat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(SITES[id].x, 0.12, SITES[id].z);
    scene.add(ring);
    highlights.push({ id, mat });
  };

  // Hydrogen — glass pavilion, stationary density. Not the chamber.
  {
    const p = SITES.hydrogen;
    addPad(p.x, p.z, 5.2);
    markSite("hydrogen", 4.6);
    const g = new THREE.Group();
    g.position.set(p.x, 0, p.z);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.4, 6), metal);
      col.position.set(Math.cos(a) * 2.7, 1.2, Math.sin(a) * 2.7);
      g.add(col);
    }
    const shell = new THREE.Mesh(new THREE.SphereGeometry(2.85, 36, 24), glassMat);
    shell.position.y = 2.55;
    g.add(shell);
    const density = new THREE.Mesh(new THREE.SphereGeometry(1.15, 28, 20), densityMat);
    density.position.y = 2.55;
    g.add(density);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), basicGlow(0xfff8ee, 0.95));
    core.position.y = 2.55;
    g.add(core);
    const halo = new THREE.Sprite(spriteMat.clone());
    halo.position.y = 2.55;
    halo.scale.set(7.5, 7.5, 1);
    g.add(halo);
    scene.add(g);
    const light = new THREE.PointLight(0xfff3e2, 22, 18, 2);
    light.position.set(p.x, 2.4, p.z);
    scene.add(light);
  }

  // Triad — hangar silhouette and three nodes. Not a flight claim.
  const triadNodes = new THREE.Group();
  {
    const p = SITES.triad;
    addPad(p.x, p.z, 7.4);
    markSite("triad", 6.6);
    const g = new THREE.Group();
    g.position.set(p.x, 0, p.z);
    const posts = [
      [-3.4, -2.1],
      [3.4, -2.1],
      [3.4, 2.1],
      [-3.4, 2.1],
    ];
    for (const [x, z] of posts) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.1, 0.12), metal);
      post.position.set(x, 1.55, z);
      g.add(post);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.08, 0.08), metal);
    beam.position.set(0, 3.05, -2.1);
    const beamB = beam.clone();
    beamB.position.z = 2.1;
    g.add(beam, beamB);
    const craft = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 3.6, 3, 8), metal);
    craft.rotation.z = Math.PI / 2;
    craft.position.y = 1.45;
    g.add(craft);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 2.4), metal);
    wing.position.set(-0.2, 1.45, 0);
    g.add(wing);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.018, 6, 48), coolLine);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.45;
    g.add(ring);
    triadNodes.position.y = 1.45;
    const nodeMat = basicGlow(0xf7f1e6, 0.95);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), nodeMat);
      node.position.set(Math.cos(a) * 3.5, 0, Math.sin(a) * 3.5);
      triadNodes.add(node);
      const mote = new THREE.Sprite(spriteMat.clone());
      mote.scale.set(2.4, 2.4, 1);
      mote.position.copy(node.position);
      triadNodes.add(mote);
    }
    g.add(triadNodes);
    scene.add(g);
    const light = new THREE.PointLight(0xfff0dc, 16, 20, 2);
    light.position.set(p.x, 2.2, p.z);
    scene.add(light);
  }

  // Apple of the Eye — a glass hall and two rays.
  {
    const p = SITES.optics;
    addPad(p.x, p.z, 6.4);
    markSite("optics", 5.8);
    const g = new THREE.Group();
    g.position.set(p.x, 0, p.z);
    for (const [x, z] of [
      [-4.2, -1.8],
      [4.2, -1.8],
      [4.2, 1.8],
      [-4.2, 1.8],
    ]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.4, 0.1), metal);
      post.position.set(x, 1.7, z);
      g.add(post);
    }
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 2.6), glassMat);
    panel.position.set(0, 1.8, 1.75);
    const panelB = panel.clone();
    panelB.position.z = -1.75;
    g.add(panel, panelB);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.06, 28), glassMat);
    lens.rotation.z = Math.PI / 2;
    lens.position.y = 1.7;
    g.add(lens);
    const end = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.02, 6, 32), basicGlow(0xf4efe6, 0.45));
    end.position.set(-4.1, 1.7, 0);
    g.add(end);
    scene.add(g);
    const rays: Array<[number, number, number, number, number, number, number, number, number]> = [
      [-4.2, 2.15, -0.4, 0, 1.7, 0.05, 4.4, 1.25, 0.35],
      [-3.6, 1.15, 0.45, -0.4, 1.55, 0.1, 0.8, 1.45, 0.05],
    ];
    for (const ray of rays) {
      const c = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(p.x + ray[0], ray[1], p.z + ray[2]),
        new THREE.Vector3(p.x + ray[3], ray[4], p.z + ray[5]),
        new THREE.Vector3(p.x + ray[6], ray[7], p.z + ray[8]),
      );
      const ribbon = emptyRibbon();
      addRibbon(ribbon, c.getPoints(16), 0.16, true);
      scene.add(meshFrom(ribbon, ray[6] < 2 ? basicGlow(0xf7f2e8, 0.55) : pathGlow));
    }
    const light = new THREE.PointLight(0xfff4e4, 16, 18, 2);
    light.position.set(p.x, 2, p.z);
    scene.add(light);
  }

  // xPRIMEray — an open frame and a few bending rays.
  {
    const p = SITES.xprimeray;
    addPad(p.x, p.z, 5.6);
    markSite("xprimeray", 5);
    const g = new THREE.Group();
    g.position.set(p.x, 0, p.z);
    const posts = [
      [-2.6, -2.2, 4.2],
      [2.6, -2.2, 4.2],
      [2.6, 2.2, 4.2],
      [-2.6, 2.2, 1.5],
    ];
    for (const [x, z, h] of posts) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, h, 0.1), metal);
      post.position.set(x, h / 2, z);
      g.add(post);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.07, 0.07), metal);
    top.position.set(0, 4.15, -2.2);
    g.add(top);
    const arcPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 18; i++) {
      const a = -0.2 + (i / 18) * Math.PI * 1.15;
      arcPts.push(new THREE.Vector3(Math.cos(a) * 3.1, 2.3 + Math.sin(a) * 1.4, Math.sin(a) * 0.4));
    }
    const arc = emptyRibbon();
    addRibbon(arc, arcPts, 0.05, true);
    g.add(meshFrom(arc, coolLine));
    scene.add(g);
    const bends = [
      curve(
        [
          [p.x - 4.2, 2.1, p.z - 0.6],
          [p.x, 3.4, p.z + 0.2],
          [p.x + 4.3, 2.0, p.z + 0.8],
        ],
        16,
      ),
      curve(
        [
          [p.x - 3.4, 1.2, p.z + 1.1],
          [p.x + 0.4, 2.5, p.z - 0.2],
          [p.x + 3.6, 1.35, p.z - 1.2],
        ],
        16,
      ),
    ];
    for (const pts of bends) {
      const ribbon = emptyRibbon();
      addRibbon(ribbon, pts, 0.14, true);
      scene.add(meshFrom(ribbon, pathGlow));
    }
    const light = new THREE.PointLight(0xe7eef8, 14, 16, 2);
    light.position.set(p.x, 2.4, p.z);
    scene.add(light);
  }

  // Bell — two stations, one shared flash, no path between them.
  const bellMat = basicGlow(0xf7f1e6, 0.35);
  const bellLights: THREE.PointLight[] = [];
  {
    const p = SITES.bell;
    addPad(p.x, p.z, 6.2);
    markSite("bell", 5.6);
    for (const side of [-3.6, 3.6]) {
      const tower = new THREE.Group();
      tower.position.set(p.x + side, 0, p.z);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 7.2, 8), metal);
      shaft.position.y = 3.6;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), metal);
      head.position.y = 7.35;
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), bellMat);
      lamp.position.y = 7.35;
      const crown = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.02, 6, 20), goldLine);
      crown.position.y = 7.35;
      tower.add(shaft, head, lamp, crown);
      scene.add(tower);
      const pl = new THREE.PointLight(0xfff0dc, 6, 10, 2);
      pl.position.set(p.x + side, 7.2, p.z);
      bellLights.push(pl);
      scene.add(pl);
    }
  }

  for (const id of Object.keys(SITES) as ExhibitId[]) {
    const p = SITES[id];
    const pool = new THREE.Mesh(new THREE.CircleGeometry(id === "triad" || id === "bell" ? 4.2 : 3.2, 28), basicGlow(0xc4a574, 0.2));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(p.x, 0.07, p.z);
    scene.add(pool);
  }

  // Tree of walkways from the cenotaph door. Not an epistemic legend.
  const trunk = curve(
    [
      [0, 0, 17.2],
      [0, 0, 26],
      [2, 0, 32],
    ],
    16,
  );
  const toHydrogen = curve(
    [
      [2, 0, 32],
      [14, 0, 30],
      [26, 0, 24],
      [36, 0, 18],
    ],
    20,
  );
  const west = curve(
    [
      [2, 0, 32],
      [-10, 0, 28],
      [-22, 0, 20],
    ],
    16,
  );
  const toTriad = curve(
    [
      [-22, 0, 20],
      [-34, 0, 16],
      [-48, 0, 12],
    ],
    16,
  );
  const spur = curve(
    [
      [-22, 0, 20],
      [-28, 0, 12],
      [-30, 0, 4],
    ],
    12,
  );
  const east = curve(
    [
      [2, 0, 32],
      [16, 0, 18],
      [20, 0, 4],
      [16, 0, -8],
    ],
    20,
  );
  const toOptics = curve(
    [
      [20, 0, 4],
      [30, 0, -8],
      [38, 0, -28],
    ],
    16,
  );
  const south = curve(
    [
      [16, 0, -8],
      [12, 0, -22],
      [8, 0, -42],
    ],
    16,
  );
  const toBell = curve(
    [
      [12, 0, -22],
      [-4, 0, -36],
      [-26, 0, -56],
    ],
    18,
  );
  const limbs: Array<[THREE.Vector3[], number, number]> = [
    [trunk, 1.35, 0.34],
    [toHydrogen, 1.15, 0.28],
    [west, 1.15, 0.28],
    [toTriad, 1.05, 0.24],
    [east, 1.15, 0.26],
    [toOptics, 1.05, 0.22],
    [south, 1.0, 0.22],
    [toBell, 1.0, 0.22],
    [spur, 0.8, 0.14],
  ];
  for (const [pts, walkW, glowW] of limbs) layPath(scene, pts, walkMat, pathGlow, walkW, glowW);

  // Faint provenance under the southern ground, spilling the rim. Not the tree UI.
  const rootSpecs: Array<Array<[number, number, number]>> = [
    [
      [0, -1.2, 4],
      [0, -2.4, -18],
      [2, -4.2, -48],
      [0, -6.6, -102],
    ],
    [
      [0, -1.4, -6],
      [-14, -3.2, -30],
      [-28, -5.4, -70],
      [-36, -7, -108],
    ],
    [
      [0, -1.3, -4],
      [16, -3.4, -28],
      [30, -5.2, -64],
      [22, -6.8, -104],
    ],
    [
      [0, -1.6, 2],
      [8, -3.6, -16],
      [6, -5.8, -40],
      [4, -7.1, -78],
    ],
  ];
  for (const spec of rootSpecs) {
    const ribbon = emptyRibbon();
    addRibbon(ribbon, curve(spec, 18), 0.34, true);
    scene.add(meshFrom(ribbon, rootGlow));
  }

  const bodyGeo = new THREE.CapsuleGeometry(0.16, 0.55, 3, 6);
  const headGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const figureCount = 10;
  const bodies = new THREE.InstancedMesh(bodyGeo, figureMat, figureCount);
  const heads = new THREE.InstancedMesh(headGeo, figureMat, figureCount);
  const figureAt: Array<[number, number]> = [
    [1.1, 16.6],
    [-1.15, 17.1],
    [8, 30],
    [36, 16.4],
    [-46, 10.2],
    [34, -26],
    [6, -40],
    [-22, -52],
    [-18, 18],
    [18, 2],
  ];
  figureAt.forEach(([x, z], i) => {
    dummy.position.set(x, 0.86, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bodies.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 1.32;
    dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
  });
  bodies.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
  scene.add(bodies, heads);

  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(700 * 3);
  for (let i = 0; i < 700; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(260 + Math.random() * 40);
    if (v.y < 10) v.y = Math.abs(v.y) + 14;
    starPos[i * 3] = v.x;
    starPos[i * 3 + 1] = v.y;
    starPos[i * 3 + 2] = v.z;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      color: 0xf3eee6,
      size: 0.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  stars.material.fog = false;
  scene.add(stars);

  let envMap: THREE.Texture | null = null;
  let composer: EffectComposer | null = null;
  let useComposer = false;
  let gradeTick = 0;

  function enableGrade() {
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x10141a);
      envScene.add(new THREE.HemisphereLight(0x6a7888, 0x2a241c, 1));
      envMap = pmrem.fromScene(envScene, 0.04).texture;
      scene.environment = envMap;
      scene.environmentIntensity = 0.38;
      pmrem.dispose();
    } catch {
      envMap = null;
    }
    try {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(2, 2), coarse ? 0.16 : 0.22, 0.4, 0.86));
      composer.addPass(new OutputPass());
      composer.setSize(canvas.clientWidth, canvas.clientHeight);
      useComposer = true;
    } catch {
      composer = null;
      useComposer = false;
    }
  }

  const cenFocus = new THREE.Vector3(0, 3.4, 0);
  let selected: DestinationId | null = null;
  let radiusT = HOME_R;
  let radius = HOME_R;
  let pitchT = HOME_P;
  let pitch = HOME_P;
  let yawT = HOME_YAW;
  let yaw = HOME_YAW;
  const focus = cenFocus.clone();

  const pickRay = new THREE.Raycaster();
  const pickList: Array<{ id: DestinationId; pos: THREE.Vector3; radius: number; auto: boolean }> = [
    ...(Object.keys(SITES) as ExhibitId[]).map((id) => ({
      id,
      pos: SITES[id],
      radius: id === "bell" || id === "triad" ? 9 : 7.5,
      auto: true,
    })),
    { id: "cenotaph", pos: new THREE.Vector3(0, CEN_Y, 0), radius: CEN_R + 1.4, auto: false },
  ];

  function setNdc(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    _ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pick(clientX: number, clientY: number): DestinationId | null {
    setNdc(clientX, clientY);
    pickRay.setFromCamera(_ndc, camera);
    let best: { id: DestinationId; dist: number } | null = null;
    for (const site of pickList) {
      _sphere.center.copy(site.pos);
      _sphere.radius = site.radius;
      const hit = pickRay.ray.intersectSphere(_sphere, _hit);
      if (!hit) continue;
      const dist = hit.distanceTo(pickRay.ray.origin);
      if (!best || dist < best.dist) best = { id: site.id, dist };
    }
    return best?.id ?? null;
  }

  function centeredSite(): ExhibitId | null {
    let best: ExhibitId | null = null;
    let bestScore = 0.2;
    for (const site of pickList) {
      if (!site.auto) continue;
      _hit.copy(site.pos).project(camera);
      if (_hit.z < -1 || _hit.z > 1) continue;
      const score = _hit.x * _hit.x + _hit.y * _hit.y;
      if (score < bestScore) {
        bestScore = score;
        best = site.id as ExhibitId;
      }
    }
    return best;
  }

  function minRadius() {
    if (selected && selected !== "cenotaph") return R_MIN;
    return R_CEN_MIN;
  }

  let lastSent = "";
  let acc = 0;
  let lastTime = performance.now();

  const ptrs = new Map<number, { x: number; y: number }>();
  let gesture: "none" | "orbit" | "pinch" = "none";
  let pinchBase = 0;
  let pinchRadius = HOME_R;
  let moved = 0;
  let lastTap = 0;
  let lastTapX = 0;
  let lastTapY = 0;

  function pinchSpan() {
    const pts = [...ptrs.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
  }

  function zoomIn(factor: number) {
    if (factor < 1 && !selected) {
      const center = centeredSite();
      if (center) selected = center;
    }
    radiusT = clamp(radiusT * factor, minRadius(), R_MAX);
  }

  const onPointerDown = (e: PointerEvent) => {
    if (e.target !== canvas) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* Some browsers reject capture. Orbit still works from the pointer map. */
    }
    if (ptrs.size >= 2) {
      gesture = "pinch";
      pinchBase = pinchSpan();
      pinchRadius = radiusT;
      moved = 40;
      return;
    }
    gesture = "orbit";
    moved = 0;
  };

  const onPointerMove = (e: PointerEvent) => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (gesture === "pinch" && ptrs.size >= 2 && pinchBase > 8) {
      const span = pinchSpan();
      const next = clamp(pinchRadius * (pinchBase / span), minRadius(), R_MAX);
      if (next < radiusT) {
        const pts = [...ptrs.values()];
        const hit = pick((pts[0]!.x + pts[1]!.x) / 2, (pts[0]!.y + pts[1]!.y) / 2);
        if (hit) selected = hit;
        else if (!selected) {
          const center = centeredSite();
          if (center) selected = center;
        }
      }
      radiusT = next;
      return;
    }
    if (gesture === "orbit" && ptrs.size === 1) {
      moved += Math.hypot(dx, dy);
      yaw -= dx * 0.005;
      yawT = yaw;
      pitch = clamp(pitch - dy * 0.0032, P_MIN, P_MAX);
      pitchT = pitch;
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    const was = gesture;
    ptrs.delete(e.pointerId);
    if (ptrs.size >= 2) return;
    if (was === "pinch") {
      gesture = ptrs.size === 1 ? "orbit" : "none";
      moved = 80;
      return;
    }
    gesture = "none";
    if (was !== "orbit" || moved > 8) return;
    const now = performance.now();
    const double = now - lastTap < 340 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 30;
    const hit = pick(e.clientX, e.clientY);
    if (double && hit) {
      selected = hit;
      radiusT = hit === "cenotaph" ? 36 : 24;
      lastTap = 0;
      return;
    }
    if (hit) selected = hit;
    lastTap = now;
    lastTapX = e.clientX;
    lastTapY = e.clientY;
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 480 : 1;
    const dy = e.deltaY * unit;
    zoomIn(Math.exp(dy * 0.00115));
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("wheel", onWheel, { passive: false });

  function emit(force = false) {
    const scale = clamp(Math.log(radius / R_MIN) / Math.log(R_MAX / R_MIN), 0, 1);
    let proximity = 0;
    if (selected === "cenotaph") proximity = 1 - smoothstep(18, 56, camera.position.distanceTo(cenFocus));
    else if (selected) proximity = 1 - smoothstep(18, 56, camera.position.distanceTo(SITES[selected]));
    const atHome =
      !selected &&
      Math.abs(radius - HOME_R) < 4.5 &&
      focus.distanceTo(cenFocus) < 1.2 &&
      Math.abs(angDelta(yaw, HOME_YAW)) < 0.2 &&
      Math.abs(pitch - HOME_P) < 0.08;
    const key = `${selected ?? "-"}|${scale.toFixed(3)}|${proximity.toFixed(3)}|${atHome ? 1 : 0}`;
    if (!force && key === lastSent) return;
    lastSent = key;
    onChange({ scale, selected, proximity, atHome });
  }

  const api: AtlasApi = {
    returnHome: () => {
      selected = null;
      radiusT = HOME_R;
      pitchT = HOME_P;
      yawT = yaw + angDelta(yaw, HOME_YAW);
    },
  };

  const resize = () => {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas);
  resize();

  const placeCamera = () => {
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    camera.position.set(focus.x + radius * cp * Math.sin(yaw), focus.y + radius * sp, focus.z + radius * cp * Math.cos(yaw));
    camera.lookAt(focus);
    camera.fov = fovFor(46, camera.aspect);
    camera.updateProjectionMatrix();
  };
  placeCamera();
  renderer.render(scene, camera);

  renderer.setAnimationLoop((now) => {
    const tNow = typeof now === "number" ? now : performance.now();
    const raw = Math.min(1.2, (tNow - lastTime) / 1000);
    lastTime = tNow;
    const dt = Math.min(0.05, raw);
    const time = tNow / 1000;
    const ease = reduced ? 1 : 1 - Math.exp(-raw * 2.6);

    radiusT = clamp(radiusT, minRadius(), R_MAX);
    radius += (radiusT - radius) * ease;
    pitch += (pitchT - pitch) * ease;
    yaw += (yawT - yaw) * ease;

    _focus.copy(cenFocus);
    if (selected && selected !== "cenotaph") {
      const u = 1 - smoothstep(28, 74, radiusT);
      _focus.lerp(SITES[selected], u);
    }
    focus.lerp(_focus, ease);
    if (focus.distanceTo(cenFocus) < 14) radius = Math.max(radius, R_CEN_MIN);

    if (!reduced) {
      triadNodes.rotation.y = time * 0.18;
      densityMat.uniforms.uPulse!.value = 1 + Math.sin(time * 0.6) * 0.035;
      const flash = Math.pow(Math.max(0, Math.sin(time * 0.8)), 26);
      bellMat.opacity = 0.22 + flash * 0.78;
      for (const light of bellLights) light.intensity = 5 + flash * 22;
    }

    for (const h of highlights) {
      const target = h.id === selected ? 0.9 : 0.16;
      h.mat.opacity += (target - h.mat.opacity) * (reduced ? 1 : 1 - Math.exp(-dt * 6));
    }

    placeCamera();

    if (useComposer && composer) {
      try {
        composer.render();
      } catch {
        useComposer = false;
        renderer.render(scene, camera);
      }
    } else {
      renderer.render(scene, camera);
    }

    if (gradeTick === 1) enableGrade();
    if (gradeTick < 3) gradeTick += 1;

    acc += dt;
    if (acc > 0.08) {
      acc = 0;
      emit();
    }
  });

  emit(true);

  return {
    api,
    dispose: () => {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("wheel", onWheel);
      composer?.dispose();
      envMap?.dispose();
      glowTex.dispose();
      const mats = new Set<THREE.Material>();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => mats.add(m));
        else if (mat) mats.add(mat);
      });
      mats.forEach((m) => m.dispose());
      renderer.dispose();
    },
  };
}
