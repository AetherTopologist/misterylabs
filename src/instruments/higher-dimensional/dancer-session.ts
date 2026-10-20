import { DANCER_OMEGA, DANCER_SPEED_MAX, DANCER_SPEED_MIN } from "./dancer-motion";

/** v1 bytes stay on this key. New sessions are written to SESSION_KEY. */
export const SESSION_KEY_V1 = "misterylabs.ambiguous-dancer.session.v1";
export const SESSION_KEY = "misterylabs.ambiguous-dancer.session.v2";
export const LEGACY_REPORTS_KEY = "misterylabs.ambiguous-dancer.reports";
export const SESSION_SCHEMA = 2;

export const AUDIO_TRIAL_S = 16;
export const AUDIO_CUE_STEP_S = 2.5;
export const AUDIO_VOLUME_DEFAULT = 0.08;
export const AUDIO_VOLUME_MAX = 0.25;

export type AudioMode = "silent" | "coupled" | "independent";
export type AudioPan = "off" | "center" | "left" | "right";
export type HeadphonesReport = "unspecified" | "yes" | "no";
export type CueCause = "independent-schedule" | "report-feedback";

export type PerceivedReport = "clockwise" | "counterclockwise" | "unsure";
export type DirectionalReport = "clockwise" | "counterclockwise";
export type EventKind = "initial" | "reversal" | "repeat" | "unsure";
export type PhysicalDirection = "cw" | "ccw";
export type GazeTarget = "Head" | "Torso" | "Hips" | "Knee" | "Foot";

export type DancerEvent = {
  tWall: number;
  tMono: number;
  elapsedS: number;
  yawUnwrapped: number;
  yawMod: number;
  physicalDirection: PhysicalDirection;
  speed: number;
  angularVelocityRadS: number;
  running: boolean;
  legEmphasis: number;
  armPosition: number;
  /** Null: the pose is two sliders, not a gait clock driven by yaw. */
  posePhase: null;
  /** Selected focus slider. Not a measured eye fixation. */
  gazeTarget: GazeTarget;
  gazePct: number;
  shaded: boolean;
  perspective: boolean;
  depthCues: boolean;
  floorShadow: boolean;
  markers: boolean;
  perceived: PerceivedReport;
  sincePrevS: number | null;
  kind: EventKind;
  /** Observer tap. Not an audio cue. */
  action: "report";
  audioMode: AudioMode;
  audioPan: AudioPan;
  /** Master gain, 0–1. Not a sound-pressure level. */
  audioVolume: number;
  headphones: HeadphonesReport;
  /** AudioContext.currentTime in seconds, or null if the tone is not running. */
  audioTimeS: number | null;
};

export type AudioCue = {
  tWall: number;
  tMono: number;
  elapsedS: number;
  yawUnwrapped: number;
  yawMod: number;
  physicalDirection: PhysicalDirection;
  audioTimeS: number;
  scheduledAtS: number;
  audioPan: Exclude<AudioPan, "off">;
  audioMode: AudioMode;
  audioVolume: number;
  cueIndex: number;
  seed: number;
  cause: CueCause;
  headphones: HeadphonesReport;
};

export type AudioConfig = {
  mode: AudioMode;
  volume: number;
  headphones: HeadphonesReport;
  seed: number;
  order: AudioMode[];
  trialIndex: number;
};

export type DancerSession = {
  schema: typeof SESSION_SCHEMA;
  id: string;
  startedWall: number;
  config: {
    omegaRadS: number;
    speedMin: number;
    speedMax: number;
    reactionTimeCorrection: "none";
    posePhase: "none";
    gazeMeaning: "selected target, not measured fixation";
  };
  migratedFrom: 1 | null;
  audio: AudioConfig;
  events: DancerEvent[];
  audioCues: AudioCue[];
};

export type EventInput = {
  tWall: number;
  tMono: number;
  yawUnwrapped: number;
  physicalDirection: PhysicalDirection;
  speed: number;
  running: boolean;
  legEmphasis: number;
  armPosition: number;
  gazePct: number;
  shaded: boolean;
  perspective: boolean;
  depthCues: boolean;
  floorShadow: boolean;
  markers: boolean;
};

export type AudioSnapshot = {
  audioMode: AudioMode;
  audioPan: AudioPan;
  audioVolume: number;
  headphones: HeadphonesReport;
  audioTimeS: number | null;
};

const SILENT_AUDIO: AudioSnapshot = {
  audioMode: "silent",
  audioPan: "off",
  audioVolume: 0,
  headphones: "unspecified",
  audioTimeS: null,
};

const TAU = Math.PI * 2;

export function wrapYaw(yaw: number): number {
  const m = yaw % TAU;
  return m < 0 ? m + TAU : m;
}

/** Focus slider, 0–100. Same cuts as the dancer control. Not a fixation. */
export function gazeTarget(focusPct: number): GazeTarget {
  if (focusPct < 18) return "Head";
  if (focusPct < 40) return "Torso";
  if (focusPct < 62) return "Hips";
  if (focusPct < 82) return "Knee";
  return "Foot";
}

export function lastDirectional(events: DancerEvent[]): DirectionalReport | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const perceived = events[i].perceived;
    if (perceived === "clockwise" || perceived === "counterclockwise") return perceived;
  }
  return null;
}

/** Unsure is not a direction. A repeat is not a reversal. The first direction is initial. */
export function classifyReport(previous: DirectionalReport | null, next: PerceivedReport): EventKind {
  if (next === "unsure") return "unsure";
  if (!previous) return "initial";
  if (previous === next) return "repeat";
  return "reversal";
}

const CONDITION_ORDERS: AudioMode[][] = [
  ["silent", "coupled", "independent"],
  ["silent", "independent", "coupled"],
  ["coupled", "silent", "independent"],
  ["coupled", "independent", "silent"],
  ["independent", "silent", "coupled"],
  ["independent", "coupled", "silent"],
];

/** Six counterbalanced orders. The same seed always picks the same order. */
export function conditionOrder(seed: number): AudioMode[] {
  const index = Math.abs(Math.trunc(seed)) % CONDITION_ORDERS.length;
  return [...CONDITION_ORDERS[index]];
}

function mulberry32(seed: number) {
  let a = Math.trunc(seed) >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Stereo steps for an independent trial.
 * The sequence depends on the seed and the clock, not on reports or yaw.
 */
export function independentCues(seed: number, trialS = AUDIO_TRIAL_S, stepS = AUDIO_CUE_STEP_S) {
  const rand = mulberry32(seed);
  const cues: { atS: number; pan: "left" | "right"; index: number }[] = [];
  let index = 0;
  for (let atS = stepS; atS < trialS - 0.05; atS += stepS) {
    cues.push({ atS, pan: rand() < 0.5 ? "left" : "right", index });
    index += 1;
  }
  return cues;
}

/** Maps the visitor's report onto a speaker. This is not the model yaw. */
export function panForReport(perceived: DirectionalReport): "left" | "right" {
  return perceived === "clockwise" ? "right" : "left";
}

function newId(): string {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") return cryptoRef.randomUUID();
  return `s-${Math.random().toString(36).slice(2, 10)}`;
}

export function createSession(now: number, id = newId(), seed = 1): DancerSession {
  const order = conditionOrder(seed);
  return {
    schema: SESSION_SCHEMA,
    id,
    startedWall: now,
    config: {
      omegaRadS: DANCER_OMEGA,
      speedMin: DANCER_SPEED_MIN,
      speedMax: DANCER_SPEED_MAX,
      reactionTimeCorrection: "none",
      posePhase: "none",
      gazeMeaning: "selected target, not measured fixation",
    },
    migratedFrom: null,
    audio: {
      mode: order[0],
      volume: AUDIO_VOLUME_DEFAULT,
      headphones: "unspecified",
      seed,
      order,
      trialIndex: 0,
    },
    events: [],
    audioCues: [],
  };
}

export function appendEvent(
  session: DancerSession,
  input: EventInput,
  perceived: PerceivedReport,
  audio: Partial<AudioSnapshot> = {},
): DancerSession {
  const yaw = input.yawUnwrapped;
  const prev = session.events[session.events.length - 1];
  const kind = classifyReport(lastDirectional(session.events), perceived);
  const sign = input.physicalDirection === "cw" ? 1 : -1;
  const sound = { ...SILENT_AUDIO, ...audio };
  const event: DancerEvent = {
    tWall: input.tWall,
    tMono: input.tMono,
    elapsedS: (input.tWall - session.startedWall) / 1000,
    yawUnwrapped: yaw,
    yawMod: wrapYaw(yaw),
    physicalDirection: input.physicalDirection,
    speed: input.speed,
    angularVelocityRadS: sign * input.speed * DANCER_OMEGA,
    running: input.running,
    legEmphasis: input.legEmphasis,
    armPosition: input.armPosition,
    posePhase: null,
    gazeTarget: gazeTarget(input.gazePct),
    gazePct: input.gazePct,
    shaded: input.shaded,
    perspective: input.perspective,
    depthCues: input.depthCues,
    floorShadow: input.floorShadow,
    markers: input.markers,
    perceived,
    sincePrevS: prev ? (input.tWall - prev.tWall) / 1000 : null,
    kind,
    action: "report",
    audioMode: sound.audioMode,
    audioPan: sound.audioPan,
    audioVolume: sound.audioVolume,
    headphones: sound.headphones,
    audioTimeS: sound.audioTimeS,
  };
  return { ...session, events: [...session.events, event] };
}

export function appendAudioCue(session: DancerSession, input: {
  tWall: number;
  tMono: number;
  yawUnwrapped: number;
  physicalDirection: PhysicalDirection;
  audioTimeS: number;
  scheduledAtS: number;
  audioPan: Exclude<AudioPan, "off">;
  cueIndex: number;
  seed: number;
  cause: CueCause;
  audioMode?: AudioMode;
}): DancerSession {
  const cue: AudioCue = {
    tWall: input.tWall,
    tMono: input.tMono,
    elapsedS: (input.tWall - session.startedWall) / 1000,
    yawUnwrapped: input.yawUnwrapped,
    yawMod: wrapYaw(input.yawUnwrapped),
    physicalDirection: input.physicalDirection,
    audioTimeS: input.audioTimeS,
    scheduledAtS: input.scheduledAtS,
    audioPan: input.audioPan,
    audioMode: input.audioMode ?? session.audio.mode,
    audioVolume: session.audio.volume,
    cueIndex: input.cueIndex,
    seed: input.seed,
    cause: input.cause,
    headphones: session.audio.headphones,
  };
  return { ...session, audioCues: [...session.audioCues, cue] };
}

export function clearEvents(session: DancerSession): DancerSession {
  return { ...session, events: [], audioCues: [] };
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Gaps between successive reversal stamps. Null until two reversals exist. */
export function medianReversalInterval(events: DancerEvent[]): number | null {
  const times = events.filter((event) => event.kind === "reversal").map((event) => event.elapsedS);
  if (times.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
  return median(gaps);
}

export function reversalCount(events: DancerEvent[]): number {
  return events.filter((event) => event.kind === "reversal").length;
}

export function countsBySpeed(events: DancerEvent[]): { speed: number; n: number }[] {
  const buckets = new Map<string, { speed: number; n: number }>();
  for (const event of events) {
    const key = event.speed.toFixed(2);
    const row = buckets.get(key);
    if (row) row.n += 1;
    else buckets.set(key, { speed: event.speed, n: 1 });
  }
  return [...buckets.values()].sort((a, b) => a.speed - b.speed);
}

/** Mean direction on the circle. 0 and 2π are the same place. */
export function circularMean(angles: number[]): { n: number; meanRad: number | null; R: number | null } {
  if (angles.length === 0) return { n: 0, meanRad: null, R: null };
  let c = 0;
  let s = 0;
  for (const angle of angles) {
    c += Math.cos(angle);
    s += Math.sin(angle);
  }
  c /= angles.length;
  s /= angles.length;
  const mean = Math.atan2(s, c);
  return {
    n: angles.length,
    meanRad: mean < 0 ? mean + TAU : mean,
    R: Math.hypot(c, s),
  };
}

export function phaseBins(angles: number[], bins = 8): number[] {
  const counts = Array.from({ length: bins }, () => 0);
  const width = TAU / bins;
  for (const angle of angles) {
    let index = Math.floor(wrapYaw(angle) / width);
    if (index >= bins) index = 0;
    counts[index] += 1;
  }
  return counts;
}

export function formatEventRow(event: DancerEvent): string {
  const phaseDeg = (event.yawMod * 180) / Math.PI;
  return `${event.elapsedS.toFixed(2)} s | ${phaseDeg.toFixed(1)}° | ${event.speed.toFixed(2)}× | ${event.perceived} · ${event.kind}`;
}

export function formatEventDetail(event: DancerEvent): string {
  const phaseDeg = (event.yawMod * 180) / Math.PI;
  return [
    `${event.kind} · perceived ${event.perceived}`,
    `elapsed ${event.elapsedS.toFixed(3)} s`,
    `since previous tap ${event.sincePrevS == null ? "none" : `${event.sincePrevS.toFixed(3)} s`}`,
    `yaw ${event.yawUnwrapped.toFixed(4)} rad unwrapped`,
    `phase ${event.yawMod.toFixed(4)} rad (${phaseDeg.toFixed(1)}°)`,
    `physical ${event.physicalDirection}`,
    `speed ${event.speed.toFixed(2)}×`,
    `angular velocity ${event.angularVelocityRadS.toFixed(4)} rad/s`,
    `running ${event.running ? "yes" : "paused"}`,
    `leg emphasis ${event.legEmphasis.toFixed(2)} (slider)`,
    `arm position ${event.armPosition.toFixed(2)} (slider)`,
    "pose phase none",
    `gaze target ${event.gazeTarget} (selected, not fixation)`,
    `shaded ${event.shaded} · perspective ${event.perspective} · depth cues ${event.depthCues}`,
    `floor shadow ${event.floorShadow} · marker ${event.markers}`,
    `audio ${event.audioMode} · pan ${event.audioPan} · gain ${event.audioVolume.toFixed(2)}`,
    `headphones ${event.headphones}`,
  ].join("\n");
}

export const CSV_COLUMNS = [
  "schema",
  "session_id",
  "elapsed_s",
  "yaw_unwrapped_rad",
  "yaw_mod_rad",
  "physical_direction",
  "speed_multiplier",
  "angular_velocity_rad_s",
  "running",
  "leg_emphasis_0_1",
  "arm_position_0_1",
  "pose_phase",
  "gaze_target_selected",
  "shaded",
  "perspective",
  "depth_cues",
  "floor_shadow",
  "marker",
  "perceived",
  "since_prev_s",
  "kind",
  "t_wall_ms",
  "t_mono_ms",
  "row_kind",
  "observer_action",
  "audio_mode",
  "audio_pan",
  "audio_volume_gain",
  "audio_time_s",
  "scheduled_audio_s",
  "cue_index",
  "cue_seed",
  "headphones",
  "cue_cause",
] as const;

function csvCell(value: string | number | boolean | null): string {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function sessionToCsv(session: DancerSession): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const event of session.events) {
    const row = [
      session.schema,
      session.id,
      event.elapsedS,
      event.yawUnwrapped,
      event.yawMod,
      event.physicalDirection,
      event.speed,
      event.angularVelocityRadS,
      event.running,
      event.legEmphasis,
      event.armPosition,
      event.posePhase,
      event.gazeTarget,
      event.shaded,
      event.perspective,
      event.depthCues,
      event.floorShadow,
      event.markers,
      event.perceived,
      event.sincePrevS,
      event.kind,
      event.tWall,
      event.tMono,
      "report",
      event.action,
      event.audioMode,
      event.audioPan,
      event.audioVolume,
      event.audioTimeS,
      null,
      null,
      null,
      event.headphones,
      null,
    ];
    lines.push(row.map(csvCell).join(","));
  }
  for (const cue of session.audioCues) {
    const row = [
      session.schema,
      session.id,
      cue.elapsedS,
      cue.yawUnwrapped,
      cue.yawMod,
      cue.physicalDirection,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      cue.tWall,
      cue.tMono,
      "audio-cue",
      null,
      cue.audioMode,
      cue.audioPan,
      cue.audioVolume,
      cue.audioTimeS,
      cue.scheduledAtS,
      cue.cueIndex,
      cue.seed,
      cue.headphones,
      cue.cause,
    ];
    lines.push(row.map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function sessionToJson(session: DancerSession): string {
  return JSON.stringify({
    schema: session.schema,
    sessionId: session.id,
    startedWallMs: session.startedWall,
    config: session.config,
    note: "Tap time is not the perceptual transition. No reaction-time correction is applied. The gaze target is the selected slider, not measured fixation. Pose phase is empty because leg and arm are independent sliders. Audio pan is not the model yaw. A tone is a hypothesis about multisensory influence, not a demonstrated effect.",
    migratedFrom: session.migratedFrom,
    audio: session.audio,
    events: session.events,
    audioCues: session.audioCues,
  }, null, 2);
}

function isEvent(value: unknown): value is DancerEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as DancerEvent;
  return typeof event.tWall === "number"
    && typeof event.yawUnwrapped === "number"
    && (event.kind === "initial" || event.kind === "reversal" || event.kind === "repeat" || event.kind === "unsure")
    && (event.perceived === "clockwise" || event.perceived === "counterclockwise" || event.perceived === "unsure");
}

function fillReportAudio(event: DancerEvent): DancerEvent {
  return {
    ...event,
    action: "report",
    audioMode: event.audioMode ?? "silent",
    audioPan: event.audioPan ?? "off",
    audioVolume: event.audioVolume ?? 0,
    headphones: event.headphones ?? "unspecified",
    audioTimeS: event.audioTimeS ?? null,
  };
}

export function migrateV1(value: unknown): DancerSession | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as {
    schema?: number;
    id?: string;
    startedWall?: number;
    config?: DancerSession["config"];
    events?: unknown[];
  };
  if (raw.schema !== 1 || typeof raw.id !== "string" || typeof raw.startedWall !== "number") return null;
  if (!Array.isArray(raw.events) || !raw.config) return null;
  const events = raw.events.filter(isEvent).map(fillReportAudio);
  const seed = 1;
  return {
    schema: SESSION_SCHEMA,
    id: raw.id,
    startedWall: raw.startedWall,
    config: raw.config,
    migratedFrom: 1,
    audio: {
      mode: "silent",
      volume: AUDIO_VOLUME_DEFAULT,
      headphones: "unspecified",
      seed,
      order: conditionOrder(seed),
      trialIndex: 0,
    },
    events,
    audioCues: [],
  };
}

export function normalizeSession(value: unknown): DancerSession | null {
  if (!value || typeof value !== "object") return null;
  const session = value as DancerSession;
  if (session.schema === 1) return migrateV1(value);
  if (session.schema !== SESSION_SCHEMA || typeof session.id !== "string" || typeof session.startedWall !== "number") return null;
  if (!Array.isArray(session.events) || !session.audio || !Array.isArray(session.audio.order)) return null;
  return {
    ...session,
    migratedFrom: session.migratedFrom ?? null,
    audioCues: Array.isArray(session.audioCues) ? session.audioCues : [],
    events: session.events.filter(isEvent).map(fillReportAudio),
  };
}

export function loadSession(storage: Pick<Storage, "getItem">, now = Date.now()): DancerSession {
  try {
    const current = storage.getItem(SESSION_KEY);
    if (current) {
      const parsed = normalizeSession(JSON.parse(current));
      if (parsed) return parsed;
    }
  } catch { /* fall through to v1 */ }
  try {
    const previous = storage.getItem(SESSION_KEY_V1);
    if (previous) {
      const migrated = migrateV1(JSON.parse(previous));
      if (migrated) return migrated;
    }
  } catch { /* fresh session */ }
  return createSession(now);
}

export function saveSession(storage: Pick<Storage, "setItem">, session: DancerSession) {
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}
