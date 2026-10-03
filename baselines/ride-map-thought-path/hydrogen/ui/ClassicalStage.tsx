import { useEffect, useId, useRef, useSyncExternalStore } from "react"

export type OrbitPhase = "picture" | "falling" | "failed"

const ANIMATION_MS = 4800

function subscribeMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)")
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

function motionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, motionSnapshot, () => false)
}

function spiralPoint(t: number) {
  const radius = 68
  const turns = 2.25
  const theta = t * turns * Math.PI * 2
  const r = radius * (1 - t * 0.9)
  return {
    x: 100 + r * Math.cos(theta),
    y: 100 + r * Math.sin(theta),
  }
}

function spiralPath() {
  const samples = 96
  let path = ""
  for (let i = 0; i <= samples; i++) {
    const point = spiralPoint(i / samples)
    path += i === 0 ? `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}` : ` L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
  }
  return path
}

const SPIRAL = spiralPath()
const START = spiralPoint(0)
const END = spiralPoint(1)

const LABEL: Record<OrbitPhase, string> = {
  picture: "A bead on a circular orbit around a center.",
  falling: "The bead leaves the circle and spirals inward.",
  failed: "The bead has reached the center. This orbit model has collapsed.",
}

export function ClassicalStage({
  phase,
  compact,
  onArrived,
}: {
  phase: OrbitPhase
  compact: boolean
  onArrived: () => void
}) {
  const pathId = useId().replace(/:/g, "")
  const arrived = useRef(onArrived)
  arrived.current = onArrived

  useEffect(() => {
    if (phase !== "falling") return
    const id = window.setTimeout(() => arrived.current(), ANIMATION_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  const bead = phase === "picture" ? START : END
  const showSpiral = phase !== "picture"
  const animate = phase === "falling"

  return (
    <figure className="border border-line bg-surface">
      <figcaption className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <span className="font-display text-lg leading-none text-fg">Classical model</span>
        <span className="inline-flex items-center rounded-sm border border-line px-1.5 py-0.5 text-xs tracking-wide text-muted uppercase">
          Interpreted
        </span>
      </figcaption>
      <div className="relative px-3 pt-3">
        {phase === "failed" ? (
          <p className="absolute top-5 right-5 border border-copper px-2 py-1 text-xs tracking-widest text-copper uppercase">
            Model that fails
          </p>
        ) : null}
        <svg
          viewBox="0 0 200 200"
          className={compact ? "mx-auto h-36 w-full text-copper" : "mx-auto h-64 w-full text-copper"}
          role="img"
          aria-label={LABEL[phase]}
        >
          <circle
            cx="100"
            cy="100"
            r="68"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeDasharray="3 4"
            className="text-muted"
          />
          {showSpiral ? (
            <path id={pathId} d={SPIRAL} fill="none" stroke="currentColor" strokeWidth="2.6" />
          ) : null}
          <circle cx="100" cy="100" r="3.2" className="fill-fg" />
          {animate ? (
            <circle r="4.2" className="fill-copper">
              <animateMotion dur="4.8s" repeatCount="1" fill="freeze" calcMode="linear">
                <mpath href={`#${pathId}`} />
              </animateMotion>
            </circle>
          ) : (
            <circle cx={bead.x.toFixed(2)} cy={bead.y.toFixed(2)} r="4.2" className="fill-copper" />
          )}
        </svg>
      </div>
      <div className="h-3" />
    </figure>
  )
}
