import * as THREE from "three";

export type CenotaphVariant = "a" | "b" | "c" | "m";

type Shared = {
  uVariant: { value: number };
  uDetail: { value: number };
  uLift: { value: number };
};

function makeStone(octaves: number, shared: Shared, masonry: number) {
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
  mat.customProgramCacheKey = () => `cenotaph-stone-v6-${octaves}`;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uVariant = shared.uVariant;
    shader.uniforms.uDetail = shared.uDetail;
    shader.uniforms.uLift = shared.uLift;
    shader.uniforms.uMasonry = { value: masonry };
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
`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
{
  float grit = cFbm(vWorldP * 0.28);
  float speckle = cFbm(vWorldN * 5.5 + vWorldP * 0.8);
  float reveal = clamp(uDetail, 0.0, 1.0);
  vec3 albedo;
  if (uVariant < 0.5) {
    vec3 stone = mix(vec3(0.70, 0.62, 0.48), vec3(0.80, 0.72, 0.56), uMasonry);
    albedo = stone * (0.88 + 0.18 * grit) * (0.93 + 0.09 * speckle);
    if (uMasonry > 0.5) {
      float course = smoothstep(0.055, 0.0, abs(fract(vWorldP.y * 0.9) - 0.5) - 0.4);
      albedo *= 1.0 - course * 0.15;
    }
  } else if (uVariant < 1.5) {
    vec3 ivory = vec3(0.84, 0.80, 0.72);
    float field = cFbm(vWorldP * 0.16 + vWorldN * 1.35);
    float vein = smoothstep(0.07, 0.0, abs(field - 0.52));
    float broad = smoothstep(0.62, 0.86, cFbm(vWorldP * 0.07 + vWorldN * 0.8));
    float fine = smoothstep(0.06, 0.0, abs(cFbm(vWorldN * 4.8 + vWorldP * 0.55) - 0.48));
    albedo = ivory * (0.93 + 0.1 * grit);
    albedo = mix(albedo, vec3(0.08, 0.24, 0.55), broad * 0.14 + vein * (0.22 + reveal * 0.5) + fine * reveal * 0.35);
  } else if (uVariant < 2.5) {
    vec3 charcoal = vec3(0.20, 0.19, 0.175);
    float seam = smoothstep(0.66, 0.9, cFbm(vWorldN * 2.4 + vWorldP * 0.1));
    albedo = charcoal * (0.55 + 0.9 * grit) * (0.78 + 0.4 * speckle);
    albedo = mix(albedo, vec3(0.34, 0.38, 0.42), seam * (0.22 + reveal * 0.28));
    if (uMasonry > 0.5) {
      float course = smoothstep(0.05, 0.0, abs(fract(vWorldP.y * 0.9) - 0.5) - 0.4);
      albedo *= 1.0 - course * 0.24;
    }
  } else {
    // MISTERY STONE. Night mass, with porcelain mineral only at walking distance.
    vec3 mineral = vec3(0.132, 0.126, 0.118);
    float pore = cFbm(vWorldP * 1.7 + vWorldN * 2.2);
    albedo = mineral * (0.66 + 0.5 * grit) * (0.86 + 0.2 * speckle);
    albedo *= 0.9 + 0.12 * pore;
    float seam = smoothstep(0.76, 0.95, cFbm(vWorldN * 2.7 + vWorldP * 0.13));
    albedo = mix(albedo, vec3(0.26, 0.29, 0.33), seam * (0.04 + reveal * 0.08));
    float field = cFbm(vWorldP * 0.48 + vWorldN * 1.7);
    float vein = smoothstep(0.011, 0.0, abs(field - 0.5));
    float fine = smoothstep(0.009, 0.0, abs(cFbm(vWorldN * 8.2 + vWorldP * 1.6) - 0.5));
    float veinAmt = (vein * 0.2 + fine * 0.12) * (0.05 + reveal * 0.95);
    albedo = mix(albedo, vec3(0.70, 0.78, 0.88), veinAmt);
    float inclusion = smoothstep(0.94, 0.995, cFbm(vWorldP * 0.11 + vWorldN * 0.4));
    albedo = mix(albedo, vec3(0.52, 0.48, 0.40), inclusion * reveal * 0.1);
    if (uMasonry > 0.5) {
      float course = smoothstep(0.038, 0.0, abs(fract(vWorldP.y * 1.25) - 0.5) - 0.44);
      albedo *= 1.0 - course * (0.2 + reveal * 0.08);
    }
  }
  float haze = smoothstep(560.0, 1760.0, distance(cameraPosition, vWorldP));
  albedo = mix(albedo, vec3(0.075, 0.078, 0.086), haze * 0.32);
  diffuseColor.rgb = albedo;
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
  vec3 nW = normalize(vWorldN + vec3(n1, n2 * 0.65, n1 * 0.4) * amp);
  normal = normalize(mat3(viewMatrix) * nW) * faceDirection;
}
`,
      )
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
{
  vec3 wN = normalize(vWorldN);
  float belly = clamp(-wN.y, 0.0, 1.0);
  float wall = (1.0 - smoothstep(-0.15, 0.75, wN.y)) * clamp(1.2 - vWorldP.y / 78.0, 0.0, 1.0);
  if (uVariant > 2.5) {
    reflectedLight.directDiffuse += vec3(1.0, 0.78, 0.52) * (belly * 0.16 + wall * 0.08) * uLift;
  } else {
    reflectedLight.directDiffuse += vec3(1.0, 0.74, 0.42) * (belly * 0.22 + wall * 0.14) * uLift;
  }
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

export function buildCenotaph(coarse: boolean, cenY: number, cenR: number) {
  const cen = new THREE.Group();
  const shared: Shared = {
    uVariant: { value: 0 },
    uDetail: { value: 0 },
    uLift: { value: 1 },
  };
  const sphereMat = makeStone(coarse ? 2 : 3, shared, 0);
  const archMat = makeStone(coarse ? 2 : 3, shared, 1);
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

  const spots: THREE.SpotLight[] = [];
  // Ivory-gold grazers. Six sit on the lower terrace and rake upward.
  // Two sit nearer the sphere and catch only its lower third. No fixtures.
  const rig: Array<[number, number, number, number, number, number, number, number, number]> = [
    [0, 3.4, 140, 0, 30, 92, 1.05, 92, 0.58],
    [108, 3.1, 92, 64, 26, 48, 0.78, 84, 0.5],
    [134, 2.8, -16, 80, 24, -6, 0.7, 80, 0.48],
    [-12, 3.2, -140, -4, 28, -84, 0.76, 88, 0.52],
    [-132, 2.8, -12, -78, 24, -4, 0.7, 80, 0.48],
    [-104, 3.1, 98, -60, 26, 52, 0.8, 84, 0.5],
    [22, 14, 74, 6, 46, 24, 0.62, 64, 0.4],
    [-18, 14, -72, -4, 46, -22, 0.48, 60, 0.38],
  ];
  for (const [x, y, z, tx, ty, tz, bias, dist, angle] of rig) {
    const spot = new THREE.SpotLight(0xffe6c4, 40, dist, angle, 0.78, 2);
    spot.position.set(x, y, z);
    spot.target.position.set(tx, ty, tz);
    spot.userData.bias = bias;
    cen.add(spot, spot.target);
    spots.push(spot);
  }
  const niche = new THREE.PointLight(0xfff3dc, 8, 34, 2);
  niche.position.set(0, 16, 112);
  cen.add(niche);
  const doorLamp = new THREE.PointLight(0xfff6e8, 4, 26, 2);
  doorLamp.position.set(0, 7.5, 130);
  cen.add(doorLamp);

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
    for (const spot of spots) {
      spot.color.setHex(p.light);
      spot.intensity = p.spot * (spot.userData.bias as number);
    }
    niche.color.setHex(p.light);
    niche.intensity = p.niche;
    doorLamp.color.setHex(p.light);
    doorLamp.intensity = p.door;
  }

  apply(initialVariant());

  const ready = loadArchitecture({
    holder,
    cenR,
    cenY,
    diagnostic,
    neutral,
    sphereMat,
    archMat,
    people,
  });

  return { group: cen, uniforms: shared, apply, ready };
}

type LoadOpts = {
  holder: THREE.Group;
  cenR: number;
  cenY: number;
  diagnostic: boolean;
  neutral: THREE.Material;
  sphereMat: THREE.Material;
  archMat: THREE.Material;
  people: THREE.Object3D[];
};

function solveSphere(pts: Array<[number, number, number]>) {
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

async function loadArchitecture(opts: LoadOpts) {
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const gltf = await new GLTFLoader().loadAsync(new URL("./cenotaph.glb", import.meta.url).href);
  const root = gltf.scene;
  opts.holder.add(root);
  root.updateMatrixWorld(true);

  const sphereNode = root.getObjectByName("Unir");
  const sample: Array<[number, number, number]> = [];
  const v = new THREE.Vector3();
  const take = (obj: THREE.Object3D) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const pos = mesh.geometry.getAttribute("position");
    if (!pos) return;
    const step = Math.max(1, Math.floor(pos.count / 900));
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos as THREE.BufferAttribute, i).applyMatrix4(mesh.matrixWorld);
      sample.push([v.x, v.y, v.z]);
    }
  };
  if (sphereNode) sphereNode.traverse(take);
  const fit = sample.length > 20 ? solveSphere(sample) : null;
  const sketch = root.getObjectByName("SketchUp") ?? root;
  const bounds = new THREE.Box3().setFromObject(sketch);
  if (fit && fit.r > 1) {
    const minLocal = bounds.min.y - fit.cy;
    root.position.set(-fit.cx, -fit.cy, -fit.cz);
    opts.holder.position.y = -minLocal;
  } else {
    opts.holder.position.y = opts.cenY;
  }
  // Loaded size. The file is not scaled down to the old cenotaph radius.
  opts.holder.scale.setScalar(1);
  opts.holder.rotation.y = 0;
  opts.holder.updateMatrixWorld(true);

  const sphereMeshes = new Set<THREE.Object3D>();
  sphereNode?.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) sphereMeshes.add(obj);
  });
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (!mesh.geometry.getAttribute("normal")) mesh.geometry.computeVertexNormals();
    mesh.material = opts.diagnostic ? opts.neutral : sphereMeshes.has(mesh) ? opts.sphereMat : opts.archMat;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  });

  const ray = new THREE.Raycaster();
  const down = new THREE.Vector3(0, -1, 0);
  for (const figure of opts.people) {
    const drop = figure.userData.drop as [number, number] | undefined;
    if (!drop) continue;
    ray.set(new THREE.Vector3(drop[0], 240, drop[1]), down);
    const hit = ray.intersectObject(opts.holder, true).find((h) => h.point.y >= 0 && h.point.y < 48);
    if (hit) figure.position.set(hit.point.x, hit.point.y, hit.point.z);
  }

  const seated = new THREE.Box3().setFromObject(opts.holder);
  const outer = Math.max(
    Math.hypot(seated.min.x, seated.min.z),
    Math.hypot(seated.max.x, seated.min.z),
    Math.hypot(seated.min.x, seated.max.z),
    Math.hypot(seated.max.x, seated.max.z),
  );
  const radius = fit && fit.r > 1 ? fit.r : opts.cenR;
  return { center: new THREE.Vector3(0, opts.holder.position.y, 0), radius, outer };
}
