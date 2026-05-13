/**
 * Klein bottle 2D projection — a topological symbol for MisterY Labs.
 *
 * A Klein bottle is a closed, non-orientable surface with no distinct inside
 * or outside. Used here as a recurring symbolic motif: a compass for recursive
 * inquiry, observer-dependent continuity, and geometric self-reference.
 *
 * The SVG renders the classic 2D immersion: a bottle whose neck curves around
 * the body and re-enters through the surface, creating a continuous manifold.
 * Dashed lines indicate the self-intersection where the tube crosses "through"
 * the surface. When animated, a signal dot traverses the path seamlessly from
 * outside to inside — demonstrating the non-orientable topology.
 */

interface KleinBottleProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

const CROSSING_PATH =
  "M 35 58 C 12 58, 2 80, 2 106 C 2 126, 14 140, 28 144" +
  " C 38 141, 50 138, 60 136 C 64 135, 68 134.5, 72 134.5";

export function KleinBottleSVG({
  size = 100,
  animated = false,
  className = "",
}: KleinBottleProps) {
  return (
    <svg
      viewBox="0 0 120 170"
      width={size}
      height={Math.round((size * 170) / 120)}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Klein bottle topology diagram"
      role="img"
      className={className}
    >
      {/* Body — the closed oval surface of the bottle */}
      <path
        d="M 20 108 C 18 136, 30 163, 60 167 C 90 163, 102 136, 100 108"
        stroke="currentColor"
        strokeWidth="1.3"
      />

      {/* Neck — left wall */}
      <line x1="37" y1="102" x2="35" y2="58" stroke="currentColor" strokeWidth="1.3" />

      {/* Neck — right wall */}
      <line x1="83" y1="102" x2="85" y2="58" stroke="currentColor" strokeWidth="1.3" />

      {/* Neck opening — the bottle mouth (curved top) */}
      <path
        d="M 35 58 C 42 50, 55 46, 60 46 C 65 46, 78 50, 85 58"
        stroke="currentColor"
        strokeWidth="1.3"
      />

      {/*
       * Klein crossing tube — outer visible arc.
       * The tube extends from the neck opening, sweeps left and down around
       * the body exterior, arriving at the surface to begin the crossing.
       */}
      <path
        d="M 35 58 C 12 58, 2 80, 2 106 C 2 126, 14 140, 28 144"
        stroke="currentColor"
        strokeWidth="1.3"
      />

      {/*
       * Self-intersection — tube entering through the body surface.
       * Dashed to indicate the surface crossing: the topological paradox
       * where the tube passes through its own wall with no hole.
       */}
      <path
        d="M 28 144 C 38 141, 50 138, 60 136"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeDasharray="4 3"
        opacity="0.55"
      />

      {/*
       * Interior continuation — the tube inside the manifold.
       * Very faint: the signal continues seamlessly from outside to inside,
       * with no boundary — the defining property of the Klein bottle.
       */}
      <path
        d="M 60 136 C 64 135, 68 134.5, 72 134.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.3"
      />

      {/*
       * Animated signal — a particle traversing the full path.
       * Travels continuously from the neck opening, around the outside,
       * through the surface crossing, and into the interior — demonstrating
       * that there is no true inside/outside boundary.
       */}
      {animated && (
        <circle r="2" fill="currentColor" opacity="0.9">
          <animateMotion dur="5s" repeatCount="indefinite" path={CROSSING_PATH} />
        </circle>
      )}
    </svg>
  );
}
