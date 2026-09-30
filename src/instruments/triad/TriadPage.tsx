import { useEffect, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { engine } from "./sim/engine";
import { experimentRun } from "./sim/experimentRun";
import { useTriad } from "./sim/store";
import { ExperimentDeck, RangeInset, TriadNotes } from "./ui/Experiments";
import { Header, Inspector, Overlay, PlotDock } from "./ui/Instrument";
import "./triad.css";

/**
 * Page clock. Same fixed step as the sandbox reference:
 * sim dt = 1/60 s, at most 5 substeps per frame, telemetry publish every 0.1 s.
 * Wall-clock time is not the integrator step.
 */
function useSim() {
  const publish = useTriad((s) => s.publish);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let pub = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (engine.params.running) {
        acc += dt * engine.params.timeScale;
        const h = 1 / 60;
        let n = 0;
        while (acc >= h && n < 5) {
          experimentRun.beforeStep();
          if (!engine.params.running) {
            acc = 0;
            break;
          }
          engine.step(h);
          experimentRun.afterStep();
          acc -= h;
          n++;
        }
      }
      pub += dt;
      if (pub >= 0.1) {
        pub = 0;
        publish();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    publish();
    return () => cancelAnimationFrame(raf);
  }, [publish]);
}

export default function TriadPage() {
  useSim();
  const [View, setView] = useState<ComponentType | null>(null);
  useEffect(() => {
    let dead = false;
    void import("./ui/Viewport").then((mod) => {
      if (!dead) setView(() => mod.Viewport);
    });
    return () => {
      dead = true;
    };
  }, []);
  return (
    <div className="triad-root" data-triad="instrument">
      <Link className="triad-exit" to="/atlas">
        Atlas
      </Link>
      <main className="app-shell">
        <Header />
        <div className="stage">
          <div className="experiment-stack">
            <ExperimentDeck />
            <TriadNotes />
          </div>
          <div className="viewport-frame">
            {View ? <View /> : <div className="grid h-full place-items-center kicker">Opening range frame</div>}
            <Overlay />
            <RangeInset />
          </div>
          <PlotDock />
          <Inspector />
        </div>
      </main>
    </div>
  );
}
