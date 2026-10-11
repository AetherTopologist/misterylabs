/**
 * Shared Photon Journey instrument state.
 * Tabs, Basic/Advanced, and the Ride all write this one record.
 */
import { IDLE_RIDE, rideProgress, stepClock, type RideClock, type RidePhase } from "../exhibit/ride";
import {
  BASE_SHUTTER_S,
  DEFAULTS,
  shutterSeconds,
  withTier,
  type ControlState,
  type Mode,
  type Tier,
} from "./physics";

export type CockpitTab = "exposure" | "optics" | "atmosphere" | "ledger";

export type OpticView = "ray" | "wave";

export type Cockpit = {
  mode: Mode;
  controls: ControlState;
  tab: CockpitTab;
  opticView: OpticView;
  ride: RideClock;
};

export type CockpitAction =
  | { type: "tab"; tab: CockpitTab }
  | { type: "mode"; mode: Mode }
  | { type: "patch"; patch: Partial<ControlState> }
  | { type: "tier"; tier: Tier }
  | { type: "optic-view"; view: OpticView }
  | { type: "reset" }
  | { type: "ride-play" }
  | { type: "ride-pause" }
  | { type: "ride-replay" }
  | { type: "ride-skip" }
  | { type: "take-control" }
  | { type: "ride-tick"; dt: number; reduced: boolean };

export type PhotonScene = {
  id: string;
  title: string;
  caption: string;
  tab: CockpitTab;
  durationMs: number;
  at: (t: number) => { mode: Mode; controls: ControlState };
};

const SCENE_MS = 10_000;

function ease(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * ease(t);
}

function pose(
  mode: Mode,
  tab: CockpitTab,
  controls: ControlState,
): { mode: Mode; controls: ControlState; tab: CockpitTab } {
  return { mode, tab, controls };
}

export const PHOTON_RIDE: PhotonScene[] = [
  {
    id: "expose",
    title: "Shorten the shutter",
    caption: "The Moon starts overexposed. The shutter shortens, and the craters come out of the white.",
    tab: "exposure",
    durationMs: SCENE_MS,
    at: (t) =>
      pose("moon", "exposure", {
        ev: mix(3.4, 0.2, t),
        seeing: 0.12,
        focus: 0.92,
        tier: "basic",
        shutter: BASE_SHUTTER_S,
        fNumber: 2.8,
        iso: 100,
      }),
  },
  {
    id: "focus",
    title: "Leave the focal plane",
    caption: "Focus walks off the sensor. The rays still meet — just not on the detector.",
    tab: "optics",
    durationMs: SCENE_MS,
    at: (t) =>
      pose("moon", "optics", {
        ev: 0.4,
        seeing: 0.1,
        focus: mix(0.96, 0.28, t),
        tier: "basic",
        shutter: shutterSeconds(0.4),
        fNumber: 2.8,
        iso: 100,
      }),
  },
  {
    id: "aperture",
    title: "Stop down",
    caption: "The aperture narrows. Fewer photons arrive, and the diffraction floor rises.",
    tab: "optics",
    durationMs: SCENE_MS,
    at: (t) =>
      pose("moon", "optics", {
        ev: 0.6,
        seeing: 0.08,
        focus: 0.94,
        tier: "advanced",
        shutter: shutterSeconds(0.6),
        fNumber: mix(1.8, 11, t),
        iso: 100,
      }),
  },
  {
    id: "seeing",
    title: "Disturb the air",
    caption: "Seeing rises. Fine lunar detail wanders even while focus stays on the plane.",
    tab: "atmosphere",
    durationMs: SCENE_MS,
    at: (t) =>
      pose("moon", "atmosphere", {
        ev: 0.3,
        seeing: mix(0.05, 0.95, t),
        focus: 0.9,
        tier: "basic",
        shutter: shutterSeconds(0.3),
        fNumber: 2.8,
        iso: 100,
      }),
  },
  {
    id: "macro",
    title: "Come close",
    caption: "Macro. A focus miss the Moon forgave throws the droplet off the plane.",
    tab: "optics",
    durationMs: SCENE_MS,
    at: (t) =>
      pose("macro", "optics", {
        ev: 0.8,
        seeing: 0.15,
        focus: mix(0.98, 0.32, t),
        tier: "basic",
        shutter: shutterSeconds(0.8),
        fNumber: 2.8,
        iso: 100,
      }),
  },
  {
    id: "iso",
    title: "Gain is not light",
    caption: "ISO climbs. The file gets louder. The detected photon count does not move.",
    tab: "exposure",
    durationMs: SCENE_MS,
    at: (t) => {
      const stops = [100, 200, 400, 800, 1600, 3200, 6400];
      const iso = stops[Math.min(stops.length - 1, Math.round(ease(t) * (stops.length - 1)))] ?? 100;
      return pose("macro", "exposure", {
        ev: 0,
        seeing: 0.12,
        focus: 0.9,
        tier: "advanced",
        shutter: BASE_SHUTTER_S,
        fNumber: 2.8,
        iso,
      });
    },
  },
];

export const INITIAL_COCKPIT: Cockpit = {
  mode: "moon",
  controls: { ...DEFAULTS },
  tab: "exposure",
  opticView: "ray",
  ride: { ...IDLE_RIDE },
};

function durations() {
  return PHOTON_RIDE.map((scene) => scene.durationMs);
}

function sample(ride: RideClock) {
  const scene = PHOTON_RIDE[Math.min(PHOTON_RIDE.length - 1, Math.max(0, ride.scene))];
  const t = rideProgress(ride.elapsed, scene.durationMs);
  return { scene, pose: scene.at(t) };
}

function applyRide(state: Cockpit, ride: RideClock): Cockpit {
  const next = sample(ride);
  return {
    ...state,
    ride,
    mode: next.pose.mode,
    controls: next.pose.controls,
    tab: next.scene.tab,
  };
}

/** Stop the clock without touching the instrument the visitor is looking at. */
function release(state: Cockpit): Cockpit {
  if (state.ride.phase === "idle") return state;
  return { ...state, ride: { ...state.ride, phase: "idle" } };
}

function finished(ride: RideClock) {
  const last = PHOTON_RIDE.length - 1;
  return ride.scene >= last && ride.elapsed >= PHOTON_RIDE[last].durationMs - 1;
}

function snapReduced(state: Cockpit): Cockpit {
  const index = Math.min(PHOTON_RIDE.length - 1, state.ride.scene);
  const scene = PHOTON_RIDE[index];
  const atEnd = state.ride.elapsed >= scene.durationMs - 1;
  if (!atEnd) {
    return applyRide(state, { phase: "playing", scene: index, elapsed: scene.durationMs - 1 });
  }
  if (index >= PHOTON_RIDE.length - 1) {
    return applyRide(state, { phase: "paused", scene: index, elapsed: scene.durationMs });
  }
  return applyRide(state, { phase: "playing", scene: index + 1, elapsed: 0 });
}

export function reduceCockpit(state: Cockpit, action: CockpitAction): Cockpit {
  switch (action.type) {
    case "tab":
      return { ...release(state), tab: action.tab };
    case "mode":
      return { ...release(state), mode: action.mode };
    case "patch":
      return { ...release(state), controls: { ...state.controls, ...action.patch } };
    case "tier":
      return { ...release(state), controls: withTier(state.controls, action.tier) };
    case "optic-view":
      return { ...state, opticView: action.view };
    case "reset":
      return {
        mode: "moon",
        controls: { ...DEFAULTS },
        tab: "exposure",
        opticView: "ray",
        ride: { ...IDLE_RIDE },
      };
    case "ride-play": {
      if (state.ride.phase === "paused" && !finished(state.ride)) {
        return { ...state, ride: { ...state.ride, phase: "playing" } };
      }
      return applyRide(state, { phase: "playing", scene: 0, elapsed: 0 });
    }
    case "ride-pause":
      if (state.ride.phase !== "playing") return state;
      return { ...state, ride: { ...state.ride, phase: "paused" } };
    case "ride-replay":
      return applyRide(state, { phase: "playing", scene: 0, elapsed: 0 });
    case "ride-skip": {
      if (state.ride.phase !== "idle" && finished(state.ride)) {
        const last = PHOTON_RIDE.length - 1;
        return applyRide(state, {
          phase: "paused",
          scene: last,
          elapsed: PHOTON_RIDE[last].durationMs,
        });
      }
      const scene = state.ride.phase === "idle" ? 0 : Math.min(PHOTON_RIDE.length - 1, state.ride.scene + 1);
      return applyRide(state, { phase: "playing", scene, elapsed: 0 });
    }
    case "take-control":
      return release(state);
    case "ride-tick": {
      if (state.ride.phase !== "playing") return state;
      if (action.reduced) return snapReduced(state);
      return applyRide(state, stepClock(state.ride, durations(), action.dt));
    }
    default:
      return state;
  }
}

export function ridePhaseLabel(phase: RidePhase) {
  if (phase === "playing") return "Playing";
  if (phase === "paused") return "Paused";
  return "Map";
}
