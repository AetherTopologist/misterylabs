import type { PaisMode } from "@/lib/cavendish/physics";
import { radToDeg } from "@/lib/cavendish/physics";

interface Props {
  theta: number;
  ghostTheta: number;
  mode: PaisMode;
  strength: number;
}

const CX = 360;
const CY = 220;
const ARM = 196;
const TEST_R = 16;
const SOURCE_R = 34;
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const FG = "hsl(var(--foreground))";
const BG = "hsl(var(--background))";
const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const CYAN = "hsl(var(--annotation-cyan))";
const AMBER = "hsl(var(--annotation-amber))";
const DIAGRAM = "hsl(var(--layer-diagram))";

export function TorsionBalance({ theta, ghostTheta, mode, strength }: Props) {
  const active = mode !== "ordinary";
  const field = mode === "gravity" ? AMBER : CYAN;
  const deg = radToDeg(theta);
  const ghostDeg = radToDeg(ghostTheta);

  const vis = -deg;
  const visGhost = -ghostDeg;
  const right = polar(-theta, ARM);
  const left = polar(-theta + Math.PI, ARM);
  const srcR = { x: 575, y: 132 };
  const srcL = { x: 145, y: 308 };

  return (
    <svg
      viewBox="0 0 720 420"
      className="h-auto w-full"
      role="img"
      aria-label={`Cavendish torsion balance at ${deg.toFixed(2)} degrees`}
    >
      <defs>
        <radialGradient id="cav-srcGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={AMBER} stopOpacity="0.35" />
          <stop offset="100%" stopColor={AMBER} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cav-testGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={CYAN} stopOpacity="0.4" />
          <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="720" height="420" fill={DIAGRAM} />
      <Grid />

      <text
        x="28"
        y="32"
        fill={MUTED}
        fontFamily={MONO}
        fontSize="9"
        letterSpacing="3.2"
      >
        TORSION BALANCE · SCHEMATIC, EXAGGERATED MOTION
      </text>
      <text
        x="692"
        y="32"
        textAnchor="end"
        fill={MUTED}
        fontFamily={MONO}
        fontSize="9"
        letterSpacing="2"
      >
        NOT LABORATORY SCALE
      </text>

      <circle cx={srcR.x} cy={srcR.y} r="54" fill="url(#cav-srcGlow)" />
      <circle cx={srcL.x} cy={srcL.y} r="54" fill="url(#cav-srcGlow)" />
      <circle cx={srcR.x} cy={srcR.y} r={SOURCE_R} fill={AMBER} fillOpacity="0.92" />
      <circle cx={srcL.x} cy={srcL.y} r={SOURCE_R} fill={AMBER} fillOpacity="0.92" />
      <circle cx={srcR.x} cy={srcR.y} r={SOURCE_R} fill="none" stroke={AMBER} strokeOpacity="0.5" strokeWidth="1.2" />
      <circle cx={srcL.x} cy={srcL.y} r={SOURCE_R} fill="none" stroke={AMBER} strokeOpacity="0.5" strokeWidth="1.2" />
      <Label x={srcR.x} y={srcR.y - SOURCE_R - 12} text="source mass M" />
      <Label x={srcL.x} y={srcL.y + SOURCE_R + 18} text="source mass M" />

      <line
        x1={CX + right.x}
        y1={CY + right.y}
        x2={srcR.x}
        y2={srcR.y}
        stroke={AMBER}
        strokeOpacity="0.28"
        strokeDasharray="3 5"
        strokeWidth="1"
      />
      <line
        x1={CX + left.x}
        y1={CY + left.y}
        x2={srcL.x}
        y2={srcL.y}
        stroke={AMBER}
        strokeOpacity="0.28"
        strokeDasharray="3 5"
        strokeWidth="1"
      />

      {active && Math.abs(ghostTheta - theta) > 0.004 && (
        <g
          transform={`rotate(${visGhost} ${CX} ${CY})`}
          opacity="0.28"
          aria-hidden
        >
          <line
            x1={CX - ARM}
            y1={CY}
            x2={CX + ARM}
            y2={CY}
            stroke={FG}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={CX - ARM} cy={CY} r={TEST_R} fill={FG} />
          <circle cx={CX + ARM} cy={CY} r={TEST_R} fill={FG} />
        </g>
      )}

      <line
        x1={CX}
        y1="48"
        x2={CX}
        y2={CY}
        stroke={MUTED}
        strokeWidth="1.6"
      />
      <circle cx={CX} cy="48" r="4" fill={FG} fillOpacity="0.7" />
      <Label x={CX + 58} y={52} text="torsion fiber" />

      <g transform={`rotate(${vis * 3.2} ${CX} ${CY})`}>
        <line
          x1={CX}
          y1={CY - 46}
          x2={CX}
          y2={CY - 8}
          stroke={AMBER}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY - 46} r="3.2" fill={AMBER} />
      </g>

      <g transform={`rotate(${vis} ${CX} ${CY})`}>
        <line
          x1={CX - ARM}
          y1={CY}
          x2={CX + ARM}
          y2={CY}
          stroke={FG}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r="6" fill={FG} />
        <circle cx={CX} cy={CY} r="2.4" fill={BG} />

        <circle cx={CX - ARM} cy={CY} r="26" fill="url(#cav-testGlow)" />
        <circle cx={CX - ARM} cy={CY} r={TEST_R} fill={CYAN} />

        <circle cx={CX + ARM} cy={CY} r="26" fill="url(#cav-testGlow)" />
        {active && (
          <g>
            {[1, 1.55, 2.15].map((s) => (
              <ellipse
                key={s}
                cx={CX + ARM}
                cy={CY}
                rx={TEST_R * s * 1.35}
                ry={TEST_R * s}
                fill="none"
                stroke={field}
                strokeOpacity={0.22 + strength * 0.35}
                strokeWidth="1.2"
                strokeDasharray="5 6"
                className="pais-shell"
              />
            ))}
          </g>
        )}
        <circle cx={CX + ARM} cy={CY} r={TEST_R} fill={CYAN} />
        {active && (
          <circle
            cx={CX + ARM}
            cy={CY}
            r={TEST_R + 3}
            fill="none"
            stroke={field}
            strokeOpacity="0.8"
            strokeWidth="1.4"
          />
        )}
      </g>

      {active && (
        <text
          x={CX + right.x + 18}
          y={CY + right.y + 52}
          fill={field}
          fontFamily={MONO}
          fontSize="9"
          letterSpacing="1.6"
        >
          Pais-active test object
        </text>
      )}

      <g transform={`translate(${CX}, ${CY + 78})`}>
        <text
          textAnchor="middle"
          fill={AMBER}
          fontFamily={MONO}
          fontSize="13"
          letterSpacing="1"
        >
          θ = {deg.toFixed(2)}°
        </text>
        <text
          y="18"
          textAnchor="middle"
          fill={MUTED}
          fontFamily={MONO}
          fontSize="8"
          letterSpacing="2.4"
        >
          EQUILIBRIUM SEEKS τg / k
        </text>
      </g>
    </svg>
  );
}

function polar(angle: number, r: number) {
  return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
}

function Label({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill={MUTED}
      fontFamily={MONO}
      fontSize="8"
      letterSpacing="1.8"
    >
      {text}
    </text>
  );
}

function Grid() {
  const lines = [];
  for (let x = 40; x < 720; x += 40) {
    lines.push(
      <line
        key={`v${x}`}
        x1={x}
        y1="0"
        x2={x}
        y2="420"
        stroke={BORDER}
        strokeOpacity="0.45"
      />,
    );
  }
  for (let y = 40; y < 420; y += 40) {
    lines.push(
      <line
        key={`h${y}`}
        x1="0"
        y1={y}
        x2="720"
        y2={y}
        stroke={BORDER}
        strokeOpacity="0.45"
      />,
    );
  }
  return <g aria-hidden>{lines}</g>;
}
