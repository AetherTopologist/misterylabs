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
  const collarY = eq - 0.72;
  const drumBase = eq * 0.5;
  const drumR = sr + 1.45;
  const stairGap = 0.74;

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(sr, coarse ? 40 : 64, coarse ? 28 : 48),
    sphereMat,
  );
  sphere.position.y = eq;
  cen.add(sphere);

  const terraces: Array<[number, number, number]> = [
    [26.6, 0, 1.25],
    [22.6, 1.48, 4.15],
    [19.5, 4.38, drumBase],
  ];
  for (const [radius, y0, y1] of terraces) {
    const h = y1 - y0;
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.012, h, seg, 1, false, stairGap / 2, Math.PI * 2 - stairGap),
      archMat,
    );
    ring.position.y = (y0 + y1) / 2;
    cen.add(ring);
  }

  const collar = new THREE.Mesh(new THREE.RingGeometry(sr - 0.9, drumR + 0.48, coarse ? 56 : 96), archMat);
  collar.rotation.x = -Math.PI / 2;
  collar.position.y = collarY + 0.06;
  cen.add(collar);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(drumR + 0.08, 0.09, 6, seg), jointMat);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = collarY - 0.04;
  cen.add(lip);

  const doorSill = drumBase + 2.55;
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(drumR, drumR + 0.28, collarY - drumBase, seg, 1, true),
    archMat,
  );
  wall.position.y = (collarY + drumBase) / 2;
  cen.add(wall);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.8, 0.26), voidMat);
  door.position.set(0, doorSill + 0.42, drumR + 0.34);
  cen.add(door);
  const doorArch = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.026, 6, 14, Math.PI), archMat);
  doorArch.position.set(0, doorSill + 0.8, drumR + 0.42);
  cen.add(doorArch);
  const fittings: THREE.Mesh[] = [doorArch];

  const landing = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.32, 3.1), archMat);
  landing.position.set(0, doorSill - 0.08, drumR + 1.85);
  cen.add(landing);

  const steps = coarse ? 24 : 42;
  const z0 = 33.2;
  const z1 = drumR + 3.15;
  const y0s = 0.16;
  const y1s = doorSill;
  const rise = (y1s - y0s) / (steps - 1);
  const run = (z0 - z1) / (steps - 1);
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const z = z0 + (z1 - z0) * t;
    const y = y0s + (y1s - y0s) * t;
    const w = 17.6 + (8.8 - 17.6) * t;
    const step = new THREE.Mesh(new THREE.BoxGeometry(w, rise + 0.03, run + 0.08), archMat);
    step.position.set(0, y - rise * 0.5, z);
    cen.add(step);
    if (i % 7 === 0) {
      for (const side of [-1, 1]) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 5), lampMat);
        lamp.position.set(side * (w * 0.5 + 0.08), y + 0.1, z);
        cen.add(lamp);
      }
    }
  }

  const addRamp = (side: number) => {
    const n = coarse ? 20 : 42;
    const positions: number[] = [];
    const indices: number[] = [];
    const stride = 7;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = side * (1.24 * (1 - t) + 0.27 * t);
      const bow = Math.sin(Math.PI * t) * 0.85;
      const rad = 24.8 * (1 - t) + (drumR + 2.1) * t + bow;
      const walk = 2.15 * (1 - t) + (doorSill + 0.06) * t;
      const base = Math.max(0.06, walk - 3.5);
      const sn = Math.sin(a);
      const cs = Math.cos(a);
      const put = (rr: number, yy: number) => positions.push(sn * rr, yy, cs * rr);
      const inner = Math.max(drumR + 0.4, rad - 1.7);
      const outer = rad + 1.7;
      put(inner, base);
      put(inner, walk);
      put(outer, walk);
      put(outer, base);
      put(outer + 0.18, walk + 0.52);
      put(outer, walk + 0.52);
      put(outer + 0.18, walk);
    }
    const quad = (a: number, b: number, c: number, d: number) => indices.push(a, b, c, a, c, d);
    for (let i = 0; i < n; i++) {
      const o = i * stride;
      const q = (u: number, v: number) => quad(o + u, o + v, o + stride + v, o + stride + u);
      q(0, 1);
      q(1, 2);
      q(2, 3);
      q(3, 0);
      q(2, 5);
      q(5, 4);
      q(4, 6);
      q(6, 2);
    }
    const cap = (i: number, flip: boolean) => {
      const o = i * stride;
      const q = (a: number, b: number, c: number, d: number) => {
        if (flip) indices.push(o + a, o + c, o + b, o + a, o + d, o + c);
        else indices.push(o + a, o + b, o + c, o + a, o + c, o + d);
      };
      q(0, 1, 2, 3);
      q(2, 5, 4, 6);
    };
    cap(0, false);
    cap(n, true);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    cen.add(new THREE.Mesh(geo, archMat));
  };
  addRamp(1);
  addRamp(-1);

  const dummy = new THREE.Object3D();
  const plant = (count: number, radius: number, y: number, height: number, avoid: boolean) => {
    const mesh = new THREE.InstancedMesh(new THREE.ConeGeometry(Math.min(0.46, height * 0.28), height, 6), cypressMat, count);
    mesh.frustumCulled = false;
    let n = 0;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      let d = Math.abs(a - Math.PI / 2);
      if (d > Math.PI) d = Math.PI * 2 - d;
      if (avoid && d < stairGap * 0.58) continue;
      if (avoid && radius > drumR - 0.4 && radius < 27.2 && d > 0.1 && d < 1.55) continue;
      dummy.position.set(Math.cos(a) * radius, y + height * 0.5, Math.sin(a) * radius);
      dummy.rotation.set(0, a, 0);
      dummy.scale.set(1, 0.92 + ((i * 17) % 5) * 0.035, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(n++, dummy.matrix);
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    cen.add(mesh);
  };
  plant(coarse ? 200 : 420, sr + 0.22, collarY + 0.01, 1.42, false);
  plant(coarse ? 160 : 340, sr + 0.62, collarY + 0.01, 1.12, false);
  plant(coarse ? 120 : 260, drumR + 0.22, drumBase + 0.02, 1.05, true);
  plant(coarse ? 110 : 240, 21.2, 4.2, 1.08, true);
  plant(coarse ? 100 : 220, 25.15, 1.28, 1.02, true);

  const person = (x: number, t: number) => {
    const z = z0 + (z1 - z0) * t;
    const y = y0s + (y1s - y0s) * t;
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.36, 2, 4), figureMat);
    body.position.y = 0.3;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), figureMat);
    head.position.y = 0.58;
    g.add(body, head);
    g.position.set(x, y + 0.02, z);
    cen.add(g);
  };
  person(-1.4, 0.16);
  person(0.85, 0.34);
  person(-2.6, 0.5);
  person(1.7, 0.68);
  person(-0.3, 0.86);

  const spots: THREE.SpotLight[] = [];
  const rig: Array<[number, number, number, number, number, number, number]> = [
    [0, 1.15, 36.5, 0, eq * 1.08, 9, 1.25],
    [-18, 2.4, 20, -2, eq * 1.2, 2, 0.9],
    [16, 2.5, 16, 2, eq * 1.2, 1, 0.9],
    [0, 2.4, -24, 0, eq * 1.12, -4, 0.7],
  ];
  for (const [x, y, z, tx, ty, tz, bias] of rig) {
    const spot = new THREE.SpotLight(0xfff1d4, 40, 80, 0.78, 0.5, 2);
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
  niche.position.set(0, doorSill + 1.4, drumR + 1.1);
  cen.add(niche);
  const doorLamp = new THREE.PointLight(0xfff6e8, 4, 8, 2);
  doorLamp.position.set(0, doorSill + 0.7, drumR + 0.85);
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
