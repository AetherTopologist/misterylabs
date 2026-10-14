import { useEffect, useReducer, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Droplets, Moon, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { OpticalBench } from "./OpticalBench";
import {
  PHOTON_RIDE,
  INITIAL_COCKPIT,
  reduceCockpit,
  type CockpitTab,
} from "./cockpit";
import {
  F_MAX,
  F_MIN,
  FULL_WELL,
  ISO_BASE,
  SHUTTER_MAX,
  SHUTTER_MIN,
  activeLedger,
  conjugate,
  detectedElectrons,
  dominantLimit,
  effectiveFNumber,
  effectiveIso,
  effectiveShutter,
  formatClock,
  formatEv,
  formatFNumber,
  formatIso,
  formatLength,
  formatSci,
  formatShutter,
  isoGain,
  layerBlur,
  mtfQuarterNyquist,
  photonScale,
  propagationTimes,
  samplingMtf,
  seeingCaption,
  snrFromElectrons,
  type ControlState,
  type LedgerLine,
  type Mode,
} from "./physics";
import { forestLinks, photonEdges, photonNodes, type Node } from "./graph";
import { PLATE_SOURCES, adoptPhotographs, createScene, drawFrame, type Scene } from "./render";

const times = propagationTimes();
const ISO_STOPS = [100, 200, 400, 800, 1600, 3200, 6400];
const TABS: { id: CockpitTab; label: string; short: string }[] = [
  { id: "exposure", label: "Exposure", short: "Exposure" },
  { id: "optics", label: "Optics", short: "Optics" },
  { id: "atmosphere", label: "Atmosphere", short: "Air" },
  { id: "ledger", label: "Ledger", short: "Ledger" },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function Sci({ value }: { value: number }) {
  const formatted = formatSci(value);
  if (typeof formatted === "string") return <span className="tabular-nums">{formatted}</span>;
  return (
    <span className="tabular-nums">
      {formatted.mant.toFixed(2)}×10<sup>{formatted.exp}</sup>
    </span>
  );
}

function albedoOf(mode: Mode) {
  return mode === "moon" ? 0.18 : 0.14;
}

export function PhotonJourney() {
  const reduced = useReducedMotion();
  const [cockpit, dispatch] = useReducer(reduceCockpit, INITIAL_COCKPIT);
  const [selected, setSelected] = useState("thin-lens");
  const { mode, controls, tab, ride, opticView } = cockpit;
  const scene = ride.phase === "idle" ? null : PHOTON_RIDE[ride.scene];

  useEffect(() => {
    if (ride.phase !== "playing") return;
    const quantum = reduced ? 1600 : 125;
    const id = window.setInterval(() => {
      dispatch({ type: "ride-tick", dt: quantum, reduced });
    }, quantum);
    return () => window.clearInterval(id);
  }, [ride.phase, reduced]);

  const opt = conjugate(mode, controls.fNumber, controls.focus);
  const blur = layerBlur(mode, controls.seeing, controls.focus, effectiveFNumber(controls));
  const electrons = detectedElectrons(albedoOf(mode), controls);
  const gain = isoGain(controls);
  const limit = dominantLimit(mode, controls);
  const highlight = detectedElectrons(mode === "moon" ? 0.72 : 1.15, controls) * gain;
  const label = mode === "moon" ? "Moon / far field" : "Macro / near field";

  const onFieldKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      dispatch({ type: "mode", mode: "macro" });
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      dispatch({ type: "mode", mode: "moon" });
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-3 py-4 text-photon-ink sm:px-4 sm:py-6">
      <header>
        <p className="font-mono text-xs tracking-widest text-photon-faint uppercase">
          <Link to="/atlas" className="text-photon-amber">
            Atlas
          </Link>
          {" · Photon Journey · v1.0"}
        </p>
        <h1 className="mt-1 text-xl leading-tight text-photon-ink sm:text-3xl">From moonlight to microcosm</h1>
        <p className="mt-1 max-w-2xl text-sm leading-snug text-photon-muted italic sm:text-lg">
          Why can a phone photograph the Moon, yet struggle to focus on a droplet inches away?
        </p>
        <p className="mt-1 font-mono text-xs tracking-widest text-photon-faint uppercase">
          Ride · Map ·{" "}
          <a href="#thought-path" className="text-photon-amber">
            Thought path
          </a>
        </p>
      </header>

      <div
        className="instrument mt-2 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4"
        data-field={mode}
        data-tab={tab}
        data-ride={ride.phase}
        data-scene={scene?.id ?? "map"}
        data-tier={controls.tier}
      >
        <section className="lg:sticky lg:top-3" aria-label="Virtual camera">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Optical field" onKeyDown={onFieldKey}>
            <FieldButton
              active={mode === "moon"}
              label="Moon"
              hint="Far field"
              icon={<Moon className="size-4" aria-hidden="true" />}
              onClick={() => dispatch({ type: "mode", mode: "moon" })}
            />
            <FieldButton
              active={mode === "macro"}
              label="Macro"
              hint="Near field"
              icon={<Droplets className="size-4" aria-hidden="true" />}
              onClick={() => dispatch({ type: "mode", mode: "macro" })}
            />
          </div>

          <div className="preview-frame relative mt-2">
            <div className="relative overflow-hidden border border-photon-line bg-photon-bg">
              <LivePreview mode={mode} controls={controls} reduced={reduced} label={label} />
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute top-2 right-2 left-2 flex items-start justify-between gap-2 font-mono text-xs tracking-wide text-photon-ink/80 uppercase">
                  <span>{label}</span>
                  <span className="text-right">
                    {formatShutter(effectiveShutter(controls))} · {formatFNumber(effectiveFNumber(controls))} ·{" "}
                    {formatIso(effectiveIso(controls))}
                  </span>
                </div>
                <div className="absolute top-1/2 right-0 left-0 h-px bg-photon-ink/25" />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-photon-ink/25" />
                <div className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 border border-photon-ink/70" />
              </div>
              {scene ? (
                <p className="absolute inset-x-0 bottom-0 bg-photon-bg/85 px-3 py-2 text-sm leading-snug text-photon-ink" aria-live="polite">
                  <span className="font-mono text-xs tracking-widest text-photon-amber uppercase">
                    {ride.scene + 1}/{PHOTON_RIDE.length} · {scene.title}
                  </span>
                  <span className="mt-1 block">{scene.caption}</span>
                </p>
              ) : null}
            </div>
          </div>

          <p
            className="mt-2 font-mono text-xs tracking-wide text-photon-muted"
            data-readout="camera"
            data-electrons={Math.round(electrons)}
            data-gain={gain}
          >
            {Math.round(electrons).toLocaleString("en-US")} e⁻ · gain {gain.toFixed(gain >= 10 ? 0 : 1)}× · PSF{" "}
            {blur.subject.toFixed(1)} px · SNR {snrFromElectrons(electrons).toFixed(1)}
            {highlight > FULL_WELL ? " · clipping" : ""}
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="font-mono text-xs tracking-widest text-photon-amber uppercase" data-limit={limit}>
              Limit · {limit}
            </p>
            <button
              type="button"
              className="tap inline-flex min-h-11 items-center gap-2 border border-photon-line px-3 font-mono text-xs tracking-widest text-photon-ink uppercase"
              onClick={() => dispatch({ type: "reset" })}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset
            </button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2" role="group" aria-label="Ride controls">
            <RideButton
              label={ride.phase === "playing" ? "Pause" : "Play"}
              onClick={() => dispatch({ type: ride.phase === "playing" ? "ride-pause" : "ride-play" })}
            >
              {ride.phase === "playing" ? <Pause className="size-4" /> : <Play className="size-4" />}
            </RideButton>
            <RideButton label="Replay" onClick={() => dispatch({ type: "ride-replay" })}>
              <RotateCcw className="size-4" />
            </RideButton>
            <RideButton label="Skip" onClick={() => dispatch({ type: "ride-skip" })}>
              <SkipForward className="size-4" />
            </RideButton>
            <RideButton
              label="Take control"
              disabled={ride.phase === "idle"}
              onClick={() => dispatch({ type: "take-control" })}
            />
          </div>
        </section>

        <section className="mt-3 border border-photon-line lg:mt-0" aria-label="Optical cockpit">
          <div className="grid grid-cols-4 border-b border-photon-line" role="tablist" aria-label="Instrument panels">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls={`panel-${item.id}`}
                className={`tap min-h-11 px-1 font-mono text-xs tracking-wide uppercase ${
                  tab === item.id ? "border-b-2 border-photon-amber text-photon-ink" : "text-photon-faint"
                }`}
                onClick={() => dispatch({ type: "tab", tab: item.id })}
              >
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>

          <div
            className="px-3 py-3"
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
          >
            {tab === "exposure" ? (
              <ExposurePanel
                controls={controls}
                electrons={electrons}
                gain={gain}
                clipping={highlight > FULL_WELL}
                onTier={(tier) => dispatch({ type: "tier", tier })}
                onChange={(patch) => dispatch({ type: "patch", patch })}
              />
            ) : null}
            {tab === "optics" ? (
              <div>
                <Slider
                  id="optics-focus"
                  label="Focus accuracy"
                  valueLabel={`${Math.round(controls.focus * 100)}%`}
                  min={0}
                  max={1}
                  step={0.01}
                  value={controls.focus}
                  onChange={(focus) => dispatch({ type: "patch", patch: { focus } })}
                />
                <Slider
                  id="optics-aperture"
                  label="Aperture"
                  valueLabel={formatFNumber(effectiveFNumber(controls))}
                  min={F_MIN}
                  max={F_MAX}
                  step={0.1}
                  value={effectiveFNumber(controls)}
                  onChange={(fNumber) => dispatch({ type: "patch", patch: { fNumber } })}
                />
                <dl className="mt-3 grid grid-cols-2 gap-px bg-photon-line" data-optic="live">
                  <Stat term="Focus travel" detail={formatLength(opt.defocusM)} />
                  <Stat term="Circle" detail={formatLength(opt.cocDiameterM)} />
                  <Stat term="Diffraction" detail={`${blur.diffraction.toFixed(1)} px`} />
                  <Stat
                    term="m = v/u"
                    detail={mode === "moon" ? "→ 0" : opt.magnification.toFixed(3)}
                  />
                </dl>
                <p className="mt-2 text-sm text-photon-muted" data-magnification={opt.magnification}>
                  {mode === "macro"
                    ? "Live magnification is the thin-lens conjugate, v/u. Aperture does not change it."
                    : "Collimated field. Image distance is the focal length."}
                </p>
                <OpticalBench
                  mode={mode}
                  controls={controls}
                  view={opticView}
                  showSliders={false}
                  onView={(view) => dispatch({ type: "optic-view", view })}
                />
              </div>
            ) : null}
            {tab === "atmosphere" ? (
              <div>
                <Slider
                  id="seeing"
                  label="Atmospheric disturbance"
                  valueLabel={`${Math.round(controls.seeing * 100)}%`}
                  min={0}
                  max={1}
                  step={0.01}
                  value={controls.seeing}
                  onChange={(seeing) => dispatch({ type: "patch", patch: { seeing } })}
                />
                <p className="mt-2 text-sm leading-relaxed text-photon-muted">{seeingCaption(mode)}</p>
                <p className="mt-2 font-mono text-xs text-photon-faint">
                  Seeing {blur.seeing.toFixed(1)} px · wander {blur.warpPx.toFixed(1)} px
                </p>
              </div>
            ) : null}
            {tab === "ledger" ? <Ledger mode={mode} controls={controls} /> : null}
          </div>
        </section>
      </div>

      <ThoughtPath
        selected={selected}
        onSelect={setSelected}
        onSeam={() => {
          setSelected("atomic-touch");
          document.getElementById("thought-path")?.scrollIntoView({
            behavior: reduced ? "auto" : "smooth",
            block: "start",
          });
        }}
      />

      <footer className="mt-6 border-t border-photon-line py-4 text-sm text-photon-faint">
        <p>See the light. Question the image. Follow the photon.</p>
        <p className="mt-2">
          Photon Journey v1.0. An illustrative thin lens, full well, and plate scale — not a calibrated camera, and not a
          diffraction integral.
        </p>
        <p className="mt-2 text-photon-ink">{PLATE_SOURCES.moon.title}</p>
        <p>{PLATE_SOURCES.moon.credit}</p>
        <p className="mt-2 text-photon-ink">{PLATE_SOURCES.leaf.title}</p>
        <p>{PLATE_SOURCES.leaf.credit}</p>
      </footer>
    </main>
  );
}

function LivePreview({
  mode,
  controls,
  reduced,
  label,
}: {
  mode: Mode;
  controls: ControlState;
  reduced: boolean;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const loadingPlates = useRef(false);
  const mounted = useRef(true);
  const stateRef = useRef({ mode, controls, reduced });
  stateRef.current = { mode, controls, reduced };
  const [plates, setPlates] = useState({ moon: false, leaf: false });
  const frameKey = [
    mode,
    controls.ev,
    controls.seeing,
    controls.focus,
    controls.fNumber,
    controls.shutter,
    controls.iso,
    controls.tier,
    reduced,
    plates.moon,
    plates.leaf,
  ].join("|");

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!sceneRef.current || sceneRef.current.rev !== 3) sceneRef.current = createScene();
    const scene = sceneRef.current;
    let frame = 0;
    let alive = true;
    let last = 0;
    const tick = (now: number) => {
      if (!alive) return;
      const current = stateRef.current;
      const terms = layerBlur(current.mode, current.controls.seeing, current.controls.focus, current.controls.fNumber);
      const animate = !current.reduced && terms.warpPx > 0.5;
      if (!animate || now - last > 90) {
        last = now;
        drawFrame(scene, canvas, current.mode, current.controls, now / 1000);
      }
      if (animate) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    if (!loadingPlates.current && (!scene.photos.moon || !scene.photos.leaf)) {
      loadingPlates.current = true;
      adoptPhotographs(scene)
        .then((next) => {
          loadingPlates.current = false;
          if (mounted.current) setPlates(next);
        })
        .catch(() => {
          loadingPlates.current = false;
        });
    }
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, [frameKey]);

  return (
    <canvas
      ref={canvasRef}
      className="viewfinder block w-full"
      aria-label={`${label} sensor preview. Illustrative, not a calibrated camera.`}
    />
  );
}

function ExposurePanel({
  controls,
  electrons,
  gain,
  clipping,
  onTier,
  onChange,
}: {
  controls: ControlState;
  electrons: number;
  gain: number;
  clipping: boolean;
  onTier: (tier: ControlState["tier"]) => void;
  onChange: (patch: Partial<ControlState>) => void;
}) {
  const iso = effectiveIso(controls);
  const isoIndex = Math.max(0, ISO_STOPS.indexOf(controls.iso));
  return (
    <div>
      <div className="flex gap-2" role="group" aria-label="Exposure mode">
        <TierButton active={controls.tier === "basic"} label="Basic" onClick={() => onTier("basic")} />
        <TierButton active={controls.tier === "advanced"} label="Advanced" onClick={() => onTier("advanced")} />
      </div>
      {controls.tier === "basic" ? (
        <Slider
          id="exposure-ev"
          label="Exposure compensation"
          valueLabel={formatEv(controls.ev)}
          min={-4}
          max={4}
          step={0.1}
          value={controls.ev}
          onChange={(ev) => onChange({ ev })}
        />
      ) : (
        <>
          <LogSlider
            id="exposure-shutter"
            label="Shutter duration"
            valueLabel={formatShutter(controls.shutter)}
            min={SHUTTER_MIN}
            max={SHUTTER_MAX}
            value={controls.shutter}
            onChange={(shutter) => onChange({ shutter })}
          />
          <Slider
            id="exposure-aperture"
            label="Aperture"
            valueLabel={formatFNumber(controls.fNumber)}
            min={F_MIN}
            max={F_MAX}
            step={0.1}
            value={controls.fNumber}
            onChange={(fNumber) => onChange({ fNumber })}
          />
          <div className="mt-3">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="exposure-iso" className="text-base text-photon-ink">
                ISO / gain
              </label>
              <span className="font-mono text-sm text-photon-ink">{formatIso(controls.iso)}</span>
            </div>
            <input
              id="exposure-iso"
              className="optic-range"
              type="range"
              min={0}
              max={ISO_STOPS.length - 1}
              step={1}
              value={ISO_STOPS.includes(controls.iso) ? isoIndex : 0}
              aria-valuetext={formatIso(controls.iso)}
              onChange={(event) => onChange({ iso: ISO_STOPS[Number(event.target.value)] ?? ISO_BASE })}
            />
          </div>
        </>
      )}
      <p className="mt-3 text-sm leading-relaxed text-photon-ink" data-photon-scale={photonScale(controls).toFixed(3)}>
        {Math.round(electrons).toLocaleString("en-US")} detected e⁻ · file gain {gain.toFixed(gain >= 10 ? 0 : 1)}× ·{" "}
        {clipping ? "highlights clipping" : "highlights inside the well"}
      </p>
      <p className="mt-1 text-sm text-photon-muted">
        {controls.tier === "basic"
          ? `Compensation moves only the shutter. Mapping is ${formatIso(iso)}.`
          : "Shutter and aperture change the photon count. ISO does not."}
        {controls.tier === "basic" && controls.iso !== ISO_BASE
          ? ` Stored ${formatIso(controls.iso)} comes back in Advanced.`
          : ""}
      </p>
    </div>
  );
}

function RideButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className="tap inline-flex min-h-11 items-center justify-center gap-1 border border-photon-line px-1 font-mono text-xs tracking-wide text-photon-ink uppercase disabled:text-photon-faint"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
      <span className="font-mono text-xs">{label === "Take control" ? "Take" : label}</span>
    </button>
  );
}

function FieldButton({
  active,
  label,
  hint,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  hint: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`tap flex min-h-11 items-center justify-center gap-2 rounded-full border px-3 py-2 font-mono text-sm tracking-wide ${
        active ? "border-photon-ink bg-photon-raise text-photon-ink" : "border-transparent text-photon-faint"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className="hidden text-xs text-photon-faint sm:inline">{hint}</span>
    </button>
  );
}

function Slider({
  id,
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  id: string;
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-base text-photon-ink">
          {label}
        </label>
        <span className="font-mono text-sm text-photon-ink tabular-nums">{valueLabel}</span>
      </div>
      <input
        id={id}
        className="optic-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function TierButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`tap min-h-11 flex-1 border px-3 font-mono text-xs tracking-widest uppercase ${
        active ? "border-photon-ink text-photon-ink" : "border-photon-line text-photon-faint"
      }`}
    >
      {label}
    </button>
  );
}

function LogSlider({
  id,
  label,
  valueLabel,
  min,
  max,
  value,
  onChange,
}: {
  id: string;
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const clamped = Math.min(max, Math.max(min, value));
  const pos = (Math.log(clamped) - logMin) / (logMax - logMin);
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-base text-photon-ink">
          {label}
        </label>
        <span className="font-mono text-sm text-photon-ink tabular-nums">{valueLabel}</span>
      </div>
      <input
        id={id}
        className="optic-range"
        type="range"
        min={0}
        max={1000}
        step={1}
        value={Math.round(pos * 1000)}
        aria-valuetext={valueLabel}
        onChange={(event) => {
          const t = Number(event.target.value) / 1000;
          onChange(Math.exp(logMin + t * (logMax - logMin)));
        }}
      />
    </div>
  );
}

function Stat({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="bg-photon-bg px-3 py-2">
      <dt className="font-mono text-xs tracking-widest text-photon-faint uppercase">{term}</dt>
      <dd className="mt-1 font-mono text-sm text-photon-ink">{detail}</dd>
    </div>
  );
}

function Ledger({ mode, controls }: { mode: Mode; controls: ControlState }) {
  const book = activeLedger(mode, controls);
  const blur = layerBlur(mode, controls.seeing, controls.focus, effectiveFNumber(controls));
  const electrons = detectedElectrons(albedoOf(mode), controls);
  const gain = isoGain(controls);
  const spatial = [
    ["Defocus", mtfQuarterNyquist(blur.defocus)],
    ["Diffraction", mtfQuarterNyquist(blur.diffraction)],
    ["Atmospheric blur", mtfQuarterNyquist(blur.seeing)],
    ["Pixel sampling", samplingMtf()],
  ] as const;
  const combined = spatial.slice(0, 3).reduce((acc, item) => acc * item[1], 1);
  const travel =
    mode === "moon"
      ? [
          ["Sun → Moon", formatClock(times.sunToEarthS)],
          ["Moon → Earth", formatClock(times.moonToEarthS)],
          ["Exposure", formatShutter(effectiveShutter(controls))],
        ]
      : [
          ["Sun → leaf", formatClock(times.sunToEarthS)],
          ["Leaf → lens", formatClock(times.leafToLensS)],
          ["Exposure", formatShutter(effectiveShutter(controls))],
        ];

  return (
    <div>
      <div className="grid grid-cols-3 gap-px bg-photon-line">
        {travel.map(([name, value]) => (
          <div key={name} className="bg-photon-bg px-2 py-2">
            <p className="font-mono text-xs tracking-wide text-photon-faint uppercase">{name}</p>
            <p className="mt-1 text-sm text-photon-ink">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-photon-ink">
        {Math.round(electrons).toLocaleString("en-US")} detected e⁻ · photon scale {photonScale(controls).toFixed(2)}× ·{" "}
        {formatIso(effectiveIso(controls))} is {gain.toFixed(gain >= 10 ? 0 : 1)}× after the count
      </p>
      <p className="mt-1 text-sm text-photon-muted">
        Blur is not a bin in the energy ledger. Unresolved detail is still light. Fraction into the pupil{" "}
        <Sci value={book.fraction} />.
      </p>
      <ol className="mt-2 divide-y divide-photon-line">
        {book.lines.map((line) => (
          <LedgerRow key={line.id} line={line} />
        ))}
      </ol>
      <ul className="mt-3 space-y-2">
        {spatial.map(([name, value]) => (
          <Meter key={name} label={name} value={value} />
        ))}
        <Meter label="Blur product" value={combined} />
      </ul>
    </div>
  );
}

function LedgerRow({ line }: { line: LedgerLine }) {
  return (
    <li className="grid gap-1 py-2 sm:grid-cols-[1fr_auto]">
      <div>
        <p className="text-sm text-photon-ink">{line.label}</p>
        <p className="text-sm text-photon-muted">{line.note}</p>
      </div>
      <p className="font-mono text-sm text-photon-amber sm:text-right">
        <Sci value={line.photons} />
      </p>
    </li>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  const width = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`;
  return (
    <li>
      <div className="flex justify-between font-mono text-xs tracking-wide text-photon-faint uppercase">
        <span>{label}</span>
        <span className="text-photon-ink">{Math.round(value * 100)}%</span>
      </div>
      <div className="mt-1 h-px bg-photon-line">
        <div className="h-px bg-photon-cyan" style={{ width }} />
      </div>
    </li>
  );
}

function ThoughtPath({
  selected,
  onSelect,
  onSeam,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onSeam: () => void;
}) {
  const node = photonNodes.find((item) => item.id === selected) ?? photonNodes[0];
  const groups: { stratum: Node["stratum"]; label: string }[] = [
    { stratum: "trunk", label: "Trunk" },
    { stratum: "root", label: "Roots" },
    { stratum: "branch", label: "Branches" },
    { stratum: "seam", label: "Seams" },
  ];
  return (
    <section id="thought-path" className="mt-6 scroll-mt-4 border border-photon-line" aria-labelledby="thought-title">
      <div className="px-3 py-3">
        <p className="font-mono text-xs tracking-widest text-photon-amber uppercase">Thought path</p>
        <h2 id="thought-title" className="mt-1 text-xl text-photon-ink">
          Same roots as the rest of the forest
        </h2>
        <p className="mt-1 text-sm text-photon-muted">
          {photonNodes.length} nodes, {photonEdges.length} edges. Evidence cannot hang from a branch. A seam is not a result.
        </p>
      </div>
      <div className="grid gap-4 border-t border-photon-line px-3 py-3 lg:grid-cols-2">
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.stratum}>
              <p className="font-mono text-xs tracking-widest text-photon-faint uppercase">{group.label}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {photonNodes
                  .filter((item) => item.stratum === group.stratum)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={item.id === node.id}
                      className={`tap min-h-11 border px-3 py-2 text-left text-sm ${
                        item.id === node.id ? "border-photon-amber text-photon-ink" : "border-photon-line text-photon-muted"
                      }`}
                      onClick={() => onSelect(item.id)}
                    >
                      {item.title}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <NodeCard node={node} />
      </div>
      <div className="border-t border-photon-line px-3 py-3">
        <h3 className="text-base text-photon-ink">Shared foundations</h3>
        <ul className="mt-2 divide-y divide-photon-line">
          {forestLinks.map((link) => (
            <li key={link.id} className="py-2">
              <p className="font-mono text-xs tracking-widest text-photon-cyan uppercase">
                {link.canonId} · {link.peerExhibit} · {link.relation.replace(/_/g, " ")}
              </p>
              <p className="mt-1 text-sm text-photon-ink">{link.peerLabel}</p>
              <p className="text-sm text-photon-muted">{link.note}</p>
              {link.href ? (
                <Link
                  to={link.href}
                  className="mt-1 inline-flex min-h-11 items-center font-mono text-xs tracking-widest text-photon-amber uppercase"
                >
                  {link.hrefLabel ?? "Open exhibit"}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="tap mt-3 min-h-11 border border-photon-line px-3 font-mono text-xs tracking-widest text-photon-ink uppercase"
          onClick={onSeam}
        >
          Atomic Touch seam
        </button>
      </div>
    </section>
  );
}

function NodeCard({ node }: { node: Node }) {
  const edges = photonEdges.filter((edge) => edge.from === node.id || edge.to === node.id);
  return (
    <article className="border border-photon-line bg-photon-raise p-3">
      <p className="font-mono text-xs tracking-widest text-photon-amber uppercase">
        {node.stratum} · {node.epistemic}
        {node.register ? ` · ${node.register.replace(/_/g, " ")}` : ""}
      </p>
      <h3 className="mt-2 text-xl text-photon-ink">{node.title}</h3>
      <p className="mt-2 text-sm text-photon-muted">{node.claim}</p>
      {node.equation ? (
        <p className="mt-3 overflow-x-auto border border-photon-line px-3 py-2 font-mono text-sm text-photon-ink">{node.equation}</p>
      ) : null}
      {node.behavior ? <p className="mt-3 text-sm text-photon-ink">On the instrument: {node.behavior}</p> : null}
      {node.source ? <p className="mt-3 text-sm text-photon-faint">{node.source}</p> : null}
      {node.canonId ? <p className="mt-2 font-mono text-xs tracking-widest text-photon-cyan uppercase">{node.canonId}</p> : null}
      {edges.length ? (
        <ul className="mt-3 space-y-2">
          {edges.map((edge) => (
            <li key={edge.id} className="text-sm text-photon-muted">
              <span className="font-mono text-xs tracking-wide text-photon-faint uppercase">
                {edge.relation.replace(/_/g, " ")}
              </span>
              . {edge.note}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-photon-faint">No evidence edge. A seam is allowed to stand unattached.</p>
      )}
    </article>
  );
}
