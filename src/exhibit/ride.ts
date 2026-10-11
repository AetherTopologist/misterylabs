/**
 * MisterY Labs visitor pattern: RIDE → MAP → THOUGHT PATH.
 *
 * RIDE is a clock plus a list of scenes. Each scene samples the same instrument
 * state the visitor edits on the MAP. The ride must not keep a second copy of
 * the physics. THOUGHT PATH (citations, knowledge graph) is read-only and does
 * not belong in this clock.
 *
 * Future exhibits can reuse the clock without importing Photon Journey.
 */

export type RidePhase = "idle" | "playing" | "paused";

export type RideClock = {
  phase: RidePhase;
  scene: number;
  /** Milliseconds into the current scene. */
  elapsed: number;
};

export const IDLE_RIDE: RideClock = { phase: "idle", scene: 0, elapsed: 0 };

export function rideProgress(elapsed: number, durationMs: number) {
  if (durationMs <= 0) return 1;
  return Math.min(1, Math.max(0, elapsed / durationMs));
}

/** Advance a playing clock. Paused and idle clocks do not move. */
export function stepClock(clock: RideClock, durations: number[], dtMs: number): RideClock {
  if (clock.phase !== "playing") return clock;
  if (durations.length === 0) return { ...clock, phase: "idle" };
  let scene = Math.min(Math.max(0, clock.scene), durations.length - 1);
  let elapsed = clock.elapsed + Math.max(0, dtMs);
  while (scene < durations.length && elapsed >= durations[scene]) {
    elapsed -= durations[scene];
    scene += 1;
  }
  if (scene >= durations.length) {
    const last = durations.length - 1;
    return { phase: "paused", scene: last, elapsed: durations[last] };
  }
  return { phase: "playing", scene, elapsed };
}
