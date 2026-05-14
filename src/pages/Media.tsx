import { Github, Film, Camera, Clapperboard, Radio, GitBranch, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";

const PLANNED_ARTIFACTS = [
  {
    id: "render-gallery",
    title: "Render Gallery",
    desc: "Curated visual outputs from curved-transport probes — convergence frames, caustic maps, and transport seam imagery.",
    icon: Camera,
    status: "Planned",
  },
  {
    id: "video-probes",
    title: "Video Probes",
    desc: "Animated field traversal sequences showing light path behavior through gradient media in real time.",
    icon: Clapperboard,
    status: "Planned",
  },
  {
    id: "open-signal",
    title: "Open Signal Feed",
    desc: "Live research updates, field notes, and experiment results from the active xPRIMEray observatory.",
    icon: Radio,
    status: "Planned",
  },
  {
    id: "acth-research",
    title: "ACT Research",
    desc: "Applied Curved Transport research artifacts — annotated datasets, diagnostic screenshots, and methodology documentation.",
    icon: Film,
    status: "Planned",
  },
];

export default function MediaPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent" aria-hidden />

      <section className="border-t border-border/35">
        <div className="container py-14">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
              SYS // 05
            </span>
            <div className="h-px w-12 bg-border/35" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary-glow/60">
              Visual Experiments
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Media Lab</h1>
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/45">
            Visual experiments · ACT research · Open signal
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            An open observatory for rendering researchers, visual artists, and curious engineers.
            Renders, probes, field notes, and code — the full visual record of the curved transport
            investigation.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <a href="https://github.com/AetherTopologist/GD_xPRIMEray" target="_blank" rel="noreferrer">
                <Github className="mr-2 h-4 w-4" />
                Join on GitHub
                <ExternalLink className="ml-2 h-3 w-3 opacity-60" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/mission">
                <GitBranch className="mr-2 h-4 w-4" />
                Mission Control
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Planned artifacts */}
      <section className="border-t border-border/35">
        <div className="container py-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
              Incoming
            </span>
            <div className="h-px flex-1 bg-border/35" />
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">Planned Artifacts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Content being prepared for publication as the observatory's research output matures.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {PLANNED_ARTIFACTS.map((item) => (
              <div
                key={item.id}
                className="diagnostic-frame flex items-start gap-4 rounded-sm border border-border/30 bg-card/20 p-5 opacity-70"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-secondary/50">
                  <item.icon className="h-4 w-4 text-muted-foreground/60" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground/70">{item.title}</span>
                    <span className="rounded-sm border border-border/40 bg-secondary/30 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
