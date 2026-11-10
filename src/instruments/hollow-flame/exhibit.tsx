import { Cockpit } from "@/instruments/hollow-flame/Cockpit";
import { ExhibitBoot, StageChrome, StageGate } from "@/instruments/hollow-flame/Gate";
import { Gateway } from "@/instruments/hollow-flame/Gateway";
import { Laboratory } from "@/instruments/hollow-flame/Laboratory";
import { MediaLibrary } from "@/instruments/hollow-flame/Media";
import { Reading } from "@/instruments/hollow-flame/Reading";
import { FlameTree } from "@/instruments/hollow-flame/FlameTree";
import "./hollow-flame.css";

function fromAtlas() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("from") === "interactive-atlas";
}

function Bench() {
  return (
    <div className="bench mx-auto max-w-6xl px-4">
      <div id="ride" className="ride-frame" data-dock="shut">
        <div id="instrument" className="stage relative overflow-hidden border border-line bg-ink scroll-mt-20">
          <h1 className="sr-only">Prometheus, the Hollow Flame</h1>
          <StageGate />
          <StageChrome />
        </div>
        <Cockpit />
      </div>
    </div>
  );
}

export function HollowFlameExhibit() {
  const back = fromAtlas();
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <main className="prometheus-instrument">
      <ExhibitBoot />
      <header className="sticky top-0 z-20 border-b border-line bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="prometheus-ember" aria-hidden="true" />
            <div>
              <p className="font-mono text-xs tracking-widest text-ember uppercase">MISTERY LABS</p>
              <p className="hidden font-mono text-xs text-dust sm:block">Prometheus · Hollow Flame</p>
            </div>
          </div>
          <nav className="flex min-w-0 gap-2 overflow-x-auto font-mono text-xs tracking-widest text-dust uppercase">
            <a href="#instrument" className="inline-flex min-h-11 items-center">
              Ride
            </a>
            <a href="#laboratory" className="inline-flex min-h-11 items-center">
              Lab
            </a>
            <a href="#tree" className="inline-flex min-h-11 items-center">
              Tree
            </a>
            <a href="#media" className="hidden min-h-11 items-center sm:inline-flex">
              Media
            </a>
            {back ? (
              <a href={`${base}/atlas/interactive?resume=1`} className="inline-flex min-h-11 items-center text-ember">
                Atlas
              </a>
            ) : (
              <a href="#gateway" className="inline-flex min-h-11 items-center">
                Atlas
              </a>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto hidden max-w-6xl px-4 py-6 lg:block">
        <p className="font-mono text-xs tracking-widest text-dust uppercase">HF–03 · The experiment stays in view</p>
        <p className="pt-2 font-display text-4xl tracking-tight text-paper">The Hollow Flame</p>
        <p className="max-w-xl pt-2 text-lg text-dust">
          What if the defining feature of an organized object is not what fills its center, but what maintains the structure around it?
        </p>
      </div>

      <Bench />
      <Laboratory />
      <FlameTree />
      <Reading />
      <MediaLibrary />
      <Gateway />
    </main>
  );
}
