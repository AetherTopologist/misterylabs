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
    <div className="min-h-screen">
      <AppHeader />
      <DemoNav next={{ label: HD_RIDES[2].label, to: HD_RIDES[2].href }} />
      <section className="border-t border-border/25 bg-atlas-hero">
        <div className="container py-10 md:py-14">
          <div className={`mb-2 font-mono text-[8px] uppercase tracking-[0.3em] ${lm ? "text-violet-700/80" : "text-violet-400/55"}`}>
            SYS // OBS-PB · Ride 02
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Ambiguous Dancer</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground/70">
            The figure has one physical yaw. At speed 1 that yaw advances at the same rate as the original dancer did on a 60 Hz frame. Reversing direction reverses that integral from the current angle. It does not rewrite the past, and it does not decide which way the silhouette will look.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground/70">
            With no shading and no perspective, clockwise and counter-clockwise rotations can share a silhouette. Adding shade, perspective, a floor shadow, or the physical marker supplies depth. Use them as an experiment. Then report the direction you see. The report is yours. The amber marker, when on, is the model’s direction.
          </p>
          <div className="spectral-bar my-8" aria-hidden />
          <SpinningDancer ride />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
