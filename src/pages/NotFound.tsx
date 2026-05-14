import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Orbit, ArrowLeft, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";

const ROUTES = [
  { to: "/", label: "Home" },
  { to: "/atlas", label: "Atlas" },
  { to: "/archive", label: "Archive" },
  { to: "/research", label: "Research" },
  { to: "/media", label: "Media" },
  { to: "/mission", label: "Mission" },
];

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404 — route not found:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent" aria-hidden />

      <main className="container flex flex-col items-center justify-center py-32 text-center">
        {/* Icon */}
        <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary-glow/10 ring-1 ring-border/50">
          <Radio className="h-7 w-7 text-muted-foreground/50" />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-background bg-muted-foreground/30" />
        </div>

        {/* Status */}
        <div className="mt-8 font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/40">
          Signal Lost · MYL-404
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Out of Range
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          The path{" "}
          <code className="rounded-sm bg-secondary/50 px-1.5 py-0.5 font-mono text-[11px] text-foreground/70">
            {location.pathname}
          </code>{" "}
          is not a known route in the observatory. The signal could not be resolved.
        </p>

        {/* Primary CTA */}
        <Button asChild className="mt-8">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Observatory
          </Link>
        </Button>

        {/* Route index */}
        <div className="mt-12 w-full max-w-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-[8px] uppercase tracking-[0.35em] text-muted-foreground/40">
              Known Routes
            </span>
            <div className="h-px flex-1 bg-border/35" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ROUTES.map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className="flex items-center gap-2 rounded-sm border border-border/35 bg-card/25 px-3 py-2 text-xs font-medium text-muted-foreground transition-base hover:border-primary/30 hover:bg-card/45 hover:text-foreground"
              >
                <Orbit className="h-3 w-3 shrink-0 text-primary-glow/50" />
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
