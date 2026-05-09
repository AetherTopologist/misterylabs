import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Calendar, ExternalLink, Github, Plus, Save, Trash2, X, ShieldCheck, Search,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CategoryBadge, ConfidenceBadge, PriorityBadge, StatusBadge } from "@/components/Badges";
import { EvidenceGallery } from "@/components/EvidenceGallery";
import { GithubScanDialog } from "@/components/GithubScanDialog";
import { projectStore, useProject } from "@/lib/store";
import {
  CATEGORIES, CONFIDENCE, PRIORITIES, STATUSES,
  type Category, type Confidence, type EvidenceLink, type Priority, type Project, type Status,
} from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = useProject(id);

  const [draft, setDraft] = useState<Project | null>(project ?? null);

  useEffect(() => {
    if (project) setDraft(project);
  }, [project?.id]); // reset when navigating between projects

  const dirty = useMemo(
    () => (draft && project ? JSON.stringify(draft) !== JSON.stringify(project) : false),
    [draft, project],
  );

  if (!project || !draft) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-semibold">Project not found</h2>
          <p className="mt-2 text-muted-foreground">It may have been deleted.</p>
          <Button asChild className="mt-6"><Link to="/">Back to dashboard</Link></Button>
        </div>
      </div>
    );
  }

  function patch<K extends keyof Project>(key: K, value: Project[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  function handleSave() {
    if (!draft) return;
    if (!draft.title.trim()) { toast.error("Title is required."); return; }
    const { id: pid, created_at, updated_at, ...rest } = draft;
    projectStore.update(pid, rest);
    toast.success("Saved.");
  }

  function handleDelete() {
    projectStore.remove(project.id);
    toast.success("Project removed.");
    navigate("/");
  }

  function addEvidence() {
    const link: EvidenceLink = { id: `ev_${Math.random().toString(36).slice(2, 8)}`, label: "", url: "" };
    patch("evidence_links", [...draft.evidence_links, link]);
  }
  function updateEvidence(idx: number, partial: Partial<EvidenceLink>) {
    patch("evidence_links", draft.evidence_links.map((e, i) => (i === idx ? { ...e, ...partial } : e)));
  }
  function removeEvidence(idx: number) {
    patch("evidence_links", draft.evidence_links.filter((_, i) => i !== idx));
  }

  const tagsString = draft.tags.join(", ");

  return (
    <div className="min-h-screen pb-32">
      <AppHeader />

      {/* Sticky action bar */}
      <div className="sticky top-16 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
          </Button>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:inline">
              {dirty ? "Unsaved changes" : "All changes saved"}
            </span>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes “{project.title}” from the lab log. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={!dirty}
              className="gap-1.5 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-glow disabled:bg-secondary disabled:bg-none disabled:text-muted-foreground disabled:shadow-none"
            >
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        </div>
      </div>

      <div className="container grid gap-8 py-8 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* Title + summary */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge value={draft.category} />
              <StatusBadge value={draft.status} />
              <PriorityBadge value={draft.priority} />
              <ConfidenceBadge value={draft.confidence_level} />
            </div>
            <Input
              value={draft.title}
              onChange={(e) => patch("title", e.target.value)}
              className="h-auto border-0 bg-transparent px-0 text-3xl font-bold tracking-tight focus-visible:ring-0 md:text-4xl"
              placeholder="Project title"
            />
            <Textarea
              value={draft.short_summary}
              onChange={(e) => patch("short_summary", e.target.value)}
              placeholder="One-line summary…"
              rows={2}
              className="resize-none border-0 bg-transparent px-0 text-base text-muted-foreground focus-visible:ring-0"
            />
          </div>

          <Section title="Description">
            <Textarea
              value={draft.full_description}
              onChange={(e) => patch("full_description", e.target.value)}
              placeholder="What is this project? Goals, scope, current thinking…"
              rows={6}
            />
          </Section>

          <Section title="Next action" hint="What's the next concrete move after this work session?">
            <Textarea
              value={draft.next_action}
              onChange={(e) => patch("next_action", e.target.value)}
              placeholder="e.g. Wire up GI accumulation pass and benchmark Sponza."
              rows={2}
            />
          </Section>

          <Section title="Notes" hint="Decisions, dead-ends, ideas, references.">
            <Textarea
              value={draft.notes}
              onChange={(e) => patch("notes", e.target.value)}
              placeholder="Lab notebook entries…"
              rows={6}
            />
          </Section>

          <Section
            title="Evidence links"
            hint="Datasets, design docs, screenshots, reports — anything that proves progress."
            action={
              <Button size="sm" variant="secondary" className="gap-1.5" onClick={addEvidence}>
                <Plus className="h-4 w-4" /> Add link
              </Button>
            }
          >
            <div className="space-y-2">
              {draft.evidence_links.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No evidence yet. Drop a link, screenshot URL, or doc reference.
                </div>
              )}
              {draft.evidence_links.map((link, idx) => (
                <div key={link.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
                  <Input
                    value={link.label}
                    onChange={(e) => updateEvidence(idx, { label: e.target.value })}
                    placeholder="Label (e.g. Run #14 dataset)"
                    className="sm:max-w-[40%]"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => updateEvidence(idx, { url: e.target.value })}
                    placeholder="https://…"
                    className="font-mono text-xs"
                  />
                  <div className="flex items-center gap-1">
                    {link.url && (
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <a href={link.url} target="_blank" rel="noreferrer noopener"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeEvidence(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Tags" hint="Comma-separated.">
            <Input
              value={tagsString}
              onChange={(e) =>
                patch("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))
              }
              placeholder="e.g. wgpu, rendering, alpha"
            />
            {draft.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {draft.tags.map((t) => (
                  <span key={t} className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs text-secondary-foreground">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-36 lg:self-start">
          <SidePanel title="Status">
            <Select value={draft.status} onValueChange={(v) => patch("status", v as Status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </SidePanel>

          <SidePanel title="Category">
            <Select value={draft.category} onValueChange={(v) => patch("category", v as Category)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </SidePanel>

          <SidePanel title="Priority">
            <Select value={draft.priority} onValueChange={(v) => patch("priority", v as Priority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </SidePanel>

          <SidePanel title="Confidence">
            <Select value={draft.confidence_level} onValueChange={(v) => patch("confidence_level", v as Confidence)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONFIDENCE.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </SidePanel>

          <SidePanel
            title="Progress"
            right={<span className="font-mono text-sm tabular-nums text-foreground">{draft.progress_percent}%</span>}
          >
            <Slider
              value={[draft.progress_percent]}
              onValueChange={(v) => patch("progress_percent", Math.round(v[0]))}
              max={100}
              step={1}
              className="py-1"
            />
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all"
                style={{ width: `${draft.progress_percent}%` }}
              />
            </div>
          </SidePanel>

          <SidePanel title="Milestone date">
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={draft.milestone_date}
                onChange={(e) => patch("milestone_date", e.target.value)}
                className="pl-9 font-mono"
              />
            </div>
          </SidePanel>

          <SidePanel title="GitHub repo">
            <div className="flex items-center gap-2">
              <Input
                value={draft.github_repo_url}
                onChange={(e) => patch("github_repo_url", e.target.value)}
                placeholder="https://github.com/…"
                className="font-mono text-xs"
              />
              {draft.github_repo_url && (
                <Button asChild variant="secondary" size="icon">
                  <a href={draft.github_repo_url} target="_blank" rel="noreferrer noopener"><Github className="h-4 w-4" /></a>
                </Button>
              )}
            </div>
          </SidePanel>

          <div className="rounded-2xl border border-border bg-card p-4 font-mono text-[11px] text-muted-foreground">
            <div className="flex justify-between"><span>Created</span><span>{formatDateTime(project.created_at)}</span></div>
            <div className="mt-1 flex justify-between"><span>Updated</span><span>{formatDateTime(project.updated_at)}</span></div>
            <div className="mt-1 flex justify-between"><span>ID</span><span className="truncate">{project.id}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
};

function Section({
  title, hint, action, children,
}: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card-gradient p-5 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{title}</Label>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SidePanel({
  title, right, children,
}: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{title}</Label>
        {right}
      </div>
      {children}
    </div>
  );
}

export default ProjectDetail;
