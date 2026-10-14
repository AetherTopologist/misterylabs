import { engine } from "../sim/engine";
import { experimentRun, useExperimentRun } from "../sim/experimentRun";
import { setUserIntentListener } from "../sim/intent";
import { useTriad } from "../sim/store";
import { handoffManual, ridePause, rideRestart, rideStart, shouldLoop } from "./rideControl";

describe("ride doorway", () => {
  afterEach(() => {
    setUserIntentListener(() => {});
    experimentRun.restore();
  });

  it("starts the default cliff script, pauses, resumes, and restarts on the same clock", () => {
    expect(rideStart()).toBe("started");
    expect(useExperimentRun.getState().presetId).toBe("cliff");
    expect(useExperimentRun.getState().status).toBe("running");
    expect(engine.params.running).toBe(true);
    const origin = engine.now();
    engine.step(1 / 60);
    experimentRun.afterStep();
    expect(engine.now()).toBeGreaterThan(origin);
    const pausedAt = engine.now();
    ridePause();
    expect(useExperimentRun.getState().status).toBe("paused");
    expect(engine.params.running).toBe(false);
    expect(rideStart()).toBe("resumed");
    expect(engine.now()).toBeCloseTo(pausedAt, 6);
    expect(engine.params.running).toBe(true);
    rideRestart();
    expect(useExperimentRun.getState().status).toBe("running");
    expect(useExperimentRun.getState().presetId).toBe("cliff");
    expect(engine.now()).toBe(0);
  });

  it("pauses on a manual patch and does not let the next script tick overwrite it", () => {
    setUserIntentListener(() => {
      handoffManual();
    });
    rideStart();
    expect(useExperimentRun.getState().status).toBe("running");
    useTriad.getState().patch({ phaseA: 15 });
    expect(useExperimentRun.getState().status).toBe("paused");
    expect(useTriad.getState().params.phaseA).toBe(15);
    expect(engine.params.running).toBe(false);
    experimentRun.beforeStep();
    expect(useTriad.getState().params.phaseA).toBe(15);
  });

  it("loops only when asked", () => {
    expect(shouldLoop(false, "done")).toBe(false);
    expect(shouldLoop(true, "running")).toBe(false);
    expect(shouldLoop(true, "done")).toBe(true);
  });
});
