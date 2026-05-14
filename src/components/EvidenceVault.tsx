import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Github,
  ShieldCheck,
  Cpu,
  ExternalLink,
  Plus,
  Loader2,
  Link as LinkIcon,
  Archive,
  Search,
  Star,
  X,
  Images,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  fetchGithubRepoMeta,
  parseGithubRepo,
  type GithubRepoMeta,
} from "@/lib/evidence";
import { projectStore, useValidatedProjects } from "@/lib/store";
import type { Project } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { toast } from "sonner";
import { GithubScanDialog } from "./GithubScanDialog";
import { GithubImageScanDialog } from "./GithubImageScanDialog";
import { EvidenceGallery } from "./EvidenceGallery";

/**
 * The Evidence Vault is a *filtered view* over the unified Project (Research
 * Object) store — it shows projects flagged `is_validated`. The same
 * underlying objects power Mission Control's active-work view.
 */
export function EvidenceVault() {
  const items = useValidatedProjects();
  const featured = items[0];
  const rest = items.slice(1);

  return (
    <section className="animate-fade-in space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-spectral-cool" />
            xPRIME Archive
            <span className="text-border">/</span>
            <span className="text-foreground/80">Evidence Vault</span>
            <span className="text-border">·</span>
            <span>Validated artefacts &amp; milestone history</span>
          </div>
          <p className="max-w-xl text-xs text-muted-foreground">
            Scientific record of validated Research Objects. Same source-of-truth as Mission
            Control — promoted here once they ship measurable evidence.
          </p>
        </div>
        <AddEvidenceDialog />
      </div>

      {!featured && (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-6 text-center text-xs text-muted-foreground">
          No validated projects yet. Open a project in Mission Control and toggle
          <span className="mx-1 font-mono uppercase tracking-wider text-foreground">Validated</span>
          to surface it here.
        </div>
      )}

      {featured && <FeaturedEvidenceCard item={featured} index={items.length} />}

      {rest.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {rest.map((it) => (
            <CompactEvidenceCard key={it.id} item={it} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- Featured card ---------------- */

function FeaturedEvidenceCard({ item }: { item: Project }) {
  const validatedAt = item.validated_at ?? item.updated_at;
  return (
    <article className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/5 shadow-[var(--shadow-card)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="relative grid gap-4 p-4 lg:grid-cols-[1.6fr_1fr] lg:p-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-primary-glow ring-1 ring-inset ring-primary/40">
              <ShieldCheck className="h-3 w-3" />
              Evidence
            </span>
            <span className="inline-flex items-center rounded-md bg-success/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-success ring-1 ring-inset ring-success/30">
              {item.status}
            </span>
            {item.technical_category && (
              <span className="inline-flex items-center rounded-md bg-secondary/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-secondary-foreground ring-1 ring-inset ring-border">
                {item.technical_category}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold tracking-tight md:text-xl">{item.title}</h3>
            <p className="text-sm text-muted-foreground">
              {item.short_summary || item.validation_claim}
            </p>
          </div>

          {(item.narrative || item.full_description) && (
            <p className="rounded-md border border-border/60 bg-card/60 p-3 text-xs leading-relaxed text-foreground/90">
              {item.narrative || item.full_description}
            </p>
          )}

          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <MetaRow icon={Cpu} label="Hardware" value={item.hardware_note} />
            <MetaRow
              icon={ShieldCheck}
              label="Validation claim"
              value={item.validation_claim}
            />
            <MetaRow icon={LinkIcon} label="Next relevance" value={item.next_relevance} full />
          </dl>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((t) => (
                <span
                  key={t}
                  className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground ring-1 ring-inset ring-border"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          <EvidenceGallery project={item} />
        </div>

        <div className="space-y-2">
          <GithubPanel item={item} />

          {item.evidence_links.length > 0 && (
            <LinkList title="Evidence links" links={item.evidence_links} />
          )}
          {(item.artifact_links?.length ?? 0) > 0 && (
            <LinkList title="Artifacts / screenshots" links={item.artifact_links!} />
          )}

          <div className="rounded-md border border-border/60 bg-card/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Validated {timeAgo(validatedAt)}
          </div>
        </div>
      </div>
    </article>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
  full,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  full?: boolean;
}) {
  if (!value) return null;
  return (
    <div
      className={
        "rounded-md border border-border/60 bg-card/40 p-2 " + (full ? "sm:col-span-2" : "")
      }
    >
      <dt className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </dt>
      <dd className="mt-0.5 text-xs leading-relaxed text-foreground/90">{value}</dd>
    </div>
  );
}

function LinkList({
  title,
  links,
}: {
  title: string;
  links: { id: string; label: string; url: string }[];
}) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-2">
      <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </div>
      <ul className="space-y-0.5">
        {links.map((l) => (
          <li key={l.id}>
            <a
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-glow hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Github metadata panel ---------------- */

function GithubPanel({ item }: { item: Project }) {
  const [url, setUrl] = useState(item.github_repo_url);
  const [meta, setMeta] = useState<GithubRepoMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [imageScanOpen, setImageScanOpen] = useState(false);

  const { user } = useAuth();
  const snapshot = item.github_snapshot;

  useEffect(() => {
    setUrl(item.github_repo_url);
  }, [item.github_repo_url]);

  useEffect(() => {
    let cancelled = false;
    if (!item.github_repo_url || snapshot) {
      setMeta(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchGithubRepoMeta(item.github_repo_url)
      .then((m) => {
        if (cancelled) return;
        if (!m) setError("Could not load repo metadata");
        setMeta(m);
      })
      .catch(() => !cancelled && setError("Network error"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [item.github_repo_url, snapshot]);

  const save = () => {
    const trimmed = url.trim();
    if (trimmed && !parseGithubRepo(trimmed)) {
      toast.error("That doesn't look like a github.com repo URL");
      return;
    }
    projectStore.upsertGithubUrl(item.id, trimmed);
    toast.success(trimmed ? "Repo linked" : "Repo cleared");
  };

  return (
    <div className="rounded-md border border-border/60 bg-card/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <Github className="h-3 w-3" />
          GitHub repository
        </div>
        <div className="flex items-center gap-1">
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          {user ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 gap-1 px-1.5 text-[10px] font-mono uppercase tracking-wider text-primary-glow hover:bg-primary/10"
              onClick={() => setScanOpen(true)}
            >
              <Search className="h-3 w-3" />
              Scan
            </Button>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1 px-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
            >
              <Lock className="h-2.5 w-2.5" />
              Sign in to scan GitHub
            </Link>
          )}
        </div>
      </div>

      {snapshot ? (
        <div className="space-y-2">
          <a
            href={snapshot.html_url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-md border border-primary/30 bg-primary/5 p-2 transition-colors hover:bg-primary/10"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-xs text-foreground">
                {snapshot.full_name}
              </span>
              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
            </div>
            {snapshot.description && (
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                {snapshot.description}
              </p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {snapshot.language && <span>{snapshot.language}</span>}
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5" />
                {snapshot.stargazers_count}
              </span>
              <span>updated {timeAgo(snapshot.pushed_at)}</span>
            </div>
            {snapshot.topics.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {snapshot.topics.slice(0, 6).map((t) => (
                  <span
                    key={t}
                    className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground ring-1 ring-inset ring-border"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </a>

          {snapshot.readme_summary && (
            <div className="rounded-md border border-border/60 bg-card/40 p-2">
              <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                README summary
              </div>
              <p className="line-clamp-4 text-[11px] leading-relaxed text-foreground/80">
                {snapshot.readme_summary}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            <span>imported {timeAgo(snapshot.imported_at)}</span>
            {user && (
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-1 text-primary-glow hover:underline"
                  onClick={() => setImageScanOpen(true)}
                >
                  <Images className="h-2.5 w-2.5" />
                  Scan Repo Images
                </button>
                <button
                  className="inline-flex items-center gap-0.5 hover:text-destructive"
                  onClick={() => {
                    projectStore.clearGithubSnapshot(item.id);
                    toast.success("Snapshot cleared");
                  }}
                >
                  <X className="h-2.5 w-2.5" />
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {user ? (
            <>
              <div className="flex gap-1.5">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="h-8 text-xs"
                />
                <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={save}>
                  Save
                </Button>
              </div>

              {error && !meta && (
                <div className="mt-2 text-[11px] text-destructive">
                  {error}. The repo may be private or rate-limited — use Scan to import via server.
                </div>
              )}

              {meta && (
                <a
                  href={meta.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block rounded-md border border-border/60 bg-secondary/30 p-2 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs text-foreground">{meta.full_name}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </div>
                  {meta.description && (
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                      {meta.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {meta.language && <span>{meta.language}</span>}
                    <span className="text-border">·</span>
                    <span>★ {meta.stargazers_count}</span>
                    <span className="text-border">·</span>
                    <span>updated {timeAgo(meta.pushed_at)}</span>
                  </div>
                </a>
              )}
            </>
          ) : (
            <Link
              to="/auth"
              className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 transition-colors hover:text-muted-foreground/70"
            >
              <Lock className="h-2.5 w-2.5" />
              Sign in to save changes
            </Link>
          )}
        </>
      )}

      <GithubScanDialog projectId={item.id} open={scanOpen} onOpenChange={setScanOpen} />

      {snapshot && (
        <GithubImageScanDialog
          projectId={item.id}
          repoFullName={snapshot.full_name}
          open={imageScanOpen}
          onOpenChange={setImageScanOpen}
        />
      )}
    </div>
  );
}

/* ---------------- Compact card (additional items) ---------------- */

function CompactEvidenceCard({ item }: { item: Project }) {
  return (
    <article className="rounded-xl border border-border/60 bg-card/60 p-3 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-primary-glow ring-1 ring-inset ring-primary/40">
          <Archive className="h-2.5 w-2.5" />
          Evidence
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-success">
          {item.status}
        </span>
      </div>
      <h4 className="mt-1.5 text-sm font-semibold leading-snug">{item.title}</h4>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {item.short_summary || item.validation_claim}
      </p>
      {item.github_repo_url && (
        <a
          href={item.github_repo_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] text-primary-glow hover:underline"
        >
          <Github className="h-3 w-3" />
          {parseGithubRepo(item.github_repo_url)?.owner}/
          {parseGithubRepo(item.github_repo_url)?.repo}
        </a>
      )}
    </article>
  );
}

/* ---------------- Add dialog ---------------- */

function AddEvidenceDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    narrative: "",
    technical_category: "",
    hardware_note: "",
    validation_claim: "",
    next_relevance: "",
    github_repo_url: "",
    tags: "",
  });

  const submit = () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (form.github_repo_url && !parseGithubRepo(form.github_repo_url)) {
      toast.error("GitHub URL must be a valid github.com repo");
      return;
    }
    projectStore.create({
      title: form.title.trim(),
      short_summary: form.summary.trim(),
      full_description: form.narrative.trim(),
      narrative: form.narrative.trim(),
      category: "Engineering",
      status: "Launched",
      priority: "Medium",
      progress_percent: 100,
      confidence_level: "High",
      technical_category: form.technical_category.trim(),
      hardware_note: form.hardware_note.trim(),
      validation_claim: form.validation_claim.trim(),
      next_relevance: form.next_relevance.trim(),
      github_repo_url: form.github_repo_url.trim(),
      is_validated: true,
      validated_at: new Date().toISOString(),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    toast.success("Added to Evidence Vault");
    setOpen(false);
    setForm({
      title: "",
      summary: "",
      narrative: "",
      technical_category: "",
      hardware_note: "",
      validation_claim: "",
      next_relevance: "",
      github_repo_url: "",
      tags: "",
    });
  };

  if (!user) {
    return (
      <Button size="sm" variant="ghost" asChild className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground/60 hover:text-muted-foreground">
        <Link to="/auth">
          <Lock className="h-3 w-3" />
          Sign in to add evidence
        </Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 px-2.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add evidence
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary-glow" />
            New validated Research Object
          </DialogTitle>
          <DialogDescription>
            Creates a project flagged as validated. Phrase claims as validated prototype evidence —
            not finished production work.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1">
          <Field label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. LuxCoreGRIN Curved Ray Tracing Prototype"
            />
          </Field>
          <Field label="One-line summary">
            <Input
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </Field>
          <Field label="Evidence narrative">
            <Textarea
              value={form.narrative}
              onChange={(e) => setForm({ ...form, narrative: e.target.value })}
              rows={4}
              placeholder="What was demonstrated and why it matters."
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Technical category">
              <Input
                value={form.technical_category}
                onChange={(e) => setForm({ ...form, technical_category: e.target.value })}
                placeholder="e.g. Rendering Engine / GRIN Optics"
              />
            </Field>
            <Field label="Hardware note">
              <Input
                value={form.hardware_note}
                onChange={(e) => setForm({ ...form, hardware_note: e.target.value })}
              />
            </Field>
            <Field label="Validation claim">
              <Input
                value={form.validation_claim}
                onChange={(e) => setForm({ ...form, validation_claim: e.target.value })}
              />
            </Field>
            <Field label="GitHub repo URL">
              <Input
                value={form.github_repo_url}
                onChange={(e) => setForm({ ...form, github_repo_url: e.target.value })}
                placeholder="https://github.com/owner/repo"
              />
            </Field>
          </div>
          <Field label="Next relevance">
            <Textarea
              value={form.next_relevance}
              onChange={(e) => setForm({ ...form, next_relevance: e.target.value })}
              rows={2}
            />
          </Field>
          <Field label="Tags (comma separated)">
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="grin, prototype, rendering"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit}>
            Add to Vault
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
