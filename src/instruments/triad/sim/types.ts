import type { SweepRow } from "./sampling.ts";

export type Mode = "scripted" | "tracking" | "networked" | "phase-locked";

export type PhasePreset = "zero" | "triad" | "random" | "drift" | "one-off" | "two-only" | "manual";

export type Orient = "vertical" | "radial" | "tangential" | "aimed";

/** Orbital-plane normal.
 *  world — world up (level ring)
 *  body — body up (ring banks with attitude)
 *  velocity — instantaneous velocity
 *  bore — body forward (disk faces the nose)
 */
export type GeoFrame = "world" | "body" | "velocity" | "bore";

export type Spacing = "equal" | "free";

export type HistoryWindow = 1 | 2 | 5 | 10;

export type Experiment =
  | "spin"
  | "translate"
  | "both"
  | "reverse"
  | "scramble-phase"
  | "scramble-space"
  | "drop-node"
  | "restore";

export type Viewpoint = "chase" | "overhead" | "starboard" | "nose" | "node" | "ground";

export type Constitutive = "vacuum" | "e2" | "energy";

export type Params = {
  running: boolean;
  timeScale: number;
  mode: Mode;
  latencyMs: number;
  orbitRadius: number;
  orbitRate: number;
  frame: GeoFrame;
  spacing: Spacing;
  historyS: HistoryWindow;
  showBore: boolean;
  vacuumBore: boolean;
  aMax: number;
  freqHz: number;
  eRef: number;
  rRef: number;
  orient: Orient;
  aimYawDeg: number;
  aimPitchDeg: number;
  phasePreset: PhasePreset;
  phaseA: number;
  phaseB: number;
  phaseC: number;
  driftRate: number;
  bankDeg: number;
  pitchDeg: number;
  alphaDeg: number;
  betaDeg: number;
  yawRateDeg: number;
  speed: number;
  perturb: number;
  massKg: number;
  specificWh: number;
  durationS: number;
  efficiency: number;
  enforceBudget: boolean;
  ashton: boolean;
  drew: boolean;
  plasmaCosmetic: boolean;
  vacuumGain: number;
  anchor: boolean;
  anchorKm: number;
  anchorBearing: number;
  /** Geometric seat of node 2 only, degrees. Zero is the equal 120° ring. Not an emitter phase. */
  seatBendDeg: number;
  rayMode: boolean;
  constitutive: Constitutive;
  dnAlpha: number;
  coherenceDeg: number;
  cadenceHz: number;
  timeOffsetS: number;
  viewpoint: Viewpoint;
  showField: boolean;
  showPoynting: boolean;
  showPredetermined: boolean;
  activeCount: 1 | 2 | 3;
  simulateAmplitude: boolean;
};

export type ImportSample = {
  t: number;
  ax: number;
  ay: number;
  az: number;
  n?: number[][];
};

export type ImportTrack = {
  provenance: string;
  samples: ImportSample[];
};

export type NodeReadout = {
  id: number;
  x: number;
  y: number;
  z: number;
  range: number;
  bearingDeg: number;
  speed: number;
  accel: number;
  orbitDeg: number;
  emDeg: number;
  freqHz: number;
  ampVm: number;
  trackErr: number;
  latencyMs: number;
  dark: boolean;
};

export type HistoryPoint = {
  t: number;
  track: number;
  gap: number;
  phase: number;
  ePeak: number;
  chiLog: number;
  energy: number;
};

export type Snapshot = {
  t: number;
  running: boolean;
  mode: Mode;
  altitude: number;
  tas: number;
  groundSpeed: number;
  bankDeg: number;
  pitchDeg: number;
  alphaDeg: number;
  betaDeg: number;
  yawDeg: number;
  maneuverLeft: number;
  nodes: NodeReadout[];
  gapErrDeg: number;
  gapMetric: string;
  trackErr: number;
  phaseErrDeg: number;
  latencyMs: number;
  acquisition: "SEARCH" | "ACQUIRE" | "TRACK" | "PHASE-LOCK" | "OFF";
  lockNote: string;
  ePeak: number;
  bPeak: number;
  eCommanded: number;
  chi: number;
  chiLog: number;
  ordersShort: number;
  gainRequired: number;
  chiHyp: number;
  pAmp: number;
  pRad: number;
  pDraw: number;
  pBudget: number;
  eChem: number;
  eChem0: number;
  scale: number;
  limited: boolean;
  empty: boolean;
  timeToEmptyCmd: number;
  timeToEmptyNow: number;
  cage: string;
  centerNote: string;
  nPeakRaw: number;
  nPeakMarch: number;
  sepDeg: [number, number, number];
  cadenceNote: string;
  obsAge: number;
  importProvenance: string;
  importCount: number;
  importResidual: number;
  overlap: string;
  history: HistoryPoint[];
  fieldNote: string;
  lRev: number;
  dz120: number;
  cSweep: number;
  boreRatio: number;
  boreDiam: number;
  boreRegime: string;
  boreNote: string;
  frameNote: string;
  aOrbit: number;
  sweep: SweepRow[];
  sweepVerdict: string;
  qed: QedReadout;
  clearance: ClearanceReadout;
  saturated: boolean;
  demandRatio: number;
  saturationNote: string;
  /** Geometry telemetry only. Not an input to Maxwell, pairs, energy, or the controller. */
  axes: AxisTelemetry;
};

export type AxisTelemetry = {
  boreDestDeg: number;
  bodyDestDeg: number;
  velDestDeg: number;
  note: string;
};

export type QedReadout = {
  ePeak: number;
  bPeak: number;
  eOverEs: number;
  cBOverEs: number;
  F: number;
  G: number;
  eps: number;
  beta: number;
  regime: "CLASSICAL EM" | "STRONG-FIELD QED BECOMING RELEVANT" | "SCHWINGER-SCALE FIELD";
  regimeNote: string;
  rate: number;
  exponent: number;
  rateApplicable: boolean;
  pairNote: string;
  where: string;
  hardware: "model" | "laboratory" | "hypothetical";
  commandedE: number;
  commandedHardware: "model" | "laboratory" | "hypothetical";
  simulated: boolean;
};

export type ClearanceReadout = {
  margin: number;
  minGap: number;
  nearest: string;
  commandedR: number;
  clearR: number;
  actualR: number;
  actual: [number, number, number];
  clear: [number, number, number];
  clearanceRaised: boolean;
  tracking: boolean;
  note: string;
};

export type AmplitudePoint = {
  e0: number;
  eOverEs: number;
  cBOverEs: number;
  rate: number;
  exponent: number;
  applicable: boolean;
  regime: QedReadout["regime"];
};

export type SchwingerSweep = {
  t: number;
  radius: number;
  omega: number;
  speed: number;
  freqHz: number;
  orient: string;
  activeCount: number;
  phaseA: number;
  phaseB: number;
  phaseC: number;
  frame: string;
  mode: string;
  points: AmplitudePoint[];
  simulatedAboveE0: number;
  note: string;
};

export type FrozenState = {
  t: number;
  eRef: number;
  radius: number;
  omega: number;
  speed: number;
  freqHz: number;
  orient: string;
  activeCount: number;
  latencyMs: number;
  aMax: number;
  phase: string;
  phaseA: number;
  phaseB: number;
  phaseC: number;
  frame: string;
  mode: string;
  dz120: number;
  cSweep: number;
  qed: QedReadout;
};

export const DEFAULT_PARAMS: Params = {
  running: true,
  timeScale: 1,
  mode: "phase-locked",
  latencyMs: 40,
  orbitRadius: 48,
  orbitRate: 1.2,
  frame: "bore",
  spacing: "equal",
  historyS: 5,
  showBore: false,
  vacuumBore: false,
  aMax: 80,
  freqHz: 1e8,
  eRef: 100,
  rRef: 30,
  orient: "vertical",
  aimYawDeg: 0,
  aimPitchDeg: 90,
  phasePreset: "triad",
  phaseA: 0,
  phaseB: 120,
  phaseC: 240,
  driftRate: 0.2,
  bankDeg: 0,
  pitchDeg: 0,
  alphaDeg: 0,
  betaDeg: 0,
  yawRateDeg: 0,
  speed: 80,
  perturb: 0,
  massKg: 221,
  specificWh: 200,
  durationS: 600,
  efficiency: 0.3,
  enforceBudget: true,
  ashton: false,
  drew: true,
  plasmaCosmetic: false,
  vacuumGain: 1,
  anchor: false,
  anchorKm: 500,
  anchorBearing: 40,
  seatBendDeg: 0,
  rayMode: false,
  constitutive: "vacuum",
  dnAlpha: 0.15,
  coherenceDeg: 8,
  cadenceHz: 30,
  timeOffsetS: 0,
  viewpoint: "nose",
  showField: true,
  showPoynting: true,
  showPredetermined: true,
  activeCount: 3,
  simulateAmplitude: false,
};
