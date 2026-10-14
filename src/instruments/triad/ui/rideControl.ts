/**
 * Doorway into the existing experiment runner.
 * Ride / Pause / Restart do not create a second clock.
 * Default if nothing is selected: 01 Control cliff.
 */
import { experimentRun, useExperimentRun } from "../sim/experimentRun";
import type { PresetId } from "../sim/presets";

export const DEFAULT_RIDE: PresetId = "cliff";

export function rideStart(): "running" | "resumed" | "started" {
  const run = useExperimentRun.getState();
  if (run.status === "running") return "running";
  if (run.status === "paused") {
    experimentRun.resume();
    return "resumed";
  }
  if (!run.armedId && !run.presetId) experimentRun.select(DEFAULT_RIDE);
  experimentRun.begin(1);
  return "started";
}

export function ridePause() {
  experimentRun.pause();
}

export function rideRestart() {
  const run = useExperimentRun.getState();
  if (run.status === "running") experimentRun.pause();
  if (!useExperimentRun.getState().armedId && !useExperimentRun.getState().presetId) experimentRun.select(DEFAULT_RIDE);
  experimentRun.begin(1);
}

/** Manual patch while a script is driving. Pauses so the next step cannot overwrite the edit. */
export function handoffManual(): "paused" | "already-paused" | null {
  const run = useExperimentRun.getState();
  if (run.status === "running") {
    experimentRun.pause();
    return "paused";
  }
  if (run.status === "paused") return "already-paused";
  return null;
}

export function shouldLoop(enabled: boolean, status: string) {
  return enabled && status === "done";
}
