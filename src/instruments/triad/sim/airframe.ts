/** Boeing 777-200ER schematic, body axes: +x right, +y up, +z nose.
 * Overall length, wingspan, and height are the published figures.
 * Fuselage width is the published 6.2 m. The solid is a schematic, not a loft.
 * Clearance is the distance to that solid. It is not half-span.
 */

export const B777 = {
  lengthM: 63.7,
  spanM: 60.9,
  heightM: 18.5,
  fuseWidthM: 6.2,
  cite: "Boeing 777-200ER overall length 63.7 m, wingspan 60.9 m, height 18.5 m. Fuselage width 6.2 m.",
} as const;

export const SKIN_MARGIN_M = 2.5;

const SWEEP = (31.64 * Math.PI) / 180;
const FIN_SWEEP = 0.42;
const STAB_SWEEP = (25 * Math.PI) / 180;

type Vec = { x: number; y: number; z: number };

type Cylinder = { kind: "cylinder"; name: string; y: number; z0: number; z1: number; r: number };
type Cone = { kind: "cone"; name: string; zBase: number; zTip: number; r: number };
type Box = { kind: "box"; name: string; center: Vec; rotX: number; rotY: number; half: Vec };
type Part = Cylinder | Cone | Box;

export type MeshBox = {
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
};

export type MeshCylinder = {
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  radius: number;
  length: number;
};

export type MeshCone = {
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  radius: number;
  length: number;
};

const halfL = B777.lengthM / 2;
const fuseR = B777.fuseWidthM / 2;
const noseLen = 7.4;
const tailLen = 11.3;
const noseTip = halfL;
const tailTip = -halfL;
const noseBase = noseTip - noseLen;
const tailBase = tailTip + tailLen;

const nacelleR = 1.7;
const nacelleLen = 6.6;
const nacelleY = -3.15;
const nacelleBottom = nacelleY - nacelleR;
const finTop = nacelleBottom + B777.heightM;
const finChord = 8.4;
const finThick = 0.5;
const finHeight = 10.4;
const finCos = Math.cos(FIN_SWEEP);
const finSin = Math.sin(FIN_SWEEP);
const finTopOffset = (finHeight / 2) * finCos + (finChord / 2) * finSin;
const finCenterY = finTop - finTopOffset;
const finCenterZ = -24.6;

const wingChord = 8.8;
const wingThick = 1.12;
const wingLen = 25.8;
const wingHx = wingLen / 2;
const wingHz = wingChord / 2;
const wingReach = wingHx * Math.cos(SWEEP) + wingHz * Math.sin(SWEEP);
const wingX = B777.spanM / 2 - wingReach;
const wingY = -1.2;
const wingZ = -2.4;

const stabChord = 5.2;
const stabThick = 0.42;
const stabLen = 9.4;
const stabHx = stabLen / 2;
const stabHz = stabChord / 2;
const stabReach = stabHx * Math.cos(STAB_SWEEP) + stabHz * Math.sin(STAB_SWEEP);
const stabHalf = 10.75;
const stabX = stabHalf - stabReach;
const stabY = 0.85;
const stabZ = -26.8;

function boxPart(name: string, center: Vec, rotX: number, rotY: number, half: Vec): Box {
  return { kind: "box", name, center, rotX, rotY, half };
}

const PARTS: Part[] = [
  { kind: "cylinder", name: "fuselage", y: 0, z0: tailBase, z1: noseBase, r: fuseR },
  { kind: "cone", name: "nose", zBase: noseBase, zTip: noseTip, r: fuseR },
  { kind: "cone", name: "tail cone", zBase: tailBase, zTip: tailTip, r: fuseR },
  boxPart("right wing", { x: wingX, y: wingY, z: wingZ }, 0, SWEEP, { x: wingHx, y: wingThick / 2, z: wingHz }),
  boxPart("left wing", { x: -wingX, y: wingY, z: wingZ }, 0, -SWEEP, { x: wingHx, y: wingThick / 2, z: wingHz }),
  boxPart(
    "fin",
    { x: 0, y: finCenterY, z: finCenterZ },
    -FIN_SWEEP,
    0,
    { x: finThick / 2, y: finHeight / 2, z: finChord / 2 },
  ),
  boxPart(
    "right stabilizer",
    { x: stabX, y: stabY, z: stabZ },
    0,
    STAB_SWEEP,
    { x: stabHx, y: stabThick / 2, z: stabHz },
  ),
  boxPart(
    "left stabilizer",
    { x: -stabX, y: stabY, z: stabZ },
    0,
    -STAB_SWEEP,
    { x: stabHx, y: stabThick / 2, z: stabHz },
  ),
  boxPart(
    "right pylon",
    { x: 11.2, y: (wingY + nacelleY) / 2, z: wingZ - 1.2 },
    0,
    0,
    { x: 0.35, y: Math.max(0.2, (wingY - nacelleY - nacelleR * 0.3) / 2), z: 1.2 },
  ),
  boxPart(
    "left pylon",
    { x: -11.2, y: (wingY + nacelleY) / 2, z: wingZ - 1.2 },
    0,
    0,
    { x: 0.35, y: Math.max(0.2, (wingY - nacelleY - nacelleR * 0.3) / 2), z: 1.2 },
  ),
  {
    kind: "cylinder",
    name: "right nacelle",
    y: nacelleY,
    z0: wingZ - 1.2 - nacelleLen / 2,
    z1: wingZ - 1.2 + nacelleLen / 2,
    r: nacelleR,
  },
  {
    kind: "cylinder",
    name: "left nacelle",
    y: nacelleY,
    z0: wingZ - 1.2 - nacelleLen / 2,
    z1: wingZ - 1.2 + nacelleLen / 2,
    r: nacelleR,
  },
];

const rightNacelle: Cylinder = PARTS.find((p) => p.name === "right nacelle") as Cylinder;
const leftNacelle: Cylinder = PARTS.find((p) => p.name === "left nacelle") as Cylinder;
rightNacelle.y = nacelleY;
leftNacelle.y = nacelleY;

type CylinderX = Cylinder & { x?: number };

const SOLIDS: Part[] = PARTS.map((p) => {
  if (p.kind === "cylinder" && p.name === "right nacelle") return { ...p, x: 11.2 };
  if (p.kind === "cylinder" && p.name === "left nacelle") return { ...p, x: -11.2 };
  return p;
});

export const AIRFRAME_MESH = {
  fuse: {
    name: "fuselage",
    position: [0, 0, (noseBase + tailBase) / 2] as [number, number, number],
    rotation: [Math.PI / 2, 0, 0] as [number, number, number],
    radius: fuseR,
    length: noseBase - tailBase,
  } satisfies MeshCylinder,
  nose: {
    name: "nose",
    position: [0, 0, (noseBase + noseTip) / 2] as [number, number, number],
    rotation: [Math.PI / 2, 0, 0] as [number, number, number],
    radius: fuseR,
    length: noseLen,
  } satisfies MeshCone,
  tail: {
    name: "tail cone",
    position: [0, 0, (tailBase + tailTip) / 2] as [number, number, number],
    rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
    radius: fuseR,
    length: tailLen,
  } satisfies MeshCone,
  boxes: PARTS.filter((p): p is Box => p.kind === "box").map((b) => boxMesh(b.name, b)),
  nacelles: [cylMesh("right nacelle", 11.2), cylMesh("left nacelle", -11.2)] satisfies MeshCylinder[],
};

function boxMesh(name: string, b: Box): MeshBox {
  return {
    name,
    position: [b.center.x, b.center.y, b.center.z],
    rotation: [b.rotX, b.rotY, 0],
    size: [b.half.x * 2, b.half.y * 2, b.half.z * 2],
  };
}

function cylMesh(name: string, x: number): MeshCylinder {
  const src = name.startsWith("right") ? rightNacelle : leftNacelle;
  return {
    name,
    position: [x, src.y, (src.z0 + src.z1) / 2],
    rotation: [Math.PI / 2, 0, 0],
    radius: src.r,
    length: src.z1 - src.z0,
  };
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function rotX(v: Vec, a: number): Vec {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}

function rotY(v: Vec, a: number): Vec {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}

function boxDistance(p: Vec, b: Box): number {
  let d = { x: p.x - b.center.x, y: p.y - b.center.y, z: p.z - b.center.z };
  d = rotY(d, -b.rotY);
  d = rotX(d, -b.rotX);
  const qx = Math.abs(d.x) - b.half.x;
  const qy = Math.abs(d.y) - b.half.y;
  const qz = Math.abs(d.z) - b.half.z;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  const oz = Math.max(qz, 0);
  const outside = Math.hypot(ox, oy, oz);
  if (outside > 0) return outside;
  return Math.max(qx, qy, qz);
}

function cylinderDistance(p: Vec, c: CylinderX): number {
  const x = p.x - (c.x ?? 0);
  const y = p.y - c.y;
  const radial = Math.hypot(x, y);
  const zc = clamp(p.z, c.z0, c.z1);
  const dz = p.z - zc;
  const dr = radial - c.r;
  if (dz === 0 && dr <= 0) return dr;
  return Math.hypot(Math.max(dr, 0), dz);
}

/** IQ capped cone. Axis is local y, from y=-h (radius r1) to y=+h (radius r2). */
function sdCappedCone(radial: number, y: number, h: number, r1: number, r2: number): number {
  const qy = y;
  const qx = radial;
  const k1x = r2;
  const k1y = h;
  const k2x = r2 - r1;
  const k2y = 2 * h;
  const caX = qx - Math.min(qx, qy < 0 ? r1 : r2);
  const caY = Math.abs(qy) - h;
  const dotK = k2x * k2x + k2y * k2y || 1;
  const t = clamp(((k1x - qx) * k2x + (k1y - qy) * k2y) / dotK, 0, 1);
  const cbX = qx - k1x + k2x * t;
  const cbY = qy - k1y + k2y * t;
  const s = cbX < 0 && caY < 0 ? -1 : 1;
  return s * Math.sqrt(Math.min(caX * caX + caY * caY, cbX * cbX + cbY * cbY));
}

function coneDistance(p: Vec, cone: Cone): number {
  const h = Math.abs(cone.zTip - cone.zBase) / 2;
  const zc = (cone.zTip + cone.zBase) / 2;
  const localY = cone.zTip > cone.zBase ? p.z - zc : zc - p.z;
  return sdCappedCone(Math.hypot(p.x, p.y), localY, h, cone.r, 0);
}

export function skinDistance(p: Vec): { gap: number; part: string } {
  let gap = Infinity;
  let part = "none";
  for (const solid of SOLIDS) {
    let d = 0;
    if (solid.kind === "cylinder") d = cylinderDistance(p, solid as CylinderX);
    else if (solid.kind === "cone") d = coneDistance(p, solid);
    else d = boxDistance(p, solid);
    if (d < gap) {
      gap = d;
      part = solid.name;
    }
  }
  return { gap, part };
}

function norm(v: Vec): Vec {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

/** Smallest radius at least `commanded` whose point is outside the skin by the margin. */
export function minimumClearRadius(dir: Vec, commanded: number, margin = SKIN_MARGIN_M): number {
  const n = norm(dir);
  const at = (r: number) => skinDistance({ x: n.x * r, y: n.y * r, z: n.z * r }).gap;
  const want = Math.max(0, commanded);
  if (at(want) >= margin) return want;
  let prev = want;
  let step = 0.4;
  for (let i = 0; i < 100; i++) {
    const r = Math.min(220, prev + step);
    if (at(r) >= margin) {
      let lo = prev;
      let hi = r;
      for (let k = 0; k < 18; k++) {
        const mid = 0.5 * (lo + hi);
        if (at(mid) >= margin) hi = mid;
        else lo = mid;
      }
      return hi;
    }
    prev = r;
    step = at(r) < -1.5 ? 1.25 : 0.35;
    if (r >= 220) return r;
  }
  return prev;
}

export type RadiusSplit = {
  commandedR: number;
  clearR: number;
  actualR: number;
  clearanceRaised: boolean;
  tracking: boolean;
  note: string;
};

/** Commanded R, the airframe floor, and the measured radius are different numbers.
 * A controller that cannot buy ω²R leaves the slot. That is not clearance.
 */
export function splitRadii(commanded: number, clear: number[], actual: number[]): RadiusSplit {
  const clearR = clear.reduce((m, r) => Math.max(m, r), 0);
  const actualR = actual.reduce((m, r) => Math.max(m, r), 0);
  const clearanceRaised = clear.some((r) => r > commanded + 0.4);
  const tracking = actual.some((r, i) => Math.abs(r - (clear[i] ?? commanded)) > 1.5);
  let note: string;
  if (clearanceRaised && tracking) {
    note = `Clearance floor is ${clearR.toFixed(1)} m. Commanded radius is ${commanded.toFixed(0)} m. Actual radius reaches ${actualR.toFixed(1)} m. The difference between actual and the clearance floor is tracking, not the airframe.`;
  } else if (clearanceRaised) {
    note = `Airframe clearance raises the slot from commanded ${commanded.toFixed(0)} m to ${clearR.toFixed(1)} m. Actual radius is on that floor. Half-span is not this number.`;
  } else if (tracking) {
    note = `Clearance floor equals the commanded radius ${commanded.toFixed(0)} m. Actual radius ${actualR.toFixed(1)} m is a controller excursion, not an airframe push.`;
  } else {
    note = `Commanded radius, clearance floor, and actual radius agree near ${commanded.toFixed(0)} m.`;
  }
  return { commandedR: commanded, clearR, actualR, clearanceRaised, tracking, note };
}

export function airframeExtent() {
  let maxX = 0;
  let minY = Infinity;
  let maxY = -Infinity;
  const consider = (p: Vec) => {
    maxX = Math.max(maxX, Math.abs(p.x));
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  };
  consider({ x: 0, y: 0, z: noseTip });
  consider({ x: 0, y: nacelleBottom, z: 0 });
  consider({ x: 0, y: finTop, z: finCenterZ });
  const corners = (b: Box) => {
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          let v = { x: sx * b.half.x, y: sy * b.half.y, z: sz * b.half.z };
          v = rotX(v, b.rotX);
          v = rotY(v, b.rotY);
          consider({ x: b.center.x + v.x, y: b.center.y + v.y, z: b.center.z + v.z });
        }
      }
    }
  };
  for (const p of PARTS) if (p.kind === "box") corners(p);
  consider({ x: 11.2, y: nacelleBottom, z: wingZ });
  consider({ x: -11.2, y: nacelleBottom, z: wingZ });
  return {
    length: noseTip - tailTip,
    span: maxX * 2,
    height: maxY - minY,
    noseTip,
    tailTip,
    finTop,
    nacelleBottom,
  };
}
