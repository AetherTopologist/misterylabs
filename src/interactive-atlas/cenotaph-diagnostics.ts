export type GlbPhase = "idle" | "loading" | "loaded" | "failed";
export type ContextPhase = "active" | "lost" | "restored";
export type LightTier = "pr38" | "minimal" | "budget" | "emissive" | "neutral";

export type CenotaphDiagnostics = {
  production: GlbPhase;
  full: GlbPhase;
  clean: GlbPhase;
  productionError: string | null;
  fullError: string | null;
  cleanError: string | null;
  productionTriangles: number | null;
  fullTriangles: number | null;
  cleanTriangles: number | null;
  context: ContextPhase;
  renderer: string;
  webglVersion: string;
  maxFragmentUniforms: number | null;
  maxVertexUniforms: number | null;
  maxTextureUnits: number | null;
  maxVaryingVectors: number | null;
  tier: LightTier;
  activeRealLights: number | null;
  activeArchSlots: number | null;
  /** "unavailable" until a compile or link log is actually captured. */
  shaderLog: string;
  initError: string | null;
};

const state: CenotaphDiagnostics = {
  production: "idle",
  full: "idle",
  clean: "idle",
  productionError: null,
  fullError: null,
  cleanError: null,
  productionTriangles: null,
  fullTriangles: null,
  cleanTriangles: null,
  context: "active",
  renderer: "unavailable",
  webglVersion: "unavailable",
  maxFragmentUniforms: null,
  maxVertexUniforms: null,
  maxTextureUnits: null,
  maxVaryingVectors: null,
  tier: "budget",
  activeRealLights: null,
  activeArchSlots: null,
  shaderLog: "unavailable",
  initError: null,
};

const listeners = new Set<() => void>();

export function getDiagnostics(): CenotaphDiagnostics {
  return state;
}

export function subscribeDiagnostics(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function patchDiagnostics(partial: Partial<CenotaphDiagnostics>) {
  Object.assign(state, partial);
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
    line("full", d.full),
    line("clean", d.clean),
    line("productionTriangles", d.productionTriangles),
    line("fullTriangles", d.fullTriangles),
    line("cleanTriangles", d.cleanTriangles),
    line("tier", d.tier),
    line("realLights", d.activeRealLights),
    line("archSlots", d.activeArchSlots),
    line("shaderLog", d.shaderLog),
    line("initError", d.initError),
    line("productionError", d.productionError),
    line("fullError", d.fullError),
    line("cleanError", d.cleanError),
  ].join("\n");
}
