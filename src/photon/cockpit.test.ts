import assert from "node:assert/strict";
import { INITIAL_COCKPIT, PHOTON_RIDE, reduceCockpit } from "./cockpit";
import { DEFAULTS, detectedElectrons, isoGain } from "./physics";

test("tabs do not touch the physical state", () => {
  let state = reduceCockpit(INITIAL_COCKPIT, {
    type: "patch",
    patch: { ev: 1.7, focus: 0.4, seeing: 0.7, fNumber: 5.6, iso: 800 },
  });
  state = reduceCockpit(state, { type: "tier", tier: "advanced" });
  const controls = state.controls;
  const mode = state.mode;
  for (const tab of ["optics", "atmosphere", "ledger", "exposure"] as const) {
    state = reduceCockpit(state, { type: "tab", tab });
    assert.equal(state.tab, tab);
    assert.deepEqual(state.controls, controls);
    assert.equal(state.mode, mode);
  }
});

test("moon and macro keep the same controls", () => {
  let state = reduceCockpit(INITIAL_COCKPIT, { type: "patch", patch: { focus: 0.33, ev: -1.2 } });
  state = reduceCockpit(state, { type: "mode", mode: "macro" });
  assert.equal(state.mode, "macro");
  assert.equal(state.controls.focus, 0.33);
  assert.equal(state.controls.ev, -1.2);
  state = reduceCockpit(state, { type: "mode", mode: "moon" });
  assert.equal(state.mode, "moon");
  assert.equal(state.controls.focus, 0.33);
});

test("reset restores the known defaults and stops the ride", () => {
  let state = reduceCockpit(INITIAL_COCKPIT, { type: "ride-play" });
  state = reduceCockpit(state, { type: "ride-tick", dt: 2500, reduced: false });
  state = reduceCockpit(state, { type: "tab", tab: "ledger" });
  state = reduceCockpit(state, { type: "reset" });
  assert.equal(state.mode, "moon");
  assert.equal(state.tab, "exposure");
  assert.equal(state.ride.phase, "idle");
  assert.deepEqual(state.controls, DEFAULTS);
});

test("the ride writes the shared controls and can be paused", () => {
  let state = reduceCockpit(INITIAL_COCKPIT, { type: "ride-play" });
  assert.equal(state.ride.phase, "playing");
  assert.equal(state.mode, "moon");
  assert.equal(state.tab, "exposure");
  assert.ok(state.controls.ev > 3);
  state = reduceCockpit(state, { type: "ride-tick", dt: 9000, reduced: false });
  assert.equal(state.ride.scene, 0);
  assert.ok(state.controls.ev < 1);
  const frozen = state.controls;
  const elapsed = state.ride.elapsed;
  state = reduceCockpit(state, { type: "ride-pause" });
  state = reduceCockpit(state, { type: "ride-tick", dt: 8000, reduced: false });
  assert.equal(state.ride.phase, "paused");
  assert.equal(state.ride.elapsed, elapsed);
  assert.deepEqual(state.controls, frozen);
});

test("take control cancels automation and keeps the pose", () => {
  let state = reduceCockpit(INITIAL_COCKPIT, { type: "ride-play" });
  state = reduceCockpit(state, { type: "ride-tick", dt: 4000, reduced: false });
  const controls = state.controls;
  const mode = state.mode;
  state = reduceCockpit(state, { type: "take-control" });
  assert.equal(state.ride.phase, "idle");
  state = reduceCockpit(state, { type: "ride-tick", dt: 20_000, reduced: false });
  assert.deepEqual(state.controls, controls);
  assert.equal(state.mode, mode);
});

test("skip and the later scenes actually change the instrument", () => {
  let state = reduceCockpit(INITIAL_COCKPIT, { type: "ride-play" });
  state = reduceCockpit(state, { type: "ride-skip" });
  assert.equal(state.ride.scene, 1);
  assert.equal(state.tab, "optics");
  assert.equal(PHOTON_RIDE[1].id, "focus");
  state = reduceCockpit(INITIAL_COCKPIT, { type: "ride-play" });
  state = reduceCockpit(state, { type: "ride-tick", dt: 40_000, reduced: false });
  assert.equal(state.mode, "macro");
  assert.equal(state.ride.scene, 4);
  assert.equal(PHOTON_RIDE[4].id, "macro");
});

test("reduced motion snaps instead of crawling, and ISO does not buy photons", () => {
  let state = reduceCockpit(INITIAL_COCKPIT, { type: "ride-play" });
  state = reduceCockpit(state, { type: "ride-tick", dt: 10, reduced: true });
  assert.equal(state.ride.scene, 0);
  assert.ok(state.controls.ev < 0.5);
  state = reduceCockpit(state, { type: "ride-tick", dt: 10, reduced: true });
  assert.equal(state.ride.scene, 1);
  const start = PHOTON_RIDE[5].at(0).controls;
  const end = PHOTON_RIDE[5].at(1).controls;
  assert.equal(detectedElectrons(0.14, start), detectedElectrons(0.14, end));
  assert.ok(isoGain(end) > isoGain(start) * 30);
  assert.equal(PHOTON_RIDE.length, 6);
  assert.equal(
    PHOTON_RIDE.reduce((sum, scene) => sum + scene.durationMs, 0),
    60_000,
  );
});

test("a manual edit during the ride takes control", () => {
  let state = reduceCockpit(INITIAL_COCKPIT, { type: "ride-play" });
  state = reduceCockpit(state, { type: "patch", patch: { focus: 0.5 } });
  assert.equal(state.ride.phase, "idle");
  assert.equal(state.controls.focus, 0.5);
  assert.ok(state.controls.ev > 3);
});
