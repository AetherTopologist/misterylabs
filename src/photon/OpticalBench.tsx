import {
  F_NUMBER,
  FOCAL_LENGTH_M,
  LAMBDA_M,
  MACRO_DISTANCE_M,
  bundleSpread,
  conjugate,
  finiteBundle,
  formatFNumber,
  formatLength,
  infinityBundle,
  overviewBundles,
  rayHeight,
  type ControlState,
  type Mode,
  type RayPath,
} from "./physics";

export type OpticView = "ray" | "wave";

const AXIS = 108;
const LENS_X = 146;
const FOCUS_X = 324;
const OBJ_X = 18;

function lensPath() {
  return `M ${LENS_X} 62 C ${LENS_X + 16} ${AXIS} ${LENS_X + 16} ${AXIS} ${LENS_X} 154 C ${LENS_X - 16} ${AXIS} ${LENS_X - 16} ${AXIS} ${LENS_X} 62`;
}

export function OpticalBench({
  mode,
  controls,
  view,
  onView,
  onFocus,
  onAperture,
  showSliders = true,
}: {
  mode: Mode;
  controls: ControlState;
  view: OpticView;
  onView: (view: OpticView) => void;
  onFocus?: (focus: number) => void;
  onAperture?: (fNumber: number) => void;
  showSliders?: boolean;
}) {
  const opt = conjugate(mode, controls.fNumber, controls.focus);
  const bundles = overviewBundles(opt);
  const pupilPx = 34;
  const yScale = pupilPx / (FOCAL_LENGTH_M / F_NUMBER / 2);
  const yOf = (meters: number) => AXIS - meters * yScale;
  const meet = (rays: RayPath[]) => yOf(rayHeight(rays[0], opt.imageDistanceM));
  const open = Math.abs(AXIS - yOf(opt.pupilM / 2));

  return (
    <div className={showSliders ? "border-t border-photon-line px-3 py-4 sm:px-4" : "pt-2"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs tracking-widest text-photon-cyan uppercase">Optical axis</p>
          <p className="mt-1 text-sm text-photon-muted">Not to scale. Paraxial thin lens, stop in the lens plane.</p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Ray or wave picture">
          <ViewButton active={view === "ray"} label="Rays" onClick={() => onView("ray")} />
          <ViewButton active={view === "wave"} label="Waves" onClick={() => onView("wave")} />
        </div>
      </div>

      <svg viewBox="0 0 360 200" className="mt-3 block w-full bg-photon-bg" role="img" aria-label={caption(mode, opt)}>
        <line x1="8" y1={AXIS} x2="352" y2={AXIS} className="stroke-photon-faint" strokeWidth="1" />
        <path d={lensPath()} className="fill-photon-cyan/15 stroke-photon-cyan" strokeWidth="1.5" />
        <line x1={LENS_X} y1="46" x2={LENS_X} y2={AXIS - open} className="stroke-photon-ink" strokeWidth="4" />
        <line x1={LENS_X} y1={AXIS + open} x2={LENS_X} y2="170" className="stroke-photon-ink" strokeWidth="4" />
        <line
          x1={FOCUS_X}
          y1="58"
          x2={FOCUS_X}
          y2="158"
          className="stroke-photon-amber"
          strokeWidth="1.25"
          strokeDasharray="3 3"
        />
        {view === "ray" ? (
          <>
            <BundleRays rays={bundles.lower} yOf={yOf} meetY={meet(bundles.lower)} tone="text-photon-amber" />
            <BundleRays rays={bundles.upper} yOf={yOf} meetY={meet(bundles.upper)} tone="text-photon-amber" />
            <BundleRays rays={bundles.axial} yOf={yOf} meetY={meet(bundles.axial)} tone="text-photon-cyan" chief />
          </>
        ) : (
          <Wavefronts mode={mode} pupilM={opt.pupilM} yOf={yOf} meetY={meet(bundles.upper)} />
        )}
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs tracking-wide text-photon-faint sm:grid-cols-4">
        <span>{mode === "moon" ? "Collimated in" : "Object plane"}</span>
        <span>Lens · stop</span>
        <span>Image plane</span>
        <span className="text-photon-amber">Optical axis →</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-photon-muted">
        {mode === "moon"
          ? "Parallel rays meet on the focal plane, at v = f."
          : `Object at ${formatLength(MACRO_DISTANCE_M)}, v = ${formatLength(opt.imageDistanceM)}, m = v/u = ${opt.magnification.toFixed(3)}. Not a fixed 1:1.`}
      </p>

      <Loupe mode={mode} fNumber={opt.fNumber} focus={controls.focus} view={view} />

      {showSliders && onFocus && onAperture ? (
        <div className="mt-4">
          <SliderRow
            id="bench-aperture"
            label="Aperture"
            valueLabel={formatFNumber(opt.fNumber)}
            min={1.4}
            max={16}
            step={0.1}
            value={opt.fNumber}
            onChange={onAperture}
          />
          <SliderRow
            id="bench-focus"
            label="Focus accuracy"
            valueLabel={`${Math.round(controls.focus * 100)}%`}
            min={0}
            max={1}
            step={0.01}
            value={controls.focus}
            onChange={onFocus}
          />
        </div>
      ) : null}
      {showSliders ? (
        <dl className="mt-4 grid grid-cols-2 gap-px bg-photon-line sm:grid-cols-4" data-optic="bench">
          <Readout term="Image distance" detail={formatLength(opt.imageDistanceM)} />
          <Readout term="Sensor" detail={formatLength(opt.sensorDistanceM)} />
          <Readout term="Defocus δ" detail={formatLength(opt.defocusM)} />
          <Readout term="Circle" detail={formatLength(opt.cocDiameterM)} />
          <Readout term="Pupil" detail={formatLength(opt.pupilM)} />
          <Readout term="N eff" detail={opt.nEff.toFixed(2)} />
          <Readout term="NA" detail={opt.numericalAperture.toFixed(3)} />
          <Readout term="Spread at sensor" detail={formatLength(bundleSpread(bundles.axial, opt.sensorDistanceM))} />
        </dl>
      ) : null}
      {showSliders ? (
        <p className="mt-3 text-sm text-photon-muted">
          Reference stop is {formatFNumber(F_NUMBER)}, pupil {formatLength(FOCAL_LENGTH_M / F_NUMBER)}. The loupe uses a
          linear axial scale across the focus travel and a taller vertical scale, so the cone looks steeper than the real
          f-number. Crossing and disk diameter still follow c = D|s − v| / v.
          {view === "wave"
            ? " Wavefronts are drawn on those same ray centers. The small disk in the loupe is the Airy radius 1.22 λ N(1+m), not a diffraction integral."
            : ""}
        </p>
      ) : (
        <p className="mt-2 text-sm text-photon-muted">
          Not to scale. c = D|s − v| / v.
          {view === "wave" ? " The loupe disk is the Airy radius, not a diffraction integral." : ""}
        </p>
      )}
    </div>
  );
}

function caption(mode: Mode, opt: ReturnType<typeof conjugate>) {
  const object = mode === "moon" ? "collimated light" : `an object at ${formatLength(MACRO_DISTANCE_M)}`;
  return `Optical bench, ${object}, image at ${formatLength(opt.imageDistanceM)}, sensor at ${formatLength(opt.sensorDistanceM)}, circle of confusion ${formatLength(opt.cocDiameterM)}.`;
}

function BundleRays({
  rays,
  yOf,
  meetY,
  tone,
  chief = false,
}: {
  rays: RayPath[];
  yOf: (meters: number) => number;
  meetY: number;
  tone: string;
  chief?: boolean;
}) {
  return (
    <g className={tone} stroke="currentColor" fill="none" strokeWidth={chief ? 1.25 : 1}>
      {rays.map((ray, index) => {
        const yLens = yOf(ray.yLens);
        const incomingY = yOf(ray.yLens - ray.thetaIn * 0.008);
        const dashed = chief && index === 1;
        return (
          <g key={index}>
            <line
              x1={OBJ_X}
              y1={incomingY}
              x2={LENS_X}
              y2={yLens}
              strokeDasharray={dashed ? "2 3" : undefined}
            />
            <line x1={LENS_X} y1={yLens} x2={FOCUS_X} y2={meetY} strokeDasharray={dashed ? "2 3" : undefined} />
          </g>
        );
      })}
    </g>
  );
}

function Wavefronts({
  mode,
  pupilM,
  yOf,
  meetY,
}: {
  mode: Mode;
  pupilM: number;
  yOf: (meters: number) => number;
  meetY: number;
}) {
  const top = yOf(pupilM / 2);
  const bot = yOf(-pupilM / 2);
  const incoming = [36, 70, 104];
  const after = [180, 214, 248, 286];
  return (
    <g className="stroke-photon-cyan" fill="none" strokeWidth="1.15">
      {mode === "moon"
        ? incoming.map((x) => <line key={x} x1={x} y1={top} x2={x} y2={bot} />)
        : incoming.map((x) => {
            const bow = (LENS_X - x) * 0.08;
            return <path key={x} d={`M ${x} ${top + 18} Q ${x + bow} ${AXIS} ${x} ${bot - 18}`} />;
          })}
      {after.map((x) => {
        const bow = (FOCUS_X - x) * 0.12;
        return <path key={x} d={`M ${x} ${meetY - 28} Q ${x + bow} ${meetY} ${x} ${meetY + 28}`} />;
      })}
    </g>
  );
}

function Loupe({
  mode,
  fNumber,
  focus,
  view,
}: {
  mode: Mode;
  fNumber: number;
  focus: number;
  view: OpticView;
}) {
  const opt = conjugate(mode, fNumber, focus);
  const z0 = opt.imageDistanceM - opt.deltaFullM * 0.22;
  const z1 = opt.imageDistanceM + opt.deltaFullM * 1.18;
  const xOf = (z: number) => 28 + ((z - z0) / (z1 - z0)) * 304;
  const refY = ((FOCAL_LENGTH_M / F_NUMBER) / 2) * (opt.deltaFullM / opt.imageDistanceM);
  const yScale = 56 / refY;
  const axis = 78;
  const yOf = (y: number) => axis - y * yScale;
  const rays =
    mode === "moon"
      ? infinityBundle(0, opt.pupilM, opt.focalLengthM)
      : finiteBundle(0, opt.objectDistanceM, opt.pupilM, opt.focalLengthM);
  const airy = 1.22 * LAMBDA_M * opt.nEff * yScale;
  const sensorX = xOf(opt.sensorDistanceM);
  const focusX = xOf(opt.imageDistanceM);
  const yTop = yOf(rayHeight(rays[0], opt.sensorDistanceM));
  const yBot = yOf(rayHeight(rays[2], opt.sensorDistanceM));

  return (
    <figure className="mt-4">
      <figcaption className="font-mono text-xs tracking-widest text-photon-faint uppercase">
        Loupe at the focus · axial bundle
      </figcaption>
      <svg viewBox="0 0 360 150" className="mt-2 block w-full bg-photon-bg" role="img" aria-label="Focal plane loupe">
        <line x1="16" y1={axis} x2="344" y2={axis} className="stroke-photon-faint" strokeWidth="1" />
        {rays.map((ray, index) => (
          <line
            key={index}
            x1={xOf(z0)}
            y1={yOf(rayHeight(ray, z0))}
            x2={xOf(z1)}
            y2={yOf(rayHeight(ray, z1))}
            className={index === 1 ? "stroke-photon-cyan" : "stroke-photon-amber"}
            strokeWidth={index === 1 ? 1 : 1.25}
            strokeDasharray={index === 1 ? "2 3" : undefined}
          />
        ))}
        <line x1={focusX} y1="18" x2={focusX} y2="132" className="stroke-photon-amber" strokeDasharray="3 3" strokeWidth="1.25" />
        <line x1={sensorX} y1="18" x2={sensorX} y2="132" className="stroke-photon-ink" strokeWidth="1.5" />
        <line x1={sensorX} y1={yTop} x2={sensorX} y2={yBot} className="stroke-photon-cyan" strokeWidth="4" />
        {view === "wave" ? (
          <circle cx={focusX} cy={axis} r={Math.max(1.5, airy)} className="fill-photon-cyan/20 stroke-photon-cyan" strokeWidth="1" />
        ) : null}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-photon-faint">
        <span className="text-photon-amber">Dashed · image plane</span>
        <span className="text-photon-ink">Solid · sensor</span>
        <span className="text-photon-cyan">Cyan mark · circle of confusion</span>
      </div>
    </figure>
  );
}

function ViewButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`tap min-h-11 border px-4 font-mono text-xs tracking-widest uppercase ${
        active ? "border-photon-ink text-photon-ink" : "border-photon-line text-photon-faint"
      }`}
    >
      {label}
    </button>
  );
}

function SliderRow({
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
        <label htmlFor={id} className="text-lg text-photon-ink">
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

function Readout({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="bg-photon-bg px-3 py-3">
      <dt className="font-mono text-xs tracking-widest text-photon-faint uppercase">{term}</dt>
      <dd className="mt-1 font-mono text-sm text-photon-ink">{detail}</dd>
    </div>
  );
}
