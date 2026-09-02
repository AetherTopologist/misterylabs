import { describe, expect, it } from "vitest";
import {
  derive,
  EFFECT_FLOOR,
  initialState,
  K,
  step,
  TAU0,
} from "./physics";

const EQ = TAU0 / K;

describe("Cavendish × Pais normalized model", () => {
  it("ordinary and inertia-only share θeq; gravity coupling moves it", () => {
    const ordinary = derive({ mode: "ordinary", strength: 0.8, damping: 0.35 });
    const inertia = derive({ mode: "inertia", strength: 0.8, damping: 0.35 });
    const gravity = derive({ mode: "gravity", strength: 0.8, damping: 0.35 });

    expect(ordinary.thetaEq).toBeCloseTo(EQ, 10);
    expect(inertia.thetaEq).toBeCloseTo(ordinary.thetaEq, 10);
    expect(inertia.deflectionRatio).toBeCloseTo(1, 10);
    expect(inertia.frequencyRatio).toBeGreaterThan(1);

    expect(gravity.thetaEq).toBeLessThan(ordinary.thetaEq);
    expect(gravity.deflectionRatio).toBeCloseTo(EFFECT_FLOOR + (1 - EFFECT_FLOOR) * 0.2, 8);
    expect(gravity.frequencyRatio).toBeCloseTo(1, 10);
  });

  it("inertia-only converges to the same equilibrium as ordinary", () => {
    const params = { mode: "inertia" as const, strength: 0.8, damping: 1.6 };
    let state = initialState();
    for (let i = 0; i < 4000; i++) {
      state = step(state, params, 0.016);
    }
    expect(state.active.theta).toBeCloseTo(EQ, 2);
    expect(state.baseline.theta).toBeCloseTo(EQ, 2);
  });

  it("gravity-coupling converges to a different (lower) equilibrium", () => {
    const params = { mode: "gravity" as const, strength: 0.8, damping: 1.6 };
    const expected = derive(params).thetaEq;
    let state = initialState();
    for (let i = 0; i < 4000; i++) {
      state = step(state, params, 0.016);
    }
    expect(state.active.theta).toBeCloseTo(expected, 2);
    expect(state.baseline.theta).toBeCloseTo(EQ, 2);
    expect(Math.abs(state.active.theta - EQ)).toBeGreaterThan(0.04);
  });
});
