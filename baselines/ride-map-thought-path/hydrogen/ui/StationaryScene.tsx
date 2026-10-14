import { volumeDensityShape } from "../physics/schrodinger1s"
import { EpistemicTag } from "./EpistemicTag"

export function StationaryScene({ reduced }: { reduced: boolean }) {
  const bands = 16
  const maxU = 3.4
  const maxR = 62
  return (
    <figure className="border border-line bg-surface">
      <figcaption className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <span className="font-display text-lg leading-none text-fg">Quantum 1s</span>
        <EpistemicTag kind="calculated" />
      </figcaption>
      <div className="grid grid-cols-2 gap-2 px-3 pt-3">
        <svg
          viewBox="0 0 160 150"
          className="h-36 w-full text-fg"
          role="img"
          aria-label="Stationary 1s density. No orbiting bead. The brightness does not rotate."
        >
          {Array.from({ length: bands }, (_, index) => {
            const u = ((index + 0.5) / bands) * maxU
            const radius = Number(((u / maxU) * maxR).toFixed(2))
            const width = Number(((maxU / bands) * maxR * 1.15).toFixed(2))
            const opacity = Number(volumeDensityShape(u).toFixed(4))
            return (
              <circle
                key={index}
                cx="80"
                cy="75"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={width}
                strokeOpacity={opacity}
              />
            )
          })}
        </svg>
        <svg
          viewBox="0 0 160 150"
          className="h-36 w-full text-fg"
          role="img"
          aria-label="Complex-plane clock for the global phase. This diagram is not the atom."
        >
          <circle cx="80" cy="78" r="36" fill="none" stroke="currentColor" className="text-line" />
          <line x1="36" y1="78" x2="124" y2="78" stroke="currentColor" className="text-line" />
          <line x1="80" y1="34" x2="80" y2="122" stroke="currentColor" className="text-line" />
          {reduced ? (
            <circle cx="116" cy="78" r="4.5" className="fill-fg" />
          ) : (
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 80 78"
                to="360 80 78"
                dur="8s"
                repeatCount="indefinite"
              />
              <circle cx="116" cy="78" r="4.5" className="fill-fg" />
            </g>
          )}
          <text x="128" y="82" fill="currentColor" fontSize="11" className="text-muted">
            Re
          </text>
          <text x="84" y="30" fill="currentColor" fontSize="11" className="text-muted">
            Im
          </text>
        </svg>
      </div>
      <p className="px-3 text-sm tracking-wide text-fg uppercase">Phase evolves · density is stationary</p>
      <p className="px-3 pt-1 text-sm text-muted">ψ(r,t) = ψ₁₀₀(r) e^(−iE₁t/ℏ). |ψ|² does not change.</p>
      <p className="px-3 pb-3 text-sm text-muted">
        {reduced
          ? "Motion reduced. The phase clock is held. The density was never a path."
          : "The clock is a slowed picture of the global phase. It does not travel around the nucleus."}
      </p>
    </figure>
  )
}
