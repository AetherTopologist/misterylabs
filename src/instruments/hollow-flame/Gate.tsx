import { Component, useEffect, useState, type ReactNode } from "react";
import { armExhibit, useSim, userCamera, userPlay } from "@/instruments/hollow-flame/sim";
import { banner, phaseLabel } from "@/instruments/hollow-flame/labels";

class StageBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : "The stage failed.";
    return { message };
  }

  render() {
    if (this.state.message) {
      return (
        <div className="absolute inset-0 flex items-end p-4">
          <p className="font-mono text-xs text-dust">The 3D stage could not start. The readings still run. {this.state.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function StageGate() {
  const [View, setView] = useState<React.ComponentType | null>(null);
  useEffect(() => {
    let live = true;
    import("@/instruments/hollow-flame/Stage").then((mod) => {
      if (live) setView(() => mod.Stage);
    });
    return () => {
      live = false;
    };
  }, []);
  if (!View) {
    return (
      <div className="absolute inset-0 flex items-end bg-ink p-4">
        <p className="font-mono text-xs tracking-widest text-dust uppercase">Preparing the bench</p>
      </div>
    );
  }
  return (
    <StageBoundary>
      <View />
    </StageBoundary>
  );
}

export function StageChrome() {
  const snap = useSim();
  const idle = (snap.phase === "cold" || snap.phase === "out") && !snap.script;
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="max-w-[16rem] bg-ink/80 px-2 py-1">
          <p className="flex items-center gap-2 font-mono text-xs tracking-widest text-ember uppercase">
            <span className="prometheus-ember" aria-hidden="true" />
            Prometheus
          </p>
          <p className="font-mono text-xs text-paper">{banner(snap.subject)}</p>
        </div>
        <div className="pointer-events-auto hidden gap-2 lg:flex">
          <button type="button" className="min-h-11 border border-line bg-ink/80 px-3 font-mono text-xs tracking-widest text-dust uppercase" onClick={() => userCamera("three")}>
            3/4
          </button>
          <button type="button" className="min-h-11 border border-line bg-ink/80 px-3 font-mono text-xs tracking-widest text-dust uppercase" onClick={() => userCamera("above")}>
            Above
          </button>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="font-mono text-xs text-dust">Drag to orbit</p>
        <p className="font-mono text-xs tracking-widest text-ember uppercase">{phaseLabel(snap.subject, snap.phase)}</p>
      </div>
      {idle ? (
        <div className="pointer-events-auto absolute inset-x-0 bottom-28 hidden justify-center lg:flex">
          <button type="button" className="min-h-11 bg-ember px-4 font-mono text-xs tracking-widest text-ink uppercase" onClick={userPlay}>
            {snap.phase === "out" ? "Play again" : "Play lifecycle"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ExhibitBoot() {
  useEffect(() => armExhibit(), []);
  return null;
}
