/**
 * TRIAD integrator. Audit map: ../AUDIT.md
 *
 * step order: craft → nodes (control) → clearance → energy/reservoir →
 * Maxwell sample (refreshVisuals / qedReadout) → telemetry history.
 * vacuumBore is copied from params onto the display. Nothing in this file
 * turns it on from a field or pair threshold.
 */

import {
  ES,
  cyclePeakNearDipoles,
  emagnitude,
  energyDensity,
  fieldAt,
  poynting,
  radiatedPower,
  solveDipoleMoment,
  wrapPi,
  type Dipole,
  type Vec,
} from "./fields";
import { SKIN_MARGIN_M, minimumClearRadius, skinDistance, splitRadii } from "./airframe";
import { hardwareClass, sampleStrongField, sweepCommanded } from "./qed";
import { evaluateSweep } from "./sampling";
import {
  DEFAULT_PARAMS,
  type Experiment,
  type GeoFrame,
  type HistoryPoint,
  type ImportTrack,
  type NodeReadout,
  type Params,
  type PhasePreset,
  type Snapshot,
} from "./types";

const TAU = Math.PI * 2;
const Y0 = 10668;
const FIELD_N = 52;
const GUIDE_N = 72;
export const BORE_MAX = 220;
export const BORE_RING = 24;
export const BORE_LEAD = 4;

type Craft = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  bank: number;
  track: number;
  gamma: number;
  speed: number;
  vx: number;
  vy: number;
  vz: number;
};

type Basis = {
  fx: number;
  fy: number;
  fz: number;
  rx: number;
  ry: number;
  rz: number;
  ux: number;
  uy: number;
  uz: number;
};

type OrbitPlane = {
  e1x: number;
  e1y: number;
  e1z: number;
  e2x: number;
  e2y: number;
  e2z: number;
  nx: number;
  ny: number;
  nz: number;
};

type BoreSample = {
  t: number;
  phase: number;
  ring: Float32Array;
  nodes: Vec[];
};

type Sample = {
  t: number;
  ac: Craft;
  nodes: Vec[];
};

export type Marker = { x: number; y: number; z: number };

export type DisplayState = {
  acY: number;
  acx: number;
  acz: number;
  nodeDark: boolean[];
  quat: { x: number; y: number; z: number; w: number };
  nodes: Marker[];
  slots: Marker[];
  predetermined: Marker[];
  guide: Float32Array;
  field: Uint8Array;
  fieldSpan: number;
  fieldRev: number;
  arrows: { x: number; y: number; z: number; dx: number; dy: number; dz: number }[];
  rays: Float32Array[];
  ghostOn: boolean;
  ghost: Marker;
  ghostFar: boolean;
  anchorBearing: number;
  importOn: boolean;
  importAc: Marker | null;
  importNodes: Marker[];
  ground: Marker;
  showField: boolean;
  showPoynting: boolean;
  showPredetermined: boolean;
  plasma: boolean;
  plane: OrbitPlane;
  vel: Marker;
  boreOn: boolean;
  vacuumBore: boolean;
  boreCount: number;
  boreRings: Float32Array;
  boreAge: Float32Array;
  borePhase: Float32Array;
  boreNodes: Float32Array;
  pitchMark: Uint8Array;
  nowRing: Float32Array;
  leadCount: number;
  leadRings: Float32Array;
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function deg(r: number) {
  return (r * 180) / Math.PI;
}

function rad(d: number) {
  return (d * Math.PI) / 180;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function basisOf(yaw: number, pitch: number, bank: number): Basis {
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const sy = Math.sin(yaw);
  const cy = Math.cos(yaw);
  const fx = sy * cp;
  const fy = sp;
  const fz = cy * cp;
  const rlen = Math.hypot(fz, fx) || 1;
  const rx0 = fz / rlen;
  const ry0 = 0;
  const rz0 = -fx / rlen;
  const ux0 = fy * rz0 - fz * ry0;
  const uy0 = fz * rx0 - fx * rz0;
  const uz0 = fx * ry0 - fy * rx0;
  const ul = Math.hypot(ux0, uy0, uz0) || 1;
  const ux = ux0 / ul;
  const uy = uy0 / ul;
  const uz = uz0 / ul;
  const cb = Math.cos(bank);
  const sb = Math.sin(bank);
  return {
    fx,
    fy,
    fz,
    rx: rx0 * cb + ux * sb,
    ry: ry0 * cb + uy * sb,
    rz: rz0 * cb + uz * sb,
    ux: -rx0 * sb + ux * cb,
    uy: -ry0 * sb + uy * cb,
    uz: -rz0 * sb + uz * cb,
  };
}

function quatFromBasis(b: Basis) {
  const m11 = b.rx;
  const m12 = b.ux;
  const m13 = b.fx;
  const m21 = b.ry;
  const m22 = b.uy;
  const m23 = b.fy;
  const m31 = b.rz;
  const m32 = b.uz;
  const m33 = b.fz;
  const trace = m11 + m22 + m33;
  let x: number;
  let y: number;
  let z: number;
  let w: number;
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1);
    w = 0.25 / s;
    x = (m32 - m23) * s;
    y = (m13 - m31) * s;
    z = (m21 - m12) * s;
  } else if (m11 > m22 && m11 > m33) {
    const s = 2 * Math.sqrt(1 + m11 - m22 - m33);
    w = (m32 - m23) / s;
    x = 0.25 * s;
    y = (m12 + m21) / s;
    z = (m13 + m31) / s;
  } else if (m22 > m33) {
    const s = 2 * Math.sqrt(1 + m22 - m11 - m33);
    w = (m13 - m31) / s;
    x = (m12 + m21) / s;
    y = 0.25 * s;
    z = (m23 + m32) / s;
  } else {
    const s = 2 * Math.sqrt(1 + m33 - m11 - m22);
    w = (m21 - m12) / s;
    x = (m13 + m31) / s;
    y = (m23 + m32) / s;
    z = 0.25 * s;
  }
  return { x, y, z, w };
}

function ringPoint(p: OrbitPlane, angle: number, radius: number): Vec {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: radius * (c * p.e1x + s * p.e2x),
    y: radius * (c * p.e1y + s * p.e2y),
    z: radius * (c * p.e1z + s * p.e2z),
  };
}

function planeFromNormal(nx: number, ny: number, nz: number, hint: Vec): OrbitPlane {
  let hx = hint.x;
  let hy = hint.y;
  let hz = hint.z;
  const hl0 = Math.hypot(hx, hy, hz) || 1;
  hx /= hl0;
  hy /= hl0;
  hz /= hl0;
  const d = hx * nx + hy * ny + hz * nz;
  hx -= d * nx;
  hy -= d * ny;
  hz -= d * nz;
  let hl = Math.hypot(hx, hy, hz);
  if (hl < 1e-4) {
    const alt = Math.abs(ny) < 0.85 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    return planeFromNormal(nx, ny, nz, alt);
  }
  hx /= hl;
  hy /= hl;
  hz /= hl;
  return {
    nx,
    ny,
    nz,
    e2x: hx,
    e2y: hy,
    e2z: hz,
    e1x: hy * nz - hz * ny,
    e1y: hz * nx - hx * nz,
    e1z: hx * ny - hy * nx,
  };
}

function borePlane(b: Basis): OrbitPlane {
  return {
    nx: b.fx,
    ny: b.fy,
    nz: b.fz,
    e1x: b.rx,
    e1y: b.ry,
    e1z: b.rz,
    e2x: b.ux,
    e2y: b.uy,
    e2z: b.uz,
  };
}

function orbitPlane(ac: Craft, frame: GeoFrame): OrbitPlane {
  const b = basisOf(ac.yaw, ac.pitch, ac.bank);
  if (frame === "world") {
    const level = basisOf(ac.yaw, 0, 0);
    return {
      nx: 0,
      ny: 1,
      nz: 0,
      e1x: level.rx,
      e1y: level.ry,
      e1z: level.rz,
      e2x: level.fx,
      e2y: 0,
      e2z: level.fz,
    };
  }
  if (frame === "body") {
    return {
      nx: b.ux,
      ny: b.uy,
      nz: b.uz,
      e1x: b.rx,
      e1y: b.ry,
      e1z: b.rz,
      e2x: b.fx,
      e2y: b.fy,
      e2z: b.fz,
    };
  }
  if (frame === "velocity") {
    const sp = Math.hypot(ac.vx, ac.vy, ac.vz);
    if (sp < 0.4) return borePlane(b);
    return planeFromNormal(ac.vx / sp, ac.vy / sp, ac.vz / sp, { x: b.ux, y: b.uy, z: b.uz });
  }
  return borePlane(b);
}

function planeAngle(p: OrbitPlane, rel: Vec): number {
  const right = rel.x * p.e1x + rel.y * p.e1y + rel.z * p.e1z;
  const up = rel.x * p.e2x + rel.y * p.e2y + rel.z * p.e2z;
  return Math.atan2(up, right);
}

export function boreKinematics(v: number, omega: number, radius: number) {
  const diam = Math.max(0, 2 * radius);
  const spinning = Math.abs(omega) >= 1e-3;
  const moving = v >= 0.5;
  const lRev = spinning && moving ? (v * TAU) / Math.abs(omega) : Infinity;
  const ratio = Number.isFinite(lRev) && diam > 0 ? lRev / diam : Infinity;
  const dz120 = Number.isFinite(lRev) ? lRev / 3 : Infinity;
  const cSweep = Number.isFinite(dz120) && dz120 > 0 ? diam / dz120 : Number.NaN;
  let regime = "Frozen. No source locus.";
  if (!spinning && moving) regime = "Translation only. Three straight emitter histories, no helix.";
  else if (spinning && !moving) regime = "Rotation only. Sources rewrite one circle. Δz120 is undefined.";
  else if (!(cSweep >= 1)) regime = "Sparse source locus. Δz120 is longer than the diameter 2R.";
  else if (cSweep < 3) regime = "Open source locus. Δz120 sits between 2R/3 and 2R.";
  else regime = "Wound source locus. Δz120 is shorter than 2R/3. Geometry only.";
  return { lRev, ratio, diam, dz120, cSweep, regime, spinning, moving };
}

function frameNote(frame: GeoFrame) {
  if (frame === "bore") return "Forward bore. The disk is orthogonal to the body axis. Its normal tracks the nose.";
  if (frame === "world") return "World horizontal. The ring stays level. Normal is world-up.";
  if (frame === "body") return "Body normal. The ring lies in the wing plane and banks with attitude. Normal is body-up.";
  return "Velocity normal. The disk stays perpendicular to the flight path, not the nose.";
}

function addV(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function createEngine() {
  const params: Params = { ...DEFAULT_PARAMS };
  const rng = mulberry32(0x71ad);
  const nodes: { p: Vec; v: Vec; a: number; slip: number }[] = [];
  const offsets = [0, TAU / 3, (2 * TAU) / 3];
  const geoOff = [0, TAU / 3, (2 * TAU) / 3];
  const buffer: Sample[] = [];
  const history: HistoryPoint[] = [];
  const boreHist: BoreSample[] = [];
  const guide = new Float32Array(GUIDE_N * 3);
  const field = new Uint8Array(FIELD_N * FIELD_N * 4);
  const arrows = Array.from({ length: 49 }, () => ({ x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 0 }));

  let v0 = DEFAULT_PARAMS.speed;
  let yaw0 = 0;
  let ac: Craft = blankCraft();
  let nominal: Craft = blankCraft();
  let t = 0;
  let pertX = 0;
  let pertY = 0;
  let pertZ = 0;
  let eChem0 = tank0(params);
  let eChem = eChem0;
  let maneuver = 0;
  let histAcc = 0;
  let visualAcc = 0;
  let boreAcc = 0;
  let gapErr = 0;
  let trackErr = 0;
  let phaseErr = 0;
  let gapMetric = "Pairwise separation versus 120° about the aircraft.";
  let scale = 1;
  let pRad = 0;
  let pDraw = 0;
  let pDrawCmd = 0;
  let pBudget = 1;
  let pAmp = 0;
  let ePeak = 0;
  let bPeak = 0;
  let limited = false;
  let empty = false;
  let cage = "Field slice not yet sampled.";
  let centerNote = "";
  let nPeakRaw = 1;
  let nPeakMarch = 1;
  let fieldWhere = "exclusion surface";
  let importTrack: ImportTrack | null = null;
  let presetToken = params.phasePreset;
  const rays: Float32Array[] = [];
  const display: DisplayState = {
    acY: 0,
    acx: 0,
    acz: 0,
    nodeDark: [false, false, false],
    quat: { x: 0, y: 0, z: 0, w: 1 },
    nodes: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
    ],
    slots: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
    ],
    predetermined: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
    ],
    guide,
    field,
    fieldSpan: 180,
    fieldRev: 0,
    arrows,
    rays,
    ghostOn: false,
    ghost: { x: 0, y: 0, z: 0 },
    ghostFar: true,
    anchorBearing: 0,
    importOn: false,
    importAc: null,
    importNodes: [],
    ground: { x: -220, y: -40, z: -320 },
    showField: true,
    showPoynting: true,
    showPredetermined: true,
    plasma: false,
    plane: {
      e1x: 1,
      e1y: 0,
      e1z: 0,
      e2x: 0,
      e2y: 1,
      e2z: 0,
      nx: 0,
      ny: 0,
      nz: 1,
    },
    vel: { x: 0, y: 0, z: 0 },
    boreOn: true,
    vacuumBore: false,
    boreCount: 0,
    boreRings: new Float32Array(BORE_MAX * BORE_RING * 3),
    boreAge: new Float32Array(BORE_MAX),
    borePhase: new Float32Array(BORE_MAX),
    boreNodes: new Float32Array(3 * BORE_MAX * 3),
    pitchMark: new Uint8Array(BORE_MAX),
    nowRing: new Float32Array(BORE_RING * 3),
    leadCount: 0,
    leadRings: new Float32Array(BORE_LEAD * BORE_RING * 3),
  };
  const camera = { x: 40, y: Y0 + 50, z: -120 };

  function blankCraft(): Craft {
    return {
      x: 0,
      y: Y0,
      z: 0,
      yaw: 0,
      pitch: 0,
      bank: 0,
      track: 0,
      gamma: 0,
      speed: v0,
      vx: 0,
      vy: 0,
      vz: v0,
    };
  }

  function angleOf(index: number, phase: number, pair: boolean) {
    if (pair && index < 2) return phase + index * Math.PI;
    if (params.spacing === "free") return phase + geoOff[index];
    const bend = !pair && index === 1 ? rad(params.seatBendDeg || 0) : 0;
    return phase + index * (TAU / 3) + bend;
  }

  function placeInitial() {
    nodes.length = 0;
    for (let i = 0; i < 3; i++) {
      const p = slotOn(ac, i, 0, false);
      nodes.push({
        p,
        v: { x: ac.vx, y: ac.vy, z: ac.vz },
        a: 0,
        slip: 0,
      });
    }
  }

  function onPreset(preset: PhasePreset) {
    if (preset === "zero") {
      params.phaseA = 0;
      params.phaseB = 0;
      params.phaseC = 0;
    } else if (preset === "triad" || preset === "one-off" || preset === "two-only") {
      params.phaseA = 0;
      params.phaseB = 120;
      params.phaseC = 240;
    }
    syncPhaseOffsets();
    if (preset === "one-off" || preset === "two-only") params.activeCount = 2;
    else if (preset === "triad") params.activeCount = 3;
    for (const n of nodes) n.slip = 0;
  }

  function syncPhaseOffsets() {
    offsets[0] = rad(params.phaseA);
    offsets[1] = rad(params.phaseB);
    offsets[2] = rad(params.phaseC);
  }

  function writeVelocity() {
    const cp = Math.cos(ac.gamma);
    const sp = Math.sin(ac.gamma);
    ac.vx = Math.sin(ac.track) * cp * ac.speed + pertX;
    ac.vy = sp * ac.speed + pertY;
    ac.vz = Math.cos(ac.track) * cp * ac.speed + pertZ;
  }

  /** Plotted telemetry and source-locus samples only. Latency buffer and node state stay. */
  function clearHistory() {
    history.length = 0;
    boreHist.length = 0;
    histAcc = 0;
    boreAcc = 0;
    refreshVisuals();
  }

  function reset() {
    t = 0;
    v0 = params.speed;
    yaw0 = 0;
    ac = blankCraft();
    ac.speed = v0;
    ac.gamma = 0;
    ac.track = 0;
    ac.pitch = rad(params.alphaDeg);
    ac.yaw = rad(params.betaDeg);
    writeVelocity();
    nominal = { ...ac, pitch: 0, yaw: 0, bank: 0, track: 0, gamma: 0, vx: 0, vy: 0, vz: v0 };
    pertX = pertY = pertZ = 0;
    writeVelocity();
    maneuver = 0;
    histAcc = 0;
    visualAcc = 0;
    boreAcc = 0;
    history.length = 0;
    buffer.length = 0;
    boreHist.length = 0;
    eChem0 = tank0(params);
    eChem = eChem0;
    empty = false;
    pAmp = solveDipoleMoment(params.eRef, params.freqHz, params.rRef);
    onPreset(params.phasePreset);
    presetToken = params.phasePreset;
    if (params.spacing !== "free") {
      geoOff[0] = 0;
      geoOff[1] = TAU / 3;
      geoOff[2] = (2 * TAU) / 3;
    }
    placeInitial();
    scale = 1;
    recordBore();
    refreshVisuals();
  }

  function delayed(at: number): Sample {
    if (buffer.length === 0) {
      return { t: 0, ac: { ...ac }, nodes: nodes.map((n) => ({ ...n.p })) };
    }
    let best = buffer[0];
    for (let i = buffer.length - 1; i >= 0; i--) {
      if (buffer[i].t <= at) {
        best = buffer[i];
        break;
      }
    }
    return best;
  }

  function slotOn(craft: Craft, index: number, phase: number, pair: boolean): Vec {
    const plane = orbitPlane(craft, params.frame);
    const b = basisOf(craft.yaw, craft.pitch, craft.bank);
    const ang = angleOf(index, phase, pair);
    const R = clearedR(plane, b, ang, params.orbitRadius);
    const o = ringPoint(plane, ang, R);
    return { x: craft.x + o.x, y: craft.y + o.y, z: craft.z + o.z };
  }

  function integrateCraft(dt: number) {
    const man = maneuver > 0;
    const bankCmd = rad(man ? 28 : params.bankDeg);
    const gammaCmd = clamp(rad(man ? 8 : params.pitchDeg), -0.45, 0.45);
    const yawRateCmd = rad(man ? 4 : params.yawRateDeg);
    const speedCmd = clamp(man ? Math.max(40, v0 + 30) : params.speed, 0, 400);
    const perturb = man ? Math.max(params.perturb, 6) : params.perturb;
    ac.bank += clamp(bankCmd - ac.bank, -0.5 * dt, 0.5 * dt);
    ac.gamma += clamp(gammaCmd - ac.gamma, -0.25 * dt, 0.25 * dt);
    ac.speed += clamp(speedCmd - ac.speed, -70 * dt, 70 * dt);
    const turn = ac.speed > 40 ? (9.80665 * Math.tan(ac.bank)) / ac.speed : 0;
    ac.track += (turn + yawRateCmd) * dt;
    ac.pitch = clamp(ac.gamma + rad(params.alphaDeg), -0.9, 0.9);
    ac.yaw = ac.track + rad(params.betaDeg);
    const tau = 0.7;
    pertX += (((rng() * 2 - 1) * perturb - pertX) * dt) / tau;
    pertY += (((rng() * 2 - 1) * perturb * 0.35 - pertY) * dt) / tau;
    pertZ += (((rng() * 2 - 1) * perturb - pertZ) * dt) / tau;
    writeVelocity();
    ac.x += ac.vx * dt;
    ac.y += ac.vy * dt;
    ac.z += ac.vz * dt;
    nominal.x += Math.sin(yaw0) * v0 * dt;
    nominal.z += Math.cos(yaw0) * v0 * dt;
    nominal.y = Y0;
    nominal.track = yaw0;
    nominal.gamma = 0;
    nominal.yaw = yaw0;
    nominal.pitch = 0;
    nominal.bank = 0;
    nominal.vx = Math.sin(yaw0) * v0;
    nominal.vy = 0;
    nominal.vz = Math.cos(yaw0) * v0;
    nominal.speed = v0;
    if (man) {
      maneuver = Math.max(0, maneuver - dt);
    }
  }

  function commandAngles(est: Craft, phase: number, pair: boolean): number[] {
    const plane = orbitPlane(est, params.frame);
    const angs = nodes.map((n) =>
      planeAngle(plane, { x: n.p.x - est.x, y: n.p.y - est.y, z: n.p.z - est.z }),
    );
    const out = [0, 0, 0];
    const active = pair ? 2 : 3;
    for (let i = 0; i < active; i++) {
      const slot = angleOf(i, phase, pair);
      if (params.mode === "tracking" || params.spacing === "free") {
        out[i] = slot;
        continue;
      }
      const prev = angs[(i + active - 1) % active];
      const step = pair ? Math.PI : TAU / 3;
      const equalize = prev + step;
      out[i] = slot + 0.5 * wrapPi(equalize - slot);
    }
    return out;
  }

  function moveNodes(dt: number, phase: number) {
    const pair = params.phasePreset === "two-only";
    const lat = params.latencyMs / 1000;
    if (params.mode === "scripted") {
      for (let i = 0; i < 3; i++) {
        const goal =
          pair && i === 2
            ? park(nominal, phase)
            : slotOn(nominal, i, phase, pair && i < 2);
        const px = nodes[i].p.x;
        const py = nodes[i].p.y;
        const pz = nodes[i].p.z;
        nodes[i].v = { x: (goal.x - px) / dt, y: (goal.y - py) / dt, z: (goal.z - pz) / dt };
        nodes[i].p = goal;
        nodes[i].a = 0;
      }
      enforceClearance();
      return;
    }
    const sample = delayed(t - lat);
    const est: Craft = {
      ...sample.ac,
      x: sample.ac.x + sample.ac.vx * lat,
      y: sample.ac.y + sample.ac.vy * lat,
      z: sample.ac.z + sample.ac.vz * lat,
    };
    const angs = commandAngles(est, phase, pair);
    const kp = 9;
    const kd = 6;
    for (let i = 0; i < 3; i++) {
      if (pair && i === 2) {
        const goal = park(est, phase);
        seek(i, goal, { x: est.vx, y: est.vy, z: est.vz }, { x: goal.x - est.x, y: goal.y - est.y, z: goal.z - est.z }, dt, kp, kd);
        continue;
      }
      const plane = orbitPlane(est, params.frame);
      const o = ringPoint(plane, angs[i], params.orbitRadius);
      const goal = { x: est.x + o.x, y: est.y + o.y, z: est.z + o.z };
      const yawRate = (est.speed > 40 ? (9.80665 * Math.tan(est.bank)) / est.speed : 0) + rad(params.yawRateDeg);
      const aheadCraft: Craft = {
        ...est,
        x: est.x + est.vx * dt,
        y: est.y + est.vy * dt,
        z: est.z + est.vz * dt,
        track: est.track + yawRate * dt,
      };
      aheadCraft.yaw = aheadCraft.track + rad(params.betaDeg);
      aheadCraft.pitch = clamp(aheadCraft.gamma + rad(params.alphaDeg), -0.9, 0.9);
      const plane2 = orbitPlane(aheadCraft, params.frame);
      const o2 = ringPoint(plane2, angs[i] + params.orbitRate * dt, params.orbitRadius);
      const next = { x: aheadCraft.x + o2.x, y: aheadCraft.y + o2.y, z: aheadCraft.z + o2.z };
      const vdes = {
        x: (next.x - goal.x) / dt,
        y: (next.y - goal.y) / dt,
        z: (next.z - goal.z) / dt,
      };
      seek(i, goal, vdes, o, dt, kp, kd);
    }
    enforceClearance();
  }

  function park(craft: Craft, phase: number): Vec {
    const plane = orbitPlane(craft, params.frame);
    const o = ringPoint(plane, phase + Math.PI / 2, params.orbitRadius * 2.3);
    return { x: craft.x + o.x, y: craft.y + o.y, z: craft.z + o.z };
  }

  function seek(i: number, goal: Vec, vdes: Vec, offset: Vec, dt: number, kp: number, kd: number) {
    const n = nodes[i];
    const w2 = params.orbitRate * params.orbitRate;
    let ax = kp * (goal.x - n.p.x) + kd * (vdes.x - n.v.x) - w2 * offset.x;
    let ay = kp * (goal.y - n.p.y) + kd * (vdes.y - n.v.y) - w2 * offset.y;
    let az = kp * (goal.z - n.p.z) + kd * (vdes.z - n.v.z) - w2 * offset.z;
    const am = Math.hypot(ax, ay, az);
    const cap = Math.max(5, params.aMax);
    if (am > cap) {
      const s = cap / am;
      ax *= s;
      ay *= s;
      az *= s;
    }
    n.a = Math.min(am, cap);
    n.v.x += ax * dt;
    n.v.y += ay * dt;
    n.v.z += az * dt;
    n.p.x += n.v.x * dt;
    n.p.y += n.v.y * dt;
    n.p.z += n.v.z * dt;
  }

  function updatePhase(dt: number) {
    const preset = params.phasePreset;
    const q = Math.exp(-Math.abs(gapErr) / Math.max(2, params.coherenceDeg));
    for (let i = 0; i < 3; i++) {
      if (params.mode === "phase-locked" && preset !== "drift" && preset !== "random") {
        const leak = (1 - q) * params.driftRate * (i - 1);
        nodes[i].slip += (-10 * q * nodes[i].slip + leak) * dt;
      } else if (preset === "drift") {
        nodes[i].slip += params.driftRate * i * dt;
      } else if (params.mode !== "phase-locked") {
        nodes[i].slip *= Math.exp(-3 * dt);
      }
    }
  }

  function measure() {
    const pair = params.phasePreset === "two-only";
    const plane = orbitPlane(ac, params.frame);
    const angs = nodes.map((n) => planeAngle(plane, { x: n.p.x - ac.x, y: n.p.y - ac.y, z: n.p.z - ac.z }));
    if (pair) {
      let sep = angs[1] - angs[0];
      sep = Math.atan2(Math.sin(sep), Math.cos(sep));
      gapErr = Math.abs(Math.abs(deg(sep)) - 180);
      gapMetric = "TWO-EMITTER PRESET — separation scored against 180°, not 120°. N3 is parked and dark.";
    } else {
      let worst = 0;
      for (let i = 0; i < 3; i++) {
        let g = angs[(i + 1) % 3] - angs[i];
        g = ((g % TAU) + TAU) % TAU;
        worst = Math.max(worst, Math.abs(deg(g) - 120));
      }
      gapErr = worst;
      gapMetric =
        params.spacing === "free"
          ? "Geometric spacing is scrambled on purpose. The 120° residual is a control readout, not the command."
          : "Worst pairwise gap minus 120°, measured about the true aircraft in the commanded plane.";
    }
    let worstTrack = 0;
    const active = pair ? 2 : 3;
    for (let i = 0; i < active; i++) {
      const s = slotOn(ac, i, phaseNow(), pair);
      const d = Math.hypot(nodes[i].p.x - s.x, nodes[i].p.y - s.y, nodes[i].p.z - s.z);
      worstTrack = Math.max(worstTrack, d);
    }
    trackErr = worstTrack;
    phaseErr = 0;
    for (let i = 0; i < active; i++) phaseErr = Math.max(phaseErr, Math.abs(deg(nodes[i].slip)));
  }

  function phaseNow() {
    return t * params.orbitRate;
  }

  function emPhase(i: number) {
    return offsets[i] + nodes[i].slip;
  }

  function dark(i: number) {
    return i >= params.activeCount;
  }

  function fieldScale() {
    return params.simulateAmplitude ? 1 : scale;
  }

  function bodyOf(rel: Vec, b: Basis): Vec {
    return {
      x: rel.x * b.rx + rel.y * b.ry + rel.z * b.rz,
      y: rel.x * b.ux + rel.y * b.uy + rel.z * b.uz,
      z: rel.x * b.fx + rel.y * b.fy + rel.z * b.fz,
    };
  }

  function clearedR(plane: OrbitPlane, b: Basis, angle: number, commanded: number) {
    const dir = ringPoint(plane, angle, 1);
    return minimumClearRadius(bodyOf(dir, b), commanded, SKIN_MARGIN_M);
  }

  function enforceClearance() {
    const plane = orbitPlane(ac, params.frame);
    const b = basisOf(ac.yaw, ac.pitch, ac.bank);
    for (let i = 0; i < 3; i++) {
      const rel = { x: nodes[i].p.x - ac.x, y: nodes[i].p.y - ac.y, z: nodes[i].p.z - ac.z };
      const gap = skinDistance(bodyOf(rel, b)).gap;
      if (gap >= SKIN_MARGIN_M) continue;
      const ang = planeAngle(plane, rel);
      const R = clearedR(plane, b, ang, params.orbitRadius);
      const o = ringPoint(plane, ang, R);
      nodes[i].p = { x: ac.x + o.x, y: ac.y + o.y, z: ac.z + o.z };
    }
  }

  function energyStep(dt: number) {
    const omega = TAU * params.freqHz;
    pAmp = solveDipoleMoment(params.eRef, params.freqHz, params.rRef);
    let pCmd = 0;
    for (let i = 0; i < 3; i++) {
      if (!dark(i)) pCmd += radiatedPower(pAmp, omega);
    }
    const eta = clamp(params.efficiency, 0.02, 1);
    const drawCmd = pCmd / eta;
    pDrawCmd = drawCmd;
    pBudget = eChem0 / Math.max(1, params.durationS);
    if (params.simulateAmplitude) {
      pDraw = drawCmd;
      limited = false;
      scale = 1;
      empty = eChem <= 1;
      pRad = drawCmd * eta;
      return;
    }
    empty = eChem <= 1;
    if (empty || drawCmd <= 0) {
      pDraw = 0;
      scale = 0;
      limited = empty && drawCmd > 0;
    } else if (params.enforceBudget) {
      pDraw = Math.min(drawCmd, pBudget);
      limited = drawCmd > pBudget * 1.02;
      scale = Math.sqrt(pDraw / drawCmd);
    } else {
      pDraw = drawCmd;
      limited = false;
      scale = 1;
    }
    const room = eChem / Math.max(dt, 1e-6);
    if (pDraw > room) {
      pDraw = room;
      scale = drawCmd > 0 ? Math.sqrt(pDraw / drawCmd) : 0;
      limited = true;
    }
    eChem = Math.max(0, eChem - pDraw * dt);
    if (eChem <= 1) {
      empty = true;
      scale = 0;
      pDraw = 0;
    }
    pRad = pDraw * eta;
  }

  function dipoles(momentScale?: number): Dipole[] {
    const delivered = momentScale ?? fieldScale();
    const el = rad(params.aimPitchDeg);
    const az = rad(params.aimYawDeg);
    const aim = {
      x: Math.cos(el) * Math.sin(az),
      y: Math.sin(el),
      z: Math.cos(el) * Math.cos(az),
    };
    return nodes.map((n, i) => {
      let ux = 0;
      let uy = 1;
      let uz = 0;
      if (params.orient === "aimed") {
        ux = aim.x;
        uy = aim.y;
        uz = aim.z;
      } else if (params.orient === "radial" || params.orient === "tangential") {
        let rx = n.p.x - ac.x;
        let ry = n.p.y - ac.y;
        let rz = n.p.z - ac.z;
        const rl = Math.hypot(rx, ry, rz) || 1;
        rx /= rl;
        ry /= rl;
        rz /= rl;
        if (params.orient === "radial") {
          ux = rx;
          uy = ry;
          uz = rz;
        } else {
          const plane = orbitPlane(ac, params.frame);
          ux = plane.ny * rz - plane.nz * ry;
          uy = plane.nz * rx - plane.nx * rz;
          uz = plane.nx * ry - plane.ny * rx;
          const tl = Math.hypot(ux, uy, uz) || 1;
          ux /= tl;
          uy /= tl;
          uz /= tl;
        }
      }
      return {
        x: n.p.x,
        y: n.p.y,
        z: n.p.z,
        ux,
        uy,
        uz,
        pAmp: dark(i) ? 0 : pAmp * delivered,
        phase: emPhase(i),
        dark: dark(i) || delivered <= 0,
      };
    });
  }

  function rel(p: Vec): Marker {
    return { x: p.x - ac.x, y: p.y - Y0, z: p.z - ac.z };
  }

  function paintField(dips: Dipole[]) {
    const span = Math.max(170, params.orbitRadius * 3.4);
    display.fieldSpan = span;
    const eRef = Math.max(params.eRef * Math.max(scale, 1e-4), 1e-3);
    const lo = Math.log10(eRef) - 2.4;
    const hi = Math.log10(eRef) + 1.15;
    const plane = orbitPlane(ac, params.frame);
    const at = (du: number, dv: number, ahead = 0): Vec => ({
      x: ac.x + plane.e1x * du + plane.e2x * dv + plane.nx * ahead,
      y: ac.y + plane.e1y * du + plane.e2y * dv + plane.ny * ahead,
      z: ac.z + plane.e1z * du + plane.e2z * dv + plane.nz * ahead,
    });
    let uIn = 0;
    let uOut = 0;
    let uMid = 0;
    const samples = 20;
    for (let s = 0; s < samples; s++) {
      const a = (s / samples) * TAU;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const rIn = params.orbitRadius * 0.42;
      const rMid = params.orbitRadius;
      const rOut = params.orbitRadius * 1.65;
      uIn += energyDensity(fieldAt(dips, at(c * rIn, sn * rIn), params.freqHz));
      uMid += energyDensity(fieldAt(dips, at(c * rMid, sn * rMid), params.freqHz));
      uOut += energyDensity(fieldAt(dips, at(c * rOut, sn * rOut), params.freqHz));
    }
    uIn /= samples;
    uMid /= samples;
    uOut /= samples;
    const u0 = energyDensity(fieldAt(dips, at(0, 0), params.freqHz));
    if (uMid > uOut * 4 && uIn < uMid * 0.85) {
      cage =
        "A ring-like interference maximum sits near the orbital radius, in the face of the disk. That is source neighborhoods plus overlap. It is not a cage and not a tunnel.";
    } else {
      cage =
        "No coherence cage. Cycle-average energy density on the orbital face is dominated by the three source neighborhoods, not by a closed shell.";
    }
    if (u0 < uIn * 0.35) centerNote = "Face-center interference is weak or destructive relative to the inner ring. Still ordinary superposition.";
    else if (u0 > uIn * 1.25) centerNote = "Face-center interference is constructive relative to the inner ring. Still ordinary superposition.";
    else centerNote = "Face-center energy density is comparable to the inner ring. Not a shell, not a bore in the metric sense.";

    for (let j = 0; j < FIELD_N; j++) {
      for (let i = 0; i < FIELD_N; i++) {
        const u = i / (FIELD_N - 1) - 0.5;
        const v = j / (FIELD_N - 1) - 0.5;
        const p = at(u * span, v * span);
        const f = fieldAt(dips, p, params.freqHz);
        const idx = (j * FIELD_N + i) * 4;
        if (f.invalid) {
          field[idx] = 7;
          field[idx + 1] = 11;
          field[idx + 2] = 16;
          field[idx + 3] = 0;
          continue;
        }
        const e = emagnitude(f);
        const g = clamp((Math.log10(e + 1e-12) - lo) / (hi - lo), 0, 1);
        const r = g < 0.55 ? lerp(7, 61, g / 0.55) : lerp(61, 244, (g - 0.55) / 0.45);
        const gv = g < 0.55 ? lerp(11, 139, g / 0.55) : lerp(139, 247, (g - 0.55) / 0.45);
        const bch = g < 0.55 ? lerp(16, 253, g / 0.55) : lerp(253, 251, (g - 0.55) / 0.45);
        field[idx] = r;
        field[idx + 1] = gv;
        field[idx + 2] = bch;
        field[idx + 3] = 200;
      }
    }

    const peak = cyclePeakNearDipoles(dips, params.freqHz);
    ePeak = peak.ePeak;
    bPeak = peak.bPeak;
    fieldWhere = peak.where;

    const side = 7;
    let ai = 0;
    let maxS = 1e-12;
    const raw: Vec[] = [];
    for (let j = 0; j < side; j++) {
      for (let i = 0; i < side; i++) {
        const u = i / (side - 1) - 0.5;
        const v = j / (side - 1) - 0.5;
        const p = at(u * span * 0.86, v * span * 0.86, 1.4);
        const f = fieldAt(dips, p, params.freqHz);
        const s = poynting(f);
        raw.push(s);
        maxS = Math.max(maxS, Math.hypot(s.x, s.y, s.z));
      }
    }
    for (let j = 0; j < side; j++) {
      for (let i = 0; i < side; i++) {
        const u = i / (side - 1) - 0.5;
        const v = j / (side - 1) - 0.5;
        const s = raw[ai];
        const mag = Math.hypot(s.x, s.y, s.z);
        const len = mag <= 0 ? 0 : (mag / maxS) * params.orbitRadius * 0.18;
        const inv = mag > 0 ? len / mag : 0;
        const p = at(u * span * 0.86, v * span * 0.86, 1.4);
        const arrow = arrows[ai];
        arrow.x = p.x - ac.x;
        arrow.y = p.y - Y0;
        arrow.z = p.z - ac.z;
        arrow.dx = s.x * inv;
        arrow.dy = s.y * inv;
        arrow.dz = s.z * inv;
        ai++;
      }
    }
    display.fieldRev++;
  }

  function marchRays(dips: Dipole[]) {
    rays.length = 0;
    nPeakRaw = 1;
    nPeakMarch = 1;
    if (!params.rayMode) return;
    const span = display.fieldSpan;
    const ds = Math.max(3, params.orbitRadius * 0.08);
    const steps = 56;
    const eScale = Math.max(params.eRef, 1);
    const uScale = (8.854187817e-12 * eScale * eScale) / 4;
    const nAt = (p: Vec) => {
      const f = fieldAt(dips, p, params.freqHz);
      const e = Math.sqrt(
        f.exR * f.exR + f.exI * f.exI + f.eyR * f.eyR + f.eyI * f.eyI + f.ezR * f.ezR + f.ezI * f.ezI,
      );
      const u = energyDensity(f);
      let raw = 1;
      if (params.constitutive === "e2") raw = 1 + params.dnAlpha * (e / eScale) ** 2;
      else if (params.constitutive === "energy") raw = 1 + params.dnAlpha * (u / uScale);
      nPeakRaw = Math.max(nPeakRaw, raw);
      const clamped = clamp(raw, 0.25, 4);
      nPeakMarch = Math.max(nPeakMarch, clamped);
      return clamped;
    };
    const grad = (p: Vec) => {
      const e = 3;
      const dx = nAt({ x: p.x + e, y: p.y, z: p.z }) - nAt({ x: p.x - e, y: p.y, z: p.z });
      const dy = nAt({ x: p.x, y: p.y + e, z: p.z }) - nAt({ x: p.x, y: p.y - e, z: p.z });
      const dz = nAt({ x: p.x, y: p.y, z: p.z + e }) - nAt({ x: p.x, y: p.y, z: p.z - e });
      return { x: dx / (2 * e), y: dy / (2 * e), z: dz / (2 * e) };
    };
    const body = basisOf(ac.yaw, ac.pitch, ac.bank);
    const plane = orbitPlane(ac, params.frame);
    for (let r = 0; r < 5; r++) {
      const x0 = ((r - 2) / 4) * span * 0.55;
      let x = ac.x - body.fx * span * 0.48 + plane.e1x * x0;
      let y = ac.y - body.fy * span * 0.48 + plane.e1y * x0;
      let z = ac.z - body.fz * span * 0.48 + plane.e1z * x0;
      let dx = body.fx;
      let dy = body.fy;
      let dz = body.fz;
      const pts = new Float32Array((steps + 1) * 3);
      for (let s = 0; s <= steps; s++) {
        pts[s * 3] = x - ac.x;
        pts[s * 3 + 1] = y - Y0;
        pts[s * 3 + 2] = z - ac.z;
        if (s === steps) break;
        const n = nAt({ x, y, z });
        const g = grad({ x, y, z });
        let tx = n * dx + g.x * ds;
        let ty = n * dy + g.y * ds;
        let tz = n * dz + g.z * ds;
        const tl = Math.hypot(tx, ty, tz) || 1;
        dx = tx / tl;
        dy = ty / tl;
        dz = tz / tl;
        x += dx * ds;
        y += dy * ds;
        z += dz * ds;
      }
      rays.push(pts);
    }
  }

  function recordBore() {
    const plane = orbitPlane(ac, params.frame);
    const ring = new Float32Array(BORE_RING * 3);
    for (let k = 0; k < BORE_RING; k++) {
      const full = ringPoint(plane, (k / BORE_RING) * TAU, params.orbitRadius);
      ring[k * 3] = ac.x + full.x;
      ring[k * 3 + 1] = ac.y + full.y;
      ring[k * 3 + 2] = ac.z + full.z;
    }
    boreHist.push({
      t,
      phase: phaseNow(),
      ring,
      nodes: nodes.map((n) => ({ x: n.p.x, y: n.p.y, z: n.p.z })),
    });
    while (boreHist.length && t - boreHist[0].t > params.historyS + 0.05) boreHist.shift();
    while (boreHist.length > BORE_MAX) boreHist.shift();
  }

  function syncBore() {
    while (boreHist.length && t - boreHist[0].t > params.historyS) boreHist.shift();
    const n = Math.min(boreHist.length, BORE_MAX);
    const start = boreHist.length - n;
    display.boreCount = n;
    display.boreOn = params.showBore;
    display.vacuumBore = params.vacuumBore;
    display.pitchMark.fill(0);
    for (let s = 0; s < n; s++) {
      const sample = boreHist[start + s];
      display.boreAge[s] = Math.max(0, t - sample.t);
      display.borePhase[s] = sample.phase;
      for (let k = 0; k < BORE_RING; k++) {
        const o = s * BORE_RING + k;
        display.boreRings[o * 3] = sample.ring[k * 3] - ac.x;
        display.boreRings[o * 3 + 1] = sample.ring[k * 3 + 1] - Y0;
        display.boreRings[o * 3 + 2] = sample.ring[k * 3 + 2] - ac.z;
      }
      for (let i = 0; i < 3; i++) {
        const p = sample.nodes[i];
        const o = (i * BORE_MAX + s) * 3;
        display.boreNodes[o] = p.x - ac.x;
        display.boreNodes[o + 1] = p.y - Y0;
        display.boreNodes[o + 2] = p.z - ac.z;
      }
    }
    markPitch(n);
    const plane = orbitPlane(ac, params.frame);
    const speed = Math.hypot(ac.vx, ac.vy, ac.vz);
    const lead =
      params.vacuumBore && speed > 2 ? Math.min(params.orbitRadius * 0.8, Math.max(12, speed * 0.28)) : 0;
    display.leadCount = lead > 0 ? BORE_LEAD : 0;
    if (lead > 0) {
      for (let s = 0; s < BORE_LEAD; s++) {
        const dist = lead * ((s + 1) / BORE_LEAD);
        for (let k = 0; k < BORE_RING; k++) {
          const o = ringPoint(plane, (k / BORE_RING) * TAU, params.orbitRadius);
          const idx = (s * BORE_RING + k) * 3;
          display.leadRings[idx] = o.x + plane.nx * dist;
          display.leadRings[idx + 1] = ac.y - Y0 + o.y + plane.ny * dist;
          display.leadRings[idx + 2] = o.z + plane.nz * dist;
        }
      }
    }
  }

  function markPitch(n: number) {
    const kin = boreKinematics(Math.hypot(ac.vx, ac.vy, ac.vz), params.orbitRate, params.orbitRadius);
    if (!Number.isFinite(kin.dz120) || kin.dz120 <= 0 || n === 0) return;
    const plane = orbitPlane(ac, params.frame);
    const axial = new Float64Array(n);
    for (let s = 0; s < n; s++) {
      let cx = 0;
      let cy = 0;
      let cz = 0;
      for (let k = 0; k < BORE_RING; k++) {
        const o = (s * BORE_RING + k) * 3;
        cx += display.boreRings[o];
        cy += display.boreRings[o + 1];
        cz += display.boreRings[o + 2];
      }
      const inv = 1 / BORE_RING;
      axial[s] = (cx * inv) * plane.nx + (cy * inv) * plane.ny + (cz * inv) * plane.nz;
    }
    const origin = axial[n - 1];
    let behind = 0;
    for (let s = 0; s < n; s++) behind = Math.max(behind, origin - axial[s]);
    const dz = kin.dz120;
    const tol = Math.max(dz * 0.45, Math.hypot(ac.vx, ac.vy, ac.vz) * 0.06, 4);
    const maxK = Math.min(24, Math.floor(behind / dz));
    for (let k = 1; k <= maxK; k++) {
      const target = origin - k * dz;
      let best = -1;
      let bestD = tol;
      for (let s = 0; s < n; s++) {
        const d = Math.abs(axial[s] - target);
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      if (best >= 0) display.pitchMark[best] = 1;
    }
  }

  function boreReadout(gs: number) {
    const kin = boreKinematics(gs, params.orbitRate, params.orbitRadius);
    const aOrbit = params.orbitRate * params.orbitRate * params.orbitRadius;
    const cap =
      params.mode !== "scripted" && aOrbit > params.aMax * 1.05
        ? ` Centripetal demand is ${aOrbit.toFixed(0)} m/s², above the accel cap. Closed-loop nodes leave the ring. Scripted placement does not.`
        : "";
    const lrevText = Number.isFinite(kin.lRev) ? `${kin.lRev.toFixed(0)} m` : "∞";
    const dzText = Number.isFinite(kin.dz120) ? `${kin.dz120.toFixed(0)} m` : "∞";
    const csText = Number.isFinite(kin.cSweep) ? kin.cSweep.toFixed(2) : "—";
    const coarse =
      Number.isFinite(kin.dz120) && gs * 0.08 > kin.dz120 * 0.9
        ? " Stored history is coarser than Δz120, so pitch rings cannot show every sample."
        : "";
    return {
      lRev: kin.lRev,
      dz120: kin.dz120,
      cSweep: kin.cSweep,
      boreRatio: kin.ratio,
      boreDiam: kin.diam,
      boreRegime: kin.regime,
      frameNote: frameNote(params.frame),
      aOrbit,
      boreNote: `${frameNote(params.frame)} Δz120 = Lrev/3 = ${dzText}. Csweep = 2R/Δz120 = 6R/Lrev = ${csText}. Csweep is a geometric sampling/overlap metric, not a physical coherence threshold, and not an input to the field solver. Lrev = ${lrevText}. 2R = ${kin.diam.toFixed(0)} m. Bins at Csweep = 1 and 3 only mark the diameter and one turn per diameter. ${kin.regime}${cap}${coarse}`,
    };
  }

  function syncPose() {
    const dipsAxes = basisOf(ac.yaw, ac.pitch, ac.bank);
    display.quat = quatFromBasis(dipsAxes);
    display.acY = ac.y - Y0;
    display.acx = ac.x;
    display.acz = ac.z;
    const phase = phaseNow();
    const pair = params.phasePreset === "two-only";
    const bb = orbitPlane(ac, params.frame);
    const skinBasis = basisOf(ac.yaw, ac.pitch, ac.bank);
    display.plane = bb;
    for (let i = 0; i < GUIDE_N; i++) {
      const ang = (i / GUIDE_N) * TAU;
      const o = ringPoint(bb, ang, clearedR(bb, skinBasis, ang, params.orbitRadius));
      guide[i * 3] = o.x;
      guide[i * 3 + 1] = ac.y - Y0 + o.y;
      guide[i * 3 + 2] = o.z;
    }
    for (let k = 0; k < BORE_RING; k++) {
      const o = ringPoint(bb, (k / BORE_RING) * TAU, params.orbitRadius);
      display.nowRing[k * 3] = o.x;
      display.nowRing[k * 3 + 1] = ac.y - Y0 + o.y;
      display.nowRing[k * 3 + 2] = o.z;
    }
    const sp = Math.hypot(ac.vx, ac.vy, ac.vz);
    const vlen = sp < 0.5 ? 0 : Math.min(72, Math.max(18, sp * 0.4));
    display.vel = sp < 0.5 ? { x: 0, y: 0, z: 0 } : { x: (ac.vx / sp) * vlen, y: (ac.vy / sp) * vlen, z: (ac.vz / sp) * vlen };
    for (let i = 0; i < 3; i++) {
      display.nodes[i] = rel(nodes[i].p);
      display.nodeDark[i] = dark(i);
      const slot = pair && i === 2 ? park(ac, phase) : slotOn(ac, i, phase, pair);
      display.slots[i] = rel(slot);
      const pre = pair && i === 2 ? park(nominal, phase) : slotOn(nominal, i, phase, pair);
      display.predetermined[i] = rel(pre);
    }
    display.ground = rel({ x: -220, y: Y0 - 30, z: -320 });
    display.showField = params.showField;
    display.showPoynting = params.showPoynting;
    display.showPredetermined = params.showPredetermined;
    display.plasma = params.plasmaCosmetic && params.ashton;
    display.anchorBearing = rad(params.anchorBearing);
    if (params.anchor && params.ashton) {
      const dist = params.anchorKm * 1000;
      const br = rad(params.anchorBearing);
      display.ghost = rel({ x: Math.sin(br) * dist, y: Y0, z: Math.cos(br) * dist });
      display.ghostOn = true;
      display.ghostFar = Math.hypot(display.ghost.x, display.ghost.z) > 6000;
    } else {
      display.ghostOn = false;
      display.ghostFar = true;
    }
    const imported = sampleImport(Math.max(0, t - params.timeOffsetS));
    display.importOn = !!imported;
    display.importNodes = [];
    display.importAc = null;
    if (imported) {
      display.importAc = rel({ x: imported.ax, y: imported.ay, z: imported.az });
      if (imported.n) {
        for (const p of imported.n) display.importNodes.push(rel({ x: p[0], y: p[1], z: p[2] }));
      }
    }
    syncBore();
  }

  function refreshVisuals() {
    syncPose();
    const dips = dipoles();
    if (params.showField || params.showPoynting) paintField(dips);
    else {
      const peak = cyclePeakNearDipoles(dips, params.freqHz);
      ePeak = peak.ePeak;
      bPeak = peak.bPeak;
      fieldWhere = peak.where;
    }
    if (params.rayMode) marchRays(dips);
    else rays.length = 0;
  }

  function sampleImport(time: number) {
    if (!importTrack || importTrack.samples.length === 0) return null;
    const s = importTrack.samples;
    if (time < s[0].t || time > s[s.length - 1].t) return null;
    let i = 0;
    while (i < s.length - 1 && s[i + 1].t < time) i++;
    const a = s[i];
    const b = s[Math.min(s.length - 1, i + 1)];
    const u = b.t === a.t ? 0 : (time - a.t) / (b.t - a.t);
    const lerpN = (k: number) => {
      if (!a.n || !b.n) return undefined;
      return [
        a.n[k][0] + (b.n[k][0] - a.n[k][0]) * u,
        a.n[k][1] + (b.n[k][1] - a.n[k][1]) * u,
        a.n[k][2] + (b.n[k][2] - a.n[k][2]) * u,
      ];
    };
    return {
      ax: a.ax + (b.ax - a.ax) * u,
      ay: a.ay + (b.ay - a.ay) * u,
      az: a.az + (b.az - a.az) * u,
      n: a.n && b.n ? [lerpN(0)!, lerpN(1)!, lerpN(2)!] : undefined,
    };
  }

  function separations(): [number, number, number] {
    const cam = camera;
    const ang = (i: number, j: number) => {
      const a = nodes[i].p;
      const b = nodes[j].p;
      const ax = a.x - cam.x;
      const ay = a.y - cam.y;
      const az = a.z - cam.z;
      const bx = b.x - cam.x;
      const by = b.y - cam.y;
      const bz = b.z - cam.z;
      const al = Math.hypot(ax, ay, az) || 1;
      const bl = Math.hypot(bx, by, bz) || 1;
      const d = clamp((ax * bx + ay * by + az * bz) / (al * bl), -1, 1);
      return deg(Math.acos(d));
    };
    return [ang(0, 1), ang(1, 2), ang(2, 0)];
  }

  function step(dt: number) {
    if (params.phasePreset !== presetToken) {
      onPreset(params.phasePreset);
      presetToken = params.phasePreset;
    }
    syncPhaseOffsets();
    integrateCraft(dt);
    t += dt;
    updatePhase(dt);
    moveNodes(dt, phaseNow());
    measure();
    energyStep(dt);
    buffer.push({
      t,
      ac: { ...ac },
      nodes: nodes.map((n) => ({ ...n.p })),
    });
    if (buffer.length > 400) buffer.shift();
    histAcc += dt;
    visualAcc += dt;
    boreAcc += dt;
    if (boreAcc >= 0.08) {
      boreAcc = 0;
      recordBore();
    }
    if (histAcc >= 0.1) {
      histAcc = 0;
      const chi = ePeak / ES;
      history.push({
        t,
        track: trackErr,
        gap: gapErr,
        phase: phaseErr,
        ePeak,
        chiLog: Math.log10(Math.max(chi, 1e-30)),
        energy: eChem0 > 0 ? eChem / eChem0 : 0,
      });
      if (history.length > 240) history.shift();
    }
    if (visualAcc >= 0.12) {
      visualAcc = 0;
      refreshVisuals();
    } else {
      syncPose();
    }
  }

  function acquisition(): Snapshot["acquisition"] {
    if (!params.drew) return "OFF";
    if (trackErr > 35 || gapErr > 30) return "SEARCH";
    if (gapErr > params.coherenceDeg) return "ACQUIRE";
    if (params.mode === "phase-locked" && phaseErr > 12) return "TRACK";
    if (params.mode !== "phase-locked") return "TRACK";
    return "PHASE-LOCK";
  }

  function snapshot(): Snapshot {
    const chi = ePeak / ES;
    const gainOn = params.ashton && params.vacuumGain > 1;
    const gain = gainOn ? params.vacuumGain : 1;
    const chiLog = Math.log10(Math.max(chi, 1e-30));
    const gs = Math.hypot(ac.vx, ac.vy, ac.vz);
    const imported = sampleImport(Math.max(0, t - params.timeOffsetS));
    let importResidual = 0;
    if (imported) {
      importResidual = Math.hypot(imported.ax - ac.x, imported.ay - ac.y, imported.az - ac.z);
    }
    const fAlias = aliasHz(Math.abs(params.orbitRate) / TAU, params.cadenceHz);
    const nodeReads: NodeReadout[] = nodes.map((n, i) => {
      const dx = n.p.x - ac.x;
      const dz = n.p.z - ac.z;
      const slot = slotOn(ac, i, phaseNow(), params.phasePreset === "two-only" && i < 2);
      const err =
        dark(i) && params.phasePreset === "two-only"
          ? 0
          : Math.hypot(n.p.x - slot.x, n.p.y - slot.y, n.p.z - slot.z);
      return {
        id: i + 1,
        x: n.p.x,
        y: n.p.y,
        z: n.p.z,
        range: Math.hypot(n.p.x - ac.x, n.p.y - ac.y, n.p.z - ac.z),
        bearingDeg: deg(Math.atan2(dx, dz)),
        speed: Math.hypot(n.v.x, n.v.y, n.v.z),
        accel: n.a,
        orbitDeg: (deg(angleOf(i, phaseNow(), params.phasePreset === "two-only")) + 3600) % 360,
        emDeg: (deg(emPhase(i)) + 3600) % 360,
        freqHz: params.freqHz,
        ampVm: dark(i) ? 0 : params.eRef * scale,
        trackErr: err,
        latencyMs: params.mode === "scripted" ? 0 : params.latencyMs,
        dark: dark(i),
      };
    });
    return {
      t,
      running: params.running,
      mode: params.mode,
      altitude: ac.y,
      tas: ac.speed,
      groundSpeed: gs,
      bankDeg: deg(ac.bank),
      pitchDeg: deg(ac.pitch),
      alphaDeg: params.alphaDeg,
      betaDeg: params.betaDeg,
      yawDeg: (deg(ac.yaw) + 3600) % 360,
      maneuverLeft: maneuver,
      nodes: nodeReads,
      gapErrDeg: gapErr,
      gapMetric,
      trackErr,
      phaseErrDeg: phaseErr,
      latencyMs: params.latencyMs,
      acquisition: acquisition(),
      lockNote:
        params.mode === "phase-locked"
          ? "PLL gain falls when the geometric gap exceeds the coherence threshold. Lock is a classifier of this model, not a claimed onboard computer."
          : "Emitter phase is open-loop. PHASE LOCKED mode is what closes it.",
      ePeak,
      bPeak,
      eCommanded: scale > 1e-6 ? ePeak / scale : ePeak,
      chi,
      chiLog,
      ordersShort: -chiLog,
      gainRequired: chi > 0 ? 1 / chi : Infinity,
      chiHyp: chi * gain,
      pAmp: pAmp * scale,
      pRad,
      pDraw,
      pBudget,
      eChem,
      eChem0,
      scale,
      limited,
      empty,
      timeToEmptyCmd: pDrawCmd > 1 ? eChem0 / pDrawCmd : Infinity,
      timeToEmptyNow: pDraw > 1 ? eChem / pDraw : Infinity,
      cage,
      centerNote,
      nPeakRaw,
      nPeakMarch,
      sepDeg: separations(),
      cadenceNote: `Orbital frequency aliases to ${fAlias.toFixed(2)} Hz at ${params.cadenceHz.toFixed(0)} samples/s. A camera at that cadence would not show the true scan rate.`,
      obsAge: params.timeOffsetS,
      importProvenance: importTrack?.provenance ?? "",
      importCount: importTrack?.samples.length ?? 0,
      importResidual,
      overlap: "",
      history: history.slice(),
      fieldNote: `ILLUSTRATIVE linear Maxwell superposition of the sources where they are now. Mutual impedance omitted. ${fieldWhere}. SOURCE LOCUS: the three helices are emitter histories, not integral curves of E or ⟨S⟩, and not a tunnel. FIELD STRUCTURE: the face is cycle-amplitude |Ẽ|; the arrows are cycle-average Poynting ⟨S⟩. Past positions are not extra radiators. Δz120 and Csweep do not enter this solver.`,
      ...boreReadout(gs),
      ...(() => {
        const sweep = liveSweep(gs);
        return { sweep: sweep.rows, sweepVerdict: sweep.verdict };
      })(),
      qed: qedReadout(),
      clearance: clearanceReadout(),
      ...saturationOf(),
      axes: axisTelemetry(),
    };
  }

  function axisTelemetry() {
    const body = basisOf(ac.yaw, ac.pitch, ac.bank);
    const plane = orbitPlane(ac, params.frame);
    const br = rad(params.anchorBearing);
    const dest = { x: Math.sin(br), y: 0, z: Math.cos(br) };
    const bore = { x: plane.nx, y: plane.ny, z: plane.nz };
    const nose = { x: body.fx, y: body.fy, z: body.fz };
    const sp = Math.hypot(ac.vx, ac.vy, ac.vz);
    const vel = sp < 0.4 ? { x: 0, y: 0, z: 0 } : { x: ac.vx / sp, y: ac.vy / sp, z: ac.vz / sp };
    return {
      boreDestDeg: angleBetween(bore, dest),
      bodyDestDeg: angleBetween(nose, dest),
      velDestDeg: angleBetween(vel, dest),
      note: "Geometry only. Bore is the current orbit-plane normal, body is the nose, velocity is the kinematic velocity, destination is the horizontal anchor bearing. These angles do not enter Maxwell, the pair estimate, the energy ledger, or the controller. Alignment is not a transport law.",
    };
  }

  function saturationOf() {
    const aOrbit = params.orbitRate * params.orbitRate * params.orbitRadius;
    const demandRatio = aOrbit / Math.max(params.aMax, 1e-6);
    const saturated = demandRatio > 1.05;
    const ratio = demandRatio.toFixed(2);
    const saturationNote = !saturated
      ? `ω²R / a_max = ${ratio}. Centripetal demand is inside the acceleration cap.`
      : params.mode === "scripted"
        ? `CONTROL SATURATED. ω²R / a_max = ${ratio} (${aOrbit.toFixed(0)} / ${params.aMax.toFixed(0)} m/s²). Scripted placement does not apply the cap, so this ratio does not move the nodes and it is not airframe clearance.`
        : `CONTROL SATURATED. ω²R / a_max = ${ratio} (${aOrbit.toFixed(0)} / ${params.aMax.toFixed(0)} m/s²). The loop cannot supply the curvature, so the nodes leave the ring. That excursion is tracking, not airframe clearance.`;
    return { saturated, demandRatio, saturationNote };
  }

  function qedReadout() {
    const live = sampleStrongField(dipoles(), params.freqHz);
    let commandedE = live.ePeak;
    if (!params.simulateAmplitude && scale > 1e-6 && scale < 0.999) commandedE = live.ePeak / scale;
    else if (!params.simulateAmplitude && scale <= 1e-6) {
      commandedE = sampleStrongField(dipoles(1), params.freqHz).ePeak;
    }
    const b = basisOf(ac.yaw, ac.pitch, ac.bank);
    const rel = { x: live.where.x - ac.x, y: live.where.y - ac.y, z: live.where.z - ac.z };
    const body = bodyOf(rel, b);
    const skin = skinDistance(body);
    const skinText =
      skin.gap >= 0
        ? `${skin.gap.toFixed(1)} m outside the ${skin.part}`
        : `${(-skin.gap).toFixed(1)} m inside the ${skin.part} — the r = 4 m exclusion sample is an idealization, not a field inside the airplane`;
    return {
      ePeak: live.ePeak,
      bPeak: live.bPeak,
      eOverEs: live.eOverEs,
      cBOverEs: live.cBOverEs,
      F: live.F,
      G: live.G,
      eps: live.eps,
      beta: live.beta,
      regime: live.regime,
      regimeNote: live.regimeNote,
      rate: live.pair.rate,
      exponent: live.pair.exponent,
      rateApplicable: live.pair.applicable,
      pairNote: live.pair.note,
      where: `Exclusion surface of node ${live.node + 1}. Body (${body.x.toFixed(1)}, ${body.y.toFixed(1)}, ${body.z.toFixed(1)}) m. ${skinText}.`,
      hardware: live.hardware,
      commandedE,
      commandedHardware: hardwareClass(commandedE),
      simulated: params.simulateAmplitude,
    };
  }

  function clearanceReadout() {
    const b = basisOf(ac.yaw, ac.pitch, ac.bank);
    const plane = orbitPlane(ac, params.frame);
    const pair = params.phasePreset === "two-only";
    const phase = phaseNow();
    let minGap = Infinity;
    let nearest = "none";
    const actual: [number, number, number] = [0, 0, 0];
    const clear: [number, number, number] = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      const rel = { x: nodes[i].p.x - ac.x, y: nodes[i].p.y - ac.y, z: nodes[i].p.z - ac.z };
      const skin = skinDistance(bodyOf(rel, b));
      actual[i] = Math.hypot(rel.x, rel.y, rel.z);
      if (skin.gap < minGap) {
        minGap = skin.gap;
        nearest = skin.part;
      }
      const parked = pair && i === 2;
      const ang = parked ? phase + Math.PI / 2 : angleOf(i, phase, pair && i < 2);
      const commandedSlot = parked ? params.orbitRadius * 2.3 : params.orbitRadius;
      clear[i] = clearedR(plane, b, ang, commandedSlot);
    }
    const orbital = pair ? [0, 1] : [0, 1, 2];
    const split = splitRadii(
      params.orbitRadius,
      orbital.map((i) => clear[i]),
      orbital.map((i) => actual[i]),
    );
    return {
      margin: SKIN_MARGIN_M,
      minGap,
      nearest,
      commandedR: split.commandedR,
      clearR: split.clearR,
      actualR: split.actualR,
      actual,
      clear,
      clearanceRaised: split.clearanceRaised,
      tracking: split.tracking,
      note: `${split.note} Nearest skin: ${nearest}, gap ${minGap.toFixed(1)} m. Margin ${SKIN_MARGIN_M.toFixed(1)} m.`,
    };
  }

  function schwingerSweep() {
    const base = sampleStrongField(dipoles(1), params.freqHz);
    const sweep = sweepCommanded(base, params.eRef);
    return {
      t,
      radius: params.orbitRadius,
      omega: params.orbitRate,
      speed: params.speed,
      freqHz: params.freqHz,
      orient: params.orient,
      activeCount: params.activeCount,
      phaseA: params.phaseA,
      phaseB: params.phaseB,
      phaseC: params.phaseC,
      frame: params.frame,
      mode: params.mode,
      points: sweep.points,
      simulatedAboveE0: sweep.simulatedAboveE0,
      note:
        sweep.points.length === 0
          ? "No commanded field to scale. The sweep did not run, and the vacuum bore was not touched."
          : "Aircraft, controller, and geometry are frozen at this click. Only commanded E0 changes, by linear scaling of one Hertzian solution. The pair column is the constant-field approximation. E/Es = 1 does not arm the vacuum bore, a metric, a displacement, or a portal.",
    };
  }

  function liveSweep(gs: number) {
    const kin = boreKinematics(gs, params.orbitRate, params.orbitRadius);
    const moment = solveDipoleMoment(params.eRef, params.freqHz, params.rRef) * fieldScale();
    return evaluateSweep({
      origin: { x: ac.x, y: ac.y, z: ac.z },
      plane: orbitPlane(ac, params.frame),
      radius: params.orbitRadius,
      freqHz: params.freqHz,
      pAmp: moment,
      orient: params.orient,
      aimYawDeg: params.aimYawDeg,
      aimPitchDeg: params.aimPitchDeg,
      lRev: kin.lRev,
    });
  }

  reset();

  return {
    params,
    display,
    camera,
    setParams(next: Params) {
      const tankChange = next.massKg !== params.massKg || next.specificWh !== params.specificWh;
      const fraction = eChem0 > 0 ? eChem / eChem0 : 1;
      Object.assign(params, next);
      if (tankChange) {
        eChem0 = tank0(params);
        eChem = clamp(fraction, 0, 1) * eChem0;
      }
    },
    step,
    reset,
    clearHistory,
    triggerManeuver() {
      maneuver = 14;
    },
    applyExperiment(kind: Experiment) {
      if (kind === "spin") {
        params.speed = 0;
        if (Math.abs(params.orbitRate) < 0.05) params.orbitRate = 1.2;
        ac.speed = 0;
        pertX = pertY = pertZ = 0;
        writeVelocity();
      } else if (kind === "translate") {
        params.orbitRate = 0;
        if (params.speed < 5) params.speed = 80;
        ac.speed = params.speed;
        writeVelocity();
      } else if (kind === "both") {
        if (params.speed < 5) params.speed = 80;
        if (Math.abs(params.orbitRate) < 0.05) params.orbitRate = 1.2;
        ac.speed = params.speed;
        writeVelocity();
      } else if (kind === "reverse") {
        params.orbitRate = -params.orbitRate;
      } else if (kind === "scramble-phase") {
        params.phasePreset = "random";
        params.phaseA = deg(rng() * TAU);
        params.phaseB = deg(rng() * TAU);
        params.phaseC = deg(rng() * TAU);
        onPreset("random");
        presetToken = "random";
      } else if (kind === "scramble-space") {
        params.spacing = "free";
        geoOff[0] = rng() * TAU;
        geoOff[1] = rng() * TAU;
        geoOff[2] = rng() * TAU;
      } else if (kind === "drop-node") {
        params.phasePreset = "one-off";
        onPreset("one-off");
        presetToken = "one-off";
      } else if (kind === "restore") {
        params.spacing = "equal";
        params.phasePreset = "triad";
        onPreset("triad");
        presetToken = "triad";
        geoOff[0] = 0;
        geoOff[1] = TAU / 3;
        geoOff[2] = (2 * TAU) / 3;
      }
      boreHist.length = 0;
      boreAcc = 0;
      recordBore();
      refreshVisuals();
    },
    loadImport(track: ImportTrack | null) {
      importTrack = track;
      refreshVisuals();
    },
    snapshot,
    now() {
      return t;
    },
    poke() {
      refreshVisuals();
    },
    schwingerSweep,
  };
}

function tank0(p: Params) {
  return Math.max(0, p.massKg) * Math.max(0, p.specificWh) * 3600;
}

function lerp(a: number, b: number, u: number) {
  return a + (b - a) * u;
}

function angleBetween(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  const al = Math.hypot(a.x, a.y, a.z);
  const bl = Math.hypot(b.x, b.y, b.z);
  if (al < 1e-8 || bl < 1e-8) return Number.NaN;
  const d = (a.x * b.x + a.y * b.y + a.z * b.z) / (al * bl);
  return deg(Math.acos(Math.max(-1, Math.min(1, d))));
}

function aliasHz(f: number, sample: number) {
  if (sample <= 0) return f;
  let x = Math.abs(f) % sample;
  if (x > sample / 2) x = sample - x;
  return x;
}

export const engine = createEngine();

export function nominalFixture(): ImportTrack {
  const samples = [];
  const R = 48;
  const speed = 250;
  for (let i = 0; i <= 50; i++) {
    const time = i * 0.5;
    const z = speed * time;
    const n = [0, 1, 2].map((k) => {
      const a = (k * TAU) / 3;
      return [R * Math.cos(a), Y0, z + R * Math.sin(a)];
    });
    samples.push({ t: time, ax: 0, ay: Y0, az: z, n });
  }
  return {
    provenance:
      "Synthetic nominal fixture written by TRIAD. Not video, not a reconstruction, not evidence. Nodes translate with a straight track and do not orbit.",
    samples,
  };
}
