/**
 * Boullée elevation of Newton's Cenotaph, drawn as geometry.
 * Decorative. The page copy carries the meaning.
 */

type Column = { x: number; y: number; w: number; h: number; front: number };

function colonnade(kind: "back" | "front"): Column[] {
  const rx = 268;
  const ry = 58;
  const cy = 132;
  const start = kind === "back" ? -168 : 16;
  const end = kind === "back" ? -12 : 164;
  const n = kind === "back" ? 13 : 9;
  const cols: Column[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = ((start + (end - start) * t) * Math.PI) / 180;
    const front = (Math.sin(a) + 1) / 2;
    cols.push({
      x: Math.cos(a) * rx,
      y: cy + Math.sin(a) * ry,
      w: 14 + front * 6,
      h: 132 - front * 6,
      front,
    });
  }
  return cols;
}

const BACK = colonnade("back");
const FRONT = colonnade("front");

const STARS: Array<[number, number, number]> = [
  [70, 64, 1.1],
  [128, 118, 0.8],
  [196, 46, 1.3],
  [250, 150, 0.7],
  [318, 78, 1],
  [390, 132, 0.8],
  [460, 54, 1.2],
  [540, 96, 0.7],
  [980, 48, 1],
  [1088, 90, 0.8],
  [1140, 40, 1.2],
  [1024, 150, 0.7],
  [150, 210, 0.6],
  [420, 188, 0.6],
];

function ColumnMark({ col }: { col: Column }) {
  const cap = col.w + 8;
  return (
    <g className="wf-column" opacity={0.55 + col.front * 0.45}>
      <rect x={col.x - col.w / 2} y={col.y - col.h} width={col.w} height={col.h} />
      <rect className="wf-capital" x={col.x - cap / 2} y={col.y - col.h - 6} width={cap} height={6} />
      <rect x={col.x - cap / 2} y={col.y - 4} width={cap} height={4} />
    </g>
  );
}

export function CenotaphMark() {
  return (
    <svg
      className="wf-cenotaph"
      viewBox="0 0 1200 780"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="wfSphereClip">
          <circle r="214" />
        </clipPath>
      </defs>

      {STARS.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} className="wf-star" cx={x} cy={y} r={r} />
      ))}

      <g className="wf-monument">
        <g className="wf-fit">
        <ellipse className="wf-shadow" cx="0" cy="268" rx="310" ry="22" />

        <ellipse className="wf-terrace" cx="0" cy="248" rx="390" ry="34" />
        <ellipse className="wf-terrace wf-terrace-mid" cx="0" cy="226" rx="330" ry="28" />
        <ellipse className="wf-terrace wf-terrace-top" cx="0" cy="206" rx="276" ry="22" />
        <ellipse className="wf-inlay" cx="0" cy="198" rx="210" ry="10" />

        {BACK.map((col) => (
          <ColumnMark key={`b-${col.x.toFixed(1)}`} col={col} />
        ))}

        <g className="wf-shaft">
          <polygon points="-34,-460 34,-460 12,-168 -12,-168" />
        </g>

        <g clipPath="url(#wfSphereClip)">
          <circle className="wf-sphere" r="214" />
          <ellipse className="wf-shade" cx="78" cy="86" rx="190" ry="170" />
          <ellipse className="wf-engrave" cx="0" cy="-10" rx="204" ry="36" />
          <ellipse className="wf-engrave" cx="0" cy="52" rx="176" ry="24" />
          <ellipse className="wf-engrave" cx="0" cy="104" rx="128" ry="14" />
          <ellipse className="wf-engrave" cx="0" cy="0" rx="64" ry="214" />
          <ellipse className="wf-engrave" cx="0" cy="0" rx="136" ry="214" />
          <ellipse className="wf-glint" cx="-82" cy="-86" rx="86" ry="50" />
        </g>
        <circle className="wf-sphere-rim" r="214" />
        <ellipse className="wf-equator" cx="0" cy="8" rx="210" ry="22" />

        <circle className="wf-oculus" cy="-168" r="18" />
        <circle className="wf-oculus-glow" cy="-168" r="42" />

        {FRONT.map((col) => (
          <ColumnMark key={`f-${col.x.toFixed(1)}`} col={col} />
        ))}

        <g className="wf-door">
          <path d="M -15 176 v-52 a 15 15 0 0 1 30 0 v52 z" />
          <rect x="-1.4" y="140" width="2.8" height="28" />
        </g>
        </g>
      </g>
    </svg>
  );
}
