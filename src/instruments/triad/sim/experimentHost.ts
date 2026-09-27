/**
 * Shared control path for the manual UI and for experiment presets.
 *
 * A preset is a macro over these functions. They call the same store
 * and the same engine as the sliders. There is no second simulation,
 * no canned timeline, and no separate field solver.
 *
 * Macro shape used by `experimentRun`:
 *   checkpoint → setControls → reset → clearHistory
 *   → (the page clock calls engine.step; before each step the runner
 *      setControls again) → read / freeze → stop → restore + reset
 *
 * `freeze` is the existing Freeze A / Freeze B comparison capture.
 * It does not lock the solver. Held variables are reapplied through
 * `setControls` by the runner. Freeze does not feed the hypothesis
 * view back into Maxwell or the pair estimate.
 *
 * `restore` writes params through the same patch path as the sliders.
 * The runner then calls `reset` so kinematics match those params.
 * Restore does not rewind a mid-flight pose on its own.
 */
import { engine } from "./engine";
import { useTriad } from "./store";
import type { Params, Snapshot } from "./types";

export type ControlCheckpoint = {
  params: Params;
};

export const experimentHost = {
  reset(): void {
    useTriad.getState().reset();
  },
  setControls(partial: Partial<Params>): void {
    useTriad.getState().patch(partial);
  },
  freeze(which: "a" | "b"): void {
    useTriad.getState().freeze(which);
  },
  clearHistory(): void {
    engine.clearHistory();
    useTriad.getState().publish();
  },
  checkpoint(): ControlCheckpoint {
    return { params: { ...engine.params } };
  },
  restore(saved: ControlCheckpoint): void {
    useTriad.getState().patch({ ...saved.params });
  },
  stop(): void {
    useTriad.getState().patch({ running: false });
  },
  /** Integrator time in seconds. Presets schedule against this, not wall time. */
  now(): number {
    return engine.now();
  },
  /** One real integrator step. The page clock calls engine.step with the same function. */
  step(dt: number): void {
    engine.step(dt);
  },
  read(): { params: Params; snap: Snapshot } {
    return { params: { ...engine.params }, snap: engine.snapshot() };
  },
};
