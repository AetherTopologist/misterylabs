import * as THREE from "three";
import { seatMonument, surveyCap, type MonumentSeat } from "./cenotaph-seat";
import { setMonumentCap } from "./terrain";
import { smoothFullResolutionNormals } from "./stone-continuity";
import { buildCenotaphLamps } from "./cenotaph-lamps";
import {
  allArchLamps,
  applyArchTier,
  clearArchSlots,
  initialLightTier,
  makeSlotBlock,
  noteLightBudget,
  selectArchSlots,
  visibleArchLights,
  writeArchSlots,
  type ArchLamp,
} from "./cenotaph-budget";
import { getDiagnostics, patchDiagnostics, type LightTier } from "./cenotaph-diagnostics";

export type CenotaphVariant = "a" | "b" | "c" | "m";
export type CenotaphGlb = "production" | "full";

const GLB_URL: Record<CenotaphGlb, string> = {
  production: new URL("./cenotaph.glb", import.meta.url).href,
  full: new URL("./Cenotaph_FullRes_PPLremovedOnly.glb", import.meta.url).href,
};

type Shared = {
  uVariant: { value: number };
  uDetail: { value: number };
  uLift: { value: number };
  uContinuity: { value: number };
  uWash: { value: number };
  uDiag: { value: number };
  uShellC: { value: THREE.Vector3 };
  uShellR: { value: number };
};

function makeStone(octaves: number, shared: Shared, masonry: number, slots: ReturnType<typeof makeSlotBlock>) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.03,
  });
  mat.fog = false;
  mat.side = masonry > 0 ? THREE.DoubleSide : THREE.FrontSide;
  if (masonry > 0) {
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = 1;
    mat.polygonOffsetUnits = 1;
  }
  mat.customProgramCacheKey = () => `cenotaph-stone-v13-${octaves}`;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uVariant = shared.uVariant;
    shader.uniforms.uDetail = shared.uDetail;
    shader.uniforms.uLift = shared.uLift;
    shader.uniforms.uContinuity = shared.uContinuity;
    shader.uniforms.uWash = shared.uWash;
    shader.uniforms.uDiag = shared.uDiag;
    shader.uniforms.uShellC = shared.uShellC;
    shader.uniforms.uShellR = shared.uShellR;
    shader.uniforms.uMasonry = { value: masonry };
    shader.uniforms.uSlotPos = { value: slots.pos };
    shader.uniforms.uSlotColor = { value: slots.color };
    shader.uniforms.uSlotAim = { value: slots.aim };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWorldN;\nvarying vec3 vWorldP;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vWorldN = normalize(mat3(modelMatrix) * normal);
vWorldP = (modelMatrix * vec4(position, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vWorldN;
varying vec3 vWorldP;
uniform float uVariant;
uniform float uDetail;
uniform float uLift;
uniform float uMasonry;
uniform float uContinuity;
uniform float uWash;
uniform float uDiag;
uniform vec3 uShellC;
uniform float uShellR;
uniform vec4 uSlotPos[8];
uniform vec4 uSlotColor[8];
uniform vec4 uSlotAim[8];
vec3 archSlot(vec4 pos, vec4 col, vec4 aim, vec3 wN) {
  float cutoff = pos.w;
  if (cutoff <= 0.0) return vec3(0.0);
  vec3 toLight = pos.xyz - vWorldP;
  float dist = length(toLight);
  vec3 ldir = toLight / max(dist, 1.0e-3);
  float atten = clamp(1.0 - dist / cutoff, 0.0, 1.0);
  atten *= atten;
  if (col.w > 0.0) {
    float ang = dot(ldir, normalize(aim.xyz));
    atten *= smoothstep(col.w, aim.w, ang);
  }
  float ndl = max(dot(wN, ldir), 0.0);
  return col.rgb * atten * ndl * RECIPROCAL_PI;
}
float cHash(vec3 p){
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float cNoise(vec3 x){
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(cHash(i), cHash(i+vec3(1.0,0.0,0.0)), f.x),
        mix(cHash(i+vec3(0.0,1.0,0.0)), cHash(i+vec3(1.0,1.0,0.0)), f.x), f.y),
    mix(mix(cHash(i+vec3(0.0,0.0,1.0)), cHash(i+vec3(1.0,0.0,1.0)), f.x),
        mix(cHash(i+vec3(0.0,1.0,1.0)), cHash(i+vec3(1.0,1.0,1.0)), f.x), f.y),
    f.z);
}
float cFbm(vec3 p){
  float a = 0.55;
  float s = 0.0;
  for (int i = 0; i < ${octaves}; i++) {
    s += a * cNoise(p);
    p = p * 2.04 + vec3(1.7, 4.1, 2.2);
    a *= 0.5;
  }
  return s;
}
vec3 cenStoneNormal(vec3 geoN) {
  vec3 radial = vWorldP - uShellC;
  float radLen = length(radial);
  vec3 radialN = radial / max(radLen, 1.0e-3);
  float onShell = (1.0 - smoothstep(0.16, 0.48, abs(radLen - uShellR))) * uContinuity;
  float agree = smoothstep(0.58, 0.82, abs(dot(geoN, radialN)));
  float side = sign(dot(geoN, radialN));
  if (side == 0.0) side = 1.0;
  vec3 base = normalize(mix(geoN, radialN * side, onShell * agree));
  // Both passages are one Z-axis tube: axis y=6.15, radius 6.77 (MAD 0.12 m).
  // Crown and springing facets are nearly axis-aligned, so a diagonal-only
  // gate left those wedges. Match the surface. Caps, treads, and the shell stay.
  vec2 arm = vec2(vWorldP.x, vWorldP.y - 6.15);
  float prad = length(arm);
  float onTube = 1.0 - smoothstep(0.28, 0.62, abs(prad - 6.77));
  float inHall = (1.0 - smoothstep(10.0, 14.0, abs(vWorldP.x)))
    * smoothstep(32.0, 40.0, abs(vWorldP.z))
    * (1.0 - smoothstep(102.0, 110.0, abs(vWorldP.z)));
  vec3 cyl = vec3(arm.x, arm.y, 0.0) / max(prad, 1.0e-3);
  float fit = smoothstep(0.5, 0.78, abs(dot(cyl, base)));
  float notCap = 1.0 - smoothstep(0.38, 0.62, abs(base.z));
  float sgn = sign(dot(base, cyl));
  if (sgn == 0.0) sgn = 1.0;
  return normalize(mix(base, cyl * sgn, onTube * inHall * fit * notCap * uContinuity * (1.0 - onShell)));
}
`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
{
  vec3 stoneN = cenStoneNormal(normalize(vWorldN));
  vec3 nBasis = mix(vWorldN, stoneN, uContinuity);
  float nFreq = mix(1.0, 0.2, uContinuity);
  float posOnly = 0.0;
  if (!(uDiag > 4.5 && uDiag < 6.5) && (uContinuity > 0.5 || uDiag > 3.5)) posOnly = 1.0;
  vec3 noiseVec = mix(nBasis * nFreq, vWorldP * 0.22, posOnly);
  float grit = cFbm(vWorldP * 0.28);
  float speckle = cFbm(noiseVec * (5.5) + vWorldP * 0.8);
  float reveal = clamp(uDetail, 0.0, 1.0);
  vec3 albedo;
  if (uVariant < 0.5) {
    vec3 stone = mix(vec3(0.70, 0.62, 0.48), vec3(0.80, 0.72, 0.56), uMasonry);
    albedo = stone * (0.88 + 0.18 * grit) * (0.93 + 0.09 * speckle);
    if (uMasonry > 0.5) {
      float course = smoothstep(0.055, 0.0, abs(fract(vWorldP.y * 0.9) - 0.5) - 0.4);
      albedo *= 1.0 - course * 0.15 * mix(1.0, 0.72, uContinuity);
    }
  } else if (uVariant < 1.5) {
    vec3 ivory = vec3(0.84, 0.80, 0.72);
    float field = cFbm(vWorldP * 0.16 + noiseVec * (1.35));
    float vein = smoothstep(0.07, 0.0, abs(field - 0.52));
    float broad = smoothstep(0.62, 0.86, cFbm(vWorldP * 0.07 + noiseVec * (0.8)));
    float fine = smoothstep(0.06, 0.0, abs(cFbm(noiseVec * (4.8) + vWorldP * 0.55) - 0.48));
    albedo = ivory * (0.93 + 0.1 * grit);
    albedo = mix(albedo, vec3(0.08, 0.24, 0.55), broad * 0.14 + vein * (0.22 + reveal * 0.5) + fine * reveal * 0.35);
  } else if (uVariant < 2.5) {
    vec3 charcoal = vec3(0.20, 0.19, 0.175);
    float seam = smoothstep(0.66, 0.9, cFbm(noiseVec * (2.4) + vWorldP * 0.1));
    albedo = charcoal * (0.55 + 0.9 * grit) * (0.78 + 0.4 * speckle);
    albedo = mix(albedo, vec3(0.34, 0.38, 0.42), seam * (0.22 + reveal * 0.28));
    if (uMasonry > 0.5) {
      float course = smoothstep(0.05, 0.0, abs(fract(vWorldP.y * 0.9) - 0.5) - 0.4);
      albedo *= 1.0 - course * 0.24 * mix(1.0, 0.72, uContinuity);
    }
  } else {
    // MISTERY STONE. Night mass, with porcelain mineral only at walking distance.
    vec3 mineral = vec3(0.132, 0.126, 0.118);
    float pore = cFbm(vWorldP * 1.7 + noiseVec * (2.2));
    albedo = mineral * (0.66 + 0.5 * grit) * (0.86 + 0.2 * speckle);
    albedo *= 0.9 + 0.12 * pore;
    float seam = smoothstep(0.76, 0.95, cFbm(noiseVec * (2.7) + vWorldP * 0.13));
    albedo = mix(albedo, vec3(0.26, 0.29, 0.33), seam * (0.04 + reveal * 0.08));
    float field = cFbm(vWorldP * 0.48 + noiseVec * (1.7));
    float vein = smoothstep(0.011, 0.0, abs(field - 0.5));
    float fine = smoothstep(0.009, 0.0, abs(cFbm(noiseVec * (8.2) + vWorldP * 1.6) - 0.5));
    float veinAmt = (vein * 0.2 + fine * 0.12) * (0.05 + reveal * 0.95);
    albedo = mix(albedo, vec3(0.70, 0.78, 0.88), veinAmt);
    float inclusion = smoothstep(0.94, 0.995, cFbm(vWorldP * 0.11 + noiseVec * (0.4)));
    albedo = mix(albedo, vec3(0.52, 0.48, 0.40), inclusion * reveal * 0.1);
    if (uMasonry > 0.5) {
      float course = smoothstep(0.038, 0.0, abs(fract(vWorldP.y * 1.25) - 0.5) - 0.44);
      albedo *= 1.0 - course * (0.2 + reveal * 0.08) * mix(1.0, 0.72, uContinuity);
    }
  }
  float haze = smoothstep(560.0, 1760.0, distance(cameraPosition, vWorldP));
  albedo = mix(albedo, vec3(0.075, 0.078, 0.086), haze * 0.32);
  diffuseColor.rgb = albedo;
  if (uDiag > 2.5 && uDiag < 3.5) diffuseColor.rgb = vec3(0.46, 0.43, 0.37);
}
`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
roughnessFactor = clamp(roughnessFactor + (cFbm(vWorldP * 0.55) - 0.5) * 0.22, 0.28, 1.0);
if (uVariant > 2.5) {
  roughnessFactor = clamp(roughnessFactor + (cNoise(vWorldP * 5.1) - 0.5) * (0.06 + uDetail * 0.16), 0.38, 1.0);
}`,
      )
      .replace(
        "#include <normal_fragment_begin>",
        `#include <normal_fragment_begin>
if (uVariant > 2.5) {
  float revealN = clamp(uDetail, 0.0, 1.0);
  float amp = 0.04 + revealN * 0.085;
  float n1 = cNoise(vWorldP * mix(1.5, 5.4, revealN)) - 0.5;
  float n2 = cNoise(vWorldP * mix(2.3, 8.2, revealN) + vec3(2.7, 1.1, 4.0)) - 0.5;
  vec3 nBase = uContinuity > 0.5 ? cenStoneNormal(normalize(vWorldN)) : vWorldN;
  vec3 nW = normalize(nBase + vec3(n1, n2 * 0.65, n1 * 0.4) * amp);
  normal = normalize(mat3(viewMatrix) * nW) * faceDirection;
}
`,
      )
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
{
  vec3 wN = normalize(uContinuity > 0.5 ? cenStoneNormal(normalize(vWorldN)) : vWorldN);
  float belly = clamp(-wN.y, 0.0, 1.0);
  float wall = (1.0 - smoothstep(-0.15, 0.75, wN.y)) * clamp(1.2 - vWorldP.y / 78.0, 0.0, 1.0);
  if (uVariant > 2.5) {
    reflectedLight.directDiffuse += vec3(1.0, 0.78, 0.52) * (belly * 0.16 + wall * 0.08) * uLift;
  } else {
    reflectedLight.directDiffuse += vec3(1.0, 0.74, 0.42) * (belly * 0.22 + wall * 0.14) * uLift;
  }
  if (uWash > 0.5) {
    float radial = length(vWorldP.xz);
    float onDrum = smoothstep(78.0, 90.0, radial) * (1.0 - smoothstep(104.0, 118.0, radial));
    float up = (1.0 - smoothstep(6.0, 46.0, vWorldP.y)) * (1.0 - smoothstep(0.05, 0.72, wN.y));
    reflectedLight.directDiffuse += vec3(1.0, 0.74, 0.46) * onDrum * up * 0.42 * diffuseColor.rgb;
  }
  reflectedLight.directDiffuse += (
  archSlot(uSlotPos[0], uSlotColor[0], uSlotAim[0], wN) +
  archSlot(uSlotPos[1], uSlotColor[1], uSlotAim[1], wN) +
  archSlot(uSlotPos[2], uSlotColor[2], uSlotAim[2], wN) +
  archSlot(uSlotPos[3], uSlotColor[3], uSlotAim[3], wN) +
  archSlot(uSlotPos[4], uSlotColor[4], uSlotAim[4], wN) +
  archSlot(uSlotPos[5], uSlotColor[5], uSlotAim[5], wN) +
  archSlot(uSlotPos[6], uSlotColor[6], uSlotAim[6], wN) +
  archSlot(uSlotPos[7], uSlotColor[7], uSlotAim[7], wN)
  ) * diffuseColor.rgb;
}
`,
      );
  };
  return mat;
}

function initialVariant(): CenotaphVariant {
  if (!import.meta.env.DEV) return "m";
  const q = new URLSearchParams(window.location.search).get("cenotaph");
  if (q === "a" || q === "b" || q === "c") return q;
  return "m";
}

export function buildCenotaph(coarse: boolean, _cenY: number, cenR: number) {
  const cen = new THREE.Group();
  const shared: Shared = {
    uVariant: { value: 0 },
    uDetail: { value: 0 },
    uLift: { value: 1 },
    uContinuity: { value: 0 },
    uWash: { value: 0 },
    uDiag: { value: 0 },
    uShellC: { value: new THREE.Vector3(0, 60.928, 0) },
    uShellR: { value: 52.148 },
  };
  const slots = makeSlotBlock();
  const sphereMat = makeStone(coarse ? 2 : 3, shared, 0, slots);
  const archMat = makeStone(coarse ? 2 : 3, shared, 1, slots);
  const figureMat = new THREE.MeshStandardMaterial({ color: 0x12110e, roughness: 0.74, metalness: 0.04 });
  figureMat.fog = false;
  const neutral = new THREE.MeshStandardMaterial({ color: 0xc8c2b6, roughness: 0.9, metalness: 0 });
  neutral.fog = false;
  neutral.side = THREE.DoubleSide;

  const diagnostic =
    import.meta.env.DEV && new URLSearchParams(window.location.search).get("cenotaph") === "diag";

  const holder = new THREE.Group();
  cen.add(holder);

  const person = (x: number, z: number) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.7, 2, 4), figureMat);
    body.position.y = 0.56;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 4), figureMat);
    head.position.y = 1.08;
    g.add(body, head);
    g.position.set(x, 0, z);
    g.userData.drop = [x, z];
    cen.add(g);
    return g;
  };
  const people = [person(7.2, 116), person(-6.4, 104)];

  const lamps = buildCenotaphLamps();
  cen.add(lamps.group);
  const archLamps: ArchLamp[] = allArchLamps();
  let lightTier: LightTier = "budget";
  let presetSpot = 2200;
  let presetColor = 0xffe6c4;
  let slotKey = "";
  let slotCount = 0;
  let visibleReal = 0;
  const lastCam = new THREE.Vector3(0, 18, 140);
  let shellSet = new Set<THREE.Object3D>();

  const presets: Record<
    CenotaphVariant,
    {
      variant: number;
      lift: number;
      roughS: number;
      roughA: number;
      env: number;
      spot: number;
      niche: number;
      door: number;
      light: number;
    }
  > = {
    a: { variant: 0, lift: 1.05, roughS: 0.92, roughA: 0.86, env: 0.22, spot: 90, niche: 4, door: 2.2, light: 0xffe7c4 },
    b: { variant: 1, lift: 0.72, roughS: 0.62, roughA: 0.56, env: 0.3, spot: 70, niche: 3, door: 1.6, light: 0xfff2dc },
    c: { variant: 2, lift: 1.45, roughS: 0.88, roughA: 0.84, env: 0.14, spot: 160, niche: 8, door: 3.5, light: 0xffd7a4 },
    m: { variant: 3, lift: 0.34, roughS: 0.92, roughA: 0.84, env: 0.05, spot: 2200, niche: 7, door: 4.2, light: 0xffe6c4 },
  };

  function apply(variant: CenotaphVariant) {
    const p = presets[variant];
    shared.uVariant.value = p.variant;
    shared.uLift.value = p.lift;
    sphereMat.roughness = p.roughS;
    archMat.roughness = p.roughA;
    sphereMat.envMapIntensity = p.env;
    archMat.envMapIntensity = p.env;
    lamps.apply(p.spot, p.light);
    presetSpot = p.spot;
    presetColor = p.light;
    if (lightTier === "budget") writeSlots(lastCam);
  }

  apply(initialVariant());

  let current: CenotaphGlb = "production";
  let token = 0;
  let seated: { center: THREE.Vector3; radius: number; outer: number } | null = null;
  let pending: Promise<{ center: THREE.Vector3; radius: number; outer: number }> | null = null;
  let pendingWhich: CenotaphGlb | null = null;

  function writeSlots(cam: THREE.Vector3) {
    const picked = selectArchSlots(archLamps, cam);
    writeArchSlots(picked, presetSpot, presetColor, slots);
    slotCount = picked.length;
    const key = picked.map((lamp) => lamp.name).join("|");
    if (key !== slotKey) slotKey = key;
  }

  function setLightTier(tier: LightTier) {
    lightTier = tier;
    applyArchTier(tier);
    shared.uWash.value = tier === "budget" || tier === "emissive" ? 1 : 0;
    if (tier === "budget") writeSlots(lastCam);
    else {
      clearArchSlots(slots);
      slotCount = 0;
      slotKey = "";
    }
    paintStone();
  }

  function paintStone() {
    holder.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      let arch = false;
      for (let node: THREE.Object3D | null = mesh; node; node = node.parent) if (node.userData.architecture) arch = true;
      if (!arch) return;
      mesh.material = lightTier === "neutral" || diagnostic ? neutral : shellSet.has(mesh) ? sphereMat : archMat;
    });
  }

  function setDiag(mode: number) {
    shared.uDiag.value = mode;
  }

  function syncLights(cam: THREE.Vector3) {
    lastCam.copy(cam);
    if (lightTier !== "budget") return;
    const before = slotKey;
    writeSlots(cam);
    if (before !== slotKey) noteLightBudget(lightTier, visibleReal, slotCount);
  }

  function setGlb(which: CenotaphGlb) {
    if (which !== "production" && which !== "full") {
      return Promise.resolve(
        seated ?? { center: new THREE.Vector3(0, holder.position.y, 0), radius: cenR, outer: cenR },
      );
    }
    if (pending && pendingWhich === which) return pending;
    if (!pending && which === current && seated) return Promise.resolve(seated);
    pendingWhich = which;
    const job = mountGlb(which).finally(() => {
      if (pending === job) {
        pending = null;
        pendingWhich = null;
      }
    });
    pending = job;
    return job;
  }

  const ready = setGlb("production").catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    patchDiagnostics({ initError: message });
    return seated ?? { center: new THREE.Vector3(0, holder.position.y, 0), radius: cenR, outer: cenR };
  });

  function fallbackSeat() {
    return seated ?? { center: new THREE.Vector3(0, holder.position.y, 0), radius: cenR, outer: cenR };
  }

  async function mountGlb(which: CenotaphGlb) {
    const mine = ++token;
    const prior = which === "full" ? getDiagnostics().full : getDiagnostics().production;
    patchDiagnostics(
      which === "full"
        ? { full: "loading", fullError: null }
        : { production: "loading", productionError: null },
    );
    const abandon = () => {
      const now = which === "full" ? getDiagnostics().full : getDiagnostics().production;
      if (now === "loading") {
        const restored = prior === "loading" ? "idle" : prior;
        patchDiagnostics(which === "full" ? { full: restored } : { production: restored });
      }
      return fallbackSeat();
    };
    try {
      const response = await fetch(GLB_URL[which]);
      if (mine !== token) return abandon();
      if (!response.ok) throw new Error(`GLB request failed (${response.status})`);
      const bytes = await response.arrayBuffer();
      if (mine !== token) return abandon();
      const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
      const gltf = await new GLTFLoader().parseAsync(bytes, "");
      if (mine !== token) return abandon();
      const root = gltf.scene;
      root.userData.architecture = true;
      root.position.set(0, 0, 0);
      root.rotation.set(0, 0, 0);
      root.scale.set(1, 1, 1);
      root.updateMatrixWorld(true);
      const seat = seatMonument(root);
      for (const child of [...holder.children]) {
        if (child.userData.architecture) holder.remove(child);
      }
      applySeat(root, seat, which);
      current = which;
      seated = measure(seat);
      return seated;
    } catch (err) {
      if (mine !== token) return abandon();
      const message = err instanceof Error ? err.message : String(err);
      patchDiagnostics(
        which === "full"
          ? { full: "failed", fullError: message }
          : { production: "failed", productionError: message },
      );
      throw err;
    }
  }

  function applySeat(root: THREE.Object3D, seat: MonumentSeat, which: CenotaphGlb) {
    holder.add(root);
    root.position.copy(seat.rootPosition);
    holder.position.y = seat.holderY;
    holder.scale.setScalar(1);
    holder.rotation.y = 0;
    holder.updateMatrixWorld(true);
    shared.uShellC.value.set(0, holder.position.y, 0);
    shared.uShellR.value = seat.fit && seat.fit.r > 1 ? seat.fit.r : 0;
    shared.uContinuity.value = which === "full" && shared.uShellR.value > 1 ? 1 : 0;
    const side = which === "full" ? THREE.FrontSide : THREE.DoubleSide;
    archMat.side = side;
    neutral.side = side;
    const shell = new Set<THREE.Object3D>(seat.shellMeshes);
    shellSet = shell;
    const sources: { geometry: THREE.BufferGeometry; matrixWorld: THREE.Matrix4 }[] = [];
    let triangles = 0;
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const geo = mesh.geometry;
      triangles += geo.index ? geo.index.count / 3 : geo.getAttribute("position").count / 3;
      if (which === "full") sources.push({ geometry: geo, matrixWorld: mesh.matrixWorld });
      else if (!geo.getAttribute("normal")) geo.computeVertexNormals();
      mesh.material = lightTier === "neutral" || diagnostic ? neutral : shell.has(mesh) ? sphereMat : archMat;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });
    patchDiagnostics(
      which === "full"
        ? { full: "loaded", fullError: null, fullTriangles: triangles }
        : { production: "loaded", productionError: null, productionTriangles: triangles },
    );
    // Cross-primitive weld in seated meters. Production does not enter.
    smoothFullResolutionNormals(sources, which);
    const ray = new THREE.Raycaster();
    const down = new THREE.Vector3(0, -1, 0);
    for (const figure of people) {
      const drop = figure.userData.drop as [number, number] | undefined;
      if (!drop) continue;
      ray.set(new THREE.Vector3(drop[0], 240, drop[1]), down);
      const hit = ray.intersectObject(holder, true).find((h) => h.point.y >= 0 && h.point.y < 48);
      if (hit) figure.position.set(hit.point.x, hit.point.y, hit.point.z);
    }
    setMonumentCap(which === "full" ? surveyCap(root) : null);
  }

  function measure(seat: MonumentSeat) {
    const box = new THREE.Box3().setFromObject(holder);
    const outer = Math.max(
      Math.hypot(box.min.x, box.min.z),
      Math.hypot(box.max.x, box.min.z),
      Math.hypot(box.min.x, box.max.z),
      Math.hypot(box.max.x, box.max.z),
    );
    const radius = seat.fit && seat.fit.r > 1 ? seat.fit.r : cenR;
    return { center: new THREE.Vector3(0, holder.position.y, 0), radius, outer };
  }

  return {
    group: cen,
    uniforms: shared,
    apply,
    ready,
    masonry: archMat,
    setGlb,
    setLightTier,
    setDiag,
    syncLights,
    archSlotCount: () => slotCount,
    lightTier: () => lightTier,
    noteRealLights: (count: number) => {
      visibleReal = count;
      noteLightBudget(lightTier, count, lightTier === "budget" ? slotCount : 0);
    },
    get glb() {
      return current;
    },
  };
}
