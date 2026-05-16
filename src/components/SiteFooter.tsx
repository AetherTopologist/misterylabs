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
        <div className="mt-3 flex items-center gap-3 border-t border-border/20 pt-3">
          <img
            src="/assets/xPRIMEray_Logo_Research_256.png"
            alt="xPRIMEray Observatory"
            aria-hidden
            className="h-5 w-auto opacity-[0.12]"
          />
          <span className="font-mono text-[7px] uppercase tracking-[0.3em] text-muted-foreground/25">
            Curved transport diagnostics powered by xPRIMEray Observatory
          </span>
        </div>
      </div>
    </footer>
  );
}
