import { create } from "zustand";
import { engine } from "./engine";
import { DEFAULT_PARAMS, type Experiment, type FrozenState, type Params, type SchwingerSweep, type Snapshot } from "./types";

type TriadStore = {
  params: Params;
  snap: Snapshot;
  captureA: FrozenState | null;
  captureB: FrozenState | null;
  sweep: SchwingerSweep | null;
  patch: (partial: Partial<Params>) => void;
  publish: () => void;
  reset: () => void;
  maneuver: () => void;
  experiment: (kind: Experiment) => void;
  freeze: (which: "a" | "b") => void;
  clearCaptures: () => void;
  runSweep: () => void;
  clearSweep: () => void;
};

function frozen(params: Params, snap: Snapshot): FrozenState {
  return {
    t: snap.t,
    eRef: params.eRef,
    radius: params.orbitRadius,
    omega: params.orbitRate,
    speed: params.speed,
    freqHz: params.freqHz,
    orient: params.orient,
    activeCount: params.activeCount,
    latencyMs: params.latencyMs,
    aMax: params.aMax,
    phase: params.phasePreset,
    phaseA: params.phaseA,
    phaseB: params.phaseB,
    phaseC: params.phaseC,
    frame: params.frame,
    mode: params.mode,
    dz120: snap.dz120,
    cSweep: snap.cSweep,
    qed: snap.qed,
  };
}

export const useTriad = create<TriadStore>((set, get) => ({
  params: { ...DEFAULT_PARAMS },
  snap: engine.snapshot(),
  captureA: null,
  captureB: null,
  sweep: null,
  patch: (partial) => {
    const params = { ...get().params, ...partial };
    engine.setParams(params);
    set({ params });
  },
  publish: () => set({ snap: engine.snapshot() }),
  reset: () => {
    engine.reset();
    set({ snap: engine.snapshot(), params: { ...engine.params } });
  },
  maneuver: () => {
    engine.triggerManeuver();
    set({ snap: engine.snapshot() });
  },
  experiment: (kind) => {
    engine.applyExperiment(kind);
    set({ params: { ...engine.params }, snap: engine.snapshot() });
  },
  freeze: (which) => {
    const snap = engine.snapshot();
    const shot = frozen({ ...engine.params }, snap);
    if (which === "a") set({ captureA: shot, snap });
    else set({ captureB: shot, snap });
  },
  clearCaptures: () => set({ captureA: null, captureB: null }),
  runSweep: () => set({ sweep: engine.schwingerSweep() }),
  clearSweep: () => set({ sweep: null }),
}));