import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CENOTAPH, EXHIBITS, type AtlasApi, type AtlasMode, type AtlasUi, type CenotaphGlb, type CenotaphVariant, type WalkCamera, type WalkerPose } from "./destinations";
import { atCenotaphDoor } from "./ascent";
import { diagnosticsReport, getDiagnostics, subscribeDiagnostics } from "./cenotaph-diagnostics";
import type { LightTier } from "./cenotaph-budget";
import { FairMap, WalkStick } from "./walk-ui";
import "./interactive-atlas.css";

const INITIAL: AtlasUi = {
  scale: 0.92,
  selected: null,
  proximity: 0,
  atHome: true,
  inside: false,
  mode: "fly",
  walker: null,
};

function studyVariant(): CenotaphVariant {
  if (!import.meta.env.DEV || typeof window === "undefined") return "m";
  const q = new URLSearchParams(window.location.search).get("cenotaph");
  if (q === "a" || q === "b" || q === "c") return q;
  return "m";
}

function walkerSame(a: WalkerPose | null, b: WalkerPose | null) {
  if (!a || !b) return a === b;
  return Math.abs(a.x - b.x) < 0.8 && Math.abs(a.z - b.z) < 0.8 && Math.abs(a.heading - b.heading) < 0.06;
}

function same(a: AtlasUi, b: AtlasUi) {
  return (
    a.selected === b.selected &&
    a.atHome === b.atHome &&
    a.inside === b.inside &&
    a.mode === b.mode &&
    (a.camera ?? "follow") === (b.camera ?? "follow") &&
    (a.glb ?? "production") === (b.glb ?? "production") &&
    walkerSame(a.walker, b.walker) &&
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
  const [mapOpen, setMapOpen] = useState(false);
  const [pendingGlb, setPendingGlb] = useState<CenotaphGlb | null>(null);
  const [copied, setCopied] = useState(false);
  const diag = useSyncExternalStore(subscribeDiagnostics, getDiagnostics, getDiagnostics);
  const [params, setSearchParams] = useSearchParams();
  const variantRef = useRef<CenotaphVariant>(studyVariant());

  useEffect(() => {
    if (params.get("resume") !== "1") return;
    const next = new URLSearchParams(params);
    next.delete("resume");
    setSearchParams(next, { replace: true });
  }, [params, setSearchParams]);

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

  const exhibit = ui.selected && ui.selected !== "cenotaph" ? EXHIBITS[ui.selected] : null;
  const landmark = ui.selected === "cenotaph";
  const showName = (exhibit && ui.proximity > 0.28) || (landmark && ui.proximity > 0.28);
  const showFull = (exhibit && ui.proximity > 0.56) || (landmark && ui.proximity > 0.4);

  const walking = ui.mode === "walk" && ui.walker;
  const atDoor = Boolean(walking && ui.walker && atCenotaphDoor(ui.walker.x, ui.walker.z));
  const setMode = (mode: AtlasMode) => apiRef.current?.setMode(mode);
  const setCamera = (camera: WalkCamera) => apiRef.current?.setCamera(camera);
  const walkCamera = ui.camera ?? "follow";
  const glb = pendingGlb ?? ui.glb ?? "production";
  const chooseGlb = (next: CenotaphGlb) => {
    if (next === glb) return;
    setPendingGlb(next);
    void Promise.resolve(apiRef.current?.setGlb(next)).finally(() => {
      setPendingGlb((current) => (current === next ? null : current));
    });
  };
  const chooseTier = (tier: LightTier) => {
    apiRef.current?.setLightTier(tier);
    setCopied(false);
  };
  const copyDiag = () => {
    const text = diagnosticsReport(typeof navigator === "undefined" ? "unavailable" : navigator.userAgent);
    const done = () => setCopied(true);
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).then(done).catch(() => done());
      return;
    }
    done();
  };
  const tierLabel: Record<LightTier, string> = {
    budget: "Budget",
    pr38: "Full lamps",
    minimal: "Minimal",
    emissive: "Emissive",
    neutral: "Neutral",
  };

  return (
    <main className="ia-world" data-mode={ui.mode}>
      <canvas
        ref={canvasRef}
        aria-label="Interactive Atlas. Drag to orbit. Two-finger, right-button, or shift-drag to move the view. Pinch or scroll to zoom. Double-tap a pavilion to approach it. Walk sets you on the ground."
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
        <div className="ia-mode" role="group" aria-label="How you move">
          <button type="button" data-on={ui.mode === "fly"} onClick={() => setMode("fly")}>
            Fly
          </button>
          <button type="button" data-on={ui.mode === "walk"} onClick={() => setMode("walk")}>
            Walk
          </button>
        </div>
        {ui.mode === "walk" ? (
          <div className="ia-cam" role="group" aria-label="Walk camera">
            <button type="button" data-on={walkCamera === "follow"} onClick={() => setCamera("follow")}>
              Follow
            </button>
            <button type="button" data-on={walkCamera === "eyes"} onClick={() => setCamera("eyes")}>
              Eyes
            </button>
            <button type="button" data-on={walkCamera === "vista"} onClick={() => setCamera("vista")}>
              Vista
            </button>
            <button type="button" data-on={walkCamera === "overhead"} onClick={() => setCamera("overhead")}>
              Overhead
            </button>
          </div>
        ) : null}
      </header>

      {walking ? (
        <FairMap walker={ui.walker!} open={mapOpen} onToggle={() => setMapOpen((v) => !v)} />
      ) : null}

      {ui.mode === "walk" ? (
        <>
          <p className="ia-sr">Walk with the keys W A S D or the arrows. Drag the ground to look around. The stick on a touch screen moves Mister Why.</p>
          <WalkStick onChange={(x, y) => apiRef.current?.setMove(x, y)} />
        </>
      ) : null}

      {ui.mode === "fly" ? (
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
      ) : null}

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
        ) : atDoor ? (
          <div className="ia-plate">
            <p className="ia-kicker">{CENOTAPH.name}</p>
            <p className="ia-question">Enter the Cenotaph</p>
            <p className="ia-note">The chamber is beyond this door.</p>
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
            {exhibit.hall ? <p className="ia-hall">{exhibit.hall}</p> : null}
            <p className="ia-question">{exhibit.question}</p>
            {exhibit.released && exhibit.href ? (
              <Link
                to={`${exhibit.href}?from=interactive-atlas`}
                className="ia-enter"
                onClick={() => {
                  if (
                    exhibit.id === "hollow-genius" ||
                    exhibit.id === "ambiguous-dancer" ||
                    exhibit.id === "inside-out" ||
                    exhibit.id === "cubic-worm" ||
                    exhibit.id === "hypercross"
                  )
                    apiRef.current?.remember();
                }}
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
      <div className="ia-dev-stack">
        <details className="ia-dev" data-glb={glb}>
          <summary>
            <span>DEV · GLB</span>
            <span className="ia-dev-current">{glb === "full" ? "Full Resolution" : glb === "clean" ? "Clean v01" : "Production"}</span>
          </summary>
          <div className="ia-dev-body">
            <div role="group" aria-label="Cenotaph geometry">
              <button type="button" data-on={glb === "production"} aria-pressed={glb === "production"} onClick={() => chooseGlb("production")}>
                Production
              </button>
              <button type="button" data-on={glb === "full"} aria-pressed={glb === "full"} onClick={() => chooseGlb("full")}>
                Full Resolution
              </button>
              <button type="button" data-on={glb === "clean"} aria-pressed={glb === "clean"} onClick={() => chooseGlb("clean")}>
                Clean v01
              </button>
            </div>
            <p className="ia-dev-note">
              {glb === "full"
                ? "Full-resolution export. Flat cap at 13.103 m sits above the historic tread and the observation floor at 12.937 m. The step is left visible."
                : glb === "clean"
                  ? "Clean v01. One skin of the full-resolution mesh, with its own normals. Downward floors and the crown are lit from the side you can see. The downward cap at 13.103 m replaces the observation slab."
                  : "Known-good mesh. Observation floor at 12.937 m."}
            </p>
          </div>
        </details>
        <details className="ia-dev ia-diag">
          <summary>
            <span>DEV · DIAGNOSTICS</span>
            <span className="ia-dev-current">{tierLabel[diag.tier]}</span>
          </summary>
          <div className="ia-dev-body">
            <p className="ia-dev-note">Production GLB: {diag.production}{diag.productionTriangles != null ? ` · ${diag.productionTriangles.toLocaleString()} tris` : ""}</p>
            <p className="ia-dev-note">Full Resolution GLB: {diag.full}{diag.fullTriangles != null ? ` · ${diag.fullTriangles.toLocaleString()} tris` : ""}</p>
            <p className="ia-dev-note">Clean v01 GLB: {diag.clean}{diag.cleanTriangles != null ? ` · ${diag.cleanTriangles.toLocaleString()} tris` : ""}</p>
            <p className="ia-dev-note">WebGL context: {diag.context}</p>
            <p className="ia-dev-note">
              {diag.webglVersion} · {diag.renderer}
            </p>
            <p className="ia-dev-note">
              Uniforms: frag {diag.maxFragmentUniforms ?? "unavailable"} · vert {diag.maxVertexUniforms ?? "unavailable"} · tex {diag.maxTextureUnits ?? "unavailable"} · vary {diag.maxVaryingVectors ?? "unavailable"}
            </p>
            <p className="ia-dev-note">
              Real lights: {diag.activeRealLights == null ? "unavailable" : diag.activeRealLights} · tier {tierLabel[diag.tier]}
              {diag.tier === "budget" ? ` · ${diag.activeArchSlots ?? 0} slots` : ""}
            </p>
            <p className="ia-dev-note">Shader log: {diag.shaderLog}</p>
            <p className="ia-dev-note">
              {diag.initError || diag.productionError || diag.fullError || diag.cleanError || "No initialization error."}
            </p>
            <div role="group" aria-label="Lighting tier">
              {(Object.keys(tierLabel) as LightTier[]).map((tier) => (
                <button key={tier} type="button" data-on={diag.tier === tier} aria-pressed={diag.tier === tier} onClick={() => chooseTier(tier)}>
                  {tierLabel[tier]}
                </button>
              ))}
            </div>
            <button type="button" onClick={copyDiag}>
              {copied ? "Copied" : "Copy Diagnostics"}
            </button>
          </div>
        </details>
      </div>
    </main>
  );
}
