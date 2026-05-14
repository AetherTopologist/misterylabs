import { AppHeader } from "@/components/AppHeader";
import { EvidenceVault } from "@/components/EvidenceVault";
import { SiteFooter } from "@/components/SiteFooter";

export default function ArchivePage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent" aria-hidden />

      <section className="border-t border-border/35">
        <div className="container py-16">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
              SYS // 03
            </span>
            <div className="h-px w-12 bg-border/35" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary-glow/60">
              Milestone Archaeology
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Validation Archive
          </h1>
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/45">
            Predecessor research lineage · Evidence snapshots
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Validated repository snapshots, visual artifacts, and historical milestones that
            establish the research lineage feeding into the active xPRIMEray observatory.
          </p>

          <div className="mt-8">
            <EvidenceVault />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
