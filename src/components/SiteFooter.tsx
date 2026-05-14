export function SiteFooter() {
  return (
    <footer className="border-t border-border/35">
      <div className="container py-5">
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-signal-pulse" />
            <span>MisterY Labs · MYL-OBS-001 · Nominal</span>
          </div>
          <span>Open research · Reproducible · Community-driven</span>
        </div>
      </div>
    </footer>
  );
}
