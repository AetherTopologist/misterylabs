export type GlbPhase = "idle" | "loading" | "loaded" | "failed";
export type ContextPhase = "active" | "lost" | "restored";
export type LightTier = "pr38" | "minimal" | "budget" | "emissive" | "neutral";

export type CenotaphDiagnostics = {
  production: GlbPhase;
  floor: GlbPhase;
  productionError: string | null;
  floorError: string | null;
  productionTriangles: number | null;
  floorTriangles: number | null;
  context: ContextPhase;
  renderer: string;
  webglVersion: string;
  maxFragmentUniforms: number | null;
  maxVertexUniforms: number | null;
  maxTextureUnits: number | null;
  maxVaryingVectors: number | null;
  tier: LightTier;
  /** Tier last asked for. Differs from `tier` when a request was refused. */
  requestedTier: LightTier | null;
  /** Why the requested tier was not activated. Null while the request is active. */
  tierNote: string | null;
  activeRealLights: number | null;
  activeArchSlots: number | null;
  /** "unavailable" until a compile or link log is actually captured. */
  shaderLog: string;
  initError: string | null;
};

function initialDiagnostics(): CenotaphDiagnostics {
  return {
    production: "idle",
    floor: "idle",
    productionError: null,
    floorError: null,
    productionTriangles: null,
    floorTriangles: null,
    context: "active",
    renderer: "unavailable",
    webglVersion: "unavailable",
    maxFragmentUniforms: null,
    maxVertexUniforms: null,
    maxTextureUnits: null,
    maxVaryingVectors: null,
    tier: "budget",
    requestedTier: null,
    tierNote: null,
    activeRealLights: null,
    activeArchSlots: null,
    shaderLog: "unavailable",
    initError: null,
  };
}

let state: CenotaphDiagnostics = initialDiagnostics();

const listeners = new Set<() => void>();

/** Stable snapshot. Identity changes only when a value changes. */
export function getDiagnostics(): CenotaphDiagnostics {
  return state;
}

export function subscribeDiagnostics(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function patchDiagnostics(partial: Partial<CenotaphDiagnostics>) {
  const keys = Object.keys(partial) as (keyof CenotaphDiagnostics)[];
  let changed = false;
  for (const key of keys) {
    if (!Object.is(state[key], partial[key])) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  state = { ...state, ...partial };
  for (const listener of listeners) listener();
}

export function resetDiagnostics() {
  state = initialDiagnostics();
  for (const listener of listeners) listener();
}

export function lightTierFromSearch(search: string): LightTier {
  const q = new URLSearchParams(search).get("lights");
  if (q === "pr38" || q === "minimal" || q === "budget" || q === "emissive" || q === "neutral") return q;
  return "budget";
}

function line(label: string, value: string | number | null) {
  return `${label}: ${value == null || value === "" ? "none" : value}`;
}

/** Compact text for the Copy Diagnostics button. Shader readiness is never implied. */
export function diagnosticsReport(device = "unavailable") {
  const d = state;
  return [
    "MisterY Labs Cenotaph diagnostics",
    line("device", device),
    line("webgl", d.webglVersion),
    line("renderer", d.renderer),
    line("context", d.context),
    line("maxFragmentUniforms", d.maxFragmentUniforms),
    line("maxVertexUniforms", d.maxVertexUniforms),
    line("maxTextureUnits", d.maxTextureUnits),
    line("maxVaryingVectors", d.maxVaryingVectors),
    line("production", d.production),
    line("floor", d.floor),
    line("productionTriangles", d.productionTriangles),
    line("floorTriangles", d.floorTriangles),
    line("tier", d.tier),
    line("requestedTier", d.requestedTier),
    line("tierNote", d.tierNote),
    line("realLights", d.activeRealLights),
    line("archSlots", d.activeArchSlots),
    line("shaderLog", d.shaderLog),
    line("initError", d.initError),
    line("productionError", d.productionError),
    line("floorError", d.floorError),
  ].join("\n");
}
