import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HollowGenius } from "@/components/higher-dimensional/HollowGenius";
import { DemoNav } from "@/components/observatory/DemoNav";
import { HD_RIDES } from "@/instruments/higher-dimensional/rides";
import { useTheme } from "@/hooks/useTheme";

export default function HollowGeniusPage() {
  const { theme } = useTheme();
  const lm = theme === "light";
  return (
    <div className="min-h-screen">
      <AppHeader />
      <DemoNav next={{ label: HD_RIDES[1].label, to: HD_RIDES[1].href }} />
      <section className="border-t border-border/25 bg-atlas-hero">
        <div className="container py-10 md:py-14">
          <div className={`mb-2 font-mono text-[8px] uppercase tracking-[0.3em] ${lm ? "text-amber-700/80" : "text-amber-400/55"}`}>
            SYS // OBS-HG · Ride 01
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Hollow Genius</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground/70">
            Familiar faces are usually convex. Shading from above, a weak perspective, and a fixed viewpoint can agree with that prior even when the shell recedes. Concave mode mirrors the relief through its depth plane — the vertices move. It is not a normal flip on the convex mesh. Tesla is the same instrument with a second subject, loaded only when chosen.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground/70">
            The left pane, on a wide screen, states the geometric depth sign and draws normals. The right pane is the appearance. Report what you see. This ride does not compute your perception. Orbit is independent in each pane; the fixed camera is the matched comparison. Motion of the turntable is object yaw, which supplies motion parallax without moving the viewpoint.
          </p>
          <div className="spectral-bar my-8" aria-hidden />
          <HollowGenius />
          <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted-foreground/55">
            Binocular view is a red-cyan anaglyph from two parallel cameras on the appearance pane. It is not your eyes, and without glasses it only doubles. Orthographic projection removes the perspective cue that often gives a hollow mask away.
          </p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
