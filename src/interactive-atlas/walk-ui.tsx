import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { EXHIBITS, type ExhibitId, type WalkerPose } from "./destinations";
import { CEN_FOOT, GROUND_R, PATHS, PLACES } from "./world";

const VB = 200;

function project(x: number, z: number) {
  const s = VB / (GROUND_R * 2.16);
  return [VB / 2 + x * s, VB / 2 - z * s] as const;
}

export function FairMap({ walker, open, onToggle }: { walker: WalkerPose; open: boolean; onToggle: () => void }) {
  const [cx, cy] = project(0, 0);
  const foot = (CEN_FOOT * VB) / (GROUND_R * 2.16);
  const [ax, ay] = project(walker.x, walker.z);
  const deg = (walker.heading * 180) / Math.PI;
  return (
    <button
      type="button"
      className={open ? "ia-map is-open" : "ia-map"}
      onClick={onToggle}
      aria-pressed={open}
      aria-label={open ? "Shrink the atlas map" : "Expand the atlas map"}
    >
      <svg viewBox={`0 0 ${VB} ${VB}`} aria-hidden="true">
        <circle cx={cx} cy={cy} r={foot * (GROUND_R / CEN_FOOT)} fill="#0b0d11" stroke="rgba(196,165,116,0.28)" strokeWidth="0.7" />
        {PATHS.map((path, i) => (
          <polyline
            key={i}
            fill="none"
            stroke="rgba(243,238,228,0.42)"
            strokeWidth="0.85"
            points={path.pts.map(([x, , z]) => project(x, z).join(",")).join(" ")}
          />
        ))}
        <circle cx={cx} cy={cy} r={foot} fill="none" stroke="rgba(196,165,116,0.85)" strokeWidth="1.1" />
        {(Object.keys(PLACES) as ExhibitId[]).map((id) => {
          const [x, y] = project(PLACES[id].x, PLACES[id].z);
          return (
            <g key={id}>
              <circle cx={x} cy={y} r={open ? 2.3 : 1.7} fill="#e7dccb" />
              {open ? (
                <text x={x + 3.2} y={y + 1.2} fill="#c9c2b4" fontSize="4.2" fontFamily="Outfit, sans-serif">
                  {EXHIBITS[id].name}
                </text>
              ) : null}
            </g>
          );
        })}
        <g transform={`translate(${ax} ${ay}) rotate(${deg})`}>
          <path d="M0 -5.1 L2.7 3.6 L0 1.5 L-2.7 3.6 Z" fill="#c4a574" />
        </g>
      </svg>
    </button>
  );
}

export function WalkStick({ onChange }: { onChange: (x: number, y: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const pressing = useRef(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  function fromEvent(e: ReactPointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.36);
    let y = -((e.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.36));
    const m = Math.hypot(x, y);
    if (m > 1) {
      x /= m;
      y /= m;
    }
    setKnob({ x, y });
    onChange(x, y);
  }

  function release() {
    pressing.current = false;
    setKnob({ x: 0, y: 0 });
    onChange(0, 0);
  }

  return (
    <div
      ref={ref}
      className="ia-stick"
      role="application"
      aria-label="Walk. Drag to move Mister Why. Arrow keys and W A S D do the same."
      onPointerDown={(e) => {
        e.stopPropagation();
        pressing.current = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* Capture is a convenience. The stick still tracks the pointer. */
        }
        fromEvent(e);
      }}
      onPointerMove={(e) => {
        if (pressing.current || e.currentTarget.hasPointerCapture(e.pointerId)) fromEvent(e);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <i style={{ transform: `translate(${knob.x * 26}px, ${-knob.y * 26}px)` }} />
    </div>
  );
}
