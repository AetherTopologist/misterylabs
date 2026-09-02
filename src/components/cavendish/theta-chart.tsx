import type { HistoryPoint, PaisMode } from "@/lib/cavendish/physics";
import { HISTORY_WINDOW, radToDeg } from "@/lib/cavendish/physics";

interface Props {
  history: HistoryPoint[];
  t: number;
  thetaEq: number;
  thetaEqBaseline: number;
  mode: PaisMode;
}

const W = 720;
const H = 220;
const PAD = { l: 48, r: 18, t: 28, b: 32 };
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const FG = "hsl(var(--foreground))";
const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const CYAN = "hsl(var(--annotation-cyan))";
const AMBER = "hsl(var(--annotation-amber))";
const DIAGRAM = "hsl(var(--layer-diagram))";

export function ThetaChart({ history, t, thetaEq, thetaEqBaseline, mode }: Props) {
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const t0 = Math.max(0, t - HISTORY_WINDOW);
  const t1 = Math.max(t0 + HISTORY_WINDOW, t);
  const yMax = Math.max(
    12,
    Math.abs(radToDeg(thetaEqBaseline)) * 2.4,
    ...history.map((p) => Math.abs(radToDeg(p.active))),
    ...history.map((p) => Math.abs(radToDeg(p.baseline))),
  );
  const yMin = -yMax * 0.15;

  const xOf = (time: number) => PAD.l + ((time - t0) / (t1 - t0)) * innerW;
  const yOf = (theta: number) => {
    const deg = radToDeg(theta);
    return PAD.t + ((yMax - deg) / (yMax - yMin)) * innerH;
  };

  const activePath = toPath(history, xOf, yOf, "active");
  const basePath = toPath(history, xOf, yOf, "baseline");
  const eqY = yOf(thetaEq);
  const eqBaseY = yOf(thetaEqBaseline);
  const activeColor = mode === "gravity" ? AMBER : CYAN;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Angle versus time">
      <rect width={W} height={H} fill={DIAGRAM} />
      <text
        x={PAD.l}
        y="18"
        fill={MUTED}
        fontFamily={MONO}
        fontSize="9"
        letterSpacing="2.8"
      >
        θ(t) · DEGREES
      </text>

      <line
        x1={PAD.l}
        y1={PAD.t}
        x2={PAD.l}
        y2={H - PAD.b}
        stroke={BORDER}
      />
      <line
        x1={PAD.l}
        y1={H - PAD.b}
        x2={W - PAD.r}
        y2={H - PAD.b}
        stroke={BORDER}
      />

      <line
        x1={PAD.l}
        y1={yOf(0)}
        x2={W - PAD.r}
        y2={yOf(0)}
        stroke={BORDER}
        strokeDasharray="2 4"
      />

      <line
        x1={PAD.l}
        y1={eqBaseY}
        x2={W - PAD.r}
        y2={eqBaseY}
        stroke={FG}
        strokeOpacity="0.28"
        strokeDasharray="4 5"
      />
      {mode === "gravity" && (
        <line
          x1={PAD.l}
          y1={eqY}
          x2={W - PAD.r}
          y2={eqY}
          stroke={AMBER}
          strokeOpacity="0.7"
          strokeDasharray="4 5"
        />
      )}

      <path d={basePath} fill="none" stroke={FG} strokeOpacity="0.4" strokeWidth="1.6" />
      <path d={activePath} fill="none" stroke={activeColor} strokeWidth="2.2" />

      <Tick y={yOf(0)} label="0" />
      <Tick y={eqBaseY} label={`${radToDeg(thetaEqBaseline).toFixed(1)}°`} />
      {mode === "gravity" && (
        <Tick y={eqY} label={`${radToDeg(thetaEq).toFixed(1)}°`} accent />
      )}

      <text
        x={PAD.l}
        y={H - 8}
        fill={MUTED}
        fontFamily={MONO}
        fontSize="8"
        letterSpacing="1.6"
      >
        t = {t.toFixed(1)} s
      </text>
      <Legend x={W - PAD.r} color={activeColor} />
    </svg>
  );
}

function toPath(
  history: HistoryPoint[],
  xOf: (t: number) => number,
  yOf: (th: number) => number,
  key: "active" | "baseline",
) {
  if (history.length === 0) return "";
  return history
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(p.t).toFixed(2)} ${yOf(p[key]).toFixed(2)}`)
    .join(" ");
}

function Tick({ y, label, accent }: { y: number; label: string; accent?: boolean }) {
  return (
    <text
      x={PAD.l - 8}
      y={y + 3}
      textAnchor="end"
      fill={accent ? AMBER : MUTED}
      fontFamily={MONO}
      fontSize="8"
    >
      {label}
    </text>
  );
}

function Legend({ x, color }: { x: number; color: string }) {
  return (
    <g>
      <line x1={x - 168} y1="14" x2={x - 148} y2="14" stroke={FG} strokeOpacity="0.4" strokeWidth="1.6" />
      <text x={x - 142} y="17" fill={MUTED} fontFamily={MONO} fontSize="8" letterSpacing="1.2">
        ORDINARY
      </text>
      <line x1={x - 78} y1="14" x2={x - 58} y2="14" stroke={color} strokeWidth="2.2" />
      <text x={x - 52} y="17" fill={MUTED} fontFamily={MONO} fontSize="8" letterSpacing="1.2">
        ACTIVE
      </text>
    </g>
  );
}
