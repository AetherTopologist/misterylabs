import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { CENOTAPH, EXHIBITS, type AtlasApi, type AtlasUi, type CenotaphVariant } from "./destinations";
import "./interactive-atlas.css";

const INITIAL: AtlasUi = { scale: 0.92, selected: null, proximity: 0, atHome: true, inside: false };

function studyVariant(): CenotaphVariant {
  if (!import.meta.env.DEV || typeof window === "undefined") return "a";
  const q = new URLSearchParams(window.location.search).get("cenotaph");
  return q === "b" || q === "c" ? q : "a";
}

function same(a: AtlasUi, b: AtlasUi) {
  return (
    a.selected === b.selected &&
    a.atHome === b.atHome &&
    a.inside === b.inside &&
    Math.abs(a.scale - b.scale) < 0.012 &&
    Math.abs(a.proximity - b.proximity) < 0.02
  );
}

function canWebGL() {
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") || probe.getContext("webgl");
    if (!gl) return false;
    const lose = gl.getExtension("WEBGL_lose_context");
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export default function InteractiveAtlas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<AtlasApi | null>(null);
  const [ui, setUi] = useState<AtlasUi>(INITIAL);
  const [failed, setFailed] = useState(() => (typeof document === "undefined" ? false : !canWebGL()));
  const [variant, setVariant] = useState<CenotaphVariant>(studyVariant);
  const variantRef = useRef(variant);
  variantRef.current = variant;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || failed) return;
    let dead = false;
    let dispose = () => {};
    void import("./scene")
      .then(({ mountObservatory }) => {
        if (dead) return;
        try {
          const mounted = mountObservatory(canvas, (next) => {
            setUi((prev) => (same(prev, next) ? prev : next));
          });
          if (dead) {
            mounted.dispose();
            return;
          }
          apiRef.current = mounted.api;
          mounted.api.setCenotaphVariant(variantRef.current);
          dispose = mounted.dispose;
        } catch {
          if (!dead) setFailed(true);
        }
      })
      .catch(() => {
        if (!dead) setFailed(true);
      });
    return () => {
      dead = true;
      dispose();
      apiRef.current = null;
    };
  }, [failed]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    apiRef.current?.setCenotaphVariant(variant);
  }, [variant]);

  const exhibit = ui.selected && ui.selected !== "cenotaph" ? EXHIBITS[ui.selected] : null;
  const landmark = ui.selected === "cenotaph";
  const showName = (exhibit && ui.proximity > 0.28) || (landmark && ui.proximity > 0.28);
  const showFull = (exhibit && ui.proximity > 0.56) || (landmark && ui.proximity > 0.4);

  return (
    <main className="ia-world">
      <canvas
        ref={canvasRef}
        aria-label="Interactive Atlas. Drag to orbit Newton's Cenotaph. Pinch or scroll to approach an instrument."
      />
      <div className="ia-vignette" />

      <header className="ia-header">
        <div className="ia-row">
          <svg className="ia-mark" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="15.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
            <path d="M24 8.5v5.5M24 34v5.5M8.5 24H14M34 24h5.5" stroke="currentColor" strokeWidth="1.25" />
            <circle cx="24" cy="24" r="1.7" fill="currentColor" />
          </svg>
          <p className="ia-word">MisterY Labs</p>
        </div>
        <p className="ia-whisper">Interactive Atlas</p>
        <p className="ia-motif" style={{ opacity: showFull ? 0.28 : 0.72 }}>
          There is always another why.
        </p>
        <Link to="/atlas" className="ia-back">
          Return to Atlas
        </Link>
      </header>

      {import.meta.env.DEV ? (
        <div className="ia-study">
          <p>Dev study</p>
          <div>
            {(
              [
                ["a", "Stone"],
                ["b", "Porcelain"],
                ["c", "Night"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" data-on={variant === id} onClick={() => setVariant(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="ia-rail" aria-hidden="true">
        <span data-where="atlas" data-on={ui.scale > 0.62}>
          Atlas
        </span>
        <span data-where="exhibit" data-on={ui.scale <= 0.62 && ui.scale > 0.34}>
          Exhibit
        </span>
        <span data-where="instrument" data-on={ui.scale <= 0.34}>
          Instrument
        </span>
        <i style={{ bottom: `${ui.scale * 100}%` }} />
      </div>

      <div className="ia-dock">
        {ui.inside ? (
          <div className="ia-plate">
            <p className="ia-kicker">{CENOTAPH.name}</p>
            <p className="ia-question">Home</p>
            <p className="ia-note">The object is now the boundary.</p>
            <button type="button" className="ia-enter" onClick={() => apiRef.current?.returnOutside()}>
              Return outside
            </button>
          </div>
        ) : showFull && landmark ? (
          <div className="ia-plate">
            <p className="ia-kicker">{CENOTAPH.name}</p>
            <p className="ia-question">Home</p>
            <button type="button" className="ia-enter" onClick={() => apiRef.current?.crossBoundary()}>
              Cross the boundary
            </button>
          </div>
        ) : showFull && exhibit ? (
          <div className="ia-plate">
            <p className="ia-kicker">{exhibit.name}</p>
            <p className="ia-question">{exhibit.question}</p>
            {exhibit.released && exhibit.href ? (
              <Link
                to={`${exhibit.href}?from=interactive-atlas`}
                className="ia-enter"
              >
                Enter exhibit
              </Link>
            ) : (
              <p className="ia-note">This instrument is not released.</p>
            )}
          </div>
        ) : showName && landmark ? (
          <p className="ia-kicker ia-plate">{CENOTAPH.name}</p>
        ) : showName && exhibit ? (
          <p className="ia-kicker ia-plate">{exhibit.name}</p>
        ) : null}
        {ui.atHome ? null : (
          <div>
            <button type="button" className="ia-home" onClick={() => apiRef.current?.returnHome()}>
              Home
            </button>
          </div>
        )}
      </div>

      {failed ? (
        <div className="ia-fallback" role="status">
          <p className="ia-kicker">Interactive Atlas</p>
          <p>This view needs WebGL, and it did not start. The rest of MisterY Labs is unchanged.</p>
          <Link to="/atlas" className="ia-enter">
            Return to Atlas
          </Link>
        </div>
      ) : null}
    </main>
  );
}
