import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SpinningDancer } from "@/components/SpinningDancer";
import { DemoNav } from "@/components/observatory/DemoNav";
import { HD_RIDES } from "@/instruments/higher-dimensional/rides";
import { useTheme } from "@/hooks/useTheme";

export default function AmbiguousDancerPage() {
  const { theme } = useTheme();
  const lm = theme === "light";
  return (
    <div className="min-h-screen overflow-x-clip">
      <AppHeader />
      <DemoNav next={{ label: HD_RIDES[2].label, to: HD_RIDES[2].href }} />
      <section className="border-t border-border/25 bg-atlas-hero">
        <div className="container py-6 md:py-8">
          <div className={`mb-2 font-mono text-[8px] uppercase tracking-[0.3em] ${lm ? "text-violet-700/80" : "text-violet-400/55"}`}>
            SYS // OBS-PB · Ride 02
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Ambiguous Dancer</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground/70">
            The figure has one physical yaw. At 1× that yaw is 0.84 rad/s, the same rate as the original dancer on a 60 Hz frame. At 6× it is 5.04 rad/s, about one turn every 1.25 s. Changing speed, pausing, or reversing continues from the current angle. None of those rewrite the past, and none of them decide which way the silhouette will look.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground/70">
            With no shading and no perspective, clockwise and counter-clockwise rotations can share a silhouette. Shade, perspective, a floor shadow, and the physical marker are optional experiments on the Appearance tab. The figure stays above the dock on a phone. Report the direction you see. The report is yours.
          </p>
          <div className="spectral-bar my-5" aria-hidden />
          <SpinningDancer ride />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
