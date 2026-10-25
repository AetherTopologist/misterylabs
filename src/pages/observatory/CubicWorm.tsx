import { Link, useSearchParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { CubicWormStage } from "@/components/higher-dimensional/CubicWormStage";
import { DemoNav } from "@/components/observatory/DemoNav";
import { useTheme } from "@/hooks/useTheme";

export default function CubicWormPage() {
  const { theme } = useTheme();
  const [params] = useSearchParams();
  const fromWorld = params.get("from") === "interactive-atlas";
  const lm = theme === "light";
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-x-clip overflow-y-hidden">
      <AppHeader />
      <DemoNav next={{ label: "Hypercross", to: "/observatory/higher-dimensional/hypercross" }} />
      <div className="container flex min-h-0 w-full max-w-full flex-1 flex-col pb-2 pt-2">
        {fromWorld ? (
          <Link
            to="/atlas/interactive?resume=1"
            className={`mb-1 inline-flex min-h-[44px] items-center text-[0.68rem] uppercase tracking-[0.16em] underline-offset-4 hover:underline ${lm ? "text-orange-900" : "text-orange-200/85"}`}
          >
            Return to Interactive Atlas
          </Link>
        ) : null}
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h1 className="text-lg font-bold tracking-tight md:text-2xl">Cubic Worm</h1>
          <span className={`shrink-0 font-mono text-[8px] uppercase tracking-[0.22em] ${lm ? "text-orange-900/80" : "text-orange-200/70"}`}>
            SYS // OBS-CW · Square throat
          </span>
        </div>
        <p className="cw-page-intro mb-2 max-w-3xl text-xs leading-snug text-muted-foreground/70 md:text-sm">
          Opposite cells of a tesseract can look like a square passage when one axis is projected. The slider turns the solid. Dragging only orbits the camera.{" "}
          <Link to="/observatory/higher-dimensional/hypercross" className="underline decoration-orange-300/40 underline-offset-2">
            Explore the eight-cell structure → Hypercross
          </Link>
        </p>
        <div className="min-h-0 flex-1">
          <CubicWormStage />
        </div>
      </div>
    </div>
  );
}
