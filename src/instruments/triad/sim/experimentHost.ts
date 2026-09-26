/**
 * Seam for a future preset runner. Presets are not implemented.
 *
 * A preset must be a macro over these functions. They call the same store
 * and the same engine as the manual controls. There is no second simulation,
 * no canned timeline, and no separate field solver.
 *
 * Intended macro shape, not built here:
 *   checkpoint → reset → setControls → freeze → clearHistory
 *   → step for a timed sequence → read / freeze → stop → restore
 *
 * `freeze` is the existing Freeze A / Freeze B comparison capture.
 * It does not lock the solver and it does not feed the hypothesis view
 * back into Maxwell or the pair estimate.
 *
 * `restore` writes params through the same patch path as the sliders.
 * It does not rewind the aircraft unless the macro also calls `reset`.
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
  /** One real integrator step. The page clock calls engine.step with the same function. */
  step(dt: number): void {
    engine.step(dt);
  },
  read(): { params: Params; snap: Snapshot } {
    return { params: { ...engine.params }, snap: engine.snapshot() };
  },
};
