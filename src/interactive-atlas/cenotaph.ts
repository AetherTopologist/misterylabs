import * as THREE from "three";

export type CenotaphVariant = "a" | "b" | "c";

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
  mat.customProgramCacheKey = () => `cenotaph-stone-v2-${octaves}`;
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
  } else {
    vec3 charcoal = vec3(0.20, 0.19, 0.175);
    float seam = smoothstep(0.66, 0.9, cFbm(vWorldN * 2.4 + vWorldP * 0.1));
    albedo = charcoal * (0.55 + 0.9 * grit) * (0.78 + 0.4 * speckle);
    albedo = mix(albedo, vec3(0.34, 0.38, 0.42), seam * (0.22 + reveal * 0.28));
    if (uMasonry > 0.5) {
      float course = smoothstep(0.05, 0.0, abs(fract(vWorldP.y * 0.9) - 0.5) - 0.4);
      albedo *= 1.0 - course * 0.24;
    }
  }
  float haze = smoothstep(52.0, 145.0, distance(cameraPosition, vWorldP));
  albedo = mix(albedo, vec3(0.04, 0.042, 0.05), haze * 0.58);
  diffuseColor.rgb = albedo;
}
`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
roughnessFactor = clamp(roughnessFactor + (cFbm(vWorldP * 0.55) - 0.5) * 0.22, 0.28, 1.0);`,
      )
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
{
  vec3 wN = normalize(vWorldN);
  float belly = clamp(-wN.y, 0.0, 1.0);
  float wall = (1.0 - smoothstep(-0.15, 0.75, wN.y)) * clamp(1.2 - vWorldP.y / 24.0, 0.0, 1.0);
  reflectedLight.directDiffuse += vec3(1.0, 0.74, 0.42) * (belly * 0.22 + wall * 0.14) * uLift;
}
`,
      );
  };
  return mat;
}

function initialVariant(): CenotaphVariant {
  if (!import.meta.env.DEV) return "b";
  const q = new URLSearchParams(window.location.search).get("cenotaph");
  if (q === "a" || q === "c") return q;
  return "b";
}

export function buildCenotaph(coarse: boolean, cenY: number, cenR: number) {
  const cen = new THREE.Group();
  const seg = coarse ? 36 : 64;
  const shared: Shared = {
    uVariant: { value: 0 },
    uDetail: { value: 0 },
    uLift: { value: 1 },
  };
  const sphereMat = makeStone(coarse ? 2 : 3, shared, 0);
  const archMat = makeStone(coarse ? 2 : 3, shared, 1);
  const jointMat = new THREE.MeshStandardMaterial({ color: 0x3a332c, roughness: 1, metalness: 0 });
  jointMat.fog = false;
  const voidMat = new THREE.MeshStandardMaterial({ color: 0x07080b, roughness: 1, metalness: 0 });
  voidMat.fog = false;
  const cypressMat = new THREE.MeshStandardMaterial({ color: 0x1a2216, roughness: 0.88, metalness: 0.02 });
  cypressMat.fog = false;
  const figureMat = new THREE.MeshStandardMaterial({ color: 0x12110e, roughness: 0.74, metalness: 0.04 });
  figureMat.fog = false;
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0x2c261e,
    emissive: 0xffe6c0,
    emissiveIntensity: 0.28,
    roughness: 0.42,
  });
  lampMat.fog = false;
  const gold = new THREE.MeshStandardMaterial({ color: 0xb89a6a, metalness: 0.84, roughness: 0.38 });
  gold.fog = false;
  gold.envMapIntensity = 0.55;

  const sr = cenR;
  const eq = cenY;
  // Proportions measured from the Javier Martin Macias cenotaph DAE.
  // Sphere radius = 1. Equator is 0.94 above the ground. Lengths are in sphere radii.
  const drumR = sr * 1.18;
  const midR = sr * 1.6;
  const outerR = sr * 2.07;
  const drumTop = sr * 0.9;
  const midTop = sr * 0.62;

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(sr, coarse ? 40 : 64, coarse ? 28 : 48),
    sphereMat,
  );
  sphere.position.y = eq;
  cen.add(sphere);

  const tiers: Array<[number, number, number]> = [
    [outerR, 0, sr * 0.055],
    [sr * 1.96, sr * 0.055, sr * 0.11],
    [sr * 1.86, sr * 0.11, sr * 0.16],
    [midR, sr * 0.16, midTop],
    [drumR, midTop, drumTop],
  ];
  // Rear circulation only. Two narrow slots in the lower middle ring,
  // 140°–162° and 198°–220° from the front. The pier between them stays.
  // Upper ring and every outer ring stay closed.
  const slotA0 = (140 * Math.PI) / 180;
  const slotA1 = (162 * Math.PI) / 180;
  const slotB0 = (198 * Math.PI) / 180;
  const slotB1 = (220 * Math.PI) / 180;
  const lip0 = (150 * Math.PI) / 180;
  const lip1 = (210 * Math.PI) / 180;
  const addRing = (radius: number, y0: number, y1: number, thetaStart: number, thetaLength: number) => {
    const h = y1 - y0;
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius + 0.08, h, seg, 1, false, thetaStart, thetaLength),
      archMat,
    );
    ring.position.y = (y0 + y1) / 2;
    cen.add(ring);
  };
  for (const [radius, y0, y1] of tiers) {
    if (radius !== midR) {
      addRing(radius, y0, y1, 0, Math.PI * 2);
      continue;
    }
    const split = sr * 0.4;
    addRing(radius, split, y1, 0, Math.PI * 2);
    addRing(radius, y0, split, slotB1, Math.PI * 2 - (slotB1 - slotA0));
    addRing(radius, y0, split, slotA1, slotB0 - slotA1);
  }

  const cornice = new THREE.Mesh(
    new THREE.CylinderGeometry(sr * 1.64, midR, sr * 0.045, seg, 1, false, lip1, Math.PI * 2 - (lip1 - lip0)),
    archMat,
  );
  cornice.position.y = midTop - sr * 0.02;
  cen.add(cornice);

  // Treads measured from the DAE: radius 1.545, rising only to 0.42.
  // They fill the slots instead of sitting on the rings.
  const addFlight = (deg0: number, deg1: number, h0: number, h1: number, steps: number) => {
    const rad = sr * 1.56;
    const width = sr * 0.16;
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps;
      const t1 = (i + 1) / steps;
      const a = ((deg0 + (deg1 - deg0) * (t0 + t1) * 0.5) * Math.PI) / 180;
      const yBot = sr * (h0 + (h1 - h0) * t0);
      const yTop = sr * (h0 + (h1 - h0) * t1);
      const aA = ((deg0 + (deg1 - deg0) * t0) * Math.PI) / 180;
      const aB = ((deg0 + (deg1 - deg0) * t1) * Math.PI) / 180;
      const chord =
        Math.hypot(Math.sin(aB) * rad - Math.sin(aA) * rad, Math.cos(aB) * rad - Math.cos(aA) * rad) + 0.1;
      const box = new THREE.Mesh(new THREE.BoxGeometry(chord, Math.max(0.2, yTop - yBot + 0.04), width), archMat);
      box.position.set(Math.sin(a) * rad, (yBot + yTop) * 0.5, Math.cos(a) * rad);
      box.rotation.y = a;
      cen.add(box);
    }
  };
  addFlight(141, 161, 0.4, 0.16, coarse ? 5 : 7);
  addFlight(199, 219, 0.16, 0.4, coarse ? 5 : 7);

  const collar = new THREE.Mesh(new THREE.RingGeometry(sr * 0.96, drumR + 0.35, coarse ? 48 : 80), archMat);
  collar.rotation.x = -Math.PI / 2;
  collar.position.y = drumTop + 0.04;
  cen.add(collar);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(drumR + 0.06, 0.07, 6, seg), jointMat);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = drumTop;
  cen.add(lip);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.78, 0.24), voidMat);
  door.position.set(0, midTop + 0.62, drumR + 0.22);
  cen.add(door);
  const doorArch = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.024, 6, 14, Math.PI), archMat);
  doorArch.position.set(0, door.position.y + 0.38, drumR + 0.38);
  cen.add(doorArch);
  const fittings: THREE.Mesh[] = [doorArch];

  const dummy = new THREE.Object3D();
  const plant = (count: number, radius: number, y: number, height: number) => {
    const mesh = new THREE.InstancedMesh(new THREE.ConeGeometry(Math.min(0.34, height * 0.16), height, 6), cypressMat, count);
    mesh.frustumCulled = false;
    let n = 0;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const inSlot =
        ((a > slotA0 && a < slotA1) || (a > slotB0 && a < slotB1)) && radius > drumR && radius < midR + 1;
      if (inSlot) continue;
      dummy.position.set(Math.sin(a) * radius, y + height * 0.5, Math.cos(a) * radius);
      dummy.rotation.set(0, -a, 0);
      dummy.scale.set(1, 0.86 + ((i * 13) % 5) * 0.05, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(n++, dummy.matrix);
    }
    mesh.count = Math.max(1, n);
    mesh.instanceMatrix.needsUpdate = true;
    cen.add(mesh);
  };
  plant(coarse ? 180 : 380, sr * 1.06, drumTop, sr * 0.13);
  plant(coarse ? 150 : 320, sr * 1.14, drumTop, sr * 0.1);
  plant(coarse ? 160 : 340, midR + 0.15, midTop, sr * 0.11);
  plant(coarse ? 140 : 300, sr * 1.9, sr * 0.11, sr * 0.09);
  plant(coarse ? 120 : 260, outerR - 0.2, sr * 0.055, sr * 0.08);

  const person = (x: number, y: number, z: number) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.36, 2, 4), figureMat);
    body.position.y = 0.3;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), figureMat);
    head.position.y = 0.58;
    g.add(body, head);
    g.position.set(x, y, z);
    cen.add(g);
  };
  person(-8.5, sr * 0.16, 26);
  person(Math.sin(3.55) * sr * 1.5, sr * 0.3, Math.cos(3.55) * sr * 1.5);

  const spots: THREE.SpotLight[] = [];
  const rig: Array<[number, number, number, number, number, number, number]> = [
    [0, 1.4, 42, 0, eq * 0.9, 8, 1.25],
    [-30, 2.6, 26, -6, eq * 0.85, 4, 0.9],
    [28, 2.5, 22, 5, eq * 0.85, 3, 0.9],
    [0, 2.6, -40, 0, eq * 0.8, -6, 0.7],
  ];
  for (const [x, y, z, tx, ty, tz, bias] of rig) {
    const spot = new THREE.SpotLight(0xfff1d4, 40, 90, 0.78, 0.5, 2);
    spot.position.set(x, y, z);
    spot.target.position.set(tx, ty, tz);
    spot.userData.bias = bias;
    cen.add(spot, spot.target);
    spots.push(spot);
    const fixture = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), lampMat);
    fixture.position.set(x, y, z);
    cen.add(fixture);
  }
  const niche = new THREE.PointLight(0xfff3dc, 8, 14, 2);
  niche.position.set(0, door.position.y + 0.8, drumR + 1.2);
  cen.add(niche);
  const doorLamp = new THREE.PointLight(0xfff6e8, 4, 8, 2);
  doorLamp.position.set(0, door.position.y + 0.2, drumR + 0.9);
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
      cypress: number;
      joint: number;
      lamp: number;
    }
  > = {
    a: {
      variant: 0,
      lift: 1.05,
      roughS: 0.92,
      roughA: 0.86,
      env: 0.22,
      spot: 90,
      niche: 4,
      door: 2.2,
      light: 0xffe7c4,
      cypress: 0x1a2216,
      joint: 0x4a4036,
      lamp: 0.22,
    },
    b: {
      variant: 1,
      lift: 0.72,
      roughS: 0.62,
      roughA: 0.56,
      env: 0.3,
      spot: 70,
      niche: 3,
      door: 1.6,
      light: 0xfff2dc,
      cypress: 0x1c2820,
      joint: 0x6d6258,
      lamp: 0.18,
    },
    c: {
      variant: 2,
      lift: 1.45,
      roughS: 0.88,
      roughA: 0.84,
      env: 0.14,
      spot: 160,
      niche: 8,
      door: 3.5,
      light: 0xffd7a4,
      cypress: 0x101410,
      joint: 0x161412,
      lamp: 0.28,
    },
  };

  function apply(variant: CenotaphVariant) {
    const p = presets[variant];
    shared.uVariant.value = p.variant;
    shared.uLift.value = p.lift;
    sphereMat.roughness = p.roughS;
    archMat.roughness = p.roughA;
    sphereMat.envMapIntensity = p.env;
    archMat.envMapIntensity = p.env;
    jointMat.color.setHex(p.joint);
    cypressMat.color.setHex(p.cypress);
    lampMat.emissiveIntensity = p.lamp;
    for (const spot of spots) {
      spot.color.setHex(p.light);
      spot.intensity = p.spot * (spot.userData.bias as number);
    }
    niche.color.setHex(p.light);
    niche.intensity = p.niche;
    doorLamp.color.setHex(p.light);
    doorLamp.intensity = p.door;
    const fit = variant === "b" ? gold : archMat;
    for (const mesh of fittings) mesh.material = fit;
  }

  apply(initialVariant());

  return { group: cen, uniforms: shared, apply };
}
