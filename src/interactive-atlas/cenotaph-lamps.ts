import * as THREE from "three";
import { stairHalf } from "./ascent";
import { registerArchLight } from "./cenotaph-budget";
import { northHalf, northSoffit } from "./north-passage";
import { TERRACE_Y } from "./terrace";

/**
 * Architectural lamps for the seated Cenotaph. Positions are measured meters,
 * not a floating rig. Nothing here is collision: the meshes sit on stone
 * the walk already avoids, or hang in open volume under a surveyed soffit.
 * Intensities scale with the stone preset so the dark Mistery variant and
 * the lighter studies share one layout. No light casts a shadow.
 */

export type LampKind = "grazer" | "bollard" | "pendant" | "cheek" | "threshold";

export type CenotaphLamp = {
  kind: "spot" | "point";
  name: string;
  fixture: LampKind;
  x: number;
  y: number;
  z: number;
  fx: number;
  fy: number;
  fz: number;
  tx: number;
  ty: number;
  tz: number;
  distance: number;
  angle: number;
  penumbra: number;
  /** Multiplier on the preset spot intensity. */
  gain: number;
};

const GRAZER_R = 95.55;
const GRAZER_LIGHT_R = 96.15;

function grazer(
  theta: number,
  name: string,
  angle = 0.5,
  penumbra = 0.74,
  gain = 0.66,
  aimY = 36,
): CenotaphLamp {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return {
    kind: "spot",
    name,
    fixture: "grazer",
    x: c * GRAZER_LIGHT_R,
    y: 6.72,
    z: s * GRAZER_LIGHT_R,
    fx: c * GRAZER_R,
    fy: TERRACE_Y,
    fz: s * GRAZER_R,
    tx: c * 88.5,
    ty: aimY,
    tz: s * 88.5,
    distance: aimY > 40 ? 56 : 44,
    angle,
    penumbra,
    gain,
  };
}

function bollard(deg: number, name: string): CenotaphLamp {
  const theta = (deg * Math.PI) / 180;
  const r = 106;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return {
    kind: "point",
    name,
    fixture: "bollard",
    x: c * r,
    y: TERRACE_Y + 0.92,
    z: s * r,
    fx: c * r,
    fy: TERRACE_Y,
    fz: s * r,
    tx: c * r,
    ty: TERRACE_Y,
    tz: s * r,
    distance: 22,
    angle: 0,
    penumbra: 0,
    gain: 0.16,
  };
}

function pendant(name: string, x: number, y: number, z: number, distance: number, gain: number): CenotaphLamp {
  return {
    kind: "point",
    name,
    fixture: "pendant",
    x,
    y,
    z,
    fx: x,
    fy: y + 0.22,
    fz: z,
    tx: x,
    ty: y - 4,
    tz: z,
    distance,
    angle: 0,
    penumbra: 0,
    gain,
  };
}

/** South flight cheeks. The centerline stays clear; the lamp sits on the outer tread. */
function cheek(sign: number): CenotaphLamp {
  const z = 115.2;
  const x = sign * (stairHalf(z) - 0.7);
  const y = 4.22;
  return {
    kind: "point",
    name: sign > 0 ? "south-cheek-east" : "south-cheek-west",
    fixture: "cheek",
    x,
    y,
    z,
    fx: x,
    fy: 3.2,
    fz: z,
    tx: 0,
    ty: 3.2,
    tz: z,
    distance: 18,
    angle: 0,
    penumbra: 0,
    gain: 0.22,
  };
}

function threshold(): CenotaphLamp {
  return {
    kind: "point",
    name: "south-threshold",
    fixture: "threshold",
    x: 8.4,
    y: 2.05,
    z: 120.4,
    fx: 8.4,
    fy: 0.42,
    fz: 120.4,
    tx: 0,
    ty: 1.2,
    tz: 112,
    distance: 16,
    angle: 0,
    penumbra: 0,
    gain: 0.09,
  };
}

export function cenotaphLampLayout(): CenotaphLamp[] {
  return [
    ...Array.from({ length: 8 }, (_, i) => grazer(((22.5 + i * 45) * Math.PI) / 180, `wall-grazer-${i}`)),
    // Cardinal faces sit in the gap between the diagonal grazers. These two
    // read the long east and west walls without entering the north or south mouths.
    grazer(0, "wall-grazer-east", 0.82, 0.58, 1.05, 52),
    grazer(Math.PI, "wall-grazer-west", 0.82, 0.58, 1.05, 52),
    bollard(8, "terrace-east"),
    bollard(62, "terrace-southeast"),
    bollard(118, "terrace-southwest"),
    bollard(188, "terrace-west"),
    bollard(242, "terrace-northwest"),
    bollard(298, "terrace-northeast"),
    cheek(1),
    cheek(-1),
    pendant("south-arch", 0, 10.35, 89.2, 24, 0.28),
    pendant("south-hall", 0, 11.45, 55, 30, 0.28),
    pendant("north-hall", 0, 11.45, -60, 30, 0.28),
    pendant("north-arch", 0, 10.05, -90.6, 22, 0.28),
    threshold(),
  ];
}

export function passageLampFits(lamp: CenotaphLamp) {
  if (lamp.fixture === "pendant" && lamp.z > 0) {
    return lamp.y > 8 && lamp.y < 12.6 && Math.abs(lamp.x) <= stairHalf(lamp.z) - 0.4;
  }
  if (lamp.fixture === "pendant" && lamp.z < 0) {
    const soffit = northSoffit(lamp.z);
    return soffit != null && lamp.y < soffit - 0.45 && Math.abs(lamp.x) <= northHalf(lamp.z) - 0.4;
  }
  if (lamp.fixture === "cheek") {
    return Math.abs(lamp.x) > stairHalf(lamp.z) - 1.4 && Math.abs(lamp.x) < stairHalf(lamp.z) - 0.2;
  }
  if (lamp.fixture === "threshold") {
    return lamp.z > 118 && Math.abs(lamp.x) > 6 && lamp.y < 3.2;
  }
  return true;
}

function merge(parts: THREE.BufferGeometry[]) {
  const geos = parts.map((part) => {
    const g = part.index ? part.toNonIndexed() : part;
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    return g;
  });
  let count = 0;
  for (const g of geos) count += g.getAttribute("position").count;
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  let cursor = 0;
  for (const g of geos) {
    const p = g.getAttribute("position");
    const n = g.getAttribute("normal");
    for (let i = 0; i < p.count; i++) {
      pos[(cursor + i) * 3] = p.getX(i);
      pos[(cursor + i) * 3 + 1] = p.getY(i);
      pos[(cursor + i) * 3 + 2] = p.getZ(i);
      nor[(cursor + i) * 3] = n.getX(i);
      nor[(cursor + i) * 3 + 1] = n.getY(i);
      nor[(cursor + i) * 3 + 2] = n.getZ(i);
    }
    cursor += p.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  return geo;
}

function fixtureGeometry(kind: LampKind) {
  if (kind === "grazer") {
    const base = new THREE.CylinderGeometry(0.22, 0.32, 0.4, 6);
    base.translate(0, 0.2, 0);
    const hood = new THREE.BoxGeometry(0.46, 0.2, 0.32);
    hood.translate(0, 0.5, 0.06);
    return merge([base, hood]);
  }
  if (kind === "bollard") {
    const post = new THREE.CylinderGeometry(0.07, 0.09, 0.78, 6);
    post.translate(0, 0.39, 0);
    const cap = new THREE.CylinderGeometry(0.11, 0.11, 0.08, 6);
    cap.translate(0, 0.82, 0);
    return merge([post, cap]);
  }
  if (kind === "cheek") {
    const post = new THREE.CylinderGeometry(0.06, 0.08, 0.7, 5);
    post.translate(0, 0.55, 0);
    return merge([post]);
  }
  const rose = new THREE.CylinderGeometry(0.1, 0.14, 0.08, 6);
  rose.translate(0, -0.04, 0);
  return merge([rose]);
}

function emberGeometry(kind: LampKind) {
  const ember = new THREE.SphereGeometry(kind === "bollard" ? 0.045 : 0.05, 6, 4);
  if (kind === "grazer") ember.translate(0, 0.48, 0.1);
  else if (kind === "bollard") ember.translate(0, 0.82, 0);
  else if (kind === "cheek") ember.translate(0, 0.92, 0);
  else ember.translate(0, -0.12, 0);
  return ember;
}

export type CenotaphLampRig = {
  group: THREE.Group;
  lights: Array<THREE.SpotLight | THREE.PointLight>;
  layout: CenotaphLamp[];
  shadows: number;
  apply: (spot: number, color: number) => void;
};

export function buildCenotaphLamps(): CenotaphLampRig {
  const layout = cenotaphLampLayout();
  const group = new THREE.Group();
  group.name = "cenotaph-lamps";
  const stone = new THREE.MeshStandardMaterial({ color: 0x2c2924, roughness: 0.84, metalness: 0.06 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x6d4e32, roughness: 0.42, metalness: 0.74 });
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0x3a2414,
    emissive: 0xffa04a,
    emissiveIntensity: 1.6,
    roughness: 0.4,
    metalness: 0.1,
  });
  stone.fog = false;
  bronze.fog = false;
  emberMat.fog = false;
  const lights: Array<THREE.SpotLight | THREE.PointLight> = [];
  const kinds: LampKind[] = ["grazer", "bollard", "pendant", "cheek", "threshold"];
  const bodyMat = (kind: LampKind) => (kind === "grazer" || kind === "bollard" || kind === "cheek" ? stone : bronze);
  for (const kind of kinds) {
    const members = layout.filter((lamp) => lamp.fixture === kind);
    if (!members.length) continue;
    const body = new THREE.InstancedMesh(fixtureGeometry(kind), kind === "pendant" || kind === "threshold" ? bronze : bodyMat(kind), members.length);
    const glow = new THREE.InstancedMesh(emberGeometry(kind), emberMat, members.length);
    body.name = `lamp-${kind}`;
    glow.name = `lamp-${kind}-ember`;
    body.castShadow = false;
    glow.castShadow = false;
    body.receiveShadow = false;
    glow.receiveShadow = false;
    body.frustumCulled = false;
    glow.frustumCulled = false;
    const dummy = new THREE.Object3D();
    members.forEach((lamp, i) => {
      dummy.position.set(lamp.fx, lamp.fy, lamp.fz);
      dummy.rotation.set(0, 0, 0);
      if (lamp.fixture === "grazer") dummy.rotation.y = Math.atan2(-lamp.fx, -lamp.fz);
      dummy.updateMatrix();
      body.setMatrixAt(i, dummy.matrix);
      glow.setMatrixAt(i, dummy.matrix);
    });
    body.instanceMatrix.needsUpdate = true;
    glow.instanceMatrix.needsUpdate = true;
    group.add(body, glow);
  }
  for (const lamp of layout) {
    const color = 0xffe6c4;
    const light =
      lamp.kind === "spot"
        ? new THREE.SpotLight(color, 1, lamp.distance, lamp.angle, lamp.penumbra, 2)
        : new THREE.PointLight(color, 1, lamp.distance, 2);
    light.name = lamp.name;
    light.position.set(lamp.x, lamp.y, lamp.z);
    light.castShadow = false;
    light.userData.gain = lamp.gain;
    registerArchLight(light);
    if (light instanceof THREE.SpotLight) {
      light.target.position.set(lamp.tx, lamp.ty, lamp.tz);
      group.add(light.target);
    }
    group.add(light);
    lights.push(light);
  }
  const apply = (spot: number, color: number) => {
    for (const light of lights) {
      light.color.setHex(color);
      light.intensity = spot * (light.userData.gain as number);
    }
  };
  return { group, lights, layout, shadows: 0, apply };
}
