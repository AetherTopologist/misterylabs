import { isDestinationId, type AtlasMode, type DestinationId } from "./destinations";
import type { WalkerSnapshot } from "./mister-why";
import { GROUND_R, GROUND_WALK } from "./world";

/** Session key for one return from an instrument into the walkable world. */
export const ATLAS_RESUME_KEY = "misterylabs.atlas.resume";

const MAX_AGE_MS = 45 * 60 * 1000;

export type AtlasResume = {
  v: 1;
  t: number;
  mode: AtlasMode;
  focus: [number, number, number];
  radius: number;
  yaw: number;
  pitch: number;
  selected: DestinationId | null;
  walker: WalkerSnapshot | null;
};

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Accept a pose only when every number is inside the fair.
 * Anything else is ignored and the atlas starts at the cenotaph, as before.
 */
export function validateAtlasResume(raw: unknown, now = Date.now()): AtlasResume | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<AtlasResume>;
  if (row.v !== 1 || !finite(row.t)) return null;
  if (row.t > now + 60_000 || now - row.t > MAX_AGE_MS) return null;
  if (row.mode !== "fly" && row.mode !== "walk") return null;
  if (!Array.isArray(row.focus) || row.focus.length !== 3 || !row.focus.every(finite)) return null;
  const [x, y, z] = row.focus;
  if (Math.hypot(x, z) > GROUND_R * 1.02) return null;
  if (y < -8 || y > 80) return null;
  if (!finite(row.radius) || row.radius < 3 || row.radius > 1200) return null;
  if (!finite(row.yaw) || !finite(row.pitch) || row.pitch < 0.15 || row.pitch > 1.35) return null;
  if (row.selected != null && !isDestinationId(row.selected)) return null;
  let walker: WalkerSnapshot | null = null;
  if (row.mode === "walk") {
    const pose = row.walker;
    if (!pose || typeof pose !== "object") return null;
    if (![pose.x, pose.z, pose.heading, pose.camYaw, pose.back, pose.lookLift].every(finite)) return null;
    if (Math.hypot(pose.x, pose.z) > GROUND_WALK + 1) return null;
    if (pose.back < 8 || pose.back > 30) return null;
    if (pose.lookLift < 3 || pose.lookLift > 34) return null;
    walker = {
      x: pose.x,
      z: pose.z,
      heading: pose.heading,
      camYaw: pose.camYaw,
      back: pose.back,
      lookLift: pose.lookLift,
    };
  }
  return {
    v: 1,
    t: row.t,
    mode: row.mode,
    focus: [x, y, z],
    radius: row.radius,
    yaw: row.yaw,
    pitch: row.pitch,
    selected: row.selected ?? null,
    walker,
  };
}

export function saveAtlasResume(value: AtlasResume) {
  try {
    sessionStorage.setItem(ATLAS_RESUME_KEY, JSON.stringify(value));
  } catch {
    /* Private browsing can refuse the write. The visit still opens. */
  }
}

/** Read and clear. A second mount, or a bad payload, does not replay the pose. */
export function takeAtlasResume(now = Date.now()): AtlasResume | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(ATLAS_RESUME_KEY);
    sessionStorage.removeItem(ATLAS_RESUME_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    return validateAtlasResume(JSON.parse(raw) as unknown, now);
  } catch {
    return null;
  }
}

export function captureAtlasResume(input: AtlasResume) {
  const [x, y, z] = input.focus;
  const limit = GROUND_R * 0.98;
  const radial = Math.hypot(x, z);
  const scale = radial > limit ? limit / radial : 1;
  const mode: AtlasMode = input.mode === "walk" ? "walk" : "fly";
  const walker = input.walker;
  const captured: AtlasResume = {
    v: 1,
    t: input.t,
    mode,
    focus: [x * scale, clamp(y, 0, 40), z * scale],
    radius: clamp(input.radius, 8, 980),
    yaw: input.yaw,
    pitch: clamp(input.pitch, 0.38, 1.22),
    selected: input.selected != null && isDestinationId(input.selected) ? input.selected : null,
    walker:
      mode === "walk" && walker
        ? {
            x: walker.x,
            z: walker.z,
            heading: walker.heading,
            camYaw: walker.camYaw,
            back: clamp(walker.back, 9, 28),
            lookLift: clamp(walker.lookLift, 3.5, 32),
          }
        : null,
  };
  const valid = validateAtlasResume(captured, captured.t);
  if (!valid) return;
  if (valid.mode === "walk" && valid.walker && Math.hypot(valid.walker.x, valid.walker.z) > GROUND_WALK) {
    const r = Math.hypot(valid.walker.x, valid.walker.z);
    const s = GROUND_WALK / r;
    valid.walker = { ...valid.walker, x: valid.walker.x * s, z: valid.walker.z * s };
  }
  saveAtlasResume(valid);
}
