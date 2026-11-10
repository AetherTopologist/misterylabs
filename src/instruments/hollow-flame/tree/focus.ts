type Listener = (id: string) => void

const listeners = new Set<Listener>()

export function requestTreeFocus(id: string) {
  listeners.forEach((fn) => fn(id))
  document.getElementById("tree")?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export function subscribeTreeFocus(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
