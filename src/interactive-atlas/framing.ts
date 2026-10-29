/**
 * Human-scale walk framing.
 * Heading follow, orbit priority, and pinch zoom stay as they are.
 * These numbers only move the boom down off the crane.
 */

export const WALK_BACK = 5.8;
export const WALK_BACK_MIN = 3.8;
export const WALK_BACK_MAX = 14;
/** How far the boom may start when Walk is entered from the air. */
export const WALK_BACK_INHERIT = 22;
export const WALK_EYE = 2.42;
export const WALK_NEAR_EYE = 0.55;
export const WALK_AHEAD = 8.5;
export const WALK_LOOK = 1.95;
export const WALK_LOOK_MIN = 0.3;
export const WALK_LOOK_MAX = 64;
export const WALK_CLEARANCE = 0.38;
export const ORBIT_YAW = 0.005;
/** Drag down is a short travel to the ground. Drag up has to climb the cenotaph. */
export const ORBIT_PITCH_DOWN = 0.014;
export const ORBIT_PITCH_UP = 0.11;

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

function downAmount(lookLift: number) {
  return clamp((WALK_LOOK - lookLift) / (WALK_LOOK - WALK_LOOK_MIN), 0, 1);
}

/** Boom height above the ground under the avatar. Neutral sits just over his head. */
export function eyeForLook(lookLift: number) {
  const down = downAmount(lookLift);
  const up = clamp((lookLift - WALK_LOOK) / 28, 0, 1);
  return WALK_EYE + (WALK_NEAR_EYE - WALK_EYE) * down + up * 0.22;
}

/** Look-ahead shortens toward the feet and opens a little when the view climbs. */
export function aheadForLook(lookLift: number) {
  const down = downAmount(lookLift);
  const up = clamp((lookLift - WALK_LOOK) / 24, 0, 1);
  return WALK_AHEAD * (1 - down * 0.64) * (1 + up * 0.28);
}
