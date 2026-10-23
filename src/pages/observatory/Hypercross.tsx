import { AppHeader } from "@/components/AppHeader";
import { HypercrossStage } from "@/components/higher-dimensional/HypercrossStage";
import { DemoNav } from "@/components/observatory/DemoNav";
import { HD_INDEX } from "@/instruments/higher-dimensional/rides";
import { useTheme } from "@/hooks/useTheme";

export default function HypercrossPage() {
  const { theme } = useTheme();
  const lm = theme === "light";
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-x-clip overflow-y-hidden">
      <AppHeader />
      <DemoNav next={{ label: "Collection index", to: HD_INDEX }} />
      <div className="container flex min-h-0 w-full max-w-full flex-1 flex-col pb-2 pt-2">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h1 className="text-lg font-bold tracking-tight md:text-2xl">Hypercross</h1>
          <span className={`shrink-0 font-mono text-[8px] uppercase tracking-[0.22em] ${lm ? "text-amber-800/80" : "text-amber-300/70"}`}>
            SYS // OBS-HX · Eight-cell net
          </span>
        </div>
        <p className="hx-page-intro mb-2 max-w-3xl text-xs leading-snug text-muted-foreground/70 md:text-sm">
          Eight cubes fold about square faces into a tesseract. Progress 0 is the net. Progress 1 is the boundary. Dragging orbits the camera. It does not fold the model.
        </p>
        <div className="min-h-0 flex-1">
          <HypercrossStage />
        </div>
      </div>
    </div>
  );
}
