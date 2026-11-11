import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BOUNDARIES,
  MILESTONES,
  RECEPTOR_CARDS,
  boundaryById,
  dominantReceptor,
  firingRate,
  formatGap,
  gapAt,
  indented,
  journeyTFor,
  nearestMilestone,
  pulseHaptic,
  zenoPartition,
  type ReceptorId,
} from "./model";
import "./prime.css";

type Tab = "corpuscles" | "zeno" | "bounds";

const TABS: { id: Tab; label: string }[] = [
  { id: "corpuscles", label: "Corpuscles" },
  { id: "zeno", label: "Zeno" },
  { id: "bounds", label: "Bounds" },
];

function Hand({ seam }: { seam: number }) {
  const fingers = "M128 340 C124 250 112 160 108 78 M162 332 C160 220 158 120 156 42 M196 328 C202 210 208 110 212 36";
  return (
    <svg viewBox="0 0 420 560" role="img" aria-label="Teal marble hand, thumb and index almost meeting">
      <defs>
        <linearGradient id="prime-stone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0e3c44" />
          <stop offset="0.5" stopColor="#1f8f98" />
          <stop offset="1" stopColor="#08262c" />
        </linearGradient>
        <radialGradient id="prime-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff6d4" />
          <stop offset="0.45" stopColor="#e4c27a" stopOpacity="0.85" />
          <stop offset="1" stopColor="#e4c27a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="196" cy="508" rx="108" ry="14" fill="#14110e" />
      <path
        d="M118 300 C78 340 86 450 150 486 C214 522 292 470 286 390 C280 330 250 300 230 292 C210 360 150 360 128 300 C140 250 150 250 168 292"
        fill="url(#prime-stone)"
        stroke="#e4c27a"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      <g fill="none" stroke="#14656e" strokeWidth="26" strokeLinecap="round">
        <path d={fingers} />
      </g>
      <g fill="none" stroke="#e4c27a" strokeWidth="1.15" strokeLinecap="round" opacity="0.75">
        <path d={fingers} />
        <path d="M150 360 C170 420 210 450 250 430" />
      </g>
      <g fill="none" stroke="#14656e" strokeWidth="26" strokeLinecap="round" transform={`translate(${seam} 0)`}>
        <path d="M214 330 C246 270 286 230 304 198" />
      </g>
      <g fill="none" stroke="#e4c27a" strokeWidth="1.15" strokeLinecap="round" opacity="0.8" transform={`translate(${seam} 0)`}>
        <path d="M214 330 C246 270 286 230 304 198" />
      </g>
      <g fill="none" stroke="#14656e" strokeWidth="28" strokeLinecap="round">
        <path d="M230 410 C292 400 336 348 318 268 C308 220 292 206 286 214" />
      </g>
      <g fill="none" stroke="#e4c27a" strokeWidth="1.15" strokeLinecap="round" opacity="0.8">
        <path d="M230 410 C292 400 336 348 318 268 C308 220 292 206 286 214" />
      </g>
      <circle cx={304 + seam} cy="198" r="22" fill="url(#prime-glow)" />
      <circle className="prime-spark" cx={304 + seam} cy="198" r="4.5" fill="#fff8e4" />
    </svg>
  );
}

function Raster({ rate }: { rate: number }) {
  const count = Math.max(1, Math.round(rate / 8));
  const bars = Math.min(36, count);
  return (
    <div className="prime-raster" aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <i key={i} style={{ height: `${8 + ((i * 17) % 28)}px` }} />
      ))}
    </div>
  );
}

export function PrimeRide({ fromWorld }: { fromWorld: boolean }) {
  const [t, setT] = useState(journeyTFor(0.015));
  const [tab, setTab] = useState<Tab>("corpuscles");
  const [sheet, setSheet] = useState(true);
  const [receptor, setReceptor] = useState<ReceptorId>("merkel");
  const [pressure, setPressure] = useState(0.55);
  const [frequency, setFrequency] = useState(0);
  const [haptics, setHaptics] = useState(false);
  const [steps, setSteps] = useState(8);
  const [hapticNote, setHapticNote] = useState("Haptics are off.");

  const gap = gapAt(t);
  const frame = nearestMilestone(gap);
  const loaded = indented(gap);
  const layer = boundaryById(frame.layer);
  const rate = firingRate(receptor, pressure, frequency, loaded);
  const leader = dominantReceptor(pressure, frequency, loaded);
  const zeno = useMemo(() => zenoPartition(gap, steps), [gap, steps]);
  const seam = (1 - t) * 18;
  const card = RECEPTOR_CARDS.find((item) => item.id === receptor)!;

  function feel(next: ReceptorId) {
    setReceptor(next);
    const result = pulseHaptic(next, haptics);
    setHapticNote(
      result === "sent"
        ? "A short pattern was sent to the device. It is not the receptor."
        : result === "unavailable"
          ? "This browser did not offer vibration."
          : "Haptics are off.",
    );
  }

  return (
    <main className="prime-instrument">
      <header className="prime-bar">
        <div className="prime-brand">
          <span className="prime-mark" aria-hidden="true" />
          <div>
            <p className="prime-kicker">MisterY Labs</p>
            <p className="prime-sub">PRIME · The Last Distance</p>
          </div>
        </div>
        <nav className="prime-nav" aria-label="Ride">
          <a href="#ride" data-on="true">
            Ride
          </a>
          {TABS.map((item) => (
            <button key={item.id} type="button" data-on={String(tab === item.id)} onClick={() => { setTab(item.id); setSheet(true); }}>
              {item.label}
            </button>
          ))}
          {fromWorld ? (
            <Link className="prime-return" to="/atlas/interactive?resume=1">
              Return to Interactive Atlas
            </Link>
          ) : (
            <Link to="/atlas">Atlas</Link>
          )}
        </nav>
      </header>

      <section id="ride" className="prime-stage" aria-label="Continuous descent of the gap">
        <div className="prime-hand-wrap">
          <Hand seam={seam} />
        </div>
        <div className="prime-readout">
          <p className="prime-kicker">{frame.kicker}</p>
          <h1 className="prime-title">{frame.title}</h1>
          <p className="prime-distance" data-testid="prime-gap">
            {formatGap(gap)}
          </p>
          <p className="prime-note">{frame.note}</p>
          <p className="prime-layer">{layer.title}</p>
        </div>
        <ol className="prime-beads">
          {MILESTONES.map((milestone, index) => (
            <li key={milestone.id}>
              <button
                type="button"
                data-on={String(milestone.id === frame.id)}
                aria-label={milestone.title}
                onClick={() => setT(journeyTFor(milestone.meters))}
              >
                {index + 1}
              </button>
            </li>
          ))}
        </ol>
      </section>

      <div className="prime-dock">
        <label htmlFor="prime-descend">
          <span>Descend</span>
          <span>{Math.round(t * 100)}%</span>
        </label>
        <input
          id="prime-descend"
          type="range"
          min={0}
          max={1000}
          step={1}
          value={Math.round(t * 1000)}
          aria-label="Descend the gap"
          aria-valuetext={formatGap(gap)}
          onChange={(event) => setT(Number(event.target.value) / 1000)}
        />
      </div>

      <section className="prime-cockpit" aria-label="Instrument controls" hidden={!sheet}>
        <div className="prime-cockpit-bar" role="tablist" aria-label="Panels">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button type="button" onClick={() => setSheet(false)}>
            Hide
          </button>
        </div>

        {tab === "corpuscles" ? (
          <div className="prime-panel" role="tabpanel">
            <h2>Corpuscles</h2>
            {loaded ? (
              <p className="prime-quiet">The gap is small enough to load skin. These curves are a teaching model, not a nerve recording.</p>
            ) : (
              <p className="prime-quiet">No indentation yet. These endings answer deformation, not the sight of a gap. Descend to 1 μm.</p>
            )}
            <div className="prime-receptors" role="group" aria-label="Mechanoreceptors">
              {RECEPTOR_CARDS.map((item) => (
                <button key={item.id} type="button" data-on={String(item.id === receptor)} onClick={() => feel(item.id)}>
                  <strong>{item.name}</strong>
                  <span>{item.adapt} · {item.prefers}</span>
                </button>
              ))}
            </div>
            <label className="prime-slider">
              <span>
                Pressure <b>{pressure.toFixed(2)}</b>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(pressure * 100)}
                aria-label="Pressure"
                onChange={(event) => setPressure(Number(event.target.value) / 100)}
              />
            </label>
            <label className="prime-slider">
              <span>
                Vibration <b>{Math.round(frequency)} Hz</b>
              </span>
              <input
                type="range"
                min={0}
                max={400}
                value={Math.round(frequency)}
                aria-label="Vibration"
                onChange={(event) => setFrequency(Number(event.target.value))}
              />
            </label>
            <p className="prime-rate" data-testid="prime-rate">
              {rate.toFixed(1)} spikes/s
            </p>
            <Raster rate={rate} />
            <p>
              {card.name}: {card.limit}{" "}
              {leader ? `At this setting the loudest teaching curve is ${leader}.` : "Nothing in the model is firing."}
            </p>
            <label className="prime-check">
              <input
                type="checkbox"
                checked={haptics}
                onChange={(event) => {
                  setHaptics(event.target.checked);
                  setHapticNote(event.target.checked ? "Haptics armed. Choose a receptor." : "Haptics are off.");
                }}
              />
              Optional device haptics
            </label>
            <p>{hapticNote}</p>
            <p>Transduction is not perception. Proprioception is not these four endings.</p>
          </div>
        ) : null}

        {tab === "zeno" ? (
          <div className="prime-panel" role="tabpanel">
            <h2>Zeno’s partition</h2>
            <p>
              Halve the remaining gap, then halve what is left. The pieces are infinite. Their sum is the finite gap you are already looking at.
              Subdivision is a description. It is not a reason the fingers never meet.
            </p>
            <label className="prime-slider">
              <span>
                Halvings <b>{steps}</b>
              </span>
              <input
                type="range"
                min={0}
                max={24}
                value={steps}
                aria-label="Halvings"
                onChange={(event) => setSteps(Number(event.target.value))}
              />
            </label>
            <div className="prime-zeno-nums">
              <div>
                Finite gap
                <strong data-testid="zeno-finite">{formatGap(zeno.finite)}</strong>
              </div>
              <div>
                Remainder
                <strong data-testid="zeno-remainder">{formatGap(zeno.remainder)}</strong>
              </div>
            </div>
            <div className="prime-bar-track" aria-hidden="true">
              <span style={{ width: `${gap === 0 ? 0 : (zeno.traveled / gap) * 100}%` }} />
            </div>
            <p>Traveled {formatGap(zeno.traveled)}. Traveled plus remainder is the gap. Neither number is a percept.</p>
          </div>
        ) : null}

        {tab === "bounds" ? (
          <div className="prime-panel" role="tabpanel">
            <h2>What is not what</h2>
            <div className="prime-bounds">
              {BOUNDARIES.map((item) => (
                <article key={item.id}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>
      {sheet ? null : (
        <div className="prime-dock">
          <button type="button" onClick={() => setSheet(true)}>
            Open controls
          </button>
        </div>
      )}
    </main>
  );
}
