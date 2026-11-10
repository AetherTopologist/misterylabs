export type DockTab = "ride" | "field" | "drivers" | "compare"

type DockState = { open: boolean; tab: DockTab }

let state: DockState = { open: false, tab: "ride" }
const listeners = new Set<() => void>()

export function getDock(): DockState {
  return state
}

export function setDock(next: Partial<DockState>) {
  const merged: DockState = { ...state, ...next }
  if (merged.open === state.open && merged.tab === state.tab) return
  state = merged
  listeners.forEach((fn) => fn())
}

export function subscribeDock(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
