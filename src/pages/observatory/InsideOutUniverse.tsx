import { AppHeader } from "@/components/AppHeader";
import { InsideOutStage } from "@/components/higher-dimensional/InsideOutStage";
import { DemoNav } from "@/components/observatory/DemoNav";
import { HD_INDEX } from "@/instruments/higher-dimensional/rides";
import { useTheme } from "@/hooks/useTheme";

export default function InsideOutUniversePage() {
  const { theme } = useTheme();
  const lm = theme === "light";
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-x-clip overflow-y-hidden">
      <AppHeader />
      <DemoNav next={{ label: "Collection index", to: HD_INDEX }} />
      <div className="container flex min-h-0 w-full max-w-full flex-1 flex-col pb-2 pt-3">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h1 className="text-lg font-bold tracking-tight md:text-2xl">Inside-Out Universe</h1>
          <span className={`shrink-0 font-mono text-[8px] uppercase tracking-[0.22em] ${lm ? "text-cyan-700/80" : "text-cyan-400/55"}`}>
            SYS // OBS-IO · Ride 03
          </span>
        </div>
        <p className="mb-2 max-w-3xl text-xs leading-snug text-muted-foreground/70 md:text-sm">
          The cube laboratory pairs a flat net with the hinged fold of that same net. The 4D laboratory is separate. Nesting is not eversion.
        </p>
        <div className="min-h-0 flex-1">
          <InsideOutStage />
        </div>
      </div>
    </div>
  );
}
