import { useMemo, useState } from "react";
import {
  A_MAX,
  WIDTH_MAX,
  WIDTH_MIN,
  annularRadii,
  centerHighRadius,
  describeField,
  isolineGs,
  spatial,
} from "@/lib/polar-grin/field";
import { THETA_MAX, THETA_MIN, clampTheta } from "@/lib/polar-grin/frame";
import {
  FEATURE_SCALE_DEFAULT,
  FEATURE_SCALE_MAX,
  FEATURE_SCALE_MIN,
  RECESS_DEFAULT,
  RECESS_MAX,
  RECESS_MIN,
  applePathD,
  clampFeatureScale,
  clampRecess,
  leafPathD,
  polePos,
  stemPathD,
} from "@/lib/polar-grin/geometry";
import { APPLE_FILL, APPLE_STROKE, MATERIAL_FILL } from "@/lib/polar-grin/palette";
import {
  BEST_ZERO_ESCAPE,
  SWEEP_STRENGTHS,
  bundle,
  countMaterials,
  persistentChannels,
  redCoverage,
} from "@/lib/polar-grin/rays";
import {
  APPLE,
  FIELD_LABEL,
  MATERIAL_LABEL,
  MATERIAL_SHORT,
  type FieldConfig,
  type FieldProfile,
  type MaterialClass,
  type RayPath,
} from "@/lib/polar-grin/types";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const MUTED = "hsl(var(--muted-foreground))";
const FG = "hsl(var(--foreground))";
const CYAN = "hsl(var(--annotation-cyan))";
const DIAGRAM = "hsl(var(--layer-diagram))";
const PROFILES: FieldProfile[] = ["off", "center-high", "annular-high"];
const CLASSES: MaterialClass[] = ["red", "stem", "leaf", "divot", "escaped"];

export function PolarGrinInstrument() {
  const [profile, setProfile] = useState<FieldProfile>("off");
  const [strengthPct, setStrengthPct] = useState(
    Math.round((BEST_ZERO_ESCAPE.strength / A_MAX) * 100),
  );
  const [width, setWidth] = useState(BEST_ZERO_ESCAPE.width);
  const [theta, setTheta] = useState(0);
  const [featureScale, setFeatureScale] = useState(FEATURE_SCALE_DEFAULT);
  const [recessDepth, setRecessDepth] = useState(RECESS_DEFAULT);
  const [selected, setSelected] = useState<number | null>(null);

  const cfg = useMemo<FieldConfig>(() => {
    if (profile === "off") {
      return { profile: "off", strength: 0, width, theta, featureScale, recessDepth };
    }
    return {
      profile,
      strength: (strengthPct / 100) * A_MAX,
      width,
      theta,
      featureScale,
      recessDepth,
    };
  }, [profile, strengthPct, width, theta, featureScale, recessDepth]);

  const rays = useMemo(() => bundle(cfg), [cfg]);
  const counts = useMemo(() => countMaterials(rays), [rays]);
  const coverage = redCoverage(rays);
  const persistent = useMemo(
    () => persistentChannels(width, theta, featureScale, recessDepth),
    [width, theta, featureScale, recessDepth],
  );
  const selectedRay = selected ? (rays.find((r) => r.id === selected) ?? null) : null;
  const sp = spatial(cfg);
  const liveProfile = profile === "off" || cfg.strength <= 0 ? "off" : profile;

  return (
    <div className="instrument-demo space-y-5">
      <section className="panel overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-4 py-2.5 sm:px-5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/80">
              MIND · TRANSPORT READOUT
            </div>
            <div className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
              Same object. Different path.
            </div>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400">
            {FIELD_LABEL[liveProfile]}
          </div>
        </header>
        <AppleScene rays={rays} cfg={cfg} selectedId={selected} />
      </section>

      <section className="panel p-4 sm:p-5">
        <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">Field</div>
        <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.22em] text-cyan-400/80">
          Transport. Locked to target
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PROFILES.map((p) => {
            const on = profile === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setProfile(p)}
                className={
                  "min-h-11 rounded-sm border px-3 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors " +
                  (on
                    ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                    : "border-border/40 text-muted-foreground")
                }
              >
                {FIELD_LABEL[p]}
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Strength A</span>
              <span className="tabular-nums text-cyan-400">
                {profile === "off" ? "0.00" : cfg.strength.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={profile === "off" ? 0 : strengthPct}
              disabled={profile === "off"}
              onChange={(e) => setStrengthPct(Number(e.target.value))}
              className="mt-2 w-full accent-cyan-400 disabled:opacity-40"
              aria-label="Field strength"
            />
          </label>
          <label className="block">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Width w</span>
              <span className="tabular-nums text-cyan-400">{width.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={WIDTH_MIN}
              max={WIDTH_MAX}
              step={0.05}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="mt-2 w-full accent-cyan-400"
              aria-label="Field width"
            />
          </label>
        </div>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {describeField(cfg)}
          <br />
          {liveProfile === "center-high"
            ? `σx ${sp.sx.toFixed(0)} px · σy ${sp.sy.toFixed(0)} px`
            : liveProfile === "annular-high"
              ? `ring r0 ${sp.r0} px · thickness ${sp.ringW.toFixed(1)} px`
              : "w scales Gaussian σ and ring thickness. r0 stays 40 px."}{" "}
          n ∈ [1.00, {(1 + A_MAX).toFixed(2)}].
        </p>
      </section>

      <section className="panel p-4 sm:p-5">
        <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">Target</div>
        <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.22em] text-cyan-400/80">
          Geometry. Changes the object
        </div>
        <div className="mt-4 grid gap-4">
          <label className="block">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Orientation θ</span>
              <span className="tabular-nums text-cyan-400">{theta.toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min={THETA_MIN}
              max={THETA_MAX}
              step={1}
              value={theta}
              onChange={(e) => setTheta(clampTheta(Number(e.target.value)))}
              className="mt-2 w-full accent-cyan-400"
              aria-label="Target orientation"
            />
          </label>
          <label className="block">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Feature scale</span>
              <span className="tabular-nums text-cyan-400">{featureScale.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min={FEATURE_SCALE_MIN}
              max={FEATURE_SCALE_MAX}
              step={0.05}
              value={featureScale}
              onChange={(e) => setFeatureScale(clampFeatureScale(Number(e.target.value)))}
              className="mt-2 w-full accent-cyan-400"
              aria-label="Stem and leaf feature scale"
            />
          </label>
          <label className="block">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Recess depth</span>
              <span className="tabular-nums text-cyan-400">{recessDepth.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min={RECESS_MIN}
              max={RECESS_MAX}
              step={0.05}
              value={recessDepth}
              onChange={(e) => setRecessDepth(clampRecess(Number(e.target.value)))}
              className="mt-2 w-full accent-cyan-400"
              aria-label="Polar recess depth"
            />
          </label>
        </div>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          θ rotates apple, stem, leaf, and field as one rigid assembly. Feature scale resizes stem
          and leaf from the pole. Recess deepens the polar dent; 1.00× is the design silhouette. The
          stem seats on the live surface. Recess and scale change the object. Field strength does
          not.
        </p>
      </section>

      <section className="panel overflow-hidden">
        <header className="border-b border-border/50 px-4 py-2.5 sm:px-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/80">
            HEART-EYE · WITNESS SCAN
          </div>
          <p className="mt-1 text-sm text-muted-foreground">One cell per ray. Categorical, not a spectrum.</p>
        </header>
        <div className="px-3 py-3 sm:px-5">
          <div
            className="flex h-16 overflow-hidden rounded-sm sm:h-20"
            role="list"
            aria-label="Witness scan"
          >
            {rays.map((ray) => {
              const active = selected === ray.id;
              return (
                <button
                  key={ray.id}
                  type="button"
                  role="listitem"
                  onClick={() => setSelected(ray.id === selected ? null : ray.id)}
                  className="h-full min-w-11 flex-1 border-r border-background last:border-r-0"
                  style={{
                    background: MATERIAL_FILL[ray.material],
                    boxShadow: active ? "inset 0 0 0 2px hsl(var(--foreground))" : undefined,
                  }}
                  aria-pressed={active}
                  aria-label={`Ray ${String(ray.id).padStart(2, "0")} ${MATERIAL_LABEL[ray.material]}`}
                />
              );
            })}
          </div>
          <div className="mt-1 flex">
            {rays.map((ray) => (
              <span
                key={ray.id}
                className="min-w-11 flex-1 text-center font-mono text-[9px] tabular-nums text-muted-foreground"
              >
                {String(ray.id).padStart(2, "0")}
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm">
            {CLASSES.map((k) => (
              <div key={k} className="flex items-baseline gap-2">
                <span
                  className="inline-block size-2 rounded-sm"
                  style={{ background: MATERIAL_FILL[k] }}
                  aria-hidden
                />
                <span className="text-muted-foreground">{MATERIAL_SHORT[k]}</span>
                <span className="tabular-nums text-foreground">
                  {counts[k]}/{rays.length}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            RED COVERAGE FRACTION {counts.red}/{rays.length} = {coverage.toFixed(2)}
          </p>
        </div>
      </section>

      {selectedRay && <Inspector ray={selectedRay} cfg={cfg} />}

      <section className="panel p-4 sm:p-5">
        <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
          Persistence · measured range
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Geometric occlusion (recess / scale / θ) is not optical accessibility. Compare FIELD OFF
          and FIELD ON at the same target. Canonical θ=0 · scale=1 · recess=1: ANNULAR A=0.30 w=0.70
          → RED 7/11, ESC 0/11. Honest OFF→ON (feature still sampled): θ=0 · 0.50× · recess=2.00×
          CENTER HIGH A=0.60 w=2.40 turns `eeeesrrrrrr` into `rrrsrrrrrrr` (RED 6→10, one stem remains).
          Extreme snapshot θ=0 · 0.50× · recess=3.00× ANNULAR A=1.20 w=2.40 is `rrrdrrrrrrr` — RED 10,
          DIVOT 1, ESC 0. Same target FIELD OFF is `eeeerrrrrrr` (no stem/leaf/divot). The darker cell
          is DIVOT on the recessed cup, not a paint error. Measured 11/11 exists only where FIELD OFF
          already hid the features. Isolated ESC is kept.
        </p>
        {persistent.length === 0 ? (
          <p className="mt-3 font-mono text-sm text-foreground">
            No persistent feature channels at w={width.toFixed(2)} · θ={theta.toFixed(0)}° · scale=
            {featureScale.toFixed(2)}× · recess={recessDepth.toFixed(2)}×.
          </p>
        ) : (
          <ul className="mt-3 space-y-1 font-mono text-sm">
            {persistent.map((ch) => (
              <li key={ch.id} className="text-muted-foreground">
                <span className="text-amber-400">RAY {String(ch.id).padStart(2, "0")}</span>
                {" · "}
                PERSISTENT FEATURE CHANNEL (A ∈ {SWEEP_STRENGTHS.join(", ")} · w=
                {width.toFixed(2)} · θ={theta.toFixed(0)}° · scale={featureScale.toFixed(2)}× ·
                recess={recessDepth.toFixed(2)}×)
                {" · "}
                <span className="text-foreground">
                  {ch.materials.map((m) => MATERIAL_SHORT[m]).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Inspector({ ray, cfg }: { ray: RayPath; cfg: FieldConfig }) {
  const profileName =
    cfg.profile === "off" || cfg.strength <= 0 ? FIELD_LABEL.off : FIELD_LABEL[cfg.profile];
  return (
    <section className="panel p-4 sm:p-5">
      <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/80">Ray inspector</div>
      <dl className="mt-3 grid grid-cols-1 gap-y-2 font-mono text-sm sm:grid-cols-2 sm:gap-x-4">
        <dt className="text-muted-foreground">RAY ID</dt>
        <dd className="text-right tabular-nums">{String(ray.id).padStart(2, "0")}</dd>
        <dt className="text-muted-foreground">LAUNCH POSITION</dt>
        <dd className="text-right tabular-nums">
          {ray.launch.x.toFixed(1)}, {ray.launch.y.toFixed(1)}
        </dd>
        <dt className="text-muted-foreground">LAUNCH DIRECTION</dt>
        <dd className="text-right tabular-nums">
          {ray.direction.x.toFixed(3)}, {ray.direction.y.toFixed(3)}
        </dd>
        <dt className="text-muted-foreground">FIELD CONFIGURATION</dt>
        <dd className="text-right">{profileName}</dd>
        <dt className="text-muted-foreground">STRENGTH A</dt>
        <dd className="text-right tabular-nums">{cfg.strength.toFixed(2)}</dd>
        <dt className="text-muted-foreground">WIDTH w</dt>
        <dd className="text-right tabular-nums">{cfg.width.toFixed(2)}</dd>
        <dt className="text-muted-foreground">ORIENTATION θ</dt>
        <dd className="text-right tabular-nums">{cfg.theta.toFixed(0)}°</dd>
        <dt className="text-muted-foreground">FEATURE SCALE</dt>
        <dd className="text-right tabular-nums">{cfg.featureScale.toFixed(2)}×</dd>
        <dt className="text-muted-foreground">RECESS DEPTH</dt>
        <dd className="text-right tabular-nums">{cfg.recessDepth.toFixed(2)}×</dd>
        <dt className="text-muted-foreground sm:col-span-2">n(x,y)</dt>
        <dd className="text-xs leading-snug sm:col-span-2">{describeField(cfg)}</dd>
        <dt className="text-muted-foreground">TERMINAL POSITION</dt>
        <dd className="text-right tabular-nums">
          {ray.terminal.x.toFixed(1)}, {ray.terminal.y.toFixed(1)}
        </dd>
        <dt className="text-muted-foreground">MATERIAL CLASS</dt>
        <dd className="text-right" style={{ color: MATERIAL_FILL[ray.material] }}>
          {MATERIAL_LABEL[ray.material]}
        </dd>
        <dt className="text-muted-foreground">MAX |dû/ds|</dt>
        <dd className="text-right tabular-nums">{ray.maxCurvature.toFixed(4)}</dd>
      </dl>
    </section>
  );
}

function AppleScene({
  rays,
  cfg,
  selectedId,
}: {
  rays: RayPath[];
  cfg: FieldConfig;
  selectedId: number | null;
}) {
  const recess = cfg.recessDepth;
  const pole = polePos(recess);
  const appleD = applePathD(recess);
  const A = cfg.strength;
  const showField = cfg.profile !== "off" && A > 0.02;
  const scale = cfg.width;
  const featureScale = cfg.featureScale;

  return (
    <svg
      viewBox="0 0 720 420"
      className="h-auto w-full"
      width="720"
      height="420"
      role="img"
      aria-label="Polar GRIN apple with a probe bundle and index-field isolines"
    >
      <rect width="720" height="420" fill={DIAGRAM} />
      <Grid />
      <text x="28" y="32" fill={MUTED} fontFamily={MONO} fontSize="10" letterSpacing="3.2">
        POLAR GRIN · OPTICAL ACCESSIBILITY
      </text>
      <text
        x="692"
        y="32"
        textAnchor="end"
        fill={MUTED}
        fontFamily={MONO}
        fontSize="10"
        letterSpacing="2"
      >
        OBJECT REMAINS
      </text>

      <g transform={`rotate(${cfg.theta} ${APPLE.cx} ${APPLE.cy})`}>
        {showField &&
          isolineGs().map((g, i) => {
            const op = 0.18 + (A / A_MAX) * 0.35;
            if (cfg.profile === "center-high") {
              const { rx, ry } = centerHighRadius(g, scale);
              return (
                <ellipse
                  key={g}
                  cx={pole.x}
                  cy={pole.y}
                  rx={rx}
                  ry={ry}
                  fill="none"
                  stroke={CYAN}
                  strokeOpacity={op - i * 0.04}
                  strokeDasharray={i === 0 ? undefined : "4 6"}
                  strokeWidth="1.2"
                />
              );
            }
            const { inner, outer } = annularRadii(g, scale);
            return (
              <g key={g}>
                <circle
                  cx={pole.x}
                  cy={pole.y}
                  r={outer}
                  fill="none"
                  stroke={CYAN}
                  strokeOpacity={op - i * 0.04}
                  strokeDasharray="4 6"
                  strokeWidth="1.2"
                />
                {inner > 4 && (
                  <circle
                    cx={pole.x}
                    cy={pole.y}
                    r={inner}
                    fill="none"
                    stroke={CYAN}
                    strokeOpacity={op - i * 0.05}
                    strokeDasharray="4 6"
                    strokeWidth="1"
                  />
                )}
              </g>
            );
          })}

        <path d={appleD} fill={APPLE_FILL} stroke={APPLE_STROKE} strokeWidth="1.6" />
        <ellipse
          cx={392 - 22}
          cy={232 - 18}
          rx="28"
          ry="36"
          fill={APPLE_STROKE}
          opacity="0.18"
        />
        <path
          d={stemPathD(featureScale, recess)}
          fill="none"
          stroke={MATERIAL_FILL.stem}
          strokeWidth={4 * featureScale}
          strokeLinecap="round"
        />
        <path
          d={leafPathD(featureScale, recess)}
          fill={MATERIAL_FILL.leaf}
          stroke={MATERIAL_FILL.leaf}
          strokeWidth={Math.max(1, featureScale)}
        />
      </g>

      {rays.map((ray) => (
        <RayStroke key={ray.id} ray={ray} selected={ray.id === selectedId} />
      ))}

      <text x="28" y="400" fill={MUTED} fontFamily={MONO} fontSize="10" letterSpacing="2.4">
        WITNESS = SAMPLING BOUNDARY
      </text>
      <text
        x="692"
        y="400"
        textAnchor="end"
        fill={FG}
        fontFamily={MONO}
        fontSize="10"
        letterSpacing="2"
        opacity="0.7"
      >
        11 PROBE RAYS
      </text>
    </svg>
  );
}

function RayStroke({ ray, selected }: { ray: RayPath; selected: boolean }) {
  if (ray.points.length < 2) return null;
  const d = ray.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const last = ray.terminal;
  const color = selected ? FG : MATERIAL_FILL[ray.material];
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeOpacity={selected ? 1 : 0.82}
        strokeWidth={selected ? 2.4 : 1.35}
      />
      <circle cx={ray.launch.x} cy={ray.launch.y} r={selected ? 3.2 : 1.6} fill={color} />
      <circle cx={last.x} cy={last.y} r={selected ? 4.2 : 2.4} fill={color} />
    </g>
  );
}

function Grid() {
  const lines = [];
  for (let x = 40; x < 720; x += 40) {
    lines.push(
      <line
        key={"v" + x}
        x1={x}
        y1={0}
        x2={x}
        y2={420}
        stroke="hsl(var(--border))"
        strokeOpacity="0.35"
      />,
    );
  }
  for (let y = 40; y < 420; y += 40) {
    lines.push(
      <line
        key={"h" + y}
        x1={0}
        y1={y}
        x2={720}
        y2={y}
        stroke="hsl(var(--border))"
        strokeOpacity="0.35"
      />,
    );
  }
  return <g>{lines}</g>;
}
