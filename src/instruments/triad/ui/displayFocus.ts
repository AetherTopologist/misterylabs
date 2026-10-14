import { useSyncExternalStore } from "react";

/** Presentation emphasis only. Not a solver input and not part of COPY RUN. */
export type DisplayFocus = "balanced" | "aircraft" | "field" | "sources";

export type DisplayWeights = {
  field: number;
  locus: number;
  nodes: number;
  aircraft: number;
  poynting: number;
};

let focus: DisplayFocus = "balanced";
const listeners = new Set<() => void>();

export function getDisplayFocus(): DisplayFocus {
  return focus;
}

export function setDisplayFocus(next: DisplayFocus) {
  if (next === focus) return;
  focus = next;
  listeners.forEach((fn) => fn());
}

export function displayWeights(mode: DisplayFocus = focus): DisplayWeights {
  if (mode === "aircraft") return { field: 0.12, locus: 0.12, nodes: 0.4, aircraft: 1, poynting: 0.12 };
  if (mode === "field") return { field: 0.7, locus: 0.2, nodes: 0.5, aircraft: 0.9, poynting: 0.8 };
  if (mode === "sources") return { field: 0.16, locus: 0.88, nodes: 1, aircraft: 0.75, poynting: 0.3 };
  return { field: 0.32, locus: 0.22, nodes: 0.55, aircraft: 1, poynting: 0.4 };
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useDisplayFocus(): DisplayFocus {
  return useSyncExternalStore(subscribe, getDisplayFocus, getDisplayFocus);
}
